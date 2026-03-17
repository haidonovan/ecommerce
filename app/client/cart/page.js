import { redirect } from "next/navigation";

export default function ClientCartPage() {
  redirect("/client?tab=cart");
}
