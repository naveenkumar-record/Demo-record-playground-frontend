"use client";

import { useState } from "react";
import BillingTabs from "@/components/billing/billingTabs";
import BillingOverview from "@/components/billing/billingOverview";
import BillingHistory from "@/components/billing/billingHistory";

export default function SettingsBillingPage() {
  const [tab, setTab] = useState("overview");

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-[16px] font-semibold text-[#1f1f1f]">Billing</h1>

      <BillingTabs tab={tab} setTab={setTab} />

      {tab === "overview" && <BillingOverview />}
      {tab === "history" && <BillingHistory />}

    </div>
  );
}
