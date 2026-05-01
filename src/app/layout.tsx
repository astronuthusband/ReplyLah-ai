import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReplyLah — AI WhatsApp Reply Assistant",
  description:
    "Generate natural Malaysian-style WhatsApp replies for your business in seconds.",
  openGraph: {
    title: "ReplyLah — AI WhatsApp Reply Assistant",
    description:
      "Copy-paste AI replies yang bunyi macam real Malaysian business owner.",
    type: "website",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}


