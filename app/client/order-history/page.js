import { redirect } from "next/navigation";

export default function ClientOrderHistoryPage() {
  redirect("/client?tab=orders");
}
