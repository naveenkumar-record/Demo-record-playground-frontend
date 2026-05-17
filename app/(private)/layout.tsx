import { redirect } from "next/navigation";
import { hasValidServerSession } from "@/lib/server-session";

export default async function PrivateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const hasSession = await hasValidServerSession();
  if (!hasSession) {
    redirect("/login");
  }
  return <>{children}</>;
}
