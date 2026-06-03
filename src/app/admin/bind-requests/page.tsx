"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";
import { Menu, Upload, File as FileIcon, X as CloseIcon } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

interface BindRequestSubmission {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  agencyId: {
    _id: string;
    name: string;
  };
  status: string;
  bindRequested: boolean;
  bindRequestedAt: string;
  bindApproved: boolean;
  bindApprovedAt?: string;
  esignCompleted: boolean;
  paymentStatus: string;
  paymentDate?: string;
  createdAt: string;
  quotes?: any[];
  programId?: string;
  programName?: string;
}

export default function AdminBindRequestsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [submissions, setSubmissions] = useState<BindRequestSubmission[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isDraggingBinder, setIsDraggingBinder] = useState(false);
  const [isDraggingDocs, setIsDraggingDocs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  type PolicyFormData = {
    effectiveDate: string;
    expirationDate: string;
    policyNumber: string;
    binderFile: File | null;
    policyDocsFile: File | null;
  };

  const initialPolicyForm = (): PolicyFormData => {
    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(today.getFullYear() + 1);
    return {
      effectiveDate: today.toISOString().split("T")[0],
      expirationDate: nextYear.toISOString().split("T")[0],
      policyNumber: "",
      binderFile: null,
      policyDocsFile: null,
    };
  };

  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [activePolicyTab, setActivePolicyTab] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");
  const [policyForms, setPolicyForms] = useState<Record<string, PolicyFormData>>({
    GENERAL_LIABILITY: initialPolicyForm(),
    EXCESS_LIABILITY: initialPolicyForm(),
  });

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

  useEffect(() => {
    if (status === "authenticated") {
      // Single load when page mounts (no auto-refresh)
      fetchBindRequests();
    }
  }, [status]);

  const handleEffectiveDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const effectiveDateStr = e.target.value;
    if (!effectiveDateStr) {
      setPolicyForms(prev => ({
        ...prev,
        [activePolicyTab]: { ...prev[activePolicyTab], effectiveDate: "", expirationDate: "" }
      }));
      return;
    }

    const effectiveDate = new Date(effectiveDateStr);
    const expirationDate = new Date(effectiveDate);
    expirationDate.setFullYear(effectiveDate.getFullYear() + 1);

    setPolicyForms(prev => ({
      ...prev,
      [activePolicyTab]: {
        ...prev[activePolicyTab],
        effectiveDate: effectiveDateStr,
        expirationDate: expirationDate.toISOString().split("T")[0],
      }
    }));
  };

  const fetchBindRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bind-requests", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bind requests");
      }

      setSubmissions(data.submissions || []);
      setPendingCount(data.submissions?.length || 0);
      return data.submissions || [];
    } catch (err: any) {
      console.error("Fetch bind requests error:", err);
      setError(err.message || "Failed to load bind requests");
      return [];
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (submissionId: string) => {
    setSelectedSubmissionId(submissionId);

    // Auto-select the first pending quote tab
    const sub = submissions.find(s => s._id === submissionId);
    const firstPendingQuote = sub?.quotes?.find((q: any) => q.status === "BIND_REQUESTED");
    if (firstPendingQuote && firstPendingQuote.policyType) {
      setActivePolicyTab(firstPendingQuote.policyType);
    } else {
      setActivePolicyTab("GENERAL_LIABILITY");
    }

    setPolicyForms({
      GENERAL_LIABILITY: initialPolicyForm(),
      EXCESS_LIABILITY: initialPolicyForm()
    });

    setIsApproveModalOpen(true);
  };

  const confirmApprove = async () => {
    if (!selectedSubmissionId) return;

    const pType = activePolicyTab;
    const data = policyForms[pType];

    const sub = submissions.find((s) => s._id === selectedSubmissionId);
    const label = pType === "GENERAL_LIABILITY"
      ? (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "Property" : "General Liability")
      : (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability");

    // Validation for ONLY the active policy tab
    if (!data.effectiveDate || !data.expirationDate || !data.policyNumber) {
      toast.error(`Please fill in all required fields for ${label}`);
      return;
    }

    setApproving(selectedSubmissionId);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("submissionId", selectedSubmissionId);
      formDataToSend.append("policyType", pType);
      formDataToSend.append("effectiveDate", data.effectiveDate);
      formDataToSend.append("expirationDate", data.expirationDate);
      formDataToSend.append("policyNumber", data.policyNumber);

      if (data.binderFile) {
        formDataToSend.append("binder", data.binderFile);
      }

      if (data.policyDocsFile) {
        formDataToSend.append("policyDocs", data.policyDocsFile);
      }

      const response = await fetch("/api/admin/bind-requests/approve", {
        method: "POST",
        body: formDataToSend,
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || `Failed to approve ${pType}`);
      }

      const subForToast = submissions.find((s) => s._id === selectedSubmissionId);
      const labelForToast = pType === "GENERAL_LIABILITY"
        ? (subForToast?.programId === 'apartment-buildings' || subForToast?.programName === 'Commercial Property' || subForToast?.programName === 'Apartment Building' ? "Property" : "General Liability")
        : (subForToast?.programId === 'apartment-buildings' || subForToast?.programName === 'Commercial Property' || subForToast?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability");

      toast.success(`${labelForToast} approved successfully!`, {
        description: "The policy has been marked as BOUND with policy details",
      });

      // Refresh the bind requests list and get fresh data
      const freshSubmissions = await fetchBindRequests();

      // Check if there are still other pending policies for this same submission
      const sub = freshSubmissions.find((s: any) => s._id === selectedSubmissionId);
      const otherPending = sub?.quotes?.filter((q: any) => q.status === "BIND_REQUESTED") || [];

      if (otherPending.length > 0) {
        // If there are more pending, stay on modal and let admin handle next policy
        // (already switches tab naturally if they click another tab, or we can auto-switch)
        setActivePolicyTab(otherPending[0].policyType || "GENERAL_LIABILITY");
      } else {
        // Otherwise close the modal
        setIsApproveModalOpen(false);
      }
    } catch (err: any) {
      console.error("Approve error:", err);
      toast.error("Failed to approve bind request", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setApproving(null);
    }
  };

  const filteredSubmissions = submissions.filter((sub) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      sub.clientContact?.name?.toLowerCase().includes(query) ||
      sub.clientContact?.email?.toLowerCase().includes(query) ||
      sub.agencyId?.name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading bind requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:py-0 lg:h-16 gap-4 lg:gap-0">
            <div className="flex items-center justify-between w-full lg:w-auto">
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
                <Link href="/admin/bind-requests" className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                  Bind Requests
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                  {pendingCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[#9A8B7A] rounded-full shadow-lg animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Tool Requests
                </Link>
              </nav>
            </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
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
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Page Title with Pending Banner */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#9A8B7A] rounded-xl flex items-center justify-center shadow-lg shadow-gray-200/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bind Requests</h1>
              <p className="text-sm text-gray-600 font-medium mt-0.5">Review and approve bind requests from agencies</p>
            </div>
          </div>

          {/* Pending Count Banner */}
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
                    Action required: Review and process bind requests
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search by Agency Name, Client Name, or Email..."
            className="block w-full pl-11 pr-4 py-3 border border-[#e5ddd5] rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent sm:text-sm shadow-sm transition-all duration-300"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Bind Requests List */}
        {submissions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No Pending Bind Requests</p>
            <p className="text-sm text-gray-600">All bind requests have been processed</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center">
            <p className="text-lg font-semibold text-gray-900 mb-1">No results found</p>
            <p className="text-sm text-gray-600">Try adjusting your search query</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSubmissions.map((submission) => (
              <div
                key={submission._id}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] hover:shadow-xl hover:border-[#9A8B7A] transition-all duration-300 overflow-hidden"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{submission.clientContact.name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f5f1eb] text-[#9A8B7A] border border-[#e5ddd5]">
                          BIND REQUESTED
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">{submission.agencyId.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{new Date(submission.bindRequestedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/60 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Client Email</p>
                      <p className="text-sm font-bold text-gray-900">{submission.clientContact.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Client Phone</p>
                      <p className="text-sm font-bold text-gray-900">{submission.clientContact.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">E-Sign Status</p>
                      <p className={`text-sm font-bold ${submission.esignCompleted ? 'text-green-600' : 'text-orange-600'}`}>
                        {submission.esignCompleted ? '✓ Completed' : 'Pending'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Payment Status</p>
                      <p className={`text-sm font-bold ${submission.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'}`}>
                        {submission.paymentStatus === 'PAID' ? '✓ Paid' : 'Pending'}
                        {submission.paymentDate && ` on ${new Date(submission.paymentDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    <Link
                      href={`/admin/submissions/${submission._id}`}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Details
                    </Link>
                    <button
                      onClick={() => handleApprove(submission._id)}
                      disabled={approving === submission._id}
                      className="px-6 py-2 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/30 hover:shadow-gray-300 transition-all duration-300 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approving === submission._id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Approving...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Approve Bind
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Approve Bind Modal */}
      {isApproveModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => !approving && setIsApproveModalOpen(false)}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-[#9A8B7A] rounded-xl flex items-center justify-center shadow-lg shadow-gray-200/20">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Approve Bind Request</h3>
                  <p className="text-sm text-gray-500">Enter policy details to finalize</p>
                </div>
              </div>

              {/* TABS FOR MULTI-POLICY */}
              {(() => {
                const sub = submissions.find((s) => s._id === selectedSubmissionId);
                const pendingQuotes = sub?.quotes?.filter((q: any) => q.status === "BIND_REQUESTED") || [];
                if (pendingQuotes.length > 1) {
                  return (
                    <div className="flex border-b border-gray-200 mb-6 w-full">
                      {pendingQuotes.map((q: any) => (
                        <button
                          key={q.policyType}
                          onClick={() => setActivePolicyTab(q.policyType || "GENERAL_LIABILITY")}
                          className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-all duration-200 ${activePolicyTab === (q.policyType || "GENERAL_LIABILITY")
                            ? "border-[#9A8B7A] text-[#9A8B7A]"
                            : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-300"
                            }`}
                        >
                          {q.policyType === "GENERAL_LIABILITY"
                            ? (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "Property" : "General Liability")
                            : (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability")
                          }
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Effective Date</label>
                  <input
                    type="date"
                    value={policyForms[activePolicyTab]?.effectiveDate || ""}
                    onChange={handleEffectiveDateChange}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5ddd5] rounded-xl text-gray-900 focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all outline-none"
                    placeholder="Select Effective Date"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Expiration Date</label>
                  <input
                    type="date"
                    value={policyForms[activePolicyTab]?.expirationDate || ""}
                    readOnly
                    className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed outline-none font-medium"
                    placeholder="Expiration Date"
                  />
                  <p className="text-[11px] text-gray-400 mt-1 font-medium italic">* Auto-calculated: 1 year from effective date</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Policy Number</label>
                  <input
                    type="text"
                    value={policyForms[activePolicyTab]?.policyNumber || ""}
                    onChange={(e) => setPolicyForms(prev => ({
                      ...prev,
                      [activePolicyTab]: { ...prev[activePolicyTab], policyNumber: e.target.value }
                    }))}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-[#e5ddd5] rounded-xl text-gray-900 focus:ring-2 focus:ring-[#9A8B7A]/20 focus:border-[#9A8B7A] transition-all outline-none"
                    placeholder="Enter Policy Number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Binder</label>
                  {policyForms[activePolicyTab]?.binderFile ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl group/file">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-green-800 truncate">
                          {policyForms[activePolicyTab].binderFile!.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPolicyForms(prev => ({ ...prev, [activePolicyTab]: { ...prev[activePolicyTab], binderFile: null } }))}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingBinder(true);
                      }}
                      onDragLeave={() => setIsDraggingBinder(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingBinder(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          setPolicyForms(prev => ({
                            ...prev,
                            [activePolicyTab]: { ...prev[activePolicyTab], binderFile: file }
                          }));
                        }
                      }}
                      className={`relative group cursor-pointer transition-all duration-300 ${isDraggingBinder 
                        ? "border-[#9A8B7A] bg-[#9A8B7A]/5" 
                        : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                      } border-2 border-dashed rounded-xl p-6 text-center`}
                      onClick={() => document.getElementById(`binder-input-${activePolicyTab}`)?.click()}
                    >
                      <input
                        id={`binder-input-${activePolicyTab}`}
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => setPolicyForms(prev => ({
                          ...prev,
                          [activePolicyTab]: { ...prev[activePolicyTab], binderFile: e.target.files?.[0] || null }
                        }))}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDraggingBinder ? "bg-[#9A8B7A] text-white" : "bg-white text-[#9A8B7A] shadow-sm"}`}>
                          <Upload className={`w-6 h-6 ${isDraggingBinder ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Click or drag binder here</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">PDF, DOC up to 10MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Policy Docs</label>
                  {policyForms[activePolicyTab]?.policyDocsFile ? (
                    <div className="flex items-center justify-between px-4 py-3 bg-green-50 border border-green-200 rounded-xl group/file">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileIcon className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-semibold text-green-800 truncate">
                          {policyForms[activePolicyTab].policyDocsFile!.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPolicyForms(prev => ({ ...prev, [activePolicyTab]: { ...prev[activePolicyTab], policyDocsFile: null } }))}
                        className="p-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Remove file"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDraggingDocs(true);
                      }}
                      onDragLeave={() => setIsDraggingDocs(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingDocs(false);
                        const file = e.dataTransfer.files?.[0];
                        if (file) {
                          setPolicyForms(prev => ({
                            ...prev,
                            [activePolicyTab]: { ...prev[activePolicyTab], policyDocsFile: file }
                          }));
                        }
                      }}
                      className={`relative group cursor-pointer transition-all duration-300 ${isDraggingDocs 
                        ? "border-[#9A8B7A] bg-[#9A8B7A]/5" 
                        : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                      } border-2 border-dashed rounded-xl p-6 text-center`}
                      onClick={() => document.getElementById(`docs-input-${activePolicyTab}`)?.click()}
                    >
                      <input
                        id={`docs-input-${activePolicyTab}`}
                        type="file"
                        accept=".pdf,.doc,.docx,.zip"
                        onChange={(e) => setPolicyForms(prev => ({
                          ...prev,
                          [activePolicyTab]: { ...prev[activePolicyTab], policyDocsFile: e.target.files?.[0] || null }
                        }))}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isDraggingDocs ? "bg-[#9A8B7A] text-white" : "bg-white text-[#9A8B7A] shadow-sm"}`}>
                          <Upload className={`w-6 h-6 ${isDraggingDocs ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">Click or drag policy docs here</p>
                          <p className="text-xs text-gray-500 font-medium mt-1">PDF, DOC, ZIP up to 20MB</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <button
                  onClick={() => setIsApproveModalOpen(false)}
                  disabled={approving !== null}
                  className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmApprove}
                  disabled={approving !== null}
                  className="flex-[2] px-4 py-2.5 text-sm font-bold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {approving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    (() => {
                      const sub = submissions.find((s) => s._id === selectedSubmissionId);
                      const label = activePolicyTab === "GENERAL_LIABILITY"
                        ? (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "Property" : "General Liability")
                        : (sub?.programId === 'apartment-buildings' || sub?.programName === 'Commercial Property' || sub?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability");
                      return `Approve ${label}`;
                    })()
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
