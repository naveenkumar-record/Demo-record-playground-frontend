import { getServerSessionUser } from "@/lib/server-session";
import { getUserOrganizations, OrgData } from "@/api/user-access.api";
import { OrgProvider } from "@/components/layout/orgContext";
import { ProjectBridge } from "@/components/layout/projectContext";
import { TestModeProvider } from "@/components/layout/testModeContext";
import AppShell from "@/components/layout/appShell";
import Header from "@/components/layout/header";
import { cookies } from "next/headers";

async function fetchOrganizations(): Promise<OrgData[]> {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("auth_token")?.value;
    if (!accessToken) return [];

    const orgsRes = await getUserOrganizations(accessToken);
    return orgsRes.data?.organizations ?? [];
  } catch {
    return [];
  }
}

export default async function WhitecollarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, organizations] = await Promise.all([
    getServerSessionUser(),
    fetchOrganizations(),
  ]);

  const email = user?.email ?? "";
  const userInitial = email.charAt(0).toUpperCase() || "U";

  return (
    <OrgProvider organizations={organizations}>
      <ProjectBridge>
        <TestModeProvider>
          <div className="h-screen overflow-hidden bg-[#f8f8f8]">
            <AppShell header={<Header userInitial={userInitial} email={email} />}>
              {children}
            </AppShell>
          </div>
        </TestModeProvider>
      </ProjectBridge>
    </OrgProvider>
  );
}
