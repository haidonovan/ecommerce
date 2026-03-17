import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminIndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/?auth=admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/client");
  }

  return <AdminShell user={user} />;
}
