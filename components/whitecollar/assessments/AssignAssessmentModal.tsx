"use client";

import { useState, useRef, useCallback } from "react";
import { X, Upload, AlertCircle, Info, Mail, Download } from "lucide-react";
import { toast } from "sonner";

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

import {
  checkAssignmentDuplicates,
  createAssignment,
} from "@/api/assessmentAssignment.api";
import type { AssessmentItem } from "@/api/assessment.api";

// ── Types ─────────────────────────────────────────────────────────────────────

type CandidateRow = { name: string; email: string };
type Step = "upload" | "preview";

type Props = {
  open: boolean;
  assessments: AssessmentItem[]; // for the "Select Assessment" dropdown
  onClose: () => void;
  onSuccess: () => void;
  getToken: () => string;
  orgId: string;
};

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text: string): CandidateRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return [];

  // Detect if first row is a header (contains "name" or "email" case-insensitive)
  const firstLower = lines[0].toLowerCase();
  const hasHeader = firstLower.includes("name") || firstLower.includes("email");
  const dataLines = hasHeader ? lines.slice(1) : lines;

  return dataLines.reduce<CandidateRow[]>((acc, line) => {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const name = cols[0] ?? "";
    const email = cols[1] ?? "";
    if (name && email && email.includes("@")) acc.push({ name, email });
    return acc;
  }, []);
}

