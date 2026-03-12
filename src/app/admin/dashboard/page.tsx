"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

interface DashboardStats {
  totalSubmissions: number;
  pendingQuotes: number;
  bindRequests: number;
  boundPolicies: number;
  cancelledPolicies: number;
}

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({

    totalSubmissions: 0,
    pendingQuotes: 0,
    bindRequests: 0,
    boundPolicies: 0,
    cancelledPolicies: 0,
  });
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        // Single load when dashboard mounts
        fetchStats();
        fetchCancelRequests();
      }
    }
  }, [status, session, router]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [submissionsRes, quotesRes, bindRes, boundRes] = await Promise.all([
        fetch("/api/admin/submissions"),
        fetch("/api/admin/quotes"),
        fetch("/api/admin/bind-requests"),
        fetch("/api/admin/bound-policies"),
      ]);

      const submissionsData = submissionsRes.ok ? await submissionsRes.json() : { submissions: [] };
      const quotesData = quotesRes.ok ? await quotesRes.json() : { quotes: [] };
      const bindData = bindRes.ok ? await bindRes.json() : { requests: [] };
      const boundData = boundRes.ok ? await boundRes.json() : { policies: [] };

      setStats({
        totalSubmissions: submissionsData.submissions?.length || 0,
        pendingQuotes: quotesData.quotes?.filter((q: any) => q.status === "PENDING")?.length || 0,
        bindRequests: bindData.requests?.length || 0,
        boundPolicies: boundData.policies?.length || 0,
        cancelledPolicies: boundData.policies?.filter((p: any) => p.status === "CANCELLED")?.length || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchCancelRequests = async () => {
    try {
      const res = await fetch("/api/admin/cancel-requests");
      const data = await res.json();

      if (data.success) {
        setCancelRequests(data.requests);
      }
    } catch (err) {
      console.error(err);
    }
  };
  const approveCancel = async (requestId: string) => {
    try {
      const res = await fetch("/api/admin/cancel-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ requestId }),
      });

      const data = await res.json();

      if (data.success) {
        fetchCancelRequests(); // refresh list
        fetchStats(); // refresh counters
      }
    } catch (err) {
      console.error(err);
    }
  };
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading admin control center...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-10">
              {/* <Link href="/admin/dashboard" className="flex items-center gap-4 group">
                <div className="relative">
                  
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 animate-pulse transition-all duration-500"></div>

                  
                  <div className="relative w-12 h-12 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:shadow-rose-600/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    
                    <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>

                    
                    <div className="relative">
                      <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">SP</span>
                    </div>

                    
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100"></div>
                  </div>

                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">Sterling Portal</span>
                    <div className="px-2 py-0.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-md">
                      <span className="text-[10px] font-black text-rose-600 tracking-wider">ADMIN</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 font-semibold -mt-0.5 tracking-wide">Control Center</p>
                </div>
              </Link> */}

              <div className="flex items-center gap-2 mb-1">
                <h1
                  className="px-4 py-1.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[18px] font-semibold inline-block cursor-pointer"
                >
                  Sterling Insurance Services
                </h1>
              </div>


              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/admin/dashboard" className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                  Dashboard
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-gray-50 rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/bind-requests" className="relative px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-gray-50 rounded-lg transition">
                  Bind Requests
                  {stats.bindRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-lg animate-pulse">
                      {stats.bindRequests}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-gray-50 rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-gray-50 rounded-lg transition">
                  Tool Requests
                </Link>
                <Link
                  href="/admin/cancel-requests"
                  className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-gray-50 rounded-lg transition"
                >
                  Cancel Requests
                </Link>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              {/* <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-50 to-red-50 border border-rose-200 rounded-lg shadow-sm">
                <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span className="text-xs font-bold text-rose-700 tracking-wide">ADMIN</span>
              </div> */}
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{session?.user?.name || "Administrator"}</p>
                  <p className="text-xs text-gray-500">System Admin</p>
                </div>
                {/* <button
                  onClick={() => signOut({ callbackUrl: "/signin" })}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-lg hover:bg-gray-50 transition-all shadow-sm"
                >
                  Sign out
                </button> */}

                {/* ⭐ PROFILE */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  >
                    {session?.user?.name?.[0] || "U"}
                  </button>
                  {/* ⭐ DROPDOWN */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-[fadeIn_.2s_ease]">

                      <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800">
                          Sterling Insurance Services
                        </p>
                        <p className="text-xs text-gray-500">
                          Admin Panel
                        </p>
                      </div>
                      <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 transition"
                      >
                        Logout
                      </button>

                    </div>
                  )}

                </div>



              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8 lg:py-12">
        {/* Welcome Section */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Admin Control Center
            </h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-full text-xs font-semibold text-emerald-700">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              All systems operational
            </span>
          </div>
          <p className="text-lg text-gray-600">Platform-wide operations, approvals, and system monitoring</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Submissions", value: stats.totalSubmissions, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "blue", gradient: "from-blue-600 to-blue-700" },
            { label: "Pending Quotes", value: stats.pendingQuotes, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber", gradient: "from-amber-600 to-amber-700", urgent: stats.pendingQuotes > 0 },
            { label: "Bind Requests", value: stats.bindRequests, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "orange", gradient: "from-orange-600 to-orange-700", urgent: stats.bindRequests > 0 },
            { label: "Bound Policies", value: stats.boundPolicies, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "emerald", gradient: "from-emerald-600 to-emerald-700" },
            { label: "Cancelled Policies", value: stats.cancelledPolicies, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "red", gradient: "from-red-600 to-red-700" }
          ].map((stat) => (
            <div key={stat.label} className={`group relative bg-white rounded-2xl border ${stat.urgent ? 'border-orange-200 shadow-orange-100/50' : 'border-gray-200'} p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300`}>
              <div className={`absolute inset-0 bg-gradient-to-br from-${stat.color}-50/50 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300`}></div>

              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`inline-flex p-3 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                    </svg>
                  </div>
                  {stat.urgent && stat.value > 0 && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 animate-pulse">
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Action Required
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          {/* Quick Actions - 2/3 width */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Administrative Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: "All Submissions", desc: "View and manage all submissions", href: "/admin/submissions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", gradient: "from-blue-600 to-blue-700", badge: stats.totalSubmissions },
                { title: "Quotes Management", desc: "Review and approve quotes", href: "/admin/quotes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", gradient: "from-purple-600 to-purple-700", badge: stats.pendingQuotes },
                { title: "Bind Requests", desc: "Approve binding requests", href: "/admin/bind-requests", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", gradient: "from-orange-600 to-orange-700", badge: stats.bindRequests, urgent: stats.bindRequests > 0 },
                { title: "Bound Policies", desc: "View all bound policies", href: "/admin/bound-policies", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", gradient: "from-emerald-600 to-emerald-700", badge: stats.boundPolicies },
                // { title: "Reports & Analytics", desc: "Generate system reports", href: "#", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", gradient: "from-violet-600 to-violet-700" },
                // { title: "System Settings", desc: "Configure platform", href: "#", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z", gradient: "from-slate-600 to-slate-700" }
              ].map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group relative bg-white rounded-xl border ${action.urgent ? 'border-orange-200 bg-orange-50/30' : 'border-gray-200'} p-5 hover:border-gray-300 hover:shadow-lg transition-all duration-300 overflow-hidden`}
                >
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${action.gradient} opacity-[0.03] group-hover:opacity-[0.08] transition-opacity rounded-full -mr-8 -mt-8`}></div>

                  <div className="relative flex items-center gap-4">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={action.icon} />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-base font-semibold text-gray-900">{action.title}</h3>
                        {action.badge && action.badge > 0 && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold ${action.urgent ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{action.desc}</p>
                    </div>
                    <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* System Status - 1/3 width */}
          {/* <div>
            <h2 className="text-xl font-bold text-gray-900 mb-6">System Health</h2>
            <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 shadow-sm">
              {[
                { label: "API Status", value: "Operational", status: "success", icon: "M5 13l4 4L19 7" },
                { label: "Database", value: "Connected", status: "success", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
                { label: "Cache Server", value: "Active", status: "success", icon: "M13 10V3L4 14h7v7l9-11h-7z" },
                { label: "Last Backup", value: "2 hours ago", status: "info", icon: "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className={`flex-shrink-0 w-10 h-10 ${item.status === 'success' ? 'bg-emerald-50' : 'bg-blue-50'} rounded-lg flex items-center justify-center`}>
                    <svg className={`w-5 h-5 ${item.status === 'success' ? 'text-emerald-600' : 'text-blue-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-600">{item.value}</p>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${item.status === 'success' ? 'bg-emerald-500' : 'bg-blue-500'} animate-pulse`}></div>
                </div>
              ))}
            </div>
           
          </div> */}
        </div>
      </main>
      {/* ⭐ Cancel Requests Section */}

    </div>
  );
}