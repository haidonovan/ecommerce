import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";

export async function AdminAreaPage({ children }) {
  const user = await getCurrentUser({ suppressDatabaseErrors: true });

  if (!user) {
    redirect("/?auth=admin");
  }

  if (user.role !== "ADMIN") {
    redirect("/client");
  }

  return children;
}
