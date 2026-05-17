"use client";

import { useState } from "react";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createApiKey, type ApiKeyCreated } from "@/api/api-keys.api";
import { useOrg }     from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { getAccessToken } from "@/lib/auth-client";

type Props = {
  open: boolean;
  onClose: () => void;
  onCreated: (key: ApiKeyCreated) => void;
  /** Mode is determined by the sidebar Test Mode toggle — not chosen by the user */
  mode: "test" | "live";
};

export function CreateDialog({ open, onClose, onCreated, mode }: Props) {
  const { activeOrg }     = useOrg();
  const { activeProject } = useProject();
  const [name, setName]         = useState("");
  const [creating, setCreating] = useState(false);

  const reset = () => setName("");

  const handleClose = () => { reset(); onClose(); };

  const handleCreate = async () => {
    if (!name.trim()) { toast.message("Please enter a key name"); return; }
    if (!activeOrg)   return;

    const token = getAccessToken();
    if (!token) return;

    setCreating(true);
    try {
      const res = await createApiKey(
        activeOrg.orgId,
        { name: name.trim(), mode, projectId: activeProject?.projectId ?? "" },
        token,
      );
      if (!res.data) throw new Error("No data returned");
      reset();
      onCreated(res.data);
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-sm"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <PlusIcon className="h-4 w-4" />
            Create API Key
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Name */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-sm font-semibold text-[#1a1a1a]">
              Key Name <span className="text-red-500">*</span>
            </Label>
            <Input
              className="h-9 border-[#d4d4d4] text-sm focus-visible:ring-0 focus-visible:border-[#1a1a1a]"
              placeholder="e.g. Production Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              disabled={creating}
              autoFocus
            />
          </div>

          {/* Mode indicator — read-only, reflects sidebar toggle */}
          <p className="text-[12px] text-[#8a8a8a]">
            Mode:{" "}
            <span className={mode === "test" ? "font-medium text-amber-600" : "font-medium text-green-600"}>
              {mode === "test" ? "Test" : "Live"}
            </span>
            {" "}— toggle Test Mode in the sidebar to change.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={creating}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="bg-orange-600 text-white hover:bg-orange-700"
            onClick={handleCreate}
            disabled={creating || !name.trim()}
          >
            {creating ? "Creating…" : "Create Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
