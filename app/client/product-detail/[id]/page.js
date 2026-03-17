import { ClientProductDetailPageView } from "@/components/client-pages";
import { getCurrentUser } from "@/lib/auth";

export default async function ClientProductDetailPage({ params }) {
  const { id } = await params;
  const user = await getCurrentUser();

  return <ClientProductDetailPageView productId={id} user={user} />;
}
