"use client";

import { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import useSWR, { mutate } from "swr";
import Link from "next/link";
import { toast } from "sonner";
import PolicyAuditTab from "@/components/audits/PolicyAuditTab";
import AdminPremiumFinanceTab from "@/components/finance/AdminPremiumFinanceTab";
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
  MessageSquare,
  Send,
  Clock,
  ChevronRight,
  FileText,
  Shield,
  Layers,
  Calendar,
  ExternalLink,
  Menu
} from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

import DashboardLayout from "@/components/layout/DashboardLayout";

interface SubmissionDetails {
  submission: {
    submissionNumber?: string;
    _id: string;
    submitedAt?: string;
    agencyId: {
      _id: string;
      name: string;
      email: string;
    };
    templateId: any;
    payload: Record<string, any>;
    files: Array<{
      fieldKey: string;
      fileUrl: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
      uploadedAt?: string;
      policyNumber?: string;
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
    programId?: string;
    programName?: string;
    adminNotes?: string;
    policyNumber?: string;
    effectiveDate?: string;
    selectedCarrierId?: string;
    binderUrl?: string;
    policyDocsUrl?: string;
    hasNewEdits?: boolean;
    updatedAt: string;
    createdAt: string;
  };
  routingLogs: any[];
  quotes: any[];
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

// Component to display application form data
function ApplicationDataViewer({ data, type }: { data: any; type: "key" | "additional" }) {
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "N/A";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "object") {
      if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object" && value[0] !== null) {
          return value
            .map((item: any) => {
              return Object.entries(item)
                .map(([k, v]) => `${formatFieldName(k)}: ${formatValue(v)}`)
                .join(", ");
            })
            .join(" | ");
        }
        return value.join(", ");
      }
      return JSON.stringify(value, null, 2);
    }
    return String(value);
  };

  const formatFieldName = (key: string): string => {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const isImportantField = (key: string): boolean => {
    const importantFields = [
      "companyName",
      "estimatedGrossReceipts",
      "generalLiabilityLimit",
      "classCodeWork",
      "effectiveDate",
      "statesOfOperation",
      "carrierApprovedDescription",
      // Commercial Property specific
      "totalInsuredValue",
      "buildingAge",
      "numberOfUnits",
      "buildingStories",
      "constructionType",
      // Contractors Equipment specific
      "heavyLimit",
      "lightMedLimit",
      "miscToolsLimit",
      "rentedEquipLimit",
      "deductible"
    ];
    return importantFields.includes(key);
  };

  // Separate important and other fields
  const importantFields: [string, any][] = [];
  const otherFields: [string, any][] = [];

  Object.entries(data).forEach(([key, value]) => {
    if (isImportantField(key)) {
      importantFields.push([key, value]);
    } else {
      otherFields.push([key, value]);
    }
  });

  return (
    <div className="space-y-6">
      {/* Important Fields Section */}
      {type === "key" && importantFields.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            Key Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {importantFields.map(([key, value]) => (
              <div key={key} className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-amber-200/60 hover:border-amber-300 hover:shadow-md transition-all duration-200">
                <span className="text-xs font-bold text-gray-500 block mb-1.5 uppercase tracking-wide">
                  {formatFieldName(key)}
                </span>
                <p className="text-sm text-gray-900 font-semibold break-words">
                  {key === "classCodeWork" && typeof value === "object" ? (
                    <div className="space-y-1">
                      {Object.entries(value as Record<string, any>).map(([code, percent]) => (
                        <div key={code} className="text-sm">
                          <span className="font-bold">{code}:</span> {percent}%
                        </div>
                      ))}
                    </div>
                  ) : (
                    formatValue(value)
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Fields Section */}
      {type === "additional" && otherFields.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
            {otherFields.map(([key, value]) => (
              <div key={key} className="bg-white/60 backdrop-blur-sm p-3 rounded-lg border border-gray-200/60 hover:border-gray-300 hover:shadow-sm transition-all duration-200">
                <span className="text-xs font-bold text-gray-500 block mb-1 uppercase tracking-wide">
                  {formatFieldName(key)}
                </span>
                <p className="text-sm text-gray-900 font-medium break-words">
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminSubmissionDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string;

  const [adminNotes, setAdminNotes] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [stats, setStats] = useState({ quoteRequests: 0, bindRequests: 0 });
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
      mutate(`/api/admin/submissions/${submissionId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete document");
    } finally {
      setIsDeletingDoc(false);
      setDocumentToDelete(null);
    }
  };

  // New state for refactored tabs and notes
  const [activeTab, setActiveTab] = useState("Admin Notes");
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const tab = urlParams.get('tab');
      if (tab) setActiveTab(tab);
    }
  }, []);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [noteFilters, setNoteFilters] = useState<string[]>(["Underwriter"]);
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [ratingData, setRatingData] = useState<any>(null);
  const [selectedCarrierId, setSelectedCarrierId] = useState<string | null>(null);
  const [selectedCarriersByPolicy, setSelectedCarriersByPolicy] = useState<Record<string, string>>({});
  const [currentPolicyType, setCurrentPolicyType] = useState<string>("GENERAL_LIABILITY");
  const [availablePolicies, setAvailablePolicies] = useState<string[]>([]);
  const [ratingLoading, setRatingLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subjective Lines State
  const [localCustomDocs, setLocalCustomDocs] = useState<string[]>([]);
  const [newDocText, setNewDocText] = useState("");
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [isUpdatingDocs, setIsUpdatingDocs] = useState(false);

  const [paymentAuthModalOpen, setPaymentAuthModalOpen] = useState(false);
  const [paymentAuthConfirmed, setPaymentAuthConfirmed] = useState(false);
  const [paymentAuthData, setPaymentAuthData] = useState({
    premiumAmount: "",
    processingFee: 0,
    totalDue: 0
  });

  const [bindModalOpen, setBindModalOpen] = useState(false);
  const [bindSelectedCarrierIdGL, setBindSelectedCarrierIdGL] = useState<string | null>(null);
  const [bindSelectedCarrierIdXL, setBindSelectedCarrierIdXL] = useState<string | null>(null);
  const [bindSelectedCarrierIdPL, setBindSelectedCarrierIdPL] = useState<string | null>(null);
  const [bindSelectedCarrierIdPollution, setBindSelectedCarrierIdPollution] = useState<string | null>(null);

  const handleRequestBind = async () => {
    if (!bindSelectedCarrierIdGL && !bindSelectedCarrierIdXL && !bindSelectedCarrierIdPL && !bindSelectedCarrierIdPollution) {
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
    if (bindSelectedCarrierIdPL) {
      quotesToBind.push({ policyType: "PROFESSIONAL_LIABILITY", carrierId: bindSelectedCarrierIdPL });
    }
    if (bindSelectedCarrierIdPollution) {
      quotesToBind.push({ policyType: "POLLUTION_LIABILITY", carrierId: bindSelectedCarrierIdPollution });
    }

    try {
      const res = await fetch(
        `/api/admin/submissions/${submissionId}/request-bind`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotesToBind }),
        }
      );

      const result = await res.json();

      if (!res.ok) throw new Error(result.error);

      toast.success("Bind request sent!");
      setBindModalOpen(false);
      setBindSelectedCarrierIdGL(null);
      setBindSelectedCarrierIdXL(null);
      setBindSelectedCarrierIdPL(null);
      setBindSelectedCarrierIdPollution(null);
      mutate(status === "authenticated" && submissionId ? `/api/admin/submissions/${submissionId}` : null);
    } catch (err: any) {
      toast.error(err.message || "Failed to request bind");
    }
  };

  const handlePremiumChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    const fee = amount * 0.03;
    const total = amount + fee;
    setPaymentAuthData((prev) => ({
      ...prev,
      premiumAmount: value,
      processingFee: fee,
      totalDue: total
    }));
  };


  const handleCancelRequest = async () => {
    try {
      setIsCanceling(true);
      const res = await fetch("/api/agency/cancel-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: params.id }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Cancel request submitted.");
        mutate(status === "authenticated" && submissionId ? `/api/admin/submissions/${submissionId}` : null);
        setCancelModalOpen(false);
      } else {
        toast.error(result.message || "Failed to submit request.");
      }
    } catch (err: any) {
      toast.error(err.message || "Something went wrong.");
    } finally {
      setIsCanceling(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // useEffect(() => {
  //   if (activeTab === "Admin Notes") {
  //     scrollToBottom();
  //   }
  // }, [activityLogs, activeTab]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      // Only system_admin can access admin pages
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      }
    }
  }, [status, session, router]);

  // SWR Fetcher
  const fetcher = (url: string) => fetch(url).then((res) => res.json());

  const { data: rawData, error: swrError, isLoading } = useSWR(
    status === "authenticated" && submissionId ? `/api/admin/submissions/${submissionId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const data = rawData?.submission ? rawData : null;
  const { submission, routingLogs, quotes, cancelRequested } = data || {};
  const loading = isLoading;
  const error = swrError ? "Failed to load submission" : rawData?.error || "";

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
    if (carrierGroups.length > 0) {
      setSelectedCarriersByPolicy(prev => {
        const updated = { ...prev };
        if (!updated[currentPolicyType]) {
          const boundQuote = data?.quotes?.find((q: any) =>
            q.status === "BOUND" &&
            (q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY"))
          );
          if (boundQuote) {
            updated[currentPolicyType] = boundQuote.carrierId?._id || boundQuote.carrierId;
          } else {
            const matchingGroup = carrierGroups.find(g =>
              g.quotes.some((q: any) =>
                q.policyType === currentPolicyType ||
                (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
              )
            );
            if (matchingGroup) {
              updated[currentPolicyType] = matchingGroup.carrierId;
            } else if (!selectedCarrierId) {
              updated[currentPolicyType] = carrierGroups[0].carrierId;
            }
          }
        }
        return updated;
      });

      if (!selectedCarrierId) {
        const boundQuote = data?.quotes?.find((q: any) => q.status === "BOUND");
        if (boundQuote) {
          setSelectedCarrierId(boundQuote.carrierId?._id || boundQuote.carrierId);
        } else {
          setSelectedCarrierId(carrierGroups[0].carrierId);
        }
      }
    }
  }, [carrierGroups, currentPolicyType, data?.quotes]);

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

    if (!carrierGroups.length) return null;

    // OTHERWISE (Comparison Mode): Isolate lookup to selected carrier group for this policy type
    const activeCarrierId = selectedCarriersByPolicy[currentPolicyType] || selectedCarrierId;
    const group = carrierGroups.find(g => g.carrierId === activeCarrierId) || carrierGroups.find(g =>
      g.quotes.some((q: any) =>
        q.policyType === currentPolicyType ||
        (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
      )
    ) || carrierGroups[0];
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
  }, [data, carrierGroups, selectedCarrierId, selectedCarriersByPolicy, currentPolicyType]);

  useEffect(() => {
    if (data) {
      let types: string[] = [];

      // Derive available policies from ALL quotes across ALL carriers
      if (data?.quotes?.length) {
        types = Array.from(new Set(data.quotes.map((q: any) => q.policyType || "GENERAL_LIABILITY")));
      } else {
        types = ["GENERAL_LIABILITY"];
      }

      // Also add from payload if excess was requested
      if (data?.submission?.payload?.addExcessLiability || data?.submission?.payload?.addGeneralLiability) {
        if (!types.includes("EXCESS_LIABILITY")) types.push("EXCESS_LIABILITY");
      }

      // Also add from payload if professional liability was requested
      if (data?.submission?.payload?.addProfessionalLiability || data?.submission?.payload?.professionalOrPollutionType === "professional") {
        if (!types.includes("PROFESSIONAL_LIABILITY")) types.push("PROFESSIONAL_LIABILITY");
      }

      // Also add from payload if pollution liability was requested
      if (data?.submission?.payload?.addPollutionLiability || data?.submission?.payload?.professionalOrPollutionType === "pollution") {
        if (!types.includes("POLLUTION_LIABILITY")) types.push("POLLUTION_LIABILITY");
      }

      // Fix the "jumping buttons" issue by ensuring a consistent order
      const policyOrder: Record<string, number> = {
        GENERAL_LIABILITY: 1,
        EXCESS_LIABILITY: 2,
        PROFESSIONAL_LIABILITY: 3,
        POLLUTION_LIABILITY: 4,
      };
      types.sort((a, b) => (policyOrder[a] || 99) - (policyOrder[b] || 99));

      setAvailablePolicies(types as string[]);

      // Auto-switch if current policy type is not available
      if (types.length > 0 && !types.includes(currentPolicyType)) {
        setCurrentPolicyType(types[0] as any);
      }
    }
  }, [data, data?.submission?.programId, data?.submission?.programName]);

  // Auto-switch carrier when policy type changes if current carrier has no quote for it
  useEffect(() => {
    if (carrierGroups.length > 0 && currentPolicyType) {
      const preferredCarrierId = selectedCarriersByPolicy[currentPolicyType];
      const currentGroup = carrierGroups.find(g => g.carrierId === (preferredCarrierId || selectedCarrierId));
      const hasQuote = currentGroup?.quotes.some(q =>
        q.policyType === currentPolicyType ||
        (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
      );

      if (!hasQuote) {
        // Find first carrier that DOES have a quote for this policy type
        const alternativeGroup = carrierGroups.find(g =>
          g.quotes.some(q =>
            q.policyType === currentPolicyType ||
            (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
          )
        );

        if (alternativeGroup) {
          setSelectedCarrierId(alternativeGroup.carrierId);
          setSelectedCarriersByPolicy(prev => ({
            ...prev,
            [currentPolicyType]: alternativeGroup.carrierId
          }));
        }
      } else if (preferredCarrierId && preferredCarrierId !== selectedCarrierId) {
        setSelectedCarrierId(preferredCarrierId);
      }
    }
  }, [currentPolicyType, carrierGroups, selectedCarrierId, selectedCarriersByPolicy]);

  useEffect(() => {
    if (rawData?.submission?.adminNotes !== undefined) {
      setAdminNotes(rawData.submission.adminNotes);
    }
    if (rawData?.activityLogs) {
      setActivityLogs(rawData.activityLogs);
    }
  }, [rawData]); useEffect(() => {
    if (activeTab === "Rating Information" && data && data.quotes && data.quotes.length > 0) {
      const activeCarrierId = selectedCarriersByPolicy[currentPolicyType] || selectedCarrierId;
      const group = carrierGroups.find(g => g.carrierId === activeCarrierId) || carrierGroups[0];
      const quote = group ? group.quotes.find((q: any) =>
        q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
      ) : null;

      if (quote) {
        setRatingData({
          totalPremium: quote.carrierQuoteUSD || 0,
          carrierFees: quote.carrierFeesUSD || 0,
          sterlingFees: quote.sterlingInsuranceServicesFeesUSD || 0,
          surplusLinesTax: quote.premiumTaxAmountUSD || 0,
          stampingFee: quote.stampingFeeAmountUSD || 0,
          fireMarshalTax: quote.fireMarshalTaxAmountUSD || 0,
          totalCost: quote.finalAmountUSD || 0,
          commission: (quote.finalAmountUSD || 0) * 0.1,
          commissionTax: quote.brokerFeeAmountUSD || 0,
          brokerTotal: ((quote.finalAmountUSD || 0) * 0.1) + (quote.brokerFeeAmountUSD || 0)
        });
      } else {
        setRatingData(null);
      }
    } else if (activeTab === "Rating Information") {
      setRatingData({});
    }
  }, [activeTab, data, selectedCarrierId, selectedCarriersByPolicy, currentPolicyType]);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchStats();
    }
  }, [status]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !submissionId) return;
    try {
      const res = await fetch(`/api/admin/submissions/${submissionId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText, notifyList: noteFilters })
      });
      if (!res.ok) throw new Error("Failed to add note");
      const result = await res.json();
      if (result.note) {
        setActivityLogs(prev => [result.note, ...prev]);
        setNoteText("");
        setTimeout(scrollToBottom, 100);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add note");
    }
  };

  const handleFileUpload = async (files: FileList | File[]) => {
    if (!submissionId || !files || files.length === 0) return;

    const MAX_MB = 10;
    const filesArray = Array.from(files);

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

        const res = await fetch(`/api/admin/submissions/${submissionId}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          toast.error(`Failed to upload ${file.name}`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploaded successfully`);
        mutate(`/api/admin/submissions/${submissionId}`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload documents");
    } finally {
      setUploading(false);
    }
  };

  const toggleNoteFilter = (filter: string) => {
    setNoteFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const toggleDoc = async (doc: string) => {
    const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
    const newChecked = !checkedDocs[safeKey];

    setCheckedDocs((prev) => ({ ...prev, [safeKey]: newChecked }));

    if (!currentQuote?._id) return;

    try {
      const response = await fetch(`/api/admin/quotes/${currentQuote._id}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doc, value: newChecked }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Refresh data to sync with other side
      mutate(`/api/admin/submissions/${submissionId}`);
    } catch (err) {
      console.error("Error updating checked documents:", err);
      // Revert optimistic update on error
      setCheckedDocs((prev) => ({ ...prev, [safeKey]: !newChecked }));
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
      default:
        return "bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-200";
    }
  };

  const requiredDocs: string[] = currentQuote?.customDocuments ?? [];

  useEffect(() => {
    setLocalCustomDocs(currentQuote?.customDocuments || []);
    setIsAddingDoc(false);
    setNewDocText("");
  }, [currentQuote?._id, JSON.stringify(currentQuote?.customDocuments)]);

  const handleUpdateCustomDocs = async (newDocsList: string[]) => {
    if (!currentQuote?._id) {
      toast.error("You must enter a quote first before adding subjective lines.");
      return;
    }
    try {
      setIsUpdatingDocs(true);
      const res = await fetch(`/api/admin/quotes/${currentQuote._id}/custom-documents`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customDocuments: newDocsList })
      });
      const data = await res.json();
      if (data.success) {
        setLocalCustomDocs(data.customDocuments);
        mutate(`/api/admin/submissions/${submissionId}`);
        toast.success("Subjective lines updated.");
      } else {
        toast.error(data.error || "Failed to update subjective lines");
      }
    } catch (err) {
      console.error("Failed to update custom docs", err);
      toast.error("A network error occurred.");
    } finally {
      setIsUpdatingDocs(false);
    }
  };

  const handleAddCustomDocSubmit = () => {
    if (!newDocText.trim()) return;
    if (!currentQuote?._id) {
      toast.error("You must enter a quote first before adding subjective lines.");
      return;
    }
    const currentList = currentQuote.customDocuments || [];
    const newList = [...currentList, newDocText.trim()];
    handleUpdateCustomDocs(newList);
    setNewDocText("");
    setIsAddingDoc(false);
  };

  const handleRemoveCustomDoc = (docToRemove: string) => {
    const currentList = currentQuote?.customDocuments || [];
    const newList = currentList.filter(d => d !== docToRemove);
    handleUpdateCustomDocs(newList);
  };

  useEffect(() => {
    if (!currentQuote) {
      setCheckedDocs({});
      return;
    }

    const saved = currentQuote.checkedDocuments || {};
    const updated: Record<string, boolean> = { ...saved };

    (currentQuote.customDocuments || []).forEach((doc) => {
      const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
      if (!(safeKey in updated)) {
        updated[safeKey] = false;
      }
    });

    setCheckedDocs(updated);
  }, [currentQuote?._id, JSON.stringify(currentQuote?.checkedDocuments), JSON.stringify(currentQuote?.customDocuments)]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading submission details...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#f5f1eb]">
        <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link href="/admin/dashboard" className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                  <span className="text-white font-bold text-lg">SP</span>
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Sterling Portal
                </span>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
              <p className="text-red-600 mb-6">{error || "Submission not found"}</p>
              <Link
                href="/admin/submissions"
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Submissions
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }


  // ================= ISC BUTTON STYLES =================
  const iscOutlineBtn =
    "h-[42px] px-6 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-800 transition-all duration-200 hover:border-black hover:shadow-[0_0_0_1px_black] flex items-center justify-center";

  const iscPrimaryBtn =
    "h-[42px] px-6 rounded-md text-sm font-semibold bg-[#7A6F64] text-white transition-all duration-200 hover:bg-[#7A6F64] flex items-center justify-center";

  // ✅ STATUS FLAGS
  const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (quotes || []).some((q: any) => q.status === "BOUND"));
  const isSubmitted = !isBound && submission?.status === "SUBMITTED";
  const isQuoted = !isBound && submission?.status === "QUOTED";
  const isBindRequested = !isBound && submission?.status === "BIND_REQUESTED";

  // ✅ BASE QUOTE URL — same logic as agency side
  const baseQuoteUrl =
    ["inland-marine", "contractors-equipment"].includes(submission?.programId || "") ||
      ["Equipment", "Construction Equipment", "Contractors Equipment"].includes(submission?.programName || "")
      ? "/agency/quote/contractors-equipment"
      : `/agency/quote/${submission?.programId}`;

  const isCommercialProperty =
    submission?.programId === 'apartment-buildings' ||
    submission?.programName === 'Commercial Property' ||
    submission?.programName === 'Apartment Building';

  const isContractorsEquipment = (() => {
    const pid = (submission?.programId || "").toLowerCase();
    const pname = (submission?.programName || "").toLowerCase();
    const tid = typeof submission?.templateId === "string"
      ? submission.templateId.toLowerCase()
      : typeof submission?.templateId === "object" && submission?.templateId !== null
        ? `${(submission.templateId as any).industry || ""} ${(submission.templateId as any).subtype || ""}`.toLowerCase()
        : "";
    const payload = submission?.payload || {};
    const payloadPolicyType = (payload?.policyType || "").toLowerCase();
    const payloadProgramName = (payload?.programName || "").toLowerCase();
    const payloadProgramId = (payload?.programId || "").toLowerCase();

    return (
      ["inland-marine", "contractors-equipment"].includes(pid) ||
      ["equipment", "construction equipment", "contractors equipment", "inland marine"].includes(pname) ||
      pid.includes("inland") ||
      pid.includes("marine") ||
      pid.includes("equipment") ||
      pname.includes("inland") ||
      pname.includes("marine") ||
      pname.includes("equipment") ||
      pname.includes("contractors equipment") ||
      tid.includes("equipment") ||
      tid.includes("inland") ||
      payloadProgramId === "contractors-equipment" ||
      payloadProgramId === "inland-marine" ||
      payloadPolicyType.includes("inland marine") ||
      payloadPolicyType.includes("contractors equipment") ||
      payloadProgramName.includes("contractors equipment") ||
      payloadProgramName.includes("inland marine") ||
      Boolean(payload?.scheduledEquipmentLimit || payload?.heavyEquipment || payload?.lightMedEquipment || payload?.heavyLimit || payload?.miscToolsLimit || payload?.rentedEquipLimit)
    );
  })();

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
    if (type === "INLAND_MARINE") {
      return "Inland Marine";
    }
    if (type === "GENERAL_LIABILITY") {
      if (isManufacturer) return "Manufacturers";
      if (isCommercialProperty) return "Property";
      if (isContractorsEquipment) return "Inland Marine";
      if (isBuildersRisk) return "Builders Risk";
      return "General Liability";
    } else if (type === "EXCESS_LIABILITY") {
      if (isCommercialProperty) return "General Liability";
      return "Excess Liability";
    } else if (type === "PROFESSIONAL_LIABILITY") {
      return "Professional Liability";
    } else if (type === "POLLUTION_LIABILITY") {
      return "Pollution Liability";
    }
    return type;
  };

  const statusHistory = [
    {
      _id: submission._id + "-created",
      program: submission.programName || (submission.programId === 'apartment-buildings' ? "Property" : "General Liability"),
      changedAt: submission.createdAt,
      user: submission.agencyId?.name || "System",
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
      user: log.performedBy?.userName || "System Administrator",
      status: log.description,
    })),
  ].sort(
    (a, b) =>
      new Date(b.changedAt).getTime() -
      new Date(a.changedAt).getTime()
  );

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Request</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Are you sure you want to request cancellation for this submission?
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-gray-100">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isCanceling}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelRequest}
                disabled={isCanceling}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {isCanceling ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Confirming...
                  </>
                ) : (
                  "Confirm Cancel"
                )}
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
            {availablePolicies.includes("GENERAL_LIABILITY") && !data?.quotes?.some((q: any) => (q.policyType === "GENERAL_LIABILITY" || !q.policyType) && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data?.quotes?.some((q: any) => q.policyType === "GENERAL_LIABILITY" || !q.policyType) && (
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
                  {data?.quotes?.filter((q: any) => (q.policyType === "GENERAL_LIABILITY" || !q.policyType) && q.status !== "BOUND").map((quote: any) => (
                    <option key={quote._id} value={quote.carrierId?._id}>
                      {quote.carrierId?.name || "Unknown Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Only show XL selector if XL is NOT already bound or requested */}
            {availablePolicies.includes("EXCESS_LIABILITY") && !data?.quotes?.some((q: any) => q.policyType === "EXCESS_LIABILITY" && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data?.quotes?.some((q: any) => q.policyType === "EXCESS_LIABILITY") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPolicyLabel("EXCESS_LIABILITY")} Carrier
                </label>
                <select
                  value={bindSelectedCarrierIdXL || ""}
                  onChange={(e) => setBindSelectedCarrierIdXL(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block p-3 outline-none transition-all"
                >
                  <option value="">Do not bind {getPolicyLabel("EXCESS_LIABILITY")}...</option>
                  {data?.quotes?.filter((q: any) => q.policyType === "EXCESS_LIABILITY" && q.status !== "BOUND").map((quote: any) => (
                    <option key={quote._id} value={quote.carrierId?._id}>
                      {quote.carrierId?.name || "Unknown Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Only show PL selector if PL is NOT already bound or requested */}
            {availablePolicies.includes("PROFESSIONAL_LIABILITY") && !data?.quotes?.some((q: any) => q.policyType === "PROFESSIONAL_LIABILITY" && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data?.quotes?.some((q: any) => q.policyType === "PROFESSIONAL_LIABILITY") && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPolicyLabel("PROFESSIONAL_LIABILITY")} Carrier
                </label>
                <select
                  value={bindSelectedCarrierIdPL || ""}
                  onChange={(e) => setBindSelectedCarrierIdPL(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block p-3 outline-none transition-all"
                >
                  <option value="">Do not bind {getPolicyLabel("PROFESSIONAL_LIABILITY")}...</option>
                  {data?.quotes?.filter((q: any) => q.policyType === "PROFESSIONAL_LIABILITY" && q.status !== "BOUND").map((quote: any) => (
                    <option key={quote._id} value={quote.carrierId?._id}>
                      {quote.carrierId?.name || "Unknown Carrier"}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Only show Pollution selector if Pollution is NOT already bound or requested */}
            {availablePolicies.includes("POLLUTION_LIABILITY") && !data?.quotes?.some((q: any) => q.policyType === "POLLUTION_LIABILITY" && (q.status === "BOUND" || q.status === "BIND_REQUESTED")) && data?.quotes?.some((q: any) => q.policyType === "POLLUTION_LIABILITY") && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {getPolicyLabel("POLLUTION_LIABILITY")} Carrier
                </label>
                <select
                  value={bindSelectedCarrierIdPollution || ""}
                  onChange={(e) => setBindSelectedCarrierIdPollution(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-black focus:border-black block p-3 outline-none transition-all"
                >
                  <option value="">Do not bind {getPolicyLabel("POLLUTION_LIABILITY")}...</option>
                  {data?.quotes?.filter((q: any) => q.policyType === "POLLUTION_LIABILITY" && q.status !== "BOUND").map((quote: any) => (
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
                  setBindSelectedCarrierIdPL(null);
                  setBindSelectedCarrierIdPollution(null);
                }}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestBind}
                disabled={!bindSelectedCarrierIdGL && !bindSelectedCarrierIdXL && !bindSelectedCarrierIdPL && !bindSelectedCarrierIdPollution}
                className={`px-5 py-2.5 text-sm font-medium text-white rounded-xl transition-all ${(bindSelectedCarrierIdGL || bindSelectedCarrierIdXL || bindSelectedCarrierIdPL || bindSelectedCarrierIdPollution)
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
              <Link href="/admin/dashboard" className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 animate-pulse transition-all duration-500"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:shadow-rose-600/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                    <div className="relative">
                      <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">SP</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-900 font-bold text-lg tracking-tight">Sterling Portal</span>
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
                <Link href="/admin/bind-requests" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Bind Requests
                  {stats.bindRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-orange-500 to-red-600 rounded-full shadow-lg animate-pulse">
                      {stats.bindRequests}
                    </span>
                  )}
                </Link>
                <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Policies
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Tool Requests
                </Link>
                <Link href="/admin/cancel-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Cancel Requests
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-8 w-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-gray-900">{session?.user?.name || "Administrator"}</p>
                  <p className="text-xs text-gray-500">System Admin</p>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="w-10 h-10 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold text-sm shadow-sm hover:shadow-md hover:scale-105 transition-all duration-200"
                  >
                    {session?.user?.name?.[0] || "A"}
                  </button>
                  {profileOpen && (
                    <div className="absolute right-0 mt-3 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                      <div className="px-4 py-3 border-b bg-gray-50">
                        <p className="text-sm font-semibold text-gray-800">Sterling Insurance Services</p>
                        <p className="text-xs text-gray-500">Admin Panel</p>
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

      <main className="flex-1 bg-[#f5f1eb] overflow-x-hidden min-h-screen pb-12">
        {/* Header */}
        <div className="bg-white px-6 pt-5 pb-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="bg-white px-8 py-3">
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    const lastPage = sessionStorage.getItem("sterling_admin_back_url") || "/admin/submissions";
                    router.push(lastPage);
                  } else {
                    router.push("/admin/submissions");
                  }
                }}
                className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors mb-4 font-medium text-sm w-fit"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </button>
              <div>
                <h1 className="flex items-center gap-3 text-[24px] font-semibold text-gray-900 leading-tight">
                  <div>
                    {(submission?.payload?.companyName || submission?.payload?.applicantName || submission?.payload?.namedInsured || submission?.clientContact?.name || "???")}
                    <span className={`ml-3 inline-flex items-center rounded-md px-3 py-[4px] text-[13px] font-bold border transition-all ${(() => {
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
                    {(submission?.hasNewEdits || (() => {
                      // Only show MODIFIED on BOUND submissions that have new unbounded policies
                      if (submission?.status !== "BOUND") return false;
                      const hasExcessInPayload = submission.payload?.addExcessLiability === true;
                      const hasBoundExcessQuote = quotes?.some((q: any) => q.policyType === "EXCESS_LIABILITY" && q.status === "BOUND");
                      return hasExcessInPayload && !hasBoundExcessQuote;
                    })()) && (
                        <span className="ml-2 inline-flex items-center rounded-md bg-rose-100 px-3 py-[4px] text-[13px] font-bold text-rose-700 border border-rose-200 animate-pulse">
                          MODIFIED
                        </span>
                      )}
                  </div>
                </h1>

                <div className="flex items-center flex-wrap gap-x-5 gap-y-1 mt-2 text-[14px] text-gray-700">
                  <span className="flex items-center gap-1.5">
                    <User className="w-[18px] h-[18px] text-gray-400" />
                    {submission?.payload?.firstName || submission?.payload?.lastName
                      ? `${submission.payload.firstName || ""} ${submission.payload.lastName || ""}`.trim()
                      : (submission?.clientContact?.name || "???")}
                  </span>
                  {(submission?.payload?.dba || submission?.dba) && (
                    <span className="flex items-center gap-1.5">
                      DBA: {(submission?.payload?.dba || submission?.dba || "???")}
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
                    <Phone className="w-4 h-4 text-gray-400" />
                    {submission?.payload?.applicantPhone || (submission?.clientContact?.phone && submission?.clientContact?.phone !== "000-000-0000" ? submission?.clientContact?.phone : "") || submission?.payload?.phone || submission?.clientContact?.phone || "???"}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {submission?.payload?.applicantEmail || (submission?.clientContact?.email && submission?.clientContact?.email !== "unknown@example.com" ? submission?.clientContact?.email : "") || submission?.payload?.email || submission?.clientContact?.email || "???"}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 pr-8">

              <span className="text-[14px] text-gray-500 font-medium">
                App ID {submission.submissionNumber}
              </span>
            </div>
          </div>
        </div>

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

          return data?.quotes && data.quotes.length > 0 && availableCarrierGroups.length > 1 && !isCurrentPolicyBound ? (
            <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shadow-sm rounded-md mb-2">
              <span className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">SELECT CARRIER:</span>
              <select
                value={selectedCarriersByPolicy[currentPolicyType] || selectedCarrierId || ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCarrierId(val);
                  setSelectedCarriersByPolicy(prev => ({
                    ...prev,
                    [currentPolicyType]: val
                  }));
                }}
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

        {/* Action Row */}
        <div className="bg-white px-6 py-4 md:py-3 min-h-[64px] border-t border-gray-100 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:gap-6 px-8">
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
                  const isBound = submission?.status === "BOUND" || (submission?.status !== "CANCELLED" && (quotes || []).some((q: any) => q.status === "BOUND"));
                  return isBound ? "BOUND" : (submission?.status || "").replace(/_/g, " ");
                })()}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2 md:gap-3">
              {submission.status !== "CANCELLED" && (
                <>
                  {submission.status !== "SUBMITTED" && submission.status !== "BOUND" && (
                    <>
                      <button
                        onClick={() => {
                          if (paymentAuthConfirmed) {
                            window.open(
                              `/api/admin/submissions/${submissionId}/payment-auth?quoteId=${currentQuote?._id || ''}&premiumAmount=${paymentAuthData.premiumAmount || 0}&processingFee=${paymentAuthData.processingFee || 0}&totalDue=${paymentAuthData.totalDue || 0}`,
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
                        onClick={() => window.open(`/api/admin/submissions/${submissionId}/proposal?quoteId=${currentQuote?._id || ""}&policyType=${currentPolicyType || ''}`, "_blank")}
                        className={iscOutlineBtn}
                      >
                        Proposal
                      </button>
                    </>
                  )}
                  {submission.status !== "SUBMITTED" && (
                    <button
                      onClick={() => window.open(`/api/admin/submissions/${submissionId}/invoice?quoteId=${currentQuote?._id || ""}&policyType=${currentPolicyType || ""}`, "_blank")}
                      className={iscOutlineBtn}
                    >
                      Invoice
                    </button>
                  )}
                  {submission.status === "SUBMITTED" && (
                    <button
                      onClick={() => router.push(`/admin/submissions/${submissionId}/quote`)}
                      className={iscOutlineBtn}
                    >
                      Enter Quote
                    </button>
                  )}
                  {["QUOTED", "BIND_REQUESTED"].includes(submission.status) && (
                    <button
                      onClick={() => router.push(`/admin/submissions/${submissionId}/quote`)}
                      className={iscOutlineBtn}
                    >
                      Re-enter Quote
                    </button>
                  )}

                  {/* Request Bind / Bind Requested Buttons */}
                  {(() => {
                    // Check if current policy line is already bound
                    const isCurrentPolicyBound = (data?.quotes || []).some((q: any) =>
                      (q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")) &&
                      q.status === "BOUND"
                    );

                    // Check if current policy line is already requested for bind
                    const isCurrentPolicyBindRequested = (data?.quotes || []).some((q: any) =>
                      (q.policyType === currentPolicyType || (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")) &&
                      q.status === "BIND_REQUESTED"
                    );

                    const currentQuoteStatus = currentQuote?.status;

                    // Can request bind only if not bound, not bind requested, and quote is entered/posted/quoted
                    const canRequestBind = !isCurrentPolicyBound && !isCurrentPolicyBindRequested && currentQuote && (
                      ["POSTED", "ENTERED", "QUOTED"].includes(currentQuoteStatus) ||
                      data?.submission?.status === "QUOTED"
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

                        {!isCurrentPolicyBound && isCurrentPolicyBindRequested && (
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
                  {submission.status === "BOUND" && (
                    <>
                      {(submission.hasNewEdits || (() => {
                        const hasExcessInPayload = submission.payload?.addExcessLiability === true;
                        const hasBoundExcessQuote = quotes?.some(q => q.policyType === "EXCESS_LIABILITY" && q.status === "BOUND");
                        return hasExcessInPayload && !hasBoundExcessQuote;
                      })()) && (
                          <button
                            onClick={() => router.push(`/admin/submissions/${submissionId}/quote`)}
                            className="h-[42px] px-6 rounded-md text-sm font-bold bg-rose-600 text-white transition-all duration-200 hover:bg-rose-700 shadow-lg shadow-rose-200 flex items-center gap-2"
                          >
                            <svg className="w-4 h-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Re-enter Quote
                          </button>
                        )}
                      {(() => {
                        const isCurrentQuoteUnboundXL = currentQuote &&
                          currentPolicyType === "EXCESS_LIABILITY" &&
                          ["POSTED", "ENTERED", "QUOTED", "BIND_REQUESTED"].includes(currentQuote.status);

                        return isCurrentQuoteUnboundXL ? (
                          <button
                            onClick={() => window.open(`/api/admin/submissions/${submissionId}/proposal?quoteId=${currentQuote?._id || ""}&policyType=${currentPolicyType || ''}&isExcessOnly=true`, "_blank")}
                            className={iscOutlineBtn}
                          >
                            Excess Proposal
                          </button>
                        ) : null;
                      })()}
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
                    </>
                  )}
                  {/* ✅ VIEW — opens application form in read-only mode */}
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

                  {/* ✅ MODIFY — opens application form in edit mode */}
                  <button
                    onClick={() =>
                      window.open(
                        `${baseQuoteUrl}?mode=edit&id=${submission._id}`,
                        "_blank"
                      )
                    }
                    className={iscOutlineBtn}
                  >
                    Modify
                  </button>

                  <button
                    onClick={() => window.open(`/api/admin/submissions/${submissionId}/pdf?quoteId=${currentQuote?._id || ""}`, "_blank")}
                    className={iscOutlineBtn}
                  >
                    App Packet
                  </button>
                  <button
                    onClick={() => setCancelModalOpen(true)}
                    disabled={cancelRequested}
                    className={`${iscOutlineBtn} ${cancelRequested ? "opacity-60 cursor-not-allowed bg-gray-100" : ""}`}
                  >
                    {cancelRequested ? "Cancel Requested" : "Cancel"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* FULL WIDTH SECTION: Key Information */}
        <div className="bg-white px-8 py-5 border-t border-gray-100 shadow-sm">
          <div className="px-8 grid grid-cols-1 md:grid-cols-5 gap-y-6 gap-x-14 text-[14px]">
            <div>
              <p className="text-gray-500 mb-1 leading-tight">Program Name</p>
              <p className="font-semibold text-gray-900 break-words">
                {submission?.programName === "Advantage Contractor GL"
                  ? "Construction"
                  : (submission?.programName === "Construction Equipment"
                    ? "Contractors Equipment"
                    : (submission?.programName === "Manufacturers / Distributors" || (submission?.programName || "").toLowerCase().includes("manufacturer") || submission?.programId === "manufacturers")
                      ? "Manufacturers"
                      : (submission?.programName || "General Liability"))}
              </p>
            </div>
            {/* <div>
              <p className="text-gray-500 mb-1 leading-tight">Effective Date:</p>
              <p className="font-semibold text-gray-900">
                {currentQuote?.effectiveDate
                  ? new Date(currentQuote.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })
                  : (currentPolicyType === "GENERAL_LIABILITY" && submission.effectiveDate ? new Date(submission.effectiveDate).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' }) : "TBD")}
              </p>
            </div> */}
            {/* <div>
              <p className="text-gray-500 mb-1 leading-tight">
                {submission.programId === 'apartment-buildings' ? 'Total Insured Value (TIV):' :
                  submission.programId === 'contractors-equipment' ? 'Total Equipment Value:' : 'Estimated Gross Receipts:'}
              </p>
              <p className="font-semibold text-gray-900">
                {submission.programId === 'apartment-buildings'
                  ? (submission?.payload?.propertyOccupancy?.totalInsuredValue ? `$${Number(String(submission.payload.propertyOccupancy.totalInsuredValue).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "—")
                  : submission.programId === 'contractors-equipment'
                    ? (() => {
                      const h = Number(String(submission?.payload?.heavyLimit || 0).replace(/[^0-9.]/g, ''));
                      const l = Number(String(submission?.payload?.lightMedLimit || 0).replace(/[^0-9.]/g, ''));
                      return (h + l) > 0 ? `$${(h + l).toLocaleString('en-US')}` : "—";
                    })()
                    : (submission?.payload?.estimatedGrossReceipts ? `$${Number(String(submission.payload.estimatedGrossReceipts).replace(/[^0-9.]/g, '')).toLocaleString('en-US')}` : "—")
                }
              </p>
            </div> */}
            <div>
              <p className="text-gray-500 mb-1 leading-tight">Total Cost</p>
              <p className="font-semibold text-gray-900">
                {formatCurrency(currentQuote?.finalAmountUSD)}
              </p>
            </div>
            {/* <div>
              <p className="text-gray-500 mb-1 leading-tight">Carrier Name</p>
              <p className="font-semibold text-gray-900">
                {currentQuote?.carrierId?.name || "Carrier"}
              </p>
            </div> */}
            {/* Create Date */}
            <div>
              <p className="text-gray-500 mb-1">Create Date:</p>
              <p className="font-semibold text-gray-900">
                {currentQuote?.createdAt
                  ? new Date(currentQuote.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })
                  : (submission?.createdAt ? new Date(submission.createdAt) : new Date()).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-gray-500 mb-1 leading-tight">Agency Name</p>
              <p className="font-semibold text-gray-900">{submission.agencyId?.name || "N/A"}</p>
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
              <p className="text-gray-500 mb-1 leading-tight">Policy Number</p>
              <p className="font-semibold text-gray-900">{currentQuote?.policyNumber || (currentPolicyType === "GENERAL_LIABILITY" ? submission.policyNumber : "") || "N/A"}</p>
            </div> */}
          </div>
        </div>
        {/* Policy Selector */}
        {availablePolicies.length > 1 && (
          <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center gap-4 shadow-sm">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">POLICY TYPE:</span>
            <div className="flex gap-2">
              {availablePolicies.map((type: any) => (
                <button
                  key={type}
                  onClick={() => setCurrentPolicyType(type)}
                  className={`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all ${currentPolicyType === type
                    ? "bg-[#7A6F64] text-white shadow-md shadow-gray-200"
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

            {isContractorsEquipment && currentQuote?.limits && (
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                {currentQuote.limits.totalInsuredValue && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Insured Value</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.totalInsuredValue}</span>
                  </div>
                )}
                {currentQuote.limits.scheduledEquipment && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Scheduled Equipment</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.scheduledEquipment}</span>
                  </div>
                )}
                {currentQuote.limits.coinsurance && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Coinsurance</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.coinsurance}</span>
                  </div>
                )}
                {currentQuote.limits.valuation && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Valuation</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.valuation}</span>
                  </div>
                )}
              </div>
            )}

            {isBuildersRisk && currentQuote?.limits && (
              <div className="col-span-1 md:col-span-2 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 bg-amber-50/50 p-4 rounded-xl border border-amber-200/60">
                {currentQuote.limits.limitPerOccurrence && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Limit Per Occurrence</span>
                    <span className="font-bold text-gray-900 text-[15px]">${Number(currentQuote.limits.limitPerOccurrence).toLocaleString('en-US')}</span>
                  </div>
                )}
                {currentQuote.limits.completedValue && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Completed Value</span>
                    <span className="font-bold text-gray-900 text-[15px]">${Number(currentQuote.limits.completedValue).toLocaleString('en-US')}</span>
                  </div>
                )}
                {currentQuote.limits.totalInsurableValue && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Insurable Value</span>
                    <span className="font-bold text-gray-900 text-[15px]">${Number(currentQuote.limits.totalInsurableValue).toLocaleString('en-US')}</span>
                  </div>
                )}
                {currentQuote.limits.existingStructure && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Existing Structure</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.existingStructure}</span>
                  </div>
                )}
                {currentQuote.limits.valuation && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Valuation</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.valuation}</span>
                  </div>
                )}
                {currentQuote.limits.coinsurance && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Coinsurance</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.coinsurance}%</span>
                  </div>
                )}
                {currentQuote.limits.waterDamageSublimit && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Water Damage</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.waterDamageSublimit.startsWith('$') ? currentQuote.limits.waterDamageSublimit : `$${currentQuote.limits.waterDamageSublimit}`}</span>
                  </div>
                )}
                {currentQuote.limits.softCostsSublimit && (
                  <div>
                    <span className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider">Soft Costs</span>
                    <span className="font-bold text-gray-900 text-[15px]">{currentQuote.limits.softCostsSublimit.startsWith('$') ? currentQuote.limits.softCostsSublimit : `$${currentQuote.limits.softCostsSublimit}`}</span>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>


        <div className="bg-white px-8 py-6 grid grid-cols-1 lg:grid-cols-3 gap-10 border-b border-gray-200 rounded-xl">
          {/* LEFT – UPLOADED DOCUMENTS */}
          <div className="lg:col-span-2">
            <h3 className="text-[15px] font-semibold text-gray-900 mb-4">Uploaded Documents</h3>
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
                : "border-gray-200 hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                } border-2 border-dashed rounded-xl p-8 text-center mb-6`}
              onClick={() => document.getElementById('admin-file-upload')?.click()}
            >
              <input
                id="admin-file-upload"
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
            <div className="bg-gray-100 px-4 py-2 grid grid-cols-3 text-[13px] font-medium text-gray-600">
              <span>Filename</span>
              <span>Uploaded On</span>
              <span>Action</span>
            </div>
            {submission.files.length === 0 ? (
              <div className="px-4 py-6 text-[14px] text-gray-400 border border-t-0 border-gray-200">No documents uploaded yet</div>
            ) : (
              submission.files.map((file: any, index: number) => (
                <div key={index} className="px-4 py-3 grid grid-cols-3 items-center text-[14px] border border-t-0 border-gray-200">
                  <span className="font-medium text-gray-900 truncate pr-4">{file.fileName}</span>
                  <span className="text-gray-500">{file.uploadedAt ? new Date(file.uploadedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                  <div className="flex items-center gap-4">
                    <a href={`/api/download?url=${encodeURIComponent(file.fileUrl)}`} download={file.fileName} className="text-[#9A8B7A] hover:text-[#7A6F64] font-medium hover:underline transition-colors">Download</a>
                    <a href={`/api/download?url=${encodeURIComponent(file.fileUrl)}&view=true`} target="_blank" rel="noopener noreferrer" className="text-[#9A8B7A] hover:text-[#7A6F64] font-medium hover:underline transition-colors">View</a>
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
          {/* RIGHT – SUBJECTIVE LINES */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[14px] font-semibold text-gray-900 tracking-tight">
                Subjective Lines
              </h3>
              {isUpdatingDocs && <span className="text-xs text-teal-600 animate-pulse">Saving...</span>}
            </div>
            
            <div className="space-y-4 text-[14px]">
              {localCustomDocs.length === 0 ? (
                <p className="text-gray-400 text-sm">
                  No subjective lines specified by admin
                </p>
              ) : (
                localCustomDocs.map((doc) => {
                  const safeKey = doc.replace(/\./g, '___dot___').replace(/\$/g, '___dollar___');
                  const checked = checkedDocs[safeKey];
                  return (
                    <div
                      key={doc}
                      className="flex items-start justify-between group"
                    >
                      <div 
                        className="flex items-start gap-4 cursor-pointer flex-1"
                        onClick={() => toggleDoc(doc)}
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
                      
                      {/* REMOVE BUTTON */}
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRemoveCustomDoc(doc); }}
                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 p-1 transition-opacity"
                        title="Remove subjective line"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })
              )}

              {/* ADD NEW SUBJECTIVE LINE UI */}
              {currentQuote?._id && (
                <div className="pt-4 border-t border-gray-100">
                  {!isAddingDoc ? (
                    <button 
                      onClick={() => setIsAddingDoc(true)}
                      className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                    >
                      <span className="text-sm">＋</span> Add Subjective Line
                    </button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <input 
                        type="text" 
                        value={newDocText}
                        onChange={(e) => setNewDocText(e.target.value)}
                        placeholder="Enter new requirement..."
                        className="w-full text-sm px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-400"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddCustomDocSubmit();
                          if (e.key === 'Escape') { setIsAddingDoc(false); setNewDocText(""); }
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => { setIsAddingDoc(false); setNewDocText(""); }}
                          className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 font-medium"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleAddCustomDocSubmit}
                          disabled={!newDocText.trim() || isUpdatingDocs}
                          className="text-xs bg-teal-600 hover:bg-teal-700 text-white px-3 py-1 rounded-md font-medium disabled:opacity-50"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
        {/* Tabs Bar */}
        <div className="bg-white px-8 border-t border-gray-100 shadow-sm sticky top-[64px] z-30">
          <div className="px-8 flex items-center gap-8 h-[56px]">
            {["Admin Notes", "Status History", "Additional Information", "Rating Information", "Key Information", "Quoting & Routing", "Premium Financing", "Audits"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`h-full px-1 text-[14px] font-medium transition-all relative ${activeTab === tab ? "text-blue-600" : "text-gray-500 hover:text-gray-700"
                  }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-600 rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-8">
          <div className="px-8">
            {activeTab === "Admin Notes" && (
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
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-[#7A6F64] text-white flex items-center justify-center font-semibold">
                      {(session?.user as any)?.name?.[0] || "A"}
                    </div>

                    {/* Textarea */}
                    <div className="flex-1">
                      <textarea
                        rows={4}
                        className="w-full border border-gray-300 rounded-md p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#7A6F64]"
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value)}
                        placeholder="Leave a note..."
                      />

                      <div className="mt-3 flex justify-end">
                        <button
                          onClick={handleAddNote}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7A6F64] hover:bg-[#635a51] text-white rounded-md text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <span className="text-base">+</span>Add Note
                        </button>
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
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                        <MessageSquare className="w-12 h-12 text-gray-300 mb-2" />
                        <p className="font-medium text-gray-500 mb-1">No notes added yet</p>
                        <p className="text-[13px] text-gray-400">Share context or ask questions.</p>
                      </div>
                    ) : (
                      activityLogs
                        .filter(log => log.activityType === "ADMIN_NOTE_ADDED")
                        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                        .map((note) => {
                          const isMe = note.performedBy?.userId === (session?.user as any)?.id;
                          return (
                            <div key={note._id} className={`flex ${isMe ? "justify-end" : "justify-start"} w-full`}>
                              <div className={`flex flex-col max-w-[85%] ${isMe ? "items-end" : "items-start"}`}>
                                <div className={`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed relative ${isMe
                                  ? "bg-[#7A6F64] text-white rounded-tr-sm"
                                  : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                                  }`}>
                                  {!isMe && (
                                    <div className="text-[11px] font-bold text-gray-400 mb-1 tracking-tight">
                                      {note.performedBy?.userName || "Admin"}
                                    </div>
                                  )}
                                  <span className="whitespace-pre-wrap break-words">{note.description}</span>
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium italic">
                                  {new Date(note.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}
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
              <div className="border rounded-md overflow-hidden bg-white">
                <div className="bg-gray-100 px-4 py-2 grid grid-cols-4 text-[13px] font-medium text-gray-600 border-b border-gray-200">
                  <span>Program</span>
                  <span>Changed</span>
                  <span>User</span>
                  <span>Status</span>
                </div>

                {statusHistory.map((item) => (
                  <div
                    key={item._id}
                    className="px-4 py-3 grid grid-cols-4 text-[14px] text-gray-900 border-b border-gray-100 last:border-0"
                  >
                    <span>{item.program === "Advantage Contractor GL" ? "Construction" : (item.program === "Construction Equipment" ? "Contractors Equipment" : (item.program === "Manufacturers / Distributors" || item.program?.toLowerCase().includes("manufacturer") ? "Manufacturers" : item.program))}</span>
                    <span>{new Date(item.changedAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                    <span>{item.user}</span>
                    <span>{item.status}</span>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "Additional Information" && (
              <div className="space-y-8">


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Application Details
                        </h3>
                      </div>
                      <div className="p-6">
                        <ApplicationDataViewer data={submission.payload} type="additional" />
                      </div>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location Information
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">Street</p>
                          <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.street || "—"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">City</p>
                            <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.city || "—"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">State</p>
                            <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.state || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "Key Information" && (
              <div className="space-y-8">


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-600" />
                          Application Details
                        </h3>
                      </div>
                      <div className="p-6">
                        <ApplicationDataViewer data={submission.payload} type="key" />
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        Location Information
                      </h3>
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">Street</p>
                          <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.street || "—"}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">City</p>
                            <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.city || "—"}</p>
                          </div>
                          <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider mb-2">State</p>
                            <p className="text-sm font-medium text-gray-900">{submission.clientContact?.businessAddress?.state || "—"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Rating Information" && (
              <div className="space-y-6">
                {!currentQuote ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-2xl">🤔</span>
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

            {activeTab === "Quoting & Routing" && (
              <div className="space-y-8">
                {/* Routing Logs */}

                {/* Active Quotes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-rose-600" />
                      Active Quotes
                    </h3>
                    <button
                      onClick={() => window.open(`/admin/submissions/${submissionId}/quote`, "_blank")}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Manage Quotes
                    </button>
                  </div>
                  <div className="p-6">
                    {quotes && quotes.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
                        {quotes.map((quote: any) => {
                          const isGL = !quote.policyType || quote.policyType === 'GENERAL_LIABILITY';
                          const statusColor = quote.status === 'BOUND' ? 'text-green-600 bg-green-50 border-green-100' :
                            ['POSTED', 'APPROVED', 'BIND_REQUESTED'].includes(quote.status) ? 'text-blue-600 bg-blue-50 border-blue-100' :
                              'text-gray-600 bg-gray-50 border-gray-200';

                          return (
                            <div key={quote._id} className="group relative bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-gray-300 transition-all duration-300 overflow-hidden flex flex-col">
                              {/* Top accent line */}
                              <div className={`h-1.5 w-full ${isGL ? 'bg-blue-600' : 'bg-amber-500'}`} />

                              <div className="p-5 flex-1">
                                <div className="flex justify-between items-start">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${isGL ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                                      {isGL ? <Shield className="w-5 h-5" /> : <Layers className="w-5 h-5" />}
                                    </div>
                                    <div>
                                      <h4 className="font-bold text-gray-900 tracking-tight leading-none mb-1.5">{quote.carrierId?.name || "Carrier"}</h4>
                                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black tracking-widest uppercase border ${isGL ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        {isGL ? 'General Liability' : 'Excess Liability'}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xl font-black text-gray-900">
                                      {formatCurrency(quote.finalAmountUSD)}
                                    </div>
                                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1 ${statusColor}`}>
                                      {quote.status}
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center gap-3">
                                {quote.binderPdfUrl ? (
                                  <button
                                    onClick={() => window.open(quote.binderPdfUrl, "_blank")}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-white border border-gray-200 text-gray-700 text-[11px] font-bold rounded-xl shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-all active:scale-95"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    Binder PDF
                                  </button>
                                ) : (
                                  <div className="flex-1 py-2 px-3 bg-gray-100/50 border border-transparent text-gray-400 text-[11px] font-bold rounded-xl text-center">
                                    No Binder
                                  </div>
                                )}

                                {quote.status === "ENTERED" && (
                                  <Link
                                    href={`/admin/quotes/${quote._id}/post`}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-black text-white text-[11px] font-bold rounded-xl shadow-sm hover:bg-gray-800 transition-all active:scale-95"
                                  >
                                    Post Quote
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                        <p className="text-sm">No active quotes found for this submission.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "Audits" && (
              <div className="animate-in fade-in duration-300">
                <PolicyAuditTab submissionId={submissionId as string} />
              </div>
            )}

            {activeTab === "Premium Financing" && (
              <div className="animate-in fade-in duration-300">
                <AdminPremiumFinanceTab
                  submission={submission}
                  quotes={quotes || []}
                  mutate={async () => {
                    await mutate(`/api/admin/submissions/${submissionId}`);
                  }}
                />
              </div>
            )}
          </div>
        </div>

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
    </div>
  );
}

