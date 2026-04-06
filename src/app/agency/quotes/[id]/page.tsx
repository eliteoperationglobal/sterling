"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import SterlingLogo from "@/components/SterlingLogo";
import StatusBadge from "@/components/agency/quotes/StatusBadge";
import StatusTimeline from "@/components/ui/StatusTimeline";
import {
  getESignStatus,
  getDocuments,
  getPaymentStatus,
} from "@/lib/client/api";

interface Quote {
  _id: string;
  submissionId: string;
  carrierId: string;
  carrierName: string;
  clientName: string;
  carrierQuoteUSD: number;
  brokerFeeAmountUSD: number;
  premiumTaxPercent?: number;
  premiumTaxAmountUSD?: number;
  policyFeeUSD?: number;
  finalAmountUSD: number;
  status: string;
  submissionStatus: string;
  esignCompleted: boolean;
  paymentStatus: string;
  createdAt: string;
  financePlan?: any;
  binderPdfUrl?: string;
  adminNotes?: string;
  specialNotes?: string;
}

interface Submission {
  _id: string;
  agencyId: string;
  templateId: {
    _id: string;
    name: string;
    industry: string;
    subcategory?: string;
  };
  payload: Record<string, any>;
  clientContact: {
    name: string;
    email: string;
    phone: string;
    EIN?: string;
    businessAddress: {
      street: string;
      city: string;
      state: string;
      zip: string;
    };
  };
  status: string;
  esignCompleted: boolean;
  esignCompletedAt?: string;
  paymentStatus: string;
  paymentDate?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  bindRequested?: boolean;
  bindRequestedAt?: string;
  bindApproved?: boolean;
  bindApprovedAt?: string;
  signedDocuments?: SignedDocument[];
  finalPolicyDocuments?: {
    finalBinderPdfUrl?: string;
    finalBinderUploadedAt?: string;
    finalPolicyPdfUrl?: string;
    finalPolicyUploadedAt?: string;
    certificateOfInsuranceUrl?: string;
    certificateUploadedAt?: string;
  };
  createdAt: string;
}

interface SignedDocument {
  documentType: "PROPOSAL" | "FINANCE_AGREEMENT" | "CARRIER_FORM" | "ADMIN_UPLOAD";
  documentName: string;
  documentUrl: string;
  generatedAt: string;
  signatureStatus: "GENERATED" | "SENT" | "SIGNED" | "FAILED";
  sentForSignatureAt?: string;
  signedAt?: string;
}

