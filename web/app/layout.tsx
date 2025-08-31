import "./globals.css";
import "./home.css";
import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
// (keep your client import if other files need it, but the provider here won't use it)
// import { client } from "../src/lib/client";

export const metadata: Metadata = {
  title: "Token-gated Dashboards",
  description: "Stakeholder dashboards gated by ERC-1155 on Sepolia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* No props — matches the types in the lib Netlify is installing */}
        <ThirdwebProvider>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
