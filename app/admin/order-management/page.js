import { redirect } from "next/navigation";

export default function AdminOrderManagementPage() {
  redirect("/admin?tab=orders");
}
