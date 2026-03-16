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

  // 🔥 Fire Marshal Tax
  const [fireMarshalTaxPercent, setFireMarshalTaxPercent] = useState("");
  const [fireMarshalTaxAmountUSD, setFireMarshalTaxAmountUSD] = useState("");

  // Policy details (will be auto-populated from application form)
  const [generalLiabilityLimit, setGeneralLiabilityLimit] = useState("");
  const [aggregateLimit, setAggregateLimit] = useState("");
  const [fireLegalLimit, setFireLegalLimit] = useState("");
  const [medicalExpenseLimit, setMedicalExpenseLimit] = useState("Not Applicable");
  const [deductible, setDeductible] = useState("");
  const [excessLimit, setExcessLimit] = useState(""); // New: Excess limits

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

  // Admin document upload
  const [uploadingDocs, setUploadingDocs] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

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

      // Get broker fee from form
      const brokerFee = parseFloat(formData.brokerFee) || 0;
      setBrokerFeeFromForm(brokerFee);

      // Get limits from form
      if (formData.coverageLimits) {
        const limitsStr = formData.coverageLimits;
        setGeneralLiabilityLimit(limitsStr);
        setAggregateLimit(limitsStr);
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
      if (formData.blanketCompletedOpsAggregate) formEndorsements.push("Blanket Completed Operations Aggregate");
      if (formData.actsOfTerrorism) formEndorsements.push("Acts of Terrorism");
      if (formData.noticeOfCancellationToThirdParties) formEndorsements.push("Notice of Cancellation to Third Parties");

      if (formEndorsements.length > 0) {
        setSelectedEndorsements(formEndorsements);
      }
    }
  }, [submission]);

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
      // Fetch submission
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

      // Fetch carriers
      const carriersRes = await fetch(`/api/admin/submissions/${submissionId}/carriers`);
      const carriersData = await carriersRes.json();
      console.log("Carriers API response:", carriersData);

      if (!carriersRes.ok) {
        console.error("Carriers API error:", carriersData.error);
        setError(`Failed to load carriers: ${carriersData.error}`);
      } else if (carriersData.carriers) {
        setCarriers(carriersData.carriers);
        if (carriersData.carriers.length > 0) {
          setSelectedCarrierId(carriersData.carriers[0]._id);
        } else {
          setError("No carriers available. Please ensure carriers are seeded and the submission has been routed.");
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
    const policyFee = parseCurrency(policyFeeUSD) || 0;

    const finalAmount =
      basePremium +
      carrierFees +
      sterlingFees +
      brokerFee +
      taxAmount +
      stampingAmount +
      fireMarshalAmount +
      policyFee;

    return {
      basePremium,
      carrierFees,
      sterlingFees,
      brokerFeeAmount: brokerFee,
      premiumTaxAmount: taxAmount,
      stampingFeeAmount: stampingAmount,
      fireMarshalAmount,
      policyFeeAmount: policyFee,
      finalAmount,
    };
  };

  const breakdown = calculateBreakdown();

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
    selectedEndorsements,
    effectiveDate,
    expirationDate,
    policyDuration,
    policyNumber,
    carrierReference,
    specialNotes,
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
    selectedEndorsements,
    effectiveDate,
    expirationDate,
    policyDuration,
    policyNumber,
    carrierReference,
    specialNotes,
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
          console.log("[AdminQuote] Form fields restored from draft!");
        } else {
          console.log("[AdminQuote] No draft data found, using defaults");
        }
      }).catch((error) => {
        console.error("[AdminQuote] Error loading draft:", error);
      });
    }
  }, [status, submissionId, loading, submission, loadDraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!selectedCarrierId || !carrierQuoteUSD) {
      setError("Please select a carrier and enter quote amount");
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
      // Prepare limits object
      const limits = {
        generalLiability: generalLiabilityLimit || undefined,
        aggregateLimit: aggregateLimit || undefined,
        fireLegalLimit: fireLegalLimit || undefined,
        medicalExpenseLimit: medicalExpenseLimit || undefined,
        deductible: deductible || undefined,
        excessLimit: excessLimit || undefined,
      };

      // Note: The API uses [id] as the dynamic segment, which represents submissionId
      const response = await fetch(`/api/admin/quotes/${submissionId}/enter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carrierId: selectedCarrierId,
          carrierQuoteUSD: quoteAmount,
          premiumTaxPercent: premiumTaxPercent || undefined,
          premiumTaxAmountUSD: premiumTaxAmountUSD ? parseCurrency(premiumTaxAmountUSD) : undefined,
          stampingFeePercent: stampingFeePercent || undefined,
          stampingFeeAmountUSD: stampingFeeAmountUSD
            ? parseCurrency(stampingFeeAmountUSD)
            : undefined,
          fireMarshalTaxPercent: fireMarshalTaxPercent || undefined,
          fireMarshalTaxAmountUSD: fireMarshalTaxAmountUSD
            ? parseCurrency(fireMarshalTaxAmountUSD)
            : undefined,
          policyFeeUSD: policyFeeUSD ? parseCurrency(policyFeeUSD) : undefined,
          carrierFeesUSD: carrierFeesUSD ? parseCurrency(carrierFeesUSD) : undefined,
          sterlingInsuranceServicesFeesUSD: sterlingFeesUSD ? parseCurrency(sterlingFeesUSD) : undefined,
          brokerFeeAmountUSD: brokerFeeFromForm || undefined,
          limits: Object.keys(limits).some(k => limits[k as keyof typeof limits]) ? limits : undefined,
          excessLimit: excessLimit || undefined,
          endorsements: selectedEndorsements.length > 0 ? selectedEndorsements : undefined,
          effectiveDate: effectiveDate || undefined,
          expirationDate: expirationDate || undefined,
          policyNumber: policyNumber || undefined,
          carrierReference: carrierReference || undefined,
          specialNotes: specialNotes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create quote");
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/admin/dashboard" className="flex items-center gap-4 group">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 animate-pulse transition-all duration-500"></div>
                  <div className="relative w-12 h-12 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:shadow-rose-600/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                    <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                    <div className="relative">
                      <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">SP</span>
                    </div>
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
            </div>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-6 lg:px-8 py-12">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/60 p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Error</h1>
            <p className="text-red-600 mb-6">{error || "Submission not found"}</p>
            <Link href="/admin/dashboard" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all">
              ← Back to Dashboard
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
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
                onClick={() => signOut()}
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
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-pink-100 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isRenterQuote ? "Enter Renter Quote" : "Enter Quote"}
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
              <label
                htmlFor="carrierQuote"
                className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Premium <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-semibold text-lg">
                  $
                </span>
                <input
                  id="carrierQuote"
                  type="text"
                  value={carrierQuoteUSD ? formatCurrencyInput(carrierQuoteUSD) : ''}
                  onChange={(e) => {
                    const formatted = formatCurrencyInput(e.target.value);
                    setCarrierQuoteUSD(formatted);
                  }}
                  onBlur={(e) => {
                    const parsed = parseCurrency(e.target.value);
                    setCarrierQuoteUSD(parsed > 0 ? parsed.toString() : '');
                  }}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-emerald-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all hover:border-emerald-300 !text-gray-900"
                  placeholder="0"
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

                {/* Fire Marshal Tax */}
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
                Policy Limits
              </h3>

              <div className="mb-4 p-3 bg-amber-100/50 rounded-lg border border-amber-200">
                <p className="text-xs text-amber-800 font-medium flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Policy limits and endorsements are pre-filled from the application form. You can edit if needed.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Change 2: General Liability Limit - Dropdown */}
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

                {/* Change 4: Fire Legal Limit - Dropdown */}
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
                    <option value="300000">$50,000</option>
                    <option value="100000">$100,000</option>
                  </select>
                </div>

                {/* Change 4: Medical Expense Limit - Dropdown */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Med Pay Limit <span className="text-xs text-gray-500 font-normal">(from application)</span>
                  </label>
                  <select
                    value={medicalExpenseLimit}
                    onChange={(e) => setMedicalExpenseLimit(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                  >
                    <option value="Not Applicable" selected>Not Applicable</option>
                    <option value="5000">$5,000</option>
                    <option value="10000">$10,000</option>
                  </select>
                </div>

                {/* Change 4: Deductible - Dropdown */}
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

                {/* Change 3: Excess Limits - New Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Excess Limits <span className="text-xs text-gray-500 font-normal">(if needed)</span>
                  </label>
                  <select
                    value={excessLimit}
                    onChange={(e) => setExcessLimit(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-900 font-semibold focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all hover:border-gray-300 !text-gray-900"
                  >
                    <option value="">-- Select Excess Limit (Optional) --</option>
                    <option value="1M">1M</option>
                    <option value="2M">2M</option>
                    <option value="3M">3M</option>
                    <option value="4M">4M</option>
                    <option value="5M">5M</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Endorsements Section */}
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

                <div>
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
                <input
                  type="file"
                  multiple
                  onChange={handleFilesSelected}
                  className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-gray-800 hover:file:bg-slate-200 cursor-pointer"
                />
                {selectedFiles.length > 0 && (
                  <p className="text-xs text-gray-600">
                    Selected:{" "}
                    {selectedFiles.map((f) => f.name).join(", ")}
                  </p>
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
                  Quote Summary
                </h3>
                <div className="space-y-3">
                  {/* <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Carrier Quote:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(breakdown.carrierQuote, 2)}
                    </span>
                  </div> */}
                  <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                    <span className="text-gray-700 font-medium">Premium:</span>
                    <span className="font-bold text-gray-900 text-lg">
                      {formatCurrency(breakdown.basePremium, 2)}
                    </span>
                  </div>

                  {breakdown.carrierFees > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">Carrier Fees:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.carrierFees, 2)}
                      </span>
                    </div>
                  )}

                  {breakdown.sterlingFees > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        Sterling Insurance Services Fees:
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.sterlingFees, 2)}
                      </span>
                    </div>
                  )}
                  {breakdown.premiumTaxAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">Premium Tax:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.premiumTaxAmount, 2)}
                      </span>
                    </div>
                  )}

                  {breakdown.stampingFeeAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        Stamping Fee:
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.stampingFeeAmount, 2)}
                      </span>
                    </div>
                  )}
                  {breakdown.fireMarshalAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">
                        Fire Marshal Tax:
                      </span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.fireMarshalAmount, 2)}
                      </span>
                    </div>
                  )}
                  {breakdown.policyFeeAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">Policy Fee:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.policyFeeAmount, 2)}
                      </span>
                    </div>
                  )}
                  {breakdown.brokerFeeAmount > 0 && (
                    <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                      <span className="text-gray-700 font-medium">Broker Fee:</span>
                      <span className="font-bold text-gray-900">
                        {formatCurrency(breakdown.brokerFeeAmount, 2)}
                      </span>
                    </div>
                  )}
                  <div className="pt-4 mt-4 border-t-2 border-rose-300 flex justify-between items-center p-4 bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg">
                    <span className="text-xl font-bold text-gray-900">
                      Total Cost:
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
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting || carriers.length === 0}
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
              <Link
                href={`/admin/submissions/${submissionId}`}
                className="px-6 py-4 bg-white border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all"
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
