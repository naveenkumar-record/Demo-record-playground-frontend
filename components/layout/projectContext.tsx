"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { OrgProject, listProjects, createProject, deleteProject } from "@/api/project.api";
import { getAccessToken } from "@/lib/auth-client";
import { useOrg } from "./orgContext";

const ACTIVE_PROJECT_KEY = "activeProjectId";

type ProjectContextValue = {
  projects:         OrgProject[];
  activeProject:    OrgProject | null;
  loading:          boolean;
  setActiveProject: (p: OrgProject | null) => void;
  addProject:       (name: string, orgId: string) => Promise<OrgProject>;
  removeProject:    (projectId: string, orgId: string) => Promise<void>;
  refreshProjects:  (orgId: string) => Promise<void>;
};

const ProjectContext = createContext<ProjectContextValue>({
  projects:         [],
  activeProject:    null,
  loading:          false,
  setActiveProject: () => {},
  addProject:       async () => { throw new Error("Not initialised"); },
  removeProject:    async () => {},
  refreshProjects:  async () => {},
});

export function ProjectProvider({
  orgId,
  children,
}: {
  orgId:    string | null;
  children: ReactNode;
}) {
  const [projects,      setProjects]      = useState<OrgProject[]>([]);
  const [activeProject, setActiveProject] = useState<OrgProject | null>(null);
  const [loading,       setLoading]       = useState(false);

  const fetchProjects = useCallback(async (id: string) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    // Reset immediately so stale project from previous org is never used
    setProjects([]);
    setActiveProject(null);
    try {
      const res = await listProjects(id, token);
      const list = res.data ?? [];
      setProjects(list);

      if (list.length === 0) {
        // No projects for this org — leave activeProject as null
        setActiveProject(null);
        return;
      }

      // Restore last selected project or default to first
      const saved = typeof window !== "undefined"
        ? localStorage.getItem(ACTIVE_PROJECT_KEY)
        : null;
      const found = saved ? list.find(p => p.projectId === saved) : null;
      setActiveProject(found ?? list[0]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (orgId) {
      fetchProjects(orgId);
    } else {
      setProjects([]);
      setActiveProject(null);
    }
  }, [orgId, fetchProjects]);

  const handleSetActive = (p: OrgProject | null) => {
    if (p) {
      localStorage.setItem(ACTIVE_PROJECT_KEY, p.projectId);
    } else {
      localStorage.removeItem(ACTIVE_PROJECT_KEY);
    }
    setActiveProject(p);
  };

  const addProject = async (name: string, id: string): Promise<OrgProject> => {
    const token = getAccessToken();
    if (!token) throw new Error("Not authenticated");
    const res = await createProject(id, name, token);
    if (!res.data) throw new Error("Failed to create project");
    const newProj = res.data;
    setProjects(prev => [...prev, newProj]);
    // Auto-select the new project if no project is currently active
    setActiveProject(prev => prev ?? newProj);
    return newProj;
  };

  const removeProject = async (projectId: string, id: string) => {
    const token = getAccessToken();
    if (!token) return;
    await deleteProject(id, projectId, token);
    setProjects(prev => {
      const next = prev.filter(p => p.projectId !== projectId);
      setActiveProject(ap =>
        ap?.projectId === projectId ? (next[0] ?? null) : ap,
      );
      return next;
    });
  };

  return (
    <ProjectContext.Provider value={{
      projects,
      activeProject,
      loading,
      setActiveProject: handleSetActive,
      addProject,
      removeProject,
      refreshProjects: fetchProjects,
    }}>
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => useContext(ProjectContext);

// ── Bridge: reads activeOrg from OrgContext and feeds live orgId into ProjectProvider ──
export function ProjectBridge({ children }: { children: ReactNode }) {
  const { activeOrg } = useOrg();
  return (
    <ProjectProvider orgId={activeOrg?.orgId ?? null}>
      {children}
    </ProjectProvider>
  );
}
