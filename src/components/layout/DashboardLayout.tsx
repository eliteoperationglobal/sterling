"use client";

import React from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#F3F4F6] overflow-hidden">
      {/* LEFT SIDEBAR */}
      {/* <Sidebar /> */}

      {/* RIGHT AREA */}
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar />

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-auto p-4">
          {children}
        </main>
      </div>
    </div>
  );
}
