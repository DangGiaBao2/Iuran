#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
};

const PLAN_BUMP_LEDGERS: u32 = 90 * 17_280;
const PLAN_LIFETIME_THRESHOLD: u32 = PLAN_BUMP_LEDGERS - 17_280;

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub enum SubscriptionStatus {
    Active,
    Cancelled,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Plan {
    pub merchant: Address,
    pub asset: Address,
    pub price: i128,
    pub period_ledgers: u32,
    pub active: bool,
}

#[derive(Clone, Debug, Eq, PartialEq)]
#[contracttype]
pub struct Subscription {
    pub subscriber: Address,
    pub plan_id: u64,
    pub next_charge_ledger: u32,
    pub charge_count: u32,
    pub last_charge_id: u64,
    pub status: SubscriptionStatus,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Plan(u64),
    Subscription(Address),
    Charge(Address, u64),
}

#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[contracterror]
#[repr(u32)]
pub enum Error {
    InvalidAmount = 1,
    InvalidPeriod = 2,
    PlanExists = 3,
    PlanNotFound = 4,
    PlanInactive = 5,
    SubscriptionExists = 6,
    SubscriptionNotFound = 7,
    InvalidStatus = 8,
    NotDue = 9,
    ChargeAlreadyProcessed = 10,
}

#[contract]
pub struct SubscriptionPolicy;

#[contractevent(data_format = "single-value")]
pub struct PlanCreated {
    pub plan_id: u64,
}

#[contractevent]
pub struct SubscriptionStarted {
    pub plan_id: u64,
    pub subscriber: Address,
}

#[contractevent]
pub struct SubscriptionCharged {
    pub plan_id: u64,
    pub subscriber: Address,
    pub charge_id: u64,
    pub amount: i128,
}

#[contractevent(data_format = "single-value")]
pub struct SubscriptionCancelled {
    pub subscriber: Address,
}

#[contractimpl]
impl SubscriptionPolicy {
    pub fn create_plan(
        e: Env,
        plan_id: u64,
        merchant: Address,
        asset: Address,
        price: i128,
        period_ledgers: u32,
    ) -> Result<(), Error> {
        if price <= 0 {
            return Err(Error::InvalidAmount);
        }
        if period_ledgers == 0 {
            return Err(Error::InvalidPeriod);
        }

        let key = DataKey::Plan(plan_id);
        if e.storage().persistent().has(&key) {
            return Err(Error::PlanExists);
        }

        merchant.require_auth();
        let plan = Plan {
            merchant,
            asset,
            price,
            period_ledgers,
            active: true,
        };
        e.storage().persistent().set(&key, &plan);
        e.storage()
            .persistent()
            .extend_ttl(&key, PLAN_LIFETIME_THRESHOLD, PLAN_BUMP_LEDGERS);
        PlanCreated { plan_id }.publish(&e);
        Ok(())
    }

    pub fn get_plan(e: Env, plan_id: u64) -> Result<Plan, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Plan(plan_id))
            .ok_or(Error::PlanNotFound)
    }

    pub fn subscribe(e: Env, plan_id: u64, subscriber: Address) -> Result<(), Error> {
        let plan = Self::read_plan(&e, plan_id)?;
        if !plan.active {
            return Err(Error::PlanInactive);
        }

        let key = DataKey::Subscription(subscriber.clone());
        if e.storage().persistent().has(&key) {
            return Err(Error::SubscriptionExists);
        }

        subscriber.require_auth();
        let subscription = Subscription {
            subscriber: subscriber.clone(),
            plan_id,
            next_charge_ledger: e.ledger().sequence(),
            charge_count: 0,
            last_charge_id: 0,
            status: SubscriptionStatus::Active,
        };
        e.storage().persistent().set(&key, &subscription);
        e.storage()
            .persistent()
            .extend_ttl(&key, PLAN_LIFETIME_THRESHOLD, PLAN_BUMP_LEDGERS);
        SubscriptionStarted {
            plan_id,
            subscriber,
        }
        .publish(&e);
        Ok(())
    }

    pub fn get_subscription(e: Env, subscriber: Address) -> Result<Subscription, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Subscription(subscriber))
            .ok_or(Error::SubscriptionNotFound)
    }

    pub fn charge(e: Env, subscriber: Address, charge_id: u64) -> Result<(), Error> {
        let subscription_key = DataKey::Subscription(subscriber.clone());
        let mut subscription: Subscription = e
            .storage()
            .persistent()
            .get(&subscription_key)
            .ok_or(Error::SubscriptionNotFound)?;
        if subscription.status != SubscriptionStatus::Active {
            return Err(Error::InvalidStatus);
        }

        let charge_key = DataKey::Charge(subscriber.clone(), charge_id);
        if e.storage().persistent().get(&charge_key).unwrap_or(false) {
            return Err(Error::ChargeAlreadyProcessed);
        }
        if e.ledger().sequence() < subscription.next_charge_ledger {
            return Err(Error::NotDue);
        }

        let plan = Self::read_plan(&e, subscription.plan_id)?;
        if !plan.active {
            return Err(Error::PlanInactive);
        }
        subscriber.require_auth();
        token::Client::new(&e, &plan.asset).transfer(&subscriber, &plan.merchant, &plan.price);

        subscription.next_charge_ledger = subscription
            .next_charge_ledger
            .checked_add(plan.period_ledgers)
            .ok_or(Error::InvalidPeriod)?;
        subscription.charge_count += 1;
        subscription.last_charge_id = charge_id;
        e.storage()
            .persistent()
            .set(&subscription_key, &subscription);
        e.storage().persistent().extend_ttl(
            &subscription_key,
            PLAN_LIFETIME_THRESHOLD,
            PLAN_BUMP_LEDGERS,
        );
        e.storage().persistent().set(&charge_key, &true);
        e.storage().persistent().extend_ttl(
            &charge_key,
            PLAN_LIFETIME_THRESHOLD,
            PLAN_BUMP_LEDGERS,
        );
        SubscriptionCharged {
            plan_id: subscription.plan_id,
            subscriber,
            charge_id,
            amount: plan.price,
        }
        .publish(&e);
        Ok(())
    }

    pub fn cancel(e: Env, subscriber: Address) -> Result<(), Error> {
        let key = DataKey::Subscription(subscriber.clone());
        let mut subscription: Subscription = e
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::SubscriptionNotFound)?;
        if subscription.status != SubscriptionStatus::Active {
            return Err(Error::InvalidStatus);
        }

        subscriber.require_auth();
        subscription.status = SubscriptionStatus::Cancelled;
        e.storage().persistent().set(&key, &subscription);
        e.storage()
            .persistent()
            .extend_ttl(&key, PLAN_LIFETIME_THRESHOLD, PLAN_BUMP_LEDGERS);
        SubscriptionCancelled { subscriber }.publish(&e);
        Ok(())
    }
}

