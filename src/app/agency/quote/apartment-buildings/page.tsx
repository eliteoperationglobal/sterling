"use client";

export const dynamic = 'force-dynamic';

import { useSession } from "next-auth/react";
import { useState, useEffect, Suspense } from "react";
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
    CircleDot
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
    <div className="grid grid-cols-[300px_1fr_320px] gap-x-6 items-start">
        <label className="text-sm font-medium text-gray-900 pt-2 leading-snug">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div></div>
        <div>{children}</div>
    </div>
);

const LongGridRow = ({ label, children, required = false }: any) => (
    <div className="grid grid-cols-[1fr_320px] gap-x-6 items-start">
        <label className="text-sm font-medium text-gray-900 pt-2 leading-snug">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div>{children}</div>
    </div>
);

function ApartmentBuildingsContent() {
    const router = useRouter();
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const mode = searchParams.get("mode");
    const isViewMode = mode === "view";
    const isEditMode = mode === "edit";
    const submissionId = searchParams.get("id");
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
    const BLUE_ANGEL_AGENTS = ["Max Mintz"];
    const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
    const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];

    const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : [];

    const [currentView, setCurrentView] = useState<'overview' | 'form'>('overview');
    const [appExpanded, setAppExpanded] = useState(true);
    const [quoteExpanded, setQuoteExpanded] = useState(false);
    const [policyExpanded, setPolicyExpanded] = useState(false);
    const [formCompleted, setFormCompleted] = useState(false);
    const [formCompletedAt, setFormCompletedAt] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        // Screenshot 1 Fields
        applicantName: "",
        agentName: "",
        applicantMailingAddress: "",
        agentMailingAddress: "",
        propertyNameAndAddress: "",
        proposedEffectiveDateFrom: "",
        proposedEffectiveDateTo: "",
        bankruptcyPending: null as boolean | null,

        // 1
        interestInPropertyRadio: "" as "Owner" | "Manager" | "",
        propertyManagementFirmName: "",
        isManagementFirmInsured: null as boolean | null,

        // 2
        yearFirstOwnedOrManaged: "",

        // 3
        buildingAge: "",
        roofAge: "",
        numberOfUnits: "",
        numberOfStories: "",
        protectionClass: "",
        constructionType: "",
        percentageOccupied: "",
        percentageStudents: "",
        percentageSubsidized: "",
        percentageElderly: "",
        percentageSprinklered: "",

        // 4
        heatingType: "",
        heatingLastInspection: "",
        heatingRecordsOnFile: null as boolean | null,

        airConditioningType: "",
        airConditioningLastInspection: "",
        airConditioningRecordsOnFile: null as boolean | null,

        waterHeaterType: "",
        waterHeaterLastInspection: "",
        waterHeaterRecordsOnFile: null as boolean | null,

        boilerType: "",
        boilerLastInspection: "",
        boilerRecordsOnFile: null as boolean | null,

        // 5
        buildingWiring: "" as "Copper" | "Aluminum" | "",
        aluminumWiringPigtailedOrCOALR: null as boolean | null,

        // 6
        smokeAlarms: "" as "Hardwire" | "Battery" | "",
        hardwiredCentralStation: null as boolean | null,
        batteryRoutineInspection: null as boolean | null,
        smokeAlarmsDetails: "",

        // 7
        otherFireSafetySystems: "",

        // 8
        complianceWithSafetyLaws: null as boolean | null,

        // 9
        complexDemastered: null as boolean | null,
        proceduresForMasterKey: "",

        // 10
        keysCodedAndProtected: null as boolean | null,

        // 11
        unitsRekeyed: null as boolean | null,

        // 12
        doorDoubleLocksPeepHoles: null as boolean | null,

        // 13
        perimeterFencing: null as boolean | null,

        // 14
        securityLighting: null as boolean | null,

        // 15
        securityGuardOnsite: null as boolean | null,

        // 16
        policeBackgroundChecks: null as boolean | null,
        backgroundCheckCriteria: "",

        // 17
        proceduresNotifyingTenantsCriminal: null as boolean | null,
        proceduresNotifyingTenantsCriminalDescription: "",

        // 18
        proceduresTenantSafetyComplaints: null as boolean | null,
        proceduresTenantSafetyComplaintsDescription: "",

        // 19
        fullTimeMaintenanceStaff: null as boolean | null,
        proceduresInspectingSystems: null as boolean | null,

        // 20
        hireContractorsMaintenance: null as boolean | null,
        hireContractorsMaintenanceDetails: "",
        contractorsRequiredCGL: null as boolean | null,
        contractorsRequiredCGLExplanation: "",

        // 21
        proceduresTenantComplaintsBuilding: null as boolean | null,
        proceduresTenantComplaintsBuildingDescription: "",

        // 22
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
        nurseryDayCareFacility: null as boolean | null,

        // 24
        proceduresProhibitingEmployeesDogs: null as boolean | null,
        leaseProhibitsTenantsDogs: null as boolean | null,
        dogWeightLimit: "",

        // 25
        provideMedicalFoodTransport: null as boolean | null,

        // 26
        describeOtherBuildingsHazards: "",

        // 27
        ownControlParkingFacilities: null as boolean | null,
        parkingAccessControlled: null as boolean | null,
        parkingDescription: "",

        // 28
        proceduresRegularInspectionsHazards: null as boolean | null,
        proceduresRegularInspectionsHazardsDescription: "",

        // 29
        insuranceAgentCompletedInspection: null as boolean | null,
    });

    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    useEffect(() => {
        const fetchSubmissionData = async () => {
            if (!submissionId) return;
            try {
                const res = await fetch(`/api/agency/submissions/${submissionId}`);
                const result = await res.json();
                if (!res.ok) throw new Error(result.error);

                const payload = result.submission.payload;
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

        try {
            setIsSubmitting(true);
            let response;
            if (isEditMode && submissionId) {
                response = await fetch(`/api/agency/submissions/${submissionId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ payload: formData }),
                });
            } else {
                response = await fetch("/api/agency/applications/submit", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        programId: "apartment-buildings",
                        programName: "Apartment Building",
                        formData,
                    }),
                });
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit");

            toast.success(isEditMode ? "Application updated successfully!" : "Application submitted successfully!");

            setTimeout(() => {
                if (isEditMode && submissionId) {
                    window.location.href = `/agency/submissions/${submissionId}?updated=true`;
                } else {
                    window.location.href = "/agency/dashboard?submitted=true";
                }
            }, 1000);
        } catch (error: any) {
            console.error("Submit error:", error);
            toast.error(error.message || "Something went wrong");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderOverview = () => (
        <div className="max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
            <h1 className="text-[28px] font-medium text-center mb-12 text-gray-900 tracking-tight">Submission</h1>
            <div className="relative pl-12">
                <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-gray-100"></div>

                <div className="space-y-6">
                    <div className="relative">
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full border-2 border-gray-500 bg-white z-10 ring-4 ring-[#fafaf9]"></div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setAppExpanded(!appExpanded)}>
                                <div className="flex items-center gap-3 text-gray-700">
                                    <FileText className="w-5 h-5 text-[#9A8B7A]" />
                                    <span className="font-medium text-[16px]">Application</span>
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
                                            <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center bg-[#e5e7eb] px-5 py-2.5 font-[600] text-[11px] text-gray-600 uppercase tracking-widest">
                                                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 fill-current" /> TYPE</div>
                                                <div className="flex items-center gap-2"><FileIcon className="w-3.5 h-3.5 fill-current" /> APP ID</div>
                                                <div className="flex items-center gap-2"><CircleDot className="w-3.5 h-3.5 fill-current" /> STATUS</div>
                                                <div></div>
                                            </div>

                                            <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center px-5 py-4 bg-white hover:bg-gray-50 transition-colors">
                                                <div className="flex items-center gap-3 text-gray-800 font-medium text-[14px]">
                                                    <div className="p-1.5 bg-[#f5f1eb] text-[#9A8B7A] rounded-md">
                                                        <Home className="w-[18px] h-[18px]" />
                                                    </div>
                                                    1-8 Unit Dwelling
                                                </div>
                                                <div className="text-gray-500 font-medium text-[13px]">
                                                    {appId || 'To be assigned'}
                                                </div>
                                                <div>
                                                    <span className={`px-2.5 py-1.5 text-[12px] rounded font-semibold whitespace-nowrap ${formCompleted ? 'bg-[#f1f5f9] text-[#64748b]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                                                        {formCompleted ? 'In Progress' : 'Not Started'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <button
                                                        onClick={handleSubmit}
                                                        className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${formCompleted ? 'bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white shadow-sm' : 'border border-gray-300 text-gray-400 cursor-not-allowed bg-white'}`}
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
            <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <div className="px-8 pt-6 pb-7">
                <div className="space-y-6 mt-1">
                    {children}
                </div>
            </div>
        </div>
    );

    const renderForm = () => (
        <div className="max-w-[950px] mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <fieldset disabled={isViewMode} className={`space-y-10 ${isViewMode ? 'opacity-90 pointer-events-none' : ''}`}>

                {renderSection("APARTMENT APPLICATION", (
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
                            <textarea value={formData.applicantMailingAddress} onChange={(e) => handleInputChange("applicantMailingAddress", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm h-16 resize-none" />
                        </GridRow>
                        <GridRow label="Property Name and Address">
                            <textarea value={formData.propertyNameAndAddress} onChange={(e) => handleInputChange("propertyNameAndAddress", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded focus:ring-[#9A8B7A] text-sm h-16 resize-none" />
                        </GridRow>
                        <GridRow label="Proposed Effective Date From">
                            <input type="date" value={formData.proposedEffectiveDateFrom} onChange={(e) => handleInputChange("proposedEffectiveDateFrom", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                            <p className="text-xs text-gray-500 mt-1">12:01 A.M. Standard Time</p>
                        </GridRow>
                        <GridRow label="Proposed Effective Date To">
                            <input type="date" value={formData.proposedEffectiveDateTo} onChange={(e) => handleInputChange("proposedEffectiveDateTo", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                        </GridRow>
                        <LongGridRow label="Bankruptcy – Within the last 5 years, were there any pending or planned bankruptcies, or judgements for unpaid taxes against you, or your majority partner?">
                            <div className="pt-2"><YesNoRadio value={formData.bankruptcyPending} onChange={(v) => handleInputChange("bankruptcyPending", v)} /></div>
                        </LongGridRow>
                    </>
                ))}

                {renderSection("Properties & Systems", (
                    <>
                        <GridRow label="Interest in Property">
                            <div className="flex gap-4 pt-2 text-sm text-gray-700">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.interestInPropertyRadio === 'Owner'} onChange={() => handleInputChange('interestInPropertyRadio', 'Owner')} className="text-[#9A8B7A] focus:ring-[#9A8B7A]" /> Owner</label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.interestInPropertyRadio === 'Manager'} onChange={() => handleInputChange('interestInPropertyRadio', 'Manager')} className="text-[#9A8B7A] focus:ring-[#9A8B7A]" /> Manager</label>
                            </div>
                        </GridRow>
                        {formData.interestInPropertyRadio === 'Owner' && (
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

                {renderSection("Property Details", (
                    <>
                        <GridRow label="Age of Building(s)"><input type="text" value={formData.buildingAge} onChange={(e) => handleInputChange("buildingAge", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Age of Roof"><input type="text" value={formData.roofAge} onChange={(e) => handleInputChange("roofAge", e.target.value.replace(/\D/g, '').slice(0, 4))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Number of Units"><input type="text" value={formData.numberOfUnits} onChange={(e) => handleInputChange("numberOfUnits", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Number of Stories"><input type="text" value={formData.numberOfStories} onChange={(e) => handleInputChange("numberOfStories", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Construction"><input type="text" value={formData.constructionType} onChange={(e) => handleInputChange("constructionType", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Protection Class"><input type="text" value={formData.protectionClass} onChange={(e) => handleInputChange("protectionClass", e.target.value.replace(/\D/g, ''))} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                        <GridRow label="Percentage Occupied (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageOccupied} onChange={(e) => handleInputChange("percentageOccupied", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>
                        <GridRow label="Percentage Students (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageStudents} onChange={(e) => handleInputChange("percentageStudents", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>
                        <GridRow label="Percentage Subsidized (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageSubsidized} onChange={(e) => handleInputChange("percentageSubsidized", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>
                        <GridRow label="Percentage Elderly (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageElderly} onChange={(e) => handleInputChange("percentageElderly", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>
                        <GridRow label="Percentage Sprinklered (%)"><div className="flex items-center justify-end gap-2"><input type="text" value={formData.percentageSprinklered} onChange={(e) => handleInputChange("percentageSprinklered", e.target.value.replace(/\D/g, ''))} className="w-[120px] px-4 py-2 border border-gray-300 rounded text-sm" /><span className="text-gray-500 text-sm">%</span></div></GridRow>

                        <div className="border-t border-gray-200 mt-6 pt-6"></div>
                        <h3 className="font-semibold text-gray-900 -mt-2 mb-4">Types of Systems</h3>

                        {["Heating", "Air Conditioning", "Water Heater", "Boiler"].map((sys) => {
                            const sysKey = sys.replace(/\s+/g, '').replace(/^./, c => c.toLowerCase());
                            return (
                                <div key={sys} className="space-y-4 pb-6 border-b border-gray-100 last:border-0">
                                    <GridRow label={`${sys} Type`}>
                                        <input type="text" value={formData[`${sysKey}Type` as keyof typeof formData] as string} onChange={(e) => handleInputChange(`${sysKey}Type` as keyof typeof formData, e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>
                                    <GridRow label={`${sys} Date of Last Inspection`}>
                                        <input type="date" value={formData[`${sysKey}LastInspection` as keyof typeof formData] as string} onChange={(e) => handleInputChange(`${sysKey}LastInspection` as keyof typeof formData, e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>
                                    <GridRow label={`${sys} Records on File`}>
                                        <div className="pt-2"><YesNoRadio value={formData[`${sysKey}RecordsOnFile` as keyof typeof formData] as boolean | null} onChange={(v) => handleInputChange(`${sysKey}RecordsOnFile` as keyof typeof formData, v)} /></div>
                                    </GridRow>
                                </div>
                            );
                        })}

                        <div className="border-t border-gray-200 mt-6 pt-6"></div>
                        <GridRow label="Building Wiring">
                            <div className="flex gap-4 pt-2 text-sm text-gray-700">
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.buildingWiring === 'Copper'} onChange={() => handleInputChange('buildingWiring', 'Copper')} className="text-[#9A8B7A]" /> Copper</label>
                                <label className="flex items-center gap-2"><input type="radio" checked={formData.buildingWiring === 'Aluminum'} onChange={() => handleInputChange('buildingWiring', 'Aluminum')} className="text-[#9A8B7A]" /> Aluminum</label>
                            </div>
                        </GridRow>
                        {formData.buildingWiring === 'Aluminum' && (
                            <GridRow label="Is wiring pigtailed or COALR?">
                                <div className="pt-2"><YesNoRadio value={formData.aluminumWiringPigtailedOrCOALR} onChange={(v) => handleInputChange("aluminumWiringPigtailedOrCOALR", v)} /></div>
                            </GridRow>
                        )}
                    </>
                ))}

                {renderSection("Safety, Security & Operations", (
                    <>
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
                        <GridRow label="Details">
                            <input type="text" value={formData.smokeAlarmsDetails} onChange={(e) => handleInputChange("smokeAlarmsDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                        </GridRow>

                        <div className="border-t border-gray-200 mt-6 pt-6"></div>
                        <GridRow label="Other Fire Safety Systems (if any)">
                            <input type="text" value={formData.otherFireSafetySystems} onChange={(e) => handleInputChange("otherFireSafetySystems", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                        </GridRow>

                        {[
                            { label: 'Is the complex in compliance with all applicable state and local statutes governing safety devices?', field: 'complianceWithSafetyLaws' },
                            { label: 'Is the complex demastered?', field: 'complexDemastered', extraLabel: 'Who has access to the key system and what are the procedures for protecting the master key?', extraField: 'proceduresForMasterKey', showExtraWhen: false },
                            { label: 'Are keys coded and adequately protected?', field: 'keysCodedAndProtected' },
                            { label: 'Are all units re-keyed prior to leasing to new tenants?', field: 'unitsRekeyed' },
                            { label: 'Are individual unit doors secured by double locks and peep holes?', field: 'doorDoubleLocksPeepHoles' },
                            { label: 'Does the complex have limited access perimeter fencing?', field: 'perimeterFencing' },
                            { label: 'Are all areas of the complex covered by security lighting?', field: 'securityLighting' },
                            { label: 'Do you contract with a security guard service for onsite security?', field: 'securityGuardOnsite' },
                            { label: 'Do you perform police background checks on all employees?', field: 'policeBackgroundChecks', extraLabel: 'What is your criteria for declining or discontinuing employment?', extraField: 'backgroundCheckCriteria', showExtraWhen: true },
                        ].map((q, idx) => (
                            <div key={idx} className="border-t border-gray-100 pt-6 mt-6">
                                <LongGridRow label={q.label}>
                                    <div className="pt-2"><YesNoRadio value={formData[q.field as keyof typeof formData] as boolean | null} onChange={(v) => handleInputChange(q.field as keyof typeof formData, v)} /></div>
                                </LongGridRow>
                                {q.extraField && formData[q.field as keyof typeof formData] === q.showExtraWhen && (
                                    <LongGridRow label={q.extraLabel}>
                                        <input type="text" value={formData[q.extraField as keyof typeof formData] as string} onChange={(e) => handleInputChange(q.extraField as keyof typeof formData, e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </LongGridRow>
                                )}
                            </div>
                        ))}

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Do you have written procedures for notifying tenants of any known or suspected criminal activity in the complex or in the vicinity of the complex with record retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresNotifyingTenantsCriminal} onChange={(v) => handleInputChange("proceduresNotifyingTenantsCriminal", v)} /></div>
                        </LongGridRow>
                        <GridRow label="Description">
                            <input type="text" value={formData.proceduresNotifyingTenantsCriminalDescription} onChange={(e) => handleInputChange("proceduresNotifyingTenantsCriminalDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                        </GridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Do you have a written procedure for responding to tenant complaints concerning safety-related issues with records retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresTenantSafetyComplaints} onChange={(v) => handleInputChange("proceduresTenantSafetyComplaints", v)} /></div>
                        </LongGridRow>
                        <GridRow label="Description">
                            <input type="text" value={formData.proceduresTenantSafetyComplaintsDescription} onChange={(e) => handleInputChange("proceduresTenantSafetyComplaintsDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                        </GridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
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

                {renderSection("Contractors, Pools & Additions", (
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

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        {/* 21 */}
                        <LongGridRow label="Do you have written procedures for responding to tenant complaints concerning building, property or systems-related issues with records retained for two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresTenantComplaintsBuilding} onChange={(v) => handleInputChange("proceduresTenantComplaintsBuilding", v)} /></div>
                        </LongGridRow>
                        <GridRow label="Description">
                            <input type="text" value={formData.proceduresTenantComplaintsBuildingDescription} onChange={(e) => handleInputChange("proceduresTenantComplaintsBuildingDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                        </GridRow>

                        <div className="border-t border-gray-200 mt-6 pt-6"></div>
                        <h3 className="font-semibold text-gray-900 -mt-2 mb-4">Swimming Pools</h3>
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

                        <div className="border-t border-gray-200 mt-6 pt-6"></div>
                        <LongGridRow label="Is a nursery or day care facility located in the building or complex?">
                            <div className="pt-2"><YesNoRadio value={formData.nurseryDayCareFacility} onChange={(v) => handleInputChange("nurseryDayCareFacility", v)} /></div>
                        </LongGridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Do you have written procedures prohibiting your employees from keeping dogs on or around the property?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresProhibitingEmployeesDogs} onChange={(v) => handleInputChange("proceduresProhibitingEmployeesDogs", v)} /></div>
                        </LongGridRow>
                        <LongGridRow label="Does your lease agreement prohibit your tenants from keeping dogs on or around the property?">
                            <div className="pt-2"><YesNoRadio value={formData.leaseProhibitsTenantsDogs} onChange={(v) => handleInputChange("leaseProhibitsTenantsDogs", v)} /></div>
                        </LongGridRow>
                        {(formData.leaseProhibitsTenantsDogs === false || formData.proceduresProhibitingEmployeesDogs === false) && (
                            <GridRow label="Please indicate the maximum weight limit allowed">
                                <input type="text" value={formData.dogWeightLimit} onChange={(e) => handleInputChange("dogWeightLimit", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </GridRow>
                        )}

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Do you directly or indirectly provide medical, food or transportation services to tenants?">
                            <div className="pt-2"><YesNoRadio value={formData.provideMedicalFoodTransport} onChange={(v) => handleInputChange("provideMedicalFoodTransport", v)} /></div>
                        </LongGridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Please describe other buildings, facilities or unusual hazards on the property such as unfenced water, fitness facilities, sports fields/courts or clubhouse used for events sponsored by you or rented to others">
                            <textarea value={formData.describeOtherBuildingsHazards} onChange={(e) => handleInputChange("describeOtherBuildingsHazards", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm h-16 resize-none" />
                        </LongGridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
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

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Do you have written procedures for regular inspections of your premises to identify potential liability hazards and to assure all necessary corrections and repairs are made and are records of such inspections retained for at least two years?">
                            <div className="pt-2"><YesNoRadio value={formData.proceduresRegularInspectionsHazards} onChange={(v) => handleInputChange("proceduresRegularInspectionsHazards", v)} /></div>
                        </LongGridRow>
                        <GridRow label="Please describe">
                            <textarea value={formData.proceduresRegularInspectionsHazardsDescription} onChange={(e) => handleInputChange("proceduresRegularInspectionsHazardsDescription", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm h-16 resize-none" />
                        </GridRow>

                        <div className="border-t border-gray-100 pt-6 mt-6"></div>
                        <LongGridRow label="Has your insurance agent completed a physical inspection of the property within the last year?">
                            <div className="pt-2"><YesNoRadio value={formData.insuranceAgentCompletedInspection} onChange={(v) => handleInputChange("insuranceAgentCompletedInspection", v)} /></div>
                        </LongGridRow>
                    </>
                ))}

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
            </fieldset>
        </div>
    );

    return (
        <div className="min-h-screen bg-white md:bg-[#fafaf9] p-4 md:p-8 font-sans text-gray-800 overflow-x-hidden">
            <button
                onClick={() => router.back()}
                className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors mb-6 font-medium text-sm w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
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
