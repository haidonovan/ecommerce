import "./globals.css";
import { AppStoreProvider } from "@/components/app-store-provider";
import { PwaProvider } from "@/components/pwa-provider";
import { ThemeBlastOverlay } from "@/components/theme-blast-overlay";

export const metadata = {
  title: {
    default: "Grocery Store POS and E-Commerce",
    template: "%s | Grocery Store",
  },
  description: "Shared PWA for customer shopping, cashier POS, and store operations.",
  applicationName: "Grocery Store",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "Grocery Store",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#127c73",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="theme-classic antialiased">
        <AppStoreProvider>
          {children}
          <PwaProvider />
          <ThemeBlastOverlay />
        </AppStoreProvider>
      </body>
    </html>
  );
}
