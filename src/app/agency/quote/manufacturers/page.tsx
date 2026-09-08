"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Upload, Check, Download } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyInput, parseCurrency, formatCurrency } from '@/lib/utils/currencyFormatter';

// ── Sterling section wrapper ──────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white rounded shadow-md overflow-visible border border-gray-200 mb-6">
    <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
      <h2 className="text-base md:text-lg font-semibold">{title}</h2>
    </div>
    <div className="px-4 md:px-8 pt-6 pb-7">
      <div className="space-y-6">{children}</div>
    </div>
  </div>
);

// ── Label + input row ─────────────────────────────────────────────
const Row = ({ label, children, bold = false, required = false }: { label: React.ReactNode; children: React.ReactNode; bold?: boolean; required?: boolean }) => (
  <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_320px] gap-4 md:gap-x-6 items-start">
    <label className={`text-sm text-gray-900 md:pt-2 leading-snug flex items-center min-h-[38px] ${bold ? 'font-bold' : 'font-medium'}`}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="hidden md:block"></div>
    <div>{children}</div>
  </div>
);

const inp = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#7A6F64] focus:ring-1 focus:ring-[#7A6F64] bg-white";
const sel = `${inp} appearance-none`;
const textareaStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#7A6F64] focus:ring-1 focus:ring-[#7A6F64] bg-white resize-y";

const CurrencyInp = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) => (
  <div className="relative">
    <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
    <input
      type="text"
      value={value.replace('$', '')}
      onChange={e => onChange('$' + formatCurrencyInput(e.target.value))}
      placeholder={placeholder}
      className={`${inp} pl-7`}
    />
  </div>
);

