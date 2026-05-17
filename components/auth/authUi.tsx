import Image from "next/image";
import Link from "next/link";
import {
  ButtonHTMLAttributes,
  FormHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type AuthShellProps = {
  children: ReactNode;
  variant?: "default" | "signup";
};

type AuthCardProps = {
  title: string;
  subtitle?: string;
  showIcon?: boolean;
  showBrandLogo?: boolean;
  variant?: "default" | "signup";
  children: ReactNode;
};

type AuthInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "id" | "name"
> & {
  name: string;
  label: string;
};

export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white px-4 pb-5 pt-4 sm:px-5 sm:pb-7 sm:pt-[18px]">
      <Link href="/login" className="inline-flex cursor-pointer items-center gap-[9px] text-[11px] leading-none font-medium text-[#303030] sm:text-[12px]">
        <Image src="/logo.png" alt="Record Platform" width={24} height={24} />
        <span className="text-[14px] sm:text-[16px]">Record Platform</span>
      </Link>

      <div className="grid flex-1 place-items-center px-0 py-4 pb-2 sm:py-[18px]">
        {children}
      </div>

      <p className="m-0 text-center text-[9px] text-[#c5c5c5] sm:text-[10px]">
        Privacy Policy | <a href="#" className="cursor-pointer hover:underline">Terms &amp; Conditions</a>
      </p>
    </div>
  );
}

export function AuthCard({
  title,
  subtitle,
  showIcon = false,
  showBrandLogo = false,
  children,
}: AuthCardProps) {
  return (
    <section className="w-full max-w-[380px] px-0.5 text-center sm:px-0">
      {showBrandLogo ? (
        <div className="mb-3 grid place-items-center sm:mb-[14px]">
          <Image src="/logo.png" alt="Record Platform" width={44} height={44} />
        </div>
      ) : null}

      {showIcon ? (
        <div
          className="mx-auto mb-5 h-8 w-8 rotate-45 rounded-[6px] bg-gradient-to-br from-[#ff9b62] to-[#ff5a1f]"
          aria-hidden
        />
      ) : null}

      <h1 className="app-text-heading m-0 !text-[22px] font-bold tracking-[-0.01em] text-[#141414]">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-3 whitespace-pre-line !text-[14px] leading-[1.4] text-[#6f6f6f] sm:mt-4 sm:text-[16px]">{subtitle}</p>
      ) : null}
      {children}
    </section>
  );
}

export function AuthInput({ name, label, ...props }: AuthInputProps) {
  return (
    <div className="text-left">
      <Label htmlFor={name} className="text-sm mb-2 block font-semibold text-black ">
        {label}
      </Label>
      <Input id={name} name={name} {...props} />
    </div>
  );
}

export function AuthForm({
  children,
  className,
  ...props
}: {
  children: ReactNode;
  className?: string;
} & FormHTMLAttributes<HTMLFormElement>) {
  return (
    <form
      className={cn("mt-4 grid gap-2.5 sm:mt-[18px] sm:gap-[9px]", className)}
      {...props}
    >
      {children}
    </form>
  );
}

type PrimaryAuthButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export function PrimaryAuthButton({
  children,
  type = "submit",
  className,
  ...props
}: PrimaryAuthButtonProps) {
  return (
    <Button
      type={type}
      className={cn(
        "app-text-button mt-[9px] h-10 w-full rounded-[9px]",
        className,
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

export function GoogleButton() {
  return (
   <a
  className="app-text-button inline-flex h-[32px] w-full cursor-pointer items-center justify-center gap-1 rounded-[9px] border border-[#e9e9e9] bg-white text-[#333333] hover:bg-[#fbfbfb]"
  href="#"
>
  <span className="inline-flex items-center justify-center" aria-hidden>
    <Image src="/google.svg" alt="" width={16} height={16} />
  </span>
  Continue with Google
</a>
  );
}

export function AuthOrDivider() {
  return (
    <div className="my-[9px] flex items-center gap-2.5 sm:gap-[14px]">
      <Separator className="flex-1 bg-[#ececec]" />
      <p className="m-0 text-[13px] leading-none text-[#a3a3a3] sm:text-[14px]">
        or
      </p>
      <Separator className="flex-1 bg-[#ececec]" />
    </div>
  );
}
