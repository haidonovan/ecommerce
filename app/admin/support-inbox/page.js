import { redirect } from "next/navigation";

export default function AdminSupportInboxPage() {
  redirect("/admin?tab=support");
}
