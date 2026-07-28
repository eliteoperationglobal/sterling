"use client";



import { useSession } from "next-auth/react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useMemo, useRef } from "react";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyInput, parseCurrency } from "@/lib/utils/currencyFormatter";
import {
  ArrowLeft,
} from "lucide-react";

// Helper component for Yes/No radio buttons
const YesNoRadio = ({
  label,
  value,
  onChange,
  required = false,
  onInteraction,
  disableNo = false
}: {
  label: string;
  value: boolean | null | undefined;
  onChange: (val: boolean | null) => void;
  disabled?: boolean;
  required?: boolean;
  onInteraction?: () => void;
  disableNo?: boolean;
}) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="flex items-center gap-6">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          checked={value === true}
          onChange={() => {
            onChange(true);
            onInteraction?.();
          }}
          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
        />
        <span className="text-sm text-gray-700">Yes</span>
      </label>
      <label
        className={`flex items-center gap-2 ${disableNo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
      >
        <input
          type="radio"
          checked={value === false}
          disabled={disableNo}
          onChange={() => {
            if (disableNo) return;
            onChange(false);
            onInteraction?.();
          }}
          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
        />
        <span className="text-sm text-gray-700">No</span>
      </label>

    </div>
  </div>
);

const GridRow = ({ label, children, required = false, itemsCenter = false }: any) => (
  <div className={`grid grid-cols-1 md:grid-cols-[200px_1fr_320px] gap-4 md:gap-x-6 ${itemsCenter ? 'items-center' : 'items-start'}`}>
    <label className={`text-sm font-medium text-gray-900 ${itemsCenter ? '' : 'md:pt-2'} leading-snug`}>
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div className="hidden md:block"></div>
    <div>{children}</div>
  </div>
);

const LongGridRow = ({ label, children, required = false }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-4 md:gap-x-6 items-start">
    <label className="text-sm font-medium text-gray-900 md:pt-2 leading-snug">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <div>{children}</div>
  </div>
);

const initialFormData = {
  agentName: "",
  companyName: "",
  zip: "",
  state: "California",
  effectiveDate: new Date().toISOString().split("T")[0],
  estimatedGrossReceipts: "",
  estimatedSubcontractingCosts: "",
  estimatedMaterialCosts: "",
  fieldEmployees: "0",
  totalPayroll: "",
  yearsInBusiness: "",
  classCodeWork: {},
  willPerformStructuralWork: false,
  coverageLimits: "1M / 2M / 2M",
  fireLegalLimit: "$100,000",
  medicalExpenseLimit: "Not Applicable",
  selfInsuredRetention: "$2,500",
  lossesLast5Years: "0",
  generalLiabilityLosses: [],
  selectedStates: [],
  blanketAdditionalInsured: false,
  blanketWaiverOfSubrogation: false,
  blanketPrimaryWording: false,
  blanketPerProjectAggregate: false,
  blanketCompletedOperations: false,
  noticeOfCancellationThirdParties: false,
  carrierApprovedDescription: "",
  brokerFee: "0",
  displayBrokerFee: false,
  paymentOption: "",
  contractorsLicense: false,
  licenseNumber: "",
  licenseClassification: "",
  dba: "",
  firstName: "",
  lastName: "",
  yearsOfExperienceTrade: "",
  entityType: "Individual",
  phone: "",
  email: "",
  streetAddress: "",
  aptSuite: "",
  city: "",
  mailingAddressSame: null,
  mailingStreet: "",
  mailingAptSuite: "",
  mailingCity: "",
  mailingZip: "",
  mailingState: "",
  useSubcontractors: false,
  collectSubCertificates: false,
  requireSubInsuranceEqual: false,
  requireAdditionalInsured: false,
  haveWrittenSubContracts: false,
  requireWorkersComp: false,
  newConstructionPercent: "",
  remodelServiceRepairPercent: "",
  residentialPercent: "",
  commercialPercent: "",
  maxInteriorStories: "",
  maxExteriorStories: "",
  maxExteriorDepthBelowGrade: "",
  performRoofingOps: false,
  roofingOpsExplanation: "",
  performWaterproofing: false,
  waterproofingExplanation: "",
  useHeavyEquipment: false,
  heavyEquipmentExplanation: "",
  workNewTractHomes: false,
  tractHomesExplanation: "",
  workCondoConstruction: false,
  performCondoStructuralRepair: false,
  performOCIPWork: false,
  ocipWrapUpReceipts: "",
  nonOcipReceipts: "",
  performHazardousWork: false,
  hazardousWorkExplanation: "",
  performMedicalFacilities: false,
  medicalFacilitiesExplanation: "",
  workOver5000SqFt: false,
  over5000SqFtExplanation: "",
  over5000SqFtPercent: "",
  workOver20000SqFt: false,
  over20000SqFtExplanation: "",
  over20000SqFtPercent: "",
  otherBusinessNames: false,
  otherBusinessNamesExplanation: "",
  licensingActionTaken: false,
  licensingActionTakenExplanation: "",
  licenseSharedWithOthers: false,
  licenseSharedWithOthersExplanation: "",
  judgementsOrLiens: false,
  judgementsOrLiensExplanation: "",
  lawsuitsOrClaims: false,
  lawsuitsOrClaimsExplanation: "",
  knownIncidentsOrClaims: false,
  knownIncidentsOrClaimsExplanation: "",
  writtenContractForAllWork: true,
  writtenContractForAllWorkExplanation: "",
  contractHasStartDate: true,
  contractHasStartDateExplanation: "",
  contractHasScopeOfWork: true,
  contractHasScopeOfWorkExplanation: "",
  contractIdentifiesSubTrades: true,
  contractIdentifiesSubTradesExplanation: "",
  contractHasSetPrice: true,
  contractHasSetPriceExplanation: "",
  contractSignedByAllParties: true,
  contractSignedByAllPartiesExplanation: "",
  addExcessLiability: false,
  excessLiabilityLimit: "",
  employersLiabilityWC: false,
  employersLiabilityWCLimit: "",
  combinedUnderlyingLosses: "0",
  auto: false,
  addInlandMarineEquipment: false,
  addBuildersRisk: false,
  addEnvironmentalCoverage: null,
};

export default function QuoteFormPage() {
  const { data: session, status } = useSession();
  const userName = session?.user?.name || "Agent";
  const email = session?.user?.email || "";
  const agencyName = (session?.user as any)?.agencyName || "";

  const isCapco =
    agencyName.includes("Capital & Co") ||
    agencyName.includes("Capco") ||
    email.includes("capcoinsurance") ||
    email === "admin@agency1.com" ||
    userName.includes("Gamaty");

  const isBlueAngel =
    agencyName.includes("Blue Angel") || email === "admin@blueangel.com";

  const isSJJ =
    agencyName.includes("SJJ") || email === "admin@sjjinsurance.com";

  const isPatrickArias =
    agencyName.includes("Patrick Arias") || email.includes("patrickariasinsurance");

  const isTitan =
    agencyName.toLowerCase().includes("titan") || email.includes("solutions@titaninssolutions.com");

  const isTexas =
    agencyName.toLowerCase().includes("texas commercial") || email.includes("texascomm@services.com");

  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];

  const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? CAPCO_AGENTS : [];
  const router = useRouter();
  const params = useParams();
  const programId = params.programId as string;
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");
  const isViewMode = mode === "view";
  const isEditMode = mode === "edit";
  const submissionId = searchParams.get("id");

  const publicToken = searchParams.get("token");
  const [isPublicLink, setIsPublicLink] = useState(false);
  const [isVerifyingLink, setIsVerifyingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    if (publicToken) {
      setIsVerifyingLink(true);
      fetch(`/api/public/links/verify?token=${publicToken}&expectedProgramId=${programId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.valid) {
            setIsPublicLink(true);
            setFormData((prev: any) => ({
              ...prev,
              agentName: data.payload.agentName,
            }));
          } else {
            setLinkError(data.error || "Invalid link");
          }
        })
        .catch(() => setLinkError("Failed to verify link"))
        .finally(() => setIsVerifyingLink(false));
    }
  }, [publicToken]);


  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any>({
    fein: '',
    phone: '',
    fax: ''
  });

  // Smarty Address Autocomplete
  const addressInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);

  // Smarty state code to full name map (matches your statesList)
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

  const handleAddressSearch = async (value: string) => {
    handleInputChange('streetAddress', value);
    if (value.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setAddressLoading(true);
    try {
      const res = await fetch(`/api/address/autocomplete?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      setAddressSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setAddressLoading(false);
    }
  };

  const handleSelectSuggestion = (suggestion: any) => {
    const fullStateName = STATE_CODE_TO_NAME[suggestion.state] || suggestion.state;
    handleInputChange('streetAddress', `${suggestion.street_line} ${suggestion.secondary || ''}`.trim());
    handleInputChange('city', suggestion.city);
    handleInputChange('zip', suggestion.zipcode);
    handleInputChange('state', fullStateName);
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);


  const [formData, setFormData] = useState<any>(initialFormData);

  // const [formData, setFormData] = useState<any>({
  //   /* ================= APPLICATION INFO ================= */
  //   agentName: "",
  //   companyName: "",
  //   zip: "",
  //   state: "California",
  //   effectiveDate: new Date().toISOString().split("T")[0],

  //   estimatedGrossReceipts: "",
  //   estimatedSubcontractingCosts: "",
  //   estimatedMaterialCosts: "",

  //   fieldEmployees: "0",
  //   totalPayroll: "",
  //   yearsInBusiness: "",

  //   /* ================= CLASS CODES ================= */
  //   classCodeWork: {},

  //   /* ================= COVERAGE ================= */
  //   coverageLimits: "1M / 1M / 1M",
  //   fireLegalLimit: "$50,000",
  //   medicalExpenseLimit: "Not Applicable",
  //   selfInsuredRetention: "$2,500",

  //   lossesLast5Years: "0",
  //   generalLiabilityLosses: [],

  //   selectedStates: [],

  //   /* ================= ENDORSEMENTS ================= */
  //   blanketAdditionalInsured: false,
  //   blanketWaiverOfSubrogation: false,
  //   blanketPrimaryWording: false,
  //   blanketPerProjectAggregate: false,
  //   blanketCompletedOperations: false,
  //   noticeOfCancellationThirdParties: false,

  //   /* ================= DESCRIPTION ================= */
  //   carrierApprovedDescription: "",

  //   /* ================= PAYMENT ================= */
  //   brokerFee: "0",
  //   displayBrokerFee: false,
  //   paymentOption: "",

  //   /* ================= COMPANY INFO ================= */
  //   contractorsLicense: false,
  //   licenseNumber: "",
  //   licenseClassification: "",
  //   dba: "",
  //   firstName: "",
  //   lastName: "",
  //   yearsOfExperienceTrade: "",
  //   entityType: "Individual",
  //   phone: "",
  //   email: "",

  //   /* ================= ADDRESS ================= */
  //   streetAddress: "",
  //   aptSuite: "",
  //   city: "",
  //   mailingAddressSame: null,
  //   mailingStreet: "",
  //   mailingAptSuite: "",
  //   mailingCity: "",
  //   mailingZip: "",
  //   mailingState: "",

  //   /* ================= SUBCONTRACTORS ================= */
  //   useSubcontractors: false,

  //   collectSubCertificates: false,
  //   collectSubCertificatesExplanation: "",

  //   requireSubInsuranceEqual: false,
  //   requireSubInsuranceEqualExplanation: "",

  //   requireAdditionalInsured: false,
  //   requireAdditionalInsuredExplanation: "",

  //   haveWrittenSubContracts: false,
  //   haveWrittenSubContractsExplanation: "",

  //   requireWorkersComp: false,
  //   requireWorkersCompExplanation: "",

  //   /* ================= TYPE OF WORK ================= */
  //   newConstructionPercent: "",
  //   remodelServiceRepairPercent: "",

  //   residentialPercent: "",
  //   commercialPercent: "",

  //   maxInteriorStories: "",
  //   maxExteriorStories: "",
  //   maxExteriorDepthBelowGrade: "",

  //   performRoofingOps: false,
  //   roofingOpsExplanation: "",

  //   performWaterproofing: false,
  //   waterproofingExplanation: "",

  //   useHeavyEquipment: false,
  //   heavyEquipmentExplanation: "",

  //   workNewTractHomes: false,
  //   tractHomesExplanation: "",

  //   workCondoConstruction: false,

  //   performCondoStructuralRepair: false,

  //   performOCIPWork: false,
  //   ocipWrapUpReceipts: "",
  //   nonOcipReceipts: "",

  //   performHazardousWork: false,
  //   hazardousWorkExplanation: "",

  //   performMedicalFacilities: false,
  //   medicalFacilitiesExplanation: "",

  //   workOver5000SqFt: false,
  //   over5000SqFtExplanation: "",
  //   over5000SqFtPercent: "",

  //   workOver20000SqFt: false,
  //   over20000SqFtExplanation: "",
  //   over20000SqFtPercent: "",

  //   /* ================= ADDITIONAL BUSINESS ================= */
  //   otherBusinessNames: false,
  //   otherBusinessNamesExplanation: "",

  //   licensingActionTaken: false,
  //   licensingActionTakenExplanation: "",

  //   licenseSharedWithOthers: false,
  //   licenseSharedWithOthersExplanation: "",

  //   judgementsOrLiens: false,
  //   judgementsOrLiensExplanation: "",

  //   lawsuitsOrClaims: false,
  //   lawsuitsOrClaimsExplanation: "",

  //   knownIncidentsOrClaims: false,
  //   knownIncidentsOrClaimsExplanation: "",

  //   writtenContractForAllWork: true,
  //   writtenContractForAllWorkExplanation: "",

  //   contractHasStartDate: true,
  //   contractHasStartDateExplanation: "",

  //   contractHasScopeOfWork: true,
  //   contractHasScopeOfWorkExplanation: "",

  //   contractIdentifiesSubTrades: true,
  //   contractIdentifiesSubTradesExplanation: "",

  //   contractHasSetPrice: true,
  //   contractHasSetPriceExplanation: "",

  //   contractSignedByAllParties: true,
  //   contractSignedByAllPartiesExplanation: "",

  //   /* ================= EXCESS LIABILITY ================= */
  //   addExcessLiability: false,
  //   excessLiabilityLimit: "",
  //   employersLiabilityWC: false,
  //   employersLiabilityWCLimit: "",
  //   combinedUnderlyingLosses: "0",
  //   auto: false,

  //   /* ================= OPTIONAL PRODUCTS ================= */
  //   addInlandMarineEquipment: false,
  //   addBuildersRisk: false,
  //   addEnvironmentalCoverage: null,
  // });


  // Ensure class codes/description start blank on every mount to avoid stale values


  useEffect(() => {
    console.log("[Init] Resetting class codes and carrier description to blank");
    setFormData((prev: any) => ({
      ...prev,
      classCodeWork: {},
      carrierApprovedDescription: "",
    }));
  }, []);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [calculatedPremium, setCalculatedPremium] = useState<number | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);
  const [isDescriptionEdited, setIsDescriptionEdited] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated" && !publicToken) {
      router.push("/signin");
    }
  }, [status, router, publicToken]);

  useEffect(() => {
    const fetchSubmissionData = async () => {
      if (!submissionId) return;

      try {
        const res = await fetch(
          `/api/agency/submissions/${submissionId}`
        );

        const result = await res.json();
        if (!res.ok) throw new Error(result.error);

        const payload = result.submission.payload;

        // 👇 AUTO FILL FORM
        setFormData((prev: any) => ({
          ...prev,
          ...payload,
          classCodeWork: payload.classCodeWork || {},
        }));

        // If the saved submission has a description (auto-generated or manually edited),
        // mark it as "edited" so the classCodeWork useEffect won't overwrite it.
        if (payload.carrierApprovedDescription) {
          setIsDescriptionEdited(true);
        }

      } catch (err) {
        console.error("Failed to fetch submission data:", err);
      }
    };

    fetchSubmissionData();
  }, [submissionId]);


  const roofingClassCodes = [
    "Roofing (New Commercial)",
    "Roofing (New Residential)",
    "Roofing (Repair Commercial)",
    "Roofing (Repair Residential)",
  ];

  const hasRoofingSelected = Object.keys(formData.classCodeWork || {}).some(
    (code) => roofingClassCodes.includes(code)
  );

  useEffect(() => {
    if (hasRoofingSelected) {
      // If roofing class exists → force YES
      setFormData((prev: any) => ({
        ...prev,
        performRoofingOps: true,
        roofingOpsExplanation:
          "Performs roofing operations as indicated by class code selection.",
      }));
    } else {
      // If roofing class removed → auto set NO
      setFormData((prev: any) => ({
        ...prev,
        performRoofingOps: false,
        roofingOpsExplanation: "",
      }));
    }
  }, [hasRoofingSelected]);

  const triggerAnimation = () => {
    setIsProcessing(true);
    setTimeout(() => setIsProcessing(false), 2000);
  };


  const EndorsementCheckbox = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: boolean;
    onChange: (val: boolean) => void;
  }) => {
    return (
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded border text-sm text-left transition
        ${value
            ? "bg-[#f5f1eb] border-[#9A8B7A]"
            : "bg-white border-gray-300 hover:bg-gray-50"
          }`}
      >
        <span
          className={`w-4 h-4 flex items-center justify-center rounded border ${value
            ? "bg-[#9A8B7A] border-[#9A8B7A] text-white"
            : "border-gray-400 bg-white"
            }`}
        >
          {value && "✓"}
        </span>

        <span className="text-gray-900">{label}</span>
      </button>
    );
  };


  // Parse currency fields for validation
  const totalGross = parseCurrency(formData.estimatedGrossReceipts || "0");
  const subcontractingCost = parseCurrency(
    formData.estimatedSubcontractingCosts || "0"
  );
  const materialCost = parseCurrency(
    formData.estimatedMaterialCosts || "0"
  );

  // Validation rules
  const subcontractingValue = parseCurrency(
    formData.estimatedSubcontractingCosts || "0"
  );

  // Subcontracting must be > 0 if subcontractors are used
  const subcontractingZeroError =
    formData.useSubcontractors && subcontractingValue < 0;


  // Individual rules
  const subcontractingError =
    subcontractingCost > 0 && subcontractingCost > totalGross;

  const materialCostError =
    materialCost > 0 && materialCost > totalGross;

  // Combined rule
  const combinedCostError =
    subcontractingCost + materialCost >= totalGross &&
    totalGross > 0;



  const handleUseSubcontractorsChange = (val: boolean) => {
    if (val === true) {
      // User DOES use subcontractors → auto YES everything
      setFormData((prev: any) => ({
        ...prev,
        useSubcontractors: true,

        collectSubCertificates: true,
        requireSubInsuranceEqual: true,
        requireAdditionalInsured: true,
        haveWrittenSubContracts: true,
        requireWorkersComp: true,

        // optional: clear explanations
        collectSubCertificatesExplanation: "",
        requireSubInsuranceEqualExplanation: "",
        requireAdditionalInsuredExplanation: "",
        haveWrittenSubContractsExplanation: "",
        requireWorkersCompExplanation: "",
      }));
    } else {
      // User does NOT use subcontractors → auto NO everything
      setFormData((prev: any) => ({
        ...prev,
        useSubcontractors: false,

        collectSubCertificates: false,
        requireSubInsuranceEqual: false,
        requireAdditionalInsured: false,
        haveWrittenSubContracts: false,
        requireWorkersComp: false,
      }));
    }
  };
  const handleAddClassCode = (code: string) => {
    if (!code) return;

    if (formData.classCodeWork[code]) return;

    const total = calculateTotalClassCodePercent();
    const remaining = Math.max(0, 100 - total);

    setIsDescriptionEdited(false);

    setFormData((prev: any) => ({
      ...prev,
      classCodeWork: {
        ...prev.classCodeWork,
        [code]: remaining, // ✅ auto-fill remaining %
      },
    }));
  };


  const handleClassCodePercentChange = (code: string, rawValue: string) => {
    // Allow empty input while typing
    if (rawValue === "") {
      setFormData((prev: any) => ({
        ...prev,
        classCodeWork: {
          ...prev.classCodeWork,
          [code]: "",
        },
      }));
      return;
    }

    let percent = parseFloat(rawValue);
    if (isNaN(percent)) percent = 0;
    if (percent < 0) percent = 0;

    const otherTotal = Object.entries(formData.classCodeWork).reduce(
      (sum: number, [k, v]: any) =>
        k === code ? sum : sum + (parseFloat(String(v)) || 0),
      0
    );

    if (otherTotal + percent > 100) {
      percent = 100 - otherTotal;
    }

    setFormData((prev: any) => ({
      ...prev,
      classCodeWork: {
        ...prev.classCodeWork,
        [code]: percent,
      },
    }));
  };





  // Calculate form completion percentage
  const calculateCompletionPercentage = () => {
    const requiredFields = [
      'companyName',        // Company name
      'firstName',          // First name
      'lastName',           // Last name
      'entityType',         // Entity type
      'phone',              // Phone
      'email',              // Email
      'streetAddress',      // Physical address
      'city',               // City
      'state',              // State
      'zip',                // Zip
      'effectiveDate',      // Effective date
      'yearsInBusiness',    // Years in business
      'estimatedGrossReceipts',       // Gross receipts
      'estimatedSubcontractingCosts', // Subcontracting costs
      // 'totalPayroll',        Total payroll
    ];

    const filledFields = requiredFields.filter(field => {
      const value = formData[field];
      if (value === null || value === undefined) return false;
      const str = value.toString().trim();
      return str !== '' && str !== '0';
    });

    // Bonus: at least one class code selected
    const hasClassCode = Object.keys(formData.classCodeWork || {}).length > 0;

    const basePercentage = Math.round((filledFields.length / requiredFields.length) * 90);
    const classCodeBonus = hasClassCode ? 10 : 0;

    return Math.min(basePercentage + classCodeBonus, 100);
  };

  const completionPercentage = calculateCompletionPercentage();

  // Auto-save hook
  // Auto-save temporarily disabled per request

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    triggerAnimation();
  };

  // Class Code to Carrier Description Mapping (from ISC)
  const classCodeDescriptionMap: Record<string, string> = {
    "A/C & Refrigeration": "- Constructs, maintains, services and repairs of refrigerators, refrigerated rooms, air-conditioning units, ducts, blowers, humidity and thermostatic controls.",
    "Appliance & Accessories Installation": "- Installation and/or repair of household and commercial appliances.",
    "Carpentry (Framing)": "- Form work, framing or rough carpentry necessary to construct framed structures as well as Interior/exterior staircases.",
    "Carpentry (Interior/Woodwork/Shop)": "- Fabricate and install cabinets, interior trim work, non-bearing partitions and other items of \"finish carpentry.\"",
    "Carpet Cleaning": "- Carpet, rug, furniture or upholstery cleaning.",
    "Cleaning (Outside Building)": "- Cleaning the outside surfaces of buildings, decks, driveways, awnings, gutters, entranceways, sidewalks and parking lots (by hand, no vehicles), window washing (from ground only w/o high pressure). No pressure washing. No roof cleaning.",
    "Concrete (Flat)": "- Patios, driveways, sidewalks, minor parking lot repair/patching, no pouring of commercial parking lots.",
    "Concrete (Foundations - No Repair)": "- Forming and pouring of foundations (no foundation repair).",
    "Debris Removal (Construction Site)": "- Clean up and/or removes from building grounds or structures any debris resultant from any construction project and junk removal.",
    "Demolition - Non Structural": "- The removal of materials from a commercial or residential structure without compromising the load-bearing walls, exterior walls, or the roof. Hand tools only.",
    "Demolition - Structural": "- Tearing down buildings or specific structural components, including building walls, floor systems, roof systems, foundations, and footings. No explosives, no wrecking ball, no demolition of structures exceeding two stories in height.",
    "Door Installation - Overhead Doors": "- Installation service, or repair of overhead doors, including tilt-up, sectional and roll-up doors for residential and commercial use including garages, warehouses, storage units and storefronts. No aircraft hangar exposure.",
    "Door/Window Installation": "- Install doors and windows including screens.",

    "Drywall": "- Installs gypsum wall board including nonstructural metal framing members, taping and texturing. Drop ceiling and acoustical ceiling install and repair.",
    "Electrical": "- Installs and connects electrical wires and fixtures solar. systems, security alarms and CCTV (no monitoring)",
    "Equipment Rental (W/Operators)": "- Contractors using owned or rented equipment including: power tools, bobcats, heavy equipment/trucks/hydraulics, skid steers, backhoes or other similar equipment. Heavy equipment may be used for demolition purposes. No drilling or boring equipment and/or operations.",
    "Excavation": "- Digs, moves and replaces material forming the surface of the earth. Max depth of 5 feet. No drilling or boring equipment and/or operations.",
    "Fencing": "- Constructs, erects, alters or repairs all types of fences (no pool fencing permitted).",
    "Floor Covering Installation": "- Prepares any surface for the installation of flooring and installs carpet, tile, wood, floors and flooring including the finishing and repairing of floors.",
    "Garage Door Installation": "- Installation and repair of garage doors.",
    "General Contractor (New Commercial)": "- Construction of new commercial buildings or structures.",
    "General Contractor (New Residential)": "- Construction of new homes.",
    "General Contractor (Remodel Commercial)": "- Repair and remodel of commercial buildings.",
    "General Contractor (Remodel Residential)": "- Repair/remodel/additions to residential structures.",
    "General Contractor (Remodel/Real Estate Investor)": "- Remodel contractor buying, rehabbing, and selling of residential properties for a profit. Property may not be occupied, rented, or held for rental prior to the sale of property. This policy does not include professional liability coverage.",
    "Glass Installation/Glazing": "- Cuts, assembles and/or installs all kinds of glass, glass work, mirrored glass (No Automobile exposure).",
    "Grading": "- Using heavy equipment to produce a level base, or one with a specified slope, for construction project such as a foundation, the base course for a private road or landscape and garden improvements and surface drainage. No land or right-of-way clearing.",
    "Guniting": "- Shot on concrete to repair, establish or strengthen walls. Limited use to pool work, or walls not exceeding 10 feet.",
    "Handyman": "- Service, repair and maintenance contractor. No structural work, no roof repairs, no work on new construction.",
    "Home Inspection": "- The examination of, and report on the condition and safety of residential real estate property.  This policy does not include professional liability coverage.",
    "Household Furniture or Fixtures Installation": "- Installation of furniture or fixtures in homes or businesses. No recreational or gym equipment.",
    "HVAC": "- Installation of heating, ventilation, or air conditioning systems.",
    "Insulation": "- Installation or application of acoustical or thermal insulating material in buildings or within building walls.",
    "Janitorial (Commercial - No Floor Waxing)": "- Cleaning services for commercial buildings, excluding floor waxing, kitchen hood cleaning and pressure washing.",
    "Janitorial (Residential - No Floor Waxing)": "- Cleaning services for residential buildings, excluding floor waxing and pressure washing.",
    "Landscape": "- Lawn care, removal of leaves, laying out grounds, planting trees, shrubs, flowers or lawns. Outdoor yard sprinkler install/repair. Tree trimming from the ground only. No stump grinding.",
    "Low Voltage Electrical (No underground operations)": "- The installation, service, and repair of low voltage cable for voice or data transmission and the splicing of fiber optic cable or low voltage wire within buildings, utility vaults or boxes. This classification also applies to splicing fiber optic cables at ground level. No underground operations. No alarm repair or install.",
    "Maintenance Contractor": "- Maintenance contractor performing general property maintenance, minor repairs, and routine upkeep for residential and commercial properties, including basic handyman services.",
    "Masonry": "- Install concrete cinder blocks, clay baked bricks w/ mortar, Small retaining walls (up to 5 feet), patio pavers, & rocks on walls. No chimney exposure.",
    "Masonry Inculding Chimney repair": "- Install concrete cinder blocks, clay baked bricks w/ mortar, Small retaining walls (up to 5 feet), patio pavers, rocks on walls and chimney repair.",
    "Metal Erection (Decorative)": "- Iron fence, decorative metal on doors & windows, gates & other non-load bearing metal application. (no welding)",
    "Metal Erection (Structural)": "- Beams, large pole barns, building brackets, stairs, hand-rails, and other structural and load bear metal installation. (no welding)",
    "Painting (Exterior)": "- Exterior prepping and painting with standard materials to the industry, staining & oil-based paint. No stand-alone waterproofing applications or painting of roofs.",
    "Painting (Interior)": "- Interior prepping and painting with standard material to the industry, staining and oil-based paint.",
    "Parking Lot/Driveway Paving & Repair (no street or road)": "- Paving, patching, sealcoating, and striping of parking lots and driveways. No street or road exposure.",
    "Plastering/Stucco": "- Outside prep such as removal of old siding, building wrap (waterproofing) to install new stucco. Inside prep will include sanding, scraping, masking, taping and plastering. Soundproofing and fireproofing OK.",
    "Plumbing (Commercial)": "- Installation of copper pipes, fitting, valves, sinks, toilets, tubs, showers, water heaters, LPG work for commercial buildings. No fire suppression or boiler operations.",
    "Plumbing (Residential)": "- Installation of copper pipes, fitting, valves, sinks, toilets, tubs, showers, water heaters, LPG work for Residential buildings. No fire suppression or boiler operations.",
    "Pre-Fab Homes": "- Work on mobile homes, mobile offices, disconnect of old units, connection of new units. No lifting or moving of the units. No work on new modular or prefabricated homes or commercial buildings.",
    "Pressure Washing": "- High pressure water, or other standard industry product to clean surfaces such as concrete sidewalks, driveways, patios, exterior walls. No roofs, no sandblasting.",
    "Project Manager": "- Independent contractor hired by the project owner or the general contractor for the management and oversight of a construction project. Does not engage in the actual construction process or the hiring, firing , or payment of subcontractors. This policy does not include professional liability coverage.",
    "Property preservation": "- Property Preservation contractor performing handyman, landscaping, debris removal and cleaning operations on vacant residential properties. This policy does not include professional liability coverage.",
    "Rebar installation": "- The installation of reinforcing steel in connection with concrete and/or cement work. No street, road, or bridge exposure. Ground level only",
    "Roof cleaning (without using high pressure)": "- Soft washing of roofs without using high pressure.",
    "Roofing (New Commercial)": "- The process of constructing a roof on a new commercial structure.",
    "Roofing (New Residential)": "- The process of constructing a roof on a new residential structure.",
    "Roofing (Repair Commercial)": "- The process of constructing, repairing or remodeling a roof on an existing commercial structure.",
    "Roofing (Repair Residential)": "- The process of repairing or remodeling a roof on an existing residential structure.",
    "Sandblasting": "- Roughen or clean (a surface) with a jet of sand driven by compressed air or steam.",
    "Scaffolding Contractor": "- Scaffolding erection and rental for construction projects.",
    "Septic Tank (Install/Service/Repair)": "- Installing, servicing, and or repairing of septic tanks (10 feet max depth below grade).",
    "Sheet Metal": "- Cuts, shapes, fabricates and installs sheet metal such as cornices, flashings, gutters, leaders, pans, kitchen equipment and duct work. No roofing exposure.",
    "Siding and Decking": "- Applies or installs all types of exterior siding including wood, wood products, vinyl, aluminum and metal siding to new or existing buildings. Also constructs wooden decks and related handrails. No rooftop decking.",
    "Sign Installation": "- The installation, service or repair of signs that are affixed directly to interior or exterior building including related electrical wiring activities and the application of painted printed or adhesive lettering or graphics onto surfaces including but not limited to buildings, structures, windows, banners, and purchased sign blanks. No street or roadwork signs. No billboards.",
    "Solar Installation/Repair": "- The outside installation, service, or repair of photovoltaic solar panels.",
    "Street/Road Paving (Commercial)": "- Paving of private roads (No public roads).",
    "Swimming Pool Cleaning": "- Cleaning and routine maintenance of swimming pools, hot tubs, spas such as cleaning filters, vacuuming and maintaining proper pH level. Routine heater and pump maintenance. No install.",
    "Swimming Pool Installation & Repair": "- Constructs, remodels or repairs swimming pools, spas or hot tubs, including installation of solar heating equipment.",
    "Tile & Marble Installation": "- Installation of tile, marble, granite, travertine or other related materials. Flooring and countertops are acceptable.",
    "Tree Trimmer": "- The trimming and/or removal of trees. Stump grinding OK as well. No right-of-way or fire break clearing.",
    "Water & Sewer Mains": "- Installs, plans, and manages the installation and repair of building sewer and water service. No Public Works.",
    "Water/ Fire Damage Restoration": "- The act of cleaning and restoring property that has sustained water, smoke or fire damage. No mold remediation. This policy does not include professional liability coverage.",
    "Waterproofing": "- Applies to contractors performing waterproofing, sealing, or moisture-protection work on buildings, roofs, decks, walls, or other structures.",
    "Welding (Non-Structural)": "- Non-Structural welding. No stairs, handrails, trailers, autos, boats, boilers, conveyors, production/manufacturing/industrial facilities, pressurized pipes, oil/gas related, or anything deemed structural.",
    "Welding (Structural)": "- Structural Welding, no bridges, trailers, autos, boats, boilers, conveyors, production/manufacturing/industrial facilities,pressurized pipes, or anything oil/gas related.",
    "Other": " "
  };

  // this is for when description remember old changes
  // useEffect(() => {
  //   const classCodes = Object.keys(formData.classCodeWork || {});

  //   const generatedDescriptions = classCodes
  //     .map((code) => classCodeDescriptionMap[code])
  //     .filter(Boolean)
  //     .join("\n\n");

  //   setFormData((prev: any) => {
  //     const currentText = prev.carrierApprovedDescription || "";

  //     // Extract user custom text by removing generated descriptions
  //     let customText = currentText;

  //     Object.values(classCodeDescriptionMap).forEach((desc) => {
  //       customText = customText.replace(desc, "").trim();
  //     });

  //     const finalText = [generatedDescriptions, customText]
  //       .filter(Boolean)
  //       .join("\n\n");

  //     return {
  //       ...prev,
  //       carrierApprovedDescription: finalText,
  //     };
  //   });

  // }, [formData.classCodeWork]);

  useEffect(() => {
    const classCodes = Object.keys(formData.classCodeWork || {});

    const generatedDescription = classCodes
      .map((code) => classCodeDescriptionMap[code])
      .filter(Boolean)
      .join("\n\n");

    setFormData((prev: any) => {
      // If user has manually edited the description, don't overwrite their changes
      if (isDescriptionEdited) {
        return prev;
      }

      return {
        ...prev,
        carrierApprovedDescription: generatedDescription,
      };
    });

  }, [formData.classCodeWork, isDescriptionEdited]);

  // Derive the description based solely on the selected class code.
  // const effectiveDescription = useMemo(() => {
  //   const classCodes = Object.keys(formData.classCodeWork || {});
  //   if (classCodes.length === 0) return "";
  //   const firstClassCode = classCodes[0];
  //   return classCodeDescriptionMap[firstClassCode] || "";
  // }, [formData.classCodeWork]);

  // const handleClassCodeChange = (code: string, percentage: string) => {
  //   // Only allow ONE class code at a time - replace previous if exists
  //   const newClassCodeWork: Record<string, string> = {
  //     [code]: percentage
  //   };

  //   // Get carrier description for the selected class code
  //   const description = classCodeDescriptionMap[code] || "";

  //   // Debug logging
  //   console.log("[Class Code Change] Code:", code);
  //   console.log("[Class Code Change] Description found:", description ? "Yes" : "No");
  //   console.log("[Class Code Change] Description:", description);
  //   console.log("[Class Code Change] Available keys:", Object.keys(classCodeDescriptionMap).slice(0, 5));

  //   // Force update description immediately
  //   setFormData((prev: any) => ({
  //     ...prev,
  //     classCodeWork: newClassCodeWork,
  //   }));
  //   triggerAnimation();
  // };

  const handleClassCodeChange = (code: string, percentage: string) => {
    setFormData((prev: any) => ({
      ...prev,
      classCodeWork: {
        ...prev.classCodeWork,   // keep existing class codes
        [code]: percentage       // update only this one
      }
    }));

    triggerAnimation();
  };

  const calculateTotalClassCodePercent = (): number => {
    const values = Object.values(formData.classCodeWork || {}) as (string | number)[];
    return values.reduce<number>((sum, val) => {
      const numVal = typeof val === 'string' || typeof val === 'number' ? parseFloat(String(val)) || 0 : 0;
      return sum + numVal;
    }, 0);
  };

  const getRemainingClassCodePercent = (): number => {
    const total: number = calculateTotalClassCodePercent();
    return Math.max(0, 100 - total);
  };

  const formatSSN = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length <= 3) {
      return digitsOnly;
    }
    if (digitsOnly.length <= 5) {
      return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
    }

    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 5)}-${digitsOnly.slice(5, 9)}`;
  };


  const validateSSN = (value: string) => {
    const digitsOnly = value.replace(/\D/g, "");

    if (digitsOnly.length === 0) {
      setValidationErrors((prev: any) => ({ ...prev, ssn: "" }));
    } else if (digitsOnly.length < 9) {
      setValidationErrors((prev: any) => ({
        ...prev,
        ssn: "Not enough numbers, expecting 9",
      }));
    } else if (digitsOnly.length > 9) {
      setValidationErrors((prev: any) => ({
        ...prev,
        ssn: "Too many numbers, expecting 9",
      }));
    } else {
      setValidationErrors((prev: any) => ({ ...prev, ssn: "" }));
    }
  };


  const formatPhone = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length === 0) return '';
    if (digitsOnly.length <= 3) {
      return `(${digitsOnly}`;
    }
    if (digitsOnly.length <= 6) {
      return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3)}`;
    }
    return `(${digitsOnly.slice(0, 3)}) ${digitsOnly.slice(3, 6)}-${digitsOnly.slice(6, 10)}`;
  };

  const validatePhone = (value: string, field: 'phone' | 'fax') => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length === 0) {
      setValidationErrors((prev: any) => ({ ...prev, [field]: '' }));
    } else if (digitsOnly.length < 10) {
      setValidationErrors((prev: any) => ({ ...prev, [field]: 'Phone number too short.' }));
    } else {
      setValidationErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const calculatePremium = () => {
    const grossReceipts = parseCurrency(formData.estimatedGrossReceipts) || 0;
    let premium = grossReceipts * 0.015;

    const experience = parseInt(formData.yearsExperience) || 0;
    if (experience > 10) premium *= 0.9;
    else if (experience > 5) premium *= 0.95;

    const losses = parseInt(formData.lossesLast5Years) || 0;
    if (losses > 0) premium *= (1 + (losses * 0.15));

    if (formData.selfInsuredRetention === "$10,000") premium *= 0.85;
    else if (formData.selfInsuredRetention === "$5,000") premium *= 0.90;
    else if (formData.selfInsuredRetention === "$2,500") premium *= 0.95;

    premium = Math.max(premium, 400);

    return Math.round(premium);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.companyName.trim()) {
      toast.error("Company name is required");
      return;
    }

    try {
      setIsSubmitting(true);

      let response;

      if (isPublicLink) {
        response = await fetch("/api/public/applications/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId,
            programName: "Advantage Contractor GL",
            formData,
            token: publicToken,
          }),
        });
      } else if (isEditMode && submissionId) {
        response = await fetch(`/api/agency/submissions/${submissionId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payload: formData,
          }),
        });
      } else {
        response = await fetch("/api/agency/applications/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            programId,
            programName: "Advantage Contractor GL",
            formData,
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit");
      }

      toast.success(
        isEditMode
          ? "Application updated successfully!"
          : "Application submitted successfully!"
      );

      setTimeout(() => {
        if (isPublicLink) {
          window.location.href = "/application-success";
        } else if (isEditMode && submissionId) {
          if ((session?.user as any)?.role === "system_admin") {
            window.location.href = `/admin/submissions/${submissionId}?updated=true`;
          } else {
            window.location.href = `/agency/submissions/${submissionId}?updated=true`;
          }
        } else {
          window.location.href = "/agency/dashboard";
        }
      }, 1500);
    } catch (error: any) {
      console.error("Submit error:", error);
      toast.error(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!quoteId) return;
    // window.open(`/api/agency/quotes/${quoteId}/pdf`, '_blank');
  };

  const handleDownloadApplicationPDF = async () => {
    try {
      setIsDownloadingPDF(true);

      const response = await fetch('/api/agency/applications/preview-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programId,
          programName: 'Advantage Contractor GL',
          formData,
          excludePages8910: true,
        }),
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to generate PDF';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          console.error('PDF generation error:', errorData);
        } catch (e) {
          console.error('PDF generation failed with status:', response.status);
        }
        throw new Error(errorMessage);
      }

      // Check if response is actually a PDF
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        // Get PDF blob
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `application-${formData.companyName || 'preview'}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success('PDF downloaded successfully!');
      } else {
        // Response is JSON error
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PDF');
      }
    } catch (error: any) {
      console.error('PDF download error:', error);
      toast.error(error?.message || 'Failed to download PDF. Please check the console for details.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleEmailQuote = async () => {
    if (!quoteId) return;
    try {
      const response = await fetch(`/api/agency/quotes/${quoteId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientEmail: formData.email }),
      });
      if (response.ok) toast.success('Quote emailed successfully!');
    } catch (error) {
      toast.error('Failed to send email');
    }
  };

  const classCodeOptions = [
    "A/C & Refrigeration",
    "Appliance & Accessories Installation",
    "Carpentry (Framing)",
    "Carpentry (Interior/Woodwork/Shop)",
    "Carpet Cleaning",
    "Cleaning (Outside Building)",
    "Concrete (Flat)",
    "Concrete (Foundations - No Repair)",
    "Debris Removal (Construction Site)",
    "Demolition - Non Structural",
    "Demolition - Structural",
    "Door Installation - Overhead Doors",
    "Door/Window Installation",
    "Drywall",
    "Electrical",
    "Equipment Rental (W/Operators)",
    "Excavation",
    "Fencing",
    "Floor Covering Installation",
    "Garage Door Installation",
    "General Contractor (New Commercial)",
    "General Contractor (New Residential)",
    "General Contractor (Remodel Commercial)",
    "General Contractor (Remodel Residential)",
    "General Contractor (Remodel/Real Estate Investor)",
    "Glass Installation/Glazing",
    "Grading",
    "Guniting",
    "Handyman",
    "Home Inspection",
    "Household Furniture or Fixtures Installation",
    "HVAC",
    "Insulation",
    "Janitorial (Commercial - No Floor Waxing)",
    "Janitorial (Residential - No Floor Waxing)",
    "Landscape",
    "Low Voltage Electrical (No underground operations)",
    "Maintenance Contractor",
    "Masonry",
    "Masonry Inculding Chimney repair",
    "Metal Erection (Decorative)",
    "Metal Erection (Structural)",
    "Painting (Exterior)",
    "Painting (Interior)",
    "Parking Lot/Driveway Paving & Repair (no street or road)",
    "Plastering/Stucco",
    "Plumbing (Commercial)",
    "Plumbing (Residential)",
    "Pre-Fab Homes",
    "Pressure Washing",
    "Project Manager",
    "Property preservation",
    "Rebar installation",
    "Roof cleaning (without using high pressure)",
    "Roofing (New Commercial)",
    "Roofing (New Residential)",
    "Roofing (Repair Commercial)",
    "Roofing (Repair Residential)",
    "Sandblasting",
    "Scaffolding Contractor",
    "Septic Tank (Install/Service/Repair)",
    "Sheet Metal",
    "Siding and Decking",
    "Sign Installation",
    "Solar Installation/Repair",
    "Street/Road Paving (Commercial)",
    "Swimming Pool Cleaning",
    "Swimming Pool Installation & Repair",
    "Tile & Marble Installation",
    "Tree Trimmer",
    "Water & Sewer Mains",
    "Water/ Fire Damage Restoration",
    "Waterproofing",
    "Welding (Non-Structural)",
    "Welding (Structural)",
    "Other",
  ];

  const agents = [
    {
      id: "agent_1",
      name: "John Carter",
      email: "john@agency.com",
      phone: "(310) 111-2222",
    },
    {
      id: "agent_2",
      name: "Sarah Lee",
      email: "sarah@agency.com",
      phone: "(310) 333-4444",
    },
    {
      id: "agent_3",
      name: "Michael Stone",
      email: "michael@agency.com",
      phone: "(310) 555-6666",
    },
  ];

  const statesList = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho",
    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine",
    "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri",
    "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee",
    "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  if (status === "loading" || isVerifyingLink) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9A8B7A]"></div>
      </div>
    );
  }

  if (publicToken && linkError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
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
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      {/* <div className="bg-[#fafaf9] text-white px-4 md:px-6 py-3 flex flex-wrap items-center justify-between gap-2">
        <Link
          href={submissionId ? `/agency/submissions/${submissionId}` : "/agency/marketplace"}
          className="flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="text-sm md:text-base">Close Rater</span>
        </Link>
        <button type="button" onClick={() => setFormData(initialFormData)} className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-700 hover:bg-gray-600 rounded text-xs md:text-sm">
          Clear
        </button>
      </div> */}
      <div className="bg-white md:bg-[#fafaf9] p-4 md:p-8 font-sans text-gray-800 overflow-x-hidden">
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors mb-4 font-medium text-sm w-fit"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </button>
      </div>


      {/* Main Content */}
      <div className="max-w-[950px] mx-auto px-2 md:px-6 py-4 md:py-8 mt-2 md:mt-4">

        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10">
          <fieldset disabled={isViewMode} className={isViewMode ? "opacity-90 pointer-events-none" : ""}>

            {/* Indication Information */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Application Information</h2>
              </div>
              <div className="px-4 md:px-8 pt-6 pb-7">


                <div className="space-y-6 mt-1">


                  {/*  Agent */}
                  <GridRow label="Agent" required>
                    {agentOptions.length > 0 ? (
                      <select
                        value={formData.agentName}
                        onChange={(e) => handleInputChange("agentName", e.target.value)}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                      >
                        <option value="" disabled hidden>Select Agent</option>
                        {agentOptions.map(agent => (
                          <option key={agent} value={agent}>
                            {agent}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={formData.agentName}
                        onChange={(e) => handleInputChange("agentName", e.target.value)}
                        placeholder="Your Agent Name"
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                      />
                    )}
                  </GridRow>


                  {/* <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-start">
                    <label className="text-sm font-medium text-gray-900 pt-2">
                      Agent <span className="text-red-500">*</span>
                    </label>
                    <div></div>
                    <div>
                      <select
                        value={formData.agentId || ""}
                        onChange={(e) => {
                          const selectedAgent = agents.find(
                            (agent) => agent.id === e.target.value
                          );

                          handleInputChange("agentId", selectedAgent?.id || "");
                          handleInputChange("agentName", selectedAgent?.name || "");
                          handleInputChange("agentEmail", selectedAgent?.email || "");
                          handleInputChange("agentPhone", selectedAgent?.phone || "");
                        }}
                        className={`w-full px-4 py-2.5 border rounded text-sm ${!formData.agentId ? "border-red-300" : "border-gray-300"} focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A]`} required >
                        <option value="">Select Agent</option>
                        {agents.map((agent) => (
                          <option key={agent.id} value={agent.id}>
                            {agent.name}
                          </option>
                        ))}
                      </select>

                      {!formData.agentId && (
                        <p className="text-xs text-red-500 mt-1">
                          Please select an agent
                        </p>
                      )}
                    </div>
                  </div> */}


                  <GridRow label="Company Name" required itemsCenter>
                    <input
                      type="text"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                      required
                    />
                  </GridRow>


                  <GridRow label="Estimated Total Gross Receipts" itemsCenter>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value={formData.estimatedGrossReceipts ? formatCurrencyInput(formData.estimatedGrossReceipts) : ''}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          handleInputChange('estimatedGrossReceipts', formatted);
                        }}
                        onBlur={(e) => {
                          const parsed = parseCurrency(e.target.value);
                          handleInputChange('estimatedGrossReceipts', parsed > 0 ? parsed.toString() : '');
                        }}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                      />
                    </div>
                  </GridRow>

                  <GridRow label="Estimated Subcontracting Costs">
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value={
                          formData.estimatedSubcontractingCosts
                            ? formatCurrencyInput(formData.estimatedSubcontractingCosts)
                            : ""
                        }
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          handleInputChange("estimatedSubcontractingCosts", formatted);

                          // 🔥 AUTO-SET SUBCONTRACTORS = YES
                          const parsed = parseCurrency(formatted);
                          if (parsed > 0 && !formData.useSubcontractors) {
                            handleUseSubcontractorsChange(true);
                          }
                        }}
                        onBlur={(e) => {
                          const parsed = parseCurrency(e.target.value);
                          handleInputChange(
                            "estimatedSubcontractingCosts",
                            parsed > 0 ? parsed.toString() : ""
                          );
                        }}
                        className={`w-full pl-8 pr-4 py-2.5 border rounded text-sm focus:ring-1 ${subcontractingError ||
                          combinedCostError ||
                          subcontractingZeroError
                          ? "border-red-500 focus:ring-red-400"
                          : "border-gray-300 focus:ring-[#9A8B7A] focus:border-[#9A8B7A]"
                          }`}
                      />
                    </div>

                    {(subcontractingError ||
                      combinedCostError ||
                      subcontractingZeroError) && (
                        <p className="mt-1 text-xs text-red-600">
                          {subcontractingError
                            ? "Subcontracting costs cannot exceed total gross receipts."
                            : subcontractingZeroError
                              ? "Subcontracting costs must be greater than $0 when subcontractors are used."
                              : "Subcontracting + material costs must be less than total gross receipts."}
                        </p>
                      )}
                  </GridRow>

                  <GridRow label="# of Field Employees">
                    <select
                      value={formData.fieldEmployees}
                      onChange={(e) =>
                        handleInputChange("fieldEmployees", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                    >
                      {Array.from({ length: 21 }, (_, i) => (
                        <option key={i} value={i}>
                          {i >= 19 ? "19+" : i}
                        </option>
                      ))}
                    </select>
                  </GridRow>


                  {Number(formData.fieldEmployees) > 0 && (
                    <GridRow label="Total Payroll" itemsCenter>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                        <input
                          type="text"
                          value={
                            formData.totalPayroll
                              ? formatCurrencyInput(formData.totalPayroll)
                              : ""
                          }
                          onChange={(e) => {
                            const formatted = formatCurrencyInput(e.target.value);
                            handleInputChange("totalPayroll", formatted);
                          }}
                          onBlur={(e) => {
                            const parsed = parseCurrency(e.target.value);
                            handleInputChange(
                              "totalPayroll",
                              parsed > 0 ? parsed.toString() : ""
                            );
                          }}
                          className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                          placeholder="Enter payroll amount"
                        />
                      </div>
                    </GridRow>
                  )}


                  <GridRow label="Years in Business" itemsCenter>
                    <input
                      type="number"
                      value={formData.yearsInBusiness}
                      placeholder="4"
                      onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                    />
                  </GridRow>

                  {/* <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                  <label className="text-sm font-medium text-gray-900">Years of experience in the Trades for which you are applying for insurance</label>
                  <div></div>
                  <input
                    type="number"
                    value={formData.yearsExperience}
                    onChange={(e) => handleInputChange('yearsExperience', e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                  />
                </div> */}

                  {/* <YesNoRadio
                  label="Is this a premise only policy?"
                  value={formData.isPremiseOnlyPolicy}
                  onChange={(val) => handleInputChange('isPremiseOnlyPolicy', val)}
                  onInteraction={triggerAnimation}
                /> */}

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Class Code
                    </label>

                    {/* <select
                      value=""
                      onChange={(e) => handleAddClassCode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] bg-white"
                    >
                      <option value="">Select Class Code</option>
                      {classCodeOptions
                        //.filter((code) => !formData.classCodeWork[code]) // 🚫 hide selected
                        .filter((code) => !formData.classCodeWork?.[code])
                        .map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                    </select>
                  </div> */}

                    <select
                      value=""
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] bg-white"
                      onChange={(e) => {
                        const selectedCode = e.target.value;
                        if (selectedCode) {
                          handleAddClassCode(e.target.value);
                        } else {
                          console.log("[Select Change] Clearing class code and description");
                          setFormData((prev: any) => ({
                            ...prev,
                            classCodeWork: {},
                            carrierApprovedDescription: ""
                          }));
                        }
                      }}
                    >
                      <option value="">Select Class Code</option>
                      {classCodeOptions
                        .filter((code) => !formData.classCodeWork[code]) // 🚫 hide selected
                        .map((code) => (
                          <option key={code} value={code}>
                            {code}
                          </option>
                        ))}
                    </select>
                  </div>


                  <div className="text-right mb-4">
                    <span
                      className={`text-sm font-semibold ${calculateTotalClassCodePercent() === 100
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      Total: {calculateTotalClassCodePercent()}%
                    </span>
                  </div>


                  {Object.keys(formData.classCodeWork).length > 0 && (
                    <div className="border border-gray-200 rounded p-3 max-h-48 overflow-y-auto">
                      {Object.entries(formData.classCodeWork).map(([code, percent]: any) => (
                        <div
                          key={code}
                          className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm text-gray-700">{code}</span>

                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={percent}
                              min={0}
                              max={100}
                              onChange={(e) =>
                                handleClassCodePercentChange(code, e.target.value)
                              }
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                            />

                            <span className="text-sm text-gray-500">%</span>

                            <button
                              type="button"
                              onClick={() => {
                                const updated = { ...formData.classCodeWork };
                                delete updated[code];

                                setIsDescriptionEdited(false);

                                setFormData((prev: any) => ({
                                  ...prev,
                                  classCodeWork: updated,
                                }));
                              }}
                              className="text-red-500 hover:text-red-700 text-sm font-semibold"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}




                  {/* Limits header row */}
                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                      Limits
                    </label>

                    <div></div>

                    <div>
                      <select
                        value={formData.coverageLimits}
                        onChange={(e) =>
                          handleInputChange("coverageLimits", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      >
                        {/* <option value="1M / 1M / 1M">1M / 1M / 1M</option> */}
                        {/* <option value="1M / 2M / 1M">1M / 2M / 1M</option> */}
                        <option value="1M / 2M / 2M">1M / 2M / 2M</option>
                        {/* <option value="100k / 100k / 100k">100k / 100k / 100k</option>
                        <option value="250k / 250k / 250k">250k / 250k / 250k</option>
                        <option value="500k / 500k / 500k">500k / 500k / 500k</option> */}
                      </select>

                      <p className="text-xs text-gray-500 mt-1">
                        * Higher limits can be obtained by adding an Excess policy
                      </p>
                    </div>
                  </div>

                  {/* Expanded section */}
                  <div className="mt-6 space-y-5">

                    {/* Fire Legal Limit */}
                    <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                      <label className="text-sm font-medium text-gray-900">
                        Fire Legal Limit
                      </label>
                      <div></div>
                      <select
                        value={formData.fireLegalLimit}
                        onChange={(e) =>
                          handleInputChange("fireLegalLimit", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm bg-white"
                      >
                        {/* <option value="$50,000">$50,000</option> */}
                        <option value="$100,000">$100,000</option>
                      </select>
                    </div>

                    {/* Med Pay Limit */}
                    <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                      <label className="text-sm font-medium text-gray-900">
                        Med Pay Limit
                      </label>
                      <div></div>
                      <select
                        value={formData.medicalExpenseLimit}
                        onChange={(e) =>
                          handleInputChange("medicalExpenseLimit", e.target.value)
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm bg-white"
                      >
                        <option value="Not Applicable">Not Applicable</option>
                        <option value="$2,500">$2,500</option>
                        <option value="$5,000">$5,000</option>
                        <option value="$10,000">$10,000</option>
                      </select>
                    </div>

                  </div>



                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">Deductible</label>
                    <div></div>
                    <select
                      value={formData.selfInsuredRetention}
                      onChange={(e) => handleInputChange('selfInsuredRetention', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    >
                      <option>$10,000</option>
                      <option>$5,000</option>
                      <option>$2,500</option>
                      <option>$1,000</option>
                    </select>
                  </div>


                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">
                      # Losses in last 5 years
                    </label>
                    <div></div>
                    <select
                      value={formData.lossesLast5Years}
                      onChange={(e) => {
                        const value = e.target.value;

                        // If user selects 0 → clear losses
                        if (value === "0") {
                          handleInputChange("lossesLast5Years", "0");
                          handleInputChange("generalLiabilityLosses", []);
                          return;
                        }

                        // If user selects non-zero and no loss exists → add one by default
                        if (
                          value !== "0" &&
                          formData.generalLiabilityLosses.length === 0
                        ) {
                          handleInputChange("lossesLast5Years", value);
                          handleInputChange("generalLiabilityLosses", [
                            { dateOfLoss: "", amountOfLoss: "" },
                          ]);
                          return;
                        }

                        handleInputChange("lossesLast5Years", value);
                      }}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4+">4+</option>
                    </select>

                  </div>



                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">Desired Effective Date</label>
                    <div></div>
                    <input
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </div>


                  {/* state */}

                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-start">
                    <label className="text-sm font-medium text-gray-900 pt-2">
                      States in which you do business for which you are currently applying for insurance:
                    </label>

                    <div></div>

                    <div className="w-full border border-gray-300 rounded px-2 py-2 focus-within:ring-1 focus-within:ring-[#9A8B7A]">

                      {/* Selected state chips */}
                      <div className="flex flex-wrap gap-2 mb-2">
                        {formData.selectedStates.map((state: string) => (
                          <span
                            key={state}
                            className="flex items-center gap-1 bg-gray-200 text-sm px-2 py-1 rounded"
                          >
                            {state}
                            <button
                              type="button"
                              onClick={() => {
                                // prevent removing last state
                                if (formData.selectedStates.length === 1) return;

                                handleInputChange(
                                  "selectedStates",
                                  formData.selectedStates.filter((s: string) => s !== state)
                                );
                              }}
                              className="text-gray-600 hover:text-red-500 font-bold"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* State dropdown */}
                      <select
                        value=""
                        onChange={(e) => {
                          const value = e.target.value;
                          if (!value) return;

                          if (!formData.selectedStates.includes(value)) {
                            handleInputChange("selectedStates", [
                              ...formData.selectedStates,
                              value,
                            ]);
                          }
                        }}
                        className="w-full border-none outline-none text-sm bg-white"
                      >
                        <option value="">Select state</option>

                        {statesList
                          .filter(
                            (state) => !formData.selectedStates.includes(state)
                          )
                          .map((state) => (
                            <option key={state} value={state}>
                              {state}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>



                  <YesNoRadio
                    label="Will you perform structural work?"
                    value={formData.willPerformStructuralWork}
                    onChange={(val) => handleInputChange('willPerformStructuralWork', val)}
                    onInteraction={triggerAnimation}
                  />

                </div>
              </div>
            </div>

            {/*Description of operations*/}

            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">Description of operations</h2>
              </div>

              {/* User Custom Text */}
              <textarea
                value={formData.carrierApprovedDescription}
                placeholder="Add additional description here..."
                onChange={(e) => {
                  setIsDescriptionEdited(true);
                  handleInputChange("carrierApprovedDescription", e.target.value);
                }}
                // onChange={(e) =>
                //   handleInputChange("carrierApprovedDescription", e.target.value)
                // }
                rows={10}
                className="w-full px-4 py-3 text-sm border-0 focus:ring-0 resize-none"
              />
            </div>


            {/* Endorsements */}

            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Endorsements</h2>
              </div>


              <div className="space-y-3 px-4 md:px-8 pt-6 pb-7">

                <EndorsementCheckbox
                  label="Blanket Additional Insured"
                  value={formData.blanketAdditionalInsured}
                  onChange={(val) =>
                    handleInputChange("blanketAdditionalInsured", val)
                  }
                />

                <EndorsementCheckbox
                  label="Blanket Waiver of Subrogation"
                  value={formData.blanketWaiverOfSubrogation}
                  onChange={(val) =>
                    handleInputChange("blanketWaiverOfSubrogation", val)
                  }
                />

                <EndorsementCheckbox
                  label="Blanket Primary Wording"
                  value={formData.blanketPrimaryWording}
                  onChange={(val) =>
                    handleInputChange("blanketPrimaryWording", val)
                  }
                />

                <EndorsementCheckbox
                  label="Blanket Per Project Aggregate"
                  value={formData.blanketPerProjectAggregate}
                  onChange={(val) =>
                    handleInputChange("blanketPerProjectAggregate", val)
                  }
                />

                <EndorsementCheckbox
                  label="Blanket Completed Operations"
                  value={formData.blanketCompletedOperations}
                  onChange={(val) =>
                    handleInputChange("blanketCompletedOperations", val)
                  }
                />

                <EndorsementCheckbox
                  label="Notice of Cancellation to Third Parties"
                  value={formData.noticeOfCancellationThirdParties}
                  onChange={(val) =>
                    handleInputChange("noticeOfCancellationThirdParties", val)
                  }
                />

              </div>

            </div>

            {/* Payment Options */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Payment Options</h2>
              </div>
              <div className="px-4 md:px-8 pt-6 pb-7">

                <div className="space-y-6 mt-1">
                  {/* <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_320px] gap-4 md:gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">Broker Fee</label>
                    <div></div>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                      <input
                        type="text"
                        value={formData.brokerFee ? formatCurrencyInput(formData.brokerFee) : ''}
                        onChange={(e) => {
                          const formatted = formatCurrencyInput(e.target.value);
                          handleInputChange('brokerFee', formatted);
                        }}
                        onBlur={(e) => {
                          const parsed = parseCurrency(e.target.value);
                          handleInputChange('brokerFee', parsed > 0 ? parsed.toString() : '0');
                        }}
                        className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-[200px_1fr_320px] gap-4 md:gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">Display Broker Fee Line on Retail Proposal?</label>
                    <div></div>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.displayBrokerFee === true}
                          onChange={() => {
                            handleInputChange('displayBrokerFee', true);
                            triggerAnimation();
                          }}
                          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.displayBrokerFee === false}
                          onChange={() => {
                            handleInputChange('displayBrokerFee', false);
                            triggerAnimation();
                          }}
                          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </div> */}

                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-start">
                    <label className="text-sm font-medium text-gray-900 pt-2">Payment Options</label>
                    <div></div>
                    <div>
                      <select
                        value={formData.paymentOption}
                        onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      >
                        <option value="" selected disabled hidden>Select payment option</option>
                        <option value="Full Pay">Full Pay</option>
                        <option value="Premium Financial Partners Co.">Premium Financial Partners Co.</option>
                      </select>
                      {/* <p className="text-xs text-gray-500 mt-1">
                      Note: Financing options will not be available until the zip is filled out and a product is selected.
                    </p> */}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Information */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Company Information</h2>
              </div>
              <div className="px-4 md:px-8 pt-6 pb-7">

                <div className="space-y-6 mt-1">
                  <GridRow label="Do you hold a contractors license?" itemsCenter>
                    <div className="flex items-center gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.contractorsLicense === true}
                          onChange={() => handleInputChange('contractorsLicense', true)}
                          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
                        />
                        <span className="text-sm text-gray-700">Yes</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          checked={formData.contractorsLicense === false}
                          onChange={() => handleInputChange('contractorsLicense', false)}
                          className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
                        />
                        <span className="text-sm text-gray-700">No</span>
                      </label>
                    </div>
                  </GridRow>

                  {formData.contractorsLicense && (
                    <>
                      <GridRow label="License #" itemsCenter>
                        <input
                          type="text"
                          value={formData.licenseNumber}
                          onChange={(e) => handleInputChange('licenseNumber', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </GridRow>
                      <GridRow label="License Classification" itemsCenter>
                        <input
                          type="text"
                          value={formData.licenseClassification}
                          onChange={(e) => handleInputChange('licenseClassification', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </GridRow>
                    </>
                  )}

                  <GridRow label="DBA" itemsCenter>
                    <input
                      type="text"
                      value={formData.dba}
                      onChange={(e) => handleInputChange('dba', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      placeholder="Doing Business As"
                    />
                  </GridRow>

                  <GridRow label="First Name" itemsCenter>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </GridRow>

                  <GridRow label="Last Name" itemsCenter>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </GridRow>

                  <GridRow label="Years of experience in the Trades" itemsCenter>
                    <input
                      type="number"
                      value={formData.yearsOfExperienceTrade}
                      placeholder="4"
                      onChange={(e) => handleInputChange('yearsOfExperienceTrade', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                    />
                  </GridRow>

                  <GridRow label="Entity of Company" itemsCenter>
                    <select
                      value={formData.entityType}
                      onChange={(e) => handleInputChange('entityType', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    >
                      <option>Individual</option>
                      <option>Corporation</option>
                      <option>Partnership</option>
                      <option>LLC</option>
                      <option>Other</option>
                    </select>
                  </GridRow>


                  {/* <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-start">
                  <label className="text-sm font-medium text-gray-900 pt-2">
                    Applicant SSN
                    <span
                      className="text-blue-500 ml-1 cursor-help"
                      title="Social Security Number"
                    >
                      ⓘ
                    </span>
                  </label>
                  <div></div> */}

                  {/* <div>
                    <input
                      type="text"
                      value={formData.applicantSSN}
                      onChange={(e) => {
                        const value = e.target.value;
                        const formatted = formatSSN(value);
                        handleInputChange("applicantSSN", formatted);
                        validateSSN(formatted);
                      }}
                      className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm ${validationErrors.ssn
                        ? "border-red-300 bg-red-50"
                        : "border-gray-300"
                        }`}
                      placeholder="111-22-1234"
                      maxLength={11}
                    />

                    )}
                  </div> */}
                  <GridRow label="Applicant Phone" itemsCenter>
                    <div>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          const value = e.target.value;
                          const formatted = formatPhone(value);
                          handleInputChange('phone', formatted);
                          validatePhone(formatted, 'phone');
                        }}
                        className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm ${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'
                          }`}
                        placeholder="(123) 456-7890"
                        maxLength={14}
                      />
                      {validationErrors.phone && (
                        <div className="flex items-center gap-1 mt-1">
                          <span className="text-red-600">⚠</span>
                          <span className="text-sm text-red-600">{validationErrors.phone}</span>
                        </div>
                      )}
                    </div>
                  </GridRow>

                  <GridRow label="Applicant Email" itemsCenter>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      placeholder="insured@example.com"
                    />
                  </GridRow>

                </div>
              </div>
            </div>

            {/* Applicant Physical Location */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Applicant Physical Location</h2>
              </div>
              <div className="px-4 md:px-8 pt-6 pb-7">

                {/* ROW 1 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 md:mb-7">

                  {/* Address */}
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-900 mb-2 md:mb-3">
                      Address
                    </label>
                    <input
                      ref={addressInputRef}
                      type="text"
                      value={formData.streetAddress}
                      onChange={(e) => handleAddressSearch(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      placeholder="Start typing address..."
                      autoComplete="off"
                    />

                    {/* Loading */}
                    {addressLoading && (
                      <div className="absolute right-3 top-9 text-xs text-gray-400">Searching...</div>
                    )}

                    {/* Dropdown */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div
                        ref={suggestionRef}
                        className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                      >
                        {addressSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            onMouseDown={() => handleSelectSuggestion(suggestion)}
                            className="px-4 py-3 hover:bg-[#f5f2ef] cursor-pointer text-sm border-b border-gray-100 last:border-0"
                          >
                            <span className="font-medium">{suggestion.street_line} {suggestion.secondary}</span>
                            <span className="text-gray-500 ml-1">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>



                  {/* Apt/Suite */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 md:mb-3">Apt/Suite</label>
                    <input
                      type="text"
                      value={formData.aptSuite}
                      onChange={(e) => handleInputChange('aptSuite', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      placeholder="Apt. #24"
                    />
                  </div>

                </div>

                {/* ROW 2 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* City */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 md:mb-3">City</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </div>

                  {/* Zip */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 md:mb-3">Zip</label>
                    <input
                      type="text"
                      value={formData.zip}
                      onChange={(e) => handleInputChange("zip", e.target.value)}
                      maxLength={5}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                    />
                  </div>

                  {/* State */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2 md:mb-3">State</label>
                    <select
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                    >
                      {statesList.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                </div>

              </div>
            </div>


            {/* General Liability Loss Information */}
            <div>
              {formData.generalLiabilityLosses.length > 0 && (
                <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200 mt-6">

                  <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                    <h2 className="text-lg font-semibold">
                      General Liability Loss Information
                    </h2>
                  </div>

                  <div className="px-8 pt-6 pb-7 space-y-6">

                    {/* Header */}
                    <div className="hidden md:grid grid-cols-[100px_1fr_200px_200px] gap-x-6 text-sm font-semibold text-gray-900">
                      <div></div>
                      <div></div>
                      <div>Date of Loss</div>
                      <div>Amount of Loss</div>
                    </div>

                    {/* Rows */}
                    {formData.generalLiabilityLosses.map((loss, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-1 md:grid-cols-[100px_1fr_200px_200px] gap-4 md:gap-x-6 items-start md:items-center p-4 md:p-0 border md:border-0 border-gray-100 rounded-lg"
                      >
                        {/* Delete */}
                        <div className="flex justify-between items-center md:block">
                          <span className="md:hidden text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.generalLiabilityLosses];
                              updated.splice(index, 1);

                              handleInputChange("generalLiabilityLosses", updated);

                              // If no losses left, reset dropdown to 0
                              if (updated.length === 0) {
                                handleInputChange("lossesLast5Years", "0");
                              }
                            }}
                            className="text-red-500 text-lg"
                          >
                            🗑
                          </button>
                        </div>

                        <div className="text-sm text-gray-900 md:hidden font-medium">
                          General Liability Loss #{index + 1}
                        </div>

                        <div className="hidden md:block text-sm text-gray-900">
                          General Liability Loss
                        </div>

                        <div>
                          <span className="md:hidden text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">Date of Loss</span>
                          <input
                            type="date"
                            value={loss.dateOfLoss}
                            onChange={(e) => {
                              const updated = [...formData.generalLiabilityLosses];
                              updated[index].dateOfLoss = e.target.value;
                              handleInputChange("generalLiabilityLosses", updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>

                        <div>
                          <span className="md:hidden text-xs font-semibold text-gray-500 block mb-1 uppercase tracking-wider">Amount of Loss</span>
                          <input
                            type="text"
                            placeholder="$0"
                            value={loss.amountOfLoss}
                            onChange={(e) => {
                              const updated = [...formData.generalLiabilityLosses];
                              updated[index].amountOfLoss = e.target.value;
                              handleInputChange("generalLiabilityLosses", updated);
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Add Loss */}
                    <button
                      type="button"
                      onClick={() =>
                        handleInputChange("generalLiabilityLosses", [
                          ...formData.generalLiabilityLosses,
                          { dateOfLoss: "", amountOfLoss: "" },
                        ])
                      }
                      className="text-[#9A8B7A] text-sm font-semibold"
                    >
                      + Add Loss Information
                    </button>

                  </div>
                </div>
              )}


            </div>


            {/* Type of Work Performed */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">Type of Work Performed</h2>
              </div>
              <div className="px-4 md:px-8 pt-6 pb-7">

                <div className="space-y-7 mt-1">

                  {/* % New Construction */}
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_120px] items-start md:items-center gap-2 md:gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Percentage of work performed on New Construction Projects
                    </label>

                    <div className="flex justify-start md:justify-end">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          value={formData.newConstructionPercent}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, "");
                            const num = Math.min(Number(value), 100);

                            handleInputChange("newConstructionPercent", num.toString());
                            handleInputChange(
                              "remodelServiceRepairPercent",
                              (100 - num).toString()
                            );
                          }}
                          className="w-full md:w-[90px] px-3 py-2 border border-gray-300 rounded text-sm text-left md:text-right focus:ring-1 focus:ring-[#9A8B7A]"
                        />
                        <span className="text-sm text-gray-600">%</span>
                      </div>
                    </div>
                  </div>



                  {/* % Remodel / Service / Repair */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Percentage of Remodel/Service/Repair work performed
                    </label>

                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.remodelServiceRepairPercent}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const num = Math.min(Number(value), 100);

                          handleInputChange("remodelServiceRepairPercent", num.toString());
                          handleInputChange(
                            "newConstructionPercent",
                            (100 - num).toString()
                          );
                        }}
                        className="w-[90px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>


                  {/* % Residential */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Percentage of Residential work performed:
                    </label>

                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.residentialPercent}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const num = Math.min(Number(value), 100);

                          handleInputChange("residentialPercent", num.toString());
                          handleInputChange(
                            "commercialPercent",
                            (100 - num).toString()
                          );
                        }}
                        className="w-[90px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>


                  {/* % Commercial */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Percentage of Commercial work performed:
                    </label>

                    <div className="flex items-center gap-2 justify-end">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={formData.commercialPercent}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const num = Math.min(Number(value), 100);

                          handleInputChange("commercialPercent", num.toString());
                          handleInputChange(
                            "residentialPercent",
                            (100 - num).toString()
                          );
                        }}
                        className="w-[90px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  </div>


                  {/* Max Interior Stories */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Maximum # of Interior Stories:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.maxInteriorStories}
                      onChange={(e) =>
                        handleInputChange(
                          "maxInteriorStories",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      className="w-[120px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                    />
                  </div>

                  {/* Max Exterior Stories */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Maximum # of Exterior Stories:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.maxExteriorStories}
                      onChange={(e) =>
                        handleInputChange(
                          "maxExteriorStories",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      className="w-[120px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                    />
                  </div>

                  {/* Max Exterior Depth Below Grade */}
                  <div className="grid grid-cols-[1fr_120px] items-center gap-x-6">
                    <label className="text-sm font-medium text-gray-900">
                      Maximum Exterior Depth Below Grade in Feet:
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={formData.maxExteriorDepthBelowGrade}
                      onChange={(e) =>
                        handleInputChange(
                          "maxExteriorDepthBelowGrade",
                          e.target.value.replace(/\D/g, "")
                        )
                      }
                      className="w-[120px] px-3 py-2 border border-gray-300 rounded text-sm text-right focus:ring-1 focus:ring-[#9A8B7A]"
                    />
                  </div>




                  {/* <YesNoRadio
                  label="Will you or any subcontractor perform work below grade?"
                  value={formData.workBelowGrade}
                  onChange={(val) => handleInputChange('workBelowGrade', val)}
                />

                {formData.workBelowGrade && (
                  <div className="grid grid-cols-2 gap-6 pl-4 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">What is the Maximum Depth in feet</label>
                      <input
                        type="number"
                        value={formData.belowGradeDepth}
                        onChange={(e) => handleInputChange('belowGradeDepth', e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">What is the Percentage of operations</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.belowGradePercent}
                          onChange={(e) => handleInputChange('belowGradePercent', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                          max="100"
                        />
                        <span className="absolute right-3 top-2 text-gray-500">%</span>
                      </div>
                    </div>
                  </div>
                )} */}

                  {/* <YesNoRadio
                  label="Have you or will you build on a hillside?"
                  value={formData.buildOnHillside}
                  onChange={(val) => handleInputChange('buildOnHillside', val)}
                /> */}

                  {/* {formData.buildOnHillside && (
                  <div className="pl-4 border-l-2 border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                    <textarea
                      value={formData.hillsideExplanation}
                      onChange={(e) => handleInputChange('hillsideExplanation', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </div>
                )} */}

                  <YesNoRadio
                    label="Will you perform or subcontract any roofing operations, work on the roof or deck work on roofs?"
                    value={formData.performRoofingOps}
                    disableNo={hasRoofingSelected}
                    onChange={(val) => {
                      // Prevent selecting NO if roofing class exists
                      if (hasRoofingSelected && val === false) return;

                      handleInputChange("performRoofingOps", val);

                      if (val === true) {
                        // If manually selecting YES (not from class code)
                        if (!hasRoofingSelected) {
                          handleInputChange("roofingOpsExplanation", "");
                        }
                      }

                      if (val === false) {
                        handleInputChange("roofingOpsExplanation", "");
                      }
                    }}
                  />

                  {formData.performRoofingOps && (
                    <div className="pl-4 border-l-2 border-gray-200 mt-4">
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Please explain:
                      </label>

                      <textarea
                        value={formData.roofingOpsExplanation}
                        onChange={(e) =>
                          handleInputChange("roofingOpsExplanation", e.target.value)
                        }
                        rows={3}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  {/* <YesNoRadio
                    label="Will you perform or subcontract any roofing operations, work on the roof or deck work on roofs?"
                    value={formData.performRoofingOps}
                    onChange={(val) => {
                      handleInputChange("performRoofingOps", val);

                      if (val === true) {
                        handleInputChange(
                          "roofingOpsExplanation",
                          "Performs roofing operations as indicated by class code selection,"
                        );
                      } else {
                        handleInputChange("roofingOpsExplanation", "");
                      }
                    }}
                  />

                  {formData.performRoofingOps && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.roofingOpsExplanation}
                        onChange={(e) => handleInputChange('roofingOpsExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )} */}

                  {/* <YesNoRadio
                  label="Will you be acting as the General Contractor on any projects?"
                  value={formData.actAsGeneralContractor}
                  onChange={(val) => handleInputChange('actAsGeneralContractor', val)}
                />

                {formData.actAsGeneralContractor && (
                  <div className="pl-4 border-l-2 border-gray-200">
                    <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                    <textarea
                      value={formData.generalContractorExplanation}
                      onChange={(e) => handleInputChange('generalContractorExplanation', e.target.value)}
                      rows={2}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                    />
                  </div>
                )} */}

                  <YesNoRadio
                    label="Will you perform any waterproofing?"
                    value={formData.performWaterproofing}
                    onChange={(val) => handleInputChange('performWaterproofing', val)}
                  />

                  {formData.performWaterproofing && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.waterproofingExplanation}
                        onChange={(e) => handleInputChange('waterproofingExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                  <YesNoRadio
                    label="Do you use motorized or heavy equipment in any of your operations?"
                    value={formData.useHeavyEquipment}
                    onChange={(val) => handleInputChange('useHeavyEquipment', val)}
                  />

                  {formData.useHeavyEquipment && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                        <textarea
                          value={formData.heavyEquipmentExplanation}
                          onChange={(e) => handleInputChange('heavyEquipmentExplanation', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </div>

                      {/* <YesNoRadio
                      label="Are you and all employees that operate heavy equipment certified to do so?"
                      value={formData.heavyEquipmentOperatorsCertified}
                      onChange={(val) => handleInputChange('heavyEquipmentOperatorsCertified', val)}
                    />

                    {!formData.heavyEquipmentOperatorsCertified && (
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          If no, advise on # of years experience required to operate heavy equipment
                        </label>
                        <input
                          type="number"
                          value={formData.heavyEquipmentYearsExpRequired}
                          onChange={(e) => handleInputChange('heavyEquipmentYearsExpRequired', e.target.value)}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </div>
                    )} */}
                    </div>
                  )}

                  <YesNoRadio
                    label="Will you perform work in new tract home developments of 25 or more units?"
                    value={formData.workNewTractHomes}
                    onChange={(val) => handleInputChange('workNewTractHomes', val)}
                  />

                  {formData.workNewTractHomes && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.tractHomesExplanation}
                        onChange={(e) => handleInputChange('tractHomesExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                  <YesNoRadio
                    label="Will any of your work involve the construction of or be for new condominiums/townhouses/multi-unit residences?"
                    value={formData.workCondoConstruction}
                    onChange={(val) => handleInputChange('workCondoConstruction', val)}
                  />

                  {/* {formData.workCondoConstruction && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.condoConstructionExplanation}
                        onChange={(e) => handleInputChange('condoConstructionExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>

                    <YesNoRadio
                      label="Will any of the complexes contain 15 or more units?"
                      value={formData.condoUnits15OrMore}
                      onChange={(val) => handleInputChange('condoUnits15OrMore', val)}
                    />
                  </div>
                )} */}

                  <YesNoRadio
                    label="Will you perform repair only for individual unit owners of condominiums/townhouses/multi-unit residences? "
                    value={formData.performCondoStructuralRepair}
                    onChange={(val) => handleInputChange('performCondoStructuralRepair', val)}
                  />

                  {/* {formData.performCondoStructuralRepair && (
                  <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.condoRepairExplanation}
                        onChange={(e) => handleInputChange('condoRepairExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>

                    <YesNoRadio
                      label="Will any of the complexes contain 15 or more units?"
                      value={formData.condoRepairUnits25OrMore}
                      onChange={(val) => handleInputChange('condoRepairUnits25OrMore', val)}
                    />
                  </div>
                )} */}

                  <YesNoRadio
                    label="Will you perform OCIP (Wrap-up) work?"
                    value={formData.performOCIPWork}
                    onChange={(val) =>
                      handleInputChange("performOCIPWork", val)
                    }
                  />

                  {formData.performOCIPWork && (
                    <div className="space-y-5 mt-4">

                      {/* OCIP / Wrap-up receipts */}
                      <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                        <label className="text-sm font-medium text-gray-900">
                          If "Yes", what are the estimated receipts for work covered separately under OCIP/Wrap-up?
                        </label>
                        <div></div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="text"
                            value={
                              formData.ocipWrapUpReceipts
                                ? formatCurrencyInput(formData.ocipWrapUpReceipts)
                                : ""
                            }
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(e.target.value);
                              handleInputChange("ocipWrapUpReceipts", formatted);
                            }}
                            onBlur={(e) => {
                              const parsed = parseCurrency(e.target.value);
                              handleInputChange(
                                "ocipWrapUpReceipts",
                                parsed > 0 ? parsed.toString() : ""
                              );
                            }}
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                          />
                        </div>
                      </div>

                      {/* Non-OCIP receipts */}
                      <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                        <label className="text-sm font-medium text-gray-900">
                          Estimated Receipts for non-Wrap/OCIP:
                        </label>
                        <div></div>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                          <input
                            type="text"
                            value={
                              formData.nonOcipReceipts
                                ? formatCurrencyInput(formData.nonOcipReceipts)
                                : ""
                            }
                            onChange={(e) => {
                              const formatted = formatCurrencyInput(e.target.value);
                              handleInputChange("nonOcipReceipts", formatted);
                            }}
                            onBlur={(e) => {
                              const parsed = parseCurrency(e.target.value);
                              handleInputChange(
                                "nonOcipReceipts",
                                parsed > 0 ? parsed.toString() : ""
                              );
                            }}
                            className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                          />
                        </div>
                      </div>

                    </div>
                  )}

                  <YesNoRadio
                    label="Will you or do you perform or subcontract any work involving the following: blasting operations, hazardous waste, asbestos, mold, PCBs, museums, historic buildings, oil fields, dams/levees, bridges, quarries, railroads, earthquake retrofitting, fuel tanks, pipelines, or foundation repair?"
                    value={formData.performHazardousWork}
                    onChange={(val) => handleInputChange('performHazardousWork', val)}
                  />

                  {formData.performHazardousWork && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.hazardousWorkExplanation}
                        onChange={(e) => handleInputChange('hazardousWorkExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                  <YesNoRadio
                    label="Will you or do you perform or subcontract any work involving the following: medical facilities (including new construction), hospitals (including new construction), churches or other house of worship, museums, historic buildings, airports, schools/playgrounds/recreational facilities (including new construction)?"
                    value={formData.performMedicalFacilities}
                    onChange={(val) => handleInputChange('performMedicalFacilities', val)}
                  />

                  {formData.performMedicalFacilities && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.medicalFacilitiesExplanation}
                        onChange={(e) => handleInputChange('medicalFacilitiesExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                  <YesNoRadio
                    label="Will you perform work (new/remodel) on single family residences, in which the dwelling exceeds 5,000 square feet?"
                    value={formData.workOver5000SqFt}
                    onChange={(val) => handleInputChange('workOver5000SqFt', val)}
                  />

                  {formData.workOver5000SqFt && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                        <textarea
                          value={formData.over5000SqFtExplanation}
                          onChange={(e) => handleInputChange('over5000SqFtExplanation', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          What percentage of your work will be on homes over 5,000 square feet?
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.over5000SqFtPercent}
                            onChange={(e) => handleInputChange('over5000SqFtPercent', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                            max="100"
                          />
                          <span className="absolute right-3 top-2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  )}


                  <YesNoRadio
                    label="Will you perform work on commercial buildings over 20,000 square feet? "
                    value={formData.workOver20000SqFt}
                    onChange={(val) => handleInputChange('workOver20000SqFt', val)}
                  />

                  {formData.workOver20000SqFt && (
                    <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                        <textarea
                          value={formData.over20000SqFtExplanation}
                          onChange={(e) => handleInputChange('over20000SqFtExplanation', e.target.value)}
                          rows={2}
                          className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-900 mb-3">
                          What percentage of your work will be on commercial buildings over 20,000 square feet?
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            value={formData.over20000SqFtPercent}
                            onChange={(e) => handleInputChange('over20000SqFtPercent', e.target.value)}
                            className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                            max="100"
                          />
                          <span className="absolute right-3 top-2 text-gray-500">%</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Business Information */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">Additional Business Information</h2>
              </div>
              <div className="px-8 pt-6 pb-7">

                <div className="space-y-7 mt-1">

                  <YesNoRadio
                    label="Are there any other business names which you have used in the past or are currently using in addition to that for which you’re currently applying for insurance? "
                    value={formData.otherBusinessNames}
                    onChange={(val) => handleInputChange('otherBusinessNames', val)}
                  />

                  {formData.otherBusinessNames && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.otherBusinessNamesExplanation}
                        onChange={(e) => handleInputChange('otherBusinessNamesExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}
                  <YesNoRadio
                    label="Has any licensing authority taken any action against you, your company or any affiliates?"
                    value={formData.licensingActionTaken}
                    onChange={(val) => handleInputChange('licensingActionTaken', val)}
                  />

                  {formData.licensingActionTaken && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.licensingActionTakenExplanation}
                        onChange={(e) => handleInputChange('licensingActionTakenExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}
                  <YesNoRadio
                    label="Have you allowed or will you allow your license to be used by any other contractor?"
                    value={formData.licenseSharedWithOthers}
                    onChange={(val) => handleInputChange('licenseSharedWithOthers', val)}
                  />

                  {formData.licenseSharedWithOthers && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.licenseSharedWithOthersExplanation}
                        onChange={(e) => handleInputChange('licenseSharedWithOthersExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}
                  <YesNoRadio
                    label="Has the applicant or business owner ever had any judgements or liens filed against them or filed for bankruptcy?"
                    value={formData.judgementsOrLiens}
                    onChange={(val) => handleInputChange('judgementsOrLiens', val)}
                  />

                  {formData.judgementsOrLiens && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.judgementsOrLiensExplanation}
                        onChange={(e) => handleInputChange('judgementsOrLiensExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}
                  <YesNoRadio
                    label="Has any lawsuit ever been filed or any claim otherwise been made against your company (including any partnership or any joint venture of which you have been a member of, any of your company's predecessors, or any person, company or entities on whose behalf your company has assumed liability?"
                    value={formData.lawsuitsOrClaims}
                    onChange={(val) => handleInputChange('lawsuitsOrClaims', val)}
                  />

                  {formData.lawsuitsOrClaims && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.lawsuitsOrClaimsExplanation}
                        onChange={(e) => handleInputChange('lawsuitsOrClaimsExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}
                  <YesNoRadio
                    label="Is your company aware of any facts, circumstances, incidents, situations, damages or accidents (including but not limited to: faulty or defective workmanship, product failure, construction dispute, property damage or construction worker injury) that a reasonably prudent person might expect to give rise to a claim or lawsuit, whether valid or not, which might directly or indirectly involve the company?"
                    value={formData.knownIncidentsOrClaims}
                    onChange={(val) => handleInputChange('knownIncidentsOrClaims', val)}
                  />

                  {formData.knownIncidentsOrClaims && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">Please explain:</label>
                      <textarea
                        value={formData.knownIncidentsOrClaimsExplanation}
                        onChange={(e) => handleInputChange('knownIncidentsOrClaimsExplanation', e.target.value)}
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                  <YesNoRadio
                    label="Do you have a written contract for all work you perform?"
                    value={formData.writtenContractForAllWork}
                    onChange={(val) => handleInputChange('writtenContractForAllWork', val)}
                  />

                  {formData.writtenContractForAllWork === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.writtenContractForAllWorkExplanation}
                        onChange={(e) =>
                          handleInputChange('writtenContractForAllWorkExplanation', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  <YesNoRadio
                    label="Does the contract identify a start date for the work?"
                    value={formData.contractHasStartDate}
                    onChange={(val) => handleInputChange('contractHasStartDate', val)}
                  />

                  {formData.contractHasStartDate === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.contractHasStartDateExplanation}
                        onChange={(e) =>
                          handleInputChange('contractHasStartDateExplanation', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  <YesNoRadio
                    label="Does the contract identify a precise scope of work?"
                    value={formData.contractHasScopeOfWork}
                    onChange={(val) => handleInputChange('contractHasScopeOfWork', val)}
                  />

                  {formData.contractHasScopeOfWork === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.contractHasScopeOfWorkExplanation}
                        onChange={(e) =>
                          handleInputChange('contractHasScopeOfWorkExplanation', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  <YesNoRadio
                    label="Does the contract identify all subcontracted trades (if any)?"
                    value={formData.contractIdentifiesSubTrades}
                    onChange={(val) => handleInputChange('contractIdentifiesSubTrades', val)}
                  />

                  {formData.contractIdentifiesSubTrades === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.contractIdentifiesSubTradesExplanation}
                        onChange={(e) =>
                          handleInputChange(
                            'contractIdentifiesSubTradesExplanation',
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  <YesNoRadio
                    label="Does the contract provide a set price?"
                    value={formData.contractHasSetPrice}
                    onChange={(val) => handleInputChange('contractHasSetPrice', val)}
                  />

                  {formData.contractHasSetPrice === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.contractHasSetPriceExplanation}
                        onChange={(e) =>
                          handleInputChange('contractHasSetPriceExplanation', e.target.value)
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}


                  <YesNoRadio
                    label="Is the contract signed by all parties to the contract?"
                    value={formData.contractSignedByAllParties}
                    onChange={(val) => handleInputChange('contractSignedByAllParties', val)}
                  />

                  {formData.contractSignedByAllParties === false && (
                    <div className="pl-4 border-l-2 border-gray-200">
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        If No, please explain:
                      </label>
                      <textarea
                        value={formData.contractSignedByAllPartiesExplanation}
                        onChange={(e) =>
                          handleInputChange(
                            'contractSignedByAllPartiesExplanation',
                            e.target.value
                          )
                        }
                        rows={2}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                      />
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* Subcontractors */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
              <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">Subcontractors</h2>
              </div>

              <div className="px-8 pt-6 pb-7 space-y-7">

                {/* Use Subcontractors */}
                <YesNoRadio
                  label="Do you use subcontractors?"
                  value={formData.useSubcontractors}
                  onChange={handleUseSubcontractorsChange}
                />

                {/* Sub-questions */}
                <div
                  className={`space-y-6 pl-4 border-l-2 border-gray-200 ${!formData.useSubcontractors ? "opacity-60 pointer-events-none" : ""
                    }`}
                >

                  {/* Certificates of Insurance */}
                  <YesNoRadio
                    label="Do you always collect certificates of insurance from subcontractors?"
                    value={formData.collectSubCertificates}
                    disabled={!formData.useSubcontractors}
                    onChange={(val) =>
                      handleInputChange("collectSubCertificates", val)
                    }
                  />

                  {formData.collectSubCertificates === false && (
                    <textarea
                      placeholder="If No, please explain"
                      value={formData.collectSubCertificatesExplanation}
                      onChange={(e) =>
                        handleInputChange(
                          "collectSubCertificatesExplanation",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm"
                    />
                  )}

                  {/* Insurance Limits */}
                  <YesNoRadio
                    label="Do you require subcontractors to have insurance limits equal to your own?"
                    value={formData.requireSubInsuranceEqual}
                    disabled={!formData.useSubcontractors}
                    onChange={(val) =>
                      handleInputChange("requireSubInsuranceEqual", val)
                    }
                  />

                  {formData.requireSubInsuranceEqual === false && (
                    <textarea
                      placeholder="If No, please explain"
                      value={formData.requireSubInsuranceEqualExplanation}
                      onChange={(e) =>
                        handleInputChange(
                          "requireSubInsuranceEqualExplanation",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm"
                    />
                  )}

                  {/* Additional Insured */}
                  <YesNoRadio
                    label="Do you always require subcontractors to name you as additional insured?"
                    value={formData.requireAdditionalInsured}
                    disabled={!formData.useSubcontractors}
                    onChange={(val) =>
                      handleInputChange("requireAdditionalInsured", val)
                    }
                  />

                  {formData.requireAdditionalInsured === false && (
                    <textarea
                      placeholder="If No, please explain"
                      value={formData.requireAdditionalInsuredExplanation}
                      onChange={(e) =>
                        handleInputChange(
                          "requireAdditionalInsuredExplanation",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm"
                    />
                  )}

                  {/* Written Contract */}
                  <YesNoRadio
                    label="Do you have a standard formal written contract with subcontractors?"
                    value={formData.haveWrittenSubContracts}
                    disabled={!formData.useSubcontractors}
                    onChange={(val) =>
                      handleInputChange("haveWrittenSubContracts", val)
                    }
                  />

                  {formData.haveWrittenSubContracts === false && (
                    <textarea
                      placeholder="If No, please explain"
                      value={formData.haveWrittenSubContractsExplanation}
                      onChange={(e) =>
                        handleInputChange(
                          "haveWrittenSubContractsExplanation",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm"
                    />
                  )}

                  {/* Workers Comp */}
                  <YesNoRadio
                    label="Do you require subcontractors to carry Worker’s Compensation?"
                    value={formData.requireWorkersComp}
                    disabled={!formData.useSubcontractors}
                    onChange={(val) =>
                      handleInputChange("requireWorkersComp", val)
                    }
                  />

                  {formData.requireWorkersComp === false && (
                    <textarea
                      placeholder="If No, please explain"
                      value={formData.requireWorkersCompExplanation}
                      onChange={(e) =>
                        handleInputChange(
                          "requireWorkersCompExplanation",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm"
                    />
                  )}

                </div>
              </div>
            </div>




            {/* Excess Liability Coverage */}
            <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">

              {/* Header */}
              <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">Add Excess Liability coverage</h2>
              </div>

              <div className="px-8 pt-6 pb-7 space-y-7">

                {/* Product info */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="text-[18px] font-semibold tracking-tight">
                    Add Excess Liability
                  </h3>
                  {/* <p className="text-sm font-semibold text-gray-700 mb-1">
                    Sutton – A-, VII Rated
                  </p>
                  <p className="text-sm text-gray-600 mb-1">Non-Admitted</p> */}
                  <p className="text-sm text-gray-600">
                    Covers General Liability, Auto, Employers Liability
                  </p>
                </div>

                {/* Yes / No */}
                <YesNoRadio
                  label=""
                  value={formData.addExcessLiability}
                  onChange={(val) => handleInputChange("addExcessLiability", val)}
                />
              </div>
            </div>

            {/* ================= EXCESS QUESTIONS ================= */}
            {formData.addExcessLiability && (
              <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200 mt-6">

                <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                  <h2 className="text-lg font-semibold">Excess Questions</h2>
                </div>

                <div className="px-8 pt-6 pb-7 space-y-6">

                  {/* Desired Effective Date */}
                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">
                      Desired Effective Date
                    </label>
                    <div></div>
                    <input
                      type="text"
                      disabled
                      placeholder="Same as GL effective date"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded text-sm bg-gray-100 text-gray-500"
                    />
                  </div>

                  {/* Excess Limits */}
                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">
                      Excess Limits
                    </label>
                    <div></div>
                    <select
                      value={formData.excessLiabilityLimit || ""}
                      onChange={(e) =>
                        handleInputChange("excessLiabilityLimit", e.target.value)
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm bg-white"
                    >
                      <option value="">Select Limit</option>
                      <option value="1,000,000">$1,000,000</option>
                      <option value="2,000,000">$2,000,000</option>
                      <option value="3,000,000">$3,000,000</option>
                      <option value="4,000,000">$4,000,000</option>
                      <option value="5,000,000">$5,000,000</option>
                    </select>
                  </div>

                  {/* Underlying policies */}
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-gray-900">
                      Underlying policies to be covered in addition to underlying GL policy
                    </p>

                    <YesNoRadio
                      label="Employer’s Liability (Workers Comp)"
                      value={formData.employersLiabilityWC}
                      onChange={(val) =>
                        handleInputChange("employersLiabilityWC", val)
                      }
                    />
                    <YesNoRadio
                      label="Auto"
                      value={formData.auto}
                      onChange={(val) =>
                        handleInputChange("auto", val)
                      }
                    />
                  </div>

                  {/* Combined losses (ALWAYS visible, DISABLED) */}
                  <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900">
                      Combined # of losses across all underlying policies in last 5 years
                    </label>
                    <div></div>
                    <select
                      value={formData.combinedUnderlyingLosses}
                      disabled={!formData.employersLiabilityWC}
                      onChange={(e) =>
                        handleInputChange(
                          "combinedUnderlyingLosses",
                          e.target.value
                        )
                      }
                      className={`w-full px-4 py-2.5 border border-gray-300 rounded text-sm ${formData.employersLiabilityWC
                        ? "bg-white focus:ring-1 focus:ring-[#9A8B7A]"
                        : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      <option value="0">0</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5</option>
                      <option value="6+">6+</option>
                    </select>
                  </div>


                  {/* Employer’s Liability Limits (ONLY when YES) */}
                  {formData.employersLiabilityWC && (
                    <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                      <label className="text-sm font-medium text-gray-900">
                        Employer’s Liability (Workers Comp) Limits
                      </label>
                      <div></div>
                      <select
                        value={formData.employersLiabilityWCLimit || ""}
                        onChange={(e) =>
                          handleInputChange(
                            "employersLiabilityWCLimit",
                            e.target.value
                          )
                        }
                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm bg-white"
                      >
                        <option value="">Select Limits</option>
                        <option value="$100k/$500k/$100k">$100k / $500k / $100k</option>
                        <option value="$500k/$500k/$500k">$500k / $500k / $500k</option>
                        <option value="$1M/$1M/$1M">$1M / $1M / $1M</option>
                      </select>
                    </div>
                  )}

                </div>
              </div>
            )}
            {/* ================= END EXCESS QUESTIONS ================= */}





            {/* Bottom Buttons */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-10">
              <Link
                href="/agency/dashboard"
                className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50"
              >
                Return to Dashboard
              </Link>

              <div className="flex flex-col md:flex-row items-center gap-3">
                {/* Download PDF Button */}
                <button
                  type="button"
                  onClick={handleDownloadApplicationPDF}
                  disabled={isSubmitting || isDownloadingPDF}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2 shadow-sm hover:shadow-md transition-shadow"
                >
                  {isDownloadingPDF ? (
                    <>
                      <div className="w-5 h-5 border-2 border-gray-700 border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Download PDF
                    </>
                  )}
                </button>

                {/* Submit / Update Button */}
                {!isViewMode && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full md:w-auto px-8 py-4 md:py-3 bg-[#A79A87] text-black rounded-md font-semibold hover:bg-[#8F8371] active:bg-[#7A6F60] transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2 text-lg md:text-base"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                        {isEditMode ? "Updating..." : "Submitting..."}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {isEditMode ? "Update Application" : "Submit Application"}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </fieldset>
        </form>

        {/* Quote Result */}
        {calculatedPremium && quoteId && (
          <div id="quote-result" className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
              <h2 className="text-base md:text-lg font-semibold">Quote Summary</h2>
            </div>
            <div className="px-4 md:px-8 pt-6 pb-7">

              <div className="bg-gradient-to-br from-[#9A8B7A] to-[#0097A7] rounded-2xl p-6 md:p-8 text-center text-white shadow-2xl mb-6">
                <p className="text-base md:text-lg font-semibold mb-2 opacity-90">As Low As</p>
                <p className="text-4xl md:text-6xl font-bold mb-2">${calculatedPremium.toLocaleString('en-US')}</p>
                <p className="text-xs md:text-sm opacity-75">per year</p>
              </div>

              <div className="flex flex-col md:flex-row gap-4">
                <button
                  onClick={handleDownloadPDF}
                  className="w-full md:flex-1 py-4 border-2 border-[#9A8B7A] text-[#9A8B7A] rounded font-semibold hover:bg-[#9A8B7A]/5 flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Quote PDF
                </button>
                <button
                  onClick={handleEmailQuote}
                  className="w-full md:flex-1 py-4 bg-gradient-to-r from-[#9A8B7A] to-[#0097A7] text-white rounded font-semibold hover:shadow-lg flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email Quote to Client
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Completion Percentage Indicator - Fixed Bottom Right */}
      <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50">
        <div className="relative">
          {/* Circular Progress */}
          <svg className="w-16 h-16 md:w-20 md:h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="#e5e7eb"
              strokeWidth="6"
              fill="none"
            />
            <circle
              cx="40"
              cy="40"
              r="32"
              stroke="url(#progressGradient)"
              strokeWidth="6"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 32}`}
              strokeDashoffset={`${2 * Math.PI * 32 * (1 - completionPercentage / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8f5b16" />
                <stop offset="100%" stopColor="#a75c00" />
              </linearGradient>
            </defs>
          </svg>

          {/* Percentage Text */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">{completionPercentage}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}