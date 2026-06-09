import Image from "next/image";
import Link from "next/link";
import { InputHTMLAttributes, ReactNode, ButtonHTMLAttributes } from "react";
import ProfileMenu from "@/components/layout/profileMenu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type OnboardingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function getEmailIdentity(rawEmail?: string) {
  const email = rawEmail?.trim().toLowerCase() ?? "";
  const letter = email.charAt(0).toUpperCase() || "U";
  return { email, letter };
}

export function OnboardingShell({ email, children }: { email?: string; children: ReactNode }) {
  const identity = getEmailIdentity(email);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <header className="flex h-[52px] items-center justify-between border-b border-[#e7e7e7] bg-white px-3 sm:px-[18px]">
        <Link href="/login" className="inline-flex cursor-pointer items-center gap-[7px] text-[11px] font-medium text-[#323232] sm:text-[12px]">
          <Image src="/logo.png" alt="Record Studio" width={29} height={29} />
          <span className="text-[14px] sm:text-[16px]">Record Studio</span>
        </Link>
        <ProfileMenu email={identity.email} letter={identity.letter} />
      </header>
      <main className="grid flex-1 place-items-center px-4 pb-6 pt-6 sm:pb-5 sm:pt-10">{children}</main>
      <footer className="px-0 pb-3 pt-[14px] text-center text-[9px] text-[#b7b7b7] sm:text-[10px]">Privacy Policy | Terms &amp; Conditions</footer>
    </div>
  );
}

export function OnboardingCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section className={cn("w-full max-w-[420px] -translate-y-[8px] px-0.5 text-center sm:-translate-y-[18px] sm:px-0", className)}>
      {children}
    </section>
  );
}

export function OnboardingStep({ step }: { step: 2 | 3 }) {
  return (
    <>
      <p className="mx-auto mb-[11px] w-fit rounded-full border border-[#e5e5e5] px-2.5 py-[3px] text-[10px] lowercase text-[#808080] sm:px-3 sm:text-[11px]">
        step {step} of 3
      </p>
      <div className="mx-auto mb-[18px] flex w-fit items-center gap-1" aria-hidden>
        {[1, 2, 3].map((index) => (
          <span
            key={index}
            className={cn(
              "h-1 w-7 rounded-full sm:h-[5px] sm:w-[37px]",
              index < step && "bg-[#ff5a1f]",
              index === step && "bg-[#ffb298]",
              index > step && "bg-[#e7e7e7]",
            )}
          />
        ))}
      </div>
    </>
  );
}

export function OnboardingTitle({
  title,
  subtitle,
  singleLine = false,
}: {
  title: string;
  subtitle: ReactNode;
  singleLine?: boolean;
}) {
  return (
    <>
      <h1
        className={cn(
          "text-center font-bold text-3xl",
          singleLine && "mx-auto w-fit -translate-x-2 sm:-translate-x-4 sm:whitespace-nowrap",
        )}
      >
        {title}
      </h1>
      <p className="mt-3 text-[12px] leading-[1.45] text-[#777777] sm:text-[13px]">{subtitle}</p>
    </>
  );
}

export function OnboardingField({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="text-left">
      <Label className="mb-1.5 block text-black font-semibold mt-2">{label}</Label>
      {children}
    </div>
  );
}

export function OnboardingInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <Input className="h-[36px] w-full rounded-[9px] border-[#e3e3e3] px-3 text-[12px]" {...props} />;
}

type OnboardingSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type OnboardingSelectProps = {
  id?: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: readonly OnboardingSelectOption[];
};

export function OnboardingSelect({
  id,
  name,
  placeholder = "Select",
  defaultValue,
  value,
  onValueChange,
  options,
}: OnboardingSelectProps) {
  return (
    <Select name={name} defaultValue={defaultValue} value={value || undefined} onValueChange={onValueChange}>
      <SelectTrigger id={id} className="h-[36px] w-full rounded-[9px] border-[#e3e3e3] px-3">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OnboardingButton({
  children,
  className,
  type = "submit",
  ...props
}: OnboardingButtonProps) {
  return (
    <Button
      type={type}
      className={cn("mt-3 cursor-pointer h-10 w-full rounded-md", className)}
      {...props}
    >
      {children}
    </Button>
  );
}
