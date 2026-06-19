import { redirect } from "next/navigation";

import { ClientShell } from "@/components/client-shell";
import { canAccessClient, getCurrentUser, getDefaultRouteForRole } from "@/lib/auth";

export default async function ClientIndexPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/login");
  }

  if (!canAccessClient(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <ClientShell user={user} />;
}
