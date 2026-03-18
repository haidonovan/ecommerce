import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function AdminLoginPage() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (user?.role === "CLIENT") {
    redirect("/client");
  }

  redirect("/?auth=admin");
}
