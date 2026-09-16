"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Upload, Check, Download, HardHat, Plus, Trash2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrencyInput, parseCurrency, formatCurrency } from '@/lib/utils/currencyFormatter';

// ── Sterling section wrapper ──────────────────────────────────────
const Section = ({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) => (
  <div className="bg-white rounded shadow-md overflow-visible border border-gray-200 mb-6">
    <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-1">
      <h2 className="text-base md:text-lg font-semibold">{title}</h2>
      {subtitle && <span className="text-xs font-normal text-gray-200 italic">{subtitle}</span>}
    </div>
    <div className="px-4 md:px-8 pt-6 pb-7">
      <div className="space-y-6">{children}</div>
    </div>
  </div>
);

// ── Label + input row ─────────────────────────────────────────────
const Row = ({
  label,
  children,
  bold = false,
  required = false
}: {
  label: React.ReactNode;
  children: React.ReactNode;
  bold?: boolean;
  required?: boolean
}) => (
  <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_340px] gap-4 md:gap-x-6 items-start">
    <label className={`text-sm text-gray-900 md:pt-2 leading-snug flex items-center min-h-[38px] ${bold ? 'font-bold' : 'font-medium'}`}>
      {label}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
    <div className="hidden md:block"></div>
    <div>{children}</div>
  </div>
);

