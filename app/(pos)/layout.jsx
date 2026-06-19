import { redirect } from "next/navigation";

import { PosLayoutShell } from "@/components/pos-layout-shell";
import { canAccessPOS, getCurrentUser, getDefaultRouteForRole } from "@/lib/auth";

export default async function PosLayout({ children }) {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/login");
  }

  if (!canAccessPOS(user.role)) {
    redirect(getDefaultRouteForRole(user.role));
  }

  return <PosLayoutShell>{children}</PosLayoutShell>;
}
