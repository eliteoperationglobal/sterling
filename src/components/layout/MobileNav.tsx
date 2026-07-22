"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  X, 
  LayoutDashboard, 
  FileText, 
  ClipboardList, 
  CheckCircle, 
  Shield, 
  Wrench, 
  AlertCircle,
  CheckSquare,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Things To Do", href: "/admin/things-to-do", icon: CheckSquare },
  { label: "Quotes", href: "/admin/quotes", icon: FileText },
  { label: "Quote Request", href: "/admin/quote-requests", icon: ClipboardList },
  { label: "Bind Requests", href: "/admin/bind-requests", icon: CheckCircle },
  { label: "Policies", href: "/admin/bound-policies", icon: Shield },
  { label: "Tool Requests", href: "/admin/tool-requests", icon: Wrench },
  { label: "Cancel Requests", href: "/admin/cancel-requests", icon: AlertCircle },
];

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity duration-300 lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div 
        className={`fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[110] shadow-2xl transition-transform duration-300 ease-out transform lg:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-[#e5ddd5] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-xl flex items-center justify-center shadow-lg shadow-rose-600/20">
                <span className="text-white font-black text-sm tracking-tighter">SP</span>
              </div>
              <div>
                <span className="text-gray-900 font-bold text-base tracking-tight block">Sterling Portal</span>
                <span className="text-[10px] font-black text-rose-600 tracking-wider uppercase">Admin Control</span>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive 
                      ? "bg-[#9A8B7A] text-white shadow-lg shadow-[#9A8B7A]/20" 
                      : "text-gray-600 hover:bg-[#f5f1eb] hover:text-[#9A8B7A]"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-[#9A8B7A]"}`} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-[#e5ddd5] bg-gray-50/50">
            <button
              onClick={() => {
                onClose();
                signOut({ callbackUrl: "/signin" });
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  );
}