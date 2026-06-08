"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Copy,
  Eye,
  EyeOff,
  Key,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useOrg } from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  listApiKeys,
  createApiKey,
  deleteApiKey,
  type ApiKey,
  type ApiKeyCreated,
} from "@/api/api-keys.api";
import PaginationControl from "@/components/ui/pagination-control";

// ── Helpers ───────────────────────────────────────────────────────────────────
function getAccessToken() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_access_token") ?? "";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function copyText(text: string, label: string) {
  navigator.clipboard
    .writeText(text)
    .then(() => toast.message(`${label} copied`));
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <TableRow>
      {[160, 200, 60, 80, 40].map((w, i) => (
        <TableCell key={i} className="px-5 py-4">
          <div
            className="h-3.5 animate-pulse rounded bg-neutral-100"
            style={{ width: w }}
          />
        </TableCell>
      ))}
    </TableRow>
  );
}

// ── Masked key ────────────────────────────────────────────────────────────────
function MaskedKey({ value }: { value: string }) {
  const [show, setShow] = useState(false);
  const display = show ? value : `${value.slice(0, 8)}${"•".repeat(20)}`;
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[12px] text-[#3a3a3a]">{display}</span>
      <button
        type="button"
        className="text-neutral-400 hover:text-neutral-600"
        onClick={() => setShow((v) => !v)}
      >
        {show ? (
          <EyeOff className="h-3.5 w-3.5 cursor-pointer" />
        ) : (
          <Eye className="h-3.5 w-3.5 cursor-pointer" />
        )}
      </button>
      <button
        type="button"
        className="text-neutral-400 hover:text-neutral-600"
        onClick={() => copyText(value, "Key")}
      >
        <Copy className="h-3.5 w-3.5 cursor-pointer" />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function WorkflowsPage() {
  const { activeOrg } = useOrg();
  const { activeProject } = useProject();
  const { isTestMode } = useTestMode();
  const orgId = activeOrg?.orgId;
  const projectId = activeProject?.projectId ?? undefined;
  const mode = isTestMode ? "test" : "live";
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  // Reveal modal (shown once after creation)
  const [revealOpen, setRevealOpen] = useState(false);
  const [revealedKey, setRevealedKey] = useState<ApiKeyCreated | null>(null);
  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchKeys = useCallback(async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const res = await listApiKeys(
        orgId,
        getAccessToken(),
        projectId,
        undefined,
        mode as "test" | "live",
      );
      setKeys(res.data ?? []);
      setPage(1);
    } catch {
      toast.message("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }, [orgId, projectId, mode]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // ── Create ─────────────────────────────────────────────────────────────────
  const handleCreate = async () => {
    if (!orgId) return;
    if (!keyName.trim()) { toast.message("Key name is required"); return; }
    setSaving(true);
    try {
      const res = await createApiKey(
        orgId,
        {
          name: keyName.trim(),
          mode,
          projectId,
          emailNotificationsEnabled: emailEnabled,
        },
        getAccessToken(),
      );
      const created = res.data;
      if (created) {
        setKeys((prev) => [created, ...prev]);
        setRevealedKey(created);
        setCreateOpen(false);
        setKeyName("");
        setEmailEnabled(false);
        setRevealOpen(true);
      }
    } catch (err: unknown) {
      toast.message(
        err instanceof Error ? err.message : "Failed to create API key",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (keyId: string) => {
    if (!orgId) return;
    setKeys((prev) => prev.filter((k) => k.keyId !== keyId));
    try {
      await deleteApiKey(orgId, keyId, getAccessToken());
      toast.message("API key deleted Successfully");
    } catch {
      toast.message("Failed to delete API key");
      fetchKeys();
    }
  };

  const totalPages = Math.max(1, Math.ceil(keys.length / PAGE_SIZE));
  const pagedKeys = keys.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-8 p-6">
      {/* ── API Keys section ─────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[16px] font-semibold text-[#1f1f1f]">
              API Keys
            </h1>
          </div>
          <Button
            className="h-10 gap-2 bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
            onClick={() => {
              setKeyName("");
              setEmailEnabled(false);
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create API Key
          </Button>
        </div>

        <div className="overflow-hidden rounded-md border border-neutral-200 bg-white [&_th]:px-6 [&_th]:py-4 [&_td]:px-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="w-[380px]">API Key</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <SkeletonRow key={i} />)
              ) : keys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                        <Key className="h-5 w-5 text-neutral-400" />
                      </div>
                      <div className="text-center">
                        <p className="text-[13px] font-medium text-[#1f1f1f]">
                          No API keys yet
                        </p>
                        <p className="mt-1 text-[12px] text-[#9a9a9a]">
                          Create an API key to start integrating with the API.
                        </p>
                      </div>
                      <Button
                        className="mt-1 h-9 gap-2 bg-[#ff5723] px-4 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
                        onClick={() => {
                          setKeyName("");
                          setEmailEnabled(false);
                          setNotificationEmail("");
                          setCreateOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        Create API Key
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                pagedKeys.map((k) => (
                  <TableRow key={k.keyId}>
                    <TableCell>
                      <p className="text-[13px] font-semibold text-[#1f1f1f]">
                        {k.name}
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#aaa]">
                        {k.keyId}
                      </p>
                    </TableCell>
                    <TableCell className="w-[380px]">
                      <MaskedKey value={k.apiKey} />
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          k.mode === "live"
                            ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 text-[11px] font-medium"
                            : "bg-amber-50 text-amber-600 hover:bg-amber-50 text-[11px] font-medium"
                        }
                      >
                        {k.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[13px] text-[#6a6a6a]">
                      {formatDate(k.createdAt)}
                    </TableCell>
                    <TableCell className="pr-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4 text-[#697282]" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            className="text-sm text-black"
                            onClick={() => handleDelete(k.keyId)}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* ── Footer: count + pagination ───────────────────────────────────── */}
        {!loading && keys.length > 0 && (
          <div className="flex items-center justify-end  px-1 pt-1">
            
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        )}
      </div>

      {/* ── Create API Key modal ─────────────────────────────────────────── */}
      <Dialog
        open={createOpen}
        onOpenChange={(o) => {
          if (!saving) setCreateOpen(o);
        }}
      >
        <DialogContent className="max-w-[420px] p-0">
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-md font-semibold">
              Create API Key
            </DialogTitle>
            <p className="text-xs text-[#8a8a8a]">
              Enter a name for this key. The secret key will only be displayed
              once, so be sure to save it securely before proceeding.{" "}
            </p>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="space-y-2">
              <Label className="text-sm text-[#6a6a6a]">Key Name</Label>
              <Input
                value={keyName}
                placeholder="e.g. Production Integration"
                autoFocus
                onChange={(e) => setKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>

            {/* Email Notifications toggle */}
            <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3 py-3">
              <p className="text-[13px] font-semibold text-[#1a1a1a]">Email Notifications</p>
              <Switch
                checked={emailEnabled}
                onCheckedChange={setEmailEnabled}
                disabled={saving}
              />
            </div>

            <div className="flex items-center gap-2 rounded-md bg-neutral-50 px-3 py-2 text-sm text-[#6a6a6a]">
              <span className="font-medium">Mode:</span>
              <Badge
                className={
                  mode === "live"
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-50 text-sm"
                    : "bg-amber-50 text-amber-600 hover:bg-amber-50 text-sm"
                }
              >
                {mode}
              </Badge>
              <span className="text-sm text-[#9a9a9a]">
                (from your current mode toggle)
              </span>
            </div>
          </div>

          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button
              variant="outline"
              disabled={saving}
              onClick={() => setCreateOpen(false)}
            >
              Cancel
            </Button>
            <Button
              style={{ background: "#1a1a1a", color: "#fff" }}
              className="hover:opacity-90"
              disabled={saving || !keyName.trim()}
              onClick={handleCreate}
            >
              {saving ? "Creating…" : "Create Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Key reveal modal ────────────────────────────────────────────── */}
      <Dialog open={revealOpen} onOpenChange={setRevealOpen}>
        <DialogContent className="max-w-[480px] p-0">
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold">
              Your new API Key
            </DialogTitle>
            <p className="text-[12px] text-[#e05a00] font-medium">
              Your secret key is shown only once. Copy and store it securely
              before continuing.{" "}
            </p>
          </DialogHeader>

          {revealedKey && (
            <div className="space-y-4 px-5 py-2">
              <div className="space-y-1.5">
                <Label className="text-sm text-[#6a6a6a]">
                  API Key (public)
                </Label>
                <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
                  <code className="flex-1 break-all font-mono text-sm text-[#1f1f1f]">
                    {revealedKey.apiKey}
                  </code>
                  <button
                    type="button"
                    className="shrink-0 text-neutral-400 hover:text-neutral-600"
                    onClick={() => copyText(revealedKey.apiKey, "API key")}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Secret Key */}
              <div className="space-y-1.5">
                <Label className="text-sm text-[#6a6a6a]">
                  Secret Key (shown once)
                </Label>
                <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <code className="flex-1 break-all font-mono text-sm text-[#9f1239]">
                    {revealedKey.secretKey}
                  </code>
                  <button
                    type="button"
                    className="shrink-0 text-red-300 hover:text-red-500"
                    onClick={() =>
                      copyText(revealedKey.secretKey, "Secret key")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button
              style={{ background: "#1a1a1a", color: "#fff" }}
              className="hover:opacity-90"
              onClick={() => setRevealOpen(false)}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
