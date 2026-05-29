"use client";

import { useEffect, useRef, useState } from "react";
import {
  FileText,
  Mic,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Send,
  Video,
} from "lucide-react";
import { toast } from "sonner";

import {
  createWorkflow,
  listWorkflows,
  searchWorkflowSkills,
  type CreateWorkflowPayload,
  type WorkflowItem,
  type WorkflowPagination,
  type WorkflowSkill,
} from "@/api/workflow.api";
import { useOrg } from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { useTestMode } from "@/components/layout/testModeContext";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { getAccessToken } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const PAGE_LIMIT = 5;

const workflowTypes = ["Skill Assessment", "Job Description", "Profile Verification"];

const methods = [
  {
    value: "text",
    title: "Text Verification",
    copy: "Verification is conducted through skill-based MCQ.",
    icon: FileText,
  },
  {
    value: "voice",
    title: "Voice Verification",
    copy: "Verification is conducted through voice responses.",
    icon: Mic,
  },
  {
    value: "video",
    title: "Video Verification",
    copy: "Verification is conducted through video responses.",
    icon: Video,
  },
] as const;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function emptyForm(): CreateWorkflowPayload {
  return {
    orgId: "",
    name: "",
    workflowType: "Skill Assessment",
    startMessage: "",
    completionMessage: "",
    skillIds: [],
    verificationMethod: "text",
    mode: "test",
  };
}

