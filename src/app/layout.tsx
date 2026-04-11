import type { Metadata } from "next";
import { AuthListener } from "@/components/auth-listener";
import "./globals.css";

export const metadata: Metadata = {
  title: "INHERIT Backoffice",
  description: "Extensions administration for the INHERIT open estate data standard",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "32x32" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <AuthListener />
        {children}
      </body>
    </html>
  );
}
