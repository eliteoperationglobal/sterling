"use client";

export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
    ChevronUp,
    ChevronDown,
    FileText,
    DollarSign,
    Shield,
    FileIcon,
    Home,
    ArrowLeft,
    CircleDot,
    Plus,
    Trash2
} from "lucide-react";

const YesNoRadio = ({
    value,
    onChange,
    disableNo = false
}: {
    value: boolean | null | undefined;
    onChange: (val: boolean | null) => void;
    disableNo?: boolean;
}) => (
    <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
            <input
                type="radio"
                checked={value === true}
                onChange={() => onChange(true)}
                className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
            />
            <span className="text-sm text-gray-700">Yes</span>
        </label>
        <label
            className={`flex items-center gap-2 ${disableNo ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
            <input
                type="radio"
                checked={value === false}
                disabled={disableNo}
                onChange={() => {
                    if (!disableNo) onChange(false);
                }}
                className="w-4 h-4 text-[#9A8B7A] border-gray-300 focus:ring-[#9A8B7A]"
            />
            <span className="text-sm text-gray-700">No</span>
        </label>
    </div>
);

const GridRow = ({ label, children, required = false }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_320px] gap-4 md:gap-x-6 items-start">
        <label className="text-sm font-medium text-gray-900 md:pt-2 leading-snug">
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

function ApartmentBuildingsContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const isViewMode = mode === "view";
    const isEditMode = mode === "edit";
    const submissionId = searchParams.get("id");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const publicToken = searchParams.get("token");
    const [isPublicLink, setIsPublicLink] = useState(false);
    const [isVerifyingLink, setIsVerifyingLink] = useState(false);
    const [linkError, setLinkError] = useState<string | null>(null);

    useEffect(() => {
        if (publicToken) {
            setIsVerifyingLink(true);
            fetch(`/api/public/links/verify?token=${publicToken}&expectedProgramId=apartment-buildings`)
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

    useEffect(() => {
        if (status === "unauthenticated" && !publicToken) {
            router.push("/signin");
        }
    }, [status, router, publicToken]);

    // Auth & Agent Logic
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

    const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa", "Juan Montoya"];
    const BLUE_ANGEL_AGENTS = ["Max Mintz"];
    const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
    const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
    const TITAN_AGENTS = ["Judah Cohen"];

    const agentOptionsList = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? CAPCO_AGENTS : [];

    const [currentView, setCurrentView] = useState<'overview' | 'form'>('overview');
    const [appExpanded, setAppExpanded] = useState(true);
    const [quoteExpanded, setQuoteExpanded] = useState(false);
    const [policyExpanded, setPolicyExpanded] = useState(false);
    const [formCompleted, setFormCompleted] = useState(false);
    const [formCompletedAt, setFormCompletedAt] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);
    const [activeSearchType, setActiveSearchType] = useState<"mailing" | "property" | null>(null);
    const [validationErrors, setValidationErrors] = useState<any>({
        phone: '',
        fax: ''
    });

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

    const validateEmail = (val: string) => {
        if (!val) {
            setValidationErrors((prev: any) => ({ ...prev, email: '' }));
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(val)) {
            setValidationErrors((prev: any) => ({ ...prev, email: 'Invalid email address.' }));
        } else {
            setValidationErrors((prev: any) => ({ ...prev, email: '' }));
        }
    };

    const [formData, setFormData] = useState({
        // Screenshot 1 Fields
        applicantName: "",
        agentName: "",
        applicantMailingAddress: "",
        agentMailingAddress: "",
        propertyNameAndAddress: "",
        streetAddress: "",
        city: "",
        state: "",
        zip: "",
        proposedEffectiveDateFrom: "",
        proposedEffectiveDateTo: "",
        bankruptcyPending: null as boolean | null,
        isPropertyAddressSame: false,
        buildingType: "",
        mixedUseResidentialPct: "",
        mixedUseCommercialPct: "",
        mixedUseCommercialTenants: "",
        mixedUseCookingExposure: null as boolean | null,
        mixedUseSeparateEntrances: null as boolean | null,
        mixedUseSeparateUtilities: null as boolean | null,
        officeOccupancyType: "",
        officeTenantTypes: "",
        officeMedicalOffices: null as boolean | null,
        officeHighFootTraffic: null as boolean | null,
        retailType: "",
        retailCooking: null as boolean | null,
        retailHours: "",
        warehouseStoredItems: "",
        warehouseStorageHeight: "",
        warehouseHazardousMaterials: null as boolean | null,
        warehouseOccupancyType: "",
        warehouseUsageType: "",
        mfgOpsDescription: "",
        mfgProductTypes: "",
        mfgHeavyMachinery: null as boolean | null,
        mfgFlammableMaterials: null as boolean | null,
        mfgMfgPct: "",
        mfgStoragePct: "",

        // 1
        interestInPropertyRadio: "" as "Owner" | "Manager" | "",
        propertyManagementFirmName: "",
        isManagementFirmInsured: null as boolean | null,

        // 2
        yearFirstOwnedOrManaged: "",

        // 3
        yearBuilt: "",
        yearRoofInstalled: "",
        roofingType: "",
        yearWiringInstalled: "",
        yearPlumbingInstalled: "",
        yearHeatingInstalled: "",

        numberOfUnits: "",
        numberOfStories: "",
        hasBasement: null as boolean | null,
        totalBuildingArea: "",
        protectionClass: "",
        constructionType: "",
        percentageOccupied: "",
        distanceToFireHydrant: "",
        distanceToFireStation: "",
        fireDistrict: "",

        percentageElderly: "",
        subjectsOfInsurance: [{ subject: "", limit: "" }] as { subject: string, limit: string, coinsurance?: string, valuation?: string, causesOfLoss?: string, deductible?: string, deductibleType?: string }[],
        propertyLimit: "",
        propertyCoinsurance: "",
        propertyValuation: "",
        propertyCausesOfLoss: "",
        propertyDeductible: "",
        propertyDeductibleType: "",

        // 4
        heatingType: "",

        // 5
        buildingWiring: "" as "Copper" | "Aluminum" | "Other" | "",
        aluminumWiringPigtailedOrCOALR: null as boolean | null,
        plumbingType: "",

        // 6
        hasSprinklers: null as boolean | null,
        percentageSprinklered: "",
        hasBurglarAlarm: null as boolean | null,
        burglarAlarmType: "",
        burglarAlarmInstalledBy: "",
        smokeAlarms: "" as "Hardwire" | "Battery" | "",
        hardwiredCentralStation: null as boolean | null,
        batteryRoutineInspection: true as boolean | null,

        // 7
        // (Section 7 fields removed)

        // 8
        complianceWithSafetyLaws: true as boolean | null,

        // 9
        // (Fields removed)

        // 11
        unitsRekeyed: true as boolean | null,

        // 12
        doorDoubleLocksPeepHoles: true as boolean | null,

        // 13
        perimeterFencing: true as boolean | null,

        // 14
        // (Field removed)

        // 15
        securityGuardOnsite: false as boolean | null,

        // 16
        // (Fields removed)

        // 17
        proceduresNotifyingTenantsCriminal: true as boolean | null,

        // 18
        proceduresTenantSafetyComplaints: true as boolean | null,

        // 19
        fullTimeMaintenanceStaff: false as boolean | null,
        proceduresInspectingSystems: null as boolean | null,

        // 20
        hireContractorsMaintenance: true as boolean | null,
        hireContractorsMaintenanceDetails: "",
        contractorsRequiredCGL: true as boolean | null,
        contractorsRequiredCGLExplanation: "",

        // 21
        proceduresTenantComplaintsBuilding: true as boolean | null,

        // 22
        hasPools: false as boolean | null,
        poolNumber: "",
        heightOfDivingBoards: "",
        lengthHeightOfSlides: "",
        fenceHeight: "",
        poolFenced: null as boolean | null,
        gatesSelfLatching: null as boolean | null,
        lifeguardOnDuty: null as boolean | null,
        depthMarkersVisible: null as boolean | null,
        poolInspectionFrequency: "",
        poolHours: "",

        // 23
        nurseryDayCareFacility: false as boolean | null,

        leaseProhibitsTenantsDogs: true as boolean | null,

        // 26
        describeOtherBuildingsHazards: "N/A",

        // 27
        ownControlParkingFacilities: false as boolean | null,
        parkingAccessControlled: null as boolean | null,
        parkingDescription: "",

        // 28
        proceduresRegularInspectionsHazards: true as boolean | null,
        contractorsLicense: false as boolean | null,
        licenseNumber: "",
        licenseClassification: "",
        dba: "",
        firstName: "",
        lastName: "",
        yearsOfExperienceTrade: "",
        entityType: "Individual",
        phone: "",
        email: "",

        // Add General Liability (Optional)
        addGeneralLiability: false as boolean,
        glCoverageLimits: "1M / 2M / 2M" as string,
        glFireLegalLimit: "$50,000" as string,
        glMedicalExpenseLimit: "Not Applicable" as string,
        glDeductible: "$2,500" as string,
        paymentOption: "" as string,
    });

    const agentOptions = Array.from(new Set([...agentOptionsList, ...(submissionId && formData.agentName ? [formData.agentName] : [])]));

    const handleAddressSearch = async (value: string, type: "mailing" | "property") => {
        handleInputChange(type === "mailing" ? "applicantMailingAddress" : "propertyNameAndAddress", value);

        if (value.length < 3) {
            setAddressSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        setAddressLoading(true);
        setActiveSearchType(type);
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
        const formattedAddress = `${suggestion.street_line} ${suggestion.secondary || ""}, ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`.trim();

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
        const fullStateName = STATE_CODE_TO_NAME[suggestion.state] || suggestion.state;

        if (activeSearchType === "mailing") {
            handleInputChange("applicantMailingAddress", formattedAddress);
            handleInputChange("streetAddress", `${suggestion.street_line} ${suggestion.secondary || ""}`.trim());
            handleInputChange("city", suggestion.city);
            handleInputChange("state", fullStateName);
            handleInputChange("zip", suggestion.zipcode);
        } else {
            handleInputChange("propertyNameAndAddress", formattedAddress);
        }

        setAddressSuggestions([]);
        setShowSuggestions(false);
        setActiveSearchType(null);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: value };

            // Sync logic for Property Name and Address
            if (field === "isPropertyAddressSame") {
                if (value === true) {
                    newState.propertyNameAndAddress = prev.applicantMailingAddress;
                }
            } else if (field === "applicantMailingAddress") {
                if (prev.isPropertyAddressSame) {
                    newState.propertyNameAndAddress = value;
                }
            }

            // Sync logic for Proposed Effective Date (1-year term)
            if (field === "proposedEffectiveDateFrom" && value) {
                const date = new Date(value + 'T00:00:00');
                if (!isNaN(date.getTime())) {
                    date.setFullYear(date.getFullYear() + 1);
                    const y = date.getFullYear();
                    const m = String(date.getMonth() + 1).padStart(2, '0');
                    const d = String(date.getDate()).padStart(2, '0');
                    newState.proposedEffectiveDateTo = `${y}-${m}-${d}`;
                }
            }

            // Sync logic for Mixed-Use Percentages
            if (field === "mixedUseResidentialPct") {
                const val = value === "" ? 0 : parseInt(value) || 0;
                const cappedVal = Math.min(Math.max(val, 0), 100);
                newState.mixedUseResidentialPct = value === "" ? "" : String(cappedVal);
                newState.mixedUseCommercialPct = value === "" ? "" : String(100 - cappedVal);
            }

            // Sync logic for Manufacturing Percentages
            if (field === "mfgMfgPct") {
                const val = value === "" ? 0 : parseInt(value) || 0;
                const cappedVal = Math.min(Math.max(val, 0), 100);
                newState.mfgMfgPct = value === "" ? "" : String(cappedVal);
                newState.mfgStoragePct = value === "" ? "" : String(100 - cappedVal);
            } else if (field === "mfgStoragePct") {
                const val = value === "" ? 0 : parseInt(value) || 0;
                const cappedVal = Math.min(Math.max(val, 0), 100);
                newState.mfgStoragePct = value === "" ? "" : String(cappedVal);
                newState.mfgMfgPct = value === "" ? "" : String(100 - cappedVal);
            } else if (field === "mixedUseCommercialPct") {
                const val = value === "" ? 0 : parseInt(value) || 0;
                const cappedVal = Math.min(Math.max(val, 0), 100);
                newState.mixedUseCommercialPct = value === "" ? "" : String(cappedVal);
                newState.mixedUseResidentialPct = value === "" ? "" : String(100 - cappedVal);
            }

            return newState;
        });
    };

    const addSubjectOfInsurance = () => {
        setFormData((prev: any) => ({
            ...prev,
            subjectsOfInsurance: [...prev.subjectsOfInsurance, { subject: "", limit: "" }]
        }));
    };

    const removeSubjectOfInsurance = (index: number) => {
        if (formData.subjectsOfInsurance.length <= 1) return;
        setFormData((prev: any) => ({
            ...prev,
            subjectsOfInsurance: prev.subjectsOfInsurance.filter((_: any, i: number) => i !== index)
        }));
    };

    const updateSubjectOfInsurance = (index: number, field: "subject" | "limit" | "coinsurance" | "valuation" | "causesOfLoss" | "deductible" | "deductibleType", value: string) => {
        setFormData((prev: any) => {
            const newSubjects = [...prev.subjectsOfInsurance];
            newSubjects[index] = { ...newSubjects[index], [field]: value };
            return {
                ...prev,
                subjectsOfInsurance: newSubjects
            };
        });
    };

    useEffect(() => {
        const fetchSubmissionData = async () => {
            if (!submissionId) return;
            try {
                const res = await fetch(`/api/agency/submissions/${submissionId}`);
                const result = await res.json();
                if (!res.ok) throw new Error(result.error);

                const payload = result.submission.payload;

                // Migrate old subjectOfInsurance and subjectsOfInsurance string array to object array
                if (payload.subjectsOfInsurance && Array.isArray(payload.subjectsOfInsurance)) {
                    if (payload.subjectsOfInsurance.length > 0 && typeof payload.subjectsOfInsurance[0] === 'string') {
                        payload.subjectsOfInsurance = payload.subjectsOfInsurance.map((s: string, i: number) => ({
                            subject: s,
                            limit: i === 0 ? (payload.propertyLimit || "") : ""
                        }));
                    }
                } else if (payload.subjectOfInsurance) {
                    payload.subjectsOfInsurance = [{ subject: payload.subjectOfInsurance, limit: payload.propertyLimit || "" }];
                } else if (!payload.subjectsOfInsurance) {
                    payload.subjectsOfInsurance = [{ subject: "", limit: "" }];
                }

                setFormData((prev: any) => ({
                    ...prev,
                    ...payload,
                }));
                setFormCompleted(true);
            } catch (err) {
                console.error("Failed to fetch submission data:", err);
            }
        };

        fetchSubmissionData();
    }, [submissionId]);

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!formData.agentName || !formData.applicantName) {
            toast.error("Agent Name and Applicant Name are required");
            return;
        }

        if (!formData.paymentOption) {
            toast.error("Please select a Payment Option before submitting");
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
                        programId: "apartment-buildings",
                        programName: "Commercial Property",
                        formData,
                        token: publicToken,
                    }),
                });
            } else if (isEditMode && submissionId) {
                response = await fetch(`/api/agency/submissions/${submissionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        payload: formData,
                        programId: "apartment-buildings",
                        programName: "Commercial Property"
                    }),
                });
            } else {
                response = await fetch("/api/agency/applications/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        programId: "apartment-buildings",
                        programName: "Commercial Property",
                        formData,
                    }),
                });
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit");

            toast.success(isEditMode ? "Application updated successfully!" : "Application submitted successfully!");

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

    const renderOverview = () => (
        <div className="max-w-4xl mx-auto px-4 py-4 animate-in fade-in duration-500">
            <h1 className="text-xl md:text-[28px] font-medium text-center mb-8 md:mb-12 text-gray-900 tracking-tight">Submission</h1>
            <div className="relative pl-12">
                <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-gray-100"></div>

                <div className="space-y-6">
                    <div className="relative">
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full border-2 border-gray-500 bg-white z-10 ring-4 ring-[#fafaf9]"></div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 md:p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setAppExpanded(!appExpanded)}>
                                <div className="flex items-center gap-3 text-gray-700">
                                    <FileText className="w-5 h-5 text-[#9A8B7A]" />
                                    <span className="font-medium text-sm md:text-[16px]">Application</span>
                                </div>
                                {appExpanded ? <ChevronUp className="w-5 h-5 text-gray-800" /> : <ChevronDown className="w-5 h-5 text-gray-800" />}
                            </div>

                            {appExpanded && (
                                <div className="border-t border-gray-100 p-6 sm:p-8 space-y-10">
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-[17px] text-gray-600">Insured Info</h3>
                                            <button onClick={() => setCurrentView('form')} className={`px-6 py-1.5 border rounded-md text-sm font-medium transition-all active:scale-95 ${formCompleted ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white shadow-sm'}`}>
                                                {formCompleted ? 'Review' : 'Start'}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-[17px] text-gray-600 mb-4">Coverages</h3>
                                        <div className="border border-gray-200 rounded-lg text-sm overflow-hidden flex flex-col">
                                            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center bg-[#e5e7eb] px-5 py-2.5 font-[600] text-[11px] text-gray-600 uppercase tracking-widest">
                                                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 fill-current" /> TYPE</div>
                                                <div className="flex items-center gap-2"><FileIcon className="w-3.5 h-3.5 fill-current" /> APP ID</div>
                                                <div className="flex items-center gap-2"><CircleDot className="w-3.5 h-3.5 fill-current" /> STATUS</div>
                                                <div></div>
                                            </div>

                                            <div className="flex flex-col sm:grid sm:grid-cols-[2fr_1fr_1fr_100px] gap-4 items-start sm:items-center px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3 text-gray-800 font-medium text-[14px]">
                                                    <div className="p-1.5 bg-[#f5f1eb] text-[#9A8B7A] rounded-md">
                                                        <Home className="w-[18px] h-[18px]" />
                                                    </div>
                                                    Commercial Property
                                                </div>
                                                <div className="text-gray-500 font-medium text-[13px] pl-10 sm:pl-0">
                                                    <span className="sm:hidden text-gray-400 text-xs block mb-1">APP ID</span>
                                                    {appId || 'To be assigned'}
                                                </div>
                                                <div className="pl-10 sm:pl-0">
                                                    <span className="sm:hidden text-gray-400 text-xs block mb-1">STATUS</span>
                                                    <span className={`px-2.5 py-1.5 text-[12px] rounded font-semibold whitespace-nowrap ${formCompleted ? 'bg-[#f1f5f9] text-[#64748b]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                                                        {formCompleted ? 'In Progress' : 'Not Started'}
                                                    </span>
                                                </div>
                                                <div className="w-full sm:text-right pl-10 sm:pl-0 pt-2 sm:pt-0">
                                                    <button
                                                        onClick={handleSubmit}
                                                        className={`w-full sm:w-auto px-6 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${formCompleted ? 'bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white shadow-sm' : 'border border-gray-300 text-gray-400 cursor-not-allowed bg-white'}`}
                                                        disabled={!formCompleted || isSubmitting}
                                                    >
                                                        {isSubmitting ? "Submitting..." : (isViewMode ? "Lock (View Mode)" : (isEditMode ? "Update" : "Submit"))}
                                                    </button>
                                                </div>
                                            </div>
                                            {formCompleted && formCompletedAt && (
                                                <div className="px-5 py-2 border-t border-gray-100 flex justify-end">
                                                    <p className="text-[12px] text-[#9A8B7A] font-medium text-right">Edited {formCompletedAt}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#f1f5f9] z-10 border-4 border-[#fafaf9]"></div>
                        <div className="bg-[#f8fafc] rounded-xl border border-[#f1f5f9] overflow-hidden opacity-90">
                            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f1f5f9] transition-colors" onClick={() => setQuoteExpanded(!quoteExpanded)}>
                                <div className="flex items-center gap-3 text-[#94a3b8]">
                                    <DollarSign className="w-5 h-5 font-bold" />
                                    <span className="font-semibold text-[15px]">Quote Summary</span>
                                </div>
                                {quoteExpanded ? <ChevronUp className="w-5 h-5 text-[#94a3b8]" /> : <ChevronDown className="w-5 h-5 text-[#94a3b8]" />}
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#f1f5f9] z-10 border-4 border-[#fafaf9]"></div>
                        <div className="bg-[#f8fafc] rounded-xl border border-[#f1f5f9] overflow-hidden opacity-90">
                            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f1f5f9] transition-colors" onClick={() => setPolicyExpanded(!policyExpanded)}>
                                <div className="flex items-center gap-3 text-[#94a3b8]">
                                    <FileText className="w-5 h-5" />
                                    <span className="font-semibold text-[15px]">Policy Summary</span>
                                </div>
                                {policyExpanded ? <ChevronUp className="w-5 h-5 text-[#94a3b8]" /> : <ChevronDown className="w-5 h-5 text-[#94a3b8]" />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
            <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                <h2 className="text-base md:text-lg font-semibold">{title}</h2>
            </div>
            <div className="px-4 md:px-8 pt-6 pb-7">
                <div className="space-y-6 mt-1">
                    {children}
                </div>
            </div>
        </div>
    );

    const renderForm = () => (
        <div className="max-w-[950px] mx-auto px-4 py-6 md:py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <fieldset disabled={isViewMode} className={`space-y-10 ${isViewMode ? 'opacity-90 pointer-events-none' : ''}`}>

                {renderSection("Agent & Application Information", (
                    <>
                        <GridRow label="Agent Name" required>
                            {agentOptions.length > 0 ? (
                                <select value={formData.agentName} onChange={(e) => handleInputChange("agentName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm">
                                    <option value="" disabled hidden>Select Agent</option>
                                    {agentOptions.map(a => <option key={a} value={a}>{a}</option>)}
                                </select>
                            ) : (
                                <input type="text" value={formData.agentName} onChange={(e) => handleInputChange("agentName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm" />
                            )}
                        </GridRow>
                        <GridRow label="Applicant Name">
                            <input type="text" value={formData.applicantName} onChange={(e) => handleInputChange("applicantName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm" />
                        </GridRow>
                        <GridRow label="Applicant Mailing Address">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={formData.applicantMailingAddress}
                                    onChange={(e) => handleAddressSearch(e.target.value, "mailing")}
                                    placeholder="Start typing address..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                    autoComplete="off"
                                />
                                {addressLoading && activeSearchType === "mailing" && (
                                    <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                                )}
                                {showSuggestions && activeSearchType === "mailing" && addressSuggestions.length > 0 && (
                                    <div
                                        ref={suggestionRef}
                                        className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                                    >
                                        {addressSuggestions.map((suggestion, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => handleSelectSuggestion(suggestion)}
                                                className="px-4 py-2 text-sm cursor-pointer hover:bg-[#fafafc] transition-colors border-b border-gray-50 last:border-0"
                                            >
                                                {suggestion.street_line} {suggestion.secondary || ""}, {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </GridRow>
                        <GridRow label="Applicant Phone">
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const formatted = formatPhone(value);
                                        handleInputChange('phone', formatted);
                                        validatePhone(formatted, 'phone');
                                    }}
                                    className={`w-full px-4 py-2 border rounded focus:ring-[#9A8B7A] text-sm ${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="(123) 456-7890"
                                    maxLength={14}
                                />
                                {validationErrors.phone && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-red-600 text-xs">⚠</span>
                                        <span className="text-xs text-red-600">{validationErrors.phone}</span>
                                    </div>
                                )}
                            </div>
                        </GridRow>
                        <GridRow label="Applicant Email">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        handleInputChange("email", val);
                                        validateEmail(val);
                                    }}
                                    className={`w-full px-4 py-2 border rounded focus:ring-[#9A8B7A] text-sm ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    placeholder="insured@example.com"
                                />
                                {validationErrors.email && (
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="text-red-600 text-xs">⚠</span>
                                        <span className="text-xs text-red-600">{validationErrors.email}</span>
                                    </div>
                                )}
                            </div>
                        </GridRow>
                        <GridRow label="Entity of Company">
                            <select value={formData.entityType} onChange={(e) => handleInputChange("entityType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm">
                                <option>Individual</option>
                                <option>Joint Venture</option>
                                <option>Partnership</option>
                                <option>Corporation</option>
                                <option>LLC</option>
                                <option>Trust</option>
                                <option>Other</option>
                            </select>
                        </GridRow>
                        <GridRow label="First Name">
                            <input type="text" value={formData.firstName} onChange={(e) => handleInputChange("firstName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm" />
                        </GridRow>
                        <GridRow label="Last Name">
                            <input type="text" value={formData.lastName} onChange={(e) => handleInputChange("lastName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm" />
                        </GridRow>

                    </>
                ))}
                {renderSection("Property Information", (
                    <>

                        <GridRow label="Property Name and Address same as Applicant Mailing Address">
                            <div className="pt-2">
                                <YesNoRadio
                                    value={formData.isPropertyAddressSame}
                                    onChange={(v) => handleInputChange("isPropertyAddressSame", v)}
                                />
                            </div>
                        </GridRow>
                        {!formData.isPropertyAddressSame && (
                            <GridRow label="Property Name and Address">
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.propertyNameAndAddress}
                                        onChange={(e) => handleAddressSearch(e.target.value, "property")}
                                        placeholder="Start typing property address..."
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                        autoComplete="off"
                                    />
                                    {addressLoading && activeSearchType === "property" && (
                                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                                    )}
                                    {showSuggestions && activeSearchType === "property" && addressSuggestions.length > 0 && (
                                        <div
                                            ref={suggestionRef}
                                            className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                                        >
                                            {addressSuggestions.map((suggestion, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleSelectSuggestion(suggestion)}
                                                    className="px-4 py-2 text-sm cursor-pointer hover:bg-[#fafafc] transition-colors border-b border-gray-50 last:border-0"
                                                >
                                                    {suggestion.street_line} {suggestion.secondary || ""}, {suggestion.city}, {suggestion.state} {suggestion.zipcode}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </GridRow>
                        )}
                        <GridRow label="Proposed Effective Date From">
                            <input type="date" value={formData.proposedEffectiveDateFrom} onChange={(e) => handleInputChange("proposedEffectiveDateFrom", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                            <p className="text-xs text-gray-500 mt-1">12:01 A.M. Standard Time</p>
                        </GridRow>
                    </>
                ))}
                {renderSection("Ownership & Interest", (
                    <>
                        <GridRow label="Interest in Property">
                            <div className="flex gap-4 pt-2 text-sm text-gray-700">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.interestInPropertyRadio === 'Owner'} onChange={() => handleInputChange('interestInPropertyRadio', 'Owner')} className="text-[#9A8B7A] focus:ring-[#9A8B7A]" /> Owner</label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.interestInPropertyRadio === 'Manager'} onChange={() => handleInputChange('interestInPropertyRadio', 'Manager')} className="text-[#9A8B7A] focus:ring-[#9A8B7A]" /> Manager</label>
                            </div>
                        </GridRow>
                        {formData.interestInPropertyRadio === 'Manager' && (
                            <>
                                <LongGridRow label="Name of Property Management Firm:">
                                    <input type="text" value={formData.propertyManagementFirmName} onChange={(e) => handleInputChange("propertyManagementFirmName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </LongGridRow>
                                <LongGridRow label="Is the Property Management Firm required to maintain Commercial General Liability Insurance with minimum $1,000,000 limits and to include you as an Additional Insured?">
                                    <div className="pt-2"><YesNoRadio value={formData.isManagementFirmInsured} onChange={(v) => handleInputChange("isManagementFirmInsured", v)} /></div>
                                </LongGridRow>
                            </>
                        )}

                        <GridRow label="Year you first owned or managed the property">
                            <input type="text" value={formData.yearFirstOwnedOrManaged} onChange={(e) => handleInputChange("yearFirstOwnedOrManaged", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                        </GridRow>
                    </>
                ))}
                {renderSection("Building Details", (
                    <>
                        <GridRow label="Building Type">
                            <select
                                value={formData.buildingType}
                                onChange={(e) => handleInputChange("buildingType", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                            >
                                <option value="" disabled hidden>Select Building Type</option>
                                <option value="Apartment">Apartment</option>
                                <option value="Mixed-Use">Mixed-Use</option>
                                <option value="Office">Office</option>
                                <option value="Retail">Retail</option>
                                <option value="Warehouse">Warehouse</option>
                                <option value="Manufacturing">Manufacturing</option>
                            </select>
                        </GridRow>

                        {formData.buildingType === 'Mixed-Use' && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDot className="w-4 h-4 text-[#9A8B7A]" />
                                    <h4 className="text-sm font-bold text-[#7A6F64] uppercase tracking-wider">Mixed-Use Details</h4>
                                </div>
                                <GridRow label="% Residential & Commercial">
                                    <div className="flex items-center justify-end gap-2">
                                        <input type="text" value={formData.mixedUseResidentialPct} onChange={(e) => handleInputChange("mixedUseResidentialPct", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </GridRow>
                                <GridRow label="Types of Commercial Tenants">
                                    <input type="text" value={formData.mixedUseCommercialTenants} onChange={(e) => handleInputChange("mixedUseCommercialTenants", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                                <GridRow label="Any Cooking Exposure?">
                                    <div className="pt-2"><YesNoRadio value={formData.mixedUseCookingExposure} onChange={(v) => handleInputChange("mixedUseCookingExposure", v)} /></div>
                                </GridRow>
                                <GridRow label="Separate Entrances?">
                                    <div className="pt-2"><YesNoRadio value={formData.mixedUseSeparateEntrances} onChange={(v) => handleInputChange("mixedUseSeparateEntrances", v)} /></div>
                                </GridRow>
                                <GridRow label="Separate Utilities?">
                                    <div className="pt-2"><YesNoRadio value={formData.mixedUseSeparateUtilities} onChange={(v) => handleInputChange("mixedUseSeparateUtilities", v)} /></div>
                                </GridRow>
                            </div>
                        )}

                        {formData.buildingType === 'Office' && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDot className="w-4 h-4 text-[#9A8B7A]" />
                                    <h4 className="text-sm font-bold text-[#7A6F64] uppercase tracking-wider">Office Details</h4>
                                </div>
                                <GridRow label="Owner-Occupied or Tenant-Occupied?">
                                    <input type="text" value={formData.officeOccupancyType} onChange={(e) => handleInputChange("officeOccupancyType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                                <GridRow label="Type of Tenants (Professional, Call Center, Medical, etc.)">
                                    <textarea value={formData.officeTenantTypes} onChange={(e) => handleInputChange("officeTenantTypes", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A] h-16 resize-none" />
                                </GridRow>
                                <GridRow label="Any Medical Offices?">
                                    <div className="pt-2"><YesNoRadio value={formData.officeMedicalOffices} onChange={(v) => handleInputChange("officeMedicalOffices", v)} /></div>
                                </GridRow>
                                <GridRow label="High Foot Traffic?">
                                    <div className="pt-2"><YesNoRadio value={formData.officeHighFootTraffic} onChange={(v) => handleInputChange("officeHighFootTraffic", v)} /></div>
                                </GridRow>
                            </div>
                        )}

                        {formData.buildingType === 'Retail' && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDot className="w-4 h-4 text-[#9A8B7A]" />
                                    <h4 className="text-sm font-bold text-[#7A6F64] uppercase tracking-wider">Retail Details</h4>
                                </div>
                                <GridRow label="Type of Retail (Clothing, Liquor, Smoke Shop, etc.)">
                                    <input type="text" value={formData.retailType} onChange={(e) => handleInputChange("retailType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                                <GridRow label="Any Cooking?">
                                    <div className="pt-2"><YesNoRadio value={formData.retailCooking} onChange={(v) => handleInputChange("retailCooking", v)} /></div>
                                </GridRow>
                                <GridRow label="Hours of Operation">
                                    <input type="text" value={formData.retailHours} onChange={(e) => handleInputChange("retailHours", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" placeholder="e.g., 9 AM - 9 PM" />
                                </GridRow>
                            </div>
                        )}

                        {formData.buildingType === 'Warehouse' && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDot className="w-4 h-4 text-[#9A8B7A]" />
                                    <h4 className="text-sm font-bold text-[#7A6F64] uppercase tracking-wider">Warehouse Details</h4>
                                </div>
                                <GridRow label="What is Stored? (Description)">
                                    <textarea value={formData.warehouseStoredItems} onChange={(e) => handleInputChange("warehouseStoredItems", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A] h-20 resize-none" />
                                </GridRow>
                                <GridRow label="Storage Height">
                                    <input type="text" value={formData.warehouseStorageHeight} onChange={(e) => handleInputChange("warehouseStorageHeight", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" placeholder="e.g., 20 ft" />
                                </GridRow>
                                <GridRow label="Any Hazardous Materials?">
                                    <div className="pt-2"><YesNoRadio value={formData.warehouseHazardousMaterials} onChange={(v) => handleInputChange("warehouseHazardousMaterials", v)} /></div>
                                </GridRow>
                                <GridRow label="Owner-Occupied or Tenant-Occupied?">
                                    <input type="text" value={formData.warehouseOccupancyType} onChange={(e) => handleInputChange("warehouseOccupancyType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                                <GridRow label="Distribution or Storage Only?">
                                    <input type="text" value={formData.warehouseUsageType} onChange={(e) => handleInputChange("warehouseUsageType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                            </div>
                        )}

                        {formData.buildingType === 'Manufacturing' && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <CircleDot className="w-4 h-4 text-[#9A8B7A]" />
                                    <h4 className="text-sm font-bold text-[#7A6F64] uppercase tracking-wider">Manufacturing Details</h4>
                                </div>
                                <GridRow label="Description of Operations">
                                    <textarea value={formData.mfgOpsDescription} onChange={(e) => handleInputChange("mfgOpsDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A] h-20 resize-none" />
                                </GridRow>
                                <GridRow label="Type of Products Manufactured">
                                    <input type="text" value={formData.mfgProductTypes} onChange={(e) => handleInputChange("mfgProductTypes", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                </GridRow>
                                <GridRow label="Any Heavy Machinery?">
                                    <div className="pt-2"><YesNoRadio value={formData.mfgHeavyMachinery} onChange={(v) => handleInputChange("mfgHeavyMachinery", v)} /></div>
                                </GridRow>
                                <GridRow label="Any Flammable Materials?">
                                    <div className="pt-2"><YesNoRadio value={formData.mfgFlammableMaterials} onChange={(v) => handleInputChange("mfgFlammableMaterials", v)} /></div>
                                </GridRow>
                                <GridRow label="% Manufacturing & Storage">
                                    <div className="flex items-center justify-end gap-2">
                                        <input type="text" value={formData.mfgMfgPct} onChange={(e) => handleInputChange("mfgMfgPct", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                        <span className="text-gray-500 text-sm">%</span>
                                    </div>
                                </GridRow>
                            </div>
                        )}

                        <GridRow label="Year Built"><input type="text" value={formData.yearBuilt} onChange={(e) => handleInputChange("yearBuilt", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Number of Units"><input type="text" value={formData.numberOfUnits} onChange={(e) => handleInputChange("numberOfUnits", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>

                        <GridRow label="Number of Stories"><input type="text" value={formData.numberOfStories} onChange={(e) => handleInputChange("numberOfStories", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Basement">
                            <div className="pt-2">
                                <YesNoRadio value={formData.hasBasement} onChange={(v) => handleInputChange("hasBasement", v)} />
                            </div>
                        </GridRow>
                        <GridRow label="Total Building Area (Sq Ft)">
                            <div className="flex items-center justify-end gap-2">
                                <input type="text" value={formData.totalBuildingArea ? Number(formData.totalBuildingArea).toLocaleString('en-US') : ""} onChange={(e) => handleInputChange("totalBuildingArea", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" placeholder="e.g., 5,000" />
                                <span className="text-gray-500 text-sm whitespace-nowrap">Sq Ft</span>
                            </div>
                        </GridRow>
                        <GridRow label="Construction Type">
                            <select
                                value={formData.constructionType}
                                onChange={(e) => handleInputChange("constructionType", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                            >
                                <option value="" disabled hidden>Select Construction Type</option>
                                <option value="Frame">Frame</option>
                                <option value="Joisted Masonry">Joisted Masonry</option>
                                <option value="Non-Combustible">Non-Combustible</option>
                                <option value="Masonry Non-Combustible">Masonry Non-Combustible</option>
                                <option value="Fire Resistive">Fire Resistive</option>
                            </select>
                        </GridRow>

                    </>
                ))}
                {renderSection("Systems & Updates", (
                    <>
                        <GridRow label="Year of Roof Installation (or Last Replacement)"><input type="text" value={formData.yearRoofInstalled} onChange={(e) => handleInputChange("yearRoofInstalled", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Year of Wiring Installation (or Last Replacement)"><input type="text" value={formData.yearWiringInstalled} onChange={(e) => handleInputChange("yearWiringInstalled", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Year of Plumbing Installation (or Last Replacement)"><input type="text" value={formData.yearPlumbingInstalled} onChange={(e) => handleInputChange("yearPlumbingInstalled", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Year of Heating Installation (or Last Replacement)"><input type="text" value={formData.yearHeatingInstalled} onChange={(e) => handleInputChange("yearHeatingInstalled", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <div className="space-y-4">
                            <GridRow label="Heating Type">
                                <select
                                    value={formData.heatingType}
                                    onChange={(e) => handleInputChange("heatingType", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                >
                                    <option value="" disabled hidden>Select Heating Type</option>
                                    <option value="Gas">Gas</option>
                                    <option value="Electric">Electric</option>
                                    <option value="Oil">Oil</option>
                                    <option value="Heat Pump">Heat Pump</option>
                                    <option value="Other">Other</option>
                                </select>
                            </GridRow>
                        </div>
                        <GridRow label="Building Wiring">
                            <select
                                value={formData.buildingWiring}
                                onChange={(e) => handleInputChange("buildingWiring", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                            >
                                <option value="" disabled hidden>Select Wiring Type</option>
                                <option value="Copper">Copper</option>
                                <option value="Aluminum">Aluminum</option>
                                <option value="Other">Other</option>
                            </select>
                        </GridRow>
                        {formData.buildingWiring === 'Aluminum' && (
                            <GridRow label="Is wiring pigtailed or COALR?">
                                <div className="pt-2"><YesNoRadio value={formData.aluminumWiringPigtailedOrCOALR} onChange={(v) => handleInputChange("aluminumWiringPigtailedOrCOALR", v)} /></div>
                            </GridRow>
                        )}
                        <GridRow label="Plumbing Type">
                            <select
                                value={formData.plumbingType}
                                onChange={(e) => handleInputChange("plumbingType", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                            >
                                <option value="" disabled hidden>Select Plumbing Type</option>
                                <option value="Copper">Copper</option>
                                <option value="PEX">PEX</option>
                                <option value="PVC / CPVC">PVC / CPVC</option>
                                <option value="Galvanized Steel">Galvanized Steel</option>
                                <option value="Cast Iron">Cast Iron</option>
                                <option value="Mixed">Mixed</option>
                            </select>
                        </GridRow>
                        <GridRow label="Roofing Type">
                            <select
                                value={formData.roofingType}
                                onChange={(e) => handleInputChange("roofingType", e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                            >
                                <option value="" disabled hidden>Select Roofing Type</option>
                                <option value="Flat">Flat</option>
                                <option value="Pitched">Pitched</option>
                                <option value="Gable">Gable</option>
                                <option value="Hip">Hip</option>
                                <option value="Mansard">Mansard</option>
                                <option value="Shed">Shed</option>
                                <option value="Other">Other</option>
                            </select>
                        </GridRow>
                    </>
                ))}
                {renderSection("Location & Risk Info", (
                    <>
                        <GridRow label="Protection Class"><input type="text" value={formData.protectionClass} onChange={(e) => handleInputChange("protectionClass", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Percentage Occupied (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageOccupied} onChange={(e) => handleInputChange("percentageOccupied", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>
                        <GridRow label="Distance to Fire Hydrant"><input type="text" value={formData.distanceToFireHydrant} onChange={(e) => handleInputChange("distanceToFireHydrant", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" placeholder="e.g., 500 ft" /></GridRow>
                        <GridRow label="Distance to Fire Station"><input type="text" value={formData.distanceToFireStation} onChange={(e) => handleInputChange("distanceToFireStation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" placeholder="e.g., 2 miles" /></GridRow>
                        <GridRow label="Fire District"><input type="text" value={formData.fireDistrict} onChange={(e) => handleInputChange("fireDistrict", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" /></GridRow>

                        <GridRow label="Percentage Elderly (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageElderly} onChange={(e) => handleInputChange("percentageElderly", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>

                    </>
                ))}
                {renderSection("Coverage Details", (
                    <>
                        <div className="space-y-6 pt-4">
                            {formData.subjectsOfInsurance.map((item, index) => (
                                <div key={index} className="space-y-4 bg-gray-50/30 p-4 rounded-lg border border-gray-200 relative group animate-in fade-in slide-in-from-top-2 duration-300">
                                    <GridRow label={index === 0 ? "Subject of Insurance" : `Subject of Insurance ${index + 1}`}>
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={item.subject}
                                                onChange={(e) => updateSubjectOfInsurance(index, "subject", e.target.value)}
                                                className="flex-1 px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                            >
                                                <option value="" disabled hidden>Select Subject</option>
                                                <option value="Building">Building</option>
                                                <option value="Business Personal Property (BPP)">Business Personal Property (BPP)</option>
                                                <option value="Business Income">Business Income</option>
                                            </select>
                                            {formData.subjectsOfInsurance.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSubjectOfInsurance(index)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                                    title="Remove Subject"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </GridRow>
                                    <GridRow label="Limit ($)">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-gray-500 text-sm">$</span>
                                            <input
                                                type="text"
                                                value={item.limit ? Number(item.limit).toLocaleString('en-US') : ""}
                                                onChange={(e) => updateSubjectOfInsurance(index, "limit", e.target.value.replace(/\D/g, ''))}
                                                className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]"
                                                placeholder="Enter Limit"
                                            />
                                        </div>
                                    </GridRow>

                                    <GridRow label="Coinsurance (%)">
                                        <select
                                            value={item.coinsurance || formData.propertyCoinsurance || ""}
                                            onChange={(e) => updateSubjectOfInsurance(index, "coinsurance", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                        >
                                            <option value="" disabled hidden>Select Coinsurance</option>
                                            <option value="80%">80%</option>
                                            <option value="90%">90%</option>
                                            <option value="100%">100%</option>
                                        </select>
                                    </GridRow>

                                    <GridRow label="Valuation">
                                        <select
                                            value={item.valuation || formData.propertyValuation || ""}
                                            onChange={(e) => updateSubjectOfInsurance(index, "valuation", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                        >
                                            <option value="" disabled hidden>Select Valuation</option>
                                            <option value="Replacement Cost (RC)">Replacement Cost (RC)</option>
                                            <option value="Actual Cash Value (ACV)">Actual Cash Value (ACV)</option>
                                        </select>
                                    </GridRow>

                                    <GridRow label="Causes of Loss">
                                        <select
                                            value={item.causesOfLoss || formData.propertyCausesOfLoss || ""}
                                            onChange={(e) => updateSubjectOfInsurance(index, "causesOfLoss", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                        >
                                            <option value="" disabled hidden>Select Causes of Loss</option>
                                            <option value="Basic">Basic</option>
                                            <option value="Broad">Broad</option>
                                            <option value="Special (All Risk)">Special (All Risk)</option>
                                        </select>
                                    </GridRow>

                                    <GridRow label="Deductible ($)">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="text-gray-500 text-sm">$</span>
                                            <input type="text" value={item.deductible || formData.propertyDeductible ? Number(item.deductible || formData.propertyDeductible).toLocaleString('en-US') : ""} onChange={(e) => updateSubjectOfInsurance(index, "deductible", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                                        </div>
                                    </GridRow>

                                    <GridRow label="Deductible Type">
                                        <select
                                            value={item.deductibleType || formData.propertyDeductibleType || ""}
                                            onChange={(e) => updateSubjectOfInsurance(index, "deductibleType", e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                        >
                                            <option value="" disabled hidden>Select Deductible Type</option>
                                            <option value="Per Occurrence">Per Occurrence</option>
                                            <option value="Per Claim">Per Claim</option>
                                            <option value="All Other Perils (AOP)">All Other Perils (AOP)</option>
                                        </select>
                                    </GridRow>
                                </div>
                            ))}

                            <GridRow label="">
                                <button
                                    type="button"
                                    onClick={addSubjectOfInsurance}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#9A8B7A] hover:bg-[#8A7B6A] rounded transition-colors w-fit shadow-sm"
                                >
                                    <Plus size={16} />
                                    Add Subject
                                </button>
                            </GridRow>
                        </div>

                    </>
                ))}
                {renderSection("Safety & Security", (
                    <>
                        <GridRow label="Sprinklers">
                            <div className="pt-2">
                                <YesNoRadio value={formData.hasSprinklers} onChange={(v) => handleInputChange("hasSprinklers", v)} />
                            </div>
                        </GridRow>
                        {formData.hasSprinklers === true && (
                            <GridRow label="Percentage Sprinklered (%)">
                                <div className="flex items-center justify-end gap-2">
                                    <input
                                        type="text"
                                        value={formData.percentageSprinklered}
                                        onChange={(e) => handleInputChange("percentageSprinklered", e.target.value.replace(/\D/g, ''))}
                                        className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]"
                                    />
                                    <span className="text-gray-500 text-sm">%</span>
                                </div>
                            </GridRow>
                        )}

                        <GridRow label="Burglar Alarm">
                            <div className="pt-2">
                                <YesNoRadio value={formData.hasBurglarAlarm} onChange={(v) => handleInputChange("hasBurglarAlarm", v)} />
                            </div>
                        </GridRow>
                        {formData.hasBurglarAlarm === true && (
                            <div className="space-y-4 pt-4">
                                <GridRow label="Select Alarm">
                                    <select
                                        value={formData.burglarAlarmType}
                                        onChange={(e) => handleInputChange("burglarAlarmType", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                    >
                                        <option value="" disabled hidden>Select Alarm Type</option>
                                        <option value="Local Alarm (Audible Only)">Local Alarm (Audible Only)</option>
                                        <option value="Central Station">Central Station</option>
                                    </select>
                                </GridRow>
                                <GridRow label="Burglar Alarm Installed & Serviced By">
                                    <input
                                        type="text"
                                        value={formData.burglarAlarmInstalledBy}
                                        onChange={(e) => handleInputChange("burglarAlarmInstalledBy", e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]"
                                    />
                                </GridRow>
                            </div>
                        )}

                        <GridRow label="Smoke Alarms">
                            <div className="flex gap-4 pt-2 text-sm text-gray-700">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.smokeAlarms === 'Hardwire'} onChange={() => handleInputChange('smokeAlarms', 'Hardwire')} className="text-[#9A8B7A]" /> Hardwire</label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.smokeAlarms === 'Battery'} onChange={() => handleInputChange('smokeAlarms', 'Battery')} className="text-[#9A8B7A]" /> Battery</label>
                            </div>
                        </GridRow>
                        {formData.smokeAlarms === 'Hardwire' && (
                            <LongGridRow label="Are the alarms tied to a central station?">
                                <div className="pt-2"><YesNoRadio value={formData.hardwiredCentralStation} onChange={(v) => handleInputChange("hardwiredCentralStation", v)} /></div>
                            </LongGridRow>
                        )}
                        {formData.smokeAlarms === 'Battery' && (
                            <LongGridRow label="Is there a written procedure for routine inspection and replacement?">
                                <div className="pt-2"><YesNoRadio value={formData.batteryRoutineInspection} onChange={(v) => handleInputChange("batteryRoutineInspection", v)} /></div>
                            </LongGridRow>
                        )}
                    </>
                ))}
                {renderSection("Operations & Procedures", (
                    <>
                        {[
                            { label: 'Is the complex in compliance with all applicable state and local statutes governing safety devices?', field: 'complianceWithSafetyLaws' },
                            { label: 'Are all units re-keyed prior to leasing to new tenants?', field: 'unitsRekeyed' },
                            { label: 'Are individual unit doors secured by double locks and peep holes?', field: 'doorDoubleLocksPeepHoles' },
                            { label: 'Does the complex have limited access perimeter fencing?', field: 'perimeterFencing' },
                            { label: 'Do you contract with a security guard service for onsite security?', field: 'securityGuardOnsite' },
                        ].map((q, idx) => (
                            <div key={idx}>
                                <LongGridRow label={q.label}>
                                    <div className="pt-2"><YesNoRadio value={formData[q.field as keyof typeof formData] as boolean | null} onChange={(v) => handleInputChange(q.field as keyof typeof formData, v)} /></div>
                                </LongGridRow>
                            </div>
                        ))}

                        <LongGridRow label="Do you have written procedures for notifying tenants of any known or suspected criminal activity in the complex or in the vicinity of the complex with record retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresNotifyingTenantsCriminal} onChange={(v) => handleInputChange("proceduresNotifyingTenantsCriminal", v)} /></div>
                        </LongGridRow>

                        <LongGridRow label="Do you have a written procedure for responding to tenant complaints concerning safety-related issues with records retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresTenantSafetyComplaints} onChange={(v) => handleInputChange("proceduresTenantSafetyComplaints", v)} /></div>
                        </LongGridRow>

                        <LongGridRow label="Do you have a full time maintenance staff?">
                            <div className="pt-2"><YesNoRadio value={formData.fullTimeMaintenanceStaff} onChange={(v) => handleInputChange("fullTimeMaintenanceStaff", v)} /></div>
                        </LongGridRow>
                        {formData.fullTimeMaintenanceStaff === true && (
                            <LongGridRow label="Do you have written procedures for inspecting and maintaining building systems and for maintaining written records of such work?">
                                <div className="pt-2"><YesNoRadio value={formData.proceduresInspectingSystems} onChange={(v) => handleInputChange("proceduresInspectingSystems", v)} /></div>
                            </LongGridRow>
                        )}
                    </>
                ))}
                {renderSection("Contractors & Additional Risks", (
                    <>
                        {/* 20 */}
                        <LongGridRow label="Do you hire contractors to perform building and/or site maintenance such as systems inspection and repair, snow and ice removal, landscaping, etc.?">
                            <div className="pt-2"><YesNoRadio value={formData.hireContractorsMaintenance} onChange={(v) => handleInputChange("hireContractorsMaintenance", v)} /></div>
                        </LongGridRow>
                        {formData.hireContractorsMaintenance === true && (
                            <>
                                <GridRow label="Please provide details">
                                    <input type="text" value={formData.hireContractorsMaintenanceDetails} onChange={(e) => handleInputChange("hireContractorsMaintenanceDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </GridRow>
                                <LongGridRow label="Are contractors required to maintain CGL insurance with a minimum of $1,000,000 limits and to include you as an Additional Insured?">
                                    <div className="pt-2"><YesNoRadio value={formData.contractorsRequiredCGL} onChange={(v) => handleInputChange("contractorsRequiredCGL", v)} /></div>
                                </LongGridRow>
                                {formData.contractorsRequiredCGL === false && (
                                    <GridRow label="Please explain">
                                        <input type="text" value={formData.contractorsRequiredCGLExplanation} onChange={(e) => handleInputChange("contractorsRequiredCGLExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>
                                )}
                            </>
                        )}
                        {/* 21 */}
                        <LongGridRow label="Do you have written procedures for responding to tenant complaints concerning building, property or systems-related issues with records retained for two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresTenantComplaintsBuilding} onChange={(v) => handleInputChange("proceduresTenantComplaintsBuilding", v)} /></div>
                        </LongGridRow>

                        <GridRow label="Swimming Pools">
                            <div className="pt-2">
                                <YesNoRadio value={formData.hasPools} onChange={(v) => handleInputChange("hasPools", v)} />
                            </div>
                        </GridRow>

                        {formData.hasPools === true && (
                            <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-200 mt-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <GridRow label="Number"><input type="text" value={formData.poolNumber} onChange={(e) => handleInputChange("poolNumber", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Height of Diving Boards"><input type="text" value={formData.heightOfDivingBoards} onChange={(e) => handleInputChange("heightOfDivingBoards", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Length/Height of Slides"><input type="text" value={formData.lengthHeightOfSlides} onChange={(e) => handleInputChange("lengthHeightOfSlides", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Fence Height"><input type="text" value={formData.fenceHeight} onChange={(e) => handleInputChange("fenceHeight", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Pool Fenced"><div className="pt-2"><YesNoRadio value={formData.poolFenced} onChange={(v) => handleInputChange("poolFenced", v)} /></div></GridRow>
                                <GridRow label="Gates Self-Latching"><div className="pt-2"><YesNoRadio value={formData.gatesSelfLatching} onChange={(v) => handleInputChange("gatesSelfLatching", v)} /></div></GridRow>
                                <GridRow label="Lifeguard on Duty"><div className="pt-2"><YesNoRadio value={formData.lifeguardOnDuty} onChange={(v) => handleInputChange("lifeguardOnDuty", v)} /></div></GridRow>
                                <GridRow label="Depth Markers Visible from Pool Deck"><div className="pt-2"><YesNoRadio value={formData.depthMarkersVisible} onChange={(v) => handleInputChange("depthMarkersVisible", v)} /></div></GridRow>
                                <GridRow label="Frequency of Pool Water Inspection and Maintenance"><input type="text" value={formData.poolInspectionFrequency} onChange={(e) => handleInputChange("poolInspectionFrequency", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Pool Hours"><input type="text" value={formData.poolHours} onChange={(e) => handleInputChange("poolHours", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                            </div>
                        )}

                        <LongGridRow label="Is a nursery or day care facility located in the building or complex?">
                            <div className="pt-2"><YesNoRadio value={formData.nurseryDayCareFacility} onChange={(v) => handleInputChange("nurseryDayCareFacility", v)} /></div>
                        </LongGridRow>

                        <LongGridRow label="Does your lease agreement prohibit your tenants from keeping dogs on or around the property?">
                            <div className="pt-2"><YesNoRadio value={formData.leaseProhibitsTenantsDogs} onChange={(v) => handleInputChange("leaseProhibitsTenantsDogs", v)} /></div>
                        </LongGridRow>

                        <LongGridRow label="Please describe other buildings, facilities or unusual hazards on the property such as unfenced water, fitness facilities, sports fields/courts or clubhouse used for events sponsored by you or rented to others">
                            <textarea value={formData.describeOtherBuildingsHazards} onChange={(e) => handleInputChange("describeOtherBuildingsHazards", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm h-16 resize-none" />
                        </LongGridRow>

                        <LongGridRow label="Do you own or control parking facilities?">
                            <div className="pt-2"><YesNoRadio value={formData.ownControlParkingFacilities} onChange={(v) => handleInputChange("ownControlParkingFacilities", v)} /></div>
                        </LongGridRow>
                        {formData.ownControlParkingFacilities === true && (
                            <>
                                <LongGridRow label="Is access controlled?">
                                    <div className="pt-2"><YesNoRadio value={formData.parkingAccessControlled} onChange={(v) => handleInputChange("parkingAccessControlled", v)} /></div>
                                </LongGridRow>
                                <GridRow label="Describe">
                                    <input type="text" value={formData.parkingDescription} onChange={(e) => handleInputChange("parkingDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </GridRow>
                            </>
                        )}

                    </>
                ))}
                {renderSection("Inspections & Risk Management", (
                    <>
                        <LongGridRow label="Do you have written procedures for regular inspections of your premises to identify potential liability hazards and to assure all necessary corrections and repairs are made and are records of such inspections retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresRegularInspectionsHazards} onChange={(v) => handleInputChange("proceduresRegularInspectionsHazards", v)} /></div>
                        </LongGridRow>
                    </>
                ))}
                {renderSection("Financial & Background", (
                    <>
                        <LongGridRow label="Bankruptcy – Within the last 5 years, were there any pending or planned bankruptcies, or judgements for unpaid taxes against you, or your majority partner?">
                            <div className="pt-2"><YesNoRadio value={formData.bankruptcyPending} onChange={(v) => handleInputChange("bankruptcyPending", v)} /></div>
                        </LongGridRow>
                    </>
                ))}

                {/* Payment Options */}
                <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
                    <div className="bg-[#7A6F64] text-white px-4 md:px-6 py-3.5">
                        <h2 className="text-base md:text-lg font-semibold">Payment Options</h2>
                    </div>
                    <div className="px-4 md:px-8 pt-6 pb-7">
                        <div className="space-y-6 mt-1">
                            <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_320px] gap-4 md:gap-x-6 items-start">
                                <label className="text-sm font-medium text-gray-900 md:pt-2 leading-snug">Payment Options</label>
                                <div className="hidden md:block"></div>
                                <div>
                                    <select
                                        value={formData.paymentOption}
                                        onChange={(e) => handleInputChange('paymentOption', e.target.value)}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] text-sm"
                                    >
                                        <option value="" disabled hidden>Select payment option</option>
                                        <option value="Full Pay">Full Pay</option>
                                        <option value="Premium Financial Partners Co.">Premium Financial Partners Co.</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ================= ADD GENERAL LIABILITY ================= */}
                <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200 mt-6">
                    <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                        <h2 className="text-lg font-semibold">Add General Liability coverage</h2>
                    </div>

                    <div className="px-8 pt-6 pb-7 space-y-7">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                            <h3 className="text-[18px] font-semibold tracking-tight">
                                Add General Liability
                            </h3>
                            <p className="text-sm text-gray-600">
                                Covers Bodily Injury, Property Damage, and Personal Injury
                            </p>
                        </div>

                        <YesNoRadio
                            value={formData.addGeneralLiability}
                            onChange={(val) => handleInputChange("addGeneralLiability", val)}
                        />
                    </div>
                </div>

                {/* ================= GENERAL LIABILITY QUESTIONS ================= */}
                {formData.addGeneralLiability && (
                    <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                            <h2 className="text-lg font-semibold">General Liability Questions</h2>
                        </div>

                        <div className="px-8 pt-6 pb-7 space-y-6">
                            <GridRow label="Coverage Limits">
                                <select
                                    value={formData.glCoverageLimits}
                                    onChange={(e) => handleInputChange("glCoverageLimits", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                >
                                    <option value="1M / 1M / 1M">1M / 1M / 1M</option>
                                    <option value="1M / 2M / 1M">1M / 2M / 1M</option>
                                    <option value="1M / 2M / 2M">1M / 2M / 2M</option>
                                </select>
                            </GridRow>

                            <GridRow label="Fire Legal Limit">
                                <select
                                    value={formData.glFireLegalLimit}
                                    onChange={(e) => handleInputChange("glFireLegalLimit", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                >
                                    <option value="$50,000">$50,000</option>
                                    <option value="$100,000">$100,000</option>
                                    <option value="$300,000">$300,000</option>
                                    <option value="$500,000">$500,000</option>
                                    <option value="$1,000,000">$1,000,000</option>
                                </select>
                            </GridRow>

                            <GridRow label="Medical Expense Limit">
                                <select
                                    value={formData.glMedicalExpenseLimit}
                                    onChange={(e) => handleInputChange("glMedicalExpenseLimit", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                >
                                    <option value="Not Applicable">Not Applicable</option>
                                    <option value="$1,000">$1,000</option>
                                    <option value="$5,000">$5,000</option>
                                    <option value="$10,000">$10,000</option>
                                </select>
                            </GridRow>

                            <GridRow label="Deductible">
                                <select
                                    value={formData.glDeductible}
                                    onChange={(e) => handleInputChange("glDeductible", e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm"
                                >
                                    <option value="$1,000">$1,000</option>
                                    <option value="$2,500">$2,500</option>
                                    <option value="$5,000">$5,000</option>
                                    <option value="$10,000">$10,000</option>
                                </select>
                            </GridRow>
                        </div>
                    </div>
                )}

                {/* Continue Actions */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white font-medium rounded shadow-sm transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? "Submitting..." : (isViewMode ? "View Mode" : (isEditMode ? "Update Application" : "Submit Application"))}
                    </button>
                </div>
            </fieldset >
        </div>
    );

    if (status === "loading" || isVerifyingLink) {
        return (
            <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#9A8B7A] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading...</p>
                </div>
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
        <div className="min-h-screen bg-white md:bg-[#fafaf9] p-4 md:p-8 font-sans text-gray-800 overflow-x-hidden">
            <button
                type="button"
                onClick={() => {
                    if (isEditMode || isViewMode) {
                        window.close();
                    } else {
                        router.back();
                    }
                }}
                className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors mb-6 font-medium text-sm w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> {isEditMode || isViewMode ? "Close" : "Back"}
            </button>

            {renderForm()}
        </div>
    );
}

export default function ApartmentBuildingsSubmission() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#9A8B7A] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium">Loading Application...</p>
                </div>
            </div>
        }>
            <ApartmentBuildingsContent />
        </Suspense>
    );
}