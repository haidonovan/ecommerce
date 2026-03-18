import { ClientCheckoutPageView } from "@/components/client-pages";
import { getCurrentUser } from "@/lib/auth";

export default async function ClientCheckoutPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });
  return <ClientCheckoutPageView user={user} />;
}
