import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import AppToaster from "@/components/ui/app-toaster";
import GoogleProvider from "@/components/auth/googleProvider";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "RecordStudio",
  description: "RecordStudio authentication and dashboard",
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
    <html lang="en" className={dmSans.variable}>
      <body className="antialiased font-sans">
        <GoogleProvider>
          {children}
          <AppToaster />
        </GoogleProvider>
      </body>
    </html>
  );
}