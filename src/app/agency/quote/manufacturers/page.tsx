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
  "Machinery / Industrial Equipment",
  "Machine Shops / Fabricated Metal Products",
  "Construction Tools & Equipment",
  "Agricultural Equipment / Parts",
  "Consumer Appliances",
  "Electronics / Electrical Products",
  "Imported Consumer Goods",
  "Furniture / Home Furnishings",
  "Clothing / Apparel / Accessories",
  "Toys / Games / Children’s Products",
  "Infant / Juvenile Products",
  "Sporting Goods / Recreational Equipment",
  "Exercise / Fitness Equipment",
  "Playground Equipment",
  "Helmets / Protective Equipment",
  "Motorcycles / Scooters / E-Bikes",
  "Food Products / Food Processing",
  "Beverage Products",
  "Nutraceuticals / Dietary Supplements",
  "Cosmetics / Beauty / Personal Care Products",
  "Class I Medical Devices",
  "Class II Medical Devices",
  "Veterinary Products / Animal Health Products",
  "Pet Food / Pet Products",
  "Chemicals / Chemical Products",
  "Paints / Coatings / Solvents / Adhesives",
  "Cannabis / Marijuana Products",
  "CBD / Hemp Products",
  "Tobacco / Smoking Products",
  "Electronic Cigarettes / Vaping Products",
  "Firearms / Ammunition",
  "Body Armor / Ballistic Products",
  "Other Consumer Products",
  "Other Commercial / Industrial Products"
];

