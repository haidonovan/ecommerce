"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

export function LogoutButton({ className = "", iconOnly = false }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.push("/");
    router.refresh();
  }

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={handleLogout}
        className={`app-icon-button p-2 ${className}`.trim()}
        aria-label="Logout"
        title="Logout"
      >
        <LogOut className="size-4" />
      </button>
    );
  }

  return <Button variant="secondary" className={className} onClick={handleLogout}>Logout</Button>;
}
