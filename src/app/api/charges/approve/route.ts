import type { NextRequest } from 'next/server';
import { fromError, ok } from '@/server/lib/http';
import { approveCharge } from '@/server/service/subscription.service';

export async function POST(req: NextRequest) {
  try {
    const { chargeId } = await req.json();
    const data = await approveCharge(chargeId);
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
