"use client";

import { useRouter } from "next/navigation";
import { ChevronDown, MoreVertical, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type RequestStatus = "Completed" | "Sent" | "Expired";
type TrustScore = "High Trust" | "Low Trust" | "Pending";
type Verdict = "Place" | "Review" | "Do Not Place";

type CandidateRequest = {
  id: string;
  candidateName: string;
  phoneNumber: string;
  status: RequestStatus;
  workflowName: string;
  requestedOn: string;
  trustScore: TrustScore;
  verdict: Verdict;
};

const MOCK_REQUESTS: CandidateRequest[] = [
  {
    id: "tony",
    candidateName: "Sachu",
    phoneNumber: "0987654321",
    status: "Completed",
    workflowName: "RFS-User verification",
    requestedOn: "07 Jan 2026",
    trustScore: "High Trust",
    verdict: "Place",
  },
  {
    id: "tony-2",
    candidateName: "Tony",
    phoneNumber: "0987654321",
    status: "Sent",
    workflowName: "RFS-User verification",
    requestedOn: "07 Jan 2026",
    trustScore: "Low Trust",
    verdict: "Review",
  },
  {
    id: "leo",
    candidateName: "Leo",
    phoneNumber: "0987654321",
    status: "Expired",
    workflowName: "RFC-User verification",
    requestedOn: "07 Jan 2026",
    trustScore: "Pending",
    verdict: "Do Not Place",
  },
];

function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        status === "Completed" && "bg-green-100 text-green-600",
        status === "Sent" && "bg-amber-50 text-amber-500",
        status === "Expired" && "bg-red-50 text-red-500",
      )}
    >
      {status}
    </span>
  );
}

function TrustBadge({ score }: { score: TrustScore }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium",
        score === "High Trust" && "bg-green-100 text-green-600",
        score === "Low Trust" && "bg-amber-100 text-amber-600",
        score === "Pending" && "bg-neutral-100 text-neutral-600",
      )}
    >
      {score}
    </span>
  );
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-[12px] font-medium",
        verdict === "Place" && "border-green-200 text-green-600",
        verdict === "Review" && "border-amber-200 text-amber-600",
        verdict === "Do Not Place" && "border-red-200 text-red-500",
      )}
    >
      {verdict}
    </span>
  );
}

function FilterButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-[#4a4a4a] hover:bg-neutral-50"
    >
      {label}
      <ChevronDown className="h-3.5 w-3.5 text-neutral-400" />
    </button>
  );
}

export default function RequestsPage() {
  const router = useRouter();

  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Your Requests</h1>
        <div className="flex items-center gap-2">
          <FilterButton label="Choose Workflow" />
          <FilterButton label="Status" />
          <FilterButton label="Trust Score" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              className="h-9 w-52 pl-9 text-[13px]"
              placeholder="Search Candidate."
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-white hover:bg-white">
              <TableHead className="h-12 px-5 text-[13px] font-medium text-[#7a7a7a]">
                Candidate Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Phone Number
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Status
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Workflow Name
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Requested On
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Trust Score
              </TableHead>
              <TableHead className="text-[13px] font-medium text-[#7a7a7a]">
                Verdict
              </TableHead>
              <TableHead className="pr-5 text-right text-[13px] font-medium text-[#7a7a7a]">
                Action
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {MOCK_REQUESTS.map((req) => (
              <TableRow
                key={req.id}
                className="cursor-pointer hover:bg-neutral-50"
                onClick={() => router.push(`/bluecollar/requests/${req.id}`)}
              >
                <TableCell className="px-5 py-4 text-[13px] font-semibold text-[#1f1f1f]">
                  {req.candidateName}
                </TableCell>
                <TableCell className="text-[13px] text-[#4a4a4a]">
                  {req.phoneNumber}
                </TableCell>
                <TableCell>
                  <StatusBadge status={req.status} />
                </TableCell>
                <TableCell className="text-[13px] text-[#4a4a4a]">
                  {req.workflowName}
                </TableCell>
                <TableCell className="text-[13px] text-[#4a4a4a]">
                  {req.requestedOn}
                </TableCell>
                <TableCell>
                  <TrustBadge score={req.trustScore} />
                </TableCell>
                <TableCell>
                  <VerdictBadge verdict={req.verdict} />
                </TableCell>
                <TableCell className="pr-5 text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-[#697282]" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between border-t border-neutral-200 px-5 py-4 text-[13px] text-[#7a7a7a]">
          <p>Showing 5 of 24 Candidates</p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="cursor-pointer text-[13px]">
              &lsaquo; Previous
            </Button>
            <span className="rounded-md border border-neutral-200 px-3 py-1 text-[#1f1f1f]">1</span>
            <button type="button" className="cursor-pointer px-2 py-1 text-[13px] text-[#6a6a6a] hover:text-[#1f1f1f]">2</button>
            <button type="button" className="cursor-pointer px-2 py-1 text-[13px] text-[#6a6a6a] hover:text-[#1f1f1f]">3</button>
            <span className="text-[#9a9a9a]">...</span>
            <Button variant="ghost" size="sm" className="cursor-pointer text-[13px]">
              Next &rsaquo;
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
