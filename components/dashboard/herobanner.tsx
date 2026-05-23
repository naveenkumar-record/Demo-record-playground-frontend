"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Plus } from "lucide-react";

export default function HeroBanner() {
  const router = useRouter();

  return (
    <div className="rounded-xl bg-gradient-to-r from-[#FFF7ED] to-[#FAFAFA] px-11 flex items-center justify-between">
      {" "}
      <div className="max-w-full">
        <h1 className="text-4xl font-semibold text-black">
          Build, Test & Deploy AI Workflows
        </h1>
        <p className="mt-2 text-lg text-[#959595] max-w-[650px] leading-relaxed">
          Create intelligent verification workflows, test them in the
          sandbox, and integrate via API in minutes.
        </p>

        <div className="mt-4 flex gap-3">
          <Button
            className="bg-[#FF5723] hover:bg-[#FF5723] text-white text-sm px-6 py-2 h-9 cursor-pointer"
            onClick={() => router.push("/bluecollar/workflows")}
          >
            <Plus className="h-4 w-4" />
            Create Your First Workflow
          </Button>

        </div>
      </div>
      {/* RIGHT ICON */}
      <div className="hidden md:flex items-center justify-center">
        <div className="h-[254px] w-[360px] flex items-center justify-center">
          <Image
            src="/DashboardTick.png"
            alt="Security"
            width={330}
            height={330}
          />
        </div>
      </div>
    </div>
  );
}