export default function QuoteDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [documents, setDocuments] = useState<SignedDocument[]>([]);
  const [esignStatus, setEsignStatus] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Individual loading states for each button
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [generatingFinanceAgreement, setGeneratingFinanceAgreement] = useState(false);
  const [generatingCarrierForm, setGeneratingCarrierForm] = useState(false);
  const [sendingEsign, setSendingEsign] = useState(false);
  const [completingEsign, setCompletingEsign] = useState(false);
  const [paying, setPaying] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<"CREDIT_CARD" | "ACH" | "APPLE_PAY">("CREDIT_CARD");
  const [binding, setBinding] = useState(false);
  const [signingUrl, setSigningUrl] = useState<string | undefined>();
  
  // Broker fee editing
  const [editingBrokerFee, setEditingBrokerFee] = useState(false);
  const [brokerFeeInput, setBrokerFeeInput] = useState("");
  const [savingBrokerFee, setSavingBrokerFee] = useState(false);

  // Prepare submission data for StatusTimeline - MUST be before any early returns
  const timelineSubmissionData = useMemo(() => {
    if (!submission || !quote) return null;
    
    return {
      quoteStatus: quote.status,
      signedDocuments: documents,
      esignCompleted: submission.esignCompleted,
      esignCompletedAt: submission.esignCompletedAt,
      paymentStatus: submission.paymentStatus,
      paymentDate: submission.paymentDate,
      paymentMethod: submission.paymentMethod,
      bindRequested: submission.bindRequested,
      bindRequestedAt: submission.bindRequestedAt,
      bindApproved: submission.bindApproved,
      bindApprovedAt: submission.bindApprovedAt,
      createdAt: submission.createdAt,
    };
  }, [submission, quote, documents]);

  // Fetch all data
  useEffect(() => {
    if (quoteId) {
      fetchData();
      fetchActivityLogs();
    }
  }, [quoteId]);

  const fetchActivityLogs = async () => {
    if (!quoteId) return;
    setLoadingActivity(true);
    try {
      const response = await fetch(`/api/agency/quotes/${quoteId}/activity`);
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

  // Initialize broker fee input when quote loads
  useEffect(() => {
    if (quote) {
      setBrokerFeeInput(quote.brokerFeeAmountUSD?.toFixed(2) || "0.00");
    }
  }, [quote]);

  // Handle broker fee update
  const handleUpdateBrokerFee = async () => {
    if (!quote) return;
    
    const newFee = parseFloat(brokerFeeInput);
    if (isNaN(newFee) || newFee < 0) {
      toast.error("Invalid broker fee amount");
      return;
    }

    try {
      setSavingBrokerFee(true);
      const res = await fetch(`/api/agency/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brokerFeeAmountUSD: newFee }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update broker fee");
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Broker fee updated successfully!");
        setEditingBrokerFee(false);
        // Refresh quote data
        await fetchData();
      } else {
        throw new Error(data.error || "Failed to update broker fee");
      }
    } catch (err: any) {
      toast.error("Error updating broker fee", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setSavingBrokerFee(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch quote
      const quoteRes = await fetch(`/api/agency/quotes/${quoteId}`, { cache: "no-store" });
      if (!quoteRes.ok) throw new Error("Failed to fetch quote");
      const quoteData = await quoteRes.json();
      setQuote(quoteData.quote);

      const submissionId = quoteData.quote.submissionId;

      // Fetch submission
      const submissionRes = await fetch(`/api/agency/submissions/${submissionId}`, {
        cache: "no-store",
      });
      if (!submissionRes.ok) throw new Error("Failed to fetch submission");
      const submissionData = await submissionRes.json();
      setSubmission(submissionData.submission);

      // Fetch documents
      const docsData = await getDocuments(submissionId);
      if (docsData.documents) {
        setDocuments(docsData.documents);
      }

      // Fetch e-sign status
      const esignData = await getESignStatus(submissionId);
      if (esignData.documents) {
        setEsignStatus(esignData);
      }

      // Fetch payment status
      const paymentData = await getPaymentStatus(submissionId);
      if (paymentData.paymentStatus) {
        setPaymentStatus(paymentData);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      toast.error("Failed to load quote details", {
        description: err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate required documents count
  const requiredDocumentsCount = useMemo(() => {
    let count = 2; // Proposal + Carrier Forms (always required)
    if (quote?.financePlan) {
      count += 1; // Finance Agreement (if finance plan exists)
    }
    return count;
  }, [quote]);

  // Button visibility and enablement rules - EXACT BUSINESS LOGIC
  // Documents disabled when: submission.esignCompleted === true
  const canGenerateDocuments = quote?.status === "APPROVED" && submission?.esignCompleted !== true;
  const hasAllDocuments = documents.length >= requiredDocumentsCount;
  // E-sign disabled when: documents not generated OR submission.esignCompleted === true
  const canEsign = hasAllDocuments && submission?.esignCompleted !== true;
  // Payment disabled when: !submission.esignCompleted
  const canPay = submission?.esignCompleted === true && submission?.paymentStatus !== "PAID";
  // Bind Request disabled when: paymentStatus !== "PAID" OR esignCompleted === false
  const canBind = submission?.esignCompleted === true && submission?.paymentStatus === "PAID" && !submission?.bindRequested;

  // Generate document handlers with proper error handling
  const handleGenerateProposal = async () => {
    if (!quote || !submission) return;
    try {
      setGeneratingProposal(true);
      
      // Step 1: Generate and store document (if not already generated)
      const proposalDoc = documents.find(d => d.documentType === "PROPOSAL");
      if (!proposalDoc) {
        // Generate documents (this will store Proposal PDF)
        const generateRes = await fetch(`/api/agency/quotes/${quoteId}/generate-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!generateRes.ok) {
          const errorData = await generateRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate documents");
        }

        // Refresh data to get updated documents
        await fetchData();
      }

      // Step 2: Download the PDF
      const res = await fetch(`/api/agency/quotes/${quoteId}/proposal-pdf`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download proposal");
      }

      // Get PDF blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proposal-${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Proposal PDF generated and downloaded!");
    } catch (err: any) {
      toast.error("Error generating proposal.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setGeneratingProposal(false);
    }
  };

  const handleGenerateFinanceAgreement = async () => {
    if (!submission) return;
    try {
      setGeneratingFinanceAgreement(true);
      const res = await fetch("/api/documents/generate-finance-agreement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission._id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate finance agreement");
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Finance Agreement generated!");
        await fetchData();
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to generate finance agreement");
      }
    } catch (err: any) {
      toast.error("Error generating finance agreement.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setGeneratingFinanceAgreement(false);
    }
  };

  const handleGenerateCarrierForms = async () => {
    if (!quote || !submission) return;
    try {
      setGeneratingCarrierForm(true);
      
      // Step 1: Generate and store document (if not already generated)
      const carrierDoc = documents.find(d => d.documentType === "CARRIER_FORM");
      if (!carrierDoc) {
        // Generate documents (this will store Carrier Forms PDF)
        const generateRes = await fetch(`/api/agency/quotes/${quoteId}/generate-documents`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!generateRes.ok) {
          const errorData = await generateRes.json().catch(() => ({}));
          throw new Error(errorData.error || "Failed to generate documents");
        }

        // Refresh data to get updated documents
        await fetchData();
      }

      // Step 2: Download the PDF
      const res = await fetch(`/api/agency/quotes/${quoteId}/carrier-forms-pdf`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download carrier forms");
      }

      // Get PDF blob and download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrier-forms-${quoteId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Carrier Forms PDF generated and downloaded!");
    } catch (err: any) {
      toast.error("Error generating carrier forms.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setGeneratingCarrierForm(false);
    }
  };

  // E-Sign handlers with proper error handling
  const handleSendForEsign = async () => {
    if (!submission || !quote) return;
    try {
      setSendingEsign(true);
      
      // Step 1: Generate documents if needed
      console.log("📄 Generating documents if needed...");
      const generateRes = await fetch(`/api/agency/quotes/${quoteId}/generate-documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate documents");
      }

      const generateData = await generateRes.json();
      if (generateData.documentsGenerated > 0) {
        toast.success(`${generateData.documentsGenerated} document(s) generated`);
        // Refresh data to get updated documents
        await fetchData();
      }

      // Step 2: Send documents for e-signature
      console.log("📝 Sending documents for e-signature...");
      const res = await fetch("/api/esign/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission._id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to send for e-signature");
      }

      const data = await res.json();
      if (data.success) {
        setSigningUrl(data.signingUrl);
        toast.success("Documents sent for e-signature!");
        if (data.signingUrl) {
          // Redirect to signing page
          window.open(data.signingUrl, '_blank');
        }
        await fetchData();
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to send for e-signature");
      }
    } catch (err: any) {
      toast.error("Unable to send for signature", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setSendingEsign(false);
    }
  };

  // Complete e-signature (mock mode - for testing)
  const handleCompleteEsign = async () => {
    if (!submission) return;
    try {
      setCompletingEsign(true);
      
      const res = await fetch("/api/esign/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission._id,
          status: "SIGNED",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to complete e-signature");
      }

      const data = await res.json();
      if (data.success) {
        toast.success("E-Signature completed successfully!");
        await fetchData();
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to complete e-signature");
      }
    } catch (err: any) {
      toast.error("Error completing e-signature", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setCompletingEsign(false);
    }
  };

  // Payment handler with proper error handling
  const handlePayNow = async () => {
    if (!submission || !quote) return;
    try {
      setPaying(true);
      const res = await fetch("/api/payment/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId: submission._id,
          amount: quote.finalAmountUSD,
          method: "CARD",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Payment failed");
      }

      const data = await res.json();
      if (data.success || data.paymentStatus === "PAID") {
        toast.success("Payment successful!");
        await fetchData();
        router.refresh();
      } else {
        throw new Error(data.error || "Payment failed");
      }
    } catch (err: any) {
      toast.error("Error processing payment.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setPaying(false);
    }
  };

  // Bind request handler with proper error handling
  const handleRequestBind = async () => {
    if (!submission) return;
    try {
      setBinding(true);
      const res = await fetch("/api/bind/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId: submission._id }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Bind request failed");
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Bind request sent!");
        await fetchData();
        router.refresh();
      } else {
        throw new Error(data.error || "Bind request failed");
      }
    } catch (err: any) {
      toast.error("Error requesting bind.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setBinding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote || !submission) {
    return (
      <div className="min-h-screen bg-[#f5f1eb] flex">
        <aside className="w-[70px] bg-[#2d2a26] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-[#e5ddd5]">
          <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-[#8a6f4d] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
              <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl border border-[#9A8B7A]/20 group-hover:border-[#9A8B7A]/40 transition-all overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-[#9A8B7A]/10"></div>
                </div>
                <SterlingLogo className="relative w-9 h-9" />
              </div>
            </div>
            <div className="text-center px-2">
              <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Sterling</p>
            </div>
          </Link>
        </aside>
        <main className="flex-1 ml-[70px] p-8">
          <div className="bg-white rounded-2xl border border-[#e5ddd5] p-12 text-center max-w-md mx-auto shadow-sm">
            <h1 className="text-2xl font-bold text-[#2d2a26] mb-4">Error</h1>
            <p className="text-[#6b5e52] mb-6">Quote not found</p>
            <Link href="/agency/quotes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9A8B7A] text-white rounded-lg text-sm font-medium hover:bg-[#8a6f4d] transition-colors">
              ← Back to Quotes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  // Check if quote is approved for workflow UI
  const showWorkflowUI = quote.status === "APPROVED" || quote.status === "BIND_REQUESTED" || quote.status === "BOUND";

  return (
    <div className="min-h-screen bg-[#f5f1eb] flex">
      {/* Sidebar - Matching Dashboard */}
      <aside className="w-[70px] bg-[#2d2a26] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-[#e5ddd5]">
        <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-[#9A8B7A] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
            <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow-2xl border border-[#9A8B7A]/20 group-hover:border-[#9A8B7A]/40 transition-all overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[#9A8B7A]/20"></div>
              </div>
              <SterlingLogo className="relative w-9 h-9" />
            </div>
          </div>
          <div className="text-center px-2">
            <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Sterling</p>
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
        <div className="bg-white border-b border-[#e5ddd5] px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agency/quotes" className="p-2 hover:bg-[#fcfaf7] rounded-lg transition-colors">
                <svg className="w-5 h-5 text-[#6b5e52]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-[#2d2a26]">Quote Details</h1>
                <p className="text-sm text-[#6b5e52]">
                  Quote ID: {quoteId.slice(-8)} • Client: {submission?.clientContact?.name || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                quote.status === "APPROVED" ? "bg-green-50 text-green-700 border border-green-200" :
                quote.status === "BIND_REQUESTED" ? "bg-amber-50 text-amber-700 border border-amber-200" :
                quote.status === "BOUND" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                "bg-[#fcfaf7] text-[#8a6f4d] border border-[#e5ddd5]"
              }`}>
                {quote.status.replace("_", " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Timeline */}
          {timelineSubmissionData && (
            <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
              <StatusTimeline submission={timelineSubmissionData} />
            </div>
          )}

          {/* Workflow Actions */}
          {showWorkflowUI && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* E-Sign Section */}
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#2d2a26] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#fcfaf7] text-[#9A8B7A] flex items-center justify-center text-sm">1</span>
                  E‑Signature
                </h3>
                <p className="text-sm text-[#6b5e52] mb-6">Generated and sign documents for this quote.</p>
                <div className="space-y-3">
                  <button
                    onClick={handleGenerateProposal}
                    disabled={!canGenerateDocuments || generatingProposal}
                    className="w-full px-4 py-2.5 bg-[#fcfaf7] text-[#9A8B7A] border border-[#e5ddd5] rounded-xl text-sm font-semibold hover:bg-[#f5f1eb] transition-colors disabled:opacity-50"
                  >
                    {generatingProposal ? "Generating..." : "Generate Proposal"}
                  </button>
                  <button
                    onClick={handleSendForEsign}
                    disabled={!canEsign || sendingEsign}
                    className="w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-xl text-sm font-semibold hover:bg-[#8a6f4d] transition-colors disabled:opacity-50"
                  >
                    {sendingEsign ? "Sending..." : "Send for E‑Sign"}
                  </button>
                </div>
              </div>

              {/* Payment Section */}
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#2d2a26] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#fcfaf7] text-[#9A8B7A] flex items-center justify-center text-sm">2</span>
                  Payment
                </h3>
                <p className="text-sm text-[#6b5e52] mb-6">Process payment for this quote once signed.</p>
                <button
                  onClick={handlePayNow}
                  disabled={!canPay || paying}
                  className="w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-xl text-sm font-semibold hover:bg-[#8a6f4d] transition-colors disabled:opacity-50"
                >
                  {paying ? "Processing..." : "Process Payment"}
                </button>
              </div>

              {/* Bind Request Section */}
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
                <h3 className="text-lg font-bold text-[#2d2a26] mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#fcfaf7] text-[#9A8B7A] flex items-center justify-center text-sm">3</span>
                  Bind Policy
                </h3>
                <p className="text-sm text-[#6b5e52] mb-6">Submit a request to bind this policy.</p>
                <button
                  onClick={handleRequestBind}
                  disabled={!canBind || binding}
                  className="w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-xl text-sm font-semibold hover:bg-[#8a6f4d] transition-colors disabled:opacity-50"
                >
                  {binding ? "Requesting..." : "Request Bind"}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quote details column */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#2d2a26] mb-4">Quote Breakdown</h2>
                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-[#f5f1eb]">
                    <span className="text-[#6b5e52]">Carrier Premium</span>
                    <span className="font-semibold text-[#2d2a26]">${quote.carrierQuoteUSD.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[#f5f1eb]">
                    <span className="text-[#6b5e52]">Broker Fee</span>
                    <div className="flex items-center gap-2">
                      {editingBrokerFee ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={brokerFeeInput}
                            onChange={(e) => setBrokerFeeInput(e.target.value)}
                            className="w-24 px-2 py-1 border border-[#e5ddd5] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#9A8B7A]"
                          />
                          <button
                            onClick={handleUpdateBrokerFee}
                            disabled={savingBrokerFee}
                            className="bg-[#9A8B7A] text-white px-2 py-1 rounded text-xs"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span className="font-semibold text-[#2d2a26]">${quote.brokerFeeAmountUSD.toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between py-3">
                    <span className="text-lg font-bold text-[#2d2a26]">Total Amount</span>
                    <span className="text-lg font-bold text-[#9A8B7A]">${quote.finalAmountUSD.toFixed(2)}</span>
                  </div>
                </div>
                {!editingBrokerFee && quote.status === "POSTED" && (
                  <button
                    onClick={() => setEditingBrokerFee(true)}
                    className="mt-4 text-sm text-[#9A8B7A] font-semibold hover:underline"
                  >
                    Edit Broker Fee
                  </button>
                )}
              </div>
            </div>

            {/* Client Info column */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-[#e5ddd5] p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#2d2a26] mb-4">Client Contact</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[#6b5e52] uppercase tracking-wider mb-1">Name</p>
                    <p className="font-semibold text-[#2d2a26]">{submission.clientContact.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b5e52] uppercase tracking-wider mb-1">Email</p>
                    <p className="text-[#2d2a26]">{submission.clientContact.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-[#6b5e52] uppercase tracking-wider mb-1">Phone</p>
                    <p className="text-[#2d2a26]">{submission.clientContact.phone}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
