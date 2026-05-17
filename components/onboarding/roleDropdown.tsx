"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const roles = [
  {
    value: "superadmin",
    name: "Super Admin",
    copy: "can modify project information and manage team members",
  },
  {
    value: "reader",
    name: "Reader",
    copy: "can make API requests that read organization data",
  },
] as const;

type Role = (typeof roles)[number]["value"];

export function RoleDropdown() {
  const [selected, setSelected] = useState<"" | Role>("");

  return (
    <div className="mt-0">
      <input type="hidden" name="role" value={selected} />
      <Select value={selected || undefined} onValueChange={(value) => setSelected(value as Role)}>
        <SelectTrigger className="app-text-button h-[36px] w-full rounded-[9px] border-[#e3e3e3] px-3">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent position="popper" className="w-[var(--radix-select-trigger-width)]">
          {roles.map((role) => (
            <SelectItem key={role.value} value={role.value}>
              {role.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected ? (
        <p className="mt-1.5 text-[12px] leading-[1.3] text-[#6d6d6d]">
          {roles.find((role) => role.value === selected)?.copy}
        </p>
      ) : null}
    </div>
  );
}
