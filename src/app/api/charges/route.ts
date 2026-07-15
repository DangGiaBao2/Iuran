import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { getPendingChargesForSubscriber } from '@/server/service/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const subscriberAddress = req.nextUrl.searchParams.get('subscriberAddress') ?? '';
    const data = await getPendingChargesForSubscriber(subscriberAddress);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
