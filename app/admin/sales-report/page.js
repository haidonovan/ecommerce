import { redirect } from "next/navigation";

export default function AdminSalesReportPage() {
  redirect("/admin?tab=sales");
}
