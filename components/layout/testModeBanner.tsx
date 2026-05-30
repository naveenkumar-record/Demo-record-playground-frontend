"use client";

import { ArrowRightIcon, InfoIcon } from "lucide-react";
import { useTestMode } from "./testModeContext";

const TEST_MODE_PATHS = [
  "/bluecollar/dashboard",
  "/bluecollar/workflows",
  "/whitecollar/dashboard",
  "/whitecollar/workflows",
  "/whitecollar/assessments",
  "/whitecollar/requests",
  "/whitecollar/assign",
];

export default function TestModeBanner({ pathname }: { pathname: string }) {
  const { isTestMode, setIsTestMode } = useTestMode();

  const shouldShow =
    isTestMode && TEST_MODE_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (!shouldShow) return null;

  return (
    <div className="flex shrink-0 items-center justify-between gap-2 bg-[#FF5723] px-5 py-2">
      <div className="flex items-center gap-2">
        <InfoIcon className="h-3.5 w-3.5 shrink-0 text-white/80" />
        <p className="text-[13px] font-medium text-white">
          You are currently in test mode. No real verification is involved.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setIsTestMode(false)}
        className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium text-white transition-opacity hover:opacity-75"
      >
        Switch to Live Mode
        <ArrowRightIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
