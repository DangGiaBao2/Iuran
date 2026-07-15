import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { getSubscriptionsForMerchant } from '@/server/service/subscription.service';

export async function GET(req: NextRequest) {
  try {
    const merchantId = req.nextUrl.searchParams.get('merchantId') ?? '';
    const data = await getSubscriptionsForMerchant(merchantId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
