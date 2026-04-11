import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "INHERIT Backoffice",
  description: "Extensions administration for the INHERIT open estate data standard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en-GB">
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
