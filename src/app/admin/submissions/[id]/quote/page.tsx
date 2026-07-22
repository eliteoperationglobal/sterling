"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { getStateCode } from "@/lib/utils/stateConverter";
import { useAutoSave } from "@/hooks/useAutoSave";
import SaveStatusIndicator from "@/components/forms/SaveStatusIndicator";
import { formatCurrency, formatCurrencyInput, parseCurrency } from "@/lib/utils/currencyFormatter";
import { Upload, X } from "lucide-react";

const RatingRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-0">
    <span className="text-gray-500 text-[14px]">{label}</span>
    <span className="font-medium text-gray-900 text-[14px] text-right">{value}</span>
  </div>
);
interface Carrier {
  _id: string;
  name: string;
  email: string;
  wholesaleFeePercent: number;
}

interface Submission {
  _id: string;
  clientContact: {
    name: string;
    email: string;
  };
  status: string;
  templateId?: {
    industry: string;
    subtype: string;
  } | null;
  programId?: string;
  programName?: string;
  payload?: any;
  policies?: any[];
}

export default function AdminQuotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string;
  const searchParams = useSearchParams();
  const isRenterQuote = searchParams.get("quoteType") === "renter";

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [selectedCarrierId, setSelectedCarrierId] = useState("");
  const [carrierQuoteUSD, setCarrierQuoteUSD] = useState("");
  const [carrierFeesUSD, setCarrierFeesUSD] = useState("");
  const [sterlingFeesUSD, setSterlingFeesUSD] = useState("");

  // Premium breakdown fields
  const [premiumTaxPercent, setPremiumTaxPercent] = useState("");
  const [premiumTaxAmountUSD, setPremiumTaxAmountUSD] = useState("");
  const [policyFeeUSD, setPolicyFeeUSD] = useState("");
  const [stampingFeePercent, setStampingFeePercent] = useState("");
  const [stampingFeeAmountUSD, setStampingFeeAmountUSD] = useState("");
  const [stampingFeePerFilingUSD, setStampingFeePerFilingUSD] = useState("");
  const [slaServiceChargeUSD, setSlaServiceChargeUSD] = useState("");

  // 🔥 Fire Marshal Tax
  const [fireMarshalTaxPercent, setFireMarshalTaxPercent] = useState("");
  const [fireMarshalTaxAmountUSD, setFireMarshalTaxAmountUSD] = useState("");
  const [fireMarshalFlatFeeUSD, setFireMarshalFlatFeeUSD] = useState("");

  // Policy details (will be auto-populated from application form)
  const [generalLiabilityLimit, setGeneralLiabilityLimit] = useState("");
  const [aggregateLimit, setAggregateLimit] = useState("");
  const [fireLegalLimit, setFireLegalLimit] = useState("");
  const [medicalExpenseLimit, setMedicalExpenseLimit] = useState("Not Applicable");
  const [deductible, setDeductible] = useState("");
  const [excessLimit, setExcessLimit] = useState(""); // New: Excess limits

  // Property details
  const [propertyBuildingLimit, setPropertyBuildingLimit] = useState("");
  const [propertyBppLimit, setPropertyBppLimit] = useState("");
  const [propertyBusinessIncomeLimit, setPropertyBusinessIncomeLimit] = useState("");
  const [propertyDeductible, setPropertyDeductible] = useState("");

  // Endorsements (will be auto-populated from application form)
  const [selectedEndorsements, setSelectedEndorsements] = useState<string[]>([]);

  // Broker fee from application form
  const [brokerFeeFromForm, setBrokerFeeFromForm] = useState<number>(0);

  // Dates and other
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [policyDuration, setPolicyDuration] = useState<"6months" | "1year" | "">(""); // New: Duration selection
  const [policyNumber, setPolicyNumber] = useState("");
  const [carrierReference, setCarrierReference] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [stats, setStats] = useState({ quoteRequests: 0, binRequests: 0, pendingQuotes: 0, boundPolicies: 0, bindRequests: 0 });

  // Tax calculator
  const [calculatingTax, setCalculatingTax] = useState(false);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // --- Multi-Policy State ---
  const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");
  const [availablePolicies, setAvailablePolicies] = useState<string[]>(["GENERAL_LIABILITY"]);
  const [policyStates, setPolicyStates] = useState<Record<string, any>>({});
  const [policiesStatus, setPoliciesStatus] = useState<Record<string, "complete" | "incomplete">>({ "GENERAL_LIABILITY": "incomplete" });
  // Admin document upload
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [customDocuments, setCustomDocuments] = useState<string[]>([""]);
  const [hasExistingQuotes, setHasExistingQuotes] = useState(false);

  // Available endorsements
  const availableEndorsements = [
    "Blanket Additional Insured",
    "Blanket Waiver of Subrogation",
    "Blanket Primary Wording",
    "Blanket Per Project Aggregate",
    "Blanket Completed Operations Aggregate",
    "Acts of Terrorism",
    "Notice of Cancellation to Third Parties",
  ];

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

  useEffect(() => {
    if (status === "authenticated" && submissionId) {
      fetchData();
    }
  }, [status, submissionId]);

  // Auto-populate limits, endorsements, and broker fee from application form
  useEffect(() => {
    if (submission && (submission as any).payload) {
      const formData = (submission as any).payload;

      // Detection for multi-policy
      const avails = ["GENERAL_LIABILITY"];
      if (formData.addExcessLiability || formData.addGeneralLiability) {
        avails.push("EXCESS_LIABILITY");
      }
      setAvailablePolicies(avails);

      // Initialize status from submission if available
      if (submission.policies && submission.policies.length > 0) {
        const statuses: Record<string, "complete" | "incomplete"> = {};
        submission.policies.forEach((p: any) => {
          statuses[p.type] = p.status;
        });
        setPoliciesStatus(statuses);
      } else {
        const statuses: Record<string, "complete" | "incomplete"> = { "GENERAL_LIABILITY": "incomplete" };
        if (formData.addExcessLiability) statuses["EXCESS_LIABILITY"] = "incomplete";
        setPoliciesStatus(statuses);
      }
      // Get broker fee from form
      const brokerFee = parseFloat(formData.brokerFee) || 0;
      setBrokerFeeFromForm(brokerFee);

      if (!hasExistingQuotes) {
        // Get limits from form
        if (formData.coverageLimits) {
          const limitsStr = formData.coverageLimits.replace(/\s/g, '');
          setGeneralLiabilityLimit(limitsStr);
          setAggregateLimit(limitsStr);
        }

        if (formData.excessLiabilityLimit) {
          setExcessLimit(formData.excessLiabilityLimit);
        }
        // Fire Legal Limit and Medical Expense Limit may have dollar signs
        if (formData.fireLegalLimit) {
          const cleanValue = formData.fireLegalLimit.replace(/[$,]/g, '');
          setFireLegalLimit(cleanValue);
        }
        if (formData.medicalExpenseLimit) {
          const cleanValue = formData.medicalExpenseLimit.replace(/[$,]/g, '');
          setMedicalExpenseLimit(cleanValue);
        }
        if (formData.deductible) {
          const cleanValue = formData.deductible.replace(/[$,]/g, '');
          setDeductible(cleanValue);
        }

        // Get endorsements from form
        const formEndorsements: string[] = [];
        if (formData.blanketAdditionalInsured) formEndorsements.push("Blanket Additional Insured");
        if (formData.blanketWaiverOfSubrogation) formEndorsements.push("Blanket Waiver of Subrogation");
        if (formData.blanketPrimaryWording) formEndorsements.push("Blanket Primary Wording");
        if (formData.blanketPerProjectAggregate) formEndorsements.push("Blanket Per Project Aggregate");
        if (formData.blanketCompletedOperations || formData.blanketCompletedOpsAggregate) formEndorsements.push("Blanket Completed Operations Aggregate");
        if (formData.actsOfTerrorism) formEndorsements.push("Acts of Terrorism");
        if (formData.noticeOfCancellationThirdParties || formData.noticeOfCancellationToThirdParties) formEndorsements.push("Notice of Cancellation to Third Parties");

        if (formEndorsements.length > 0) {
          setSelectedEndorsements(formEndorsements);
        }
      }
    }
  }, [submission, hasExistingQuotes]);

  // Apply renter-quote specific defaults when opened from "Renter Quote" action
  useEffect(() => {
    if (!submission || !isRenterQuote) return;

    // If no special notes yet, tag this as a renter quote for clarity
    if (!specialNotes) {
      setSpecialNotes("Renter quote – adjust limits and terms as needed.");
    }

    // Provide a gentle default for general liability if not already set
    if (!generalLiabilityLimit) {
      setGeneralLiabilityLimit("1M/1M/1M");
    }
  }, [submission, isRenterQuote, specialNotes, generalLiabilityLimit]);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch submission (which also returns quotes via the admin API)
      const subRes = await fetch(`/api/admin/submissions/${submissionId}`);
      const subData = await subRes.json();

      if (!subRes.ok) {
        setError(subData.error || "Failed to load submission");
        setLoading(false);
        return;
      }

      if (subData.submission) {
        setSubmission(subData.submission);
      } else {
        setError("Submission not found");
        setLoading(false);
        return;
      }

      // ✅ Pre-populate form from existing quotes in DB
      if (subData.quotes && subData.quotes.length > 0) {
        setHasExistingQuotes(true);
        const quoteToState = (q: any) => ({
          selectedCarrierId: q.carrierId?._id || q.carrierId || "",
          carrierQuoteUSD: q.carrierQuoteUSD?.toString() || "",
          carrierFeesUSD: q.carrierFeesUSD?.toString() || "",
          sterlingFeesUSD: q.sterlingInsuranceServicesFeesUSD?.toString() || "",
          premiumTaxPercent: q.premiumTaxPercent?.toString() || "",
          premiumTaxAmountUSD: q.premiumTaxAmountUSD?.toString() || "",
          stampingFeePercent: q.stampingFeePercent?.toString() || "",
          stampingFeeAmountUSD: q.stampingFeeAmountUSD?.toString() || "",
          stampingFeePerFilingUSD: q.stampingFeePerFilingUSD?.toString() || "",
          slaServiceChargeUSD: q.slaServiceChargeUSD?.toString() || "",
          fireMarshalTaxPercent: q.fireMarshalTaxPercent?.toString() || "",
          fireMarshalTaxAmountUSD: q.fireMarshalTaxAmountUSD?.toString() || "",
          policyFeeUSD: q.policyFeeUSD?.toString() || "",
          generalLiabilityLimit: q.limits?.generalLiability?.replace(/\s/g, '') || "",
          aggregateLimit: q.limits?.aggregateLimit?.replace(/\s/g, '') || "",
          fireLegalLimit: q.limits?.fireLegalLimit || "",
          medicalExpenseLimit: q.limits?.medicalExpenseLimit || "Not Applicable",
          deductible: q.limits?.deductible || "",
          excessLimit: q.limits?.excessLimit || "",
          propertyBuildingLimit: q.limits?.propertyBuildingLimit || "",
          propertyBppLimit: q.limits?.propertyBppLimit || "",
          propertyBusinessIncomeLimit: q.limits?.propertyBusinessIncomeLimit || "",
          propertyDeductible: q.limits?.propertyDeductible || "",
          selectedEndorsements: q.endorsements || [],
          effectiveDate: q.effectiveDate ? new Date(q.effectiveDate).toISOString().split("T")[0] : "",
          expirationDate: q.expirationDate ? new Date(q.expirationDate).toISOString().split("T")[0] : "",
          policyDuration: "",
          policyNumber: q.policyNumber || "",
          carrierReference: q.carrierReference || "",
          specialNotes: q.specialNotes || "",
          customDocuments: q.customDocuments?.length > 0 ? q.customDocuments : [""],
        });

        // Build policyStates for all quotes in DB
        const loadedStates: Record<string, any> = {};
        for (const q of subData.quotes) {
          const pt = q.policyType || "GENERAL_LIABILITY";
          loadedStates[pt] = quoteToState(q);
        }
        setPolicyStates(loadedStates);

        // Pre-populate the active (GL) tab's live form fields
        const glQuote = subData.quotes.find((q: any) =>
          (q.policyType || "GENERAL_LIABILITY") === "GENERAL_LIABILITY"
        ) || subData.quotes[0];

        if (glQuote) {
          const s = quoteToState(glQuote);
          setSelectedCarrierId(s.selectedCarrierId);
          setCarrierQuoteUSD(s.carrierQuoteUSD);
          setCarrierFeesUSD(s.carrierFeesUSD);
          setSterlingFeesUSD(s.sterlingFeesUSD);
          setPremiumTaxPercent(s.premiumTaxPercent);
          setPremiumTaxAmountUSD(s.premiumTaxAmountUSD);
          setStampingFeePercent(s.stampingFeePercent);
          setStampingFeeAmountUSD(s.stampingFeeAmountUSD);
          setStampingFeePerFilingUSD(s.stampingFeePerFilingUSD);
          setSlaServiceChargeUSD(s.slaServiceChargeUSD);
          setFireMarshalTaxPercent(s.fireMarshalTaxPercent);
          setFireMarshalTaxAmountUSD(s.fireMarshalTaxAmountUSD);
          setPolicyFeeUSD(s.policyFeeUSD);
          setGeneralLiabilityLimit(s.generalLiabilityLimit);
          setAggregateLimit(s.aggregateLimit);
          setFireLegalLimit(s.fireLegalLimit);
          setMedicalExpenseLimit(s.medicalExpenseLimit);
          setDeductible(s.deductible);
          setExcessLimit(s.excessLimit);
          setPropertyBuildingLimit(s.propertyBuildingLimit);
          setPropertyBppLimit(s.propertyBppLimit);
          setPropertyBusinessIncomeLimit(s.propertyBusinessIncomeLimit);
          setPropertyDeductible(s.propertyDeductible);
          setSelectedEndorsements(s.selectedEndorsements);
          setEffectiveDate(s.effectiveDate);
          setExpirationDate(s.expirationDate);
          setPolicyNumber(s.policyNumber);
          setCarrierReference(s.carrierReference);
          setSpecialNotes(s.specialNotes);
          setCustomDocuments(s.customDocuments);
        }
      }

      // Fetch carriers
      const carriersRes = await fetch(`/api/admin/submissions/${submissionId}/carriers`);
      const carriersData = await carriersRes.json();

      if (!carriersRes.ok) {
        console.error("Carriers API error:", carriersData.error);
        setError(`Failed to load carriers: ${carriersData.error}`);
      } else if (carriersData.carriers) {
        setCarriers(carriersData.carriers);
        // Only set default carrier if no existing quotes were loaded
        if (carriersData.carriers.length > 0 && !subData.quotes?.length) {
          setSelectedCarrierId(carriersData.carriers[0]._id);
        }
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError("Failed to load submission data");
    } finally {
      setLoading(false);
    }
  };

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

  const selectedCarrier = carriers.find((c) => c._id === selectedCarrierId);

  const combinedPremium = useMemo(() => {
    const base = parseCurrency(carrierQuoteUSD) || 0;
    const carrierFees = parseCurrency(carrierFeesUSD) || 0;
    const sterlingFees = parseCurrency(sterlingFeesUSD) || 0;

    return base + carrierFees + sterlingFees;
  }, [carrierQuoteUSD, carrierFeesUSD, sterlingFeesUSD]);


  // Auto-calculate tax when carrier quote or state changes (Change 1: Tax Calculator API)
  useEffect(() => {
    const calculateTax = async () => {
      if (!combinedPremium || !submission) return;

      const carrierQuote = combinedPremium;
      if (isNaN(carrierQuote) || carrierQuote <= 0) {
        setPremiumTaxAmountUSD("");
        setPremiumTaxPercent("");
        return;
      }

      // Get state from submission and convert to state code
      const stateRaw = (submission as any).state || (submission as any).clientContact?.businessAddress?.state || "CA";

      // Convert state name to code (e.g., "California" → "CA")
      const state = getStateCode(stateRaw);

      // Debug logging
      console.log(`[Quote Page] Calculating tax for state: "${stateRaw}" → "${state}", premium: $${carrierQuote}`);

      setCalculatingTax(true);
      try {
        const response = await fetch(`/api/tax/calculate?state=${state}&premium=${carrierQuote.toFixed(2)}`);
        const data = await response.json();

        console.log(`[Quote Page] Tax API response:`, data);

        if (data.success && data.taxRate && data.taxAmount) {
          setPremiumTaxPercent(data.taxRate.toFixed(2));
          setPremiumTaxAmountUSD(data.taxAmount.toString());
          if (data.filingFee) setStampingFeePerFilingUSD(data.filingFee.toString());
          if (data.slaServiceCharge) setSlaServiceChargeUSD(data.slaServiceCharge.toString());
        } else {
          // Fallback to manual entry if API fails
          console.warn("Tax calculator API failed, using manual entry");
        }
      } catch (error) {
        console.error("Error calculating tax:", error);
        // Allow manual entry if API fails
      } finally {
        setCalculatingTax(false);
      }
    };

    calculateTax();
  }, [combinedPremium, submission]);

  // Calculate tax amount when tax percent is manually changed
  useEffect(() => {
    if (combinedPremium && premiumTaxPercent) {
      const taxPercent = parseFloat(premiumTaxPercent);

      if (!isNaN(combinedPremium) && !isNaN(taxPercent) && combinedPremium > 0) {
        const taxAmount = (combinedPremium * taxPercent) / 100;
        setPremiumTaxAmountUSD(taxAmount.toString());
      } else {
        setPremiumTaxAmountUSD("");
      }
    }
  }, [premiumTaxPercent, combinedPremium]);

  // calculate stamping fees
  useEffect(() => {
    const calculateStamping = async () => {
      if (!combinedPremium || !submission) return;

      const stateRaw =
        (submission as any).state ||
        (submission as any).clientContact?.businessAddress?.state ||
        "CA";

      const state = getStateCode(stateRaw);

      try {
        const response = await fetch(
          `/api/tax/calculate?state=${state}&premium=${combinedPremium}&type=stamping`
        );

        const data = await response.json();

        if (data.success) {
          setStampingFeePercent(data.taxRate.toFixed(2));
          setStampingFeeAmountUSD(data.taxAmount.toString());
        }
      } catch (err) {
        console.error("Stamping fee calculation error:", err);
      }
    };

    calculateStamping();
  }, [combinedPremium, submission]);

  // calculate fire marshal
  useEffect(() => {
    const calculateFireMarshal = async () => {
      if (!combinedPremium || !submission) return;

      const stateRaw =
        (submission as any).state ||
        (submission as any).clientContact?.businessAddress?.state ||
        "CA";

      const state = getStateCode(stateRaw);

      try {
        const response = await fetch(
          `/api/tax/calculate?state=${state}&premium=${combinedPremium}&type=firemarshal`
        );

        const data = await response.json();

        if (data.success) {
          setFireMarshalTaxPercent(data.taxRate?.toFixed(2) || "0");
          setFireMarshalTaxAmountUSD(data.taxAmount?.toString() || "0");
          setFireMarshalFlatFeeUSD(data.flatFee?.toString() || "0");
          setStampingFeePerFilingUSD(data.filingFee?.toString() || "0");
          setSlaServiceChargeUSD(data.slaServiceCharge?.toString() || "0");
        }
      } catch (err) {
        console.error("Fire Marshal calculation error:", err);
      }
    };

    calculateFireMarshal();
  }, [combinedPremium, submission]);

  // Auto-calculate expiration date when effective date or duration changes (Change 5: Duration Tabs)
  useEffect(() => {
    if (effectiveDate && policyDuration) {
      const effective = new Date(effectiveDate);
      const expiration = new Date(effective);

      if (policyDuration === "6months") {
        expiration.setMonth(expiration.getMonth() + 6);
      } else if (policyDuration === "1year") {
        expiration.setFullYear(expiration.getFullYear() + 1);
      }

      // Format as YYYY-MM-DD for date input
      const expirationStr = expiration.toISOString().split('T')[0];
      setExpirationDate(expirationStr);
    }
  }, [effectiveDate, policyDuration]);

  const calculateBreakdown = () => {
    if (!carrierQuoteUSD || !selectedCarrier) return null;

    const basePremium = parseCurrency(carrierQuoteUSD) || 0;
    const carrierFees = parseCurrency(carrierFeesUSD) || 0;
    const sterlingFees = parseCurrency(sterlingFeesUSD) || 0;

    const brokerFee = brokerFeeFromForm;
    const taxAmount = parseCurrency(premiumTaxAmountUSD) || 0;
    const stampingAmount = parseFloat(stampingFeeAmountUSD) || 0;
    const fireMarshalAmount = parseFloat(fireMarshalTaxAmountUSD) || 0;
    const fireMarshalFlatFee = parseFloat(fireMarshalFlatFeeUSD) || 0;
    const filingFee = parseFloat(stampingFeePerFilingUSD) || 0;
    const slaCharge = parseFloat(slaServiceChargeUSD) || 0;
    const policyFee = parseCurrency(policyFeeUSD) || 0;

    const finalAmount =
      basePremium +
      carrierFees +
      sterlingFees +
      brokerFee +
      taxAmount +
      stampingAmount +
      fireMarshalAmount +
      fireMarshalFlatFee +
      policyFee +
      filingFee +
      slaCharge;

    return {
      basePremium,
      carrierFees,
      sterlingFees,
      brokerFeeAmount: brokerFee,
      premiumTaxAmount: taxAmount,
      stampingFeeAmount: stampingAmount,
      fireMarshalAmount,
      fireMarshalFlatFee,
      policyFeeAmount: policyFee,
      finalAmount,
    };
  };

  const breakdown = calculateBreakdown();

  const ratingData = {
    totalPremium: breakdown?.basePremium || 0,
    carrierFees: breakdown?.carrierFees || 0,
    sterlingFees: breakdown?.sterlingFees || 0,
    surplusLinesTax: breakdown?.premiumTaxAmount || 0,
    stampingFee: breakdown?.stampingFeeAmount || 0,
    fireMarshalTax: breakdown?.fireMarshalAmount || 0,
    fireMarshalFlatFee: breakdown?.fireMarshalFlatFee || 0,
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) {
      setSelectedFiles([]);
      return;
    }
    setSelectedFiles(Array.from(files));
  };

  const handleUploadDocuments = async () => {
    if (!submissionId) return;
    if (!selectedFiles.length) {
      setUploadError("Please select at least one file to upload.");
      return;
    }

    setUploadError("");
    setUploadingDocs(true);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch(
        `/api/admin/submissions/${submissionId}/upload-documents`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload documents");
      }

      toast.success(
        data.uploadedCount
          ? `${data.uploadedCount} document(s) uploaded successfully`
          : "Documents uploaded successfully"
      );
      setSelectedFiles([]);
    } catch (err: any) {
      console.error("Admin document upload error:", err);
      setUploadError(err.message || "Failed to upload documents");
      toast.error(err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
    }
  };
  const handleCustomDocChange = (index: number, value: string) => {
    const updated = [...customDocuments];
    updated[index] = value;
    setCustomDocuments(updated);
  };

  const addCustomDocument = () => {
    setCustomDocuments((prev) => [...prev, ""]);
  };

  const removeCustomDocument = (index: number) => {
    const updated = customDocuments.filter((_, i) => i !== index);
    setCustomDocuments(updated.length ? updated : [""]);
  };

  // Collect all form data for auto-save
  const formData = useMemo(() => ({
    selectedCarrierId,
    carrierQuoteUSD,
    premiumTaxPercent,
    premiumTaxAmountUSD,
    policyFeeUSD,
    carrierFeesUSD,
    sterlingFeesUSD,
    stampingFeePercent,
    stampingFeeAmountUSD,
    fireMarshalTaxPercent,
    fireMarshalTaxAmountUSD,
    generalLiabilityLimit,
    aggregateLimit,
    fireLegalLimit,
    medicalExpenseLimit,
    deductible,
    excessLimit,
    propertyBuildingLimit,
    propertyBppLimit,
    propertyBusinessIncomeLimit,
    propertyDeductible,
    selectedEndorsements,
    effectiveDate,
    expirationDate,
    policyDuration,
    policyNumber,
    carrierReference,
    specialNotes,
    // Multi-policy state
    policyStates,
    policiesStatus,
    currentPolicyType,
    customDocuments,
  }), [
    selectedCarrierId,
    carrierQuoteUSD,
    premiumTaxPercent,
    premiumTaxAmountUSD,
    policyFeeUSD,
    carrierFeesUSD,
    sterlingFeesUSD,
    fireMarshalTaxPercent,
    fireMarshalTaxAmountUSD,
    generalLiabilityLimit,
    aggregateLimit,
    fireLegalLimit,
    medicalExpenseLimit,
    deductible,
    excessLimit,
    propertyBuildingLimit,
    propertyBppLimit,
    propertyBusinessIncomeLimit,
    propertyDeductible,
    selectedEndorsements,
    effectiveDate,
    expirationDate,
    policyDuration,
    policyNumber,
    carrierReference,
    specialNotes,
    policyStates,
    policiesStatus,
    currentPolicyType,
    customDocuments,
  ]);

  // Auto-save hook
  const { saveStatus, loadDraft, deleteDraft } = useAutoSave({
    formType: "admin_quote",
    formId: submissionId || "",
    data: formData,
    enabled: !!submissionId && status === "authenticated",
  });

  // Load draft on mount (after submission data is loaded)
  useEffect(() => {
    if (status === "authenticated" && submissionId && !loading && submission) {
      console.log("[AdminQuote] Loading draft for submission:", submissionId);
      loadDraft().then((draftData) => {
        console.log("[AdminQuote] Draft loaded, data:", draftData);
        if (draftData) {
          console.log("[AdminQuote] Restoring form fields from draft...");

          // Restore multi-policy state first
          if (draftData.policyStates) setPolicyStates(draftData.policyStates);
          if (draftData.policiesStatus) setPoliciesStatus(draftData.policiesStatus);
          if (draftData.currentPolicyType) setCurrentPolicyType(draftData.currentPolicyType);
          // Restore form fields from draft (draft overrides submission defaults)
          if (draftData.selectedCarrierId !== undefined && draftData.selectedCarrierId !== null && draftData.selectedCarrierId !== "") {
            setSelectedCarrierId(String(draftData.selectedCarrierId));
          }
          if (draftData.carrierQuoteUSD !== undefined && draftData.carrierQuoteUSD !== null && draftData.carrierQuoteUSD !== "") {
            setCarrierQuoteUSD(String(draftData.carrierQuoteUSD));
          }
          if (
            draftData.carrierFeesUSD !== undefined &&
            draftData.carrierFeesUSD !== null &&
            draftData.carrierFeesUSD !== ""
          ) {
            setCarrierFeesUSD(String(draftData.carrierFeesUSD));
          }

          if (
            draftData.sterlingFeesUSD !== undefined &&
            draftData.sterlingFeesUSD !== null &&
            draftData.sterlingFeesUSD !== ""
          ) {
            setSterlingFeesUSD(String(draftData.sterlingFeesUSD));
          }
          if (draftData.premiumTaxPercent !== undefined && draftData.premiumTaxPercent !== null && draftData.premiumTaxPercent !== "") {
            setPremiumTaxPercent(String(draftData.premiumTaxPercent));
          }
          if (draftData.premiumTaxAmountUSD !== undefined && draftData.premiumTaxAmountUSD !== null && draftData.premiumTaxAmountUSD !== "") {
            setPremiumTaxAmountUSD(String(draftData.premiumTaxAmountUSD));
          }
          if (
            draftData.stampingFeePercent !== undefined &&
            draftData.stampingFeePercent !== null &&
            draftData.stampingFeePercent !== ""
          ) {
            setStampingFeePercent(String(draftData.stampingFeePercent));
          }

          if (
            draftData.stampingFeeAmountUSD !== undefined &&
            draftData.stampingFeeAmountUSD !== null &&
            draftData.stampingFeeAmountUSD !== ""
          ) {
            setStampingFeeAmountUSD(String(draftData.stampingFeeAmountUSD));
          }
          if (draftData.fireMarshalTaxPercent) {
            setFireMarshalTaxPercent(String(draftData.fireMarshalTaxPercent));
          }
          if (draftData.fireMarshalTaxAmountUSD) {
            setFireMarshalTaxAmountUSD(String(draftData.fireMarshalTaxAmountUSD));
          }
          if (draftData.fireMarshalFlatFeeUSD) {
            setFireMarshalFlatFeeUSD(String(draftData.fireMarshalFlatFeeUSD));
          }
          if (draftData.policyFeeUSD !== undefined && draftData.policyFeeUSD !== null && draftData.policyFeeUSD !== "") {
            setPolicyFeeUSD(String(draftData.policyFeeUSD));
          }
          if (draftData.generalLiabilityLimit !== undefined && draftData.generalLiabilityLimit !== null && draftData.generalLiabilityLimit !== "") {
            setGeneralLiabilityLimit(String(draftData.generalLiabilityLimit));
          }
          if (draftData.aggregateLimit !== undefined && draftData.aggregateLimit !== null && draftData.aggregateLimit !== "") {
            setAggregateLimit(String(draftData.aggregateLimit));
          }
          if (draftData.fireLegalLimit !== undefined && draftData.fireLegalLimit !== null && draftData.fireLegalLimit !== "") {
            setFireLegalLimit(String(draftData.fireLegalLimit));
          }
          if (draftData.medicalExpenseLimit !== undefined && draftData.medicalExpenseLimit !== null && draftData.medicalExpenseLimit !== "") {
            setMedicalExpenseLimit(String(draftData.medicalExpenseLimit));
          }
          if (draftData.deductible !== undefined && draftData.deductible !== null && draftData.deductible !== "") {
            setDeductible(String(draftData.deductible));
          }
          if (draftData.propertyBuildingLimit !== undefined && draftData.propertyBuildingLimit !== null && draftData.propertyBuildingLimit !== "") {
            setPropertyBuildingLimit(String(draftData.propertyBuildingLimit));
          }
          if (draftData.propertyBppLimit !== undefined && draftData.propertyBppLimit !== null && draftData.propertyBppLimit !== "") {
            setPropertyBppLimit(String(draftData.propertyBppLimit));
          }
          if (draftData.propertyBusinessIncomeLimit !== undefined && draftData.propertyBusinessIncomeLimit !== null && draftData.propertyBusinessIncomeLimit !== "") {
            setPropertyBusinessIncomeLimit(String(draftData.propertyBusinessIncomeLimit));
          }
          if (draftData.propertyDeductible !== undefined && draftData.propertyDeductible !== null && draftData.propertyDeductible !== "") {
            setPropertyDeductible(String(draftData.propertyDeductible));
          }
          if (draftData.excessLimit !== undefined && draftData.excessLimit !== null && draftData.excessLimit !== "") {
            setExcessLimit(String(draftData.excessLimit));
          }
          if (draftData.selectedEndorsements !== undefined && Array.isArray(draftData.selectedEndorsements)) {
            setSelectedEndorsements(draftData.selectedEndorsements);
          }
          if (draftData.effectiveDate !== undefined && draftData.effectiveDate !== null && draftData.effectiveDate !== "") {
            setEffectiveDate(String(draftData.effectiveDate));
          }
          if (draftData.expirationDate !== undefined && draftData.expirationDate !== null && draftData.expirationDate !== "") {
            setExpirationDate(String(draftData.expirationDate));
          }
          if (draftData.policyDuration !== undefined && draftData.policyDuration !== null && draftData.policyDuration !== "") {
            setPolicyDuration(draftData.policyDuration as "6months" | "1year");
          }
          if (draftData.policyNumber !== undefined && draftData.policyNumber !== null && draftData.policyNumber !== "") {
            setPolicyNumber(String(draftData.policyNumber));
          }
          if (draftData.carrierReference !== undefined && draftData.carrierReference !== null && draftData.carrierReference !== "") {
            setCarrierReference(String(draftData.carrierReference));
          }
          if (draftData.specialNotes !== undefined && draftData.specialNotes !== null && draftData.specialNotes !== "") {
            setSpecialNotes(String(draftData.specialNotes));
          }
          if (draftData.customDocuments && Array.isArray(draftData.customDocuments)) {
            setCustomDocuments(draftData.customDocuments);
          }
          console.log("[AdminQuote] Form fields restored from draft!");
        } else {
          console.log("[AdminQuote] No draft data found, using defaults");
        }
      }).catch((error) => {
        console.error("[AdminQuote] Error loading draft:", error);
      });
    }
  }, [status, submissionId, loading, submission, loadDraft]);

  // Build API payload from a policy state object (used for multi-policy submit)
  const buildPolicyPayload = (state: any, policyType: string) => {
    const limits = {
      generalLiability: state.generalLiabilityLimit || undefined,
      aggregateLimit: state.aggregateLimit || undefined,
      fireLegalLimit: state.fireLegalLimit || undefined,
      medicalExpenseLimit: state.medicalExpenseLimit || undefined,
      deductible: state.deductible || undefined,
      excessLimit: state.excessLimit || undefined,
      propertyBuildingLimit: state.propertyBuildingLimit || undefined,
      propertyBppLimit: state.propertyBppLimit || undefined,
      propertyBusinessIncomeLimit: state.propertyBusinessIncomeLimit || undefined,
      propertyDeductible: state.propertyDeductible || undefined,
    };

    const quoteAmt = parseCurrency(state.carrierQuoteUSD);

    return {
      carrierId: state.selectedCarrierId,
      carrierQuoteUSD: quoteAmt,
      premiumTaxPercent: state.premiumTaxPercent || undefined,
      premiumTaxAmountUSD: state.premiumTaxAmountUSD ? parseCurrency(state.premiumTaxAmountUSD) : undefined,
      stampingFeePercent: state.stampingFeePercent || undefined,
      stampingFeeAmountUSD: state.stampingFeeAmountUSD ? parseCurrency(state.stampingFeeAmountUSD) : undefined,
      stampingFeePerFilingUSD: state.stampingFeePerFilingUSD ? parseCurrency(state.stampingFeePerFilingUSD) : undefined,
      slaServiceChargeUSD: state.slaServiceChargeUSD ? parseCurrency(state.slaServiceChargeUSD) : undefined,
      fireMarshalTaxPercent: state.fireMarshalTaxPercent || undefined,
      fireMarshalTaxAmountUSD: state.fireMarshalTaxAmountUSD ? parseCurrency(state.fireMarshalTaxAmountUSD) : undefined,
      fireMarshalFlatFeeUSD: state.fireMarshalFlatFeeUSD ? parseCurrency(state.fireMarshalFlatFeeUSD) : undefined,
      policyFeeUSD: state.policyFeeUSD ? parseCurrency(state.policyFeeUSD) : undefined,
      carrierFeesUSD: state.carrierFeesUSD ? parseCurrency(state.carrierFeesUSD) : undefined,
      sterlingInsuranceServicesFeesUSD: state.sterlingFeesUSD ? parseCurrency(state.sterlingFeesUSD) : undefined,
      brokerFeeAmountUSD: brokerFeeFromForm || undefined,
      limits: Object.values(limits).some(Boolean) ? limits : undefined,
      endorsements: (state.selectedEndorsements || []).length > 0 ? state.selectedEndorsements : undefined,
      effectiveDate: state.effectiveDate || undefined,
      expirationDate: state.expirationDate || undefined,
      policyNumber: state.policyNumber || undefined,
      carrierReference: state.carrierReference || undefined,
      specialNotes: state.specialNotes || undefined,
      policyType,
      customDocuments: (state.customDocuments || []).filter((d: string) => d.trim() !== ""),
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!selectedCarrierId || !carrierQuoteUSD) {
      setError("Please fill Carrier and Quote Amount for the current policy.");
      setSubmitting(false);
      return;
    }

    const quoteAmount = parseCurrency(carrierQuoteUSD);
    if (isNaN(quoteAmount) || quoteAmount <= 0) {
      setError("Quote amount must be greater than 0");
      setSubmitting(false);
      return;
    }

    try {
      // Snapshot live state of the currently-active tab
      const liveState = {
        selectedCarrierId,
        carrierQuoteUSD,
        carrierFeesUSD,
        sterlingFeesUSD,
        premiumTaxPercent,
        premiumTaxAmountUSD,
        stampingFeePercent,
        stampingFeeAmountUSD,
        fireMarshalTaxPercent,
        fireMarshalTaxAmountUSD,
        fireMarshalFlatFeeUSD,
        policyFeeUSD,
        generalLiabilityLimit,
        aggregateLimit,
        fireLegalLimit,
        medicalExpenseLimit,
        deductible,
        excessLimit,
        propertyBuildingLimit,
        propertyBppLimit,
        propertyBusinessIncomeLimit,
        propertyDeductible,
        selectedEndorsements,
        effectiveDate,
        expirationDate,
        policyDuration,
        policyNumber,
        carrierReference,
        specialNotes,
        customDocuments,
      };

      // Merge policyStates with the live state for current policy
      const allStates: Record<string, any> = {
        ...policyStates,
        [currentPolicyType]: liveState,
      };

      // Submit each available policy that has a carrier + quote amount
      for (const type of availablePolicies) {
        const state = allStates[type];
        if (!state?.selectedCarrierId || !state?.carrierQuoteUSD) continue; // skip unfilled

        const amt = parseCurrency(state.carrierQuoteUSD);
        if (isNaN(amt) || amt <= 0) continue;

        const payload = buildPolicyPayload(state, type);

        const response = await fetch(`/api/admin/quotes/${submissionId}/enter`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(`${type === "EXCESS_LIABILITY" ? "Excess Liability" : "General Liability"}: ${data.error || "Failed to create quote"}`);
        }
      }

      // Delete draft after successful submission
      await deleteDraft();

      setSuccess(true);
      toast.success("Quote created successfully! Redirecting...");
      // Redirect to submission details page
      setTimeout(() => {
        router.push(`/admin/submissions/${submissionId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Quote creation error:", err);
      setError(err.message || "Failed to create quote");
      toast.error(err.message || "Failed to create quote");
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading quote form...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!submission) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-12 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
          <p className="text-red-600 mb-6">{error || "Submission not found"}</p>
          <Link href="/admin/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-12 max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Quote Created & Sent!</h2>
          <p className="text-gray-600 mb-6">
            Quote has been created, binder PDF generated, and notification sent to the broker.
            <br />
            <br />
            <span className="text-sm text-gray-500">Redirecting to submission details...</span>
          </p>
        </div>
      </div>
    );
  }

  // Policy Switching Logic
  const handlePolicySwitch = (newType: "GENERAL_LIABILITY" | "EXCESS_LIABILITY") => {
    // 1. Save current state to storage
    const currentState = {
      selectedCarrierId,
      carrierQuoteUSD,
      carrierFeesUSD,
      sterlingFeesUSD,
      premiumTaxPercent,
      premiumTaxAmountUSD,
      stampingFeePercent,
      stampingFeeAmountUSD,
      fireMarshalTaxPercent,
      fireMarshalTaxAmountUSD,
      fireMarshalFlatFeeUSD,
      policyFeeUSD,
      generalLiabilityLimit,
      aggregateLimit,
      fireLegalLimit,
      medicalExpenseLimit,
      deductible,
      excessLimit,
      propertyBuildingLimit,
      propertyBppLimit,
      propertyBusinessIncomeLimit,
      propertyDeductible,
      selectedEndorsements,
      effectiveDate,
      expirationDate,
      policyDuration,
      policyNumber,
      carrierReference,
      specialNotes,
    };

    setPolicyStates(prev => ({ ...prev, [currentPolicyType]: currentState }));

    // 2. Load next state from storage or defaults
    const nextState = policyStates[newType] || {};

    setSelectedCarrierId(nextState.selectedCarrierId || "");
    setCarrierQuoteUSD(nextState.carrierQuoteUSD || "");
    setCarrierFeesUSD(nextState.carrierFeesUSD || "");
    setSterlingFeesUSD(nextState.sterlingFeesUSD || "");
    setPremiumTaxPercent(nextState.premiumTaxPercent || "");
    setPremiumTaxAmountUSD(nextState.premiumTaxAmountUSD || "");
    setPolicyFeeUSD(nextState.policyFeeUSD || "");
    setStampingFeePercent(nextState.stampingFeePercent || "");
    setStampingFeeAmountUSD(nextState.stampingFeeAmountUSD || "");
    setFireMarshalTaxPercent(nextState.fireMarshalTaxPercent || "");
    setFireMarshalTaxAmountUSD(nextState.fireMarshalTaxAmountUSD || "");
    setFireMarshalFlatFeeUSD(nextState.fireMarshalFlatFeeUSD || "");
    setGeneralLiabilityLimit(nextState.generalLiabilityLimit || (submission?.payload?.coverageLimits || ""));
    setAggregateLimit(nextState.aggregateLimit || (submission?.payload?.coverageLimits || ""));
    setFireLegalLimit(nextState.fireLegalLimit || (submission?.payload?.fireLegalLimit || ""));
    setMedicalExpenseLimit(nextState.medicalExpenseLimit || (submission?.payload?.medicalExpenseLimit || "Not Applicable"));
    setDeductible(nextState.deductible || (submission?.payload?.deductible || ""));
    setExcessLimit(nextState.excessLimit || (submission?.payload?.excessLiabilityLimit || ""));
    setPropertyBuildingLimit(nextState.propertyBuildingLimit || (submission?.payload?.propertyLimit || ""));
    setPropertyBppLimit(nextState.propertyBppLimit || (submission?.payload?.propertyBppLimit || ""));
    setPropertyBusinessIncomeLimit(nextState.propertyBusinessIncomeLimit || (submission?.payload?.propertyBusinessIncomeLimit || ""));
    setPropertyDeductible(nextState.propertyDeductible || (submission?.payload?.propertyDeductible || ""));
    setSelectedEndorsements(nextState.selectedEndorsements || []);
    setEffectiveDate(nextState.effectiveDate || "");
    setExpirationDate(nextState.expirationDate || "");
    setPolicyDuration(nextState.policyDuration || "");
    setPolicyNumber(nextState.policyNumber || "");
    setCarrierReference(nextState.carrierReference || "");
    setSpecialNotes(nextState.specialNotes || "");

    setCurrentPolicyType(newType);
    toast.info(`Switched to ${newType === "GENERAL_LIABILITY"
      ? (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "Property" : "General Liability")
      : (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability")
      }`);
  };

  // NEW: validate only required fields (carrier + premium) for each existing policy
  const isPolicyReady = (type: string): boolean => {
    if (type === currentPolicyType) {
      // Validate live form state for the currently-active policy tab
      return Boolean(selectedCarrierId && carrierQuoteUSD);
    }
    // Validate saved state for other policies
    const saved = policyStates[type];
    return Boolean(saved?.selectedCarrierId && saved?.carrierQuoteUSD);
  };
  const isReadyToSubmit = availablePolicies.some(isPolicyReady);
  const missingPolicies = availablePolicies.filter(type => !isPolicyReady(type));

  const isCommercialProperty = (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building');
  const isPropertyPolicy = currentPolicyType === "GENERAL_LIABILITY" && isCommercialProperty;
  const showGLLimits = (currentPolicyType === "GENERAL_LIABILITY" && !isCommercialProperty) || (currentPolicyType === "EXCESS_LIABILITY" && isCommercialProperty);
  const showExcessLimits = currentPolicyType === "EXCESS_LIABILITY" && !isCommercialProperty;

  return (
    <div className="min-h-screen bg-[#f5f1eb]">
      {/* Info Banner — at least one policy needed */}
      {!isReadyToSubmit && availablePolicies.length > 1 && (
        <div className="bg-blue-500 text-white px-4 py-2 text-center text-sm font-bold flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          At least one policy must be completed to submit.
        </div>
      )}
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
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
                <Link href="/admin/quote-requests" className="relative px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quote Request
                  {stats.quoteRequests > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full shadow-lg animate-pulse">
                      {stats.quoteRequests}
                    </span>
                  )}
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
              </nav>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="group relative px-4 py-2 text-sm font-semibold text-gray-700 hover:text-white bg-gradient-to-r from-gray-100 to-gray-200 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
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
      <main className="max-w-5xl mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/admin/submissions/${submissionId}`}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Submission
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-8">
          {/* Header Section */}
          <div className="mb-8 pb-6 border-b border-gray-200/60">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {isRenterQuote ? "Enter Renter Quote" : `Enter ${currentPolicyType === "GENERAL_LIABILITY"
                      ? (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "Property" : "General Liability")
                      : (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability")
                      } Quote`}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Create a quote for:{" "}
                    <span className="font-semibold text-gray-900">
                      {submission.clientContact.name}
                    </span>
                    {submission.programName ? (
                      <> ({submission.programName})</>
                    ) : submission.templateId ? (
                      <> ({submission.templateId.industry} - {submission.templateId.subtype})</>
                    ) : (
                      <> (Application)</>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Policy Selector (Required for Multi-Policy) */}
            {availablePolicies.length > 1 && (
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                  SELECT POLICY TO QUOTE:
                </label>
                <div className="flex gap-4">
                  {availablePolicies.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handlePolicySwitch(type as any)}
                      className={`flex-1 flex items-center justify-between px-6 py-4 rounded-xl border-2 transition-all duration-300 ${currentPolicyType === type
                        ? "border-rose-500 bg-rose-50/50 ring-4 ring-rose-100 shadow-md"
                        : "border-gray-100 bg-gray-50 hover:border-gray-300 grayscale opacity-70"
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${policiesStatus[type] === "complete" ? "bg-green-500 shadow-sm shadow-green-200" : "bg-amber-300 animate-pulse"
                          }`} />
                        <span className={`text-sm font-bold ${currentPolicyType === type ? "text-rose-700" : "text-gray-600"}`}>
                          {type === "GENERAL_LIABILITY"
                            ? (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "Property" : "General Liability")
                            : (submission?.programId === 'apartment-buildings' || submission?.programName === 'Commercial Property' || submission?.programName === 'Apartment Building' ? "General Liability" : "Excess Liability")
                          }
                        </span>
                      </div>
                      <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${policiesStatus[type] === "complete" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-600"
                        }`}>
                        {policiesStatus[type] === "complete" ? "Complete" : "Pending / Optional"}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mb-6 flex justify-end">
            <SaveStatusIndicator status={saveStatus} />
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Carrier Selection */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200/60">
              <label
                htmlFor="carrier"
                className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Carrier <span className="text-red-500">*</span>
              </label>
              <select
                id="carrier"
                value={selectedCarrierId}
                onChange={(e) => setSelectedCarrierId(e.target.value)}
                className="w-full px-4 py-3 bg-white border-2 border-blue-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all hover:border-blue-300 !text-gray-900"
                required
              >
                <option value="">-- Select Carrier --</option>
                {carriers.map((carrier) => (
                  <option key={carrier._id} value={carrier._id}>
                    {carrier.name}
                  </option>
                ))}
              </select>
              {carriers.length === 0 && (
                <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  No carriers found. This submission may not have been routed yet.
                </p>
              )}
            </div>

            {/* all amounts  */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200/60">
              <div className="flex items-center justify-between mb-4">
                <label
                  htmlFor="carrierQuote"
                  className="text-sm font-bold text-gray-900 flex items-center gap-2"
                >
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Quote Amount (Carrier Premium) <span className="text-red-500">*</span>
                </label>

                {/* Status Toggle */}
                <button
                  type="button"
                  onClick={() => setPoliciesStatus(prev => ({
                    ...prev,
                    [currentPolicyType]: prev[currentPolicyType] === "complete" ? "incomplete" : "complete"
                  }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs transition-all duration-300 ${policiesStatus[currentPolicyType] === "complete"
                    ? "bg-green-600 text-white shadow-lg shadow-green-200"
                    : "bg-white border-2 border-gray-200 text-gray-500 hover:border-emerald-300 hover:text-emerald-600"
                    }`}
                >
                  {policiesStatus[currentPolicyType] === "complete" ? (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      POLICY COMPLETE
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                      MARK AS COMPLETE
                    </>
                  )}
                </button>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold group-focus-within:text-emerald-600 transition-colors">$</div>
                <input
                  type="text"
                  id="carrierQuote"
                  value={carrierQuoteUSD}
                  onChange={(e) => setCarrierQuoteUSD(formatCurrencyInput(e.target.value))}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-emerald-300 !text-gray-900"
                  placeholder="0.00"
                />
              </div>

              <label className="block text-sm font-bold text-gray-900 mb-3">
                Carrier Fees
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-lg">
                  $
                </span>
                <input
                  type="text"
                  value={carrierFeesUSD ? formatCurrencyInput(carrierFeesUSD) : ''}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    setCarrierFeesUSD(formatted);
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrency(e.target.value);
                    setCarrierFeesUSD(parsed > 0 ? parsed.toString() : '');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl"
                  placeholder="0"
                />
              </div>

              <label className="block text-sm font-bold text-gray-900 mb-3">
                Sterling Insurance Services Fees
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-lg">
                  $
                </span>
                <input
                  type="text"
                  value={sterlingFeesUSD ? formatCurrencyInput(sterlingFeesUSD) : ''}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    setSterlingFeesUSD(formatted);
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrency(e.target.value);
                    setSterlingFeesUSD(parsed > 0 ? parsed.toString() : '');
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl"
                  placeholder="0"
                />
              </div>

            </div>



            {/* Premium Breakdown Section */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200/60">
              {/* <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                Premium Breakdown
              </h3> */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Premium Tax - Auto-calculated from API */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                    Surplus Lines Tax (%)
                    {calculatingTax && (
                      <span className="text-xs text-blue-600 flex items-center gap-1">
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Calculating...
                      </span>
                    )}
                    {!calculatingTax && premiumTaxPercent && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Auto-calculated
                      </span>
                    )}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={premiumTaxPercent}
                      onChange={(e) => setPremiumTaxPercent(e.target.value)}
                      className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all hover:border-gray-300 !text-gray-900"
                      placeholder="Auto-calculated"
                    />
                    <span className="text-gray-600 font-semibold self-center px-3">%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {submission && (submission as any).state
                      ? `Tax rate for ${(submission as any).state || (submission as any).clientContact?.businessAddress?.state || 'state'} (auto-calculated)`
                      : "Tax will be calculated automatically when premium is entered"}
                  </p>



                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Surplus Lines Tax Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                    <input
                      type="text"
                      value={premiumTaxAmountUSD ? formatCurrency(parseFloat(premiumTaxAmountUSD), 2) : ''}
                      readOnly
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold !text-gray-900"
                      placeholder="Auto-calculated"
                    />
                  </div>
                </div>

                {/* Policy Fee */}
                {/* <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Policy Fee (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                    <input
                      type="text"
                      value={policyFeeUSD ? formatCurrencyInput(policyFeeUSD) : ''}
                      onChange={(e) => {
                        const formatted = formatCurrencyInput(e.target.value);
                        setPolicyFeeUSD(formatted);
                      }}
                      onBlur={(e) => {
                        const parsed = parseCurrency(e.target.value);
                        setPolicyFeeUSD(parsed > 0 ? parsed.toString() : '');
                      }}
                      className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all hover:border-gray-300 !text-gray-900"
                      placeholder="0"
                    />
                  </div>
                </div> */}

                {/* Stamping Fee - Auto-calculated */}
                {parseFloat(stampingFeePercent || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Stamping Fee (%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={stampingFeePercent}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                        placeholder="Auto-calculated"
                      />
                      <span className="text-gray-600 font-semibold self-center px-3">%</span>
                    </div>
                  </div>
                )}

                {parseFloat(stampingFeeAmountUSD || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Stamping Fee Amount (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                        $
                      </span>
                      <input
                        type="text"
                        value={
                          stampingFeeAmountUSD
                            ? formatCurrency(parseFloat(stampingFeeAmountUSD), 2)
                            : ""
                        }
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                )}


                {/* Stamping Fee per Original Filing */}
                {parseFloat(stampingFeePerFilingUSD || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      PA Flat Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                        $
                      </span>
                      <input
                        type="text"
                        value={
                          stampingFeePerFilingUSD
                            ? formatCurrency(parseFloat(stampingFeePerFilingUSD), 2)
                            : ""
                        }
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* sla service charge  */}
                {parseFloat(slaServiceChargeUSD || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      SLSC
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">
                        $
                      </span>
                      <input
                        type="text"
                        value={
                          slaServiceChargeUSD
                            ? formatCurrency(parseFloat(slaServiceChargeUSD), 2)
                            : ""
                        }
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Fire Marshal Tax */}
                {parseFloat(fireMarshalTaxPercent || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Fire Marshal Tax (%)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={fireMarshalTaxPercent}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                        placeholder="Auto-calculated"
                      />
                      <span className="text-gray-600 font-semibold self-center px-3">%</span>
                    </div>
                  </div>
                )}

                {parseFloat(fireMarshalTaxAmountUSD || "0") > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Fire Marshal Tax Amount (USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                      <input
                        type="text"
                        value={
                          fireMarshalTaxAmountUSD
                            ? formatCurrency(parseFloat(fireMarshalTaxAmountUSD), 2)
                            : ""
                        }
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                )}

                {/* WA Flat Fee - Only for Washington */}
                {parseFloat(fireMarshalFlatFeeUSD || "0") > 0 && getStateCode((submission as any).state || (submission as any).clientContact?.businessAddress?.state || "CA") === 'WA' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      WA Flat Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                      <input
                        type="text"
                        value={
                          fireMarshalFlatFeeUSD
                            ? formatCurrency(parseFloat(fireMarshalFlatFeeUSD), 2)
                            : ""
                        }
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold"
                        placeholder="Auto-calculated"
                      />
                    </div>
                  </div>
                )}

                {/* Broker Fee - Display only (from application form) */}
                {brokerFeeFromForm > 0 && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Broker Fee (USD) <span className="text-xs text-gray-500 font-normal">(from application)</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                      <input
                        type="text"
                        value={formatCurrency(brokerFeeFromForm, 2)}
                        readOnly
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold !text-gray-900"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Policy Limits Section */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200/60">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                {isPropertyPolicy ? "Coverage Limits" : "Policy Limits"}
              </h3>

              <div className="mb-4 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {isPropertyPolicy 
                    ? "Coverage limits are pre-filled from the application form. You can edit if needed."
                    : "Policy limits and endorsements are pre-filled from the application form. You can edit if needed."}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {isPropertyPolicy && (
                  <>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Building Limit
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <input
                          type="text"
                          value={propertyBuildingLimit ? formatCurrencyInput(propertyBuildingLimit) : ''}
                          onChange={(e) => setPropertyBuildingLimit(formatCurrencyInput(e.target.value))}
                          onBlur={(e) => {
                            if (e.target.value.trim() === '') {
                              setPropertyBuildingLimit('');
                              return;
                            }
                            const parsed = parseCurrency(e.target.value);
                            setPropertyBuildingLimit(!isNaN(parsed) && parsed >= 0 ? parsed.toString() : '');
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Business Personal Property (BPP) Limit
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <input
                          type="text"
                          value={propertyBppLimit ? formatCurrencyInput(propertyBppLimit) : ''}
                          onChange={(e) => setPropertyBppLimit(formatCurrencyInput(e.target.value))}
                          onBlur={(e) => {
                            if (e.target.value.trim() === '') {
                              setPropertyBppLimit('');
                              return;
                            }
                            const parsed = parseCurrency(e.target.value);
                            setPropertyBppLimit(!isNaN(parsed) && parsed >= 0 ? parsed.toString() : '');
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Business Income Limit
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <input
                          type="text"
                          value={propertyBusinessIncomeLimit ? formatCurrencyInput(propertyBusinessIncomeLimit) : ''}
                          onChange={(e) => setPropertyBusinessIncomeLimit(formatCurrencyInput(e.target.value))}
                          onBlur={(e) => {
                            if (e.target.value.trim() === '') {
                              setPropertyBusinessIncomeLimit('');
                              return;
                            }
                            const parsed = parseCurrency(e.target.value);
                            setPropertyBusinessIncomeLimit(!isNaN(parsed) && parsed >= 0 ? parsed.toString() : '');
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Deductible
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold">$</span>
                        <input
                          type="text"
                          value={propertyDeductible ? formatCurrencyInput(propertyDeductible) : ''}
                          onChange={(e) => setPropertyDeductible(formatCurrencyInput(e.target.value))}
                          onBlur={(e) => {
                            const parsed = parseCurrency(e.target.value);
                            setPropertyDeductible(parsed > 0 ? parsed.toString() : '');
                          }}
                          className="w-full pl-10 pr-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Change 2: General Liability Limit - Dropdown (GL only) */}
                {showGLLimits && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      General Liability Limit <span className="text-xs text-gray-500 font-normal">(from application)</span>
                    </label>
                    <select
                      value={generalLiabilityLimit}
                      onChange={(e) => setGeneralLiabilityLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    >
                      <option value="1M/1M/1M">1M/1M/1M</option>
                      <option value="1M/2M/1M">1M/2M/1M</option>
                      <option value="1M/2M/2M">1M/2M/2M</option>
                    </select>
                  </div>
                )}

                {/* <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Aggregate Limit <span className="text-xs text-gray-500 font-normal">(from application)</span>
                  </label>
                  <input
                    type="text"
                    value={aggregateLimit}
                    onChange={(e) => setAggregateLimit(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    placeholder="e.g., 2M"
                  />
                </div> */}

                {/* Change 4: Fire Legal Limit / Med Pay / Deductible - GL only */}
                {showGLLimits && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Fire Legal Limit <span className="text-xs text-gray-500 font-normal">(from application)</span>
                    </label>
                    <select
                      value={fireLegalLimit}
                      onChange={(e) => setFireLegalLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    >
                      <option value="">-- Select Fire Legal Limit --</option>
                      <option value="$50,000">$50,000</option>
                      <option value="$100,000">$100,000</option>
                    </select>
                  </div>
                )}

                {showGLLimits && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Med Pay Limit <span className="text-xs text-gray-500 font-normal">(from application)</span>
                    </label>
                    <select
                      value={medicalExpenseLimit}
                      onChange={(e) => setMedicalExpenseLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    >
                      <option value="Not Applicable">Not Applicable</option>
                      <option value="2500">$2,500</option>
                      <option value="5000">$5,000</option>
                      <option value="10000">$10,000</option>
                    </select>
                  </div>
                )}

                {showGLLimits && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Deductible
                    </label>
                    <select
                      value={deductible}
                      onChange={(e) => setDeductible(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    >
                      <option value="">-- Select Deductible --</option>
                      <option value="10000">$10,000</option>
                      <option value="5000">$5,000</option>
                      <option value="2500">$2,500</option>
                      <option value="1000">$1,000</option>
                    </select>
                  </div>
                )}

                {/* Excess Limits - XS tab only */}
                {showExcessLimits && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Excess Limits
                    </label>
                    <select
                      value={excessLimit}
                      onChange={(e) => setExcessLimit(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                    >
                      <option value="">-- Select Excess Limit --</option>
                      <option value="1M">1M</option>
                      <option value="2M">2M</option>
                      <option value="3M">3M</option>
                      <option value="4M">4M</option>
                      <option value="5M">5M</option>
                    </select>
                  </div>
                )}
                {/* ACORD 131 Button for Excess Liability */}
                {showExcessLimits && (
                  <div className="md:col-span-2 pt-2">
                    <button
                      type="button"
                      onClick={() => window.open(`/api/admin/submissions/${submissionId}/acord131`, "_blank")}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Generate App Packet
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Endorsements Section */}
            {!isPropertyPolicy && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl p-6 border border-indigo-200/60">
              <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                Included Endorsements
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Pre-filled from application form. You can modify if needed.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {availableEndorsements.map((endorsement) => (
                  <label key={endorsement} className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
                    <input
                      type="checkbox"
                      checked={selectedEndorsements.includes(endorsement)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedEndorsements([...selectedEndorsements, endorsement]);
                        } else {
                          setSelectedEndorsements(selectedEndorsements.filter((e) => e !== endorsement));
                        }
                      }}
                      className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition"
                    />
                    <span className="text-sm text-gray-900 font-medium">{endorsement}</span>
                  </label>
                ))}
              </div>
            </div>
            )}

            {/* Policy Details Section */}
            <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-xl p-6 border border-teal-200/60">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                Policy Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Change 5: Effective Date with Duration Tabs */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Effective Date
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all hover:border-gray-300 !text-gray-900"
                  />

                  {/* Duration Tabs - Show when effective date is selected */}
                  {effectiveDate && (
                    <div className="mt-3">
                      <label className="block text-xs font-semibold text-gray-700 mb-2">
                        Policy Duration
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setPolicyDuration("6months")}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${policyDuration === "6months"
                            ? "bg-teal-600 text-white shadow-lg scale-105"
                            : "bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                            }`}
                        >
                          6 Months
                        </button>
                        <button
                          type="button"
                          onClick={() => setPolicyDuration("1year")}
                          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${policyDuration === "1year"
                            ? "bg-teal-600 text-white shadow-lg scale-105"
                            : "bg-white border-2 border-gray-300 text-gray-700 hover:border-teal-400 hover:bg-teal-50"
                            }`}
                        >
                          1 Year
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Expiration Date <span className="text-xs text-gray-500 font-normal">(auto-calculated)</span>
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    readOnly
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 font-semibold !text-gray-900"
                    placeholder="Select effective date and duration"
                  />
                  {!effectiveDate && (
                    <p className="text-xs text-gray-500 mt-1">Select effective date to calculate expiration</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={(e) => setPolicyNumber(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all hover:border-gray-300 !text-gray-900"
                    placeholder="Carrier policy number"
                  />
                </div>

                {/* <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Carrier Reference/Quote #
                  </label>
                  <input
                    type="text"
                    value={carrierReference}
                    onChange={(e) => setCarrierReference(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all hover:border-gray-300 !text-gray-900"
                    placeholder="Carrier quote reference"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Special Notes / Conditions
                  </label>
                  <textarea
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all hover:border-gray-300 resize-none !text-gray-900"
                    placeholder="Any special conditions, notes, or requirements..."
                  />
                </div> */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Subjective Lines
                  </label>

                  <div className="space-y-3">
                    {customDocuments.map((doc, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          value={doc}
                          onChange={(e) => handleCustomDocChange(index, e.target.value)}
                          placeholder="Enter document name..."
                          className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition-all"
                        />

                        {/* REMOVE BUTTON */}
                        {customDocuments.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCustomDocument(index)}
                            className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}

                    {/* ADD BUTTON */}
                    <button
                      type="button"
                      onClick={addCustomDocument}
                      className="flex items-center gap-2 text-sm font-semibold text-teal-600 hover:text-teal-700"
                    >
                      <span className="text-lg">＋</span> Add Document
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Document Upload (visible to admin only, supports multiple files) */}
            <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-xl p-6 border border-gray-200/80">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-slate-700 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
                Upload Supporting Documents
              </h3>
              <p className="text-xs text-gray-600 mb-4">
                Upload carrier binders, endorsements, or any other supporting
                documents for this submission. These will be visible to the
                agency under the quote&apos;s document section.
              </p>

              <div className="space-y-3">
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
                      setSelectedFiles(Array.from(e.dataTransfer.files));
                    }
                  }}
                  className={`relative group cursor-pointer transition-all duration-300 ${isDragging
                      ? "border-[#9A8B7A] bg-[#9A8B7A]/5"
                      : "border-gray-200 hover:border-[#9A8B7A] bg-gray-50 hover:bg-white"
                    } border-2 border-dashed rounded-xl p-6 text-center mb-4`}
                  onClick={() => document.getElementById('support-doc-upload')?.click()}
                >
                  <input
                    id="support-doc-upload"
                    type="file"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isDragging ? "bg-[#9A8B7A] text-white scale-110 shadow-lg" : "bg-white text-[#9A8B7A] shadow-sm group-hover:shadow-md"}`}>
                      <Upload className={`w-6 h-6 ${isDragging ? "animate-bounce" : "group-hover:scale-110 transition-transform"}`} />
                    </div>
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">
                        Click or drag files here to select
                      </p>
                      <p className="text-[12px] text-gray-500 font-medium mt-1">
                        Support for PDF, DOC, ZIP
                      </p>
                    </div>
                  </div>
                </div>
                {selectedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFiles.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg border border-gray-200">
                        <span className="text-xs font-medium text-gray-700 truncate max-w-[200px]">
                          {f.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const newFiles = [...selectedFiles];
                            newFiles.splice(i, 1);
                            setSelectedFiles(newFiles);
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors focus:outline-none"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {uploadError && (
                  <p className="text-xs text-red-600 font-semibold">
                    {uploadError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleUploadDocuments}
                  disabled={uploadingDocs || selectedFiles.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-xl text-sm font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {uploadingDocs ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12"
                        />
                      </svg>
                      Upload Documents
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Breakdown Preview */}
            {breakdown && (
              <div className="p-6 bg-gradient-to-br from-rose-50 via-pink-50 to-rose-50 rounded-xl border-2 border-rose-200 shadow-lg">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Rate Breakdown
                </h3>

                <div className="space-y-3">
                  <div className="flex flex-col gap-5 flex-grow mb-8 bg-white/60 p-4 rounded-lg">
                    <RatingRow label="Premium" value={formatCurrency(ratingData?.totalPremium || 0)} />
                    <RatingRow label="Carrier Fees" value={formatCurrency(ratingData?.carrierFees || 0)} />
                    <RatingRow label="Surplus Lines Tax (%)" value={formatCurrency(ratingData?.surplusLinesTax || 0)} />
                    {ratingData.stampingFee > 0 && (
                      <RatingRow label="Stamping Fee (%)" value={formatCurrency(ratingData?.stampingFee || 0)} />)}
                    {parseFloat(stampingFeePerFilingUSD || "0") > 0 && (
                      <RatingRow
                        label="PA Flat Fee"
                        value={formatCurrency(parseFloat(stampingFeePerFilingUSD || "0"))}
                      />)}
                    {ratingData.fireMarshalTax > 0 && (
                      <RatingRow label="Fire Marshal Tax (%)" value={formatCurrency(ratingData?.
                        fireMarshalTax || 0)} />)}
                    {parseFloat(fireMarshalFlatFeeUSD || "0") > 0 && getStateCode((submission as any).state || (submission as any).clientContact?.businessAddress?.state || "CA") === 'WA' && (
                      <RatingRow label="WA Flat Fee" value={formatCurrency(parseFloat(fireMarshalFlatFeeUSD || "0"))} />)}
                    {parseFloat(slaServiceChargeUSD || "0") > 0 && (
                      <RatingRow
                        label="SLSC"
                        value={formatCurrency(parseFloat(slaServiceChargeUSD || "0"))}
                      />)}
                    <RatingRow label="Surplus Lines Policy Fee" value={formatCurrency(ratingData?.sterlingFees || 0)} />
                  </div>
                  <div className="pt-4 mt-4 border-t-2 border-rose-300 flex justify-between items-center p-4 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg">
                    <span className="text-xl font-bold text-gray-900">
                      Total Amount:
                    </span>
                    <span className="text-2xl font-black text-rose-600">
                      {formatCurrency(breakdown.finalAmount, 2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                <p className="text-red-600 text-sm font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex flex-col gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || carriers.length === 0 || !isPolicyReady(currentPolicyType)}
                className="flex-1 px-6 py-4 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold text-lg hover:shadow-xl hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Creating Quote...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Create Quote
                  </>
                )}
              </button>

              {/* Info notice about incomplete policies */}
              {missingPolicies.length > 0 && availablePolicies.length > 1 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm font-bold mb-2 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    The following policies are optional and can be completed later:
                  </p>
                  <div className="space-y-2">
                    {missingPolicies.map(type => (
                      <div key={type} className="flex items-center justify-between text-xs">
                        <span className="text-gray-600 font-medium">
                          {type === "GENERAL_LIABILITY"
                            ? (isCommercialProperty ? "Property" : "General Liability")
                            : (isCommercialProperty ? "General Liability" : "Excess Liability")
                          }
                        </span>
                        <span className="font-semibold uppercase tracking-wider text-blue-500">
                          Pending / Optional
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/admin/submissions/${submissionId}`}
                className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
