import { fromError, ok } from '@/server/lib/http';
import { getAllMerchants } from '@/server/service/subscription.service';

export async function GET() {
  try {
    const data = await getAllMerchants();
    return ok(data);
  } catch (err) {
    return fromError(err);
  }
}
