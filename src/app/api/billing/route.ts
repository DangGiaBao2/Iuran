import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import {
  getPendingChargesForMerchant,
  runBillingCycle,
} from '@/server/service/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const merchantId = req.nextUrl.searchParams.get('merchantId') ?? '';
    const data = await getPendingChargesForMerchant(merchantId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { merchantId } = await req.json();
    const data = await runBillingCycle(merchantId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
