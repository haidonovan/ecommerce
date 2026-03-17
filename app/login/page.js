import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (user?.role === "CLIENT") {
    redirect("/client");
  }

  redirect("/?auth=login");
}
