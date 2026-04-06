"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  LayoutGrid,
  RotateCcw,
  XCircle,
  Search,
  Settings,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

export default function BrokerSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`h-screen bg-white text-[#2d2a26] border-r border-[#e5ddd5] flex flex-col
      transition-all duration-300
      ${collapsed ? "w-20" : "w-64"}`}
    >
      {/* ================= HEADER / LOGO ================= */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-[#e5ddd5]">
        <Link href="/agency/broker-center" className="flex items-center gap-3">
          {collapsed ? (
            <div className="w-9 h-9 bg-[#9A8B7A] rounded-lg flex items-center justify-center text-white font-bold shadow-sm">
              S
            </div>
          ) : (
            <>
              <Image
                src="/sterling-logo.JPG"
                alt="Sterling"
                width={34}
                height={34}
                className="bg-white p-0.5"
              />
              <div>
                <div className="text-[#2d2a26] text-sm font-bold">
                  Sterling
                </div>
                <div className="text-xs font-medium text-[#6b5e52]">
                  Wholesale Insurance
                </div>
              </div>
            </>
          )}
        </Link>

        <button onClick={() => setCollapsed(!collapsed)} className="text-[#6b5e52] hover:text-[#9A8B7A] transition-colors">
          <ChevronLeft
            size={18}
            className={`transition-transform ${collapsed ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {/* ================= TOP MENU (ISC STYLE) ================= */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <Item
          icon={LayoutGrid}
          label="Sales Pipeline"
          href="/agency/broker-center"
          collapsed={collapsed}
        />
        <Item
          icon={RotateCcw}
          label="Renewals"
          href="/agency/renewals"
          collapsed={collapsed}
        />
        <Item
          icon={XCircle}
          label="Cancellations"
          href="/agency/cancellations"
          collapsed={collapsed}
        />
        <Item
          icon={Search}
          label="Advanced Search"
          href="/agency/advanced-search"
          collapsed={collapsed}
        />
      </nav>

      {/* ================= BOTTOM MENU ================= */}
      <div className="px-3 pb-4 border-t border-[#e5ddd5] space-y-1">
        <Item
          icon={Settings}
          label="Settings"
          href="/agency/settings"
          collapsed={collapsed}
        />
        <Footer
          label="OMGA"
          href="/agency/dashboard"
          collapsed={collapsed}
        />
        <Footer
          label="Marketplace"
          href="/agency/marketplace"
          collapsed={collapsed}
        />
      </div>
    </aside>
  );
}

/* ================= COMPONENTS ================= */

function Item({ icon: Icon, label, href, collapsed }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg
      text-sm font-semibold text-[#6b5e52] hover:bg-[#f5f1eb] hover:text-[#9A8B7A] transition-colors"
    >
      <Icon size={18} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

function Footer({ label, href, collapsed }: any) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg
      text-sm font-medium text-[#6b5e52] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] transition-colors"
    >
      <ExternalLink size={16} />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}