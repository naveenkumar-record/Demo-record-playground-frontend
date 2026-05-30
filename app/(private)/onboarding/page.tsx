import {
  OnboardingCard,
  OnboardingShell,
  OnboardingStep,
  OnboardingTitle,
  getEmailIdentity,
} from "@/components/onboarding/onboardingUi";
import OnboardingStepTwoForm from "@/components/onboarding/onboardingStepTwoForm";
import { getServerSessionUser } from "@/lib/server-session";

type OnboardingPageProps = {
  searchParams: Promise<{ email?: string }>;
};

export default async function Page({ searchParams }: OnboardingPageProps) {
  const { email: rawEmail } = await searchParams;
  const sessionUser = await getServerSessionUser();
  const { email } = getEmailIdentity(sessionUser?.email ?? rawEmail);

  return (
    <OnboardingShell email={email}>
      <OnboardingCard>
        <OnboardingStep step={2} />
        <OnboardingTitle
          title="Welcome to Record Studio"
          singleLine
          subtitle={
            <>
              Create an organization to generate{" "}
              <br className="hidden sm:block" />
              API keys and start Verifying.
            </>
          }
        />
        <OnboardingStepTwoForm email={email} />
      </OnboardingCard>
    </OnboardingShell>
  );
}
