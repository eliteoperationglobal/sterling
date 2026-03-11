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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading quote details...</p>
        </div>
      </div>
    );
  }

  if (!quote || !submission) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <aside className="w-[70px] bg-[#3A3C3F] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-gray-700">
          <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
            <div className="relative mb-3">
              <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A1F2E] via-[#2A3240] to-[#1A1F2E] rounded-xl flex items-center justify-center shadow-2xl border border-[#00BCD4]/20 group-hover:border-[#00BCD4]/40 transition-all overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4] to-transparent"></div>
                </div>
                <svg className="relative w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#logoGradient1)" className="drop-shadow-lg" />
                  <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#logoGradient2)" className="drop-shadow-md" />
                  <path d="M50 30 L50 65" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />
                  <path d="M40 47 L60 47" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                  <defs>
                    <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.9" />
                      <stop offset="100%" stopColor="#0097A7" stopOpacity="0.95" />
                    </linearGradient>
                    <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00BCD4] rounded-full opacity-60"></div>
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#00BCD4] rounded-full opacity-60"></div>
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
            <p className="text-red-600 mb-6">Quote not found</p>
            <Link href="/agency/quotes" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-medium hover:bg-[#00ACC1] transition-colors">
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar - Matching Dashboard */}
      <aside className="w-[70px] bg-[#3A3C3F] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-gray-700">
        <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4] to-[#0097A7] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A1F2E] via-[#2A3240] to-[#1A1F2E] rounded-xl flex items-center justify-center shadow-2xl border border-[#00BCD4]/20 group-hover:border-[#00BCD4]/40 transition-all overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#00BCD4] to-transparent"></div>
              </div>
              <svg className="relative w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#logoGradient1)" className="drop-shadow-lg" />
                <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#logoGradient2)" className="drop-shadow-md" />
                <path d="M50 30 L50 65" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />
                <path d="M40 47 L60 47" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <defs>
                  <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#00BCD4" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0097A7" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#00BCD4] rounded-full opacity-60"></div>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#00BCD4] rounded-full opacity-60"></div>
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
              <Link href="/agency/quotes" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quote Details</h1>
                <p className="text-sm text-gray-600">
                  Quote ID: {quoteId.slice(-8)} • Client: {submission?.clientContact?.name || "N/A"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                quote.status === "APPROVED" ? "bg-green-100 text-green-800 border border-green-200" :
                quote.status === "BIND_REQUESTED" ? "bg-orange-100 text-orange-800 border border-orange-200" :
                quote.status === "BOUND" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                "bg-gray-100 text-gray-800 border border-gray-200"
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
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <StatusTimeline submission={timelineSubmissionData} />
            </div>
          )}

          {/* Status Badges */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Current Status</h2>
            <div className="flex flex-wrap gap-3">
              <StatusBadge status={submission.status} type="submission" />
              <StatusBadge status={quote.status} type="quote" />
              {submission.esignCompleted === true ? (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  ✓ E‑Signature Complete
                </span>
              ) : (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⏳ Awaiting Signature
                </span>
              )}
              {submission.signedDocuments && submission.signedDocuments.length > 0 && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                  {submission.signedDocuments.filter((d: any) => d.signatureStatus === "SIGNED").length} / {submission.signedDocuments.length} Documents Signed
                </span>
              )}
              {paymentStatus?.paymentStatus === "PAID" && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  ✓ PAYMENT RECEIVED
                </span>
              )}
              {quote.status === "BIND_REQUESTED" && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⏳ Bind Requested
                </span>
              )}
              {quote.status === "BOUND" && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  ✓ Policy Bound
                </span>
              )}
              {submission.bindRequested && !submission.bindApproved && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200">
                  ⏳ Bind Request Submitted (Pending Admin Approval)
                </span>
              )}
              {submission.bindApproved && (
                <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                  ✓ Policy Bound (✓)
                </span>
              )}
            </div>
          </div>

          {/* Quote Breakdown & Broker Fee */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900">Quote Breakdown</h2>
              {quote.status === "POSTED" && (
                <button
                  onClick={() => setEditingBrokerFee(!editingBrokerFee)}
                  className="text-sm text-[#00BCD4] hover:text-[#00ACC1] font-semibold"
                >
                  {editingBrokerFee ? "Cancel" : "Edit Broker Fee"}
                </button>
              )}
            </div>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Carrier Quote:</span>
              <span className="font-semibold">${quote.carrierQuoteUSD.toFixed(2)}</span>
            </div>
            
            {quote.premiumTaxAmountUSD && quote.premiumTaxAmountUSD > 0 && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">
                  Premium Tax{quote.premiumTaxPercent ? ` (${quote.premiumTaxPercent}%)` : ''}:
                </span>
                <span className="font-semibold">${quote.premiumTaxAmountUSD.toFixed(2)}</span>
              </div>
            )}
            
            {quote.policyFeeUSD && quote.policyFeeUSD > 0 && (
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-gray-600">Policy Fee:</span>
                <span className="font-semibold">${quote.policyFeeUSD.toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-gray-600">Broker Fee:</span>
              {editingBrokerFee && quote.status === "POSTED" ? (
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={brokerFeeInput}
                    onChange={(e) => setBrokerFeeInput(e.target.value)}
                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                    disabled={savingBrokerFee}
                  />
                  <button
                    onClick={handleUpdateBrokerFee}
                    disabled={savingBrokerFee}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {savingBrokerFee ? "Saving..." : "Save"}
                  </button>
                </div>
              ) : (
                <span className="font-semibold">${quote.brokerFeeAmountUSD?.toFixed(2) || "0.00"}</span>
              )}
            </div>
            
            <div className="flex justify-between items-center py-3 border-t-2 border-gray-300 mt-2">
              <span className="text-lg font-bold text-gray-900">Total Amount:</span>
              <span className="text-lg font-bold text-[#00BCD4]">${quote.finalAmountUSD.toFixed(2)}</span>
            </div>
          </div>
          </div>

          {/* Admin Notes Section */}
          {quote.adminNotes && (
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-l-4 border-[#00BCD4] rounded-lg p-5 mt-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-[#00BCD4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{quote.adminNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Activity Log</h2>
              {loadingActivity && (
                <div className="w-4 h-4 border-2 border-gray-300 border-t-cyan-500 rounded-full animate-spin"></div>
              )}
            </div>
            {activityLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No activity recorded yet</p>
            ) : (
              <div className="space-y-3">
                {activityLogs.map((log) => (
                  <div key={log._id} className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-[#00BCD4] rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{log.description}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {log.performedBy.userName} ({log.performedBy.userRole}) • {new Date(log.createdAt).toLocaleString()}
                      </p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key} className="mr-3">
                              <span className="font-medium">{key}:</span> {String(value)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Document Downloads */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Document Downloads</h2>
            <div className="space-y-2">
              {quote.binderPdfUrl && (
              <a
                href={quote.binderPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Download Binder PDF
              </a>
            )}
            {quote.status === "POSTED" || quote.status === "APPROVED" ? (
              <>
                <button
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mr-2"
                >
                  <span>📋</span>
                  <span>{generatingProposal ? "Generating..." : "Download Proposal PDF"}</span>
                </button>
                <button
                  onClick={handleGenerateCarrierForms}
                  disabled={generatingCarrierForm}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>📝</span>
                  <span>{generatingCarrierForm ? "Generating..." : "Download Carrier Forms PDF"}</span>
                </button>
              </>
            ) : null}
          </div>
        </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Actions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
              <h2 className="text-lg font-bold text-gray-900">Actions</h2>

            {/* DOCUMENT GENERATION */}
            {showWorkflowUI && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Document Generation</h3>
                {!canGenerateDocuments && (
                  <p className="text-sm text-gray-500 mb-2">
                    {submission.esignCompleted === true
                      ? "Documents already sent for signature"
                      : "Quote must be approved to generate documents"}
                  </p>
                )}
                <button
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal || !canGenerateDocuments || documents.some(d => d.documentType === "PROPOSAL")}
                  className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingProposal ? "Generating..." : "Generate Proposal PDF"}
                </button>
                {quote?.financePlan && (
                  <button
                    onClick={handleGenerateFinanceAgreement}
                    disabled={generatingFinanceAgreement || !canGenerateDocuments || documents.some(d => d.documentType === "FINANCE_AGREEMENT")}
                    className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    {generatingFinanceAgreement ? "Generating..." : "Generate Finance Agreement PDF"}
                  </button>
                )}
                <button
                  onClick={handleGenerateCarrierForms}
                  disabled={generatingCarrierForm || !canGenerateDocuments || documents.some(d => d.documentType === "CARRIER_FORM")}
                  className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {generatingCarrierForm ? "Generating..." : "Generate Carrier Forms PDF"}
                </button>
              </div>
            )}

            {/* E-SIGNATURE */}
            {showWorkflowUI && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">E‑Signature</h3>
                {!canEsign && (
                  <p className="text-sm text-gray-500 mb-2">
                    {!hasAllDocuments
                      ? `Generate all required documents (${documents.length}/${requiredDocumentsCount})`
                      : submission.esignCompleted === true
                      ? "E-Signature already completed"
                      : "Documents not ready"}
                  </p>
                )}
                <button
                  disabled={!canEsign || sendingEsign}
                  onClick={handleSendForEsign}
                  className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  {sendingEsign ? "Sending..." : "Send for Signature"}
                </button>
                {submission.clientContact?.email && (
                  <p className="text-xs text-gray-500 mt-1">
                    📧 Documents will be sent to: <span className="font-medium">{submission.clientContact.email}</span> ({submission.clientContact.name || "Insured"})
                  </p>
                )}

                {/* Mock Mode: Complete E-Signature button (only show if documents are SENT but not SIGNED) */}
                {!submission.esignCompleted && documents.some(d => d.signatureStatus === "SENT") && (
                  <button
                    onClick={handleCompleteEsign}
                    disabled={completingEsign}
                    className="mt-2 w-full md:w-auto rounded-md px-4 py-2 font-medium shadow-sm bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    {completingEsign ? "Completing..." : "✓ Complete E-Signature (Mock)"}
                  </button>
                )}
                
                {submission.esignCompleted === true && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ E-Signature completed on {submission.esignCompletedAt ? new Date(submission.esignCompletedAt).toLocaleString() : "N/A"}
                  </p>
                )}
              </div>
            )}

            {/* PAYMENT */}
            {showWorkflowUI && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Payment</h3>
                {submission.esignCompleted === true ? (
                  submission.paymentStatus === "PAID" ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-semibold">✓ Payment Completed</p>
                      {paymentStatus?.paymentDate && (
                        <p className="text-sm text-green-700 mt-1">
                          Paid on {new Date(paymentStatus.paymentDate).toLocaleString()}
                        </p>
                      )}
                      {paymentStatus?.paymentAmount && (
                        <p className="text-sm text-green-700 mt-1">
                          Amount: ${paymentStatus.paymentAmount.toFixed(2)}
                        </p>
                      )}
                      <a
                        href={`/api/payment/receipt/${submission._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm font-medium shadow"
                      >
                        Download Receipt
                      </a>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-gray-600 mb-2">
                        Total Amount: <span className="font-semibold">${quote.finalAmountUSD.toFixed(2)}</span>
                      </p>
                      <button
                        disabled={!canPay || paying}
                        onClick={handlePayNow}
                        className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        {paying ? "Processing..." : "Make Payment"}
                      </button>
                    </>
                  )
                ) : (
                  <p className="text-sm text-red-500">
                    ⚠️ Complete e-signature before making payment
                  </p>
                )}
              </div>
            )}

            {/* BIND REQUEST */}
            {showWorkflowUI && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Bind Request</h3>
                {submission.bindApproved ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-green-600 font-semibold">✓ Policy Bound</p>
                    {submission.bindApprovedAt && (
                      <p className="text-sm text-green-700 mt-1">
                        Approved on {new Date(submission.bindApprovedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : submission.bindRequested ? (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-semibold">⏳ Bind Request Sent</p>
                    {submission.bindRequestedAt && (
                      <p className="text-sm text-yellow-700 mt-1">
                        Requested on {new Date(submission.bindRequestedAt).toLocaleString()}
                      </p>
                    )}
                    <p className="text-sm text-yellow-700 mt-2">
                      Pending admin approval
                    </p>
                  </div>
                ) : (
                  <>
                    {!canBind && (
                      <p className="text-sm text-gray-500 mb-2">
                        {!submission.esignCompleted
                          ? "Complete e-signature first"
                          : submission.paymentStatus !== "PAID"
                          ? "Complete payment first"
                          : "All requirements must be met"}
                      </p>
                    )}
                    <button
                      disabled={!canBind || binding}
                      onClick={handleRequestBind}
                      className="px-4 py-2.5 bg-[#00BCD4] text-white rounded-lg text-sm font-semibold hover:bg-[#00ACC1] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                      {binding ? "Submitting..." : "Request Bind"}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* FINAL POLICY DOCUMENTS */}
            {showWorkflowUI && submission.bindApproved && submission.finalPolicyDocuments && (
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-gray-900">Final Policy Documents</h3>
                {(submission.finalPolicyDocuments.finalBinderPdfUrl || 
                  submission.finalPolicyDocuments.finalPolicyPdfUrl || 
                  submission.finalPolicyDocuments.certificateOfInsuranceUrl) ? (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                    <p className="text-sm text-blue-800 font-semibold">
                      📄 Final documents are available for download
                    </p>
                    <div className="space-y-2">
                      {submission.finalPolicyDocuments.finalBinderPdfUrl && (
                        <a
                          href={submission.finalPolicyDocuments.finalBinderPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="block px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
                        >
                          📄 Download Final Binder PDF
                        </a>
                      )}
                      {submission.finalPolicyDocuments.finalPolicyPdfUrl && (
                        <a
                          href={submission.finalPolicyDocuments.finalPolicyPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="block px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
                        >
                          📄 Download Final Policy PDF
                        </a>
                      )}
                      {submission.finalPolicyDocuments.certificateOfInsuranceUrl && (
                        <a
                          href={submission.finalPolicyDocuments.certificateOfInsuranceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="block px-4 py-2 bg-white border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium text-blue-700"
                        >
                          📄 Download Certificate of Insurance
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">
                    Final documents will be available once uploaded by admin
                  </p>
                )}
              </div>
            )}

            {!showWorkflowUI && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-yellow-800 font-medium">
                  Quote must be approved before accessing workflow features.
                </p>
              </div>
            )}
          </div>

            {/* Right Column - Document Status */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Document Status</h2>
            
            {/* Binder PDF */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Binder PDF</span>
                  <p className="text-xs text-gray-500 mt-1">Available for download</p>
                </div>
                {quote.binderPdfUrl ? (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    ✓ Available
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                    Not Available
                  </span>
                )}
              </div>
            </div>

            {/* Proposal PDF Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Proposal PDF</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const proposalDoc = documents.find(d => d.documentType === "PROPOSAL");
                      if (!proposalDoc) return "Not generated";
                      if (proposalDoc.signatureStatus === "SIGNED") return "Signed";
                      if (proposalDoc.signatureStatus === "SENT") return "Sent for signature";
                      return "Generated";
                    })()}
                  </p>
                </div>
                {(() => {
                  const proposalDoc = documents.find(d => d.documentType === "PROPOSAL");
                  if (!proposalDoc) {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        Not Generated
                      </span>
                    );
                  }
                  if (proposalDoc.signatureStatus === "SIGNED") {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✓ Signed
                      </span>
                    );
                  }
                  if (proposalDoc.signatureStatus === "SENT") {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        📧 Sent
                      </span>
                    );
                  }
                  return (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Generated
                    </span>
                  );
                })()}
              </div>
              {documents.find(d => d.documentType === "PROPOSAL")?.documentUrl && (
                <a
                  href={documents.find(d => d.documentType === "PROPOSAL")?.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                >
                  Download →
                </a>
              )}
            </div>

            {/* Carrier Forms PDF Status */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900">Carrier Forms PDF</span>
                  <p className="text-xs text-gray-500 mt-1">
                    {(() => {
                      const carrierDoc = documents.find(d => d.documentType === "CARRIER_FORM");
                      if (!carrierDoc) return "Not generated";
                      if (carrierDoc.signatureStatus === "SIGNED") return "Signed";
                      if (carrierDoc.signatureStatus === "SENT") return "Sent for signature";
                      return "Generated";
                    })()}
                  </p>
                </div>
                {(() => {
                  const carrierDoc = documents.find(d => d.documentType === "CARRIER_FORM");
                  if (!carrierDoc) {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-600">
                        Not Generated
                      </span>
                    );
                  }
                  if (carrierDoc.signatureStatus === "SIGNED") {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                        ✓ Signed
                      </span>
                    );
                  }
                  if (carrierDoc.signatureStatus === "SENT") {
                    return (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                        📧 Sent
                      </span>
                    );
                  }
                  return (
                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                      Generated
                    </span>
                  );
                })()}
              </div>
              {documents.find(d => d.documentType === "CARRIER_FORM")?.documentUrl && (
                <a
                  href={documents.find(d => d.documentType === "CARRIER_FORM")?.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                >
                  Download →
                </a>
              )}
            </div>

            {/* Summary */}
            {documents.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-xs text-gray-600">
                  {documents.filter(d => d.signatureStatus === "SIGNED").length} of {documents.length} documents signed
                </p>
              </div>
            )}
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}