const inp = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#7A6F64] focus:ring-1 focus:ring-[#7A6F64] bg-white";
const sel = `${inp} bg-white`;
const textareaStyle = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-[#7A6F64] focus:ring-1 focus:ring-[#7A6F64] bg-white resize-y";

const CurrencyInp = ({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string
}) => (
  <div className="relative">
    <span className="absolute left-3 top-2 text-gray-400 text-sm">$</span>
    <input
      type="text"
      value={(value || '').replace('$', '')}
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

const ENTITY_OPTIONS = [
  "Corporation",
  "Individual",
  "Partnership",
  "Municipality",
  "For Profit",
  "Joint Venture"
];

const CONSTRUCTION_MATERIALS = [
  "Frame",
  "Joisted Masonry",
  "Non-Combustible",
  "Masonry Non-Combustible",
  "Fire-Resistive"
];

const FIRE_SAFETY_SYSTEMS = [
  "Central Alarms",
  "Local Alarms",
  "Automatic Sprinklers",
  "Automatic Suppressants",
  "Manual Extinguishers"
];

const CLAIM_COVERAGE_LINES = [
  "Builders Risk",
  "Property in Transit",
  "Property in Storage",
  "Mechanical Breakdown",
  "Other Commercial Property",
  "Business Income/Extra Expense",
  "Commercial General Liability",
  "Pollution Legal Liability"
];

interface ClaimItem {
  incidentDate: string;
  linesCovered: string[];
  otherLine: string;
  circumstances: string;
  closedWithTrial: boolean | null;
  openAnticipateTrial: boolean | null;
  trialDate: string;
  proceduresChanged: boolean | null;
  totalLoss: boolean | null;
  percentLost: string;
  totalClaimed: string;
}

const defaultClaim: ClaimItem = {
  incidentDate: '',
  linesCovered: [],
  otherLine: '',
  circumstances: '',
  closedWithTrial: null,
  openAnticipateTrial: null,
  trialDate: '',
  proceduresChanged: null,
  totalLoss: null,
  percentLost: '',
  totalClaimed: ''
};

function BuildersRiskContent() {
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
  
  const [agencyAgent, setAgencyAgent] = useState(userName || '');
  const agentOptions = Array.from(new Set([...baseAgents, ...(submissionId && agencyAgent ? [agencyAgent] : [])]));
  const [brokerage, setBrokerage] = useState('');

  useEffect(() => {
    if (!agencyAgent && session?.user?.name) {
      setAgencyAgent(session.user.name);
      setBrokerage(session.user.name);
    }
  }, [session?.user?.name]);

  // ================= Form State =================
  // Section I: 1) General Information
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  const [applicantEmail, setApplicantEmail] = useState('');
  const [namedInsured, setNamedInsured] = useState('');
  const [isNewVenture, setIsNewVenture] = useState<boolean | null>(null);
  const [isRenewal, setIsRenewal] = useState<boolean | null>(null);
  const [policyNumber, setPolicyNumber] = useState('');
  const [currentEffectiveDate, setCurrentEffectiveDate] = useState('');
  const [currentExpiryDate, setCurrentExpiryDate] = useState('');
  const [requestedEffectiveDate, setRequestedEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [requestedExpiryDate, setRequestedExpiryDate] = useState('');
  const [website, setWebsite] = useState('');

  // 2) Current Carrier Information
  const [carrier, setCarrier] = useState('');
  const [limitOfInsurance, setLimitOfInsurance] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [deductible, setDeductible] = useState('');
  const [premium, setPremium] = useState('');
  const [offeringRenewal, setOfferingRenewal] = useState<boolean | null>(null);

  // Attachments
  const [lossRunsFileName, setLossRunsFileName] = useState('');
  const [operationsDocName, setOperationsDocName] = useState('');

  // 3) Mailing Address
  const [mailingAddress, setMailingAddress] = useState('');
  const [mailingCity, setMailingCity] = useState('');
  const [mailingState, setMailingState] = useState('');
  const [mailingZip, setMailingZip] = useState('');

  // 4) Property Address
  const [sameAsMailing, setSameAsMailing] = useState(false);
  const [propertyAddress, setPropertyAddress] = useState('');
  const [propertyCity, setPropertyCity] = useState('');
  const [propertyState, setPropertyState] = useState('');
  const [propertyZip, setPropertyZip] = useState('');

  // Address search & autocomplete states
  const mailingSuggestionRef = useRef<HTMLDivElement>(null);
  const [mailingSuggestions, setMailingSuggestions] = useState<any[]>([]);
  const [showMailingSuggestions, setShowMailingSuggestions] = useState(false);
  const [mailingAddressLoading, setMailingAddressLoading] = useState(false);

  const propertySuggestionRef = useRef<HTMLDivElement>(null);
  const [propertySuggestions, setPropertySuggestions] = useState<any[]>([]);
  const [showPropertySuggestions, setShowPropertySuggestions] = useState(false);
  const [propertyAddressLoading, setPropertyAddressLoading] = useState(false);

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
    setMailingAddress(`${suggestion.street_line} ${suggestion.secondary || ''}`.trim());
    setMailingCity(suggestion.city);
    setMailingZip(suggestion.zipcode);
    setMailingState(suggestion.state);
    setMailingSuggestions([]);
    setShowMailingSuggestions(false);
  };

  const handlePropertyAddressSearch = async (value: string) => {
    setPropertyAddress(value);
    if (value.length < 3) {
      setPropertySuggestions([]);
      setShowPropertySuggestions(false);
      return;
    }
    setPropertyAddressLoading(true);
    try {
      const res = await fetch(`/api/address/autocomplete?search=${encodeURIComponent(value)}`);
      const data = await res.json();
      setPropertySuggestions(data.suggestions || []);
      setShowPropertySuggestions(true);
    } catch (err) {
      console.error("Address search error:", err);
    } finally {
      setPropertyAddressLoading(false);
    }
  };

  const handleSelectPropertySuggestion = (suggestion: any) => {
    setPropertyAddress(`${suggestion.street_line} ${suggestion.secondary || ''}`.trim());
    setPropertyCity(suggestion.city);
    setPropertyZip(suggestion.zipcode);
    setPropertyState(suggestion.state);
    setPropertySuggestions([]);
    setShowPropertySuggestions(false);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (mailingSuggestionRef.current && !mailingSuggestionRef.current.contains(e.target as Node)) {
        setShowMailingSuggestions(false);
      }
      if (propertySuggestionRef.current && !propertySuggestionRef.current.contains(e.target as Node)) {
        setShowPropertySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 5) Entity Type
  const [entityTypes, setEntityTypes] = useState<string[]>([]);
  const [entityTypeOther, setEntityTypeOther] = useState('');

  // 6) Operation history
  const [operationHistory, setOperationHistory] = useState('');

  // 7) Project Interest
  const [projectInterest, setProjectInterest] = useState<'Owner' | 'Contractor' | 'Owner and Contractor' | 'Other' | ''>('');
  const [projectInterestOther, setProjectInterestOther] = useState('');

  // 8 & 9) Dates
  const [constructionStartDate, setConstructionStartDate] = useState('');
  const [constructionProjectedEndDate, setConstructionProjectedEndDate] = useState('');

  // 10) Work already started
  const [workAlreadyStarted, setWorkAlreadyStarted] = useState<boolean | null>(null);
  const [priorCoverageInPlace, setPriorCoverageInPlace] = useState<boolean | null>(null);
  const [workStartedExplanation, setWorkStartedExplanation] = useState('');
  const [percentageWorkCompleted, setPercentageWorkCompleted] = useState('');

  // 11) Coverages Requested
  const [coverageBusinessIncome, setCoverageBusinessIncome] = useState(false);
  const [businessIncomeLimit, setBusinessIncomeLimit] = useState('');
  const [coverageMechanicalBreakdown, setCoverageMechanicalBreakdown] = useState(false);
  const [mechanicalBreakdownLimit, setMechanicalBreakdownLimit] = useState('');
  const [coveragePropertyInTransit, setCoveragePropertyInTransit] = useState(false);
  const [propertyInTransitLimit, setPropertyInTransitLimit] = useState('');
  const [coveragePropertyInStorage, setCoveragePropertyInStorage] = useState(false);
  const [propertyInStorageLimit, setPropertyInStorageLimit] = useState('');
  const [coverageEarthMovement, setCoverageEarthMovement] = useState(false);
  const [earthMovementLimit, setEarthMovementLimit] = useState('');
  const [coverageFlood, setCoverageFlood] = useState(false);
  const [floodLimit, setFloodLimit] = useState('');
  const [coverageOther, setCoverageOther] = useState(false);
  const [coverageOtherName, setCoverageOtherName] = useState('');
  const [coverageOtherLimit, setCoverageOtherLimit] = useState('');

  // 12) Receipts & Payroll
  const [projectedRevenue, setProjectedRevenue] = useState('');
  const [projectedPayroll, setProjectedPayroll] = useState('');
  const [last12Revenue, setLast12Revenue] = useState('');
  const [last12Payroll, setLast12Payroll] = useState('');
  const [prior2YearRevenue, setPrior2YearRevenue] = useState('');
  const [prior2YearPayroll, setPrior2YearPayroll] = useState('');

  // 13) Contractor
  const [contractorName, setContractorName] = useState('');
  const [contractorExperienceYears, setContractorExperienceYears] = useState('');

  // Section II: Property Details
  // 14) Renovation / Ground-up
  const [isRenovated, setIsRenovated] = useState<boolean | null>(null);
  const [isGroundUp, setIsGroundUp] = useState<boolean | null>(null);
  const [groundUpExplanation, setGroundUpExplanation] = useState('');
  const [totalInsurableValue, setTotalInsurableValue] = useState('');

  // 15) Work Performed
  const [workDescription, setWorkDescription] = useState('');

  // 16) Intended Occupancy
  const [intendedOccupancy, setIntendedOccupancy] = useState('');

  // 17) Construction Materials
  const [constructionMaterials, setConstructionMaterials] = useState<string[]>([]);
  const [constructionMaterialOther, setConstructionMaterialOther] = useState('');

  // 18) Stories & Cranes
  const [numberOfStories, setNumberOfStories] = useState('');
  const [involvesCranes, setInvolvesCranes] = useState<boolean | null>(null);

  // 19) Roofing
  const [roofingMaterials, setRoofingMaterials] = useState('');

  // 20) Protection class
  const [protectionClass, setProtectionClass] = useState('');

  // 21) Structure occupied prior to completion
  const [occupiedPriorToCompletion, setOccupiedPriorToCompletion] = useState<boolean | null>(null);
  const [occupiedByWhom, setOccupiedByWhom] = useState('');
  const [occupancyDetails, setOccupancyDetails] = useState('');

  // 22) Site Security
  const [siteFenced, setSiteFenced] = useState<boolean | null>(null);
  const [siteLighted, setSiteLighted] = useState<boolean | null>(null);
  const [siteLocked, setSiteLocked] = useState<boolean | null>(null);
  const [siteGuards, setSiteGuards] = useState<boolean | null>(null);
  const [siteOtherSecurity, setSiteOtherSecurity] = useState('');
  const [siteOtherSecurityActive, setSiteOtherSecurityActive] = useState<boolean | null>(null);

  // Section III: Renovation (Questions 23 - 35)
  const [demoExistingStructure, setDemoExistingStructure] = useState<boolean | null>(null);
  const [structuralAlterations, setStructuralAlterations] = useState<boolean | null>(null);
  const [existingDamage, setExistingDamage] = useState<boolean | null>(null);
  const [existingDamageClarification, setExistingDamageClarification] = useState('');
  const [coverageExistingStructure, setCoverageExistingStructure] = useState<boolean | null>(null);
  const [structureCoveredOtherPolicy, setStructureCoveredOtherPolicy] = useState<boolean | null>(null);
  const [existingStructureValue, setExistingStructureValue] = useState('');
  const [buildingMaterialsValue, setBuildingMaterialsValue] = useState('');
  const [insurableValueTotal, setInsurableValueTotal] = useState('');

  const [yearBuilt, setYearBuilt] = useState('');
  const [originalSquareFootage, setOriginalSquareFootage] = useState('');
  const [additionSquareFootage, setAdditionSquareFootage] = useState('');
  const [previousOccupancy, setPreviousOccupancy] = useState('');
  const [fireSafetySystems, setFireSafetySystems] = useState<string[]>([]);
  const [fireSafetyOther, setFireSafetyOther] = useState('');
  const [fireSystemsWorkingOrder, setFireSystemsWorkingOrder] = useState<boolean | null>(null);
  const [fireSystemsMaintained, setFireSystemsMaintained] = useState<boolean | null>(null);
  const [fireSystemsExplanation, setFireSystemsExplanation] = useState('');
  const [electricalServiceMaintained, setElectricalServiceMaintained] = useState<boolean | null>(null);
  const [electricalLastUpdated, setElectricalLastUpdated] = useState('');
  const [heatingServiceMaintained, setHeatingServiceMaintained] = useState<boolean | null>(null);
  const [heatingLastUpdated, setHeatingLastUpdated] = useState('');
  const [waterServiceShutOff, setWaterServiceShutOff] = useState<boolean | null>(null);
  const [plumbingLastUpdated, setPlumbingLastUpdated] = useState('');
  const [burglarAlarmInPlace, setBurglarAlarmInPlace] = useState<boolean | null>(null);
  const [burglarAlarmMaintained, setBurglarAlarmMaintained] = useState<boolean | null>(null);

  // Section IV: Claims History (Questions 36 - 38)
  const [unreportedIncidents, setUnreportedIncidents] = useState<boolean | null>(null);
  const [unreportedIncidentsExplanation, setUnreportedIncidentsExplanation] = useState('');
  const [canceledNonRenewed, setCanceledNonRenewed] = useState<boolean | null>(null);
  const [canceledExplanation, setCanceledExplanation] = useState('');
  const [hasPastClaims, setHasPastClaims] = useState<boolean | null>(null);
  const [claimsList, setClaimsList] = useState<ClaimItem[]>([]);

  // Auto-calculate Total in 26b
  useEffect(() => {
    const num1 = parseCurrency(existingStructureValue);
    const num2 = parseCurrency(buildingMaterialsValue);
    if (!isNaN(num1) || !isNaN(num2)) {
      const sum = (isNaN(num1) ? 0 : num1) + (isNaN(num2) ? 0 : num2);
      if (sum > 0) {
        setInsurableValueTotal(formatCurrency(sum));
      }
    }
  }, [existingStructureValue, buildingMaterialsValue]);

  // Format Phone Number
  const formatPhoneNumber = (val: string) => {
    const digits = val.replace(/\D/g, '');
    if (!digits) return '';
    if (digits.length <= 3) return `(${digits}`;
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Submit states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Verification for public tokens
  useEffect(() => {
    if (publicToken) {
      setIsPublicLink(true);
      setIsVerifyingLink(true);
      fetch(`/api/public/links/verify?token=${publicToken}&expectedProgramId=builders-risk`)
        .then(res => res.json())
        .then(data => {
          if (!data.valid) {
            setLinkError(data.error || "Invalid or expired link");
          } else {
            if (data.agentName) setAgencyAgent(data.agentName);
            if (data.agencyName) setBrokerage(data.agencyName);
          }
        })
        .catch(() => setLinkError("Failed to verify link"))
        .finally(() => setIsVerifyingLink(false));
    }
  }, [publicToken]);

  // Load existing submission data if editing or viewing
  useEffect(() => {
    if (submissionId) {
      fetch(`/api/agency/submissions/${submissionId}`)
        .then(res => res.json())
        .then(data => {
          const submission = data.submission || data;
          const payload = submission.payload || {};
          if (payload.firstName || payload.lastName) {
            setFirstName(payload.firstName || '');
            setLastName(payload.lastName || '');
            setNamedInsured(payload.namedInsured || [payload.firstName, payload.lastName].filter(Boolean).join(' '));
          } else if (payload.namedInsured) {
            const raw = (payload.namedInsured || '').trim();
            const parts = raw.split(' ');
            if (parts.length <= 1) {
              setFirstName(parts[0] || '');
              setLastName('');
            } else {
              setFirstName(parts.slice(0, -1).join(' '));
              setLastName(parts[parts.length - 1]);
            }
            setNamedInsured(raw);
          } else {
            setFirstName('');
            setLastName('');
            setNamedInsured('');
          }
          setApplicantPhone(payload.applicantPhone || payload.phone || submission.clientContact?.phone || '');
          setApplicantEmail(payload.applicantEmail || payload.email || submission.clientContact?.email || '');
          setBrokerage(payload.brokerage || '');
          setAgencyAgent(payload.agencyAgent || payload.agentName || payload.brokerage || submission.agentName || '');
          setIsNewVenture(payload.isNewVenture ?? null);
          setIsRenewal(payload.isRenewal ?? null);
          setPolicyNumber(payload.policyNumber || '');
          setCurrentEffectiveDate(payload.currentEffectiveDate || '');
          setCurrentExpiryDate(payload.currentExpiryDate || '');
          setRequestedEffectiveDate(payload.requestedEffectiveDate || '');
          setRequestedExpiryDate(payload.requestedExpiryDate || '');
          setWebsite(payload.website || '');

          setCarrier(payload.carrier || '');
          setLimitOfInsurance(payload.limitOfInsurance || '');
          setEffectiveDate(payload.effectiveDate || '');
          setExpiryDate(payload.expiryDate || '');
          setDeductible(payload.deductible || '');
          setPremium(payload.premium || '');
          setOfferingRenewal(payload.offeringRenewal ?? null);

          setMailingAddress(payload.mailingAddress || '');
          setMailingCity(payload.mailingCity || '');
          setMailingState(payload.mailingState || '');
          setMailingZip(payload.mailingZip || '');

          setSameAsMailing(payload.sameAsMailing || false);
          setPropertyAddress(payload.propertyAddress || '');
          setPropertyCity(payload.propertyCity || '');
          setPropertyState(payload.propertyState || '');
          setPropertyZip(payload.propertyZip || '');

          setEntityTypes(payload.entityType || []);
          setEntityTypeOther(payload.entityTypeOther || '');
          setOperationHistory(payload.operationHistory || '');

          setProjectInterest(payload.projectInterest || '');
          setProjectInterestOther(payload.projectInterestOther || '');
          setConstructionStartDate(payload.constructionStartDate || '');
          setConstructionProjectedEndDate(payload.constructionProjectedEndDate || '');

          setWorkAlreadyStarted(payload.workAlreadyStarted ?? null);
          setPriorCoverageInPlace(payload.priorCoverageInPlace ?? null);
          setWorkStartedExplanation(payload.workStartedExplanation || '');
          setPercentageWorkCompleted(payload.percentageWorkCompleted || '');

          if (payload.coverages) {
            setCoverageBusinessIncome(!!payload.coverages.businessIncome);
            setBusinessIncomeLimit(payload.coverages.businessIncomeLimit || '');
            setCoverageMechanicalBreakdown(!!payload.coverages.mechanicalBreakdown);
            setMechanicalBreakdownLimit(payload.coverages.mechanicalBreakdownLimit || '');
            setCoveragePropertyInTransit(!!payload.coverages.propertyInTransit);
            setPropertyInTransitLimit(payload.coverages.propertyInTransitLimit || '');
            setCoveragePropertyInStorage(!!payload.coverages.propertyInStorage);
            setPropertyInStorageLimit(payload.coverages.propertyInStorageLimit || '');
            setCoverageEarthMovement(!!payload.coverages.earthMovement);
            setEarthMovementLimit(payload.coverages.earthMovementLimit || '');
            setCoverageFlood(!!payload.coverages.flood);
            setFloodLimit(payload.coverages.floodLimit || '');
            setCoverageOther(!!payload.coverages.other);
            setCoverageOtherName(payload.coverages.otherName || '');
            setCoverageOtherLimit(payload.coverages.otherLimit || '');
          }

          setProjectedRevenue(payload.projectedRevenue || '');
          setProjectedPayroll(payload.projectedPayroll || '');
          setLast12Revenue(payload.last12Revenue || '');
          setLast12Payroll(payload.last12Payroll || '');
          setPrior2YearRevenue(payload.prior2YearRevenue || '');
          setPrior2YearPayroll(payload.prior2YearPayroll || '');

          setContractorName(payload.contractorName || '');
          setContractorExperienceYears(payload.contractorExperienceYears || '');

          setIsRenovated(payload.isRenovated ?? null);
          setIsGroundUp(payload.isGroundUp ?? null);
          setGroundUpExplanation(payload.groundUpExplanation || '');
          setTotalInsurableValue(payload.totalInsurableValue || '');

          setWorkDescription(payload.workDescription || '');
          setIntendedOccupancy(payload.intendedOccupancy || '');
          setConstructionMaterials(payload.constructionMaterials || []);
          setConstructionMaterialOther(payload.constructionMaterialOther || '');

          setNumberOfStories(payload.numberOfStories || '');
          setInvolvesCranes(payload.involvesCranes ?? null);
          setRoofingMaterials(payload.roofingMaterials || '');
          setProtectionClass(payload.protectionClass || '');

          setOccupiedPriorToCompletion(payload.occupiedPriorToCompletion ?? null);
          setOccupiedByWhom(payload.occupiedByWhom || '');
          setOccupancyDetails(payload.occupancyDetails || '');

          // Site Security
          setSiteFenced(payload.siteFenced ?? null);
          setSiteLighted(payload.siteLighted ?? null);
          setSiteLocked(payload.siteLocked ?? null);
          setSiteGuards(payload.siteGuards ?? null);
          setSiteOtherSecurity(payload.siteOtherSecurity || '');
          setSiteOtherSecurityActive(payload.siteOtherSecurityActive ?? null);

          // Renovation
          setDemoExistingStructure(payload.demoExistingStructure ?? null);
          setStructuralAlterations(payload.structuralAlterations ?? null);
          setExistingDamage(payload.existingDamage ?? null);
          setExistingDamageClarification(payload.existingDamageClarification || '');
          setCoverageExistingStructure(payload.coverageExistingStructure ?? null);
          setStructureCoveredOtherPolicy(payload.structureCoveredOtherPolicy ?? null);
          setExistingStructureValue(payload.existingStructureValue || '');
          setBuildingMaterialsValue(payload.buildingMaterialsValue || '');
          setInsurableValueTotal(payload.insurableValueTotal || '');
          setYearBuilt(payload.yearBuilt || '');
          setOriginalSquareFootage(payload.originalSquareFootage || '');
          setAdditionSquareFootage(payload.additionSquareFootage || '');
          setPreviousOccupancy(payload.previousOccupancy || '');
          setFireSafetySystems(payload.fireSafetySystems || []);
          setFireSafetyOther(payload.fireSafetyOther || '');
          setFireSystemsWorkingOrder(payload.fireSystemsWorkingOrder ?? null);
          setFireSystemsMaintained(payload.fireSystemsMaintained ?? null);
          setFireSystemsExplanation(payload.fireSystemsExplanation || '');
          setElectricalServiceMaintained(payload.electricalServiceMaintained ?? null);
          setElectricalLastUpdated(payload.electricalLastUpdated || '');
          setHeatingServiceMaintained(payload.heatingServiceMaintained ?? null);
          setHeatingLastUpdated(payload.heatingLastUpdated || '');
          setWaterServiceShutOff(payload.waterServiceShutOff ?? null);
          setPlumbingLastUpdated(payload.plumbingLastUpdated || '');
          setBurglarAlarmInPlace(payload.burglarAlarmInPlace ?? null);
          setBurglarAlarmMaintained(payload.burglarAlarmMaintained ?? null);

          // Claims
          setUnreportedIncidents(payload.unreportedIncidents ?? null);
          setUnreportedIncidentsExplanation(payload.unreportedIncidentsExplanation || '');
          setCanceledNonRenewed(payload.canceledNonRenewed ?? null);
          setCanceledExplanation(payload.canceledExplanation || '');
          setClaimsList(payload.claimsList || []);
          if (payload.claimsList && payload.claimsList.length > 0) {
            setHasPastClaims(true);
          }
        })
        .catch(err => {
          console.error("Failed to load submission data:", err);
          toast.error("Failed to load application data");
        });
    }
  }, [submissionId]);

  const toggleEntityType = (type: string) => {
    setEntityTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleConstructionMaterial = (material: string) => {
    setConstructionMaterials(prev =>
      prev.includes(material) ? prev.filter(m => m !== material) : [...prev, material]
    );
  };

  const toggleFireSafetySystem = (sys: string) => {
    setFireSafetySystems(prev =>
      prev.includes(sys) ? prev.filter(s => s !== sys) : [...prev, sys]
    );
  };

  const addClaim = () => {
    setClaimsList(prev => [...prev, { ...defaultClaim }]);
  };

  const updateClaim = (index: number, field: keyof ClaimItem, val: any) => {
    setClaimsList(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: val };
      return next;
    });
  };

  const toggleClaimCoverage = (index: number, line: string) => {
    setClaimsList(prev => {
      const next = [...prev];
      const curLines = next[index].linesCovered || [];
      const updated = curLines.includes(line)
        ? curLines.filter(l => l !== line)
        : [...curLines, line];
      next[index] = { ...next[index], linesCovered: updated };
      return next;
    });
  };

  const removeClaim = (index: number) => {
    setClaimsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agencyAgent.trim()) {
      toast.error("Please select or enter the Agency/Agent name");
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
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        applicantPhone: applicantPhone.trim(),
        applicantEmail: applicantEmail.trim(),
        phone: applicantPhone.trim() || '000-000-0000',
        email: applicantEmail.trim() || 'unknown@example.com',
        namedInsured: fullName,
        applicantName: fullName,
        companyName: fullName,
        brokerage: agencyAgent,
        agencyAgent,
        agentName: agencyAgent,
        isNewVenture,
        isRenewal,
        policyNumber,
        currentEffectiveDate,
        currentExpiryDate,
        requestedEffectiveDate,
        requestedExpiryDate,
        website,

        // Carrier Info
        carrier,
        limitOfInsurance,
        effectiveDate,
        expiryDate,
        deductible,
        premium,
        offeringRenewal,
        lossRunsFileName,
        operationsDocName,

        // Addresses
        mailingAddress,
        mailingCity,
        mailingState,
        mailingZip,
        sameAsMailing,
        propertyAddress: sameAsMailing ? mailingAddress : propertyAddress,
        propertyCity: sameAsMailing ? mailingCity : propertyCity,
        propertyState: sameAsMailing ? mailingState : propertyState,
        propertyZip: sameAsMailing ? mailingZip : propertyZip,

        // Entity
        entityType: entityTypes,
        entityTypeOther,
        operationHistory,

        // Project Interest & Dates
        projectInterest,
        projectInterestOther,
        constructionStartDate,
        constructionProjectedEndDate,

        // Work already started
        workAlreadyStarted,
        priorCoverageInPlace,
        workStartedExplanation,
        percentageWorkCompleted,

        // Requested Coverages
        coverages: {
          businessIncome: coverageBusinessIncome,
          businessIncomeLimit: coverageBusinessIncome ? businessIncomeLimit : '',
          mechanicalBreakdown: coverageMechanicalBreakdown,
          mechanicalBreakdownLimit: coverageMechanicalBreakdown ? mechanicalBreakdownLimit : '',
          propertyInTransit: coveragePropertyInTransit,
          propertyInTransitLimit: coveragePropertyInTransit ? propertyInTransitLimit : '',
          propertyInStorage: coveragePropertyInStorage,
          propertyInStorageLimit: coveragePropertyInStorage ? propertyInStorageLimit : '',
          earthMovement: coverageEarthMovement,
          earthMovementLimit: coverageEarthMovement ? earthMovementLimit : '',
          flood: coverageFlood,
          floodLimit: coverageFlood ? floodLimit : '',
          other: coverageOther,
          otherName: coverageOther ? coverageOtherName : '',
          otherLimit: coverageOther ? coverageOtherLimit : ''
        },

        // Receipts & Payroll
        projectedRevenue,
        projectedPayroll,
        last12Revenue,
        last12Payroll,
        prior2YearRevenue,
        prior2YearPayroll,

        // Contractor
        contractorName,
        contractorExperienceYears,

        // Section II: Property Details
        isRenovated,
        isGroundUp,
        groundUpExplanation,
        totalInsurableValue,
        workDescription,
        intendedOccupancy,
        constructionMaterials,
        constructionMaterialOther,
        numberOfStories,
        involvesCranes,
        roofingMaterials,
        protectionClass,
        occupiedPriorToCompletion,
        occupiedByWhom,
        occupancyDetails,

        // 22) Site Security
        siteFenced,
        siteLighted,
        siteLocked,
        siteGuards,
        siteOtherSecurity,
        siteOtherSecurityActive,

        // Section III: Renovation
        demoExistingStructure,
        structuralAlterations,
        existingDamage,
        existingDamageClarification,
        coverageExistingStructure,
        structureCoveredOtherPolicy,
        existingStructureValue,
        buildingMaterialsValue,
        insurableValueTotal,
        yearBuilt,
        originalSquareFootage,
        additionSquareFootage,
        previousOccupancy,
        fireSafetySystems,
        fireSafetyOther,
        fireSystemsWorkingOrder,
        fireSystemsMaintained,
        fireSystemsExplanation,
        electricalServiceMaintained,
        electricalLastUpdated,
        heatingServiceMaintained,
        heatingLastUpdated,
        waterServiceShutOff,
        plumbingLastUpdated,
        burglarAlarmInPlace,
        burglarAlarmMaintained,

        // Section IV: Claims History
        unreportedIncidents,
        unreportedIncidentsExplanation,
        canceledNonRenewed,
        canceledExplanation,
        claimsList: hasPastClaims ? claimsList : []
      };

      let response;
      if (isPublicLink) {
        response = await fetch("/api/public/applications/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            programId: "builders-risk",
            programName: "Builders Risk",
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
            programId: "builders-risk",
            programName: "Builders Risk",
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
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#7A6F64] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600 font-medium text-sm">Loading Builders Risk Application...</p>
        </div>
      </div>
    );
  }

  if (linkError) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center border border-red-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Link Expired or Invalid</h2>
          <p className="text-gray-600 mb-6">{linkError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f0e8] py-8 px-4 sm:px-6 lg:px-8 pb-32">
      <div className="max-w-5xl mx-auto">

        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (isEditMode || isViewMode) {
                window.close();
              } else {
                router.push("/agency/marketplace");
              }
            }}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#7A6F64] hover:text-[#5A4F44] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {isEditMode || isViewMode ? "Close" : "Back to Marketplace"}
          </button>
        </div>

        <form id="builders-risk-form" onSubmit={handleSubmit}>
          <fieldset disabled={isViewMode} className="space-y-6">

            {/* ════════════════════════════════════════════════════════════
                SECTION I: GENERAL INFORMATION
            ════════════════════════════════════════════════════════════ */}
            <Section title="I. GENERAL INFORMATION">

              {/* 1) Named Insured, Brokerage, Dates */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  1) Policy & Venture Information
                </div>

                {/* 1. Agency/Agent */}
                <Row label="Agency/Agent" bold required>
                  {agentOptions.length > 0 ? (
                    <select
                      value={agencyAgent}
                      onChange={e => {
                        setAgencyAgent(e.target.value);
                        setBrokerage(e.target.value);
                      }}
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
                      onChange={e => {
                        setAgencyAgent(e.target.value);
                        setBrokerage(e.target.value);
                      }}
                      placeholder="Agency / Agent"
                      className={inp}
                    />
                  )}
                </Row>

                {/* 2. First Name */}
                <Row label="First Name" bold required>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={e => {
                      setFirstName(e.target.value);
                      setNamedInsured([e.target.value, lastName].filter(Boolean).join(' '));
                    }}
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
                    onChange={e => {
                      setLastName(e.target.value);
                      setNamedInsured([firstName, e.target.value].filter(Boolean).join(' '));
                    }}
                    placeholder="Last Name"
                    className={inp}
                  />
                </Row>

                {/* 4. Applicant Phone */}
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

                {/* 5. Applicant Email */}
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

                <Row label="New Venture?">
                  <YesNo name="isNewVenture" value={isNewVenture} onChange={setIsNewVenture} />
                </Row>

                <Row label="Renewal?">
                  <YesNo name="isRenewal" value={isRenewal} onChange={setIsRenewal} />
                </Row>

                <Row label="Policy Number">
                  <input
                    type="text"
                    value={policyNumber}
                    onChange={e => setPolicyNumber(e.target.value)}
                    placeholder="e.g. POL-12345"
                    className={inp}
                  />
                </Row>

                <Row label="Current Effective Date">
                  <input
                    type="date"
                    value={currentEffectiveDate}
                    onChange={e => setCurrentEffectiveDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Current Expiry Date">
                  <input
                    type="date"
                    value={currentExpiryDate}
                    onChange={e => setCurrentExpiryDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Requested Effective Date">
                  <input
                    type="date"
                    value={requestedEffectiveDate}
                    onChange={e => setRequestedEffectiveDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Requested Expiry Date">
                  <input
                    type="date"
                    value={requestedExpiryDate}
                    onChange={e => setRequestedExpiryDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Website">
                  <input
                    type="url"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                    className={inp}
                  />
                </Row>
              </div>

              {/* 2) Current Carrier Information */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  2) Current Carrier Information
                </div>

                <Row label="Carrier">
                  <input
                    type="text"
                    value={carrier}
                    onChange={e => setCarrier(e.target.value)}
                    placeholder="Current insurance carrier"
                    className={inp}
                  />
                </Row>

                <Row label="Limit of Insurance">
                  <CurrencyInp
                    value={limitOfInsurance}
                    onChange={setLimitOfInsurance}
                    placeholder="0.00"
                  />
                </Row>

                <Row label="Effective Date">
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={e => setEffectiveDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Expiry Date">
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={e => setExpiryDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="Deductible">
                  <CurrencyInp
                    value={deductible}
                    onChange={setDeductible}
                    placeholder="0.00"
                  />
                </Row>

                <Row label="Premium">
                  <CurrencyInp
                    value={premium}
                    onChange={setPremium}
                    placeholder="0.00"
                  />
                </Row>

                <Row label="Offering renewal?">
                  <YesNo name="offeringRenewal" value={offeringRenewal} onChange={setOfferingRenewal} />
                </Row>

                <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 mt-3">
                  <div className="text-xs font-semibold text-gray-700 italic mb-2">
                    Please attach copies of the following:
                  </div>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>a) Currently valued five-year loss runs, including complete claim details for all losses</div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Upload className="w-3.5 h-3.5 text-[#7A6F64]" />
                        <span>Upload 5-Year Loss Runs</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setLossRunsFileName(file.name);
                          }}
                        />
                      </label>
                      {lossRunsFileName && <span className="text-xs text-emerald-600 font-medium">✓ {lossRunsFileName}</span>}
                    </div>

                    <div className="pt-2">b) Applicant's description of operations, brochure, or marketing materials if a website is not available</div>
                    <div className="flex items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50">
                        <Upload className="w-3.5 h-3.5 text-[#7A6F64]" />
                        <span>Upload Operations / Brochure</span>
                        <input
                          type="file"
                          className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) setOperationsDocName(file.name);
                          }}
                        />
                      </label>
                      {operationsDocName && <span className="text-xs text-emerald-600 font-medium">✓ {operationsDocName}</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3) Mailing Address */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  3) Mailing Address
                </div>

                <Row label="Mailing Address">
                  <div className="relative">
                    <input
                      type="text"
                      value={mailingAddress}
                      onChange={e => handleMailingAddressSearch(e.target.value)}
                      placeholder="Street address, Suite / Apt"
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

                <Row label="City / State / Zip">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={mailingCity}
                      onChange={e => setMailingCity(e.target.value)}
                      placeholder="City"
                      className={inp}
                    />
                    <input
                      type="text"
                      value={mailingState}
                      onChange={e => setMailingState(e.target.value)}
                      placeholder="State"
                      maxLength={2}
                      className={inp}
                    />
                    <input
                      type="text"
                      value={mailingZip}
                      onChange={e => setMailingZip(e.target.value)}
                      placeholder="Zip Code"
                      className={inp}
                    />
                  </div>
                </Row>
              </div>

              {/* 4) Property Address */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                    4) Property Address
                  </div>
                  <label className="flex items-center gap-2 text-xs font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsMailing}
                      onChange={e => setSameAsMailing(e.target.checked)}
                      className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-3.5 h-3.5"
                    />
                    Same as Mailing Address
                  </label>
                </div>

                {!sameAsMailing ? (
                  <>
                    <Row label="Property Address">
                      <div className="relative">
                        <input
                          type="text"
                          value={propertyAddress}
                          onChange={e => handlePropertyAddressSearch(e.target.value)}
                          placeholder="Property street address"
                          className={inp}
                          autoComplete="off"
                        />
                        {propertyAddressLoading && (
                          <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                        )}
                        {showPropertySuggestions && propertySuggestions.length > 0 && (
                          <div
                            ref={propertySuggestionRef}
                            className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                          >
                            {propertySuggestions.map((suggestion, index) => (
                              <div
                                key={index}
                                onMouseDown={() => handleSelectPropertySuggestion(suggestion)}
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

                    <Row label="City / State / Zip">
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={propertyCity}
                          onChange={e => setPropertyCity(e.target.value)}
                          placeholder="City"
                          className={inp}
                        />
                        <input
                          type="text"
                          value={propertyState}
                          onChange={e => setPropertyState(e.target.value)}
                          placeholder="State"
                          maxLength={2}
                          className={inp}
                        />
                        <input
                          type="text"
                          value={propertyZip}
                          onChange={e => setPropertyZip(e.target.value)}
                          placeholder="Zip Code"
                          className={inp}
                        />
                      </div>
                    </Row>
                  </>
                ) : (
                  <div className="text-xs text-gray-500 italic bg-gray-50 p-3 rounded">
                    Property address is set to the same as Mailing Address: {mailingAddress || "N/A"}
                  </div>
                )}
              </div>

              {/* 5) Entity Type */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  5) Are you a(n):
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ENTITY_OPTIONS.map(entity => (
                    <label key={entity} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={entityTypes.includes(entity)}
                        onChange={() => toggleEntityType(entity)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>{entity}</span>
                    </label>
                  ))}
                </div>

                <Row label="Other Entity Type">
                  <input
                    type="text"
                    value={entityTypeOther}
                    onChange={e => setEntityTypeOther(e.target.value)}
                    placeholder="Specify if other"
                    className={inp}
                  />
                </Row>
              </div>

              {/* 6) Operational History */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  6) How long have you been in operation under this business name or any others?
                </div>
                <p className="text-xs text-gray-500">
                  (Please provide any prior entities or additional entities/DBAs to be covered)
                </p>
                <textarea
                  rows={3}
                  value={operationHistory}
                  onChange={e => setOperationHistory(e.target.value)}
                  placeholder="Provide entity history, years in business, prior business names or DBAs..."
                  className={textareaStyle}
                />
              </div>

              {/* 7) Interest in Project */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  7) What is your interest in this project?
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(['Owner', 'Contractor', 'Owner and Contractor', 'Other'] as const).map(interest => (
                    <label key={interest} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="projectInterest"
                        checked={projectInterest === interest}
                        onChange={() => setProjectInterest(interest)}
                        className="w-4 h-4 accent-[#7A6F64]"
                      />
                      <span>{interest}</span>
                    </label>
                  ))}
                </div>

                {projectInterest === 'Other' && (
                  <Row label="Specify Other Interest">
                    <input
                      type="text"
                      value={projectInterestOther}
                      onChange={e => setProjectInterestOther(e.target.value)}
                      placeholder="Specify interest"
                      className={inp}
                    />
                  </Row>
                )}
              </div>

              {/* 8 & 9) Construction Dates */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Project Dates
                </div>

                <Row label="8) Construction Start Date">
                  <input
                    type="date"
                    value={constructionStartDate}
                    onChange={e => setConstructionStartDate(e.target.value)}
                    className={inp}
                  />
                </Row>

                <Row label="9) Construction Projected End Date">
                  <input
                    type="date"
                    value={constructionProjectedEndDate}
                    onChange={e => setConstructionProjectedEndDate(e.target.value)}
                    className={inp}
                  />
                </Row>
              </div>

              {/* 10) Construction work already started */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  10) Work Commenced
                </div>

                <Row label="Has any construction work already started?">
                  <YesNo name="workAlreadyStarted" value={workAlreadyStarted} onChange={setWorkAlreadyStarted} />
                </Row>

                {workAlreadyStarted === true && (
                  <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-4">
                    <Row label="a. If yes, has prior coverage been in place?">
                      <YesNo name="priorCoverageInPlace" value={priorCoverageInPlace} onChange={setPriorCoverageInPlace} />
                    </Row>

                    {priorCoverageInPlace === false && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">
                          b. If yes to 10) and no to a., please attach an explanation:
                        </label>
                        <textarea
                          rows={2}
                          value={workStartedExplanation}
                          onChange={e => setWorkStartedExplanation(e.target.value)}
                          placeholder="Explain reason for lack of prior coverage..."
                          className={textareaStyle}
                        />
                      </div>
                    )}

                    <Row label="c. What percentage of work is completed?">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={percentageWorkCompleted}
                          onChange={e => setPercentageWorkCompleted(e.target.value)}
                          placeholder="e.g. 25"
                          className={`${inp} pr-8`}
                        />
                        <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                      </div>
                    </Row>
                  </div>
                )}
              </div>

              {/* 11) Coverage requested checklist */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  11) Requested Coverage(s)
                </div>
                <p className="text-xs text-gray-500 mb-4">
                  Check and provide requested limits for all that apply:
                </p>

                <div className="space-y-3">
                  {/* Business Income */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coverageBusinessIncome}
                        onChange={e => setCoverageBusinessIncome(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Business Income w/Extra Expense</span>
                    </label>
                    {coverageBusinessIncome && (
                      <CurrencyInp
                        value={businessIncomeLimit}
                        onChange={setBusinessIncomeLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Mechanical Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coverageMechanicalBreakdown}
                        onChange={e => setCoverageMechanicalBreakdown(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Mechanical Breakdown & Testing</span>
                    </label>
                    {coverageMechanicalBreakdown && (
                      <CurrencyInp
                        value={mechanicalBreakdownLimit}
                        onChange={setMechanicalBreakdownLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Property in Transit */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coveragePropertyInTransit}
                        onChange={e => setCoveragePropertyInTransit(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Property in Transit</span>
                    </label>
                    {coveragePropertyInTransit && (
                      <CurrencyInp
                        value={propertyInTransitLimit}
                        onChange={setPropertyInTransitLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Property in Storage */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coveragePropertyInStorage}
                        onChange={e => setCoveragePropertyInStorage(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Property in Storage</span>
                    </label>
                    {coveragePropertyInStorage && (
                      <CurrencyInp
                        value={propertyInStorageLimit}
                        onChange={setPropertyInStorageLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Earth Movement */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coverageEarthMovement}
                        onChange={e => setCoverageEarthMovement(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Earth Movement</span>
                    </label>
                    {coverageEarthMovement && (
                      <CurrencyInp
                        value={earthMovementLimit}
                        onChange={setEarthMovementLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Flood */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-center">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={coverageFlood}
                        onChange={e => setCoverageFlood(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Flood</span>
                    </label>
                    {coverageFlood && (
                      <CurrencyInp
                        value={floodLimit}
                        onChange={setFloodLimit}
                        placeholder="Limit requested ($)"
                      />
                    )}
                  </div>

                  {/* Other Coverage */}
                  <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-2 items-start">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pt-2">
                      <input
                        type="checkbox"
                        checked={coverageOther}
                        onChange={e => setCoverageOther(e.target.checked)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>Other Coverage</span>
                    </label>
                    {coverageOther && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={coverageOtherName}
                          onChange={e => setCoverageOtherName(e.target.value)}
                          placeholder="Coverage name"
                          className={inp}
                        />
                        <CurrencyInp
                          value={coverageOtherLimit}
                          onChange={setCoverageOtherLimit}
                          placeholder="Limit requested ($)"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 12) Receipts and Payroll Table */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                  12) Receipts and Payroll
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  Please complete the following table for your receipts and payroll:
                </p>

                <div className="overflow-x-auto border border-gray-200 rounded">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#7A6F64] text-white text-xs uppercase">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Period</th>
                        <th className="px-4 py-2.5 font-semibold">Revenue ($)</th>
                        <th className="px-4 py-2.5 font-semibold">Payroll ($)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      <tr>
                        <td className="px-4 py-2 font-medium text-gray-800">Projected Year</td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={projectedRevenue} onChange={setProjectedRevenue} placeholder="0.00" />
                        </td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={projectedPayroll} onChange={setProjectedPayroll} placeholder="0.00" />
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-2 font-medium text-gray-800">Last 12 Months</td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={last12Revenue} onChange={setLast12Revenue} placeholder="0.00" />
                        </td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={last12Payroll} onChange={setLast12Payroll} placeholder="0.00" />
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-medium text-gray-800">2nd Prior Year</td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={prior2YearRevenue} onChange={setPrior2YearRevenue} placeholder="0.00" />
                        </td>
                        <td className="px-4 py-2">
                          <CurrencyInp value={prior2YearPayroll} onChange={setPrior2YearPayroll} placeholder="0.00" />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 13) Contractor information */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  13) Contractor Experience
                </div>

                <Row label="If not contractor or owner/contractor, list contractor:">
                  <input
                    type="text"
                    value={contractorName}
                    onChange={e => setContractorName(e.target.value)}
                    placeholder="General Contractor Name"
                    className={inp}
                  />
                </Row>

                <Row label="a. Contractor years of experience:">
                  <input
                    type="number"
                    min={0}
                    value={contractorExperienceYears}
                    onChange={e => setContractorExperienceYears(e.target.value)}
                    placeholder="Years"
                    className={inp}
                  />
                </Row>
              </div>

            </Section>

            {/* ════════════════════════════════════════════════════════════
                SECTION II: PROPERTY DETAILS
            ════════════════════════════════════════════════════════════ */}
            <Section title="II. PROPERTY DETAILS">

              {/* 14) Renovation & Ground-up */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  14) Structure Work Scope
                </div>

                <Row label="Is the property being renovated?">
                  <YesNo name="isRenovated" value={isRenovated} onChange={setIsRenovated} />
                </Row>

                {isRenovated === false && (
                  <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-4">
                    <Row label="a. Is building work being performed ground up?">
                      <YesNo name="isGroundUp" value={isGroundUp} onChange={setIsGroundUp} />
                    </Row>

                    {isGroundUp === false && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">
                          b. If no to ground up, please explain:
                        </label>
                        <textarea
                          rows={2}
                          value={groundUpExplanation}
                          onChange={e => setGroundUpExplanation(e.target.value)}
                          placeholder="Explain type of construction..."
                          className={textareaStyle}
                        />
                      </div>
                    )}

                    {isGroundUp === true && (
                      <Row label="c. Total insurable value of building materials (100% coinsurance):">
                        <CurrencyInp
                          value={totalInsurableValue}
                          onChange={setTotalInsurableValue}
                          placeholder="0.00"
                        />
                      </Row>
                    )}
                  </div>
                )}
              </div>

              {/* 15) Work Performed */}
              <div className="pt-6 border-t border-gray-200 space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">
                  15) Briefly describe the work being performed:
                </label>
                <textarea
                  rows={3}
                  value={workDescription}
                  onChange={e => setWorkDescription(e.target.value)}
                  placeholder="Provide scope of work, operations involved, key trades..."
                  className={textareaStyle}
                />
              </div>

              {/* 16) Intended Occupancy */}
              <div className="pt-6 border-t border-gray-200 space-y-2">
                <label className="text-sm font-semibold text-gray-900 block">
                  16) What is the intended occupancy after work is completed?
                </label>
                <textarea
                  rows={2}
                  value={intendedOccupancy}
                  onChange={e => setIntendedOccupancy(e.target.value)}
                  placeholder="e.g. Commercial office, multi-family apartment, medical clinic, retail..."
                  className={textareaStyle}
                />
              </div>

              {/* 17) Building Construction Material */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  17) What is the building construction material?
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {CONSTRUCTION_MATERIALS.map(material => (
                    <label key={material} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={constructionMaterials.includes(material)}
                        onChange={() => toggleConstructionMaterial(material)}
                        className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                      />
                      <span>{material}</span>
                    </label>
                  ))}
                </div>

                <Row label="Other Construction Material">
                  <input
                    type="text"
                    value={constructionMaterialOther}
                    onChange={e => setConstructionMaterialOther(e.target.value)}
                    placeholder="Specify other material"
                    className={inp}
                  />
                </Row>
              </div>

              {/* 18) Number of Stories & Cranes */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  18) Height & Heavy Equipment
                </div>

                <Row label="Number of stories:">
                  <input
                    type="number"
                    min={1}
                    value={numberOfStories}
                    onChange={e => setNumberOfStories(e.target.value)}
                    placeholder="e.g. 3"
                    className={inp}
                  />
                </Row>

                <Row label="a. Does work involve tandem crane lifts or tower cranes?">
                  <YesNo name="involvesCranes" value={involvesCranes} onChange={setInvolvesCranes} />
                </Row>
              </div>

              {/* 19) Roofing Materials */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  19) Roofing Materials
                </div>

                <Row label="Roofing materials:">
                  <input
                    type="text"
                    value={roofingMaterials}
                    onChange={e => setRoofingMaterials(e.target.value)}
                    placeholder="e.g. EPDM, TPO, Metal, Asphalt Shingle, Built-up..."
                    className={inp}
                  />
                </Row>
              </div>

              {/* 20) Protection Class */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  20) Protection Class
                </div>

                <Row label="Protection class:">
                  <input
                    type="text"
                    value={protectionClass}
                    onChange={e => setProtectionClass(e.target.value)}
                    placeholder="e.g. Class 1 - 10"
                    className={inp}
                  />
                </Row>
              </div>

              {/* 21) Prior occupancy */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  21) Pre-completion Occupancy
                </div>

                <Row label="Will any portion be occupied prior to project completion?">
                  <YesNo name="occupiedPriorToCompletion" value={occupiedPriorToCompletion} onChange={setOccupiedPriorToCompletion} />
                </Row>

                {occupiedPriorToCompletion === true && (
                  <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-4">
                    <Row label="a. If yes, by whom?">
                      <input
                        type="text"
                        value={occupiedByWhom}
                        onChange={e => setOccupiedByWhom(e.target.value)}
                        placeholder="Occupant name / business"
                        className={inp}
                      />
                    </Row>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-700">
                        b. Details about occupancy and how construction area access is restricted:
                      </label>
                      <textarea
                        rows={3}
                        value={occupancyDetails}
                        onChange={e => setOccupancyDetails(e.target.value)}
                        placeholder="Describe separation barriers, restricted keycard access, fire partitions, etc..."
                        className={textareaStyle}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 22) Site Security */}
              <div className="pt-6 border-t border-gray-200 space-y-4">
                <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  22) Site Security Measures
                </div>
                <p className="text-xs text-gray-500 mb-2">Is the project site:</p>

                <div className="space-y-3">
                  <Row label="a. Fenced?">
                    <YesNo name="siteFenced" value={siteFenced} onChange={setSiteFenced} />
                  </Row>

                  <Row label="b. Lighted?">
                    <YesNo name="siteLighted" value={siteLighted} onChange={setSiteLighted} />
                  </Row>

                  <Row label="c. Locked?">
                    <YesNo name="siteLocked" value={siteLocked} onChange={setSiteLocked} />
                  </Row>

                  <Row label="d. Security guards or night watchmen?">
                    <YesNo name="siteGuards" value={siteGuards} onChange={setSiteGuards} />
                  </Row>

                  <div className="grid grid-cols-1 md:grid-cols-[320px_1fr_340px] gap-4 md:gap-x-6 items-center">
                    <label className="text-sm font-medium text-gray-900 leading-snug">
                      e. Other security:
                    </label>
                    <div className="hidden md:block"></div>
                    <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                      <input
                        type="text"
                        value={siteOtherSecurity}
                        onChange={e => setSiteOtherSecurity(e.target.value)}
                        placeholder="Describe other security measures"
                        className={inp}
                      />
                      <YesNo name="siteOtherSecurityActive" value={siteOtherSecurityActive} onChange={setSiteOtherSecurityActive} />
                    </div>
                  </div>
                </div>
              </div>

            </Section>

            {/* ════════════════════════════════════════════════════════════
                SECTION III: RENOVATION
            ════════════════════════════════════════════════════════════ */}
            <Section
              title="III. RENOVATION"
              subtitle="(complete only if the property is being renovated)"
            >
              <div className="space-y-6">

                {/* 23 & 24) Demolition & Structural Alterations */}
                <div className="space-y-4">
                  <Row label="23) Does project include demolition of existing structure(s)?">
                    <YesNo name="demoExistingStructure" value={demoExistingStructure} onChange={setDemoExistingStructure} />
                  </Row>

                  <Row label="24) Does project include structural, frame, or foundation alterations?">
                    <YesNo name="structuralAlterations" value={structuralAlterations} onChange={setStructuralAlterations} />
                  </Row>
                </div>

                {/* 25) Existing Damage */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Row label="25) Does the building have any existing damage?">
                    <YesNo name="existingDamage" value={existingDamage} onChange={setExistingDamage} />
                  </Row>

                  {existingDamage === true && (
                    <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-2">
                      <label className="text-xs font-semibold text-gray-700">
                        a. If yes, please clarify:
                      </label>
                      <textarea
                        rows={2}
                        value={existingDamageClarification}
                        onChange={e => setExistingDamageClarification(e.target.value)}
                        placeholder="Describe existing damage, water intrusions, prior fire, foundation cracks..."
                        className={textareaStyle}
                      />
                    </div>
                  )}
                </div>

                {/* 26) Coverage for Existing Structure & Values */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <Row label="26) Are you seeking coverage for the existing structure?">
                    <YesNo name="coverageExistingStructure" value={coverageExistingStructure} onChange={setCoverageExistingStructure} />
                  </Row>

                  {coverageExistingStructure === false && (
                    <Row label="a. Is structure covered under another property insurance policy?">
                      <YesNo name="structureCoveredOtherPolicy" value={structureCoveredOtherPolicy} onChange={setStructureCoveredOtherPolicy} />
                    </Row>
                  )}

                  <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-3">
                    <div className="text-xs font-bold text-gray-700 uppercase tracking-wide">
                      b. Total insurable value (completed value and 100% coinsurance):
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">+ Existing Structure ($)</label>
                        <CurrencyInp
                          value={existingStructureValue}
                          onChange={setExistingStructureValue}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-600 mb-1 block">+ Building Materials ($)</label>
                        <CurrencyInp
                          value={buildingMaterialsValue}
                          onChange={setBuildingMaterialsValue}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-[#7A6F64] mb-1 block">= TOTAL Insurable Value ($)</label>
                        <CurrencyInp
                          value={insurableValueTotal}
                          onChange={setInsurableValueTotal}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 27, 28, 29, 30) Dimensions & History */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <Row label="27) What year was the existing structure built?">
                    <input
                      type="text"
                      value={yearBuilt}
                      onChange={e => setYearBuilt(e.target.value)}
                      placeholder="e.g. 1978"
                      className={inp}
                    />
                  </Row>

                  <Row label="28) What is square footage of original building?">
                    <input
                      type="text"
                      value={originalSquareFootage}
                      onChange={e => setOriginalSquareFootage(e.target.value)}
                      placeholder="Sq. Ft."
                      className={inp}
                    />
                  </Row>

                  <Row label="29) If addition, what will new square footage be?">
                    <input
                      type="text"
                      value={additionSquareFootage}
                      onChange={e => setAdditionSquareFootage(e.target.value)}
                      placeholder="Sq. Ft."
                      className={inp}
                    />
                  </Row>

                  <Row label="30) What was previous occupancy of the structure(s)?">
                    <input
                      type="text"
                      value={previousOccupancy}
                      onChange={e => setPreviousOccupancy(e.target.value)}
                      placeholder="e.g. Warehouse, Retail store, Single-family home..."
                      className={inp}
                    />
                  </Row>
                </div>

                {/* 31) Fire Safety Systems */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    31) Current Fire Safety Systems Installed
                  </div>
                  <p className="text-xs text-gray-500">Check all that apply:</p>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {FIRE_SAFETY_SYSTEMS.map(sys => (
                      <label key={sys} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={fireSafetySystems.includes(sys)}
                          onChange={() => toggleFireSafetySystem(sys)}
                          className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-4 h-4"
                        />
                        <span>{sys}</span>
                      </label>
                    ))}
                  </div>

                  <Row label="Other Fire Safety System:">
                    <input
                      type="text"
                      value={fireSafetyOther}
                      onChange={e => setFireSafetyOther(e.target.value)}
                      placeholder="Specify other fire safety system"
                      className={inp}
                    />
                  </Row>

                  <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-3">
                    <Row label="a. Are all of the above checked in working order?">
                      <YesNo name="fireSystemsWorkingOrder" value={fireSystemsWorkingOrder} onChange={setFireSystemsWorkingOrder} />
                    </Row>

                    <Row label="b. Will these systems be maintained and operable for duration of construction?">
                      <YesNo name="fireSystemsMaintained" value={fireSystemsMaintained} onChange={setFireSystemsMaintained} />
                    </Row>

                    {(fireSystemsWorkingOrder === false || fireSystemsMaintained === false) && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-700">
                          c. If no to a. or b., please explain and describe fire prevention measures taken:
                        </label>
                        <textarea
                          rows={2}
                          value={fireSystemsExplanation}
                          onChange={e => setFireSystemsExplanation(e.target.value)}
                          placeholder="Describe hot work permits, fire extinguishers on site, fire watch..."
                          className={textareaStyle}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* 32, 33, 34, 35) Utilities & Alarms */}
                <div className="pt-4 border-t border-gray-200 space-y-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                    Utilities & Intrusion Protection
                  </div>

                  {/* 32) Electrical */}
                  <div className="space-y-2">
                    <Row label="32) Will electrical service be maintained?">
                      <YesNo name="electricalServiceMaintained" value={electricalServiceMaintained} onChange={setElectricalServiceMaintained} />
                    </Row>
                    <Row label="a. When was electrical system last updated?">
                      <input
                        type="text"
                        value={electricalLastUpdated}
                        onChange={e => setElectricalLastUpdated(e.target.value)}
                        placeholder="e.g. 2020 / Full rewire"
                        className={inp}
                      />
                    </Row>
                  </div>

                  {/* 33) Heating */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <Row label="33) Will heating service (gas, oil, etc.) be maintained?">
                      <YesNo name="heatingServiceMaintained" value={heatingServiceMaintained} onChange={setHeatingServiceMaintained} />
                    </Row>
                    <Row label="a. When was heating/HVAC equipment last updated?">
                      <input
                        type="text"
                        value={heatingLastUpdated}
                        onChange={e => setHeatingLastUpdated(e.target.value)}
                        placeholder="e.g. 2018 / New furnace"
                        className={inp}
                      />
                    </Row>
                  </div>

                  {/* 34) Water */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <Row label="34) Will water service be shut off and pipes drained/winterized?">
                      <YesNo name="waterServiceShutOff" value={waterServiceShutOff} onChange={setWaterServiceShutOff} />
                    </Row>
                    <Row label="a. When was plumbing last updated?">
                      <input
                        type="text"
                        value={plumbingLastUpdated}
                        onChange={e => setPlumbingLastUpdated(e.target.value)}
                        placeholder="e.g. 2022 / Copper replumb"
                        className={inp}
                      />
                    </Row>
                  </div>

                  {/* 35) Burglar Alarm */}
                  <div className="pt-3 border-t border-gray-100 space-y-2">
                    <Row label="35) Does current structure have a burglar or intrusion alarm in place?">
                      <YesNo name="burglarAlarmInPlace" value={burglarAlarmInPlace} onChange={setBurglarAlarmInPlace} />
                    </Row>
                    {burglarAlarmInPlace === true && (
                      <Row label="a. Will this be maintained during construction?">
                        <YesNo name="burglarAlarmMaintained" value={burglarAlarmMaintained} onChange={setBurglarAlarmMaintained} />
                      </Row>
                    )}
                  </div>
                </div>

              </div>
            </Section>

            {/* ════════════════════════════════════════════════════════════
                SECTION IV: CLAIMS HISTORY
            ════════════════════════════════════════════════════════════ */}
            <Section title="IV. CLAIMS HISTORY">
              <div className="space-y-6">

                {/* 36) Unreported Incidents */}
                <div className="space-y-3">
                  <Row label="36) Do you know of any incidents not currently reported that may result in a claim?">
                    <YesNo name="unreportedIncidents" value={unreportedIncidents} onChange={setUnreportedIncidents} />
                  </Row>

                  {unreportedIncidents === true && (
                    <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Please attach an explanation:
                      </label>
                      <textarea
                        rows={2}
                        value={unreportedIncidentsExplanation}
                        onChange={e => setUnreportedIncidentsExplanation(e.target.value)}
                        placeholder="Provide details of incident, date, potential claimants, potential damages..."
                        className={textareaStyle}
                      />
                    </div>
                  )}
                </div>

                {/* 37) Prior Canceled / Non-renewed */}
                <div className="pt-4 border-t border-gray-200 space-y-3">
                  <Row label="37) During past 5 years, has any insurer canceled or non-renewed similar insurance, or canceled for nonpayment?">
                    <YesNo name="canceledNonRenewed" value={canceledNonRenewed} onChange={setCanceledNonRenewed} />
                  </Row>

                  {canceledNonRenewed === true && (
                    <div className="bg-[#faf8f5] p-4 rounded border border-gray-200 space-y-1">
                      <label className="text-xs font-semibold text-gray-700">
                        Please attach an explanation:
                      </label>
                      <textarea
                        rows={2}
                        value={canceledExplanation}
                        onChange={e => setCanceledExplanation(e.target.value)}
                        placeholder="State insurer name, reason for cancellation or non-renewal, and resolution..."
                        className={textareaStyle}
                      />
                    </div>
                  )}
                </div>

                {/* 38) Claim Details */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        38) Claim Details
                      </div>
                      <p className="text-xs text-gray-500">
                        Has the applicant experienced any claims within the past 5 years?
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <YesNo
                        name="hasPastClaims"
                        value={hasPastClaims}
                        onChange={v => {
                          setHasPastClaims(v);
                          if (v && claimsList.length === 0) {
                            setClaimsList([{ ...defaultClaim }]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {hasPastClaims === true && (
                    <div className="space-y-6 mt-4">
                      {claimsList.map((claim, idx) => (
                        <div key={idx} className="bg-[#faf8f5] border border-gray-300 rounded p-4 md:p-6 space-y-4 relative">
                          <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                            <span className="text-sm font-bold text-[#7A6F64]">Claim #{idx + 1}</span>
                            {claimsList.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeClaim(idx)}
                                className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Remove Claim</span>
                              </button>
                            )}
                          </div>

                          <Row label="a. What was the date of the incident?">
                            <input
                              type="date"
                              value={claim.incidentDate}
                              onChange={e => updateClaim(idx, 'incidentDate', e.target.value)}
                              className={inp}
                            />
                          </Row>

                          <div>
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-2">
                              b. What line(s) of coverage was this claim reported on?
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 mb-2">
                              {CLAIM_COVERAGE_LINES.map(line => (
                                <label key={line} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(claim.linesCovered || []).includes(line)}
                                    onChange={() => toggleClaimCoverage(idx, line)}
                                    className="rounded text-[#7A6F64] focus:ring-[#7A6F64] w-3.5 h-3.5"
                                  />
                                  <span>{line}</span>
                                </label>
                              ))}
                            </div>
                            <input
                              type="text"
                              value={claim.otherLine}
                              onChange={e => updateClaim(idx, 'otherLine', e.target.value)}
                              placeholder="Other coverage line (if applicable)"
                              className={inp}
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">
                              c. Describe circumstances leading to claim, damage details & loss mitigation:
                            </label>
                            <textarea
                              rows={3}
                              value={claim.circumstances}
                              onChange={e => updateClaim(idx, 'circumstances', e.target.value)}
                              placeholder="Circumstances, factual details, value of lost materials or structure damage, steps taken to mitigate loss..."
                              className={textareaStyle}
                            />
                          </div>

                          <Row label="d. If closed, did it require trial or arbitration to settle?">
                            <YesNo
                              name={`closedTrial_${idx}`}
                              value={claim.closedWithTrial}
                              onChange={v => updateClaim(idx, 'closedWithTrial', v)}
                            />
                          </Row>

                          <div className="space-y-2">
                            <Row label="e. If open, do you anticipate trial or arbitration?">
                              <YesNo
                                name={`openTrial_${idx}`}
                                value={claim.openAnticipateTrial}
                                onChange={v => updateClaim(idx, 'openAnticipateTrial', v)}
                              />
                            </Row>
                            {claim.openAnticipateTrial === true && (
                              <Row label="+ If yes, when?">
                                <input
                                  type="text"
                                  value={claim.trialDate}
                                  onChange={e => updateClaim(idx, 'trialDate', e.target.value)}
                                  placeholder="Estimated date or quarter"
                                  className={inp}
                                />
                              </Row>
                            )}
                          </div>

                          <Row label="f. Were procedures or rules changed after this incident?">
                            <YesNo
                              name={`procChanged_${idx}`}
                              value={claim.proceduresChanged}
                              onChange={v => updateClaim(idx, 'proceduresChanged', v)}
                            />
                          </Row>

                          <div className="space-y-2">
                            <Row label="g. Was structure or materials a total loss/full insured value claimed?">
                              <YesNo
                                name={`totalLoss_${idx}`}
                                value={claim.totalLoss}
                                onChange={v => updateClaim(idx, 'totalLoss', v)}
                              />
                            </Row>
                            {claim.totalLoss === false && (
                              <Row label="+ If no, what percentage was lost?">
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={claim.percentLost}
                                    onChange={e => updateClaim(idx, 'percentLost', e.target.value)}
                                    placeholder="e.g. 15"
                                    className={`${inp} pr-8`}
                                  />
                                  <span className="absolute right-3 top-2 text-gray-500 text-sm">%</span>
                                </div>
                              </Row>
                            )}
                          </div>

                          <Row label="h. Total claimed ($):">
                            <CurrencyInp
                              value={claim.totalClaimed}
                              onChange={v => updateClaim(idx, 'totalClaimed', v)}
                              placeholder="0.00"
                            />
                          </Row>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={addClaim}
                        className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#7A6F64] text-[#7A6F64] hover:bg-[#7A6F64] hover:text-white rounded text-sm font-semibold transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Another Claim</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </Section>

          </fieldset>
        </form>

        {/* ═══ Fixed Bottom Action Bar ═══════════════════════════════ */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-50 shadow-md">
          <button
            type="button"
            onClick={() => {
              if (isEditMode || isViewMode) {
                window.close();
              } else {
                router.push("/agency/marketplace");
              }
            }}
            className="px-6 py-2.5 border border-gray-400 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors"
          >
            {isEditMode || isViewMode ? "Close Tab" : "Return to Marketplace"}
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
                form="builders-risk-form"
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

export default function BuildersRiskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-[#7A6F64] border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-gray-600 font-medium text-sm">Loading Builders Risk Application...</p>
          </div>
        </div>
      }
    >
      <BuildersRiskContent />
    </Suspense>
  );
}