// ── Yes/No Radio Toggle ───────────────────────────────────────────
const YesNo = ({
  name,
  value,
  onChange,
}: {
  name: string;
  value: boolean | null | undefined;
  onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center gap-6 min-h-[36px] shrink-0">
    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
      <input
        type="radio"
        name={name}
        checked={value === true}
        onChange={() => onChange(true)}
        className="w-4 h-4 accent-[#7A6F64]"
      />
      Yes
    </label>
    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
      <input
        type="radio"
        name={name}
        checked={value === false}
        onChange={() => onChange(false)}
        className="w-4 h-4 accent-[#7A6F64]"
      />
      No
    </label>
  </div>
);

const INDUSTRY_OPTIONS = [
  "Pharmaceutical/Nutraceutical",
  "Medical Devices",
  "Tobacco/Smoking Pipes",
  "Marijuana Cannabis",
  "CBD/Hemp Cannabis",
  "Electronic Cigarettes",
  "Aviation/Aerospace (inc'l UAS)",
  "Firearms, Ammunition, Ballistics",
  "Machine Shops",
  "Equipment Rental",
  "Amusement Devices/Inflatables",
  "Energy Sector/Offshore",
];

function ManufacturersContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();

  const mode = searchParams.get('mode');
  const isViewMode = mode === 'view';
  const isEditMode = mode === 'edit';
  const submissionId = searchParams.get('id');

  const publicToken = searchParams.get('token');
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  // Agent / Agency Options
  const userName = session?.user?.name || "Agent";
  const email = session?.user?.email || "";
  const agencyName = (session?.user as any)?.agencyName || "";

  const isCapco = agencyName.includes("Capital & Co") || agencyName.includes("Capco") || email.includes("capcoinsurance") || email === "admin@agency1.com" || userName.includes("Gamaty");
  const isBlueAngel = agencyName.includes("Blue Angel") || email === "admin@blueangel.com";
  const isSJJ = agencyName.includes("SJJ") || email === "admin@sjjinsurance.com";
  const isPatrickArias = agencyName.includes("Patrick Arias") || email.includes("patrickariasinsurance");
  const isTitan = agencyName.toLowerCase().includes("titan") || email.includes("solutions@titaninssolutions.com");
  const isTexas = agencyName.toLowerCase().includes("texas") || email.toLowerCase().includes("texascomm@services.com");

  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];
  const TEXAS_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];

  const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? TEXAS_AGENTS : [];

  // ================= Form State =================
  // 1) General Information
  const [namedInsured, setNamedInsured] = useState('');
  const [brokerage, setBrokerage] = useState('');
  const [agencyAgent, setAgencyAgent] = useState(userName || '');
  const [isRenewal, setIsRenewal] = useState<boolean | null>(null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [website, setWebsite] = useState('');

  // 2) Current Carrier Information
  const [carrier, setCarrier] = useState('');
  const [limitOfInsurance, setLimitOfInsurance] = useState('');
  const [deductible, setDeductible] = useState('');
  const [premium, setPremium] = useState('');
  const [offeringRenewal, setOfferingRenewal] = useState<boolean | null>(null);
  const [claimsMade, setClaimsMade] = useState<boolean | null>(null);
  const [retroactiveDate, setRetroactiveDate] = useState('');

  // Attachments
  const [lossRunsFile, setLossRunsFile] = useState<File | null>(null);
  const [brochureFile, setBrochureFile] = useState<File | null>(null);

  // 3) Mailing Address
  const [mailingAddress, setMailingAddress] = useState('');
  const [mailingCity, setMailingCity] = useState('');
  const [mailingState, setMailingState] = useState('');
  const [mailingZip, setMailingZip] = useState('');

  // 4) Premise Address
  const [sameAsMailing, setSameAsMailing] = useState(false);
  const [premiseAddress, setPremiseAddress] = useState('');
  const [premiseCity, setPremiseCity] = useState('');
  const [premiseState, setPremiseState] = useState('');
  const [premiseZip, setPremiseZip] = useState('');

  // 5) Sales Table
  const [salesUpcoming, setSalesUpcoming] = useState('');
  const [salesLast12, setSalesLast12] = useState('');
  const [salesOneYearPrior, setSalesOneYearPrior] = useState('');
  const [salesTwoYearsPrior, setSalesTwoYearsPrior] = useState('');
  const [salesThreeYearsPrior, setSalesThreeYearsPrior] = useState('');

  // 6) Audit / Inspection Contact
  const [auditContact, setAuditContact] = useState('');
  const [auditPhone, setAuditPhone] = useState('');
  const [auditEmail, setAuditEmail] = useState('');

  // ================= NEW SECTIONS: PAGE 2 & 3 =================
  // 7) Industries
  const [industries, setIndustries] = useState<string[]>([]);

  // 8) Excluded subsidiary / product
  const [excludedProducts, setExcludedProducts] = useState('');
  const [coveredElsewhere, setCoveredElsewhere] = useState<boolean | null>(null);

  // 9) New products next year
  const [newProducts, setNewProducts] = useState<boolean | null>(null);
  const [newProductsDetails, setNewProductsDetails] = useState('');

  // 10) Identified from competitors
  const [identifiedCompetitors, setIdentifiedCompetitors] = useState<boolean | null>(null);
  const [identifiedHow, setIdentifiedHow] = useState('');

  // 11) Import products or components
  const [importProducts, setImportProducts] = useState<boolean | null>(null);

  // 12) AI Vendor status
  const [aiVendorStatus, setAiVendorStatus] = useState<boolean | null>(null);
  const [domesticCarrier, setDomesticCarrier] = useState<boolean | null>(null);

  // 13) Installation, service, repair operations off-premise
  const [offPremiseOps, setOffPremiseOps] = useState<boolean | null>(null);
  const [offPremiseClarify, setOffPremiseClarify] = useState('');
  const [hireSubcontractors, setHireSubcontractors] = useState<boolean | null>(null);
  const [collectCoi, setCollectCoi] = useState<boolean | null>(null);
  const [condoTownhouseWork, setCondoTownhouseWork] = useState<boolean | null>(null);

  // 14) Discontinued products
  const [discontinuedProducts, setDiscontinuedProducts] = useState<boolean | null>(null);
  const [discontinuedReason, setDiscontinuedReason] = useState('');

  // 15) Rent equipment
  const [rentEquipment, setRentEquipment] = useState<boolean | null>(null);
  const [withoutOperator, setWithoutOperator] = useState<boolean | null>(null);
  const [holdHarmlessAgreement, setHoldHarmlessAgreement] = useState<boolean | null>(null);

  // 16) Records / serial numbers / warranty
  const [tracingRecordsMaintained, setTracingRecordsMaintained] = useState<boolean | null>(null);
  const [recordsMaintainedHowLong, setRecordsMaintainedHowLong] = useState('');

  // 17) Recall plan
  const [recallPlan, setRecallPlan] = useState<boolean | null>(null);
  const [recallInsurance, setRecallInsurance] = useState<boolean | null>(null);
  const [recallMeansDisposal, setRecallMeansDisposal] = useState('');

  // 18) Recall event history
  const [recallEvent, setRecallEvent] = useState<boolean | null>(null);
  const [recallDate, setRecallDate] = useState('');
  const [recallType, setRecallType] = useState<string>(''); // Voluntary or Ordered
  const [recallAgency, setRecallAgency] = useState('');
  const [recallProductsInvolved, setRecallProductsInvolved] = useState('');
  const [recallReasonDiscovery, setRecallReasonDiscovery] = useState('');
  const [recallRemedy, setRecallRemedy] = useState('');
  const [recallPercentReturned, setRecallPercentReturned] = useState('');

  // 19) Present situations causing recall
  const [presentSituationsRecall, setPresentSituationsRecall] = useState<boolean | null>(null);
  const [presentSituationsDetails, setPresentSituationsDetails] = useState('');

  // 20) Cited by regulatory agency
  const [citedByAgency, setCitedByAgency] = useState<boolean | null>(null);
  const [citedAgencyDetails, setCitedAgencyDetails] = useState('');

  // 21) Product liability claims
  const [productLiabilityClaims, setProductLiabilityClaims] = useState<boolean | null>(null);
  const [productLiabilityExplanation, setProductLiabilityExplanation] = useState('');

  // 22) Canceled or non-renewed in past 5 years
  const [canceledNonRenewed, setCanceledNonRenewed] = useState<boolean | null>(null);
  const [canceledNonRenewedDetails, setCanceledNonRenewedDetails] = useState('');

  // 23) Aware of occurrences / potential claims
  const [awareOfOccurrences, setAwareOfOccurrences] = useState<boolean | null>(null);
  const [awareOfOccurrencesDetails, setAwareOfOccurrencesDetails] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle Industry checkbox
  const toggleIndustry = (ind: string) => {
    setIndustries(prev => prev.includes(ind) ? prev.filter(i => i !== ind) : [...prev, ind]);
  };

  // Format Phone Number
  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Check public token
  useEffect(() => {
    if (publicToken) {
      setIsVerifyingLink(true);
      fetch(`/api/public/links/verify?token=${publicToken}&expectedProgramId=manufacturers`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsPublicLink(true);
            if (data.payload?.agentName) {
              setAgencyAgent(data.payload.agentName);
            }
          } else {
            setLinkError(data.error || "This link is invalid or has expired.");
          }
        })
        .catch(() => {
          setLinkError("Unable to verify link. Please try again or contact your agent.");
        })
        .finally(() => {
          setIsVerifyingLink(false);
        });
    }
  }, [publicToken]);

  // Load existing submission if edit/view mode
  useEffect(() => {
    if (submissionId && (isViewMode || isEditMode)) {
      fetch(`/api/agency/submissions/${submissionId}`)
        .then(res => res.json())
        .then(data => {
          const sub = data.submission || data;
          if (sub && sub.payload) {
            const p = sub.payload;
            setNamedInsured(p.namedInsured || sub.clientContact?.name || '');
            setBrokerage(p.brokerage || '');
            setAgencyAgent(p.agencyAgent || sub.agentName || '');
            setIsRenewal(p.isRenewal ?? null);
            setPolicyNumber(p.policyNumber || '');
            setEffectiveDate(p.effectiveDate || '');
            setWebsite(p.website || '');

            setCarrier(p.carrier || '');
            setLimitOfInsurance(p.limitOfInsurance || '');
            setDeductible(p.deductible || '');
            setPremium(p.premium || '');
            setOfferingRenewal(p.offeringRenewal ?? null);
            setClaimsMade(p.claimsMade ?? null);
            setRetroactiveDate(p.retroactiveDate || '');

            setMailingAddress(p.mailingAddress || p.streetAddress || '');
            setMailingCity(p.mailingCity || p.city || '');
            setMailingState(p.mailingState || p.state || '');
            setMailingZip(p.mailingZip || p.zip || '');

            setSameAsMailing(p.sameAsMailing ?? false);
            setPremiseAddress(p.premiseAddress || '');
            setPremiseCity(p.premiseCity || '');
            setPremiseState(p.premiseState || '');
            setPremiseZip(p.premiseZip || '');

            setSalesUpcoming(p.salesUpcoming || '');
            setSalesLast12(p.salesLast12 || '');
            setSalesOneYearPrior(p.salesOneYearPrior || '');
            setSalesTwoYearsPrior(p.salesTwoYearsPrior || '');
            setSalesThreeYearsPrior(p.salesThreeYearsPrior || '');

            setAuditContact(p.auditContact || '');
            setAuditPhone(p.auditPhone || p.phone || '');
            setAuditEmail(p.auditEmail || p.email || '');

            // Pages 2 & 3
            setIndustries(p.industries || []);
            setExcludedProducts(p.excludedProducts || '');
            setCoveredElsewhere(p.coveredElsewhere ?? null);
            setNewProducts(p.newProducts ?? null);
            setNewProductsDetails(p.newProductsDetails || '');
            setIdentifiedCompetitors(p.identifiedCompetitors ?? null);
            setIdentifiedHow(p.identifiedHow || '');
            setImportProducts(p.importProducts ?? null);
            setAiVendorStatus(p.aiVendorStatus ?? null);
            setDomesticCarrier(p.domesticCarrier ?? null);
            setOffPremiseOps(p.offPremiseOps ?? null);
            setOffPremiseClarify(p.offPremiseClarify || '');
            setHireSubcontractors(p.hireSubcontractors ?? null);
            setCollectCoi(p.collectCoi ?? null);
            setCondoTownhouseWork(p.condoTownhouseWork ?? null);
            setDiscontinuedProducts(p.discontinuedProducts ?? null);
            setDiscontinuedReason(p.discontinuedReason || '');
            setRentEquipment(p.rentEquipment ?? null);
            setWithoutOperator(p.withoutOperator ?? null);
            setHoldHarmlessAgreement(p.holdHarmlessAgreement ?? null);
            setTracingRecordsMaintained(p.tracingRecordsMaintained ?? null);
            setRecordsMaintainedHowLong(p.recordsMaintainedHowLong || '');

            setRecallPlan(p.recallPlan ?? null);
            setRecallInsurance(p.recallInsurance ?? null);
            setRecallMeansDisposal(p.recallMeansDisposal || '');
            setRecallEvent(p.recallEvent ?? null);
            setRecallDate(p.recallDate || '');
            setRecallType(p.recallType || '');
            setRecallAgency(p.recallAgency || '');
            setRecallProductsInvolved(p.recallProductsInvolved || '');
            setRecallReasonDiscovery(p.recallReasonDiscovery || '');
            setRecallRemedy(p.recallRemedy || '');
            setRecallPercentReturned(p.recallPercentReturned || '');
            setPresentSituationsRecall(p.presentSituationsRecall ?? null);
            setPresentSituationsDetails(p.presentSituationsDetails || '');
            setCitedByAgency(p.citedByAgency ?? null);
            setCitedAgencyDetails(p.citedAgencyDetails || '');
            setProductLiabilityClaims(p.productLiabilityClaims ?? null);
            setProductLiabilityExplanation(p.productLiabilityExplanation || '');
            setCanceledNonRenewed(p.canceledNonRenewed ?? null);
            setCanceledNonRenewedDetails(p.canceledNonRenewedDetails || '');
            setAwareOfOccurrences(p.awareOfOccurrences ?? null);
            setAwareOfOccurrencesDetails(p.awareOfOccurrencesDetails || '');
          }
        })
        .catch(err => console.error("Error loading submission:", err));
    }
  }, [submissionId, isViewMode, isEditMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!namedInsured.trim()) {
      toast.error("Please enter the Named Insured");
      return;
    }
    if (!agencyAgent.trim()) {
      toast.error("Please select or enter the Agency/Agent name");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        namedInsured,
        companyName: namedInsured,
        brokerage,
        agencyAgent,
        agentName: agencyAgent,
        isRenewal,
        policyNumber,
        effectiveDate,
        website,
        carrier,
        limitOfInsurance,
        deductible,
        premium,
        offeringRenewal,
        claimsMade,
        retroactiveDate,
        mailingAddress,
        streetAddress: mailingAddress || premiseAddress,
        mailingCity,
        city: mailingCity || premiseCity,
        mailingState,
        state: mailingState || premiseState || 'CA',
        mailingZip,
        zip: mailingZip || premiseZip,
        sameAsMailing,
        premiseAddress: sameAsMailing ? mailingAddress : premiseAddress,
        premiseCity: sameAsMailing ? mailingCity : premiseCity,
        premiseState: sameAsMailing ? mailingState : premiseState,
        premiseZip: sameAsMailing ? mailingZip : premiseZip,
        salesUpcoming,
        salesLast12,
        salesOneYearPrior,
        salesTwoYearsPrior,
        salesThreeYearsPrior,
        auditContact,
        auditPhone,
        phone: auditPhone || '000-000-0000',
        auditEmail,
        email: auditEmail || 'unknown@example.com',
        hasLossRunsAttachment: !!lossRunsFile,
        hasBrochureAttachment: !!brochureFile,

        // Page 2 fields
        industries,
        excludedProducts,
        coveredElsewhere,
        newProducts,
        newProductsDetails,
        identifiedCompetitors,
        identifiedHow,
        importProducts,
        aiVendorStatus,
        domesticCarrier,
        offPremiseOps,
        offPremiseClarify,
        hireSubcontractors,
        collectCoi,
        condoTownhouseWork,
        discontinuedProducts,
        discontinuedReason,
        rentEquipment,
        withoutOperator,
        holdHarmlessAgreement,
        tracingRecordsMaintained,
        recordsMaintainedHowLong,

        // Page 3 fields
        recallPlan,
        recallInsurance,
        recallMeansDisposal,
        recallEvent,
        recallDate,
        recallType,
        recallAgency,
        recallProductsInvolved,
        recallReasonDiscovery,
        recallRemedy,
        recallPercentReturned,
        presentSituationsRecall,
        presentSituationsDetails,
        citedByAgency,
        citedAgencyDetails,
        productLiabilityClaims,
        productLiabilityExplanation,
        canceledNonRenewed,
        canceledNonRenewedDetails,
        awareOfOccurrences,
        awareOfOccurrencesDetails,
      };

      let response;
      if (isPublicLink) {
        response = await fetch("/api/public/applications/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId: "manufacturers",
            programName: "Manufacturers / Distributors",
            formData: payload,
            token: publicToken,
          }),
        });
      } else if (isEditMode && submissionId) {
        response = await fetch(`/api/agency/submissions/${submissionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            payload: payload,
          }),
        });
      } else {
        response = await fetch("/api/agency/applications/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId: "manufacturers",
            programName: "Manufacturers / Distributors",
            formData: payload,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit application");
      }

      toast.success(isEditMode ? "Application updated successfully!" : "Application submitted successfully!");

      setTimeout(() => {
        if (isPublicLink) {
          window.location.href = "/application-success";
        } else if (isEditMode && submissionId) {
          router.refresh();
          if ((session?.user as any)?.role === "system_admin") {
            router.push(`/admin/submissions/${submissionId}?updated=true`);
          } else {
            router.push(`/agency/submissions/${submissionId}?updated=true`);
          }
        } else {
          router.refresh();
          router.push("/agency/dashboard");
        }
      }, 1500);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "loading" || isVerifyingLink) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#7A6F64] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-500 font-medium text-sm">Loading Application...</p>
        </div>
      </div>
    );
  }

  if (publicToken && linkError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow text-center max-w-md border border-gray-200">
          <h2 className="text-2xl font-semibold text-red-600 mb-2">Link Invalid</h2>
          <p className="text-gray-600 mb-6">{linkError}</p>
          <p className="text-sm text-gray-400">Please contact your agent for a new link.</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" && !publicToken) return null;

  return (
    <div className="min-h-screen bg-gray-100 pb-28">
      {/* Back Navigation Button */}
      <div className="py-4 px-6">
        <button
          type="button"
          onClick={() => router.push("/agency/marketplace")}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Marketplace
        </button>
      </div>

      <div className="max-w-[980px] mx-auto px-4">
        {/* Title Header Card */}
        {/* <div className="bg-white rounded shadow-md border border-gray-200 p-6 mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 uppercase tracking-tight">
            MANUFACTURERS/DISTRIBUTORS SUPPLEMENTAL APPLICATION
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide mt-2">
            ATTACH ADDITIONAL SHEETS AS NECESSARY.
          </p>
          <p className="text-xs md:text-sm font-semibold text-gray-600 uppercase tracking-wide">
            ANSWER ALL QUESTIONS. If not applicable, indicate N/A.
          </p>
        </div> */}

        <form id="manufacturers-form" onSubmit={handleSubmit}>
          <fieldset disabled={isViewMode} className="contents">

            {/* ═══ 1. General Information ═══════════════════════════ */}
            <Section title="General Information">
              <Row label="Named Insured" bold required>
                <input
                  type="text"
                  required
                  value={namedInsured}
                  onChange={e => setNamedInsured(e.target.value)}
                  placeholder="Named Insured"
                  className={inp}
                />
              </Row>

              <Row label="Brokerage/Broker" bold>
                <input
                  type="text"
                  value={brokerage}
                  onChange={e => setBrokerage(e.target.value)}
                  placeholder="Brokerage / Broker"
                  className={inp}
                />
              </Row>

              <Row label="Agency/Agent" bold required>
                {agentOptions.length > 0 ? (
                  <select
                    value={agencyAgent}
                    onChange={e => setAgencyAgent(e.target.value)}
                    className={sel}
                  >
                    <option value="">Select Agent</option>
                    {agentOptions.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    required
                    value={agencyAgent}
                    onChange={e => setAgencyAgent(e.target.value)}
                    placeholder="Agency / Agent"
                    className={inp}
                  />
                )}
              </Row>

              <Row label="Renewal?" bold>
                <YesNo
                  name="renewalRadio"
                  value={isRenewal}
                  onChange={setIsRenewal}
                />
              </Row>

              <Row label="Policy Number" bold>
                <input
                  type="text"
                  value={policyNumber}
                  onChange={e => setPolicyNumber(e.target.value)}
                  placeholder="Policy Number"
                  className={inp}
                />
              </Row>

              <Row label="Effective Date" bold>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className={inp}
                />
              </Row>

              <Row label="Website" bold>
                <input
                  type="text"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://www.example.com"
                  className={inp}
                />
              </Row>
            </Section>

            {/* ═══ 2. Current Carrier Information ═════════════════════ */}
            <Section title="Current Carrier Information">
              <Row label="Carrier" bold>
                <input
                  type="text"
                  value={carrier}
                  onChange={e => setCarrier(e.target.value)}
                  placeholder="Carrier name"
                  className={inp}
                />
              </Row>

              <Row label="Limit of Insurance" bold>
                <CurrencyInp
                  value={limitOfInsurance}
                  onChange={setLimitOfInsurance}
                  placeholder="1,000,000"
                />
              </Row>

              <Row label="Deductible" bold>
                <CurrencyInp
                  value={deductible}
                  onChange={setDeductible}
                  placeholder="5,000"
                />
              </Row>

              <Row label="Premium" bold>
                <CurrencyInp
                  value={premium}
                  onChange={setPremium}
                  placeholder="10,000"
                />
              </Row>

              <Row label="Offering renewal?" bold>
                <YesNo
                  name="offeringRenewalRadio"
                  value={offeringRenewal}
                  onChange={setOfferingRenewal}
                />
              </Row>

              <Row label="Claims made?" bold>
                <YesNo
                  name="claimsMadeRadio"
                  value={claimsMade}
                  onChange={setClaimsMade}
                />
              </Row>

              <Row label="Retroactive date" bold>
                <input
                  type="date"
                  value={retroactiveDate}
                  onChange={e => setRetroactiveDate(e.target.value)}
                  className={inp}
                />
              </Row>

              {/* Attachments */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-sm font-semibold italic text-gray-700 mb-3">
                  Please attach copies of the following:
                </p>

                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm text-gray-700 italic flex-1">
                      a) Currently valued five year loss runs, including claim detail for all losses open or exceeding $15,000
                    </span>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded cursor-pointer transition-colors shrink-0 shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span>{lossRunsFile ? lossRunsFile.name : "Choose File"}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setLossRunsFile(e.target.files[0]);
                            toast.success(`Attached: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-gray-50 rounded border border-gray-200">
                    <span className="text-sm text-gray-700 italic flex-1">
                      b) Applicant's product brochure, catalog, or marketing materials if a website is not available
                    </span>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded cursor-pointer transition-colors shrink-0 shadow-sm">
                      <Upload className="w-3.5 h-3.5 text-gray-500" />
                      <span>{brochureFile ? brochureFile.name : "Choose File"}</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={e => {
                          if (e.target.files && e.target.files[0]) {
                            setBrochureFile(e.target.files[0]);
                            toast.success(`Attached: ${e.target.files[0].name}`);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </Section>

            {/* ═══ 3. Mailing Address ═════════════════════════════════ */}
            <Section title="Mailing Address">
              <Row label="Mailing Address" bold>
                <input
                  type="text"
                  value={mailingAddress}
                  onChange={e => setMailingAddress(e.target.value)}
                  placeholder="Street Address"
                  className={inp}
                />
              </Row>
              <Row label="City" bold>
                <input
                  type="text"
                  value={mailingCity}
                  onChange={e => setMailingCity(e.target.value)}
                  placeholder="City"
                  className={inp}
                />
              </Row>
              <Row label="State" bold>
                <input
                  type="text"
                  value={mailingState}
                  onChange={e => setMailingState(e.target.value)}
                  placeholder="State (e.g. CA)"
                  className={inp}
                />
              </Row>
              <Row label="Zip Code" bold>
                <input
                  type="text"
                  value={mailingZip}
                  onChange={e => setMailingZip(e.target.value)}
                  placeholder="90210"
                  className={inp}
                />
              </Row>
            </Section>

            {/* ═══ 4. Premise Address (if different from above) ═══════ */}
            <Section title="Premise Address (if different from above)">
              <div className="py-2 border-b border-gray-100">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsMailing}
                    onChange={e => setSameAsMailing(e.target.checked)}
                    className="w-4 h-4 accent-[#7A6F64] rounded"
                  />
                  <span className="text-sm font-semibold text-gray-700">Same as mailing address</span>
                </label>
              </div>

              {!sameAsMailing && (
                <div className="space-y-6 pt-2">
                  <Row label="Premise Address" bold>
                    <input
                      type="text"
                      value={premiseAddress}
                      onChange={e => setPremiseAddress(e.target.value)}
                      placeholder="Premise Street Address"
                      className={inp}
                    />
                  </Row>
                  <Row label="City" bold>
                    <input
                      type="text"
                      value={premiseCity}
                      onChange={e => setPremiseCity(e.target.value)}
                      placeholder="City"
                      className={inp}
                    />
                  </Row>
                  <Row label="State" bold>
                    <input
                      type="text"
                      value={premiseState}
                      onChange={e => setPremiseState(e.target.value)}
                      placeholder="State (e.g. CA)"
                      className={inp}
                    />
                  </Row>
                  <Row label="Zip Code" bold>
                    <input
                      type="text"
                      value={premiseZip}
                      onChange={e => setPremiseZip(e.target.value)}
                      placeholder="90210"
                      className={inp}
                    />
                  </Row>
                </div>
              )}
            </Section>

            {/* ═══ 5. Sales Information Table ════════════════════════ */}
            <Section title="Sales Information">
              <p className="text-sm font-semibold text-gray-800">
                Please complete the below table regarding your sales:
              </p>

              <div className="overflow-x-auto border border-gray-200 rounded">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-[#7A6F64] text-white">
                    <tr>
                      <th className="p-3 border-r border-white/20 text-center font-semibold text-xs md:text-sm">Upcoming Year (est.):</th>
                      <th className="p-3 border-r border-white/20 text-center font-semibold text-xs md:text-sm">Last 12 Months:</th>
                      <th className="p-3 border-r border-white/20 text-center font-semibold text-xs md:text-sm">One Year Prior:</th>
                      <th className="p-3 border-r border-white/20 text-center font-semibold text-xs md:text-sm">Two Years Prior:</th>
                      <th className="p-3 text-center font-semibold text-xs md:text-sm">Three Years Prior:</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-white">
                      <td className="p-2 border-r border-gray-200">
                        <CurrencyInp
                          value={salesUpcoming}
                          onChange={setSalesUpcoming}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <CurrencyInp
                          value={salesLast12}
                          onChange={setSalesLast12}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <CurrencyInp
                          value={salesOneYearPrior}
                          onChange={setSalesOneYearPrior}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2 border-r border-gray-200">
                        <CurrencyInp
                          value={salesTwoYearsPrior}
                          onChange={setSalesTwoYearsPrior}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="p-2">
                        <CurrencyInp
                          value={salesThreeYearsPrior}
                          onChange={setSalesThreeYearsPrior}
                          placeholder="0.00"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* ═══ 6. Audit/Inspection Contact ═══════════════════════ */}
            <Section title="Audit / Inspection Contact">
              <Row label="Audit/Inspection contact" bold>
                <input
                  type="text"
                  value={auditContact}
                  onChange={e => setAuditContact(e.target.value)}
                  placeholder="Contact Name"
                  className={inp}
                />
              </Row>

              <Row label="a. Phone number" bold>
                <input
                  type="tel"
                  value={auditPhone}
                  onChange={e => setAuditPhone(formatPhoneNumber(e.target.value))}
                  placeholder="(555) 000-0000"
                  className={inp}
                />
              </Row>

              <Row label="b. Email" bold>
                <input
                  type="email"
                  value={auditEmail}
                  onChange={e => setAuditEmail(e.target.value)}
                  placeholder="contact@example.com"
                  className={inp}
                />
              </Row>
            </Section>

            {/* ═══ 7 - 16. Products & Operations (Page 2) ═════════════ */}
            <Section title="Products & Operations">

              {/* Question 7: Industry Checkboxes */}
              <div className="pb-5 border-b border-gray-100">
                <p className="text-sm font-bold text-gray-900 mb-3">
                  7) Are any of your products used in any of the following industries?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-gray-50 p-4 rounded border border-gray-200">
                  {INDUSTRY_OPTIONS.map(ind => (
                    <label key={ind} className="flex items-center gap-2.5 text-xs md:text-sm text-gray-800 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={industries.includes(ind)}
                        onChange={() => toggleIndustry(ind)}
                        className="w-4 h-4 accent-[#7A6F64] rounded"
                      />
                      <span>{ind}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs italic text-amber-800 mt-2.5">
                  If any of the above are indicated, please complete the specialty Kinsale Supplemental Application for the indicated class instead of this application.
                </p>
              </div>

              {/* Question 8 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <label className="text-sm font-bold text-gray-900 block">
                  8) If any subsidiary, product or product group is to be specifically excluded from coverage, please indicate:
                </label>
                <input
                  type="text"
                  value={excludedProducts}
                  onChange={e => setExcludedProducts(e.target.value)}
                  placeholder="Enter excluded subsidiaries or products (or N/A)"
                  className={inp}
                />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 pl-2">
                  <span className="text-sm text-gray-700 font-medium">a. Are these products covered elsewhere?</span>
                  <YesNo
                    name="q8_coveredElsewhere"
                    value={coveredElsewhere}
                    onChange={setCoveredElsewhere}
                  />
                </div>
              </div>

              {/* Question 9 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    9) Are any new products to be introduced during the next year?
                  </label>
                  <YesNo
                    name="q9_newProducts"
                    value={newProducts}
                    onChange={setNewProducts}
                  />
                </div>
                {newProducts === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">a. If Yes, please provide details:</label>
                    <textarea
                      rows={3}
                      value={newProductsDetails}
                      onChange={e => setNewProductsDetails(e.target.value)}
                      placeholder="Provide details about new products..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

              {/* Question 10 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    10) Can your products be identified from those of your competitors?
                  </label>
                  <YesNo
                    name="q10_identifiedCompetitors"
                    value={identifiedCompetitors}
                    onChange={setIdentifiedCompetitors}
                  />
                </div>
                {identifiedCompetitors === true && (
                  <div className="pl-2 flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 sm:w-28 shrink-0">a. If Yes, how?</label>
                    <input
                      type="text"
                      value={identifiedHow}
                      onChange={e => setIdentifiedHow(e.target.value)}
                      placeholder="e.g. Serial numbers, logos, distinct casing"
                      className={inp}
                    />
                  </div>
                )}
              </div>

              {/* Question 11 */}
              <div className="py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-sm font-bold text-gray-900">
                  11) Do you import any products or components?
                </label>
                <YesNo
                  name="q11_importProducts"
                  value={importProducts}
                  onChange={setImportProducts}
                />
              </div>

              {/* Question 12 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    12) Does any manufacturer grant you AI Vendor status for products that you distribute?
                  </label>
                  <YesNo
                    name="q12_aiVendorStatus"
                    value={aiVendorStatus}
                    onChange={setAiVendorStatus}
                  />
                </div>
                {aiVendorStatus === true && (
                  <div className="pl-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-semibold text-gray-700">
                      a. If Yes, is the manufacturer's policy from a domestic/ US based carrier?
                    </span>
                    <YesNo
                      name="q12_domesticCarrier"
                      value={domesticCarrier}
                      onChange={setDomesticCarrier}
                    />
                  </div>
                )}
              </div>

              {/* Question 13 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    13) Do you have any installation, service, or repair operations that occur off of your premise(s)?
                  </label>
                  <YesNo
                    name="q13_offPremiseOps"
                    value={offPremiseOps}
                    onChange={setOffPremiseOps}
                  />
                </div>

                {offPremiseOps === true && (
                  <div className="pl-2 space-y-3 pt-1">
                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">a. If yes, please clarify:</label>
                      <textarea
                        rows={2}
                        value={offPremiseClarify}
                        onChange={e => setOffPremiseClarify(e.target.value)}
                        placeholder="Clarify off-premise operations..."
                        className={textareaStyle}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">
                        b. Do you hire subcontractors to perform any work on your behalf?
                      </span>
                      <YesNo
                        name="q13_hireSubcontractors"
                        value={hireSubcontractors}
                        onChange={setHireSubcontractors}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">
                        c. Do you collect certificates of insurance from all subcontractors prior to the beginning of work?
                      </span>
                      <YesNo
                        name="q13_collectCoi"
                        value={collectCoi}
                        onChange={setCollectCoi}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">
                        d. Do you have any work performed in condominiums, apartment to condo, conversions, townhouses, or tract housing?
                      </span>
                      <YesNo
                        name="q13_condoTownhouseWork"
                        value={condoTownhouseWork}
                        onChange={setCondoTownhouseWork}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Question 14 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    14) Do you have any discontinued products?
                  </label>
                  <YesNo
                    name="q14_discontinuedProducts"
                    value={discontinuedProducts}
                    onChange={setDiscontinuedProducts}
                  />
                </div>
                {discontinuedProducts === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      If Yes, please explain the reasons for discontinuing:
                    </label>
                    <textarea
                      rows={2}
                      value={discontinuedReason}
                      onChange={e => setDiscontinuedReason(e.target.value)}
                      placeholder="Explain reasons for discontinuing..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

              {/* Question 15 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    15) Do you rent any equipment?
                  </label>
                  <YesNo
                    name="q15_rentEquipment"
                    value={rentEquipment}
                    onChange={setRentEquipment}
                  />
                </div>
                {rentEquipment === true && (
                  <div className="pl-2 space-y-2 pt-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">
                        a. If Yes, are all rentals without operator?
                      </span>
                      <YesNo
                        name="q15_withoutOperator"
                        value={withoutOperator}
                        onChange={setWithoutOperator}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-medium text-gray-800">
                        b. Do you have a rental agreement with hold harmless wording in your favor?
                      </span>
                      <YesNo
                        name="q15_holdHarmlessAgreement"
                        value={holdHarmlessAgreement}
                        onChange={setHoldHarmlessAgreement}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Question 16 */}
              <div className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    16) Are batch or product records, serial numbers or copies of guarantee/warranty cards maintained that would facilitate tracing whereabouts of products?
                  </label>
                  <YesNo
                    name="q16_tracingRecordsMaintained"
                    value={tracingRecordsMaintained}
                    onChange={setTracingRecordsMaintained}
                  />
                </div>
                {tracingRecordsMaintained === true && (
                  <div className="pl-2 flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 sm:w-64 shrink-0">
                      If Yes, confirm how long these records are maintained:
                    </label>
                    <input
                      type="text"
                      value={recordsMaintainedHowLong}
                      onChange={e => setRecordsMaintainedHowLong(e.target.value)}
                      placeholder="e.g. 7 years, indefinitely"
                      className={inp}
                    />
                  </div>
                )}
              </div>

            </Section>

            {/* ═══ 17 - 20. Product Recall (Page 3) ═══════════════════ */}
            <Section title="Product Recall History & Risk">

              {/* Question 17 */}
              <div className="pb-5 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    17) In the event that it becomes necessary to recall a product, do you have a recall plan in place?
                  </label>
                  <YesNo
                    name="q17_recallPlan"
                    value={recallPlan}
                    onChange={setRecallPlan}
                  />
                </div>

                <div className="pl-2 space-y-3 pt-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-medium text-gray-800">
                      a. Do you have Product Recall insurance?
                    </span>
                    <YesNo
                      name="q17_recallInsurance"
                      value={recallInsurance}
                      onChange={setRecallInsurance}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-800 block mb-1">
                      b. What means would be used to secure the return and disposal of the product?
                    </label>
                    <textarea
                      rows={2}
                      value={recallMeansDisposal}
                      onChange={e => setRecallMeansDisposal(e.target.value)}
                      placeholder="Describe means used for return and disposal..."
                      className={textareaStyle}
                    />
                  </div>
                </div>
              </div>

              {/* Question 18 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    18) Have you ever had a product recall event?
                  </label>
                  <YesNo
                    name="q18_recallEvent"
                    value={recallEvent}
                    onChange={setRecallEvent}
                  />
                </div>

                {recallEvent === true && (
                  <div className="pl-2 space-y-3.5 pt-1 bg-gray-50 p-4 rounded border border-gray-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">a. Date of recall(s):</label>
                        <input
                          type="date"
                          value={recallDate}
                          onChange={e => setRecallDate(e.target.value)}
                          className={inp}
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-gray-700 block mb-1">b. Type of Recall & Agency:</label>
                        <div className="flex items-center gap-4 text-xs font-medium text-gray-700 min-h-[38px]">
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="q18_recallType"
                              checked={recallType === 'Voluntary'}
                              onChange={() => setRecallType('Voluntary')}
                              className="w-4 h-4 accent-[#7A6F64]"
                            />
                            Voluntary
                          </label>
                          <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                              type="radio"
                              name="q18_recallType"
                              checked={recallType === 'Ordered'}
                              onChange={() => setRecallType('Ordered')}
                              className="w-4 h-4 accent-[#7A6F64]"
                            />
                            Ordered
                          </label>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">By what agency?</label>
                      <input
                        type="text"
                        value={recallAgency}
                        onChange={e => setRecallAgency(e.target.value)}
                        placeholder="e.g. FDA, CPSC, NHTSA"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">c. Product(s) involved:</label>
                      <textarea
                        rows={2}
                        value={recallProductsInvolved}
                        onChange={e => setRecallProductsInvolved(e.target.value)}
                        placeholder="Products involved in recall..."
                        className={textareaStyle}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">d. Reason for recall and how discovered:</label>
                      <input
                        type="text"
                        value={recallReasonDiscovery}
                        onChange={e => setRecallReasonDiscovery(e.target.value)}
                        placeholder="Reason for recall and how discovered"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">e. What was the remedy of the problem?</label>
                      <input
                        type="text"
                        value={recallRemedy}
                        onChange={e => setRecallRemedy(e.target.value)}
                        placeholder="Remedy description"
                        className={inp}
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-gray-700 block mb-1">f. What percentage of recalled goods were returned/repaired?</label>
                      <input
                        type="text"
                        value={recallPercentReturned}
                        onChange={e => setRecallPercentReturned(e.target.value)}
                        placeholder="e.g. 95%"
                        className={inp}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Question 19 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    19) Are there any present situations that might give rise to an incident causing a product recall?
                  </label>
                  <YesNo
                    name="q19_presentSituationsRecall"
                    value={presentSituationsRecall}
                    onChange={setPresentSituationsRecall}
                  />
                </div>
                {presentSituationsRecall === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">If Yes, please provide details:</label>
                    <textarea
                      rows={2}
                      value={presentSituationsDetails}
                      onChange={e => setPresentSituationsDetails(e.target.value)}
                      placeholder="Provide details..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

              {/* Question 20 */}
              <div className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    20) Have you been cited by any regulatory agency for violations arising out of business activity involving your product?
                  </label>
                  <YesNo
                    name="q20_citedByAgency"
                    value={citedByAgency}
                    onChange={setCitedByAgency}
                  />
                </div>
                {citedByAgency === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">a. If yes, please provide details:</label>
                    <textarea
                      rows={2}
                      value={citedAgencyDetails}
                      onChange={e => setCitedAgencyDetails(e.target.value)}
                      placeholder="Provide details of regulatory citations..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

            </Section>

            {/* ═══ 21 - 23. Claims & History (Page 3) ═════════════════ */}
            <Section title="Claims & Insurance History">

              {/* Question 21 */}
              <div className="pb-5 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900">
                    21) Have you had any Product Liability claims that were or were not covered by insurance?
                  </label>
                  <YesNo
                    name="q21_productLiabilityClaims"
                    value={productLiabilityClaims}
                    onChange={setProductLiabilityClaims}
                  />
                </div>
                {productLiabilityClaims === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      If yes, please attach an explanation:
                    </label>
                    <textarea
                      rows={3}
                      value={productLiabilityExplanation}
                      onChange={e => setProductLiabilityExplanation(e.target.value)}
                      placeholder="Provide explanation of product liability claims..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

              {/* Question 22 */}
              <div className="py-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900 pr-4 leading-snug">
                    22) During the past five years, has any insurer ever canceled or non-renewed similar insurance to any applicant or has your insurance been canceled for nonpayment of premium by any insurance or finance company? If yes, please attach details.
                  </label>
                  <YesNo
                    name="q22_canceledNonRenewed"
                    value={canceledNonRenewed}
                    onChange={setCanceledNonRenewed}
                  />
                </div>
                {canceledNonRenewed === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Please provide details:
                    </label>
                    <textarea
                      rows={3}
                      value={canceledNonRenewedDetails}
                      onChange={e => setCanceledNonRenewedDetails(e.target.value)}
                      placeholder="Provide details about cancelation or non-renewal..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

              {/* Question 23 */}
              <div className="py-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <label className="text-sm font-bold text-gray-900 pr-4 leading-snug">
                    23) Is your company aware of any occurrences, facts, circumstances, incidents, situations, damages or accidents (including but not limited to allegations of faulty or defective products, product failure, product dispute bodily injury or property damage) arising out of or related to your products that a reasonably prudent person might expect to give rise to a claim or lawsuit whether valid or not which might directly or indirectly involve the company? If yes, please attach details.
                  </label>
                  <YesNo
                    name="q23_awareOfOccurrences"
                    value={awareOfOccurrences}
                    onChange={setAwareOfOccurrences}
                  />
                </div>
                {awareOfOccurrences === true && (
                  <div className="pl-2 pt-1">
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Please provide details:
                    </label>
                    <textarea
                      rows={3}
                      value={awareOfOccurrencesDetails}
                      onChange={e => setAwareOfOccurrencesDetails(e.target.value)}
                      placeholder="Provide details about known occurrences or incidents..."
                      className={textareaStyle}
                    />
                  </div>
                )}
              </div>

            </Section>

          </fieldset>
        </form>

        {/* ═══ Fixed Bottom Action Bar ═══════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-50 shadow-md">
          <button
            type="button"
            onClick={() => router.push("/agency/marketplace")}
            className="px-6 py-2.5 border border-gray-400 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            Return to Marketplace
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2.5 border border-gray-400 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>

            {!isViewMode && (
              <button
                type="submit"
                form="manufacturers-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors disabled:opacity-50 shadow-sm"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSubmitting ? "Submitting..." : isEditMode ? "Update Application" : "Submit Application"}</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function ManufacturersPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#7A6F64] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-500 font-medium text-sm">Loading Application...</p>
          </div>
        </div>
      }
    >
      <ManufacturersContent />
    </Suspense>
  );
}
