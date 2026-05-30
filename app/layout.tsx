import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import AppToaster from "@/components/ui/app-toaster";
import GoogleProvider from "@/components/auth/googleProvider";

export const metadata: Metadata = {
  title: "Record Studio",
  description: "Record Studio authentication and dashboard",
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
    <html lang="en" className={GeistSans.variable}>
      <body className="antialiased font-sans">
        <GoogleProvider>
          {children}
          <AppToaster />
        </GoogleProvider>
      </body>
    </html>
  );
}