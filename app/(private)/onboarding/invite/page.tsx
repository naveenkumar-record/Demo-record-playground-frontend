import {
  OnboardingCard,
  OnboardingShell,
  OnboardingStep,
  OnboardingTitle,
  getEmailIdentity,
} from "@/components/onboarding/onboardingUi";
import OnboardingStepThreeForm from "@/components/onboarding/onboardingStepThreeForm";
import { getServerSessionUser } from "@/lib/server-session";
import Image from "next/image";

type OnboardingInvitePageProps = {
  searchParams: Promise<{ email?: string; orgId?: string }>;
};

export default async function Page({
  searchParams,
}: OnboardingInvitePageProps) {
  const { email: rawEmail, orgId = "" } = await searchParams;
  const sessionUser = await getServerSessionUser();
  const { email } = getEmailIdentity(sessionUser?.email ?? rawEmail);

  return (
    <OnboardingShell email={email}>
      <OnboardingCard className="translate-y-1">
        <OnboardingStep step={3} />
        <div
          className="mx-auto mb-2.5 mt-3 grid h-[52px] w-[52px] place-items-center rounded-[12px]"
          aria-hidden
        >
          <Image
            src="/Team.svg"
            alt="Team"
            width={64}
            height={64}
            className="object-contain"
          />
        </div>

        <OnboardingTitle
          title="Invite your team"
          subtitle={
            <>
              Members can make standard API <br className="hidden sm:block" />
              requests and read organization data.
            </>
          }
        />
        <OnboardingStepThreeForm email={email} orgId={orgId} />
        <a
          className="mt-[10px] inline-block cursor-pointer text-[14px]"
          href="/bluecollar/dashboard"
        >
          I&apos;ll invite my team later
        </a>
      </OnboardingCard>
    </OnboardingShell>
  );
}
