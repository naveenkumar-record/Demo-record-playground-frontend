"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangleIcon,
  FolderIcon,
  Loader2,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { Button }   from "@/components/ui/button";
import { Input }    from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useOrg }     from "@/components/layout/orgContext";
import { useProject } from "@/components/layout/projectContext";
import { getAccessToken } from "@/lib/auth-client";
import {
  listProjects,
  createProject,
  deleteProject,
  type OrgProject,
} from "@/api/project.api";

export default function ProjectsSettingsPage() {
  const { activeOrg }       = useOrg();
  const { refreshProjects } = useProject();

  const [projects, setProjects] = useState<OrgProject[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [search,   setSearch]   = useState("");

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName,    setNewName]    = useState("");
  const [creating,   setCreating]   = useState(false);
  const [nameError,  setNameError]  = useState<string | null>(null);

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<OrgProject | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    listProjects(activeOrg.orgId, token)
      .then(r => setProjects(r.data ?? []))
      .catch(() => toast.error("Failed to load projects"))
      .finally(() => setLoading(false));
  }, [activeOrg?.orgId]);

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.createdByEmail?.toLowerCase().includes(search.toLowerCase()),
  );

  // ── Create ────────────────────────────────────────────────────────────────

  const handleCreate = async () => {
    if (!newName.trim()) { setNameError("Project name is required"); return; }
    if (!activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    setCreating(true);
    setNameError(null);
    try {
      const res = await createProject(activeOrg.orgId, newName.trim(), token);
      if (res.data) {
        setProjects(prev => [...prev, res.data!]);
        setNewName("");
        setCreateOpen(false);
        toast.success("Project created");
        refreshProjects(activeOrg.orgId);
      }
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  const handleCloseCreate = () => {
    setNewName("");
    setNameError(null);
    setCreateOpen(false);
  };



  const handleConfirmDelete = async () => {
    if (!deleteTarget || !activeOrg?.orgId) return;
    const token = getAccessToken();
    if (!token) return;

    setDeleting(true);
    try {
      await deleteProject(activeOrg.orgId, deleteTarget.projectId, token);
      setProjects(prev => prev.filter(p => p.projectId !== deleteTarget.projectId));
      toast.success(`"${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
      refreshProjects(activeOrg.orgId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };


  return (
    <div className="w-full p-4 sm:p-8 pb-16 space-y-6">

      {/* Page header */}
      <div>
        <h2 className="text-lg font-bold text-[#1a1a1a]">Projects</h2>
        <p className="mt-1 text-sm text-[#8a8a8a]">
          Manage projects within your organization. Each project can group related workflows.
        </p>
      </div>

      {/* Search + Create button row */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#aaa] pointer-events-none" />
          <Input
            placeholder="Search projects"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="h-10 pl-9 text-[13px]"
          />
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-10 bg-orange-600 hover:bg-orange-600 text-white text-[13px] gap-1.5 shrink-0"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          Create Project
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-14 rounded-lg" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[#d4d4d4] py-16 text-center">
          <FolderIcon className="h-8 w-8 text-[#d4d4d4]" />
          <p className="text-[13px] text-[#9a9a9a]">
            No projects yet.{" "}
            <button
              className="underline underline-offset-2 hover:text-[#555] transition-colors"
              onClick={() => setCreateOpen(true)}
            >
              Create your first project
            </button>
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[#d4d4d4] py-10 text-center">
          <SearchIcon className="h-6 w-6 text-[#d4d4d4]" />
          <p className="text-[13px] text-[#9a9a9a]">No projects match "{search}"</p>
        </div>
      ) : (
        <div className="rounded-lg border border-[#e7e7e7] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead className="bg-[#fafafa] text-[#7a7a7a]">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Project Name</th>
                <th className="text-left px-4 py-3 font-medium">Created By</th>
                <th className="text-left px-4 py-3 font-medium">Workflows</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.projectId} className="border-t border-[#f0f0f0] hover:bg-[#fafafa]">

                  {/* Name + ID */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FolderIcon className="h-4 w-4 text-[#aaa] shrink-0" />
                      <span className="font-medium text-[#1a1a1a]">{p.name}</span>
                    </div>
                    <p className="text-[11px] text-[#bbb] mt-0.5 pl-6">{p.projectId}</p>
                  </td>

                  {/* Created by — email */}
                  <td className="px-4 py-3 text-[#6a6a6a]">
                    {p.createdByEmail ?? p.createdBy}
                  </td>

                  {/* Workflow count */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium ${
                      p.workflowCount > 0
                        ? "bg-orange-50 text-orange-600"
                        : "bg-orange-50 text-orange-600"
                    }`}>
                      {p.workflowCount} {p.workflowCount === 1 ? "workflow" : "workflows"}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-[#9a9a9a]">
                    {new Date(p.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric",
                    })}
                  </td>

                  {/* Delete */}
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-md text-[#ccc] hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Delete project"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>

        </div>
      )}


      <Dialog open={createOpen} onOpenChange={handleCloseCreate}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Create Project</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-[#555]">Project name</label>
              <Input
                placeholder="e.g. Hiring Pipeline 2026"
                value={newName}
                onChange={e => { setNewName(e.target.value); setNameError(null); }}
                onKeyDown={e => e.key === "Enter" && handleCreate()}
                autoFocus
                className="text-[13px]"
              />
              {nameError && (
                <p className="text-[12px] text-red-500">{nameError}</p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCloseCreate}
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="bg-orange-600 text-white"
              >
                {creating
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Creating…</>
                  : "Create project"
                }
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Delete Warning Modal ─────────────────────────────────────────────── */}
      <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[15px]">
              <AlertTriangleIcon className="h-5 w-5 text-red-500 shrink-0" />
              Delete Project?
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 text-[13px] text-[#555]">
            <p>
              You are about to delete{" "}
              <strong className="text-[#1a1a1a]">"{deleteTarget?.name}"</strong>.
            </p>
            {(deleteTarget?.workflowCount ?? 0) > 0 ? (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 p-3">
                <AlertTriangleIcon className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                <p className="text-red-700">
                  This will also permanently delete{" "}
                  <strong>
                    {deleteTarget?.workflowCount}{" "}
                    {deleteTarget?.workflowCount === 1 ? "workflow" : "workflows"}
                  </strong>{" "}
                  associated with this project. This action cannot be undone.
                </p>
              </div>
            ) : (
              <p className="text-[#8a8a8a]">This action cannot be undone.</p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleConfirmDelete}
              disabled={deleting}
            >
              {deleting
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Deleting…</>
                : "Delete project"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
