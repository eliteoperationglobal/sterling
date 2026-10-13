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
  Upload,
  File as FileIcon,
  X as CloseIcon,
} from "lucide-react";

import { useState, useEffect, Suspense, useRef, useMemo } from "react";
import useSWR from "swr";
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
    dba: string;
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
    policyNumber?: string;
    effectiveDate?: string;
    expirationDate?: string;
    binderUrl?: string;
    policyDocsUrl?: string;
    policies?: Array<{
      type: string;
      status: string;
      carrierId: string;
      premium: number;
      finalAmount: number;
    }>;
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
    policyType?: 'GENERAL_LIABILITY' | 'EXCESS_LIABILITY';
    carrierId: {
      _id: string;
      name: string;
      email: string;
    } | null;
    carrierQuoteUSD: number;
    carrierFeesUSD?: number;
    sterlingInsuranceServicesFeesUSD?: number;
    premiumTaxAmountUSD?: number;
    stampingFeeAmountUSD?: number;
    fireMarshalTaxAmountUSD?: number;
    fireMarshalFlatFeeUSD?: number;
    stampingFeePerFilingUSD?: number;
    slaServiceChargeUSD?: number;
    slasTransactionFeeAmountUSD?: number;
    brokerFeeAmountUSD: number;
    finalAmountUSD: number;
    status: string;
    createdAt: string;
    binderPdfUrl?: string;
    proposalPdfUrl?: string;
    binderUrl?: string;
    policyDocsUrl?: string;
    expirationDate?: string;
    policyNumber?: string;
    effectiveDate?: string;
    carrierReference?: string;
    specialNotes?: string;
    customDocuments?: string[];
    checkedDocuments?: Record<string, boolean>;
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

  const fetcher = (url: string) => fetch(url).then(r => r.json());
  const { data: fetchResult, error: fetchError, mutate } = useSWR(
    status === "authenticated" && submissionId ? `/api/agency/submissions/${submissionId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const data = fetchResult || null;
  const loading = !fetchResult && !fetchError && status === "authenticated";
  const error = fetchError?.message || fetchResult?.error || "";

  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const loadingActivity = false;

  const [searchTerm, setSearchTerm] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [noteText, setNoteText] = useState("");
  const [noteFilters, setNoteFilters] = useState<string[]>(["Underwriter"]);
  const [emailHistory, setEmailHistory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("Notes");
  const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [availablePolicies, setAvailablePolicies] = useState<string[]>(["GENERAL_LIABILITY"]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [ratingError, setRatingError] = useState("");

  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  const [documentToDelete, setDocumentToDelete] = useState<{ fileName: string; fileUrl: string } | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;
    setIsDeletingDoc(true);
    try {
      const url = new URL(`/api/submissions/${submissionId}/documents`, window.location.origin);
      url.searchParams.append("fileUrl", documentToDelete.fileUrl);
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete document");
      }
      toast.success("Document deleted successfully");
      mutate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    } finally {
      setIsDeletingDoc(false);
      setDocumentToDelete(null);
    }
  };

  const [bindSelectedCarrierIdGL, setBindSelectedCarrierIdGL] = useState<string | null>(null);
  const [bindSelectedCarrierIdXL, setBindSelectedCarrierIdXL] = useState<string | null>(null);
  const [paymentAuthModalOpen, setPaymentAuthModalOpen] = useState(false);
  const [paymentAuthConfirmed, setPaymentAuthConfirmed] = useState(false);
  const [paymentAuthData, setPaymentAuthData] = useState({
    premiumAmount: "",
    processingFee: 0,
    totalDue: 0,
    cardName: "",
    cardNumber: "",
    cardExpiry: "",
    cardCvv: "",
    cardZip: "",
    achName: "",
    achAddress: "",
    achBank: "",
    achRouting: "",
    achAccount: ""
  });

  const carrierGroups = useMemo(() => {
    if (!data?.quotes?.length) return [];

    const groups: Record<string, { carrierId: string; carrierName: string; quotes: any[] }> = {};

    data.quotes.forEach((q: any) => {
      const cid = q.carrierId?._id || "unknown";
      const cname = q.carrierId?.name || "Unknown Carrier";

      if (!groups[cid]) {
        groups[cid] = { carrierId: cid, carrierName: cname, quotes: [] };
      }
      groups[cid].quotes.push(q);
    });

    return Object.values(groups);
  }, [data?.quotes]);

  useEffect(() => {
    if (carrierGroups.length > 0 && !selectedCarrierId) {
      // DEFAULT TO BOUND CARRIER IF EXISTS
      const boundQuote = data?.quotes?.find((q: any) => q.status === "BOUND");
      if (boundQuote) {
        setSelectedCarrierId(boundQuote.carrierId?._id || boundQuote.carrierId);
      } else {
        setSelectedCarrierId(carrierGroups[0].carrierId);
      }
    }
  }, [carrierGroups, selectedCarrierId, data?.quotes]);

  const currentRoundTotal = useMemo(() => {
    if (!data?.quotes?.length) return 0;

    // IF BOUND: Show the sum of ALL policies that are actually bound (across all carriers)
    if (data?.submission?.status === "BOUND") {
      return data.quotes
        .filter((q: any) => q.status === "BOUND")
        .reduce((sum: number, q: any) => sum + (q.finalAmountUSD || 0), 0);
    }

    // OTHERWISE (Comparison Mode): Show total for the currently selected carrier
    const group = carrierGroups.find(g => g.carrierId === selectedCarrierId) || carrierGroups[0];
    if (!group) return 0;
    return group.quotes.reduce((sum: number, q: any) => sum + (q.finalAmountUSD || 0), 0);
  }, [data, carrierGroups, selectedCarrierId]);

  const currentQuote: SubmissionDetails["quotes"][0] | null = useMemo(() => {
    if (!data?.quotes?.length) return null;

    // IF BOUND: Prefer the ACTUAL bound quote for this policy type
    if (data?.submission?.status === "BOUND") {
      const boundQuoteForType = data.quotes.find((q: any) =>
        q.status === "BOUND" &&
        (q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY"))
      );
      if (boundQuoteForType) return boundQuoteForType;

      // FALLBACK: If no bound quote exists for this type yet (e.g. newly added Excess), 
      // fall through to the comparison mode lookup below to show the POSTED quote.
    }

    // OTHERWISE (Comparison Mode): Isolate lookup to selected carrier group only
    const group = carrierGroups.find(g => g.carrierId === selectedCarrierId) || carrierGroups[0];
    if (!group) return null;

    const policyQuote = group.quotes.find((q: any) =>
      q.policyType === currentPolicyType ||
      (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
    );

    if (policyQuote) return policyQuote;

    // ULTIMATE FALLBACK: Search ALL quotes for this policy type if the active carrier group doesn't have it
    const globalFallback = data.quotes.find((q: any) =>
      q.policyType === currentPolicyType ||
      (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
    );

    return globalFallback || null;
  }, [data, carrierGroups, selectedCarrierId, currentPolicyType]);

  useEffect(() => {
    if (fetchResult?.activityLogs) {
      setActivityLogs(fetchResult.activityLogs);
    }
  }, [fetchResult?.activityLogs]);

  useEffect(() => {
    // Derive available policies from BOTH existing quotes AND the form payload
    const avails = new Set<string>(["GENERAL_LIABILITY"]);

    // Add policies that have actual quotes in the DB (from ANY carrier)
    if (data?.quotes?.length) {
      data.quotes.forEach((q: any) => {
        avails.add(q.policyType || "GENERAL_LIABILITY");
      });
    }

    // Also add XS if the application requested it (even before quote is entered)
    if (data?.submission?.payload?.addExcessLiability || data?.submission?.payload?.addGeneralLiability) {
      avails.add("EXCESS_LIABILITY");
    }

    const types = Array.from(avails);
    // Fix the "jumping buttons" issue by ensuring a consistent order
    types.sort((a, b) => (a === "GENERAL_LIABILITY" ? -1 : 1));

    setAvailablePolicies(types as string[]);

    // Optional: Auto-switch if current policy type is not in the global available list
    // (though with global policies, it should almost always be in there)
    if (types.length > 0 && !types.includes(currentPolicyType)) {
      setCurrentPolicyType(types[0] as any);
    }
  }, [data]);

  // Auto-switch carrier when policy type changes if current carrier has no quote for it
  useEffect(() => {
    if (carrierGroups.length > 0 && currentPolicyType) {
      const currentGroup = carrierGroups.find(g => g.carrierId === selectedCarrierId);
      const hasQuote = currentGroup?.quotes.some((q: any) =>
        q.policyType === currentPolicyType ||
        (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
      );

      if (!hasQuote) {
        // Find first carrier that DOES have a quote for this policy type
        const alternativeGroup = carrierGroups.find(g =>
          g.quotes.some((q: any) =>
            q.policyType === currentPolicyType ||
            (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
          )
        );

        if (alternativeGroup) {
          setSelectedCarrierId(alternativeGroup.carrierId);
        }
      }
    }
  }, [currentPolicyType, carrierGroups]);

  const fetchSubmission = () => mutate();

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!submissionId || !files || files.length === 0) return;

    const MAX_MB = 10;
    const filesArray = Array.from(files);

    // Check file size (10MB max)
    for (const file of filesArray) {
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds ${MAX_MB}MB`);
        return;
      }
    }

    try {
      setUploading(true);
      let successCount = 0;

      for (const file of filesArray) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("submissionId", submissionId as string);

        const res = await fetch(
          `/api/upload`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!res.ok) {
          toast.error(`Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploaded successfully`);
        // 🔁 refresh submission data
        fetchSubmission();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to upload documents");
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

    setIsCanceling(true);

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
      setCancelModalOpen(false);
      fetchSubmission(); // ⭐ refresh page data
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsCanceling(false);
    }
  };
  // ================= ISC BUTTON STYLES =================

  const iscOutlineBtn =
    "h-[42px] px-6 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-800 transition-all duration-200 hover:border-black hover:shadow-[0_0_0_1px_black]";

  const iscPrimaryBtn =
    "h-[42px] px-6 rounded-md text-sm font-semibold bg-[#9A8B7A] text-white transition-all duration-200 hover:bg-[#8a6f4d]";

  const handleRequestBind = async () => {
    if (!bindSelectedCarrierIdGL && !bindSelectedCarrierIdXL) {
      toast.error("Please select at least one carrier.");
      return;
    }

    const quotesToBind = [];
    if (bindSelectedCarrierIdGL) {
      quotesToBind.push({ policyType: "GENERAL_LIABILITY", carrierId: bindSelectedCarrierIdGL });
    }
    if (bindSelectedCarrierIdXL) {
      quotesToBind.push({ policyType: "EXCESS_LIABILITY", carrierId: bindSelectedCarrierIdXL });
    }

    try {
      const res = await fetch(
        `/api/agency/submissions/${submissionId}/request-bind`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotesToBind })
        }
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Bind request sent!");
      setBindModalOpen(false);
      setBindSelectedCarrierIdGL(null);
      setBindSelectedCarrierIdXL(null);
      fetchSubmission();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handlePremiumChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    const fee = amount * 0.03;
    const total = amount + fee;
    setPaymentAuthData(prev => ({
      ...prev,
      premiumAmount: value,
      processingFee: fee,
      totalDue: total
    }));
  };

  const toggleNoteFilter = (filter: string) => {
    setNoteFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };


  const requiredDocs: string[] = currentQuote?.customDocuments ?? [];

  useEffect(() => {
    if (!currentQuote) return;

    const saved = currentQuote.checkedDocuments || {};

    setCheckedDocs((prev) => ({
      ...saved,
    }));
  }, [JSON.stringify(currentQuote?.checkedDocuments)]);

  useEffect(() => {
    if (!requiredDocs.length) return;

    setCheckedDocs((prev) => {
      const updated = { ...prev };

      requiredDocs.forEach((doc) => {
        const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
        if (!(safeKey in updated)) {
          updated[safeKey] = false;
        }
      });

      return updated;
    });
  }, [requiredDocs]);

  // ✅ REQUIRED DOCUMENT CHECKLIST TOGGLE (ISC STYLE)
  const toggleDoc = async (doc: string) => {
    if (!currentQuote?._id) return;

    const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
    const newValue = !checkedDocs[safeKey];

    // optimistic UI
    setCheckedDocs((prev) => ({
      ...prev,
      [safeKey]: newValue,
    }));

    try {
      const res = await fetch(`/api/agency/quotes/${currentQuote._id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ doc, value: newValue }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      // Refresh data to update currentQuote.checkedDocuments
      fetchSubmission();
    } catch (err) {
      console.error("Failed to save checkbox:", err);

      // Show error message
      toast.error(`Failed to save: ${err.message}`);

      // ❗ rollback if API fails
      setCheckedDocs((prev) => ({
        ...prev,
        [safeKey]: !newValue,
      }));
    }
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



  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


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
    if (activeTab === "Rating Information" && data?.quotes?.length > 0) {
      // Find quote strictly matching the active policy type — NO fallback to quotes[0]
      const match = data.quotes.find((q: any) =>
        q.policyType === currentPolicyType ||
        (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
      ) ?? null;
      setSelectedQuote(match);
    } else if (activeTab !== "Rating Information") {
      setSelectedQuote(null);
    }
  }, [activeTab, data, currentPolicyType]);


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
      <div className="flex items-center justify-center py-20 bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  if (error || !data || !data.submission) {
    return (
      <div className="flex flex-col min-h-full">
        <aside className="hidden md:flex w-[70px] bg-[#2d2a26] flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-[#e5ddd5]">
          <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-[#8a6f4d] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
              <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl border border-[#9A8B7A]/20 group-hover:border-[#9A8B7A]/40 transition-all overflow-hidden">
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
                      <stop offset="0%" stopColor="#9A8B7A" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#8a6f4d" stopOpacity={0.95} />
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
        <main className="flex-1 ml-0 md:ml-[70px] p-4 md:p-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <h1 className="text-2xl font-bold text-[#2d2a26] mb-4">Error</h1>
            <p className="text-red-600 mb-6">{error || "Submission not found"}</p>
            <Link href="/agency/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9A8B7A] text-white rounded-lg text-sm font-medium hover:bg-[#8a6f4d] transition-colors">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { submission, routingLogs, quotes, boundPolicy, cancelRequested } = data;


  // ✅ STATUS FLAGS
  const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (quotes || []).some((q: any) => q.status === "BOUND"));
  const isSubmitted = !isBound && submission?.status === "SUBMITTED";
  const isApprovalRequested = !isBound && submission?.status === "APPROVAL_REQUESTED";
  const isQuoted = !isBound && submission?.status === "QUOTED";
  const isBindRequested = !isBound && submission?.status === "BIND_REQUESTED";

  const baseQuoteUrl = ["inland-marine", "contractors-equipment"].includes(submission?.programId || "") ||
    ["Equipment", "Construction Equipment", "Contractors Equipment"].includes(submission?.programName || "")
    ? "/agency/quote/contractors-equipment"
    : `/agency/quote/${submission?.programId}`;

  const isCommercialProperty =
    submission?.programId === 'apartment-buildings' ||
    submission?.programName === 'Commercial Property' ||
    submission?.programName === 'Apartment Building';

  const isContractorsEquipment =
    ["inland-marine", "contractors-equipment"].includes(submission?.programId || "") ||
    ["Equipment", "Construction Equipment", "Contractors Equipment"].includes(submission?.programName || "");

  const isManufacturer =
    submission?.programId === 'manufacturers' ||
    submission?.programName === 'Manufacturers / Distributors' ||
    (submission?.programName || '').toLowerCase().includes('manufacturer') ||
    (submission?.industry || '').toLowerCase().includes('manufacturer');

  const isBuildersRisk =
    submission?.programId === 'builders-risk' ||
    submission?.programName === 'Builders Risk' ||
    (submission?.programName || '').toLowerCase().includes('builder');

  const getPolicyLabel = (type: string) => {
    if (type === "GENERAL_LIABILITY") {
      if (isManufacturer) return "Manufacturers";
      if (isCommercialProperty) return "Property";
      if (isContractorsEquipment) return "Inland Marine";
      if (isBuildersRisk) return "Builders Risk";
      return "General Liability";
    } else {
      if (isCommercialProperty) return "General Liability";
      return "Excess Liability";
    }
  };

  const boundQuote = (quotes || []).find((q: any) => q.status === "BOUND");


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
      description: `Amount: $${quote.finalAmountUSD.toLocaleString('en-US')}`,
      icon: "💰",
      color: "purple",
    })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());


  return (
    <DashboardLayout>
      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Cancel Quote</h3>
            <p className="text-gray-500 text-sm mb-6">Are you sure you want to cancel this quote? This action cannot be undone.</p>

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isCanceling}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCanceling}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all ${isCanceling ? "bg-red-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 shadow-md"
                  }`}
              >
                {isCanceling ? "Canceling..." : "Confirm Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Carrier Selection Modal for Request Bind */}
      {bindModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Request Bind</h3>
            <p className="text-gray-500 text-sm mb-6">Select the carriers you wish to bind with for each policy.</p>

            {/* Only show GL selector if GL is NOT already bound or requested */}
            {availablePolicies.includes("GENERAL_LIABILITY") && !data.quotes?.some(q => (q.policyType === "GENERAL_LIABILITY" || !q.policyType) && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data.quotes?.some(q => q.policyType === "GENERAL_LIABILITY" || !q.policyType) && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPolicyLabel("GENERAL_LIABILITY")} Carrier
                </label>
                <select
                  value={bindSelectedCarrierIdGL || ""}
                  onChange={(e) => setBindSelectedCarrierIdGL(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block p-3 outline-none transition-all"
                >
                  <option value="">Do not bind {getPolicyLabel("GENERAL_LIABILITY")}...</option>
                  {data.quotes?.filter(q => (q.policyType === "GENERAL_LIABILITY" || !q.policyType) && q.status !== "BOUND").map((quote) => (
                    <option key={quote._id} value={quote.carrierId?._id}>
                      {quote.carrierId?.name || "Unknown Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}


            {/* Only show XL selector if XL is NOT already bound or requested */}
            {availablePolicies.includes("EXCESS_LIABILITY") && !data.quotes?.some(q => q.policyType === "EXCESS_LIABILITY" && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data.quotes?.some(q => q.policyType === "EXCESS_LIABILITY") && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPolicyLabel("EXCESS_LIABILITY")} Carrier
                </label>
                <select
                  value={bindSelectedCarrierIdXL || ""}
                  onChange={(e) => setBindSelectedCarrierIdXL(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block p-3 outline-none transition-all"
                >
                  <option value="">Do not bind {getPolicyLabel("EXCESS_LIABILITY")}...</option>
                  {data.quotes?.filter(q => q.policyType === "EXCESS_LIABILITY" && q.status !== "BOUND").map((quote) => (
                    <option key={quote._id} value={quote.carrierId?._id}>
                      {quote.carrierId?.name || "Unknown Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}


            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setBindModalOpen(false);
                  setBindSelectedCarrierIdGL(null);
                  setBindSelectedCarrierIdXL(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestBind}
                disabled={!bindSelectedCarrierIdGL && !bindSelectedCarrierIdXL}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all ${(bindSelectedCarrierIdGL || bindSelectedCarrierIdXL)
                  ? "bg-[#9A8B7A] hover:bg-[#8a6f4d] shadow-md"
                  : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Auth Modal */}
      {paymentAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start md:items-center justify-center p-4 md:p-10">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-5 md:p-8 animate-in fade-in zoom-in duration-200 my-auto">
              <div className="flex justify-between items-center mb-6 md:mb-8">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">Payment Authorization</h3>
                <button
                  onClick={() => setPaymentAuthModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Top Summary Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
                  <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">Premium Amount</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-[#1e293b]">$</span>
                    <input
                      type="number"
                      value={paymentAuthData.premiumAmount}
                      onChange={(e) => handlePremiumChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-transparent text-2xl font-bold text-[#1e293b] outline-none border-none p-0 focus:ring-0"
                    />
                  </div>
                </div>

                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 shadow-sm relative">
                  <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">3% Processing Fee</p>
                  <div className="text-2xl font-bold text-[#1e293b]">
                    ${paymentAuthData.processingFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  {/* Arrow indicator like in image if needed, but let's keep it clean */}
                </div>

                <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-6 shadow-sm">
                  <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider mb-3">Total Amount Due</p>
                  <div className="text-2xl font-bold text-[#1e293b]">
                    ${paymentAuthData.totalDue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-10">
                <button
                  onClick={() => setPaymentAuthModalOpen(false)}
                  className="px-8 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    toast.success("Payment authorized successfully!");
                    setPaymentAuthConfirmed(true);
                    setPaymentAuthModalOpen(false);
                  }}
                  className={iscPrimaryBtn}
                >
                  Confirm Authorization
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar - Matching Dashboard */}

      {/* Main Content */}
      <main className="flex-1 ml-[6px] bg-[#fcfaf7] overflow-x-hidden">
        {/* Header */}
        {/* ISC STYLE HEADER – NO BORDER */}
        <div className="bg-white px-4 md:px-6 pt-5 pb-4">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-0">

            {/* LEFT SIDE */}
            <div className="bg-white px-0 md:px-8 py-0 md:py-3">
              {/* <Link href="/agency/dashboard" className="mt-1">
                <ArrowLeft className="w-5 h-5 text-gray-500 hover:text-black" />
              </Link> */}

              <div>
                {/* Title */}
                <h1 className="flex items-center gap-3 text-xl md:text-[24px] font-semibold text-gray-900 leading-tight">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                    {(submission?.payload?.companyName || submission?.payload?.applicantName || submission?.payload?.namedInsured || submission?.clientContact?.name || "???")}
                    <span className={`inline-flex items-center rounded-md px-3 py-[4px] text-[13px] font-bold border transition-all w-fit ${(() => {
                      if (submission?.status === "CANCELLED") return "bg-red-100 text-red-700 border-red-200";
                      if (cancelRequested) return "bg-orange-100 text-orange-700 border-orange-200";
                      const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (quotes || []).some((q: any) => q.status === "BOUND"));
                      return isBound ? "bg-green-100 text-green-700 border-green-200" : "bg-gray-100 text-gray-700 border-gray-200";
                    })()
                      }`}>
                      {(() => {
                        if (submission?.status === "CANCELLED") return "CANCELLED";
                        if (cancelRequested) return "PENDING CANCEL";
                        const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (quotes || []).some((q: any) => q.status === "BOUND"));
                        return isBound ? "BOUND" : (submission?.status || "").replace(/_/g, " ");
                      })()}
                    </span>
                  </div>
                </h1>
                <div className="flex items-center gap-4">
                  {/* APP ID */}
                  <span className="text-[14px] text-gray-500 ml-2">
                    App ID {submission.submissionNumber || (submission?._id || "").slice(-6)}
                  </span>
                </div>
                {/* Meta Row */}
                <div className="flex items-center flex-wrap gap-x-5 gap-y-1 mt-2 text-[14px] text-gray-700">

                  <span className="flex items-center gap-1.5">
                    <User className="w-[18px] h-[18px] text-gray-500" />
                    {submission?.payload?.firstName || submission?.payload?.lastName
                      ? `${submission.payload.firstName || ""} ${submission.payload.lastName || ""}`.trim()
                      : (submission?.clientContact?.name || "???")}
                  </span>
                  {(submission?.payload?.dba || submission?.dba) && (
                    <span className="flex items-center gap-1.5">
                      DBA: {(submission?.payload?.dba || submission?.dba)}
                    </span>
                  )}

                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {[
                      submission?.clientContact?.businessAddress?.street,
                      submission?.clientContact?.businessAddress?.city,
                      submission?.clientContact?.businessAddress?.state,
                      submission?.clientContact?.businessAddress?.zip
                    ].filter(Boolean).join(", ") || "???"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4" />
                    {submission?.payload?.applicantPhone || (submission?.clientContact?.phone && submission?.clientContact?.phone !== "000-000-0000" ? submission?.clientContact?.phone : "") || submission?.payload?.phone || submission?.clientContact?.phone || "???"}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4" />
                    {submission?.payload?.applicantEmail || (submission?.clientContact?.email && submission?.clientContact?.email !== "unknown@example.com" ? submission?.clientContact?.email : "") || submission?.payload?.email || submission?.clientContact?.email || "???"}
                  </span>

                </div>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-4 px-0 md:px-8 mt-2 md:mt-0">
              {/* APP ID */}
              <span className="text-[14px] text-gray-500 ml-2">
                App ID {submission.submissionNumber || (submission?._id || "").slice(-6)}
              </span>
            </div>
          </div>

        </div>
        {/* APP INFO ROW – ISC STYLE */}
        {/* Global Quote Round Selector */}
        {(() => {
          const availableCarrierGroups = carrierGroups.filter(group => 
            group.quotes.some(q => 
              q.policyType === currentPolicyType || 
              (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
            )
          );

          const isCurrentPolicyBound = data?.quotes?.some(
            (q: any) =>
              q.status === "BOUND" &&
              (q.policyType === currentPolicyType ||
                (!q.policyType && currentPolicyType === "GENERAL_LIABILITY"))
          );

          return availableCarrierGroups.length > 1 && !isCurrentPolicyBound ? (
            <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shadow-sm rounded-md mb-2">
              <span className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">SELECT CARRIER:</span>
              <select
                value={selectedCarrierId || ""}
                onChange={(e) => setSelectedCarrierId(e.target.value)}
                className="bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-black focus:border-black block p-2 font-semibold outline-none"
              >
                {availableCarrierGroups.map((group: any) => (
                  <option key={group.carrierId} value={group.carrierId}>
                    {group.carrierName}
                  </option>
                ))}
              </select>
            </div>
          ) : null;
        })()}

        <div className="bg-white px-4 md:px-6 py-4 md:py-3 min-h-[64px] border-t border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:gap-3">
            {/* LEFT */}
            <div className="flex items-center gap-4">
              <h2 className="text-[16px] font-semibold text-gray-900">App Info</h2>
              <span className={`px-3 py-[4px] rounded-md text-[13px] font-bold border ${(() => {
                if (submission?.status === "CANCELLED") return "bg-red-100 text-red-700 border-red-200";
                if (cancelRequested) return "bg-orange-100 text-orange-700 border-orange-200";
                return "bg-gray-100 text-gray-700 border-transparent";
              })()}`}>
                {(() => {
                  if (submission?.status === "CANCELLED") return "CANCELLED";
                  if (cancelRequested) return "PENDING CANCEL";
                  const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (data?.quotes || []).some((q: any) => q.status === "BOUND"));
                  return isBound ? "BOUND" : (submission?.status || "").replace(/_/g, " ");
                })()}
              </span>
            </div>

            {/* RIGHT BUTTONS */}
            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">

              {/* ================= CANCELLED ================= */}
              {submission?.status === "CANCELLED" && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `${baseQuoteUrl}?mode=view&id=${currentQuote?._id || submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>
                </>
              )}

              {/* ================= SUBMITTED (IN PROGRESS) ================= */}
              {isSubmitted && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/pdf?quoteId=${currentQuote?._id || ''}`,
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
                        `${baseQuoteUrl}?mode=view&id=${currentQuote?._id || submission._id}`,
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
                        `${baseQuoteUrl}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}>Edit</button>

                  <button
                    // onClick={handleRequestApproval}
                    className={iscPrimaryBtn}
                  >
                    Request Approval
                  </button>

                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel Quote"}
                  </button>
                </>
              )}

              {/* ================= APPROVAL REQUESTED ================= */}
              {isApprovalRequested && (
                <>

                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/pdf?quoteId=${currentQuote?._id || ''}`,
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
                        `${baseQuoteUrl}?mode=view&id=${submission._id}`,
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
                        `${baseQuoteUrl}?mode=edit&id=${submission._id}`,
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
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel Quote"}
                  </button>
                </>
              )}

              {/* ================= QUOTED (APPROVED QUOTE) ================= */}
              {(isQuoted || isBindRequested) && (
                <>
                  <button
                    onClick={() => {
                      if (paymentAuthConfirmed) {
                        window.open(
                          `/api/agency/applications/${submissionId}/payment-auth?quoteId=${currentQuote?._id || ''}&premiumAmount=${paymentAuthData.premiumAmount || 0}&processingFee=${paymentAuthData.processingFee || 0}&totalDue=${paymentAuthData.totalDue || 0}`,
                          "_blank"
                        );
                      } else {
                        setPaymentAuthModalOpen(true);
                      }
                    }}
                    className={iscOutlineBtn}
                  >
                    Payment Auth
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/proposal?quoteId=${currentQuote?._id || ''}&policyType=${currentPolicyType || ''}&t=${Date.now()}`,
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
                        `/api/agency/applications/${submissionId}/invoice?quoteId=${currentQuote?._id || ''}`,
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
                        `/api/agency/applications/${submissionId}/pdf?quoteId=${currentQuote?._id || ''}`,
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
                        `${baseQuoteUrl}?mode=view&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>

                  {/* Request Bind / Bind Requested Buttons */}
                  {(() => {
                    const status = currentQuote?.status;
                    const isBound = status === "BOUND";
                    
                    // Check if ANY quote for this specific policy type is already requested for bind
                    const isAnyQuoteBindRequestedForThisPolicy = data?.quotes?.some((q: any) => 
                      (q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")) &&
                      q.status === "BIND_REQUESTED"
                    );

                    // Show if not bound AND (account is quoted OR quote is ready to bind) AND no other carrier is requested for bind
                    const canRequestBind = !isBound && !isAnyQuoteBindRequestedForThisPolicy && status !== "BIND_REQUESTED" && (
                      data?.submission?.status === "QUOTED" ||
                      status === "POSTED" ||
                      status === "ENTERED"
                    );

                    return (
                      <>
                        {canRequestBind && (
                          <button
                            onClick={() => setBindModalOpen(true)}
                            className={iscPrimaryBtn}
                          >
                            Request Bind
                          </button>
                        )}

                        {!isBound && (currentQuote?.status === "BIND_REQUESTED" || (!currentQuote && isBindRequested) || isAnyQuoteBindRequestedForThisPolicy) && (
                          <button
                            disabled
                            className={`${iscPrimaryBtn} opacity-60 cursor-not-allowed`}
                          >
                            Bind Requested
                          </button>
                        )}
                      </>
                    );
                  })()}

                  <button
                    className={iscOutlineBtn}
                    onClick={() =>
                      window.open(
                        `${baseQuoteUrl}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }>
                    Modify
                  </button>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel Quote"}
                  </button>

                </>
              )}

              {/* ================= BIND REQUESTED ================= */}
              {/* {isBindRequested && (
                <>
                  <button
                    onClick={() =>
                      window.open(
                        `/agency/quote/${submission.programId}?mode=view&id=${currentQuote?._id || submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    View
                  </button>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel Quote"}
                  </button>
                </>
              )} */}

              {/* ================= BOUND (NEWLY BOUND) ================= */}
              {isBound && (
                <>
                  {(() => {
                    let binderUrl = currentQuote?.binderUrl;
                    let policyDocsUrl = currentQuote?.policyDocsUrl;

                    // Fallback to submission level (legacy GL) only if we are viewing General Liability
                    if (currentPolicyType === 'GENERAL_LIABILITY' || (currentQuote && !currentQuote.policyType)) {
                      binderUrl = binderUrl || submission.binderUrl;
                      policyDocsUrl = policyDocsUrl || submission.policyDocsUrl;
                    }
                    // No fallback for EXCESS_LIABILITY as it must have its own EXPLICIT documents uploaded by the admin

                    const handleDownload = (docName: string, url: string | undefined | null) => {
                      if (!url) {
                        toast.error(`${docName} has not been uploaded yet.`);
                        return;
                      }

                      // Proxy everything through the secure API which enforces correct dynamic file naming based on the policy
                      const finalUrl = `/api/download?url=${encodeURIComponent(url)}`;

                      // Silently inherit server's Content-Disposition: attachment without flickering a new tab
                      window.location.href = finalUrl;
                    };

                    return (
                      <>
                        <button
                          onClick={() => handleDownload('Binder', binderUrl)}
                          className={iscOutlineBtn}
                        >
                          Binder
                        </button>
                        <button
                          onClick={() => handleDownload('Policy Docs', policyDocsUrl)}
                          className={iscOutlineBtn}
                        >
                          Policy Docs
                        </button>
                      </>
                    );
                  })()}
                  <button
                    onClick={() =>
                      window.open(
                        `/api/agency/applications/${submissionId}/invoice?quoteId=${currentQuote?._id || ''}`,
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
                        `${baseQuoteUrl}?mode=view&id=${submission._id}`,
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
                        `/api/agency/applications/${submissionId}/pdf?quoteId=${currentQuote?._id || ''}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    App Packet
                  </button>
                  <button
                    className={iscOutlineBtn}
                    onClick={() =>
                      window.open(
                        `${baseQuoteUrl}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }>
                    Modify
                  </button>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel Quote"}
                  </button>
                  {/* Actions for new policies added to an already-bound submission */}
                  {(() => {
                    // Collect policy types that already have a BOUND quote (e.g., GL bound with Kinsale)
                    const boundPolicyTypes = (data?.quotes || [])
                      .filter((q: any) => q.status === "BOUND")
                      .map((q: any) => q.policyType || "GENERAL_LIABILITY");

                    // Collect policy types that already have a BIND_REQUESTED quote
                    const bindRequestedPolicyTypes = (data?.quotes || [])
                      .filter((q: any) => q.status === "BIND_REQUESTED")
                      .map((q: any) => q.policyType || "GENERAL_LIABILITY");

                    // Check if there are any quotes that are currently in a bind-requested state
                    // — only for policy types NOT already bound
                    const hasBindRequestedQuotes = (data?.quotes || []).some((q: any) => {
                      const pt = q.policyType || "GENERAL_LIABILITY";
                      return q.status === "BIND_REQUESTED" && !boundPolicyTypes.includes(pt);
                    });

                    // Check if there are any quotes that are ready to be bound (unbounded and not requested yet)
                    // — only for policy types NOT already bound AND NOT already bind-requested
                    const hasBindableQuotes = (data?.quotes || []).some((q: any) => {
                      const pt = q.policyType || "GENERAL_LIABILITY";
                      return ["POSTED", "ENTERED", "QUOTED"].includes(q.status) && 
                             !boundPolicyTypes.includes(pt) && 
                             !bindRequestedPolicyTypes.includes(pt);
                    });

                    // Check if the current quote is an unbound Excess Liability quote
                    const isCurrentQuoteUnboundXL = currentQuote &&
                      currentPolicyType === "EXCESS_LIABILITY" &&
                      ["POSTED", "ENTERED", "QUOTED", "BIND_REQUESTED"].includes(currentQuote.status);

                    return (
                      <>
                        {isCurrentQuoteUnboundXL && (
                          <button
                            onClick={() =>
                              window.open(
                                `/api/agency/applications/${submissionId}/proposal?quoteId=${currentQuote?._id || ''}&policyType=${currentPolicyType || ''}&isExcessOnly=true&t=${Date.now()}`,
                                "_blank"
                              )
                            }
                            className={iscOutlineBtn}
                          >
                            Excess Proposal
                          </button>
                        )}
                        {hasBindRequestedQuotes && !hasBindableQuotes && (
                          <button
                            disabled
                            className={`${iscPrimaryBtn} opacity-60 cursor-not-allowed`}
                          >
                            Bind Requested
                          </button>
                        )}
                        {hasBindableQuotes && (
                          <button
                            onClick={() => setBindModalOpen(true)}
                            className={iscPrimaryBtn}
                          >
                            Request Bind
                          </button>
                        )}
                      </>
                    );
                  })()}
                </>
              )}

            </div> {/* END RIGHT BUTTONS */}
          </div>
        </div>
        {/* KEY INFO GRID – ISC STYLE */}
        {/* ISC STYLE – KEY INFO STRIP */}
        <div className="bg-white px-4 md:px-6 py-5 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-6 gap-x-14 text-[14px]">

            {/* Total Cost */}
            <div>
              <p className="text-gray-500 mb-1">Total Cost:</p>
              <p className="font-semibold text-gray-900">
                {currentRoundTotal > 0 ? `$${currentRoundTotal.toLocaleString('en-US')}` : "Not Quoted"}
              </p>
            </div>

            {/* Create Date */}
            <div>
              <p className="text-gray-500 mb-1">Create Date:</p>
              <p className="font-semibold text-gray-900">
                {currentQuote?.createdAt
                  ? new Date(currentQuote.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })
                  : (submission?.createdAt ? new Date(submission.createdAt) : new Date()).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              </p>
            </div>

            {/* Cancel Date (If scheduled)
            {submission?.effectiveCancellationDate && (
              <div>
                <p className="text-gray-500 mb-1">Cancel Date:</p>
                <p className="font-semibold text-gray-900">
                  {new Date(submission.effectiveCancellationDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}
                </p>
              </div>
            )} */}

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
            {/* <div>
              <p className="text-gray-500 mb-1">Bind Date:</p>
              <p className="font-semibold text-gray-900">
                {submission.status !== "BOUND"
                  ? "Not Bound"
                  : boundPolicy?.bindDate
                    ? new Date(boundPolicy.bindDate).toLocaleDateString('en-US', { timeZone: 'UTC' })
                    : "—"}
              </p>
            </div>*/}

          </div>
        </div>


        {/* Policy Selector (Critical Requirement) */}
        {availablePolicies.length > 1 && (
          <div className="bg-white px-4 md:px-8 py-4 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center gap-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Policy View:</span>
            <div className="flex gap-2">
              {availablePolicies.map(type => (
                <button
                  key={type}
                  onClick={() => setCurrentPolicyType(type as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${currentPolicyType === type
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  {getPolicyLabel(type)}
                </button>
              ))}
            </div>
          </div>
        )}
        {/* ISC STYLE – STANDARD GL A-RATED SECTION */}
        <div className="bg-white px-4 md:px-8 py-6 border-t border-gray-200">

          {/* SECTION TITLE */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-gray-900 tracking-tight">
                {getPolicyLabel(currentPolicyType)}
              </h3>
              <div className="mt-2 h-[1px] w-64 bg-gray-300" />
            </div>
          </div>

          {/* CONTENT GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-24 gap-y-6 text-[14px]">

            {/* LEFT */}
            <div className="space-y-4">
              <div className="flex">
                <span className="w-28 text-gray-500">Carrier:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {currentQuote?.carrierId?.name || "—"}
                </span>
              </div>

              <div className="flex">
                <span className="w-28 text-gray-500">Cost:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {currentQuote?.finalAmountUSD
                    ? `$${currentQuote.finalAmountUSD.toLocaleString('en-US')}`
                    : "Not Quoted"}
                </span>
              </div>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <div className="flex">
                <span className="w-36 text-gray-500">Policy Number:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {currentQuote?.policyNumber || (currentPolicyType === "GENERAL_LIABILITY" ? submission.policyNumber : "") || "Not Bound"}
                </span>
              </div>

              <div className="flex">
                <span className="w-36 text-gray-500">Effective Date:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {(() => {
                    const effStr = currentQuote?.effectiveDate || (currentPolicyType === "GENERAL_LIABILITY" ? (submission.payload?.effectiveDate || submission.effectiveDate || submission?.createdAt) : "");
                    if (!effStr) return "TBD";

                    const effDate = new Date(effStr);
                    const expStr = currentQuote?.expirationDate || (currentPolicyType === "GENERAL_LIABILITY" ? (submission.payload?.expirationDate || submission.expirationDate) : "");
                    const expDate = expStr ? new Date(expStr) : new Date(new Date(effDate).setFullYear(effDate.getFullYear() + 1));

                    return `${effDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })} - ${expDate.toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}`;
                  })()}
                </span>
              </div>


              {/* <div className="flex">
                <span className="w-36 text-gray-500">Carrier Ref:</span>
                <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                  {currentQuote?.carrierReference || "—"}
                </span>
              </div> */}

              {currentQuote?.specialNotes && (
                <div className="flex">
                  <span className="w-36 text-gray-500">Special Notes:</span>
                  <span className="font-medium text-gray-900 leading-[18px] tracking-tight">
                    {currentQuote.specialNotes}
                  </span>
                </div>
              )}

            </div>

          </div>
        </div>

        {/* ISC STYLE – UPLOAD DOCUMENTS */}
        <div className="bg-white px-4 md:px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 border-b border-gray-200">

          {/* LEFT – UPLOADED DOCUMENTS */}
          <div className="lg:col-span-2">

            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">
              Uploaded Documents
            </h3>

            {/* Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
              className={`relative group cursor-pointer transition-all duration-300 ${isDragging
                ? "border-[#9A8B7A] bg-[#9A8B7A]/5"
                : "border-[#e5ddd5] hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                } border-2 border-dashed rounded-xl p-8 text-center mb-6`}
              onClick={() => document.getElementById('agency-file-upload')?.click()}
            >
              <input
                id="agency-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileUpload(e.target.files);
                  }
                }}
              />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-[#9A8B7A] text-white scale-110 shadow-lg" : "bg-white text-[#9A8B7A] shadow-sm group-hover:shadow-md"}`}>
                  <Upload className={`w-7 h-7 ${isDragging ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    {uploading ? "Uploading document..." : "Click or drag files here to upload"}
                  </p>
                  <p className="text-[13px] text-gray-500 font-medium mt-1">
                    Support for PDF, DOC, ZIP up to 10MB
                  </p>
                </div>
              </div>
              {uploading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100">
                    <div className="w-4 h-4 border-2 border-[#9A8B7A]/30 border-t-[#9A8B7A] rounded-full animate-spin" />
                    <span className="text-xs font-bold text-[#9A8B7A]">Uploading...</span>
                  </div>
                </div>
              )}
            </div>

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
                    {(submission?.updatedAt ? new Date(submission.updatedAt) : new Date()).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                  </span>

                  <div className="flex items-center gap-4">
                    <a
                      href={`/api/download?url=${encodeURIComponent(file.fileUrl)}`}
                      download={file.fileName}
                      className="text-[#9A8B7A] hover:text-[#7A6F64] font-medium hover:underline transition-colors"
                    >
                      Download
                    </a>
                    <a
                      href={`/api/download?url=${encodeURIComponent(file.fileUrl)}&view=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#9A8B7A] hover:text-[#7A6F64] font-medium hover:underline transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => setDocumentToDelete({ fileName: file.fileName, fileUrl: file.fileUrl })}
                      className="text-red-400 hover:text-red-600 transition-colors ml-2"
                      title="Remove document"
                    >
                      <CloseIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT – REQUIRED DOCUMENTS CHECKLIST */}
          <div>
            <h3 className="text-[14px] font-semibold text-gray-900 mb-5 tracking-tight">
              Subjective Lines
            </h3>
            <div className="space-y-6 text-[14px]">
              {requiredDocs.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No subjective lines specified by admin
                </p>
              ) : (
                requiredDocs.map((doc) => {
                  const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
                  const checked = checkedDocs[safeKey];

                  return (
                    <div
                      key={doc}
                      onClick={() => toggleDoc(doc)}
                      className="flex items-start gap-4 cursor-pointer"
                    >
                      {/* CIRCLE */}
                      <div
                        className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center transition-all shrink-0 mt-[2px]
                        ${checked
                            ? "bg-[#9A8B7A] border-[#9A8B7A]"
                            : "border-gray-300"
                          }`}>
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

                      <span className="text-gray-800 leading-tight">
                        {doc}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        {/* ================= NOTES – ISC STYLE ================= */}
        <div className="bg-white px-4 md:px-8 py-6 border-t border-gray-200">
          {/* Tabs */}
          <div className="flex items-center gap-6 md:gap-10 text-[14px] mb-6 border-b overflow-x-auto whitespace-nowrap" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {["Notes", "Status History", "Contact Information", "Rating Information"].map(
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
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
                                {new Date(note.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}
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
            <div className="border rounded-md overflow-x-auto">
              <div className="bg-gray-100 px-4 py-2 grid grid-cols-4 min-w-[600px] text-sm font-medium text-gray-600">
                <span>Program</span>
                <span>Changed</span>
                <span>User</span>
                <span>Status</span>
              </div>

              {statusHistory.map((item) => (
                <div
                  key={item._id}
                  className="px-4 py-3 grid grid-cols-4 min-w-[600px] text-sm border-t"
                >
                  <span>{item.program === "Advantage Contractor GL" ? "Construction" : (item.program === "Construction Equipment" ? "Contractors Equipment" : (item.program === "Manufacturers / Distributors" || item.program?.toLowerCase().includes("manufacturer") ? "Manufacturers" : item.program))}</span>
                  <span>{new Date(item.changedAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
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
                      Sterling Insurance Services
                    </p>
                  </div>

                  <div className="pt-4 space-y-2 text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>
                        5455 Wilshire Blvd. #1816,Los Angeles, CA 90036
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span>(310) 492-2007</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span>
                        Info@sterlinginsurancepartners.com
                      </span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === "Rating Information" && (
            <div className="space-y-6">
              {!currentQuote ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">????</span>
                  </div>
                  <p className="text-gray-500 font-medium">No quote entered yet for</p>
                  <p className="text-gray-900 font-bold mt-1">
                    {getPolicyLabel(currentPolicyType)}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch animate-in fade-in zoom-in duration-300">
                  {/* Rate Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-[18px]">$</span>
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                        Rate Breakdown
                      </h3>
                    </div>
                    <div className="flex flex-col gap-5 flex-grow mb-8">
                      <RatingRow label="Premium" value={formatCurrency(currentQuote.carrierQuoteUSD || 0)} />
                      <RatingRow label="Carrier Fees" value={formatCurrency(currentQuote.carrierFeesUSD || 0)} />
                      <RatingRow label="Surplus Lines Tax (%)" value={formatCurrency(currentQuote.premiumTaxAmountUSD || 0)} />
                      {(currentQuote.slasTransactionFeeAmountUSD || 0) > 0 && (
                        <RatingRow label="SLAS Transaction Fee (%)" value={formatCurrency(currentQuote.slasTransactionFeeAmountUSD || 0)} />
                      )}
                      {(currentQuote.stampingFeeAmountUSD || 0) > 0 && (
                        <RatingRow label="Stamping Fee (%)" value={formatCurrency(currentQuote.stampingFeeAmountUSD || 0)} />
                      )}
                      {(currentQuote.fireMarshalTaxAmountUSD || 0) > 0 && (
                        <RatingRow label="Fire Marshal Tax (%)" value={formatCurrency(currentQuote.fireMarshalTaxAmountUSD || 0)} />
                      )}
                      {(currentQuote.fireMarshalFlatFeeUSD || 0) > 0 && (submission?.state === 'WA' || submission?.clientContact?.businessAddress?.state === 'WA' || submission?.state === 'Washington') && (
                        <RatingRow label="WA Flat Fee" value={formatCurrency(currentQuote.fireMarshalFlatFeeUSD || 0)} />
                      )}
                      {(currentQuote.stampingFeePerFilingUSD || 0) > 0 && (
                        <RatingRow label="PA Flat Fee" value={formatCurrency(currentQuote.stampingFeePerFilingUSD || 0)} />
                      )}
                      {(currentQuote.slaServiceChargeUSD || 0) > 0 && (
                        <RatingRow label="SLSC" value={formatCurrency(currentQuote.slaServiceChargeUSD || 0)} />
                      )}
                      <RatingRow label="Surplus Lines Policy Fee" value={formatCurrency(currentQuote.sterlingInsuranceServicesFeesUSD || 0)} />
                    </div>

                    {/* Total Cost inside the Left Card pinned to bottom */}
                    <div className="mt-auto pt-6 border-t flex justify-between items-center">
                      <span className="text-[16px] font-bold text-gray-900">Total Cost:</span>
                      <span className="text-[22px] font-bold text-gray-900">
                        {formatCurrency(currentQuote.finalAmountUSD || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Broker Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <User className="w-[20px] h-[20px] text-white" />
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                        Broker Breakdown
                      </h3>
                    </div>
                    <div className="flex flex-col gap-5 flex-grow mb-8">
                      <RatingRow label="Commission (10%)" value={formatCurrency((currentQuote.carrierQuoteUSD || 0) * 0.1)} />
                      <RatingRow label="Broker Fee" value={formatCurrency(currentQuote.brokerFeeAmountUSD || 0)} />
                    </div>

                    {/* Total for Broker inside the Right Card pinned to bottom */}
                    <div className="mt-auto pt-6 border-t flex justify-between items-center">
                      <span className="text-[16px] font-bold text-gray-900">Total for Broker:</span>
                      <span className="text-[22px] font-bold text-gray-900">
                        {formatCurrency(((currentQuote.carrierQuoteUSD || 0) * 0.1) + (currentQuote.brokerFeeAmountUSD || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ================= END NOTES ================= */}
        {/* Delete Document Confirmation Modal */}
        {documentToDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
              <button
                onClick={() => setDocumentToDelete(null)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
              >
                <CloseIcon className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col items-center text-center mt-2">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <CloseIcon className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Remove Document?</h3>
                <p className="text-sm text-gray-500 mb-6 px-4">
                  Are you sure you want to completely remove <strong>{documentToDelete.fileName}</strong>? This action cannot be undone.
                </p>
                
                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDocumentToDelete(null)}
                    disabled={isDeletingDoc}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDocument}
                    disabled={isDeletingDoc}
                    className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isDeletingDoc ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Yes, Remove"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </DashboardLayout>
  );
}

export default function SubmissionDetailsPage() {
  return (

    <Suspense fallback={
      <div className="fixed inset-0 bg-[#f5f1eb] flex items-center justify-center z-50">
        <div className="text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border-4 border-[#f5f1eb]"></div>
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