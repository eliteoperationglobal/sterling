"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface ToolRequest {
  _id: string;
  requestType: string;
  status: string;
  clientName: string;
  clientEmail?: string;
  requestData: any;
  resultDocumentUrl?: string;
  adminNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export default function RequestHistoryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [requests, setRequests] = useState<ToolRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "agency_admin" && userRole !== "agency_user") {
        router.push("/signin");
      } else {
        fetchRequests();
      }
    }
  }, [status, session, router]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/agency/tools/requests", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Failed to fetch requests");
      }

      const data = await res.json();
      setRequests(data.requests || []);
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
      PENDING: { bg: "bg-yellow-100", text: "text-yellow-800", border: "border-yellow-200" },
      IN_PROGRESS: { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200" },
      COMPLETED: { bg: "bg-green-100", text: "text-green-800", border: "border-green-200" },
      DECLINED: { bg: "bg-red-100", text: "text-red-800", border: "border-red-200" },
    };
    return colors[status] || colors.PENDING;
  };

  const filteredRequests = requests.filter((req) => {
    if (filter === "ALL") return true;
    return req.status === filter;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading requests...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agency/tools" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Request History</h1>
                <p className="text-sm text-gray-600">View all your tool requests and their status</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Filter Tabs */}
          <div className="bg-white rounded-lg border border-gray-200 mb-6 p-4">
            <div className="flex flex-wrap gap-2">
              {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "DECLINED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    filter === status
                      ? "bg-[#9A8B7A] text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.replace("_", " ")}
                  {status !== "ALL" && (
                    <span className="ml-2 text-xs">
                      ({requests.filter((r) => r.status === status).length})
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          {filteredRequests.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-600 mb-4">
                {filter === "ALL"
                  ? "You haven't submitted any tool requests yet"
                  : `No ${filter.replace("_", " ").toLowerCase()} requests`}
              </p>
              <Link
                href="/agency/tools"
                className="inline-block px-6 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors font-semibold"
              >
                Submit a Request
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => {
                const statusColors = getStatusColor(request.status);
                return (
                  <div
                    key={request._id}
                    className="bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-cyan-200 transition-all duration-300 p-6"
                  >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">
                          {getRequestTypeLabel(request.requestType)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text} border ${statusColors.border}`}
                        >
                          {request.status.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Client: {request.clientName}
                        {request.clientEmail && ` • ${request.clientEmail}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Submitted</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(request.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Request Details */}
                  {request.requestType === "LOSS_RUNS" && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg mb-4">
                      {request.requestData.carrierName && (
                        <div>
                          <p className="text-xs text-gray-500">Carrier</p>
                          <p className="text-sm font-medium text-gray-900">
                            {request.requestData.carrierName}
                          </p>
                        </div>
                      )}
                      {request.requestData.policyNumber && (
                        <div>
                          <p className="text-xs text-gray-500">Policy Number</p>
                          <p className="text-sm font-medium text-gray-900">
                            {request.requestData.policyNumber}
                          </p>
                        </div>
                      )}
                      {request.requestData.yearsRequested && (
                        <div>
                          <p className="text-xs text-gray-500">Years Requested</p>
                          <p className="text-sm font-medium text-gray-900">
                            {request.requestData.yearsRequested} years
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                    {/* Admin Notes */}
                    {request.adminNotes && (
                      <div className="mb-4 p-3 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <p className="text-xs font-semibold text-gray-900 mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-700">{request.adminNotes}</p>
                      </div>
                    )}

                    {/* Result Document */}
                    {request.resultDocumentUrl && request.status === "COMPLETED" && (
                      <div className="flex items-center gap-2">
                        <a
                          href={request.resultDocumentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Result
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

