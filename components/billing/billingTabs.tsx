type Props = {
  tab: string;
  setTab: (v: string) => void;
};

export default function BillingTabs({ tab, setTab }: Props) {

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "history", label: "Billing history" },
  ];

  return (
   <div className="inline-flex gap-6 border-b border-[#e5e5e5]">

  {tabs.map((t) => (
    <button
      key={t.id}
      onClick={() => setTab(t.id)}
      className={`pb-2 text-[13px] ${
        tab === t.id
          ? "border-b-2 border-black text-black"
          : "text-[#7a7a7a]"
      }`}
    >
      {t.label}
    </button>
  ))}

</div>
  );
}