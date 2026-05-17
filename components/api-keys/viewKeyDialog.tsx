"use client";

import { useState } from "react";
import { KeyRoundIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { type ApiKey } from "@/api/api-keys.api";
import { ModeBadge } from "./apiKeyUtils";

type Props = {
  open: boolean;
  onClose: () => void;
  keyData: ApiKey | null;
};

export function ViewKeyDialog({ open, onClose, keyData }: Props) {
  const [copiedField, setCopiedField] = useState<"api" | "keyId" | null>(null);

  const copy = async (val: string, field: "api" | "keyId") => {
    await navigator.clipboard.writeText(val);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  };

  if (!keyData) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
        className="max-w-md"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <KeyRoundIcon className="h-4 w-4 text-[#1a1a1a]" />
            API Key Details
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-3 pt-1">
          {/* API Key */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-[#5a5a5a]">API Key</Label>
            <div className="flex items-start gap-2 rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3.5">
              <code className="flex-1 break-all font-mono text-sm leading-relaxed text-[#1a1a1a]">
                {keyData.apiKey}
              </code>
              <button
                onClick={() => copy(keyData.apiKey, "api")}
                className="mt-0.5 cursor-pointer shrink-0 rounded-md border border-[#e0e0e0] bg-white p-1.5 text-[#6a6a6a] transition-colors hover:text-[#1a1a1a]"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {copiedField === "api" && (
              <span className="text-xs text-[#1a8a57]">Copied!</span>
            )}
          </div>

          {/* Key ID */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm font-medium text-[#5a5a5a]">Key ID</Label>
            <div className="flex items-center gap-2 rounded-xl border border-[#e0e0e0] bg-[#f8f8f8] px-4 py-3.5">
              <code className="flex-1 font-mono text-sm text-[#1a1a1a]">
                {keyData.keyId}
              </code>
              <button
                onClick={() => copy(keyData.keyId, "keyId")}
                className="cursor-pointer shrink-0 rounded-md border border-[#e0e0e0] bg-white p-1.5 text-[#6a6a6a] transition-colors hover:text-[#1a1a1a]"
              >
                <CopyIcon className="h-4 w-4" />
              </button>
            </div>
            {copiedField === "keyId" && (
              <span className="text-xs text-[#1a8a57]">Copied!</span>
            )}
          </div>

          {/* Name + Mode */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="rounded-xl border border-[#e7e7e7] bg-[#f8f8f8] px-4 py-3">
              <p className="mb-1 text-xs text-[#9a9a9a]">Name</p>
              <p className="text-sm font-medium text-[#1a1a1a]">{keyData.name}</p>
            </div>
            <div className="rounded-xl border border-[#e7e7e7] bg-[#f8f8f8] px-4 py-3">
              <p className="mb-1.5 text-xs text-[#9a9a9a]">Mode</p>
              <ModeBadge mode={keyData.mode} />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-3">
          <Button
            className="h-10 rounded-xl bg-orange-600 px-8 text-sm font-medium text-white hover:bg-orange-700"
            onClick={onClose}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
