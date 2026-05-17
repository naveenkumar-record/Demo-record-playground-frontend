"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { OrgData } from "@/api/user-access.api";

const ACTIVE_ORG_KEY = "activeOrgId";

type OrgContextValue = {
  organizations: OrgData[];
  activeOrg: OrgData | null;
  setActiveOrg: (org: OrgData) => void;
};

const OrgContext = createContext<OrgContextValue>({
  organizations: [],
  activeOrg: null,
  setActiveOrg: () => {},
});

export function OrgProvider({
  organizations,
  children,
}: {
  organizations: OrgData[];
  children: ReactNode;
}) {
  const [activeOrg, setActiveOrgState] = useState<OrgData | null>(() => {
    // Restore previously selected org from localStorage
    if (typeof window !== "undefined") {
      const savedOrgId = localStorage.getItem(ACTIVE_ORG_KEY);
      if (savedOrgId) {
        const found = organizations.find((o) => o.orgId === savedOrgId);
        if (found) return found;
      }
    }
    return organizations[0] ?? null;
  });

  const setActiveOrg = (org: OrgData) => {
    localStorage.setItem(ACTIVE_ORG_KEY, org.orgId);
    setActiveOrgState(org);
  };

  return (
    <OrgContext.Provider value={{ organizations, activeOrg, setActiveOrg }}>
      {children}
    </OrgContext.Provider>
  );
}

export const useOrg = () => useContext(OrgContext);
