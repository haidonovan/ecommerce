import { redirect } from "next/navigation";

import { PublicAuthGate } from "@/components/public-auth-gate";
import { getCurrentUser } from "@/lib/auth";

export default async function Home() {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (user?.role === "ADMIN") {
    redirect("/admin");
  }

  if (user?.role === "CLIENT") {
    redirect("/client");
  }

  return <PublicAuthGate />;
}
