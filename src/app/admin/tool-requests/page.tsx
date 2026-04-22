"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

interface ToolRequest {
  _id: string;
  agencyId: {
    _id: string;
    name: string;
    email: string;
  };
  requestType: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  requestData: any;
  resultDocumentUrl?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export default function AdminToolRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "admin" && userRole !== "system_admin") {
        router.push("/signin");
      } else {
        fetchRequests();
      }
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tool-requests", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await res.json();
      setRequests(data.requests || []);
      
      const pending = (data.requests || []).filter((r: ToolRequest) => r.status === "PENDING").length;
      setPendingCount(pending);
    } catch (error: any) {
      console.error("Fetch error:", error);
      toast.error("Failed to load requests", {
        description: error.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  const getRequestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      LOSS_RUNS: "Loss Runs",
      BOR: "Broker of Record",
      MVR: "MVR Report",
      CREDIT_REPORT: "Credit Report",
      OTHER_REPORT: "Other Report",
    };
    return labels[type] || type;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      PENDING: { bg: "bg-gradient-to-r from-yellow-50 to-amber-50", text: "text-yellow-700", border: "border-yellow-200" },
      IN_PROGRESS: { bg: "bg-gradient-to-r from-blue-50 to-indigo-50", text: "text-blue-700", border: "border-blue-200" },
      COMPLETED: { bg: "bg-gradient-to-r from-green-50 to-emerald-50", text: "text-green-700", border: "border-green-200" },
      DECLINED: { bg: "bg-gradient-to-r from-red-50 to-rose-50", text: "text-red-700", border: "border-red-200" },
    };
    return colors[status] || colors.PENDING;
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "ALL") return true;
    return req.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading tool requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 md:gap-10">
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <Menu className="w-6 h-6 text-[#9A8B7A]" />
              </button>
              <Link href="/admin/dashboard" className="flex items-center gap-4 group">
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
              </Link>
              <nav className="hidden lg:flex items-center gap-1">
                <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Dashboard
                </Link>
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quote Request
                </Link>
                <Link href="/admin/bind-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Bind Requests
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                  Tool Requests
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="group relative px-4 py-2 text-sm font-semibold text-[#2d2a26] hover:text-white bg-[#f5f1eb] hover:bg-[#9A8B7A] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#9A8B7A] rounded-xl flex items-center justify-center shadow-lg shadow-gray-200/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Tool Requests Management</h1>
              <p className="text-sm text-gray-600 font-medium mt-0.5">Process agency tool requests for Loss Runs, BOR letters, and reports</p>
            </div>
          </div>

          {/* Pending Notification Banner */}
          {pendingCount > 0 && (
            <div className="mt-4 bg-[#fcfaf7] border border-[#e5ddd5] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="bg-[#9A8B7A] text-white rounded-full w-12 h-12 flex items-center justify-center font-black text-xl shadow-sm">
                  {pendingCount}
                </div>
                <div>
                  <p className="text-[#2d2a26] font-bold text-lg">
                    {pendingCount} Pending Request{pendingCount !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[#6b5e52] text-sm">
                    Action required: Review and process new tool requests
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "DECLINED"].map((statusFilter) => (
              <button
                key={statusFilter}
                onClick={() => setFilter(statusFilter)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filter === statusFilter
                    ? "bg-[#9A8B7A] text-white shadow-lg shadow-gray-200/30"
                    : "text-[#6b5e52] hover:bg-[#f5f1eb]"
                }`}
              >
                {statusFilter.replace("_", " ")}
                <span className="ml-2 text-xs opacity-80">
                  ({requests.filter((r) => statusFilter === "ALL" || r.status === statusFilter).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Requests List */}
        {filteredRequests.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No requests found</p>
            <p className="text-sm text-gray-600">
              {filter === "ALL" ? "No tool requests have been submitted yet" : `No ${filter.replace("_", " ").toLowerCase()} requests`}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusColors = getStatusColor(request.status);
              return (
                <div
                  key={request._id}
                  className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] hover:shadow-xl hover:border-[#9A8B7A] transition-all duration-300 overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-900">
                            {getRequestTypeLabel(request.requestType)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}
                          >
                            {request.status.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">{request.agencyId.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            <span className="font-medium">{request.clientName}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{new Date(request.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Notes */}
                    {request.adminNotes && (
                      <div className="mb-4 p-3 bg-[#fcfaf7] border border-[#e5ddd5] rounded-lg">
                        <p className="text-xs font-semibold text-[#8a6f4d] mb-1">Admin Notes:</p>
                        <p className="text-sm text-[#6b5e52]">{request.adminNotes}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3">
                      {request.resultDocumentUrl && request.status === "COMPLETED" && (
                        <a
                          href={request.resultDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-sm font-semibold text-[#8a6f4d] bg-[#f5f1eb] hover:bg-[#e5ddd5] rounded-xl border border-[#e5ddd5] shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Result
                        </a>
                      )}
                      <Link
                        href={`/admin/tool-requests/${request._id}`}
                        className="px-4 py-2 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/30 hover:shadow-gray-300 transition-all duration-300 flex items-center gap-2"
                      >
                        {request.status === "PENDING" ? "Process Request" : "View Details"}
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
