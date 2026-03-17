import { redirect } from "next/navigation";

export default function ClientFavoritesPage() {
  redirect("/client?tab=favorites");
}
