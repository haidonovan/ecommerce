import { redirect } from "next/navigation";

export default function AdminProductManagementPage() {
  redirect("/admin?tab=products");
}