const toInputDateFormat = (val?: string) => {
  if (!val) return '';
  const clean = String(val).trim();
  const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }
  const usMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, '0')}-${usMatch[2].padStart(2, '0')}`;
  }
  return clean;
};

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

  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa", "Juan Montoya"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];
  const TEXAS_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa", "Juan Montoya"];

  const baseAgents = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? TEXAS_AGENTS : [];

  // ================= Form State =================
  // 1) General Information
  const [agencyAgent, setAgencyAgent] = useState(userName || '');
  const agentOptions = Array.from(new Set([...baseAgents, ...(submissionId && agencyAgent ? [agencyAgent] : [])]));
  const [companyName, setCompanyName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [dba, setDba] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  // 2) Mailing Address
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

  // Address Autocomplete State
  const mailingSuggestionRef = useRef<HTMLDivElement>(null);
  const [mailingSuggestions, setMailingSuggestions] = useState<any[]>([]);
  const [showMailingSuggestions, setShowMailingSuggestions] = useState(false);
  const [mailingAddressLoading, setMailingAddressLoading] = useState(false);

  const premiseSuggestionRef = useRef<HTMLDivElement>(null);
  const [premiseSuggestions, setPremiseSuggestions] = useState<any[]>([]);
  const [showPremiseSuggestions, setShowPremiseSuggestions] = useState(false);
  const [premiseAddressLoading, setPremiseAddressLoading] = useState(false);

  const STATE_CODE_TO_NAME: Record<string, string> = {
    AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
    CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
    DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii",
    ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa", KS: "Kansas",
    KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
    MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
    MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
    NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
    NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma",
    OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
    SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
    VT: "Vermont", VA: "Virginia", WA: "Washington", WV: "West Virginia",
    WI: "Wisconsin", WY: "Wyoming",
  };

  const handleMailingAddressSearch = async (value: string) => {
    setMailingAddress(value);
    if (value.length < 3) {
      setMailingSuggestions([]);
      setShowMailingSuggestions(false);
      return;
    }
    setMailingAddressLoading(true);
    try {
      const res = await fetch(`/api/address/autocomplete?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      setMailingSuggestions(data.suggestions || []);
      setShowMailingSuggestions(true);
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setMailingAddressLoading(false);
    }
  };

  const handleSelectMailingSuggestion = (suggestion: any) => {
    const fullStateName = STATE_CODE_TO_NAME[suggestion.state] || suggestion.state;
    setMailingAddress(`${suggestion.street_line} ${suggestion.secondary || ''}`.trim());
    setMailingCity(suggestion.city);
    setMailingZip(suggestion.zipcode);
    setMailingState(fullStateName);
    setMailingSuggestions([]);
    setShowMailingSuggestions(false);
  };

  const handlePremiseAddressSearch = async (value: string) => {
    setPremiseAddress(value);
    if (value.length < 3) {
      setPremiseSuggestions([]);
      setShowPremiseSuggestions(false);
      return;
    }
    setPremiseAddressLoading(true);
    try {
      const res = await fetch(`/api/address/autocomplete?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      setPremiseSuggestions(data.suggestions || []);
      setShowPremiseSuggestions(true);
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setPremiseAddressLoading(false);
    }
  };

  const handleSelectPremiseSuggestion = (suggestion: any) => {
    const fullStateName = STATE_CODE_TO_NAME[suggestion.state] || suggestion.state;
    setPremiseAddress(`${suggestion.street_line} ${suggestion.secondary || ''}`.trim());
    setPremiseCity(suggestion.city);
    setPremiseZip(suggestion.zipcode);
    setPremiseState(fullStateName);
    setPremiseSuggestions([]);
    setShowPremiseSuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mailingSuggestionRef.current && !mailingSuggestionRef.current.contains(e.target as Node)) {
        setShowMailingSuggestions(false);
      }
      if (premiseSuggestionRef.current && !premiseSuggestionRef.current.contains(e.target as Node)) {
        setShowPremiseSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const [isIndustryDropdownOpen, setIsIndustryDropdownOpen] = useState(false);

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
            if (p.companyName) {
              setCompanyName(p.companyName);
            } else if (p.namedInsured) {
              setCompanyName(p.namedInsured);
            }
            if (p.firstName || p.lastName) {
              setFirstName(p.firstName || '');
              setLastName(p.lastName || '');
            } else if (p.namedInsured || sub.clientContact?.name) {
              const raw = (p.namedInsured || sub.clientContact?.name || '').trim();
              const parts = raw.split(' ');
              if (parts.length <= 1) {
                setFirstName(parts[0] || '');
                setLastName('');
              } else {
                setFirstName(parts.slice(0, -1).join(' '));
                setLastName(parts[parts.length - 1]);
              }
            }
            setDba(p.dba || '');
            setApplicantPhone(p.applicantPhone || p.phone || sub.clientContact?.phone || '');
            setApplicantEmail(p.applicantEmail || p.email || sub.clientContact?.email || '');
            setAgencyAgent(p.agencyAgent || sub.agentName || '');
            setEffectiveDate(toInputDateFormat(p.effectiveDate));

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
            setRecallDate(toInputDateFormat(p.recallDate));
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

    if (!agencyAgent.trim()) {
      toast.error("Please select or enter the Agency/Agent name");
      return;
    }
    if (!companyName.trim()) {
      toast.error("Please enter the Company Name");
      return;
    }
    if (!firstName.trim()) {
      toast.error("Please enter the First Name");
      return;
    }
    if (!lastName.trim()) {
      toast.error("Please enter the Last Name");
      return;
    }
    if (!applicantPhone.trim()) {
      toast.error("Please enter the Applicant Phone");
      return;
    }
    if (!applicantEmail.trim()) {
      toast.error("Please enter the Applicant Email");
      return;
    }

    setIsSubmitting(true);
    try {
      const fullName = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
      const trimmedCompanyName = companyName.trim();
      const payload = {
        companyName: trimmedCompanyName,
        namedInsured: trimmedCompanyName || fullName,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        applicantName: fullName || trimmedCompanyName,
        dba: dba.trim(),
        applicantPhone: applicantPhone.trim(),
        applicantEmail: applicantEmail.trim(),
        phone: applicantPhone.trim() || '000-000-0000',
        email: applicantEmail.trim() || 'unknown@example.com',
        agencyAgent,
        agentName: agencyAgent,
        effectiveDate,
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
        auditEmail,

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
            clientContact: {
              name: fullName || payload.namedInsured || payload.companyName,
              phone: applicantPhone.trim() || '000-000-0000',
              email: applicantEmail.trim() || 'unknown@example.com',
              businessAddress: {
                street: (mailingAddress || premiseAddress).trim(),
                city: (mailingCity || premiseCity).trim(),
                state: mailingState || premiseState || 'CA',
                zip: (mailingZip || premiseZip).trim(),
              }
            }
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
          onClick={() => {
            if (isEditMode || isViewMode) {
              window.close();
            } else {
              router.push("/agency/marketplace");
            }
          }}
          className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {isEditMode || isViewMode ? "Close" : "Back to Marketplace"}
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
              {/* 1. Agency/Agent */}
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

              {/* Company Name */}
              <Row label="Company Name" bold required>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  placeholder="Company Name"
                  className={inp}
                />
              </Row>

              {/* 2. First Name */}
              <Row label="First Name" bold required>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  placeholder="First Name"
                  className={inp}
                />
              </Row>

              {/* 3. Last Name */}
              <Row label="Last Name" bold required>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  placeholder="Last Name"
                  className={inp}
                />
              </Row>

              {/* 4. DBA */}
              <Row label="DBA" bold>
                <input
                  type="text"
                  value={dba}
                  onChange={e => setDba(e.target.value)}
                  placeholder="DBA (Doing Business As)"
                  className={inp}
                />
              </Row>

              {/* 5. Applicant Phone */}
              <Row label="Applicant Phone" bold required>
                <input
                  type="tel"
                  required
                  value={applicantPhone}
                  onChange={e => setApplicantPhone(formatPhoneNumber(e.target.value))}
                  placeholder="(555) 000-0000"
                  className={inp}
                />
              </Row>

              {/* 6. Applicant Email */}
              <Row label="Applicant Email" bold required>
                <input
                  type="email"
                  required
                  value={applicantEmail}
                  onChange={e => setApplicantEmail(e.target.value)}
                  placeholder="applicant@example.com"
                  className={inp}
                />
              </Row>

              {/* 7. Effective Date */}
              <Row label="Effective Date" bold>
                <input
                  type="date"
                  value={effectiveDate}
                  onChange={e => setEffectiveDate(e.target.value)}
                  className={inp}
                />
              </Row>
            </Section>

            {/* ═══ 2. Mailing Address ═════════════════════════════════ */}
            <Section title="Mailing Address">
              <Row label="Mailing Address" bold>
                <div className="relative">
                  <input
                    type="text"
                    value={mailingAddress}
                    onChange={e => handleMailingAddressSearch(e.target.value)}
                    placeholder="Street Address"
                    className={inp}
                    autoComplete="off"
                  />
                  {mailingAddressLoading && (
                    <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                  )}
                  {showMailingSuggestions && mailingSuggestions.length > 0 && (
                    <div
                      ref={mailingSuggestionRef}
                      className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                    >
                      {mailingSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onMouseDown={() => handleSelectMailingSuggestion(suggestion)}
                          className="px-4 py-3 hover:bg-[#f5f2ef] cursor-pointer text-sm border-b border-gray-100 last:border-0"
                        >
                          <span className="font-medium">{suggestion.street_line} {suggestion.secondary}</span>
                          <span className="text-gray-500 ml-1">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                <select
                  value={mailingState}
                  onChange={e => setMailingState(e.target.value)}
                  className={sel}
                >
                  <option value="">Select State</option>
                  {Object.values(STATE_CODE_TO_NAME).map(stateName => (
                    <option key={stateName} value={stateName}>{stateName}</option>
                  ))}
                </select>
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

            {/* ═══ 3. Premise Address (if different from above) ═══════ */}
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
                    <div className="relative">
                      <input
                        type="text"
                        value={premiseAddress}
                        onChange={e => handlePremiseAddressSearch(e.target.value)}
                        placeholder="Premise Street Address"
                        className={inp}
                        autoComplete="off"
                      />
                      {premiseAddressLoading && (
                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                      )}
                      {showPremiseSuggestions && premiseSuggestions.length > 0 && (
                        <div
                          ref={premiseSuggestionRef}
                          className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                        >
                          {premiseSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              onMouseDown={() => handleSelectPremiseSuggestion(suggestion)}
                              className="px-4 py-3 hover:bg-[#f5f2ef] cursor-pointer text-sm border-b border-gray-100 last:border-0"
                            >
                              <span className="font-medium">{suggestion.street_line} {suggestion.secondary}</span>
                              <span className="text-gray-500 ml-1">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
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
                    <select
                      value={premiseState}
                      onChange={e => setPremiseState(e.target.value)}
                      className={sel}
                    >
                      <option value="">Select State</option>
                      {Object.values(STATE_CODE_TO_NAME).map(stateName => (
                        <option key={stateName} value={stateName}>{stateName}</option>
                      ))}
                    </select>
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

            {/* ═══ 4. Sales Information Table ════════════════════════ */}
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

            {/* ═══ 5. Audit/Inspection Contact ═══════════════════════ */}
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
                <div className="mb-3">
                  <p className="text-sm font-bold text-gray-900">7. MANUFACTURING / PRODUCT TYPE</p>
                  <p className="text-sm text-gray-800 mt-1">What type of products does your company manufacture, import, distribute, or sell?</p>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsIndustryDropdownOpen(!isIndustryDropdownOpen)}
                    className="w-full sm:w-2/3 bg-white border border-gray-300 rounded-md py-2.5 px-3 text-left shadow-sm flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-[#7A6F64] transition-all"
                  >
                    <span className="truncate text-gray-700 font-medium">
                      {industries.length > 0 
                        ? `${industries.length} product type(s) selected` 
                        : "Select all that apply..."}
                    </span>
                    <svg className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {isIndustryDropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full sm:w-3/4 bg-white shadow-xl rounded-md border border-gray-200">
                      <div className="p-2 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-md">
                        <span className="text-xs font-semibold text-gray-600 px-1">Select options below:</span>
                        <button type="button" onClick={() => setIsIndustryDropdownOpen(false)} className="text-xs bg-[#7A6F64] text-white px-3 py-1 rounded hover:bg-[#5C534A] font-medium transition-colors">Done</button>
                      </div>
                      <div className="max-h-64 overflow-y-auto p-2 grid grid-cols-1 md:grid-cols-2 gap-1 bg-white rounded-b-md">
                        {INDUSTRY_OPTIONS.map(ind => (
                          <label key={ind} className="flex items-start gap-2.5 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors select-none">
                            <input
                              type="checkbox"
                              checked={industries.includes(ind)}
                              onChange={() => toggleIndustry(ind)}
                              className="mt-0.5 w-4 h-4 accent-[#7A6F64] rounded border-gray-300"
                            />
                            <span className="leading-snug">{ind}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Show tags of selected options below the dropdown for visibility */}
                {industries.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {industries.map(ind => (
                      <span key={ind} className="inline-flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs px-2.5 py-1.5 rounded-md shadow-sm">
                        {ind}
                        <button type="button" onClick={() => toggleIndustry(ind)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full w-4 h-4 flex items-center justify-center transition-colors">&times;</button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-xs italic text-amber-800 mt-3.5">
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
