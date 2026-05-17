"use client";

import SidebarNav from "./sidebarNav";

export default function Sidebar() {
  return (
    <aside className="hidden h-full overflow-y-auto border-r border-[#e7e7e7] bg-[#FAFAFA] px-3 py-2 lg:flex lg:flex-col">
      <SidebarNav />
    </aside>
  );
}
