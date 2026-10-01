"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { signOut } from "next-auth/react";
import { Bell, Menu } from "lucide-react";
import NotificationWidget from "@/components/NotificationWidget";
import MobileNav from "@/components/layout/MobileNav";

interface DashboardStats {
  totalSubmissions: number;
  pendingQuotes: number;
  bindRequests: number;
  quoteRequests: number;
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
    quoteRequests: 0,
    boundPolicies: 0,
    cancelledPolicies: 0,
  });
  const [cancelRequests, setCancelRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const getNotificationTag = (type: string) => {
    switch (type) {
      case "NEW_SUBMISSION":
        return { label: "New", className: "inline-flex text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "APPROVAL_REQUESTED":
        return { label: "Approval", className: "inline-flex text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "BIND_REQUESTED":
        return { label: "Bind", className: "inline-flex text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "POLICY_BOUND":
        return { label: "Bound", className: "inline-flex text-xs bg-cyan-100 text-cyan-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_QUOTE":
        return { label: "Quote", className: "inline-flex text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      case "NEW_NOTE":
        return { label: "Note", className: "inline-flex text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
      default:
        return { label: "Info", className: "inline-flex text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded whitespace-nowrap font-medium" };
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchDashboardData();
      }
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/admin/dashboard-stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        if (data.cancelRequests) {
          setCancelRequests(data.cancelRequests);
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      const data = await res.json();
      const notifs = data.notifications || [];
      setNotifications(notifs);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setNotifLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (notif: any) => {
    let dismissed = false;

    try {
      const response = await fetch(`/api/notifications?id=${notif.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await response.json();
        dismissed = true;
        setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
        setNotifOpen(false);
      } else {
        console.error("Failed to dismiss notification");
      }
    } catch (error) {
      console.error("Exception dismissing notification:", error);
    }

    if (dismissed && notif.submissionId) {
      router.push(`/admin/submissions/${notif.submissionId}`);
    }
  };
  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading admin control center...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4 md:gap-10">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-[#9A8B7A]" />
              </button>

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
                <Link href="/admin/things-to-do" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Things To Do
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="relative px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Quote Requests
                  {stats.quoteRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-[#9A8B7A] to-[#8a6f4d] rounded-full shadow-lg animate-pulse">
                      {stats.quoteRequests}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bind-requests" className="relative px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Bind Requests
                  {stats.bindRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-orange-400 to-red-500 rounded-full shadow-lg animate-pulse">
                      {stats.bindRequests}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition">
                  Tool Requests
                </Link>
                <Link
                  href="/admin/cancel-requests"
                  className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition"
                >
                  Cancel Requests
                </Link>
                <Link
                  href="/admin/audit"
                  className="px-4 py-2 text-sm font-medium text-[#9A8B7A] hover:text-[#9A8B7A] hover:bg-[#f5f1eb] rounded-lg transition"
                >
                  Audit
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
              <div className="h-8 w-px bg-[#e5ddd5]"></div>
              <div ref={notifRef} className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((prev) => !prev)}
                  className="relative h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center hover:bg-[#8a6f4d] hover:shadow-md hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {notifications && notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {notifications.length > 9 ? "9+" : notifications.length}
                    </span>
                  )}
                </button>

                <div
                  className={`absolute right-0 top-14 w-96 bg-white rounded-2xl shadow-lg border border-[#e5ddd5] z-50 transition-all duration-200 ease-out ${notifOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-2 pointer-events-none"
                    }`}
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  <div className="px-5 py-4 border-b border-[#e5ddd5] bg-[#f5f1eb] sticky top-0">
                    <div className="flex items-center justify-between">
                      <p className="font-bold text-sm text-[#2d2a26]">Notifications</p>
                      {notifications && notifications.length > 0 && (
                        <span className="text-xs font-semibold text-white bg-[#9A8B7A] px-2.5 py-1 rounded-full">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {notifLoading ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[#6b5e52]">Loading...</p>
                    </div>
                  ) : !notifications || notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[#6b5e52]">No new notifications yet</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#e5ddd5]">
                      {notifications.map((notif: any) => (
                        <button
                          key={notif.id || notif._id || notif.submissionId}
                          onClick={() => handleNotificationClick(notif)}
                          className="w-full text-left px-4 py-3 hover:bg-[#f5f1eb] transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-[#2d2a26]">{notif.title}</p>
                              <p className="text-xs text-[#6b5e52] mt-1 line-clamp-2">{notif.description}</p>
                            </div>
                            <div className="flex-shrink-0">
                              {(() => {
                                const tag = getNotificationTag(notif.type);
                                return tag ? <span className={tag.className}>{tag.label}</span> : null;
                              })()}
                            </div>
                          </div>
                          {notif.timestamp && (
                            <p className="text-xs text-[#9A8B7A] mt-2">
                              {new Date(notif.timestamp).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })} {new Date(notif.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-[#2d2a26]">{session?.user?.name || "Administrator"}</p>
                  <p className="text-xs text-[#6b5e52]">System Admin</p>
                </div>



                {/* ⭐ PROFILE */}
                <div ref={profileRef} className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  >
                    {session?.user?.name?.[0] || "U"}
                  </button>
                  {/* ⭐ DROPDOWN */}
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-[#e5ddd5] overflow-hidden animate-[fadeIn_.2s_ease]">

                      <div className="px-4 py-3 border-b bg-[#f5f1eb]/50 border-[#e5ddd5]">
                        <p className="text-sm font-semibold text-[#2d2a26]">
                          Sterling Insurance Services
                        </p>
                        <p className="text-xs text-[#6b5e52] mt-0.5">
                          Admin Panel
                        </p>
                      </div>
                      <button
                        onClick={() => signOut({ callbackUrl: "/signin" })}
                        className="w-full text-left px-4 py-3 text-sm font-medium text-[#2d2a26] hover:bg-[#f5f1eb] hover:text-[#9A8B7A] transition-colors"
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
        {/*<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
          {[
            { label: "Total Submissions", value: stats.totalSubmissions, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "blue", gradient: "from-blue-600 to-blue-700" },
            { label: "Quote Requests", value: stats.quoteRequests, icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "sky", gradient: "from-sky-600 to-sky-700", urgent: stats.quoteRequests > 0 },
            { label: "Pending Quotes", value: stats.pendingQuotes, icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z", color: "amber", gradient: "from-amber-600 to-amber-700", urgent: stats.pendingQuotes > 0 },
            { label: "Bind Requests", value: stats.bindRequests, icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "orange", gradient: "from-orange-600 to-orange-700", urgent: stats.bindRequests > 0 },
            { label: "Bound Policies", value: stats.boundPolicies, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "emerald", gradient: "from-emerald-600 to-emerald-700" },
            { label: "Cancelled Policies", value: stats.cancelledPolicies, icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", color: "red", gradient: "from-red-600 to-red-700" }
          ].map((stat) => (
            <div key={stat.label} className={`group relative bg-white rounded-2xl border ${stat.urgent ? 'border-orange-200 shadow-orange-100/50' : 'border-[#e5ddd5]'} p-6 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300`}>
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
        </div>*/}

        {/* Administrative Actions - Full Width */}
        <div className="mb-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Administrative Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "Things To Do", desc: "Organized pending tasks & overdue subjectives", href: "/admin/things-to-do", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2M9 14l2 2 4-4", gradient: "from-[#9A8B7A] to-[#7A6F64]", badge: null },
                { title: "All Submissions", desc: "View and manage all submissions", href: "/admin/submissions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", gradient: "from-blue-600 to-blue-700", badge: stats.totalSubmissions },
                { title: "Quote Requests", desc: "Applications waiting for quotes", href: "/admin/quote-requests", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", gradient: "from-sky-600 to-sky-700", badge: stats.quoteRequests, urgent: stats.quoteRequests > 0 },
                { title: "Quotes Management", desc: "Review and approve quotes", href: "/admin/quotes", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2", gradient: "from-purple-600 to-purple-700", badge: stats.pendingQuotes },
                { title: "Bind Requests", desc: "Approve binding requests", href: "/admin/bind-requests", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", gradient: "from-orange-600 to-orange-700", badge: stats.bindRequests, urgent: stats.bindRequests > 0 },
                { title: "Bound Policies", desc: "View all bound policies", href: "/admin/bound-policies", icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z", gradient: "from-emerald-600 to-emerald-700", badge: stats.boundPolicies },
                { title: "Audit", desc: "Audit existing policies or create new ones", href: "/admin/audit", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M15 12a3 3 0 11-6 0 3 3 0 016 0z", gradient: "from-amber-600 to-amber-700", badge: null },
              ].map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group relative bg-white rounded-2xl border ${action.urgent ? 'border-orange-200 bg-orange-50/30' : 'border-[#e5ddd5]'} p-8 hover:border-gray-300 hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col gap-5`}
                >
                  <div className={`absolute top-0 right-0 w-40 h-40 bg-gradient-to-br ${action.gradient} opacity-[0.04] group-hover:opacity-[0.10] transition-opacity rounded-full -mr-10 -mt-10`}></div>

                  <div className="relative flex items-start justify-between">
                    <div className={`flex-shrink-0 w-16 h-16 bg-gradient-to-br ${action.gradient} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                      <svg className="w-9 h-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={action.icon} />
                      </svg>
                    </div>
                    {action.badge != null && action.badge > 0 && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${action.urgent ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'}`}>
                        {action.badge}
                      </span>
                    )}
                  </div>

                  <div className="relative">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-500">{action.desc}</p>
                  </div>

                  <div className="relative flex items-center gap-1 text-sm font-semibold text-gray-400 group-hover:text-gray-700 transition-colors">
                    Go to {action.title}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
      {/* ⭐ Cancel Requests Section */}

    </div>
  );
}