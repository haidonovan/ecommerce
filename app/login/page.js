import { redirect } from "next/navigation";

import { PublicAuthGate } from "@/components/public-auth-gate";
import { getCurrentUser, getDefaultRouteForRole } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (user?.role) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <PublicAuthGate initialAuthView="login" />;
}
