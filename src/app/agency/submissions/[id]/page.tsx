"use client";
import DashboardLayout from "@/components/layout/DashboardLayout";
export const dynamic = 'force-dynamic';

import {
  ArrowLeft,
  User,
  MapPin,
  Phone,
  Mail,
  Heart,
  UserPlus,
  Copy,
  Share2,
} from "lucide-react";

import { useState, useEffect, Suspense, useRef } from "react";

import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";


interface SubmissionDetails {
  submission: {
    submissionNumber?: string;
    _id: string;

    submitedAt?: string;
    agencyId: string;
    templateId: any;
    payload: Record<string, any>;
    files: Array<{
      fieldKey: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      bindDate?: string;
      effectiveDate?: string;
      expiryDate?: string;
      status: string
    }>;
    status: string;
    clientContact: {
      name: string;
      phone: string;
      email: string;
      EIN?: string;
      businessAddress: {
        street: string;
        city: string;
        state: string;
        zip: string;
      };
    };
    ccpaConsent: boolean;
    state: string;
    createdAt: string;
    updatedAt: string;
    programId?: string;
    programName?: string;
    submissionId?: string;
    adminNotes?: string;
  };
  routingLogs: Array<{
    _id: string;
    submissionId: string;
    carrierId: {
      _id: string;
      name: string;
      email: string;
    } | null;
    status: string;
    notes?: string;
    createdAt: string;
  }>;
  quotes: Array<{
    _id: string;
    submissionId: string;
    carrierId: {
      _id: string;
      name: string;
      email: string;
    } | null;
    carrierQuoteUSD: number;
    brokerFeeAmountUSD: number;
    finalAmountUSD: number;
    status: string;
    createdAt: string;
    binderPdfUrl?: string;
    proposalPdfUrl?: string;
  }>;
  boundPolicy?: {
    _id: string;
    submissionId: string;
    status: string;
    policyNumber?: string;
    carrierId?: string;
    bindDate?: string;
    effectiveDate?: string;
    expiryDate?: string;
  };
}

const formatCurrency = (val: any) => {
  if (val === undefined || val === null) return "—";
  const num = Number(val);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(num);
};

const RatingRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
    <span className="text-gray-500 text-[14px]">{label}</span>
    <span className="font-medium text-gray-900 text-[14px] text-right">{value}</span>
  </div>
);

function SubmissionDetailsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const submissionId = params?.id as string;

  const [data, setData] = useState<SubmissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [noteFilters, setNoteFilters] = useState<string[]>(["Underwriter"]);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Notes");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);

  const [ratingData, setRatingData] = useState<any>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const handleFileUpload = async (file: File) => {
    if (!submissionId) return;

    // Check file size (10MB max)
    const MAX_MB = 10;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`File size cannot exceed ${MAX_MB}MB`);
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("submissionId", submissionId as string);

    try {
      setUploading(true);

      const res = await fetch(
        `/api/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Upload failed");
      }

      toast.success("Document uploaded successfully");

      // 🔁 refresh submission data
      fetchSubmission();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload document");
    } finally {
      setUploading(false);
    }
  };

  const handleRequestApproval = async () => {
    if (!confirm("Send request for approval?")) return;

    try {
      const res = await fetch(
        `/api/agency/submissions/${submissionId}/request-approval`,
        { method: "POST" }
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      toast.success("Approval request sent!");
      fetchSubmission();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancelRequest = async () => {
    if (!submissionId) return;

    if (!confirm("Send cancel request?")) return;

    try {
      const res = await fetch("/api/agency/cancel-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed");
      }

      toast.success("Cancel request sent");
      fetchSubmission(); // ⭐ refresh page data
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  // ================= ISC BUTTON STYLES =================

  const iscOutlineBtn =
    "h-[42px] px-6 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-800 transition-all duration-200 hover:border-black hover:shadow-[0_0_0_1px_black]";

  const iscPrimaryBtn =
    "h-[42px] px-6 rounded-md text-sm font-semibold bg-[#7A6F64] text-white transition-all duration-200 hover:bg-[#7A6F64]";

  const handleRequestBind = async () => {
    if (!confirm("Request bind approval?")) return;

    try {
      const res = await fetch(
        `/api/agency/submissions/${submissionId}/request-bind`,
        { method: "POST" }
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Bind request sent!");
      fetchSubmission();
    } catch (err: any) {
      toast.error(err.message);
    }
  };
  const toggleNoteFilter = (filter: string) => {
    setNoteFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };
  // ✅ REQUIRED DOCUMENT CHECKLIST TOGGLE (ISC STYLE)
  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc],
    }));
  };





  // Check for success message from edit
  useEffect(() => {
    if (searchParams?.get("updated") === "true") {
      toast.success("Submission updated successfully!", {
        description: "Your changes have been saved.",
      });
      // Remove query param from URL
      router.replace(`/agency/submissions/${submissionId}`, { scroll: false });
    }
  }, [searchParams, router, submissionId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const fetchSubmission = async () => {

    if (!submissionId) return;

    try {
      setLoading(true);

      const res = await fetch(

        `/api/agency/submissions/${submissionId}`
      );

      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "Notes") {
      scrollToBottom();
    }
  }, [activityLogs, activeTab]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !submissionId) return;

    try {
      const res = await fetch(`/api/agency/submissions/${submissionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText, notifyList: noteFilters })
      });

      if (!res.ok) throw new Error("Failed to add note");

      const data = await res.json();

      if (data.note) {
        setActivityLogs(prev => [data.note, ...prev]);
        setNoteText("");
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add note");
    }
  };

  useEffect(() => {
    if (status === "authenticated" && submissionId) {
      fetchSubmission();
      fetchActivityLogs();
    }
  }, [status, submissionId]);

  const fetchActivityLogs = async () => {
    if (!submissionId) return;
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/agency/submissions/${submissionId}/activity`);

      if (response.ok) {
        const data = await response.json();
        setActivityLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Error fetching activity logs:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  useEffect(() => {
    if (activeTab === "Rating Information" && !ratingData && !ratingLoading) {
      const fetchRating = async () => {
        setRatingLoading(true);
        try {
          const res = await fetch(`/api/admin/submissions/${submissionId}/quote`);
          if (!res.ok) {
            throw new Error("Failed to load rating information");
          }
          const result = await res.json();
          setRatingData(result.quote || result.data || result || {});
        } catch (err: any) {
          // Graceful fallback to 0/empty fields on fetch failure
          setRatingData({});
        } finally {
          setRatingLoading(false);
        }
      };
      fetchRating();
    }
  }, [activeTab, submissionId, ratingData, ratingLoading]);


  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "SUBMITTED":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "ROUTED":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "QUOTED":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "BIND_REQUESTED":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "BOUND":
        return "bg-green-100 text-green-800 border border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  const getQuoteStatusBadgeColor = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "ENTERED_BY_ADMIN":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "DECLINED":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };


  if (status === "loading" || loading) {

    return (
      <div className="flex items-center justify-center py-20 bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (error || !data) {
    return (
      <div className="flex flex-col min-h-full">
        <aside className="w-[70px] bg-[#3A3C3F] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-gray-700">
          <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A79A87] to-[#0097A7] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A1F2E] via-[#2A3240] to-[#1A1F2E] rounded-xl flex items-center justify-center shadow-2xl border border-[#A79A87]/20 group-hover:border-[#A79A87]/40 transition-all overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A79A87] to-transparent"></div>
                </div>
                <svg className="relative w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#logoGradient1)" className="drop-shadow-lg" />
                  <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#logoGradient2)" className="drop-shadow-md" />
                  <path d="M50 30 L50 65" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />
                  <path d="M40 47 L60 47" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                  <defs>
                    <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A79A87" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#0097A7" stopOpacity={0.95} />
                    </linearGradient>
                    <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity={0.25} />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#A79A87] rounded-full opacity-60"></div>
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#A79A87] rounded-full opacity-60"></div>
              </div>
            </div>
            <div className="text-center px-2">
              <p className="text-[9px] font-semibold text-gray-400 leading-tight tracking-wide uppercase group-hover:text-gray-300 transition-colors" style={{ letterSpacing: '0.05em' }}>Sterling</p>
              <p className="text-[8px] font-medium text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">Wholesale Insurance</p>
            </div>
          </Link>
        </aside>
        <main className="flex-1 ml-[70px] p-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-red-600 mb-6">{error || "Submission not found"}</p>
            <Link href="/agency/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#A79A87] text-white rounded-lg text-sm font-medium hover:bg-[#00ACC1] transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { submission, routingLogs, quotes, boundPolicy } = data;


  // ✅ STATUS FLAGS (YAHAN ADD KARNA HAI)
  const isSubmitted = submission?.status === "SUBMITTED";
  const isApprovalRequested = submission?.status === "APPROVAL_REQUESTED";
  const isQuoted = submission?.status === "QUOTED";
  const isBindRequested = submission?.status === "BIND_REQUESTED";
  const isBound = submission?.status === "BOUND";

  const statusHistory = [
    {
      _id: submission._id + "-created",
      program: submission.programName || "General Liability",
      changedAt: submission.createdAt,
      user: (session?.user as any)?.agencyName || "System",
      status: "Submission Created",
    },

    ...routingLogs.map((log) => ({
      _id: log._id,
      program: log.carrierId?.name || "Carrier",
      changedAt: log.createdAt,
      user: log.carrierId?.name || "Underwriter",
      status: log.status,
    })),

    ...activityLogs.map((log) => ({
      _id: log._id,
      program: "Activity",
      changedAt: log.createdAt,
      user: log.performedBy?.userName || "System",
      status: log.description,
    })),
  ].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() -
      new Date(a.changedAt).getTime()
  );

  // Build timeline from submission history
  const timeline = [
    {
      date: submission.createdAt,
      title: "Submission Created",
      description: "Application submitted",
      icon: "📝",
      color: "blue",
    },
    ...routingLogs.map((log) => ({
      date: log.createdAt,
      title: `Routed to ${log.carrierId?.name || "Carrier"}`,
      description: log.status === "SENT" ? "Successfully sent" : "Failed to send",
      icon: log.status === "SENT" ? "✅" : "❌",
      color: log.status === "SENT" ? "green" : "red",
    })),
    ...quotes.map((quote) => ({
      date: quote.createdAt,
      title: `Quote Received from ${quote.carrierId?.name || "Carrier"}`,
      description: `Amount: $${quote.finalAmountUSD.toLocaleString()}`,
      icon: "💰",
      color: "purple",
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <DashboardLayout>

      {/* Sidebar - Matching Dashboard */}

      {/* Main Content */}
      <main className="flex-1 ml-[6px] bg-[#F3F0ED] overflow-x-hidden">
        {/* Header */}
        {/* ISC STYLE HEADER – NO BORDER */}
        <div className="bg-white px-6 pt-5 pb-4">
          <div className="flex items-start justify-between">

            {/* LEFT SIDE */}
            <div className="bg-white px-8 py-3">
              {/* <Link href="/agency/dashboard" className="mt-1">
                <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-black" />
              </Link> */}

              <div>
                {/* Title */}
                <h1 className="flex items-center gap-3 text-[24px] font-semibold text-gray-900 leading-[28px]">
                  <div>
                    {(submission?.clientContact?.name || "???")}
                    <span className="inline-flex items-center rounded-md bg-gray-100 px-3 py-[4px] text-[13px] font-medium text-gray-700 ">
                      {(submission?.status || "").replace(/_/g, " ")}
                    </span>
                  </div>
                </h1>

                {/* Meta Row */}
                <div className="flex items-center flex-wrap gap-x-5 gap-y-1 mt-2 text-[14px] text-gray-700">

                  <span className="flex items-center gap-1.5">
                    <User className="w-[18px] h-[18px] text-gray-500" />
                    {(submission?.clientContact?.name || "???")}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" />
                    {(submission?.clientContact?.businessAddress?.city || "???")},{" "}
                    {(submission?.clientContact?.businessAddress?.state || "???")}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {(submission?.clientContact?.phone || "???")}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {(submission?.clientContact?.email || "???")}
                  </span>

                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4">
              {/* APP ID */}
              <span className="text-[14px] text-gray-500 ml-2">
                App ID {submission.submissionNumber || (submission?._id || "").slice(-6)}
              </span>
            </div>
          </div>
        </div>
        {/* APP INFO ROW – ISC STYLE */}
        <div className="bg-white px-6 h-[64px] border-t border-gray-100">
          <div className="flex items-center justify-between w-full h-full">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <h2 className="text-[16px] font-semibold text-gray-900">App Info</h2>
              <span className="px-3 py-[4px] rounded-md bg-gray-100 text-[13px] text-gray-700">
                {(submission?.status || "").replace(/_/g, " ")}
              </span>
            </div>

            {/* RIGHT BUTTONS */}
            <div className="flex items-center gap-3">

              {/* ================= SUBMITTED (IN PROGRESS) ================= */}
              {isSubmitted && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/pdf`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    App Packet
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=view&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>
                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    } className={iscOutlineBtn}>Edit</button>

                  <button
                    onClick={handleRequestApproval}
                    className={iscPrimaryBtn}
                  >
                    Request Approval
                  </button>

                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>
                </>
              )}

              {/* ================= APPROVAL REQUESTED ================= */}
              {isApprovalRequested && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/pdf`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    App Packet
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=view&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    Edit
                  </button>

                  <button
                    disabled
                    className={`${iscPrimaryBtn} opacity-60 cursor-not-allowed`}
                  >
                    Waiting For Approval
                  </button>

                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>
                </>
              )}

              {/* ================= QUOTED (APPROVED QUOTE) ================= */}
              {(isQuoted || isBindRequested) && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/proposal`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    Proposal
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/invoice`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    Invoice
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/pdf`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    App Packet
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=view&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>

                  {submission?.status === "QUOTED" && (
                    <button
                      onClick={handleRequestBind}
                      className={iscPrimaryBtn}
                    >
                      Request Bind
                    </button>
                  )}

                  {isBindRequested && (
                    <button
                      disabled
                      className={`${iscPrimaryBtn} opacity-60 cursor-not-allowed`}
                    >
                      Bind Requested
                    </button>
                  )}

                  <button
                    className={iscOutlineBtn}
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }>
                    Modify
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>

                </>
              )}

              {/* ================= BIND REQUESTED ================= */}
              {/* {isBindRequested && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=view&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>
                  <button
                    onClick={handleCancelRequest}
                    className={iscOutlineBtn}
                  >
                    Cancel Quote
                  </button>
                </>
              )} */}
            </div>

            {/* ================= BOUND (NEWLY BOUND) ================= */}
            {submission?.status === "BOUND" && (
              <>
                <button
                  onClick={() =>
                    window.open(
                      `/agency/quote/${submission.programId}?mode=view&id=${submission._id}`,
                      "_blank"
                    )
                  }
                  className={iscOutlineBtn}
                >
                  View
                </button>
              </>
            )}
          </div>
        </div>
        {/* KEY INFO GRID – ISC STYLE */}
        {/* ISC STYLE – KEY INFO STRIP */}
        <div className="bg-white px-6 py-5 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-y-6 gap-x-14 text-[14px]">

            {/* Total Cost */}
            <div>
              <p className="text-gray-500 mb-1">Total Cost:</p>
              <p className="font-semibold text-gray-900">
                {quotes.length > 0
                  ? `$${quotes[0].finalAmountUSD.toLocaleString()}`
                  : "Not Quoted"}
              </p>
            </div>

            {/* Create Date */}
            <div>
              <p className="text-gray-500 mb-1">Create Date:</p>
              <p className="font-semibold text-gray-900">
                {(submission?.createdAt ? new Date(submission.createdAt) : new Date()).toLocaleString()}
              </p>
            </div>

            {/* Agency */}
            <div>
              <p className="text-gray-500 mb-1">Agency:</p>
              <p className="font-semibold text-gray-900">
                {(session?.user as any)?.agencyName || "—"}
              </p>
            </div>

            {/* Agent */}
            <div>
              <p className="text-gray-500 mb-1">Agent:</p>
              <p className="font-semibold text-gray-900">
                {submission?.payload?.agentName || "—"}
              </p>
            </div>

            {/* Payment Option */}
            <div>
              <p className="text-gray-500 mb-1">Payment Option:</p>
              <p className="font-semibold text-gray-900">
                {submission?.payload?.paymentOption || "—"}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Bind Date:</p>
              <p className="font-semibold text-gray-900">
                {submission.status !== "BOUND"
                  ? "Not Bound"
                  : boundPolicy?.bindDate
                    ? new Date(boundPolicy.bindDate).toLocaleDateString()
                    : "—"}
              </p>
            </div>

          </div>
        </div>
        {/* ISC STYLE – STANDARD GL A-RATED SECTION */}
        <div className="bg-white px-8 py-6 border-t border-gray-200">

          {/* SECTION TITLE */}
          <div className="mb-6">
            <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
              General Liability
            </h3>
            <div className="mt-2 h-[1px] w-64 bg-gray-300" />
          </div>

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-24 gap-y-6 text-[14px]">

            {/* LEFT */}
            <div className="space-y-4">
              <div className="flex">
                <span className="w-28 text-gray-500">Carrier:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {quotes[0]?.carrierId?.name || "—"}
                </span>
              </div>

              <div className="flex">
                <span className="w-28 text-gray-500">Cost:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {quotes.length > 0
                    ? `$${quotes[0].finalAmountUSD.toLocaleString()}`
                    : "Not Quoted"}
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <div className="flex">
                <span className="w-36 text-gray-500">Policy Number:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  Not Bound
                </span>
              </div>

              <div className="flex">
                <span className="w-36 text-gray-500">Effective Date:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {(submission?.createdAt ? new Date(submission.createdAt) : new Date()).toLocaleDateString()}
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* ISC STYLE – UPLOAD DOCUMENTS */}
        <div className="bg-white px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-10 border-b border-gray-200">

          {/* LEFT – UPLOADED DOCUMENTS */}
          <div className="lg:col-span-2">

            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
              Uploaded Documents
            </h3>

            {/* Upload Box */}
            <label className="border border-dashed border-gray-300 rounded-md p-6 flex items-center justify-between mb-6 cursor-pointer">
              <p className="text-[14px] text-gray-500">
                Drag and drop your files here to start uploading or
              </p>

              <input
                type="file"
                hidden
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />

              <span className="ml-4 px-5 py-2 bg-[#9A8B7A] hover:bg-[#7A6F64] text-white text-[14px] font-medium rounded-md transition-colors">
                {uploading ? "Uploading..." : "Browse"}
              </span>
            </label>

            {/* TABLE HEADER */}
            <div className="bg-gray-100 px-4 py-2 grid grid-cols-3 text-[13px] font-medium text-gray-600">
              <span>Filename</span>
              <span>Uploaded On</span>
              <span>Action</span>
            </div>

            {/* FILE ROWS */}
            {submission.files.length === 0 ? (
              <div className="px-4 py-6 text-[14px] text-gray-400 border border-t-0 border-gray-200">
                No documents uploaded yet
              </div>
            ) : (
              submission.files.map((file, index) => (
                <div
                  key={index}
                  className="px-4 py-3 grid grid-cols-3 items-center text-[14px] border border-t-0 border-gray-200"
                >
                  <span className="font-medium text-gray-900">
                    {file.fileName}
                  </span>

                  <span className="text-gray-500">
                    {(submission?.updatedAt ? new Date(submission.updatedAt) : new Date()).toLocaleDateString()}
                  </span>

                  <a
                    href={`/api/download?url=${encodeURIComponent(file.fileUrl)}`}
                    download={file.fileName}
                    className="text-[#9A8B7A] hover:text-[#7A6F64] font-medium hover:underline transition-colors"
                  >
                    Download
                  </a>
                </div>
              ))
            )}
          </div>

          {/* RIGHT – REQUIRED DOCUMENTS CHECKLIST */}
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-5 tracking-tight">
              Required Documents Checklist
            </h3>
            <div className="space-y-6 text-[14px]">
              {[
                "Signed GL Application",
                "Signed Loss Warranty Letter",
                "Invoice Statement",
                "Surplus Line Acknowledgment",
                "Terrorism Acknowledgment",
              ].map((doc) => {
                const checked = checkedDocs[doc];

                return (
                  <div
                    key={doc}
                    onClick={() => toggleDoc(doc)}
                    className="flex items-center gap-4 cursor-pointer"
                  >
                    {/* CLEAN ISC CIRCLE */}
                    <div
                      className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all
                      ${checked
                          ? "bg-[#9A8B7A] border-[#9A8B7A]"
                          : "border-gray-300"
                        }`}
                    >
                      {checked && (
                        <svg
                          className="w-3 h-3 text-white"
                          viewBox="0 0 20 20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path d="M5 10l3 3 7-7" />
                        </svg>
                      )}
                    </div>

                    {/* TEXT */}
                    <span className="text-gray-800 leading-tight">
                      {doc}
                    </span>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
        {/* ================= NOTES – ISC STYLE ================= */}
        <div className="bg-white px-8 py-6 border-t border-gray-200">
          {/* Tabs */}
          <div className="flex items-center gap-10 text-[14px] mb-6 border-b">
            {["Notes", "Status History", , "Contact Information", "Rating Information"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 cursor-pointer transition ${activeTab === tab
                    ? "border-b-2 border-black text-black font-medium"
                    : "text-gray-400 hover:text-gray-600"
                    }`}
                >
                  {tab}
                </button>
              )
            )}
          </div>
          {activeTab === "Notes" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* LEFT – ADD NOTE */}
              <div className="lg:col-span-2">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                  Add Note
                </h3>

                {/* Notify Filters */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  <span className="text-[13px] text-gray-500 mr-2">Notify:</span>

                  {[
                    "Underwriter",
                    "Accounting",
                    "Endorsements",
                    "Cancellations",
                    "Audits",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleNoteFilter(item)}
                      className={`px-3 py-1.5 rounded-md text-[13px] border transition ${noteFilters.includes(item)
                        ? "bg-black text-white border-black"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                {/* Chat Box */}
                <div className="flex gap-4 items-start">
                  {/* Avatar */}<div className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold">

                    {(session?.user as any)?.agencyName?.[0] || "U"}
                  </div>

                  {/* Textarea */}
                  <div className="flex-1">
                    <textarea
                      rows={4} className="w-full border border-gray-300 rounded-md p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Leave a note..."

                    />

                    <div className="mt-3 flex justify-end">
                      <button onClick={handleAddNote} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9A8B7A] hover:bg-[#7A6F64] text-white rounded-md text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"><span className="text-base">+</span>Add Note</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT – NOTES THREAD */}
              <div className="flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    Notes Thread
                  </h3>
                </div>

                {/* Chat Container */}
                <div className="border rounded-xl bg-gray-50 flex-1 overflow-y-auto p-4 flex flex-col gap-4 shadow-inner relative">

                  {activityLogs.filter(log => log.activityType === "ADMIN_NOTE_ADDED").length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg mb-4 opacity-70" />
                      <p className="font-medium text-gray-500 mb-1">No notes added yet</p>
                      <p className="text-[13px] text-gray-400">Drop in questions or comments to help us assist you.</p>
                    </div>
                  ) : (
                    activityLogs
                      .filter(log => log.activityType === "ADMIN_NOTE_ADDED")
                      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((note) => {
                        const isMe = note.performedBy?.userId === (session?.user as any)?.id;
                        return (
                          <div key={note._id} className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                            <div className={`flex flex-col max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>

                              <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed relative ${isMe
                                ? "bg-[#9A8B7A] text-white rounded-tr-sm"
                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                                }`}>
                                {!isMe && (
                                  <div className="text-[11px] font-bold text-gray-400 mb-1 tracking-tight">
                                    {note.performedBy?.userName || "Admin"}
                                  </div>
                                )}
                                <span className="whitespace-pre-wrap break-words">{note.description}</span>
                              </div>

                              <div className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium select-none">
                                {new Date(note.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                {' • '}
                                {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </div>

                            </div>
                          </div>
                        );
                      })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            </div>
          )}
          {activeTab === "Status History" && (
            <div className="border rounded-md overflow-hidden">
              <div className="bg-gray-100 px-4 py-2 grid grid-cols-4 text-sm font-medium text-gray-600">
                <span>Program</span>
                <span>Changed</span>
                <span>User</span>
                <span>Status</span>
              </div>

              {statusHistory.map((item) => (
                <div
                  key={item._id}
                  className="px-4 py-3 grid grid-cols-4 text-sm border-t"
                >
                  <span>{item.program}</span>
                  <span>{new Date(item.changedAt).toLocaleString()}</span>
                  <span>{item.user}</span>
                  <span>{item.status}</span>
                </div>
              ))}
            </div>
          )}
          {activeTab === "Contact Information" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

              {/* ================= PRODUCER ================= */}
              <div className="border rounded-md p-6 bg-gray-50">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                  Producer
                </h3>

                <div className="space-y-3 text-[14px]">

                  <div>
                    <p className="font-semibold text-gray-900">
                      {submission?.payload?.agentName || "—"}
                    </p>
                    <p className="text-gray-500">
                      {(session?.user as any)?.agencyName || "—"}
                    </p>
                  </div>

                  <div className="pt-4 space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        {(session?.user as any)?.agencyAddress || "—"},{" "}
                        {(session?.user as any)?.agencyCity || "—"},{" "}
                        {(session?.user as any)?.agencyState || "—"}{" "}
                        {(session?.user as any)?.agencyZip || "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>{(session?.user as any)?.agencyPhone || "—"}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>{((session?.user as any)?.agencyEmail || "—")}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= WHOLESALER ================= */}
              <div className="border rounded-md p-6 bg-gray-50">
                <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
                  Wholesaler
                </h3>

                <div className="space-y-3 text-[14px]">

                  <div>
                    <p className="font-semibold text-gray-900">
                      {quotes[0]?.carrierId?.name || "Sterling Insurance Services"}
                    </p>
                  </div>

                  <div className="pt-4 space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        5455 Wilshire Blvd, Los Angeles, CA 90036, United States
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>(310) 492-2007</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>
                        {quotes[0]?.carrierId?.email || "info@sterlinginsurancepartners.com"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === "Rating Information" && (
            <div className="space-y-6">
              {ratingLoading ? (
                <div className="animate-pulse space-y-6">
                  {/* Skeleton loader */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                    <div className="bg-white rounded-lg border border-gray-200 p-6 h-[400px]"></div>
                    <div className="bg-white rounded-lg border border-gray-200 p-6 h-[400px]"></div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
                    {/* Rate Breakdown */}
                    <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                          <span className="text-white font-bold text-[18px]">$</span>
                        </div>
                        <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                          Rate Breakdown
                        </h3>
                      </div>
                      <div className="flex flex-col gap-5 flex-grow mb-8">
                        <RatingRow label="Total Premium" value={formatCurrency(ratingData?.totalPremium || 0)} />
                        <RatingRow label="Carrier Fees" value={formatCurrency(ratingData?.carrierFees || 0)} />
                        <RatingRow label="Sterling Insurance Services Fees" value={formatCurrency(ratingData?.sterlingFees || 0)} />
                        <RatingRow label="Surplus Lines Tax (%)" value={formatCurrency(ratingData?.surplusLinesTax || 0)} />
                        <RatingRow label="Stamping Fee (%)" value={formatCurrency(ratingData?.stampingFee || 0)} />
                        <RatingRow label="Fire Marshal Tax (%)" value={formatCurrency(ratingData?.fireMarshalTax || 0)} />
                      </div>

                      {/* Total Cost inside the Left Card pinned to bottom */}
                      <div className="mt-auto pt-6 border-t flex justify-between items-center">
                        <span className="text-[16px] font-bold text-gray-900">Total Cost:</span>
                        <span className="text-[22px] font-bold text-gray-900">
                          {formatCurrency(ratingData?.totalCost || 0)}
                        </span>
                      </div>
                    </div>

                    {/* Broker Breakdown */}
                    <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                          <User className="w-[20px] h-[20px] text-white" />
                        </div>
                        <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                          Broker Breakdown
                        </h3>
                      </div>
                      <div className="flex flex-col gap-5 flex-grow mb-8">
                        <RatingRow label="Commission (10%)" value={formatCurrency(ratingData?.commission || 0)} />
                        <RatingRow label="Broker Fee" value={formatCurrency(ratingData?.commissionTax || 0)} />
                        {/* <RatingRow label="Excess Commission" value={formatCurrency(ratingData?.excessCommission || 0)} />*/}
                      </div>

                      {/* Total for Broker inside the Right Card pinned to bottom */}
                      <div className="mt-auto pt-6 border-t flex justify-between items-center">
                        <span className="text-[16px] font-bold text-gray-900">Total for Broker:</span>
                        <span className="text-[22px] font-bold text-gray-900">
                          {formatCurrency(ratingData?.brokerTotal || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
        {/* ================= END NOTES ================= */}
        {/* Content */}

      </main>
    </DashboardLayout>
  );
}

export default function SubmissionDetailsPage() {
  return (

    <Suspense fallback={
      <div className="fixed inset-0 bg-[#F3F0ED] flex items-center justify-center z-50">
        <div className="text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-[#F3F0ED]"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#9A8B7A] animate-spin"></div>
            </div>

            <p className="text-[14px] text-[#7A6F64] font-medium tracking-wide">
              Loading submission details...
            </p>
          </div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <SubmissionDetailsContent />
    </Suspense>
  );
}