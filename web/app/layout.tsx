import "./globals.css";
import type { Metadata } from "next";
import { ThirdwebProvider } from "thirdweb/react";
import { client } from "../src/lib/client";

export const metadata: Metadata = {
  title: "Token-gated Dashboards",
  description: "Stakeholder dashboards gated by ERC-1155 on Sepolia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThirdwebProvider client={client}>
          {children}
        </ThirdwebProvider>
      </body>
    </html>
  );
}
