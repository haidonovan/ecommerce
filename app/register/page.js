import { redirect } from "next/navigation";

import { getCurrentUser, getDefaultRouteForRole } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (user?.role) {
    redirect(getDefaultRouteForRole(user.role));
  }

  redirect("/?auth=register");
}
