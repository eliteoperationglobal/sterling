"use client";

import { useState, useEffect, Suspense, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Bell, CheckCircle, CircleSmall, XCircle, Info, LogOut, Layout, ChevronRight, Trash2, Menu, AlertCircle } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";
interface Submission {
  _id: string;
  submissionId: string;
  submissionNumber?: number;
  policyNumber?: string;
  agencyId?: string;
  agentId?: string;
  agentName?: string;
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
  bindApprovedAt?: string;
  effectiveDate?: string | null;
  effectiveCancellationDate?: string | null;
  cancelRequested?: boolean;
}

interface PipelineStage {
  id: string;
  label: string;
  count?: number;
}

let cachedSubmissions: Submission[] | null = null;

export default function AdminSubmissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<Submission[]>(() => cachedSubmissions || []);
  const [loading, setLoading] = useState<boolean>(() => !cachedSubmissions || cachedSubmissions.length === 0);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAgency, setSelectedAgency] = useState("ALL");
  const [selectedAgent, setSelectedAgent] = useState("ALL");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${submissionToDelete}`, {
        method: "DELETE"
      });
      if (res.ok) {
        cachedSubmissions = (cachedSubmissions || []).filter(s => s._id !== submissionToDelete);
        setSubmissions(prev => prev.filter(s => s._id !== submissionToDelete));
        setAllSubmissions(prev => prev.filter(s => s._id !== submissionToDelete));
        setDeleteModalOpen(false);
        setSubmissionToDelete(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting submission");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("sterling_admin_back_url", "/admin/submissions");
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      } else {
        fetchSubmissionsData();
      }
    }
  }, [status, router]);

  const fetchSubmissionsData = async () => {
    if (!cachedSubmissions || cachedSubmissions.length === 0) {
      setLoading(true);
    }
    setError("");
    try {
      const response = await fetch(`/api/admin/submissions?t=${Date.now()}`);
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        if (response.status === 504 || response.status === 502) {
          throw new Error("Server took too long to respond (Gateway Timeout). Please refresh the page.");
        }
        throw new Error(`Server returned an invalid response (${response.status}). Please try again.`);
      }

      if (!response.ok) {
        throw new Error(data?.error || `HTTP error! status: ${response.status}`);
      }

      if (data?.submissions) {
        cachedSubmissions = data.submissions;
        setAllSubmissions(data.submissions);
      } else if (data?.error) {
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

  const availableAgencies = useMemo(() => {
    const agencies = new Set<string>();
    allSubmissions.forEach(s => {
      if (s.agencyName) agencies.add(s.agencyName.trim());
    });
    return Array.from(agencies).sort((a, b) => a.localeCompare(b));
  }, [allSubmissions]);

  useEffect(() => {
    setSelectedAgent("ALL");
  }, [selectedAgency]);

  const availableAgents = useMemo(() => {
    const agents = new Set<string>();
    allSubmissions.forEach(s => {
      if (
        (selectedAgency === "ALL" || (s.agencyName && s.agencyName.trim() === selectedAgency)) &&
        s.agentName
      ) {
        agents.add(s.agentName.trim());
      }
    });
    return Array.from(agents).sort((a, b) => a.localeCompare(b));
  }, [allSubmissions, selectedAgency]);

  const pipelineStages: PipelineStage[] = [
    { id: "ALL", label: "All Applications" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "QUOTED", label: "Quoted" },
    { id: "BIND_REQUESTED", label: "Bind Requested" },
    { id: "BOUND", label: "Bound" },
    { id: "PENDING_CANCEL", label: "Pending Cancel" },
    { id: "DECLINED", label: "Cancelled" },
  ];

  const getStageCount = (id: string) => {
    if (id === "ALL") return allSubmissions.length;
    if (id === "DECLINED") return allSubmissions.filter(s => !s.cancelRequested && (s.status === "DECLINED" || s.status === "CANCELLED")).length;
    if (id === "PENDING_CANCEL") return allSubmissions.filter(s => s.cancelRequested).length;
    return allSubmissions.filter(s => !s.cancelRequested && s.status === id).length;
  };

  const filteredSubmissions = allSubmissions.filter((s: any) => {
    if (selectedAgency !== "ALL" && (!s.agencyName || s.agencyName.trim() !== selectedAgency)) return false;
    if (selectedAgent !== "ALL" && (!s.agentName || s.agentName.trim() !== selectedAgent)) return false;

    if (statusFilter === "PENDING_CANCEL") {
      if (!s.cancelRequested) return false;
    } else if (statusFilter === "DECLINED") {
      if (s.cancelRequested || (s.status !== "DECLINED" && s.status !== "CANCELLED")) return false;
    } else if (statusFilter !== "ALL") {
      if (s.cancelRequested || s.status !== statusFilter) return false;
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      return (
        s.clientName?.toLowerCase().includes(query) ||
        s.agencyName?.toLowerCase().includes(query) ||
        s.agentName?.toLowerCase().includes(query) ||
        s.programName?.toLowerCase().includes(query) ||
        s.clientEmail?.toLowerCase().includes(query) ||
        s.submissionId?.toLowerCase().includes(query) ||
        (s.submissionNumber ? s.submissionNumber.toString() : "").includes(query) ||
        s.policyNumber?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  if (status === "loading" || (loading && allSubmissions.length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#f5f1eb] flex flex-col">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* HEADER */}
      <div className="px-4 md:px-10 pt-4 md:pt-8 pb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
          <div className="flex items-center gap-4 mb-2 md:mb-6">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-6 h-6 text-[#9A8B7A]" />
            </button>
            <h1
              onClick={() => router.push("/admin/dashboard")}
              className="px-6 py-2.5 rounded-2xl bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200 text-[34px] font-semibold inline-block cursor-pointer"
            >
              Sterling Insurance Services
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-5 relative">
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="px-4 md:px-6 py-2 md:py-2.5 rounded-xl md:rounded-2xl text-xs md:text-sm font-semibold bg-[#9A8B7A] text-white shadow-md hover:shadow-lg hover:scale-[1.04] active:scale-[0.98] transition-all duration-200"
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
                <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-[#e5ddd5] overflow-hidden z-50 animate-[fadeIn_.2s_ease]">
                  <div className="px-4 py-3 border-b bg-[#f5f1eb]/50">
                    <p className="text-sm font-semibold text-[#2d2a26] truncate">
                      {session?.user?.name || "Admin"}
                    </p>
                    <p className="text-xs text-[#6b5e52] truncate">
                      {session?.user?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="w-full text-left px-4 py-3 text-sm text-[#2d2a26] hover:bg-[#f5f1eb] flex items-center gap-2 transition"
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
      <div className="mx-4 md:mx-10 bg-white rounded-2xl shadow-lg flex flex-col lg:flex-row overflow-hidden flex-1 mb-8">

        {/* LEFT PIPELINE SIDEBAR */}
        <div className="w-full lg:w-[270px] bg-[#fdfaf7] border-b lg:border-b-0 lg:border-r border-[#e5ddd5] p-4 md:p-6 flex flex-row lg:flex-col gap-2 lg:gap-0 lg:space-y-3 overflow-x-auto lg:overflow-visible shrink-0 scrollbar-hide">
          {pipelineStages.map((stage) => {
            const isActive = statusFilter === stage.id;
            const isAll = stage.id === "ALL";

            return (
              <div key={stage.id} className="flex-shrink-0 flex items-center lg:block">
                <button
                  onClick={() => setStatusFilter(stage.id)}
                  className={`
                    w-auto lg:w-full flex justify-between items-center px-4 py-3 rounded-xl text-sm
                    transition-all duration-200 whitespace-nowrap gap-4 lg:gap-0
                    ${!isActive ? "hover:bg-[#f5f1eb] text-[#6b5e52]" : "bg-white shadow-sm font-semibold text-[#9A8B7A] ring-1 ring-gray-200"}
                  `}
                >
                  <div className="flex items-center gap-2">
                    {stage.id === "ALL" && <Layout className="w-4 h-4" />}
                    {stage.id === "SUBMITTED" && <Clock className="w-4 h-4" />}
                    {stage.id === "QUOTED" && <Bell className="w-4 h-4" />}
                    {stage.id === "BIND_REQUESTED" && <CircleSmall className="w-4 h-4" />}
                    {stage.id === "BOUND" && <CheckCircle className="w-4 h-4" />}
                    {stage.id === "DECLINED" && <XCircle className="w-4 h-4" />}
                    {stage.id === "PENDING_CANCEL" && <AlertCircle className="w-4 h-4" />}
                    <span>{stage.label}</span>
                  </div>

                  <span className={`
                    text-xs px-2 py-1 rounded-md font-medium
                    ${isActive ? "bg-[#9A8B7A]/10 text-[#9A8B7A]" : "bg-[#f5f1eb] text-[#6b5e52]"}
                  `}>
                    {getStageCount(stage.id)}
                  </span>
                </button>
                {isAll && (
                  <>
                    <div className="hidden lg:block my-4 border-t border-[#e5ddd5]" />
                    <div className="block lg:hidden mx-2 h-8 border-l border-[#e5ddd5]" />
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT CONTENT AREA */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* TOP BAR / FILTERS */}
          <div className="p-4 md:p-6 border-b border-[#e5ddd5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 md:gap-4 shrink-0">
            <div className="flex items-center gap-4 flex-1 flex-wrap">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  placeholder="Search Agency, Agent, Client, ID, or Policy #"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-[#e5ddd5] rounded-xl text-sm bg-[#fdfaf7] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]/50 transition-all"
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Agency Filter */}
              <select
                value={selectedAgency}
                onChange={(e) => setSelectedAgency(e.target.value)}
                className="py-2 px-3 border border-[#e5ddd5] rounded-xl text-sm bg-[#fdfaf7] text-[#6b5e52] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]/50 transition-all cursor-pointer w-full md:w-auto"
              >
                <option value="ALL">All Agencies</option>
                {availableAgencies.map((agencyName) => (
                  <option key={agencyName} value={agencyName}>{agencyName}</option>
                ))}
              </select>

              {/* Agent Filter */}
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={availableAgents.length === 0}
                className="py-2 px-3 border border-[#e5ddd5] rounded-xl text-sm bg-[#fdfaf7] text-[#6b5e52] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]/50 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              >
                <option value="ALL">All Agents</option>
                {availableAgents.map((agentName) => (
                  <option key={agentName} value={agentName}>{agentName}</option>
                ))}
              </select>
            </div>

            <div className="mt-2 md:mt-0 md:ml-auto text-sm text-gray-500 font-medium whitespace-nowrap">
              {filteredSubmissions.length} of {allSubmissions.length} Applications
            </div>
          </div>

          {/* TABLE */}
          <div className="flex-1 overflow-auto">
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
              <table className="w-full text-sm min-w-[800px]">
                <thead className="bg-[#fdfaf7] text-[#6b5e52] uppercase text-[11px] font-bold tracking-wider sticky top-0 z-10 border-b border-[#e5ddd5]">
                  <tr>
                    <th className="px-4 lg:px-6 py-4 text-left">Agency</th>
                    <th className="px-4 lg:px-6 py-4 text-left">App ID</th>
                    <th className="px-4 lg:px-6 py-4 text-left">Client</th>
                    <th className="px-4 lg:px-6 py-4 text-left">Program</th>
                    <th className="px-4 lg:px-6 py-4 text-left">Status</th>
                    <th className="px-4 lg:px-6 py-4 text-left">
                      {statusFilter === "PENDING_CANCEL" ? "Effective Cancel Date" : "Effective Date"}
                    </th>
                    <th className="px-4 lg:px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5ddd5]">
                  {filteredSubmissions.map((sub) => (
                    <tr
                      key={sub._id}
                      onClick={() => router.push(`/admin/submissions/${sub._id}`)}
                      className="hover:bg-[#fdfaf7] transition-all cursor-pointer group"
                    >
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#2d2a26] group-hover:text-[#9A8B7A] transition-colors">
                          {sub.agencyName || "N/A"}
                        </div>
                        {sub.agentName && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Agent: <span className="font-medium text-[#4a4238]">{sub.agentName}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className="inline-block font-mono text-[12px] font-semibold text-[#6b5e52] tracking-tight">
                          {sub.submissionNumber ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#2d2a26]">{sub.clientName || "N/A"}</div>
                        <div className="text-xs text-[#6b5e52] mt-0.5">{sub.clientEmail}</div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#2d2a26]">
                          {(() => {
                            const program = sub.programName || sub.industry || "N/A";
                            if (program.toLowerCase().includes("manufacturer")) {
                              return "Manufacturers";
                            }
                            if (program.toLowerCase().includes("equipment")) {
                              return "Contractors Equipment";
                            }
                            if (
                              program.includes("Advantage") ||
                              program.includes("Advanteg") ||
                              program.includes("Contractor")
                            ) {
                              return "Construction";
                            }
                            return program;
                          })()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-tighter ${sub.cancelRequested ? "bg-orange-100 text-orange-700 border border-orange-200" : getStatusBadgeColor(sub.status)}`}>
                          {sub.cancelRequested ? "PENDING CANCEL" : sub.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-semibold text-[#2d2a26]">
                          {statusFilter === "PENDING_CANCEL" 
                            ? (sub.effectiveCancellationDate ? new Date(sub.effectiveCancellationDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }) : "—")
                            : (sub.effectiveDate ? new Date(sub.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }) : "—")}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center relative">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubmissionToDelete(sub._id);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all focus:outline-none"
                            title="Delete Submission"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[#9A8B7A] transition-colors" />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && submissionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-[fadeIn_.2s_ease-out]">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-[400px] border border-[#e5ddd5] animate-[slideUp_.2s_ease-out]">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Delete Submission</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              Are you sure you want to completely delete this submission? This action is <strong className="text-red-600">permanent</strong> and will also permanently remove all associated quotes, routing logs, notifications, and uploaded files.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setDeleteModalOpen(false);
                  setSubmissionToDelete(null);
                }}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm focus:outline-none disabled:opacity-50 flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Confirm Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}