"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

export default function MarketplaceSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen bg-[#2E2E2E] text-[#D1D5DB] flex flex-col
      transition-all duration-300
      ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* ================= HEADER / LOGO ================= */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-white/10">
        <Link href="/agency/marketplace" className="flex items-center gap-3">
          {collapsed ? (
            <div className="w-9 h-9 bg-[#9A8B7A] rounded flex items-center justify-center text-black font-bold">
              S
            </div>
          ) : (
            <>
              <Image
                src="/sterling-logo.JPG"
                alt="Sterling"
                width={34}
                height={34}
                className="object-contain"
              />
              <div>
                <div className="text-white text-sm font-semibold">
                  Sterling
                </div>
                <div className="text-xs text-gray-400">
                  Wholesale Insurance
                </div>
              </div>
            </>
          )}
        </Link>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-400 hover:text-white"
        >
          <ChevronLeft
            size={18}
            className={`transition ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ================= EMPTY BODY (MARKETPLACE PAGE USES MAIN CONTENT) ================= */}
      <div className="flex-1" />

      {/* ================= FOOTER LINKS ================= */}
      <div className="px-3 pb-4 border-t border-white/10 space-y-2">
        <Footer
          label="OMGA"
          href="/agency/dashboard"
          collapsed={collapsed}
        />
        <Footer
          label="Broker Center"
          href="/agency/broker-center"
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

/* ================= SMALL COMPONENT ================= */

function Footer({ label, href, collapsed }: any) {
  return (
    <Link
      href={href}
      target="_blank"
      className="flex items-center gap-3 px-3 py-2 rounded-md
      text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
    >
      <ExternalLink size={16} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}