export default function WorkflowPage() {
  const { activeOrg } = useOrg();
  const { activeProject } = useProject();
  const { isTestMode } = useTestMode();
  const [workflows, setWorkflows] = useState<WorkflowItem[]>([]);
  const [skills, setSkills] = useState<WorkflowSkill[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<WorkflowSkill[]>([]);
  const [pagination, setPagination] = useState<WorkflowPagination | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [skillSearching, setSkillSearching] = useState(false);
  const [form, setForm] = useState<CreateWorkflowPayload>(emptyForm);
  const fetchKeyRef = useRef("");

  const loadWorkflows = () => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const mode = isTestMode ? "test" : "live";
    const projectId = activeProject?.projectId ?? "";
    const key = `${activeOrg.orgId}|${mode}|${projectId}|${page}`;
    fetchKeyRef.current = key;

    setLoading(true);
    listWorkflows(activeOrg.orgId, page, PAGE_LIMIT, mode, token, projectId || undefined)
      .then((res) => {
        if (fetchKeyRef.current !== key) return;
        if (res.data) {
          setWorkflows(res.data.workflows);
          setPagination(res.data.pagination);
        }
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to load workflows");
      })
      .finally(() => {
        if (fetchKeyRef.current === key) setLoading(false);
      });
  };

  useEffect(() => {
    loadWorkflows();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.orgId, activeProject?.projectId, isTestMode, page]);

  useEffect(() => {
    if (!skillPickerOpen || skillQuery.trim().length < 2) {
      setSkills([]);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setSkillSearching(true);
      searchWorkflowSkills(skillQuery.trim(), token, controller.signal)
        .then((res) => setSkills(res.data?.skills ?? []))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSkills([]);
        })
        .finally(() => setSkillSearching(false));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [skillPickerOpen, skillQuery]);

  useEffect(() => {
    if (!skillPickerOpen) {
      setSkillQuery("");
      setSkills([]);
    }
  }, [skillPickerOpen]);

  const resetDialog = () => {
    setStep(1);
    setSkillPickerOpen(false);
    setSelectedSkills([]);
    setForm(emptyForm());
  };

  const openCreate = () => {
    resetDialog();
    setOpen(true);
  };

  const updateForm = <K extends keyof CreateWorkflowPayload>(
    key: K,
    value: CreateWorkflowPayload[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleSkill = (skill: WorkflowSkill) => {
    setForm((current) => {
      const skillId = skill.skillId;
      const exists = current.skillIds.includes(skillId);
      if (!exists && current.skillIds.length >= 5) {
        toast.message("You can add up to 5 skills per workflow.");
        return current;
      }

      return {
        ...current,
        skillIds: exists
          ? current.skillIds.filter((id) => id !== skillId)
          : [...current.skillIds, skillId],
      };
    });

    setSelectedSkills((current) => {
      const exists = current.some((item) => item.skillId === skill.skillId);
      return exists
        ? current.filter((item) => item.skillId !== skill.skillId)
        : [...current, skill];
    });
  };

  const continueToStepTwo = () => {
    if (!form.name.trim()) {
      toast.error("Workflow name is required");
      return;
    }
    setStep(2);
  };

  const launchWorkflow = async () => {
    if (!activeOrg?.orgId) {
      toast.error("No organization selected");
      return;
    }
    if (form.skillIds.length === 0) {
      toast.error("Select at least one skill");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setCreating(true);
    try {
      await createWorkflow(
        {
          ...form,
          orgId: activeOrg.orgId,
          mode: isTestMode ? "test" : "live",
          projectId: activeProject?.projectId || undefined,
        },
        token,
      );
      toast.success("Workflow created successfully");
      setOpen(false);
      resetDialog();
      setPage(1);
      loadWorkflows();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.total ?? 0;
  const currentFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const currentTo = Math.min(page * PAGE_LIMIT, totalCount);

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Your Workflows</h1>
        <Button
          className="h-10 gap-2 bg-[#ff5723] px-5 text-[13px] font-semibold text-white hover:bg-[#f04d1d]"
          onClick={openCreate}
        >
          Create workflow
          <Send className="h-4 w-4" />
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                Workflow Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Updated at
              </TableHead>
              <TableHead className="text-right pr-8 text-[13px] font-medium text-[#7a7a7a]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell className="px-5 py-4">
                    <div className="h-4 w-44 animate-pulse rounded bg-neutral-200" />
                    <div className="mt-2 h-3 w-64 animate-pulse rounded bg-neutral-100" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 animate-pulse rounded bg-neutral-100" />
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))
            ) : workflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="py-16 text-center text-[13px] text-[#9a9a9a]">
                  No workflows yet.
                </TableCell>
              </TableRow>
            ) : (
              workflows.map((workflow) => (
                <TableRow key={workflow.workflowId}>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-[13px] font-semibold text-[#1f1f1f]">
                          {workflow.name}
                        </p>
                        <p className="mt-1 text-[12px] text-[#8a8a8a]">
                          {workflow.workflowId}
                        </p>
                      </div>
                      <span className="rounded-md bg-neutral-100 px-2 py-1 text-[12px] text-[#6a6a6a]">
                        {workflow.workflowType}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[13px] text-[#1f1f1f]">
                    {formatDate(workflow.updatedAt)}
                  </TableCell>
                  <TableCell className="pr-8">
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" size="sm" className="h-8 gap-2 text-[12px]">
                        Generate Request
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Pencil className="h-4 w-4 text-[#697282]" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4 text-[#697282]" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[13px] text-[#7a7a7a]">
          <p>
            {loading
              ? "Loading..."
              : `Showing ${currentFrom} of ${totalCount} Workflow${totalCount === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
            >
              Previous
            </Button>
            <span className="rounded-md border border-neutral-200 px-3 py-1 text-[#1f1f1f]">
              {page}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-[540px] overflow-y-auto p-0" showCloseButton>
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold">Create Workflow</DialogTitle>
            <div className="space-y-2">
              <p className="text-[12px] text-[#8a8a8a]">
                Step {step} of 2 - {step === 1 ? "Workflow Setup" : "Verification Configuration"}
              </p>
              <div className="flex gap-1">
                <span className="h-1 w-12 rounded-full bg-[#ff5723]" />
                <span className={cn("h-1 w-12 rounded-full", step === 2 ? "bg-[#ff5723]" : "bg-neutral-200")} />
              </div>
            </div>
          </DialogHeader>

          {step === 1 ? (
            <div className="space-y-4 px-5 py-4">
              <div>
                <h2 className="text-[13px] font-semibold text-[#1f1f1f]">Workflow Setup</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                  Configure basic workflow details to define how it appears and communicates
                  with candidates during verification.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-[#6a6a6a]">Workflow Name</Label>
                <Input
                  value={form.name}
                  placeholder="eg: Warehouse Staff Verification"
                  onChange={(event) => updateForm("name", event.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-[#6a6a6a]">Workflow Type</Label>
                <Select
                  value={form.workflowType}
                  onValueChange={(value) => updateForm("workflowType", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {workflowTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-[#6a6a6a]">Start Message</Label>
                <Textarea
                  className="min-h-28 resize-none"
                  maxLength={400}
                  value={form.startMessage}
                  placeholder="Enter the message shown when the workflow begins"
                  onChange={(event) => updateForm("startMessage", event.target.value)}
                />
                <div className="flex justify-between text-[11px] text-[#9a9a9a]">
                  <span>This message will be displayed before verification starts.</span>
                  <span>{form.startMessage.length}/400</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[13px] text-[#6a6a6a]">Completion Message</Label>
                <Textarea
                  className="min-h-28 resize-none"
                  maxLength={400}
                  value={form.completionMessage}
                  placeholder="Enter the message shown after completion"
                  onChange={(event) => updateForm("completionMessage", event.target.value)}
                />
                <div className="flex justify-between text-[11px] text-[#9a9a9a]">
                  <span>This message will be displayed once verification is complete.</span>
                  <span>{form.completionMessage.length}/400</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 px-5 py-4">
              <div>
                <h2 className="text-[13px] font-semibold text-[#1f1f1f]">Select Skills</h2>
                <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                  You can add up to five skills for verification in this workflow.
                </p>
                <Button
                  className="mt-3 h-10 gap-2 bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                  onClick={() => setSkillPickerOpen(true)}
                >
                  <Plus className="h-4 w-4" />
                  Add skills
                </Button>
                <p className="mt-2 text-[11px] text-[#9a9a9a]">
                  {form.skillIds.length} of 5 skills selected.
                </p>
              </div>

              {selectedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedSkills.map((skill) => (
                    <button
                      key={skill.skillId}
                      type="button"
                      className="rounded-md bg-neutral-100 px-2 py-1 text-[12px] text-[#4a4a4a]"
                      onClick={() => toggleSkill(skill)}
                    >
                      {skill.name}
                    </button>
                  ))}
                </div>
              )}

              <div>
                <h2 className="text-[13px] font-semibold text-[#1f1f1f]">
                  Choose Verification Method
                </h2>
                <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                  Select how candidates should complete the verification.
                </p>
                <div className="mt-3 space-y-3">
                  {methods.map((method) => {
                    const Icon = method.icon;
                    const selected = form.verificationMethod === method.value;

                    return (
                      <button
                        key={method.value}
                        type="button"
                        className={cn(
                          "flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition-colors",
                          selected ? "border-[#ff5723] bg-orange-50" : "border-neutral-200 bg-white hover:bg-neutral-50",
                        )}
                        onClick={() => updateForm("verificationMethod", method.value)}
                      >
                        <Icon className="h-5 w-5 text-[#697282]" />
                        <span>
                          <span className="block text-[13px] font-semibold text-[#1f1f1f]">
                            {method.title}
                          </span>
                          <span className="mt-1 block text-[12px] text-[#6a6a6a]">
                            {method.copy}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button variant="outline" onClick={() => (step === 1 ? setOpen(false) : setStep(1))}>
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === 1 ? (
              <Button className="bg-[#ff5723] text-white hover:bg-[#f04d1d]" onClick={continueToStepTwo}>
                Continue
              </Button>
            ) : (
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                disabled={creating}
                onClick={launchWorkflow}
              >
                {creating ? "Launching..." : "Launch Workflow"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skillPickerOpen} onOpenChange={setSkillPickerOpen}>
        <DialogContent className="max-w-[520px] p-0" showCloseButton>
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold">Add skills</DialogTitle>
            <p className="text-[12px] text-[#7a7a7a]">
              Search and select up to five skills for this workflow.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="pl-9"
                value={skillQuery}
                placeholder="Search skills"
                autoFocus
                onChange={(event) => setSkillQuery(event.target.value)}
              />
            </div>

            <div className="min-h-44 overflow-hidden rounded-md border border-neutral-200">
              {skillQuery.trim().length < 2 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  Type at least 2 characters to search skills.
                </p>
              ) : skillSearching ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  Searching...
                </p>
              ) : skills.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  No skills found.
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {skills.map((skill) => (
                    <label
                      key={skill.skillId}
                      className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50"
                    >
                      <Checkbox
                        checked={form.skillIds.includes(skill.skillId)}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                      <span className="text-[13px] font-medium text-[#1f1f1f]">
                        {skill.name}
                      </span>
                      <span className="ml-auto text-[11px] text-[#9a9a9a]">
                        {skill.skillId}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[12px] text-[#8a8a8a]">
              <span>{form.skillIds.length} of 5 selected</span>
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                onClick={() => setSkillPickerOpen(false)}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
