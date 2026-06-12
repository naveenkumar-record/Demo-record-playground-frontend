"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  FileUp,
  Info,
  Mic,
  Plus,
  Search,
  Send,
  Upload,
  Video,
  X,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { toast } from "sonner";
import states from "@/constants/location.constants";

import {
  createWorkflow,
  createWorkflowCandidates,
  listWorkflowSkills,
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

const methods = [
  {
    value: "voice",
    title: "Voice Verification",
    copy: "AI calls the candidate on their phone and has a 10-minute conversation in their language. Works for all candidates including those without WhatsApp.",
    icon: Mic,
    comingSoon: true,
  },
  {
    value: "video",
    title: "Video Verification",
    copy: "Candidate receives a WhatsApp link and completes a short video conversation with the AI. Higher confidence result.",
    icon: Video,
    comingSoon: false,
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
    jobTitle: "",
    roleType: "",
    experienceRange: "",
    salary: "",
    location: "",
    jobDescription: "",
    startMessage: "",
    completionMessage: "",
    skillIds: [],
    verificationMethod: "video",
    mode: "test",
  };
}

// "District, State" combined options sorted alphabetically
const ALL_LOCATIONS = Object.entries(states)
  .flatMap(([state, { districts }]) => districts.map((d) => `${d}, ${state}`))
  .sort((a, b) => a.localeCompare(b));

export default function WorkflowPage() {
  const router = useRouter();
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
  const [locationOpen, setLocationOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [createdWorkflow, setCreatedWorkflow] = useState<WorkflowItem | null>(
    null,
  );
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestSuccessOpen, setRequestSuccessOpen] = useState(false);
  const [requestWorkflow, setRequestWorkflow] = useState<WorkflowItem | null>(
    null,
  );
  const [requestStep, setRequestStep] = useState<1 | 2>(1);
  const [requestTab, setRequestTab] = useState<"bulk" | "individual">("bulk");
  const [manualCandidates, setManualCandidates] = useState<
    { id: string; name: string; phoneNumber: string; role: string }[]
  >([]);
  const [currentManualName, setCurrentManualName] = useState("");
  const [currentManualPhone, setCurrentManualPhone] = useState("");
  const [currentManualRole, setCurrentManualRole] = useState("");
  const [requestRole, setRequestRole] = useState("");
  const [requestLanguage, setRequestLanguage] = useState("english");
  const [requestLinkExpiry, setRequestLinkExpiry] = useState("7 Days");
  const [csvCandidates, setCsvCandidates] = useState<
    { name: string; phoneNumber: string; role?: string }[]
  >([]);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [skillPickerOpen, setSkillPickerOpen] = useState(false);
  const [skillQuery, setSkillQuery] = useState("");
  const [initialSkills, setInitialSkills] = useState<WorkflowSkill[]>([]);
  const [loadingInitialSkills, setLoadingInitialSkills] = useState(false);
  const [skillSearching, setSkillSearching] = useState(false);
  const [form, setForm] = useState<CreateWorkflowPayload>(emptyForm);
  const fetchKeyRef = useRef("");
  const initialSkillsAbortRef = useRef<AbortController | null>(null);
  const skillSearchAbortRef = useRef<AbortController | null>(null);
  const trimmedSkillQuery = skillQuery.trim();
  const displayedSkills = trimmedSkillQuery.length < 1 ? initialSkills : skills;

  const loadWorkflows = () => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    const mode = isTestMode ? "test" : "live";
    const projectId = activeProject?.projectId ?? "";
    const key = `${activeOrg.orgId}|${mode}|${projectId}|${page}`;
    fetchKeyRef.current = key;

    setLoading(true);
    listWorkflows(
      activeOrg.orgId,
      page,
      PAGE_LIMIT,
      mode,
      token,
      projectId || undefined,
    )
      .then((res) => {
        if (fetchKeyRef.current !== key) return;
        if (res.data) {
          setWorkflows(res.data.workflows);
          setPagination(res.data.pagination);
        }
      })
      .catch((err: unknown) => {
        toast.error(
          err instanceof Error ? err.message : "Failed to load workflows",
        );
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
    if (!skillPickerOpen) return;

    initialSkillsAbortRef.current?.abort();
    initialSkillsAbortRef.current = new AbortController();

    const token = getAccessToken();
    if (!token) return;

    const timer = window.setTimeout(() => {
      setLoadingInitialSkills(true);
      listWorkflowSkills(token, initialSkillsAbortRef.current!.signal)
        .then((res) => setInitialSkills((res.data?.skills ?? []).slice(0, 50)))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setInitialSkills([]);
        })
        .finally(() => setLoadingInitialSkills(false));
    }, 0);

    return () => {
      window.clearTimeout(timer);
      initialSkillsAbortRef.current?.abort();
    };
  }, [skillPickerOpen]);

  useEffect(() => {
    if (!skillPickerOpen || trimmedSkillQuery.length < 1) {
      setSkills([]);
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    skillSearchAbortRef.current?.abort();
    skillSearchAbortRef.current = new AbortController();

    const timer = window.setTimeout(() => {
      setSkillSearching(true);
      searchWorkflowSkills(
        trimmedSkillQuery,
        token,
        skillSearchAbortRef.current!.signal,
      )
        .then((res) => setSkills(res.data?.skills ?? []))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setSkills([]);
        })
        .finally(() => setSkillSearching(false));
    }, 250);

    return () => {
      window.clearTimeout(timer);
      skillSearchAbortRef.current?.abort();
    };
  }, [skillPickerOpen, trimmedSkillQuery]);

  const closeSkillPicker = () => {
    initialSkillsAbortRef.current?.abort();
    skillSearchAbortRef.current?.abort();
    setSkillQuery("");
    setInitialSkills([]);
    setSkills([]);
    setLoadingInitialSkills(false);
    setSkillSearching(false);
    setSkillPickerOpen(false);
  };

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
      if (!exists && current.skillIds.length >= 2) {
        toast.message("You can add up to 2 skills per workflow.");
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
      if (exists)
        return current.filter((item) => item.skillId !== skill.skillId);
      if (current.length >= 2) return current;
      return [...current, skill];
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
    if (!(form.jobTitle ?? "").trim()) {
      toast.error("Job title is required");
      return;
    }
    if (!form.roleType) {
      toast.error("Role type is required");
      return;
    }
    if (!form.experienceRange) {
      toast.error("Experience range is required");
      return;
    }
    if (!(form.salary ?? "").trim()) {
      toast.error("Salary is required");
      return;
    }
    if (!(form.location ?? "").trim()) {
      toast.error("Location is required");
      return;
    }
    if (!(form.jobDescription ?? "").trim()) {
      toast.error("Job description is required");
      return;
    }
    if (form.skillIds.length === 0) {
      toast.error("Select at least one skill");
      return;
    }
    if (!form.verificationMethod) {
      toast.error("Please choose a verification method");
      return;
    }

    const token = getAccessToken();
    if (!token) return;

    setCreating(true);
    try {
      const response = await createWorkflow(
        {
          ...form,
          orgId: activeOrg.orgId,
          mode: isTestMode ? "test" : "live",
          projectId: activeProject?.projectId || undefined,
        },
        token,
      );
      const workflow = response.data?.workflow ?? null;
      setCreatedWorkflow(workflow);
      toast.success("Workflow created successfully");
      setOpen(false);
      setSuccessOpen(true);
      resetDialog();
      setPage(1);
      loadWorkflows();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create workflow",
      );
    } finally {
      setCreating(false);
    }
  };

  const totalPages = pagination?.totalPages ?? 1;
  const totalCount = pagination?.total ?? 0;
  const currentFrom = totalCount === 0 ? 0 : (page - 1) * PAGE_LIMIT + 1;
  const currentTo = Math.min(page * PAGE_LIMIT, totalCount);
  const skillsLimitReached = selectedSkills.length >= 2;

  const goToDashboard = () => {
    setSuccessOpen(false);
    router.push("/bluecollar/dashboard");
  };

  const openRequest = (workflow: WorkflowItem) => {
    setRequestWorkflow(workflow);
    setRequestStep(1);
    setRequestTab("bulk");
    setManualCandidates([]);
    setCurrentManualName("");
    setCurrentManualPhone("");
    setCurrentManualRole(workflow.name);
    setRequestRole(workflow.name);
    setRequestLanguage("english");
    setRequestLinkExpiry("7 Days");
    setCsvCandidates([]);
    setRequestOpen(true);
  };

  const openCreatedWorkflowCandidates = () => {
    if (!createdWorkflow) {
      setSuccessOpen(false);
      return;
    }
    setSuccessOpen(false);
    openRequest(createdWorkflow);
  };

  const addManualCandidate = () => {
    if (!currentManualName.trim()) {
      toast.error("Candidate name is required");
      return;
    }
    if (currentManualPhone.replace(/[^\d]/g, "").length !== 10) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }
    if (!currentManualRole.trim()) {
      toast.error("Role is required");
      return;
    }
    setManualCandidates((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        name: currentManualName.trim(),
        phoneNumber: currentManualPhone,
        role: currentManualRole,
      },
    ]);
    setCurrentManualName("");
    setCurrentManualPhone("");
    setCurrentManualRole("");
  };

  const removeManualCandidate = (id: string) => {
    setManualCandidates((prev) => prev.filter((c) => c.id !== id));
  };

  const continueToRequestStep2 = () => {
    if (requestTab === "bulk") {
      if (!requestRole) {
        toast.error("Select a role being verified");
        return;
      }
      if (csvCandidates.length === 0) {
        toast.error("Upload a CSV file with candidates");
        return;
      }
    } else {
      if (manualCandidates.length === 0) {
        toast.error("Add at least one candidate");
        return;
      }
      if (!requestRole && manualCandidates[0]?.role)
        setRequestRole(manualCandidates[0].role);
    }
    setRequestStep(2);
  };

  const parseCsv = async (file: File) => {
    const text = await file.text();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const dataLines = lines[0]?.toLowerCase().includes("name")
      ? lines.slice(1)
      : lines;
    const candidates = dataLines
      .map((line) => {
        const [name = "", phoneNumber = "", role = ""] = line
          .split(",")
          .map((part) => part.trim());
        return { name, phoneNumber, role };
      })
      .filter((candidate) => candidate.name && candidate.phoneNumber);
    setCsvCandidates(candidates);
  };

  const sendRequest = async () => {
    const token = getAccessToken();
    if (!token || !requestWorkflow) return;

    const candidates =
      requestTab === "individual"
        ? manualCandidates.map((c) => ({
            name: c.name,
            phoneNumber: `91${c.phoneNumber.replace(/[^\d]/g, "")}`,
            role: c.role,
          }))
        : csvCandidates.map((c) => ({
            name: c.name,
            phoneNumber: c.phoneNumber,
            role: requestRole,
          }));

    if (candidates.length === 0) {
      toast.error("Add at least one candidate");
      return;
    }

    setSendingRequest(true);
    try {
      await createWorkflowCandidates(
        requestWorkflow.workflowId,
        candidates,
        token,
        requestLanguage,
        false,
      );
      setRequestOpen(false);
      setRequestSuccessOpen(true);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to send request",
      );
    } finally {
      setSendingRequest(false);
    }
  };

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">
          Your Workflows
        </h1>
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
                <TableCell
                  colSpan={3}
                  className="py-16 text-center text-[13px] text-[#9a9a9a]"
                >
                  No workflows yet.
                </TableCell>
              </TableRow>
            ) : (
              workflows.map((workflow) => (
                <TableRow key={workflow.workflowId} className="cursor-pointer">
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
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 cursor-pointer gap-2 text-[12px]"
                        onClick={() => openRequest(workflow)}
                      >
                        Generate Request
                        <Send className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-6 py-4 text-[13px] text-[#6f7582]">
          <p>
            {loading
              ? "Loading..."
              : `Showing ${currentFrom}-${currentTo} of ${totalCount} Workflow${totalCount === 1 ? "" : "s"}`}
          </p>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page <= 1 || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "cursor-pointer text-[#1f1f1f] hover:bg-white",
                )}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </button>

              {(() => {
                const pages: (number | "...")[] = [];
                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push("...");
                  for (
                    let i = Math.max(2, page - 1);
                    i <= Math.min(totalPages - 1, page + 1);
                    i++
                  ) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push("...");
                  pages.push(totalPages);
                }

                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span
                      key={`ellipsis-${idx}`}
                      className="px-1 text-neutral-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={cn(
                        "h-8 min-w-[32px] rounded-md px-2 text-[13px] transition-colors",
                        p === page
                          ? "bg-[#ff5723] font-semibold text-white"
                          : "cursor-pointer text-[#1f1f1f] hover:bg-white",
                      )}
                    >
                      {p}
                    </button>
                  ),
                );
              })()}

              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[13px] transition-colors",
                  page >= totalPages || loading
                    ? "cursor-not-allowed text-neutral-300"
                    : "cursor-pointer text-[#1f1f1f] hover:bg-white",
                )}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="flex max-h-[90vh] w-[720px] max-w-[720px] flex-col overflow-hidden p-0 gap-0 sm:max-w-[720px]"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-neutral-200 px-5 py-5 sm:px-6 gap-0">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-[16px] font-semibold mb-0.5">
                  Create Workflow
                </DialogTitle>
                <p className="text-[12px] text-[#7a7a7a]">
                  Step {step} of 2 ·{" "}
                  {step === 1 ? "Workflow Setup" : "Verification Configuration"}
                </p>
              </div>
            </div>
            <div className="flex gap-[6px] mt-2">
              <span className="h-1 w-12 rounded-full bg-[#ff5723]" />
              <span
                className={cn(
                  "h-1 w-12 rounded-full",
                  step === 2 ? "bg-[#ff5723]" : "bg-neutral-200",
                )}
              />
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {step === 1 ? (
              <div className="space-y-4 px-6">
                <div>
                  <h2 className="text-[13px] font-semibold text-[#1f1f1f]">
                    Workflow Setup
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                    Configure basic workflow details to define how it appears
                    and communicates with candidates during verification.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Workflow Name <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Input
                    value={form.name}
                    placeholder="eg: Warehouse Staff Verification"
                    onChange={(event) => updateForm("name", event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Workflow Type
                  </Label>
                  <div className="flex h-10 w-full items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-[13px] text-[#3a3a3a]">
                    Skill Assessment
                  </div>
                  <p className="text-[12px] text-[#8a8a8a]">
                    More types coming soon.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-5 px-6">
                <div>
                  <h2 className="text-[13px] font-semibold text-[#1f1f1f]">
                    Add Job Description & skills{" "}
                    <span className="text-[#ff5723]">*</span>
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                    You can add up to two skills and paste the JD. We&apos;ll
                    create questions that match both the skills and role
                    requirements.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Job Title <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Input
                    className="text-[13px]"
                    value={form.jobTitle ?? ""}
                    placeholder="Eg. Picker and Packer"
                    onChange={(event) =>
                      updateForm("jobTitle", event.target.value)
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[13px] text-[#6a6a6a]">
                      Role Type <span className="text-[#ff5723]">*</span>
                    </Label>
                    <Select
                      value={form.roleType ?? ""}
                      onValueChange={(value) => updateForm("roleType", value)}
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-foreground shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground">
                        <SelectValue placeholder="Select role type" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="w-[--radix-select-trigger-width]"
                      >
                        <SelectItem value="Blue collar" className="text-[13px]">
                          Blue collar
                        </SelectItem>
                        <SelectItem
                          value="White collar"
                          className="text-[13px]"
                        >
                          White collar
                        </SelectItem>
                        <SelectItem value="Gig worker" className="text-[13px]">
                          Gig worker
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[13px] text-[#6a6a6a]">
                      Experience Range <span className="text-[#ff5723]">*</span>
                    </Label>
                    <Select
                      value={form.experienceRange ?? ""}
                      onValueChange={(value) =>
                        updateForm("experienceRange", value)
                      }
                    >
                      <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-foreground shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground">
                        <SelectValue placeholder="Select experience range" />
                      </SelectTrigger>
                      <SelectContent
                        position="popper"
                        className="w-[--radix-select-trigger-width]"
                      >
                        <SelectItem value="Fresher" className="text-[13px]">
                          Fresher
                        </SelectItem>
                        <SelectItem value="1 - 2 Years" className="text-[13px]">
                          1 - 2 Years
                        </SelectItem>
                        <SelectItem value="2 - 5 Years" className="text-[13px]">
                          2 - 5 Years
                        </SelectItem>
                        <SelectItem value="5+ Years" className="text-[13px]">
                          5+ Years
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Salary <span className="text-[#ff5723]">*</span>
                  </Label>
                  <div className="flex h-10 overflow-hidden rounded-xl border border-input bg-white shadow-xs">
                    <span className="grid w-9 shrink-0 place-items-center bg-neutral-100 text-[13px] text-[#7a7a7a]">
                      ₹
                    </span>
                    <Input
                      className="h-full rounded-none border-0 text-[13px] shadow-none focus-visible:ring-0"
                      value={form.salary ?? ""}
                      placeholder="Eg. 25000"
                      inputMode="numeric"
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        updateForm("salary", val);
                      }}
                    />
                  </div>
                </div>

                {/* Location — District, State */}
                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Location <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Popover open={locationOpen} onOpenChange={setLocationOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className={cn(
                          "flex h-10 w-full items-center justify-between rounded-xl border border-input bg-white px-3 py-2 text-[13px] shadow-xs transition-colors hover:bg-accent focus:outline-none focus:ring-2 focus:ring-ring",
                          !form.location && "text-muted-foreground",
                        )}
                      >
                        <span className="truncate">
                          {form.location || "Eg. Adilabad, Telangana"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-neutral-400" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="z-[70] w-[--radix-popover-trigger-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput
                          placeholder="Search district or state..."
                          className="h-9 text-[13px]"
                        />
                        <CommandList>
                          <CommandEmpty className="py-4 text-center text-[13px] text-[#9a9a9a]">
                            No location found.
                          </CommandEmpty>
                          <CommandGroup>
                            {ALL_LOCATIONS.map((loc) => (
                              <CommandItem
                                key={loc}
                                value={loc}
                                onSelect={(val) => {
                                  updateForm("location", val);
                                  setLocationOpen(false);
                                }}
                                className="text-[13px]"
                              >
                                {loc}
                                {form.location === loc && (
                                  <Check className="ml-auto h-4 w-4 text-[#ff5723]" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Job Description <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Textarea
                    className="min-h-32 resize-none text-[13px]"
                    maxLength={1500}
                    value={form.jobDescription ?? ""}
                    placeholder="Eg. Hiring candidates with strong role fundamentals..."
                    onChange={(event) =>
                      updateForm("jobDescription", event.target.value)
                    }
                  />
                  <div className="text-right text-[11px] text-[#9a9a9a]">
                    {(form.jobDescription ?? "").length}/1500
                  </div>
                </div>

                <div>
                  <Label className="text-[13px] text-[#6a6a6a]">
                    Skill <span className="text-[#ff5723]">*</span>
                  </Label>
                  {selectedSkills.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {selectedSkills.map((skill) => (
                        <button
                          key={skill.skillId}
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-md bg-neutral-100 px-2.5 py-1.5 text-[12px] text-[#4a4a4a] hover:bg-neutral-200"
                          onClick={() => toggleSkill(skill)}
                        >
                          <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#697282] text-[10px] font-bold text-white">
                            {skill.name.charAt(0).toUpperCase()}
                          </span>
                          <span>{skill.name}</span>
                          <span className="text-[#8a8a8a]">x</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <Button
                    className="mt-2 h-10 gap-2 bg-[#ff5723] text-white hover:bg-[#f04d1d] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                    disabled={skillsLimitReached}
                    onClick={() => setSkillPickerOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add skills
                  </Button>
                  <p className="mt-2 text-[11px] text-[#9a9a9a]">
                    You can add up to 2 skills per workflow.
                  </p>
                </div>

                <div>
                  <h2 className="text-[13px] font-semibold text-[#1f1f1f]">
                    Choose Verification Method{" "}
                    <span className="text-[#ff5723]">*</span>
                  </h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                    Select how candidates should complete the verification. You
                    can choose one method based on the role and requirement.
                  </p>
                  <div className="mt-3 space-y-3">
                    {methods.map((method) => {
                      const Icon = method.icon;
                      const selected = form.verificationMethod === method.value;

                      return (
                        <button
                          key={method.value}
                          type="button"
                          disabled={method.comingSoon}
                          className={cn(
                            "flex w-full items-center gap-4 rounded-lg border px-4 py-4 text-left transition-colors",
                            method.comingSoon
                              ? "cursor-not-allowed border-neutral-200 bg-neutral-50 opacity-70"
                              : selected
                                ? "border-[#ff5723] bg-orange-50"
                                : "border-neutral-200 bg-white hover:bg-neutral-50",
                          )}
                          onClick={() =>
                            !method.comingSoon &&
                            updateForm("verificationMethod", method.value)
                          }
                        >
                          <Icon className="h-5 w-5 text-[#697282]" />
                          <span className="flex-1">
                            <span className="flex items-center gap-2 text-[13px] font-semibold text-[#1f1f1f]">
                              {method.title}
                              {method.comingSoon && (
                                <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-medium text-[#6a6a6a]">
                                  Coming soon...
                                </span>
                              )}
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
          </div>

          <DialogFooter className="shrink-0 border-t border-neutral-200 bg-white px-6 py-5 !flex !flex-row !justify-between">
            <Button
              variant="outline"
              onClick={() => (step === 1 ? setOpen(false) : setStep(1))}
            >
              {step === 1 ? "Cancel" : "Back"}
            </Button>
            {step === 1 ? (
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                onClick={continueToStepTwo}
              >
                Continue
              </Button>
            ) : (
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                disabled={creating}
                onClick={launchWorkflow}
              >
                {creating ? "Creating..." : "Create Workflow"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-[560px] p-0" showCloseButton>
          <div className="grid place-items-center px-8 py-12 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-green-100">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-3xl font-bold text-white">
                ✓
              </div>
            </div>
            <h2 className="mt-5 text-[16px] font-semibold text-[#1f1f1f]">
              Workflow Created Successfully
            </h2>
            <p className="mt-2 text-[13px] text-[#8a8a8a]">
              Your workflow is ready. Add candidates and send your verification.
            </p>
          </div>
          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button variant="outline" onClick={goToDashboard}>
              Back to Dashboard
            </Button>
            <Button
              className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
              onClick={openCreatedWorkflowCandidates}
            >
              Add Candidates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={skillPickerOpen}
        onOpenChange={(value) => !value && closeSkillPicker()}
      >
        <DialogContent className="max-w-[500px] p-0" showCloseButton>
          <DialogHeader className="border-b border-neutral-200 px-5 py-4">
            <DialogTitle className="text-[16px] font-semibold">
              Add Skills
            </DialogTitle>
            <p className="text-[12px] text-[#7a7a7a]">
              Search and select up to 2 skills.
            </p>
          </DialogHeader>

          <div className="space-y-4 px-5">
            {selectedSkills.length > 0 && (
              <div className="space-y-2">
                <p className="text-[12px] font-medium text-[#3a3a3a]">
                  Selected skills
                </p>
                <div className="flex max-h-24 flex-wrap gap-2 overflow-y-auto pr-1">
                  {selectedSkills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-[12px] font-medium text-[#3a3a3a]"
                    >
                      {skill.name}
                      <button
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className="ml-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700"
                        aria-label={`Remove ${skill.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <Input
                className="pl-9 text-[13px]"
                value={skillQuery}
                placeholder="Search skills..."
                autoFocus
                onChange={(event) => setSkillQuery(event.target.value)}
              />
            </div>

            <div className="min-h-44 overflow-hidden rounded-md border border-neutral-200">
              {loadingInitialSkills && trimmedSkillQuery.length < 1 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  Loading skills...
                </p>
              ) : skillSearching ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  Searching...
                </p>
              ) : displayedSkills.length === 0 ? (
                <p className="px-4 py-8 text-center text-[13px] text-[#8a8a8a]">
                  {trimmedSkillQuery.length < 1
                    ? "No skills available."
                    : "No skills found."}
                </p>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {displayedSkills.map((skill) => {
                    const selected = form.skillIds.includes(skill.skillId);
                    return (
                      <label
                        key={skill.skillId}
                        className="flex cursor-pointer items-center gap-3 border-b border-neutral-100 px-4 py-3 last:border-b-0 hover:bg-neutral-50"
                      >
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => {
                            if (!selected && form.skillIds.length >= 2) return;
                            toggleSkill(skill);
                          }}
                        />
                        <span className="flex-1 text-[13px] font-medium text-[#1f1f1f]">
                          {skill.name}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between py-5 text-[12px] text-[#8a8a8a]">
              <span>{form.skillIds.length} of 2 selected</span>
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                onClick={closeSkillPicker}
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={requestOpen} onOpenChange={setRequestOpen}>
        <DialogContent
          className="flex max-h-[88vh] w-[720px] max-w-[720px] sm:max-w-[720px] flex-col overflow-hidden p-0"
          showCloseButton
        >
          <DialogHeader className="shrink-0 border-b border-neutral-200 px-6 py-5">
            <DialogTitle className="text-[16px] font-semibold">
              {requestWorkflow?.name ?? "Generate Request"}
            </DialogTitle>
            <div className="space-y-2">
              <p className="text-[12px] text-[#8a8a8a]">
                Step {requestStep} of 2 &middot;{" "}
                {requestStep === 1
                  ? "Assign Candidates"
                  : "Verification Delivery Settings"}
              </p>
              <div className="flex gap-1">
                <span className="h-1 w-12 rounded-full bg-[#ff5723]" />
                <span
                  className={cn(
                    "h-1 w-12 rounded-full",
                    requestStep === 2 ? "bg-[#ff5723]" : "bg-neutral-200",
                  )}
                />
              </div>
            </div>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {requestStep === 1 ? (
              <div className="space-y-5 px-6 py-5">
                {/* Tabs */}
                <div className="inline-flex rounded-lg bg-neutral-100 p-1">
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-8 py-2 text-[13px]",
                      requestTab === "bulk"
                        ? "bg-white font-medium shadow-sm"
                        : "text-[#7a7a7a]",
                    )}
                    onClick={() => setRequestTab("bulk")}
                  >
                    Bulk Upload
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "rounded-md px-8 py-2 text-[13px]",
                      requestTab === "individual"
                        ? "bg-white font-medium shadow-sm"
                        : "text-[#7a7a7a]",
                    )}
                    onClick={() => setRequestTab("individual")}
                  >
                    Individual Entry
                  </button>
                </div>

                {requestTab === "individual" ? (
                  <div className="space-y-4">
                    {/* Confirmed candidates list */}
                    {manualCandidates.length > 0 && (
                      <div className="space-y-2">
                        {manualCandidates.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
                          >
                            <div>
                              <p className="text-[13px] font-medium text-[#1f1f1f]">
                                {c.name}
                              </p>
                              <p className="text-[12px] text-[#7a7a7a]">
                                +91 {c.phoneNumber}
                                {c.role ? ` - ${c.role}` : ""}
                              </p>
                            </div>
                            <button
                              type="button"
                              className="text-[18px] leading-none text-[#9a9a9a] hover:text-[#1f1f1f]"
                              onClick={() => removeManualCandidate(c.id)}
                            >
                              x
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <h3 className="text-[14px] font-semibold text-[#1f1f1f]">
                      Add Candidate Manually
                    </h3>

                    {/* Form card */}
                    <div className="space-y-4 rounded-xl border border-neutral-200 p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[13px]">
                            Full Name <span className="text-[#ff5723]">*</span>
                          </Label>
                          <Input
                            value={currentManualName}
                            placeholder="eg. Jhon"
                            onChange={(e) =>
                              setCurrentManualName(e.target.value)
                            }
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[13px]">
                            Phone Number{" "}
                            <span className="text-[#ff5723]">*</span>
                          </Label>
                          <div className="flex overflow-hidden rounded-lg border">
                            <span className="grid w-12 shrink-0 place-items-center bg-neutral-100 text-[13px] text-[#7a7a7a]">
                              +91
                            </span>
                            <Input
                              className="rounded-none border-0"
                              value={currentManualPhone}
                              placeholder="6380099916"
                              maxLength={10}
                              inputMode="numeric"
                              onChange={(e) =>
                                setCurrentManualPhone(
                                  e.target.value
                                    .replace(/[^\d]/g, "")
                                    .slice(0, 10),
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[13px]">
                          Role being verified{" "}
                          <span className="text-[#ff5723]">*</span>
                        </Label>
                        <Input
                          value={currentManualRole}
                          placeholder="eg: Picker and Packer, Driver, Security Guard"
                          onChange={(e) => setCurrentManualRole(e.target.value)}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCurrentManualName("");
                            setCurrentManualPhone("");
                            setCurrentManualRole("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          className="bg-[#1a1a1a] text-white hover:bg-[#333]"
                          onClick={addManualCandidate}
                        >
                          Add
                        </Button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="flex items-center gap-1.5 text-[13px] text-[#6a6a6a] hover:text-[#1f1f1f]"
                      onClick={() => {
                        setCurrentManualName("");
                        setCurrentManualPhone("");
                        setCurrentManualRole("");
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add another candidate
                    </button>

                    <p className="text-[12px] text-[#7a7a7a]">
                      The AI will reach out to this candidate using the method
                      set in your workflow.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-[14px] font-semibold text-[#1f1f1f]">
                        Upload Candidates via CSV
                      </h3>
                      <p className="mt-1 text-[13px] text-[#7a7a7a]">
                        Upload a CSV file with candidate details (Name, Phone
                        Number) to request multiple candidates to the workflow
                        at once.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[13px]">
                        Role being verified{" "}
                        <span className="text-[#ff5723]">*</span>
                      </Label>
                      <Input
                        value={requestRole}
                        placeholder="eg: Picker and Packer, Driver, Security Guard"
                        onChange={(e) => setRequestRole(e.target.value)}
                      />
                    </div>

                    {csvCandidates.length === 0 ? (
                      <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-neutral-300 bg-neutral-50">
                        <div className="text-center">
                          <FileUp className="mx-auto h-10 w-10 text-[#ff5723]" />
                          <p className="mt-3 text-[14px] font-medium text-[#1f1f1f]">
                            Upload a CSV file with your candidate list (only
                            CSV)
                          </p>
                          <p className="mt-1 text-[12px] leading-5 text-[#9a9a9a]">
                            Support for a single or bulk upload. File must
                            include:
                            <br />
                            Candidate Name, Mobile Number, Role.
                          </p>
                          <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-[12px] shadow-sm hover:bg-neutral-50">
                            Upload files
                            <Upload className="h-3.5 w-3.5" />
                            <input
                              type="file"
                              accept=".csv,text/csv"
                              className="hidden"
                              onChange={(event) => {
                                const file = event.target.files?.[0];
                                if (file) void parseCsv(file);
                              }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <h3 className="text-[14px] font-semibold text-[#1f1f1f]">
                            {requestRole || "Candidates"} –{" "}
                            {requestWorkflow?.name}
                          </h3>
                          <p className="text-[13px] text-[#9a9a9a]">
                            Total: {csvCandidates.length} candidates
                          </p>
                        </div>
                        <div className="overflow-hidden rounded-md border border-neutral-200">
                          <div className="grid grid-cols-2 border-b bg-neutral-50 px-4 py-3 text-[12px] font-medium text-[#6f7582]">
                            <span>Candidate Name</span>
                            <span>
                              Candidate Phone Number{" "}
                              <span className="text-[#ff5723]">*</span>
                            </span>
                          </div>
                          {csvCandidates.slice(0, 5).map((candidate, index) => (
                            <div
                              key={`${candidate.phoneNumber}-${index}`}
                              className="grid grid-cols-2 border-b px-4 py-4 text-[13px] last:border-b-0"
                            >
                              <span className="font-medium text-[#1f1f1f]">
                                {candidate.name}
                              </span>
                              <span className="text-[#4a4a4a]">
                                {candidate.phoneNumber}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-[12px] text-[#7a7a7a]">
                          &ldquo;0&rdquo; In-list Duplicates Removed
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <a
                        href="#"
                        className="text-[12px] text-[#4a4a4a] underline underline-offset-2 hover:text-[#1f1f1f]"
                      >
                        Download sample CSV
                      </a>
                      <span className="text-[12px] text-[#9a9a9a]">
                        Max file size: 10MB
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-5 px-6 py-5">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#1f1f1f]">
                    Configure Verification Delivery
                  </h3>
                  <p className="mt-1 text-[12px] leading-5 text-[#7a7a7a]">
                    Set how verification links should be delivered and customize
                    the messages shown to candidates during the verification
                    process.
                  </p>
                </div>

                {/* Select Workflow */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1">
                    <Label className="text-[13px]">
                      Select Workflow <span className="text-[#ff5723]">*</span>
                    </Label>
                    <Info className="h-3.5 w-3.5 text-[#9a9a9a]" />
                  </div>
                  <Select value={requestWorkflow?.workflowId ?? ""} disabled>
                    <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-foreground shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground">
                      <SelectValue>
                        {requestWorkflow
                          ? `${requestWorkflow.name} – ${requestWorkflow.verificationMethod} + WhatsApp`
                          : ""}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="w-[--radix-select-trigger-width]"
                    >
                      {requestWorkflow && (
                        <SelectItem value={requestWorkflow.workflowId}>
                          {requestWorkflow.name} –{" "}
                          {requestWorkflow.verificationMethod} + WhatsApp
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Workflow summary */}
                <div className="space-y-2">
                  <h4 className="text-[13px] font-semibold text-[#1f1f1f]">
                    Workflow summary
                  </h4>
                  <p className="text-[12px] text-[#7a7a7a]">
                    Verification Method
                  </p>
                  {requestWorkflow && (
                    <div className="flex items-start gap-4 rounded-lg border border-[#ff5723] bg-orange-50 px-4 py-4">
                      <Video className="mt-0.5 h-5 w-5 shrink-0 text-[#ff5723]" />
                      <div>
                        <p className="text-[13px] font-semibold text-[#ff5723]">
                          {requestWorkflow.verificationMethod === "video"
                            ? "Video Verification"
                            : "Voice Verification"}
                        </p>
                        <p className="mt-1 text-[12px] text-[#6a6a6a]">
                          {requestWorkflow.verificationMethod === "video"
                            ? "Candidate receives a WhatsApp link and completes a short video conversation with the AI. Higher confidence result."
                            : "AI calls the candidate on their phone and has a 10-minute conversation in their language."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Role being verified */}
                <div className="space-y-1.5">
                  <Label className="text-[13px]">
                    Role being verified{" "}
                    <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Input
                    className="text-[13px]"
                    value={requestRole}
                    placeholder="Eg. Picker and Packer, Driver, Security Guard"
                    onChange={(e) => setRequestRole(e.target.value)}
                  />
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <Label className="text-[13px]">
                    Language for this batch{" "}
                    <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Select
                    value={requestLanguage || "english"}
                    onValueChange={setRequestLanguage}
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-foreground shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground">
                      <SelectValue placeholder="Select language">
                        {requestLanguage
                          ? requestLanguage.charAt(0).toUpperCase() +
                            requestLanguage.slice(1)
                          : "English"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="w-[--radix-select-trigger-width] bg-white"
                    >
                      <SelectItem
                        value="english"
                        className="bg-white text-[13px] focus:bg-neutral-50 data-[state=checked]:bg-white"
                      >
                        English
                      </SelectItem>
                      <SelectItem
                        value="tamil"
                        className="bg-white text-[13px] focus:bg-neutral-50 data-[state=checked]:bg-white"
                      >
                        Tamil
                      </SelectItem>
                      <SelectItem
                        value="kannada"
                        className="bg-white text-[13px] focus:bg-neutral-50 data-[state=checked]:bg-white"
                      >
                        Kannada
                      </SelectItem>
                      <SelectItem
                        value="hindi"
                        className="bg-white text-[13px] focus:bg-neutral-50 data-[state=checked]:bg-white"
                      >
                        Hindi
                      </SelectItem>
                      <SelectItem
                        value="telugu"
                        className="bg-white text-[13px] focus:bg-neutral-50 data-[state=checked]:bg-white"
                      >
                        Telugu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Link expiry */}
                <div className="space-y-1.5">
                  <Label className="text-[13px]">
                    Link expiry <span className="text-[#ff5723]">*</span>
                  </Label>
                  <Select
                    value={requestLinkExpiry}
                    onValueChange={setRequestLinkExpiry}
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-0 bg-neutral-100 text-[13px] text-foreground shadow-none focus:ring-0 focus:ring-offset-0 data-[placeholder]:text-muted-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent
                      position="popper"
                      className="w-[--radix-select-trigger-width]"
                    >
                      {["7 Days", "14 Days", "30 Days"].map((expiry) => (
                        <SelectItem
                          key={expiry}
                          value={expiry}
                          className="text-[13px]"
                        >
                          {expiry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Candidate summary */}
                <div className="space-y-1">
                  <h4 className="text-[13px] font-semibold text-[#1f1f1f]">
                    Candidate summary
                  </h4>
                  <p className="text-[13px] text-[#7a7a7a]">
                    &ldquo;
                    {requestTab === "bulk"
                      ? csvCandidates.length
                      : manualCandidates.length}{" "}
                    candidates ready to receive verification.&rdquo;
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 border-t border-neutral-200 bg-white px-5 py-4">
            <Button
              variant="outline"
              onClick={() =>
                requestStep === 1 ? setRequestOpen(false) : setRequestStep(1)
              }
            >
              {requestStep === 1 ? "Cancel" : "Back"}
            </Button>
            {requestStep === 1 ? (
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                onClick={continueToRequestStep2}
              >
                {requestTab === "bulk" && csvCandidates.length > 0
                  ? "Add Candidate"
                  : "Continue"}
              </Button>
            ) : (
              <Button
                className="bg-[#ff5723] text-white hover:bg-[#f04d1d]"
                disabled={sendingRequest}
                onClick={sendRequest}
              >
                {sendingRequest ? "Sending..." : "Send Verification"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={requestSuccessOpen} onOpenChange={setRequestSuccessOpen}>
        <DialogContent className="max-w-[520px] p-0" showCloseButton>
          <div className="grid place-items-center px-8 py-12 text-center">
            <div className="grid h-20 w-20 place-items-center rounded-full bg-green-100">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-green-500 text-3xl font-bold text-white">
                ✓
              </div>
            </div>
            <h2 className="mt-5 text-[16px] font-semibold">
              Verification Request Sent Successfully
            </h2>
            <p className="mt-2 text-[13px] text-[#8a8a8a]">
              Your workflow has been successfully configured and verification
              requests have been sent to the selected candidates.
            </p>
          </div>
          <DialogFooter className="border-t border-neutral-200 px-5 py-4">
            <Button
              variant="outline"
              onClick={() => setRequestSuccessOpen(false)}
            >
              Back to Dashboard
            </Button>
            <Button
              className="bg-[#1a1a1a] text-white hover:bg-[#333]"
              onClick={() => setRequestSuccessOpen(false)}
            >
              View Requests
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
