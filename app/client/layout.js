import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export default async function ClientLayout({ children }) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  return children;
}
