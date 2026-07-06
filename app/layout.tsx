import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
import AppToaster from "@/components/ui/app-toaster";
import GoogleProvider from "@/components/auth/googleProvider";

export const metadata: Metadata = {
  title: "Record Playground",
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
    <html lang="en" className={inter.variable}>
      <body className="antialiased font-sans">
        <GoogleProvider>
          {children}
          <AppToaster />
        </GoogleProvider>
      </body>
    </html>
  );
}