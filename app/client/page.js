import { redirect } from "next/navigation";

import { ClientShell } from "@/components/client-shell";
import { getCurrentUser } from "@/lib/auth";

export default async function ClientIndexPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return <ClientShell user={user} />;
}
