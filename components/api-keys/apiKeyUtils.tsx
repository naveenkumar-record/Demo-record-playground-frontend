"use client";

import { useState } from "react";
import { CopyIcon } from "lucide-react";

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function maskKey(key: string) {
  if (key.length <= 12) return key;
  return `${key.slice(0, 10)}${"•".repeat(8)}${key.slice(-4)}`;
}

export function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={copy}
      className="ml-1 cursor-pointer shrink-0 text-[#9a9a9a] transition-colors hover:text-[#1a1a1a]"
      title={copied ? "Copied!" : "Copy"}
    >
      <CopyIcon className="h-3.5 w-3.5" />
    </button>
  );
}

export function ModeBadge({ mode }: { mode: "test" | "live" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
        mode === "live"
          ? "bg-[#e6f9f0] text-[#1a8a57]"
          : "bg-[#f0f0f0] text-[#6a6a6a]"
      }`}
    >
      {mode === "live" ? "Live" : "Test"}
    </span>
  );
}
