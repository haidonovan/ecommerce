import { redirect } from "next/navigation";

import { canAccessClient, getCurrentUser, getDefaultRouteForRole } from "@/lib/auth";

export default async function ClientLayout({ children }) {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/");
  }

  if (!canAccessClient(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return children;
}
