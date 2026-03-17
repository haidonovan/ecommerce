import { Space_Grotesk } from "next/font/google";

import "./globals.css";
import { AppStoreProvider } from "@/components/app-store-provider";
import { ThemeBlastOverlay } from "@/components/theme-blast-overlay";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

export const metadata = {
  title: "Grocery Store",
  description: "Grocery Store",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} theme-classic antialiased`}>
        <AppStoreProvider>
          {children}
          <ThemeBlastOverlay />
        </AppStoreProvider>
      </body>
    </html>
  );
}
