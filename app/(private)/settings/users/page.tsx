"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { PlusIcon, PencilIcon } from "lucide-react";
import { getAccessToken } from "@/lib/auth-client";
import { useOrg } from "@/components/layout/orgContext";
import {
  getOrgMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
  MemberData,
  OrgMembersData,
  OrgRole,
  InviteRole,
} from "@/api/user-access.api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangleIcon } from "lucide-react";

const ROLE_RANK: Record<OrgRole, number> = {
  owner: 3,
  superadmin: 2,
  reader: 1,
};

const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Organization Owner",
  superadmin: "Super Admin",
  reader: "Reader",
};

const ROLE_BADGE_CLASS: Record<OrgRole, string> = {
  owner: "bg-neutral-100 text-neutral-700",
  superadmin: "bg-neutral-100 text-neutral-700",
  reader: "bg-neutral-100 text-neutral-700",
};

function canManage(viewerRole: OrgRole, targetRole: OrgRole): boolean {
  return ROLE_RANK[viewerRole] > ROLE_RANK[targetRole];
}

export default function SettingsUsersPage() {
  const { activeOrg } = useOrg();
  const [data, setData] = useState<OrgMembersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<MemberData | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole | "">("");
  const [inviting, setInviting] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<MemberData | null>(null);
  const fetchedRef = useRef("");

  const fetchMembers = useCallback(async (orgId: string) => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    try {
      const res = await getOrgMembers(orgId, token);
      if (res.data) setData(res.data);
    } catch {
      toast.message("Failed to load members");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!activeOrg?.orgId) return;
    if (fetchedRef.current === activeOrg.orgId) return;
    fetchedRef.current = activeOrg.orgId;
    setData(null);

    const orgId = activeOrg.orgId;
    const token = getAccessToken();
    if (!token) return;

    setLoading(true);
    getOrgMembers(orgId, token)
      .then((res) => {
        if (fetchedRef.current !== orgId) return;
        if (res.data) setData(res.data);
      })
      .catch(() => {
        if (fetchedRef.current !== orgId) return;
        toast.message("Failed to load members");
        setData(null);
      })
      .finally(() => {
        if (fetchedRef.current === orgId) setLoading(false);
      });
  }, [activeOrg?.orgId]);

  const handleInviteOrUpdate = async () => {
    if (!activeOrg) return;
    if (!inviteRole) {
      toast.message("Please select a role");
      return;
    }

    const token = getAccessToken();
    if (!token) return;
    setInviting(true);

    try {
      if (editingMember) {
        await updateMemberRole(
          activeOrg.orgId,
          editingMember.userId,
          inviteRole,
          token,
        );
        toast.message("Role updated");
      } else {
        await inviteMember(
          {
            orgId: activeOrg.orgId,
            email: inviteEmail.trim().toLowerCase(),
            role: inviteRole,
          },
          token,
        );
        toast.message("Member invited");
      }

      setModalOpen(false);
      setInviteEmail("");
      setInviteRole("");
      setEditingMember(null);

      await fetchMembers(activeOrg.orgId);
    } catch (err: unknown) {
      toast.message(err instanceof Error ? err.message : "Operation failed");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (member: MemberData) => {
    if (!activeOrg) return;

    const token = getAccessToken();
    if (!token) return;

    setRemovingId(member.userId);

    try {
      await removeMember(activeOrg.orgId, member.userId, token);
      toast.message("Member removed");
      setRemoveTarget(null);
      await fetchMembers(activeOrg.orgId);
    } catch {
      toast.message("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  };

  const viewerRole = (activeOrg?.userRole ?? "reader") as OrgRole;
  const canInvite = viewerRole !== "reader";

  const filteredMembers =
    data?.members.filter((member) => {
      const roleLabel = ROLE_LABEL[member.role as OrgRole];
      return (
        member.email.toLowerCase().includes(search.toLowerCase()) ||
        roleLabel.toLowerCase().includes(search.toLowerCase())
      );
    }) ?? [];

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Users</h1>
      <div>
        <button className="cursor-pointer pb-2 text-[13px] border-b-2 border-black">
          Members
        </button>
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="Search Members"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        {canInvite && (
          <Button
            className="bg-orange-600 hover:bg-orange-600 text-white gap-2"
            onClick={() => {
              setEditingMember(null);
              setInviteEmail("");
              setModalOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" />
            Add Members
          </Button>
        )}
      </div>
      <div className="border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[#7a7a7a]">
            Loading members...
          </div>
        ) : (
          filteredMembers.map((member) => {
            const role = member.role as OrgRole;
            const manageable = canManage(viewerRole, role);

            return (
              <div
                key={member.userId}
                className="grid grid-cols-[40px_1fr_520px_180px] items-center px-3 py-2 border-b last:border-0"
              >
                <div className="w-10 h-10 rounded-full bg-neutral-200 flex items-center justify-center text-[13px] font-semibold text-neutral-700">
                  {member.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-[#1f1f1f] !ml-2">
                    {member.email}
                  </p>
                </div>
                <Badge className={`${ROLE_BADGE_CLASS[role]} w-fit`}>
                  {ROLE_LABEL[role]}
                </Badge>

                <div className="flex justify-end gap-3">
                  {manageable && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="px-3 py-4 !bg-white"
                      disabled={removingId === member.userId}
                      onClick={(e) => {
                        e.stopPropagation();
                        setRemoveTarget(member);
                      }}
                    >
                      Remove
                    </Button>
                  )}
                  {manageable && (
                    <Button
                      variant="outline"
                      size="xs"
                      className="px-3 py-4 gap-1 !bg-white"
                      onClick={() => {
                        setEditingMember(member);
                        setInviteEmail(member.email);
                        setInviteRole(role as InviteRole);
                        setModalOpen(true);
                      }}
                    >
                      <PencilIcon className="h-3.5 w-3.5" />
                      Role
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Remove member confirmation modal */}
      <Dialog
        open={!!removeTarget}
        onOpenChange={(open) => { if (!open) setRemoveTarget(null); }}
      >
        <DialogContent className="sm:max-w-md rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[17px] font-semibold">
              <AlertTriangleIcon className="h-5 w-5 text-red-500" />
              Remove member?
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-[13px] text-[#5a5a5a]">
            This will remove{" "}
            <span className="font-medium text-[#1f1f1f]">
              {removeTarget?.email}
            </span>{" "}
            from your organization. This action cannot be undone.
          </p>
          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="outline"
              onClick={() => setRemoveTarget(null)}
              disabled={!!removingId}
            >
              Cancel
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={removingId === removeTarget?.userId}
              onClick={() => removeTarget && handleRemove(removeTarget)}
            >
              {removingId === removeTarget?.userId ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add / Edit member modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {editingMember ? "Edit member role" : "Add member"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 space-y-5">
            <div className="space-y-2">
              <Label className="text-sm">Email</Label>
              {editingMember ? (
                <div className="h-11 flex items-center rounded-lg border px-3 text-sm bg-neutral-50">
                  {inviteEmail}
                </div>
              ) : (
                <Input
                  placeholder="name@company.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-10 rounded-lg"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-[#1f1f1f]">
                Manage Role
              </Label>
              <Select
                value={inviteRole || undefined}
                onValueChange={(v) => setInviteRole(v as InviteRole)}
              >
                <SelectTrigger className="h-11 w-full rounded-lg border-[#e5e5e5] bg-white px-3 text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="superadmin">Super Admin</SelectItem>
                  <SelectItem value="reader">Reader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="mt-6 gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleInviteOrUpdate}
              disabled={inviting}
              className="bg-orange-600 hover:bg-orange-600 text-white"
            >
              {editingMember ? "Save" : "Add Member"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