impl SubscriptionPolicy {
    fn read_plan(e: &Env, plan_id: u64) -> Result<Plan, Error> {
        e.storage()
            .persistent()
            .get(&DataKey::Plan(plan_id))
            .ok_or(Error::PlanNotFound)
    }
}

#[cfg(test)]
mod test {
    extern crate std;

    use super::{Error, SubscriptionPolicy, SubscriptionPolicyClient, SubscriptionStatus};
    use soroban_sdk::{testutils::Address as _, token, Address, Env};

    struct Fixture<'a> {
        client: SubscriptionPolicyClient<'a>,
        merchant: Address,
        subscriber: Address,
        asset: Address,
    }

    fn setup<'a>(e: &'a Env) -> Fixture<'a> {
        let merchant = Address::generate(e);
        let subscriber = Address::generate(e);
        let asset_admin = Address::generate(e);
        let asset = e.register_stellar_asset_contract_v2(asset_admin).address();
        let contract_id = e.register(SubscriptionPolicy, ());
        let client = SubscriptionPolicyClient::new(e, &contract_id);

        e.mock_all_auths();
        client.create_plan(&1, &merchant, &asset, &20_i128, &100);
        client.subscribe(&1, &subscriber);

        Fixture {
            client,
            merchant,
            subscriber,
            asset,
        }
    }

    #[test]
    fn subscribe_charge_and_cancel_round_trip() {
        let e = Env::default();
        let fixture = setup(&e);
        let token_client = token::StellarAssetClient::new(&e, &fixture.asset);
        token_client.mint(&fixture.subscriber, &50_i128);

        fixture.client.charge(&fixture.subscriber, &11);
        assert_eq!(token_client.balance(&fixture.merchant), 20);
        assert_eq!(
            fixture
                .client
                .get_subscription(&fixture.subscriber)
                .charge_count,
            1
        );

        fixture.client.cancel(&fixture.subscriber);
        assert_eq!(
            fixture.client.get_subscription(&fixture.subscriber).status,
            SubscriptionStatus::Cancelled
        );
        assert_eq!(
            fixture
                .client
                .try_charge(&fixture.subscriber, &12)
                .unwrap_err()
                .unwrap(),
            Error::InvalidStatus
        );
    }

    #[test]
    fn charge_id_is_idempotent() {
        let e = Env::default();
        let fixture = setup(&e);
        let token_client = token::StellarAssetClient::new(&e, &fixture.asset);
        token_client.mint(&fixture.subscriber, &50_i128);

        fixture.client.charge(&fixture.subscriber, &21);
        assert_eq!(
            fixture
                .client
                .try_charge(&fixture.subscriber, &21)
                .unwrap_err()
                .unwrap(),
            Error::ChargeAlreadyProcessed
        );
        assert_eq!(token_client.balance(&fixture.merchant), 20);
    }
}
