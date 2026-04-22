"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";

export default function AgencyToolsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "agency_admin" && userRole !== "agency_user") {
        router.push("/signin");
      }
    }
  }, [status, session, router]);

  const tools = [
    {
      id: "loss-runs",
      title: "Request Loss Runs",
      description: "Request loss run reports for your clients",
      icon: "📊",
      href: "/agency/tools/loss-runs",
      color: "from-blue-600 to-blue-700",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      id: "bor",
      title: "Request BOR",
      description: "Generate Broker of Record letters",
      icon: "📄",
      href: "/agency/tools/bor",
      color: "from-purple-600 to-purple-700",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      id: "reports",
      title: "Pull Reports",
      description: "Order MVR, credit reports, and other background checks",
      icon: "🔍",
      href: "/agency/tools/reports",
      color: "from-green-600 to-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      id: "history",
      title: "Request History",
      description: "View all your tool requests and their status",
      icon: "📋",
      href: "/agency/tools/history",
      color: "from-gray-600 to-gray-700",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    },
  ];

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Matching Dashboard */}
      <aside className="w-[70px] bg-[#3A3C3F] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-gray-700">
        <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-[#0097A7] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A1F2E] via-[#2A3240] to-[#1A1F2E] rounded-xl flex items-center justify-center shadow-2xl border border-[#9A8B7A]/20 group-hover:border-[#9A8B7A]/40 transition-all overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-transparent"></div>
              </div>
              <svg className="relative w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#logoGradient1)" className="drop-shadow-lg" />
                <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#logoGradient2)" className="drop-shadow-md" />
                <path d="M50 30 L50 65" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />
                <path d="M40 47 L60 47" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <defs>
                  <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9A8B7A" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0097A7" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#9A8B7A] rounded-full opacity-60"></div>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#9A8B7A] rounded-full opacity-60"></div>
            </div>
          </div>
          <div className="text-center px-2">
            <p className="text-[9px] font-semibold text-gray-400 leading-tight tracking-wide uppercase group-hover:text-gray-300 transition-colors" style={{ letterSpacing: '0.05em' }}>Sterling</p>
            <p className="text-[8px] font-medium text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">Wholesale Insurance</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-6 flex-1">
          <Link href="/agency/dashboard" className="p-3 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[70px] overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              <Link href="/agency/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Agency Tools</h1>
                <p className="text-sm text-gray-600">Access specialized tools for managing your insurance business</p>
              </div>
            </div>
            <div className="self-start md:self-auto">
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <Link
              key={tool.id}
              href={tool.href}
              className={`${tool.bgColor} border ${tool.borderColor} rounded-lg p-6 hover:shadow-lg transition-all hover:-translate-y-1 group`}
            >
              <div className="flex items-start gap-4">
                <div className={`text-4xl group-hover:scale-110 transition-transform`}>
                  {tool.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-[#9A8B7A] transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {tool.description}
                  </p>
                </div>
              </div>
                <div className="mt-4 flex items-center justify-end text-[#9A8B7A] font-semibold text-sm">
                  Access Tool
                  <svg className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
            </Link>
          ))}
          </div>

          {/* Info Section */}
          <div className="mt-8 bg-cyan-50 border border-cyan-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-[#9A8B7A] flex-shrink-0 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">How It Works</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold">1.</span>
                  <span>Select the tool you need from the options above</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">2.</span>
                  <span>Fill out the required information for your request</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">3.</span>
                  <span>Submit your request and track its progress in Request History</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold">4.</span>
                  <span>Receive notifications when your request is completed</span>
                </li>
              </ul>
            </div>
          </div>
          </div>
        </div>
      </main>
    </div>
  );
}



