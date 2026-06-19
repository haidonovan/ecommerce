import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export async function AdminAreaPage({ children }) {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "ADMIN") {
    redirect("/login");
  }

  return children;
}