// Deduplicate keeping first occurrence per email
function deduplicateByEmail(rows: CandidateRow[]): {
  unique: CandidateRow[];
  removed: number;
} {
  const seen = new Set<string>();
  const unique: CandidateRow[] = [];
  for (const r of rows) {
    const key = r.email.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return { unique, removed: rows.length - unique.length };
}

// ── Sample CSV ────────────────────────────────────────────────────────────────

const SAMPLE_CSV = `Name,Email
John Smith,john.smith@example.com
Jane Doe,jane.doe@example.com
Alex Johnson,alex.johnson@example.com
`;

function downloadSampleCSV() {
  const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample_candidates.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UploadZone({
  file,
  onFile,
  onClear,
}: {
  file: File | null;
  onFile: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDrag(false);
      const f = e.dataTransfer.files[0];
      if (f?.name.endsWith(".csv")) onFile(f);
      else toast.error("Only CSV files are supported");
    },
    [onFile],
  );

  return (
    <div
      onClick={() => !file && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!file) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      className={cn(
        "relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed py-6 px-4 transition-colors",
        file
          ? "cursor-default border-[#ff5723] bg-orange-50"
          : drag
          ? "cursor-pointer border-[#ff5723] bg-orange-50"
          : "cursor-pointer border-neutral-200 bg-neutral-50 hover:border-neutral-300",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
          e.target.value = "";
        }}
      />

      {/* X button to clear file */}
      {file && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClear(); }}
          className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-white text-neutral-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        <Upload className="h-5 w-5 text-[#ff5723]" />
      </div>
      {file ? (
        <p className="text-[13px] font-medium text-[#1f1f1f]">{file.name}</p>
      ) : (
        <>
          <p className="text-[13px] font-medium text-[#1f1f1f]">
            Click or drag file with student data
          </p>
          <p className="text-[11px] text-[#9a9a9a] text-center">
            Supports single and bulk uploads. Only CSV files are supported, with
            a maximum file size of 10 MB. Please do not upload confidential
            company data or any prohibited files.
          </p>
        </>
      )}
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────

export default function AssignAssessmentModal({
  open,
  assessments,
  onClose,
  onSuccess,
  getToken,
  orgId,
}: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  // Step 1 state
  const [file, setFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState("");
  const [tag, setTag] = useState("");
  const [assessmentId, setAssessmentId] = useState("");

  // Step 2 state
  const [uniqueCandidates, setUniqueCandidates] = useState<CandidateRow[]>([]);
  const [inListRemoved, setInListRemoved] = useState(0);
  const [alreadyAssigned, setAlreadyAssigned] = useState<string[]>([]);

  const handleClose = () => {
    setStep("upload");
    setFile(null);
    setBatchName("");
    setTag("");
    setAssessmentId("");
    setUniqueCandidates([]);
    setInListRemoved(0);
    setAlreadyAssigned([]);
    onClose();
  };

  // ── Step 1 → 2: parse CSV + check duplicates ──────────────────────────────

  const handleContinueToPreview = async () => {
    if (!file) return toast.error("Please upload a CSV file");
    if (!batchName.trim()) return toast.error("Batch name is required");
    if (!tag.trim()) return toast.error("Tag is required");
    if (!assessmentId) return toast.error("Please select an assessment");

    setChecking(true);
    try {
      const text = await file.text();
      const parsed = parseCSV(text);
      if (parsed.length === 0) {
        toast.error("No valid candidates found in CSV");
        return;
      }

      const { unique, removed } = deduplicateByEmail(parsed);
      setInListRemoved(removed);

      // Check backend for already-assigned duplicates
      const emails = unique.map((r) => r.email);
      const res = await checkAssignmentDuplicates(
        assessmentId,
        orgId,
        emails,
        getToken(),
      );
      const already = res.data?.alreadyAssigned ?? [];
      setAlreadyAssigned(already);

      // Remove already-assigned from preview list
      const assignedSet = new Set(already.map((e) => e.toLowerCase()));
      setUniqueCandidates(
        unique.filter((r) => !assignedSet.has(r.email.toLowerCase())),
      );

      setStep("preview");
    } catch {
      toast.error("Failed to process CSV");
    } finally {
      setChecking(false);
    }
  };

  // ── Step 2 → assign ───────────────────────────────────────────────────────

  const handleAssign = async () => {
    if (uniqueCandidates.length === 0) {
      toast.error("No new candidates to assign — all are duplicates");
      return;
    }
    setSaving(true);
    try {
      await createAssignment(
        assessmentId,
        { orgId, batchName, tag, candidates: uniqueCandidates },
        getToken(),
      );
      toast.success(
        `Assessment assigned to ${uniqueCandidates.length} candidate${uniqueCandidates.length !== 1 ? "s" : ""}. Invite emails sent.`,
      );
      handleClose();
      onSuccess();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to assign assessment",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const selectedAssessment = assessments.find(
    (a) => a.assessmentId === assessmentId,
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-5">
          <h2 className="text-[15px] font-semibold text-[#1f1f1f]">
            {step === "upload"
              ? "Select an assessment & add recipients"
              : "Select a credential & add recipients"}
          </h2>

          <X className="h-4 w-4 cursor-pointer " onClick={handleClose} />
        </div>

        {/* ── Step 1: Upload + form ── */}
        {step === "upload" && (
          <div className="space-y-4 px-6">
            {/* Upload zone */}
            <div>
              <UploadZone file={file} onFile={setFile} onClear={() => setFile(null)} />
              <button
                type="button"
                onClick={downloadSampleCSV}
                className="mt-2 inline-flex items-center gap-2 text-[14px] font-semibold text-[#022c22] hover:text-[#ff5723] transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4" strokeWidth={2.2} />
                Download Sample .CSV
              </button>
            </div>

            {/* Batch name */}
            <div>
              <Label className="mb-1 text-[12px] font-medium text-[#3a3a3a]">
                Batch name <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="eg: UI/UX Designer Batch 1"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                className="text-[13px]"
              />
            </div>

            {/* Select Assessment */}
            <div>
              <Label className="mb-1 text-[12px] font-medium text-[#3a3a3a]">
                Select Assessment <span className="text-red-500">*</span>
              </Label>
              <Select value={assessmentId} onValueChange={setAssessmentId}>
                <SelectTrigger className="h-10 w-full rounded-md text-[13px] text-foreground shadow-xs data-[placeholder]:text-muted-foreground">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  className="w-[var(--radix-select-trigger-width)]"
                >
                  {assessments.map((a) => (
                    <SelectItem
                      key={a.assessmentId}
                      value={a.assessmentId}
                      className="text-[13px]"
                    >
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tag */}
            <div>
              <Label className="mb-1 flex items-center gap-1 text-[12px] font-medium text-[#3a3a3a]">
                Create Tag <span className="text-red-500">*</span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex cursor-help items-center text-neutral-400">
                        <Info className="h-3 w-3" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" sideOffset={6}>
                      tag as SNS
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                placeholder="eg: SNS"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="text-[13px]"
              />
            </div>
          </div>
        )}

        {/* ── Step 2: Preview ── */}
        {step === "preview" && (
          <div className="px-6">
            {/* Batch info */}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-[14px] font-semibold text-[#1f1f1f]">
                {batchName}
              </p>
              <p className="text-[12px] text-[#7a7a7a]">
                Total:{" "}
                <span className="font-medium text-[#1f1f1f]">
                  {uniqueCandidates.length} candidate
                  {uniqueCandidates.length !== 1 ? "s" : ""}
                </span>
              </p>
            </div>

            {/* Assessment info */}
            {selectedAssessment && (
              <p className="mb-3 text-[12px] text-[#7a7a7a]">
                Assessment:{" "}
                <span className="font-medium text-[#1f1f1f]">
                  {selectedAssessment.name}
                </span>
              </p>
            )}

            {/* Already-assigned warning */}
            {alreadyAssigned.length > 0 && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-[12px] text-amber-700">
                  <span className="font-semibold">
                    {alreadyAssigned.length} email
                    {alreadyAssigned.length !== 1 ? "s" : ""}
                  </span>{" "}
                  already assigned to this assessment and will be skipped.
                </p>
              </div>
            )}

            {/* Email invite notice */}
            {uniqueCandidates.length > 0 && (
              <div className="mb-3 flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p className="text-[12px] text-blue-700">
                  An assessment invite email will be sent to{" "}
                  <span className="font-semibold">
                    {uniqueCandidates.length} candidate
                    {uniqueCandidates.length !== 1 ? "s" : ""}
                  </span>{" "}
                  once assigned.
                </p>
              </div>
            )}

            {/* Candidates table */}
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <div className="grid grid-cols-2 border-b border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[12px] font-medium text-[#6a6a6a]">
                <span>Candidate Name</span>
                <span>Candidate Email</span>
              </div>
              <div className="max-h-[260px] overflow-y-auto">
                {uniqueCandidates.length === 0 ? (
                  <div className="px-4 py-8 text-center text-[13px] text-[#9a9a9a]">
                    No new candidates to assign
                  </div>
                ) : (
                  uniqueCandidates.map((c, i) => (
                    <div
                      key={i}
                      className="grid grid-cols-2 border-b border-neutral-100 px-4 py-3 last:border-0"
                    >
                      <span className="text-[13px] text-[#1f1f1f]">
                        {c.name}
                      </span>
                      <span className="text-[13px] text-[#5a5a5a]">
                        {c.email}
                      </span>
                    </div>
                  ))
                )}
              </div>

              {/* Duplicates footer */}
              {(inListRemoved > 0 || alreadyAssigned.length > 0) && (
                <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2.5">
                  {inListRemoved > 0 && (
                    <p className="text-[11px] text-[#8a8a8a]">
                      &ldquo;{inListRemoved}&rdquo; In-list Duplicate
                      {inListRemoved !== 1 ? "s" : ""} Removed
                    </p>
                  )}
                  {alreadyAssigned.length > 0 && (
                    <p className="text-[11px] text-[#8a8a8a]">
                      &ldquo;{alreadyAssigned.length}&rdquo; Already-assigned
                      Duplicate{alreadyAssigned.length !== 1 ? "s" : ""} Skipped
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-neutral-100 px-6 py-5">
          <Button
            variant="outline"
            onClick={step === "preview" ? () => setStep("upload") : handleClose}
            className="h-9 px-5 text-[13px]"
          >
            Cancel
          </Button>
          <Button
            onClick={step === "upload" ? handleContinueToPreview : handleAssign}
            disabled={checking || saving}
            className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
          >
            {checking ? "Processing…" : saving ? "Assigning…" : "Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
