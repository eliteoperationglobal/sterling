"use client";

import { useState, useEffect, Suspense } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Bell, CheckCircle, CircleSmall, XCircle, Info, LogOut, Layout } from "lucide-react";
interface Submission {
  _id: string;
  submissionId: string;
  agencyName: string;
  clientName: string;
  clientEmail: string;
  industry: string;
  subtype: string;
  programId?: string;
  programName?: string;
  status: string;
  createdAt: string;
  applicationPdfUrl?: string;
  submittedToCarrierAt?: string;
}

interface PipelineStage {
  id: string;
  label: string;
  count?: number;
}

export default function AdminSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>([]); // To get counts
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      }
    }
  }, [status, session, router]);

  // Fetch all once for counts
  useEffect(() => {
    if (status === "authenticated") {
      fetchAllSubmissionsForCounts();
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSubmissions();
    }
  }, [status, statusFilter]);

  const fetchAllSubmissionsForCounts = async () => {
    try {
      const response = await fetch("/api/admin/submissions");
      const data = await response.json();
      if (data.submissions) {
        setAllSubmissions(data.submissions);
      }
    } catch (err) {
      console.error("Error fetching all submissions for counts:", err);
    }
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    setError("");
    try {
      const url = statusFilter !== "ALL"
        ? `/api/admin/submissions?status=${statusFilter}`
        : "/api/admin/submissions";
      const response = await fetch(url);
      const data = await response.json();
      console.log("Admin submissions API response:", data);
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (data.submissions) {
        setSubmissions(data.submissions);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200";
      case "ROUTED":
        return "bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-700 border border-yellow-200";
      case "QUOTED":
        return "bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200";
      case "BIND_REQUESTED":
        return "bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border border-orange-200";
      case "BOUND":
        return "bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border border-green-200";
      case "DECLINED":
      case "CANCELLED":
        return "bg-gradient-to-r from-red-100 to-rose-100 text-red-700 border border-red-200";
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200";
    }
  };

  const pipelineStages: PipelineStage[] = [
    { id: "ALL", label: "All Applications" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "QUOTED", label: "Quoted" },
    { id: "BIND_REQUESTED", label: "Bind Requested" },
    { id: "BOUND", label: "Bound" },
    { id: "DECLINED", label: "Declined" },
  ];

  const getStageCount = (id: string) => {
    if (id === "ALL") return allSubmissions.length;
    if (id === "DECLINED") return allSubmissions.filter(s => s.status === "DECLINED" || s.status === "CANCELLED").length;
    return allSubmissions.filter(s => s.status === id).length;
  };

  const filteredSubmissions = searchQuery.trim() 
    ? submissions.filter(s => 
        s.clientName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.agencyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.submissionId?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : submissions;

  if (status === "loading" || (loading && submissions.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F0ED]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-[#F3F0ED] rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#F3F0ED] flex flex-col">
      {/* HEADER */}
      <div className="px-10 pt-8 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 mb-6">
            <h1
              onClick={() => router.push("/admin/dashboard")}
              className="px-6 py-2.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[34px] font-semibold inline-block cursor-pointer"
            >
              Sterling Insurance Services
            </h1>
          </div>

          <div className="flex items-center gap-5 relative">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-6 py-2.5 rounded-2xl text-sm font-semibold bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200"
            >
              Dashboard
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
              >
                {session?.user?.name?.[0] || session?.user?.email?.[0] || "A"}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-[fadeIn_.2s_ease]">
                  <div className="px-4 py-3 border-b bg-gray-50">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {session?.user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
       
        {/* Page Header */}
        
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                All Applications
              </h1>
              <p className="text-gray-600 font-medium">
                View submitted applications and enter quotes • {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
              </p>
            </div>
            
            {/* Filter Section */}
            <div className="flex items-center gap-3 bg-white/80 backdrop-blur-xl rounded-xl px-4 py-3 border border-gray-200/60 shadow-sm">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <label className="text-sm text-gray-600 font-semibold">
                Status:
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="ROUTED">Routed</option>
                <option value="QUOTED">Quoted</option>
                <option value="BIND_REQUESTED">Bind Requested</option>
                <option value="BOUND">Bound</option>
                <option value="DECLINED">Declined</option>
              </select>
            </div>
          </div>
        </div>

        {/* RIGHT TABLE SECTION */}
        <div className="flex-1 flex flex-col min-h-0">
          
          {/* FILTER BAR */}
          <div className="p-6 border-b border-[#ECEAE7] flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search Agency or Client"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-[350px] border border-[#E0DDD9] rounded-xl text-sm bg-[#F9F8F7] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]/50 transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="ml-auto text-sm text-gray-500 font-medium">
              Showing {filteredSubmissions.length} of {allSubmissions.length} applications
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-10 text-center">
                <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 inline-block">
                  {error}
                </div>
              </div>
            ) : filteredSubmissions.length === 0 ? (
              <div className="p-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Layout className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">No submissions found</h3>
                <p className="text-gray-500">Try adjusting your filters or search query.</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-[#F9F8F7] text-[#6B6B6B] uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-[#ECEAE7]">
                  <tr>
                    <th className="px-6 py-4 text-left">Agency</th>
                    <th className="px-6 py-4 text-left">Client</th>
                    <th className="px-6 py-4 text-left">Program</th>
                    <th className="px-6 py-4 text-left">Status</th>
                    <th className="px-6 py-4 text-left">Submitted</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECEAE7]">
                  {filteredSubmissions.map((sub) => (
                    <tr 
                      key={sub._id} 
                      onClick={() => router.push(`/admin/submissions/${sub._id}`)}
                      className="hover:bg-[#F9F8F7] transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900 group-hover:text-[#9A8B7A] transition-colors">
                          {sub.agencyName || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{sub.clientName || "N/A"}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{sub.clientEmail}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{sub.programName || sub.industry || "N/A"}</div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tighter ${getStatusBadgeColor(sub.status)}`}>
                          {sub.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-gray-900">{new Date(sub.createdAt).toLocaleDateString()}</div>
                        <div className="text-[11px] text-gray-500 mt-0.5">{new Date(sub.createdAt).toLocaleTimeString()}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex gap-2 flex-wrap">
                          <Link
                            href={`/admin/submissions/${sub._id}`}
                            className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-lg border border-blue-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                          >
                            <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Link>
                          <a
                            href={`/api/admin/submissions/${sub._id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-slate-50 hover:from-gray-100 hover:to-slate-100 rounded-lg border border-gray-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                          >
                            <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            PDF
                          </a>
                          {sub.status === "SUBMITTED" && (
                            <>
                              <Link
                                href={`/admin/submissions/${sub._id}/quote`}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 rounded-lg border border-emerald-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                              >
                                <svg className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Enter Quote
                              </Link>

                              {/* Renter Quote – opens same quote screen with renter defaults */}
                              <Link
                                href={`/admin/submissions/${sub._id}/quote?quoteType=renter`}
                                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-gradient-to-r from-indigo-50 to-sky-50 hover:from-indigo-100 hover:to-sky-100 rounded-lg border border-indigo-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                              >
                                <svg
                                  className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 10l9-7 9 7v7a2 2 0 01-2 2h-4m-6 0H5a2 2 0 01-2-2v-7z"
                                  />
                                </svg>
                                Renter Quote
                              </Link>
                            </>
                          )}

                          {["QUOTED", "BIND_REQUESTED", "BOUND"].includes(
                            sub.status
                          ) && (
                            <Link
                              href={`/admin/submissions/${sub._id}/quote`}
                              className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 rounded-lg border border-amber-200 transition-all duration-200 inline-flex items-center gap-1 group/btn"
                            >
                              <svg
                                className="w-3.5 h-3.5 group-hover/btn:scale-110 transition-transform"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M15 12H9m3-3v6m8-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Re-enter Quote
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

