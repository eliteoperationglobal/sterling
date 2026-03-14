"use client";

import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Home, Search, ArrowLeft } from "lucide-react";

export default function Topbar() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  // ✅ Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-20 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-4 md:px-8">

      {/* ================= LEFT ================= */}
      <div className="flex items-center gap-3 w-full max-w-[650px]">

        {/* ⭐ BACK BUTTON */}
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#F3F0ED] transition"
        >
          <ArrowLeft className="w-5 h-5 text-[#9A8B7A]" />
        </button>

        {/* ⭐ SEARCH */}
        <div className="flex items-center border border-[#E5E7EB] rounded-xl px-3 py-2 flex-1 bg-white min-w-0">

          <Search className="w-4 h-4 text-[#9A8B7A] mr-2 shrink-0" />

          <input
            placeholder="Search"
            className="flex-1 outline-none text-sm text-[#111827] placeholder-[#6B7280] bg-transparent min-w-0"
          />
        </div>

        {/* ⭐ ADVANCED */}
        <button className="hidden md:block text-sm font-medium text-[#9A8B7A] hover:text-[#7A6F64] transition whitespace-nowrap">
          Advanced
        </button>
      </div>

      {/* ================= RIGHT ================= */}
      <div className="flex items-center gap-4 md:gap-6 relative ml-4" ref={dropdownRef}>

        {/* ⭐⭐⭐ NEW ATTRACTIVE HOME BUTTON ⭐⭐⭐ */}
        <button
          type="button"
          onClick={() => {
            if (pathname.startsWith("/admin")) {
              router.push("/admin/dashboard");
            } else {
              router.push("/agency/dashboard");
            }
          }}
          className="
            h-11 w-11
            rounded-full
            bg-[#9A8B7A]
            flex items-center justify-center
            shadow-md
            hover:bg-[#7A6F64]
            hover:shadow-lg
            hover:-translate-y-[1px]
            active:scale-95
            transition-all duration-200
          "
        >
          <Home className="w-5 h-5 text-white" />
        </button>

        {/* ⭐ PROFILE */}
        <button
          type="button"
          onClick={() => setOpen(prev => !prev)}
          className="h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold hover:bg-[#7A6F64] hover:shadow-lg hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
        >
          {session?.user?.name?.[0] || "U"}
        </button>

        {/* ⭐ DROPDOWN */}
        <div
          className={`absolute right-0 top-14 w-64 bg-white rounded-full shadow-lg border border-[#E5E7EB] z-50
          transition-all duration-150 ease-out
          ${
            open
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-1 pointer-events-none"
          }`}
        >
          <div className="px-4 py-3 border-b border-[#E5E7EB]">
            <p className="font-medium text-sm text-gray-900">
              {session?.user?.name || "User"}
            </p>
            <p className="text-xs text-gray-600">
              {session?.user?.email || "email@example.com"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => signOut()}
            className="w-full text-left px-4 py-2 text-sm hover:bg-[#F3F0ED] transition"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}