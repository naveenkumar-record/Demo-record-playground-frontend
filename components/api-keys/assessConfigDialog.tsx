"use client";

import { useState, useEffect } from "react";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { updateAssessConfig, type ApiKey, type AssessConfig, type QuestionRowConfig } from "@/api/api-keys.api";
import { useOrg } from "@/components/layout/orgContext";
import { getAccessToken } from "@/lib/auth-client";

// ── Default rows ──────────────────────────────────────────────────────────────
const DEFAULT_ROWS: QuestionRowConfig[] = [
  { type: "mcq",          count: 10, marksEach: 2,  enabled: true  },
  { type: "true-false",   count: 2,  marksEach: 5,  enabled: true  },
  { type: "short-answer", count: 5,  marksEach: 6,  enabled: true  },
  { type: "long-answer",  count: 4,  marksEach: 10, enabled: true  },
  { type: "coding",       count: 2,  marksEach: 15, enabled: false },
];

const TYPE_LABEL: Record<QuestionRowConfig["type"], string> = {
  "mcq":          "MCQ",
  "true-false":   "True / False",
  "short-answer": "Short Answer",
  "long-answer":  "Long Answer",
  "coding":       "Coding Challenge",
};

const TARGET = 100;

function computeBalanced(source: QuestionRowConfig[]): QuestionRowConfig[] {
  const enabled = source.filter((r) => r.enabled && r.count > 0);
  if (enabled.length === 0) return source;
  const currentTotal = enabled.reduce((s, r) => s + r.count * r.marksEach, 0);
  if (currentTotal === TARGET) return source;

  type Scaled = QuestionRowConfig & { _rem: number };
  const scaled: Scaled[] = enabled.map((row) => {
    const proportion  = (row.count * row.marksEach) / (currentTotal || 1);
    const targetMarks = proportion * TARGET;
    const marksEach   = Math.max(1, Math.floor(targetMarks / row.count));
    return { ...row, marksEach, _rem: targetMarks - marksEach * row.count };
  });

  let diff = TARGET - scaled.reduce((s, r) => s + r.count * r.marksEach, 0);
  const byRem = [...scaled].sort((a, b) => b._rem - a._rem || b.count - a.count);
  for (const row of byRem) {
    if (diff === 0) break;
    const step = diff > 0 ? 1 : -1;
    if (step * row.count <= Math.abs(diff)) {
      const idx = scaled.findIndex((r) => r.type === row.type);
      scaled[idx].marksEach += step;
      diff -= step * row.count;
    }
  }
  if (diff !== 0) {
    const idx = scaled.reduce((mi, r, i) => r.count < scaled[mi].count ? i : mi, 0);
    scaled[idx].marksEach += diff > 0 ? 1 : -1;
  }
  const map = new Map(scaled.map((r) => [r.type, r.marksEach]));
  return source.map((row) =>
    row.enabled && map.has(row.type) ? { ...row, marksEach: map.get(row.type)! } : row,
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────
type Props = {
  open: boolean;
  onClose: () => void;
  keyData: ApiKey;
  onUpdated: (updated: ApiKey) => void;
};

export function AssessConfigDialog({ open, onClose, keyData, onUpdated }: Props) {
  const { activeOrg } = useOrg();

  const [rows, setRows] = useState<QuestionRowConfig[]>(DEFAULT_ROWS);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [saving, setSaving] = useState(false);

  // Populate from existing config when dialog opens
  useEffect(() => {
    if (!open) return;
    if (keyData.assessConfig?.questionRows?.length) {
      const saved = keyData.assessConfig.questionRows;
      setRows(DEFAULT_ROWS.map((def) => {
        const s = saved.find((r) => r.type === def.type);
        return s ? { ...def, count: s.count, marksEach: s.marksEach, enabled: s.enabled } : def;
      }));
      setDifficulty(keyData.assessConfig.difficultyLevel ?? "medium");
    } else {
      setRows(DEFAULT_ROWS);
      setDifficulty("medium");
    }
    setEmailEnabled(keyData.emailNotificationsEnabled ?? false);
  }, [open, keyData]);

  const totalMarks = rows.filter((r) => r.enabled).reduce((s, r) => s + r.count * r.marksEach, 0);
  const needsBalance = totalMarks !== TARGET;

  function toggleRow(type: string) {
    setRows((prev) => prev.map((r) => r.type === type ? { ...r, enabled: !r.enabled } : r));
  }
  function updateCount(type: string, val: string) {
    setRows((prev) => prev.map((r) => r.type === type ? { ...r, count: Math.max(0, parseInt(val) || 0) } : r));
  }
  function updateMarksEach(type: string, val: string) {
    setRows((prev) => prev.map((r) => r.type === type ? { ...r, marksEach: Math.max(0, parseInt(val) || 0) } : r));
  }
  function autoBalance() {
    setRows((prev) => computeBalanced(prev));
  }

  async function handleSave() {
    if (needsBalance) {
      toast.message(`Total marks must equal ${TARGET}. Use Auto balance.`);
      return;
    }
    if (!activeOrg) return;
    const token = getAccessToken();
    if (!token) return;

    setSaving(true);
    try {
      const config: AssessConfig = { difficultyLevel: difficulty, questionRows: rows };
      const res = await updateAssessConfig(activeOrg.orgId, keyData.keyId, config, token, emailEnabled);
      if (res.data) onUpdated(res.data);
      toast.message("Assessment configuration saved");
      onClose();
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!saving && !o) onClose(); }}>
      <DialogContent className="max-w-[620px] p-0">
        <DialogHeader className="border-b border-neutral-200 px-5 py-4">
          <DialogTitle className="text-[15px] font-semibold">Assessment Configuration</DialogTitle>
          <p className="text-[12px] text-[#8a8a8a]">
            Set the default mark allocation for <span className="font-medium text-[#1a1a1a]">{keyData.name}</span>. This config will be pre-filled in the assessment portal for this key.
          </p>
        </DialogHeader>

        <div className="px-5 py-4 space-y-5">
          {/* Email Notifications */}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
            <div>
              <p className="text-[13px] font-medium text-black">Email Notifications</p>
              <p className="text-[11.5px] text-gray-400 mt-0.5">Send assessment link to candidates via email</p>
            </div>
            <button
              type="button"
              onClick={() => setEmailEnabled((v) => !v)}
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                emailEnabled ? "bg-orange-500" : "bg-gray-200",
              )}
            >
              <span className={cn(
                "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                emailEnabled ? "translate-x-4" : "translate-x-0",
              )} />
            </button>
          </div>

          {/* Mark Allocation table */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Mark Allocation <span className="text-red-500">*</span></p>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_90px_70px] bg-white border-b border-gray-200 px-4 py-2.5 text-[11.5px] font-semibold text-gray-500">
                <span>Type</span>
                <span className="text-center">Count</span>
                <span className="text-center">Marks Each</span>
                <span className="text-right">Total</span>
              </div>

              {rows.map((row, i) => {
                const rowTotal = row.enabled ? row.count * row.marksEach : 0;
                return (
                  <div
                    key={row.type}
                    className={cn(
                      "grid grid-cols-[1fr_80px_90px_70px] items-center px-4 py-2.5 bg-white",
                      i < rows.length - 1 && "border-b border-gray-100",
                      !row.enabled && "opacity-50",
                    )}
                  >
                    {/* Toggle + label */}
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggleRow(row.type)}
                        className={cn(
                          "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200",
                          row.enabled ? "bg-orange-500" : "bg-gray-200",
                        )}
                      >
                        <span className={cn(
                          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200",
                          row.enabled ? "translate-x-4" : "translate-x-0",
                        )} />
                      </button>
                      <span className="text-[13px] font-medium text-black">{TYPE_LABEL[row.type]}</span>
                    </div>
                    {/* Count */}
                    <div className="flex justify-center">
                      <input
                        type="number" min={0} value={row.count}
                        onChange={(e) => updateCount(row.type, e.target.value)}
                        disabled={!row.enabled}
                        className="w-14 text-center border border-gray-200 rounded-md py-1 text-[14px] font-medium text-black bg-white outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
                      />
                    </div>
                    {/* Marks Each */}
                    <div className="flex justify-center">
                      <input
                        type="number" min={0} value={row.marksEach}
                        onChange={(e) => updateMarksEach(row.type, e.target.value)}
                        disabled={!row.enabled}
                        className="w-14 text-center border border-gray-200 rounded-md py-1 text-[14px] font-medium text-black bg-white outline-none focus:ring-2 focus:ring-orange-300 disabled:opacity-50"
                      />
                    </div>
                    {/* Total */}
                    <div className="text-right">
                      <span className="text-[14px] font-bold text-black">{rowTotal}</span>
                    </div>
                  </div>
                );
              })}

              {/* Footer */}
              <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-t border-gray-200">
                <button
                  type="button"
                  onClick={autoBalance}
                  disabled={!needsBalance}
                  className={cn(
                    "flex items-center gap-2 text-[12px] font-medium transition-colors shrink-0 rounded-md px-2.5 py-1.5 border",
                    needsBalance
                      ? "text-gray-800 hover:bg-gray-100 cursor-pointer border-gray-300"
                      : "text-gray-400 cursor-default border-gray-200",
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Auto balance
                </button>
                <div className="ml-auto shrink-0">
                  <span className={cn("text-[14px] font-bold", needsBalance ? "text-red-500" : "text-black")}>
                    {totalMarks}
                  </span>
                  <span className="text-[12px] text-gray-400 ml-1">/ {TARGET}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Difficulty Level <span className="text-red-500">*</span></p>
            <div className="grid grid-cols-3 gap-2">
              {(["easy", "medium", "hard"] as const).map((d) => {
                const meta = {
                  easy:   { title: "Easy",   sub: "Foundational" },
                  medium: { title: "Medium", sub: "Applied" },
                  hard:   { title: "Hard",   sub: "Advanced" },
                }[d];
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex flex-col items-center gap-0.5 border-2 rounded-xl py-3 transition-colors cursor-pointer",
                      difficulty === d
                        ? "border-[#FF5723] bg-[#FFF7ED]"
                        : "border-gray-200 hover:border-gray-300 bg-white",
                    )}
                  >
                    <span className={cn("text-[13px] font-semibold", difficulty === d ? "text-[#FF5723]" : "text-black")}>
                      {meta.title}
                    </span>
                    <span className="text-[11px] text-gray-400">{meta.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t border-neutral-200 px-5 py-3.5">
          <Button variant="outline" disabled={saving} onClick={onClose}>Cancel</Button>
          <Button
            style={{ background: "#1a1a1a", color: "#fff" }}
            className="hover:opacity-90"
            disabled={saving || needsBalance}
            onClick={handleSave}
          >
            {saving ? "Saving…" : "Save Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
