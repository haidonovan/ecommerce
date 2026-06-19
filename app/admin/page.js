import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminIndexPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  return <AdminShell user={user} />;
}
