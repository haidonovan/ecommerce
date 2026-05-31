import Link from "next/link";

export const metadata = {
  title: "E-Commerce",
};

export default function EcommerceEntryPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <section className="app-card w-full max-w-[34rem] p-6">
        <p className="app-top-label">E-Commerce</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--foreground)]">Customer storefront</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">
          This online-only entry points customers to the existing storefront while the shared
          route-group foundation is being migrated.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/client" className="rounded-xl bg-[var(--action)] px-4 py-3 text-sm font-semibold text-[var(--action-foreground)]">
            Open Store
          </Link>
          <Link href="/pos" className="app-link-button">
            Open POS
          </Link>
        </div>
      </section>
    </main>
  );
}
