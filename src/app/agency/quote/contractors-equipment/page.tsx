"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// import omitted
import { Check, ClipboardList, ShieldCheck, HardHat, AlertTriangle, FileText, Plus, Trash2, ArrowLeft } from 'lucide-react'

// Reuse the layout components that worked well for Apartment Buildings
const GridRow = ({ label, children, className = "" }: { label: string, children: React.ReactNode, className?: string }) => (
    <div className={`grid grid-cols-[300px_1fr_320px] gap-x-6 items-start py-3 ${className}`}>
        <label className="text-sm font-medium text-gray-900 pt-2 leading-snug">{label}</label>
        <div></div>
        <div>{children}</div>
    </div>
);

const LongGridRow = ({ label, children, className = "" }: { label: string, children: React.ReactNode, className?: string }) => (
    <div className={`grid grid-cols-[1fr_320px] gap-x-6 items-start py-3 ${className}`}>
        <label className="text-sm font-medium text-gray-900 pt-2 leading-snug">{label}</label>
        <div>{children}</div>
    </div>
);

const YesNoRadio = ({ value, onChange }: { value: boolean | null, onChange: (v: boolean) => void }) => (
    <div className="flex gap-4 text-sm text-gray-700">
        <label className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" checked={value === true} onChange={() => onChange(true)} className="w-4 h-4 text-[#9A8B7A] focus:ring-[#9A8B7A] border-gray-300" />
            <span className="group-hover:text-gray-900 transition-colors">Yes</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer group">
            <input type="radio" checked={value === false} onChange={() => onChange(false)} className="w-4 h-4 text-[#9A8B7A] focus:ring-[#9A8B7A] border-gray-300" />
            <span className="group-hover:text-gray-900 transition-colors">No</span>
        </label>
    </div>
);

const ProgressBar = ({ progress }: { progress: number }) => (
    <div className="fixed bottom-10 right-10 z-50 flex items-center justify-center">
        <div className="relative h-24 w-24">
            <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle className="text-gray-200 stroke-current" strokeWidth="8" cx="50" cy="50" r="40" fill="transparent" />
                <circle className="text-[#9A8B7A] stroke-current transition-all duration-500 ease-out" strokeWidth="8" strokeLinecap="round" cx="50" cy="50" r="40" fill="transparent"
                    strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * progress) / 100} transform="rotate(-90 50 50)" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-700">{Math.round(progress)}%</span>
        </div>
    </div>
);

export default function ContractorsEquipmentFormPage() {
    const router = useRouter()
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState(0);

    const initialFormState = {
        // General Info
        namedInsured: "",
        brokerageBroker: "",
        isNewVenture: null as boolean | null,
        isRenewal: null as boolean | null,
        policyNumber: "",
        currentEffectiveDate: "",
        currentExpiryDate: "",
        requestedEffectiveDate: "",
        requestedExpiryDate: "",
        website: "",
        currentCarrier: "",
        currentLimit: "",
        currentEffectiveDateCarrier: "",
        currentExpiryDateCarrier: "",
        currentDeductible: "",
        currentPremium: "",
        offeringRenewal: null as boolean | null,
        mailingStreet: "",
        mailingCity: "",
        mailingState: "",
        mailingZip: "",
        entityType: "",
        yearsInOperation: "",
        blanketLimitRequested: "",
        occurrenceLimitRequested: "",
        deductibleRequested: "",

        // Tables
        lossPayees: [{ name: "", address: "", serialNumbers: "" }],
        revenuePayroll: [
            { period: "Projected Year", revenue: "", payroll: "" },
            { period: "Last 12 Months", revenue: "", payroll: "" },
            { period: "2nd Prior Year", revenue: "", payroll: "" }
        ],
        scheduledEquipment: [{ makeModel: "", typeCapacity: "", serialVin: "", datePurchased: "", manufactureAge: "", purchasePrice: "", insuredValue: "" }],

        // Operations
        loansRentsToOthers: null as boolean | null,
        loansRentsFromOthers: null as boolean | null,
        rentalExpendituresLast12: "",
        rentalExpendituresProjected: "",
        requiredToInsureRentals: null as boolean | null,
        employeesTrained: null as boolean | null,
        employeesTrainedExplanation: "",
        hasEmployeeHandbook: null as boolean | null,
        safetyMeetingsFrequency: "",
        transportOwnVehicles: false,
        transportCommonCarrier: false,
        transportOther: false,
        transportOtherText: "",
        usedNearWater: null as boolean | null,
        usedNearWaterDetails: "",
        usedOnBridgesNotNearWater: null as boolean | null,
        usedUnderground: null as boolean | null,
        usedUndergroundDetails: "",

        // Rentals
        rentalSoleOperation: null as boolean | null,
        allEquipmentScheduledAvailable: null as boolean | null,
        equipmentNotAvailableDetails: "",
        rentalsWithOperators: null as boolean | null,
        writtenRentalContract: null as boolean | null,
        writtenRentalContractExplanation: "",
        lesseesRequiredToInsure: null as boolean | null,
        lesseesRequiredToInsureExplanation: "",
        contractsHoldHarmless: null as boolean | null,
        collectCOI: null as boolean | null,
        allowSubleasing: null as boolean | null,
        contractsStipulateSecurity: null as boolean | null,
        contractsStipulateSecurityExplanation: "",

        // Equipment Security
        securityMeasuresStorage: {
            lighting: false,
            fencing: false,
            garages: false,
            cameras: false,
            guards: false,
            other: false,
            otherText: ""
        },
        securityMeasuresJobSite: {
            lighting: false,
            fencing: false,
            guards: false,
            offSiteGaraging: false,
            other: false,
            otherText: ""
        },
        maintenanceFrequency: "",
        inspectionFrequency: "",
        equipmentTrackedGPS: null as boolean | null,
        heavyEquipLockingGasCaps: null as boolean | null,
        heavyEquipAntiTheft: null as boolean | null,
        heavyEquipAdditionalDeterrent: "",
        fireExtinguishersPresent: null as boolean | null,
        fireExtinguishersExplanation: "",
        fireExtinguishersChargingFreq: "",
        automaticFireSuppression: null as boolean | null,
        automaticFireSuppressionEquip: "",
        storedInFloodWildfireAreas: null as boolean | null,
        storedInFloodWildfireDetails: "",

        // Claims History
        unreportedIncidents: null as boolean | null,
        unreportedIncidentsExplanation: "",
        insurerCanceledNonRenewed: null as boolean | null,
        insurerCanceledExplanation: "",
        claims: [
            {
                date: "",
                coverageLines: {
                    equip: false,
                    equipRental: false,
                    autoLiab: false,
                    cgl: false,
                    pollution: false,
                    autoPhys: false,
                    uninsured: false,
                    other: false,
                    otherText: ""
                },
                circumstances: "",
                closed: null as boolean | null,
                trialSettlement: null as boolean | null,
                open: null as boolean | null,
                anticipateTrial: null as boolean | null,
                anticipateTrialWhen: "",
                proceduresChanged: null as boolean | null,
                totalLoss: null as boolean | null,
                repairedReturned: null as boolean | null,
                totalClaimed: ""
            }
        ],

        // Final
        applicantName: "",
        applicantTitle: "",
        fein: "",
        signatureDate: "",
        agentBrokerName: ""
    };

    const [formData, setFormData] = useState(initialFormState);

    const handleInputChange = (field: keyof typeof formData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Calculate progress
    useEffect(() => {
        const totalFields = Object.keys(initialFormState).length;
        const filledFields = Object.values(formData).filter(v => v !== "" && v !== null && v !== false).length;
        setProgress((filledFields / totalFields) * 100);
    }, [formData]);

    const steps = [
        { id: 1, title: 'General Info', icon: ClipboardList },
        { id: 2, title: 'Operations', icon: HardHat },
        { id: 3, title: 'Security', icon: ShieldCheck },
        { id: 4, title: 'History', icon: AlertTriangle },
        { id: 5, title: 'Overview', icon: FileText }
    ];

    const renderSection = (title: string, children: React.ReactNode) => (
        <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200 mb-8">
            <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                <h2 className="text-lg font-semibold">{title}</h2>
            </div>
            <div className="px-8 pt-6 pb-7 space-y-2">
                {children}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            <div className="py-4 px-6 md:px-8">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors font-medium text-sm w-fit"
                >
                    <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
                </button>
            </div>
            <div className="max-w-[950px] mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="space-y-10">
                    {renderSection("General Information", (
                        <>
                            <GridRow label="Named Insured">
                                <input type="text" value={formData.namedInsured} onChange={(e) => handleInputChange("namedInsured", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm focus:ring-[#9A8B7A]" />
                            </GridRow>
                            <GridRow label="Brokerage/Broker">
                                <input type="text" value={formData.brokerageBroker} onChange={(e) => handleInputChange("brokerageBroker", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </GridRow>
                            <GridRow label="New Venture?">
                                <div className="pt-2"><YesNoRadio value={formData.isNewVenture} onChange={(v) => handleInputChange("isNewVenture", v)} /></div>
                            </GridRow>
                            <GridRow label="Renewal?">
                                <div className="pt-2"><YesNoRadio value={formData.isRenewal} onChange={(v) => handleInputChange("isRenewal", v)} /></div>
                            </GridRow>
                            <GridRow label="Policy Number">
                                <input type="text" value={formData.policyNumber} onChange={(e) => handleInputChange("policyNumber", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </GridRow>
                            <GridRow label="Requested Effective Date">
                                <input type="date" value={formData.requestedEffectiveDate} onChange={(e) => handleInputChange("requestedEffectiveDate", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </GridRow>
                            <GridRow label="Requested Expiry Date">
                                <input type="date" value={formData.requestedExpiryDate} onChange={(e) => handleInputChange("requestedExpiryDate", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </GridRow>
                            <GridRow label="Website">
                                <input type="text" value={formData.website} onChange={(e) => handleInputChange("website", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" placeholder="https://..." />
                            </GridRow>

                            <div className="bg-gray-50 p-4 rounded-lg mt-6">
                                <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">CURRENT CARRIER INFORMATION</h3>
                                <GridRow label="Carrier"><input type="text" value={formData.currentCarrier} onChange={(e) => handleInputChange("currentCarrier", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <GridRow label="Limit of Insurance"><input type="text" value={formData.currentLimit} onChange={(e) => handleInputChange("currentLimit", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <GridRow label="Premium"><input type="text" value={formData.currentPremium} onChange={(e) => handleInputChange("currentPremium", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <GridRow label="Effective Date"><input type="date" value={formData.currentEffectiveDateCarrier} onChange={(e) => handleInputChange("currentEffectiveDateCarrier", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <GridRow label="Expiry Date"><input type="date" value={formData.currentExpiryDateCarrier} onChange={(e) => handleInputChange("currentExpiryDateCarrier", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <GridRow label="Deductible"><input type="text" value={formData.currentDeductible} onChange={(e) => handleInputChange("currentDeductible", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                <LongGridRow label="Offering renewal?"><YesNoRadio value={formData.offeringRenewal} onChange={(v) => handleInputChange("offeringRenewal", v)} /></LongGridRow>
                            </div>

                            <div className="border-t border-gray-200 mt-8 pt-6"></div>
                            <LongGridRow label="Entity Type">
                                <div className="grid grid-cols-3 gap-x-6 gap-y-4 pt-2">
                                    {['Corporation', 'Individual', 'Partnership', 'Municipality', 'For Profit', 'Joint Venture', 'Other'].map(type => (
                                        <label key={type} className="flex items-center gap-2 cursor-pointer group">
                                            <input type="radio" checked={formData.entityType === type} onChange={() => handleInputChange('entityType', type)} className="w-4 h-4 text-[#9A8B7A] focus:ring-[#9A8B7A] border-gray-300" />
                                            <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{type}</span>
                                        </label>
                                    ))}
                                </div>
                            </LongGridRow>

                            <LongGridRow label="How long have you been in operation under this business name?">
                                <input type="text" value={formData.yearsInOperation} onChange={(e) => handleInputChange("yearsInOperation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                            </LongGridRow>

                            <div className="grid grid-cols-3 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Blanket Limit</label>
                                    <input type="text" value={formData.blanketLimitRequested} onChange={(e) => handleInputChange("blanketLimitRequested", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Occurrence Limit</label>
                                    <input type="text" value={formData.occurrenceLimitRequested} onChange={(e) => handleInputChange("occurrenceLimitRequested", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Deductible</label>
                                    <input type="text" value={formData.deductibleRequested} onChange={(e) => handleInputChange("deductibleRequested", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </div>
                            </div>

                            {/* Loss Payees Table */}
                            <div className="mt-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase">Loss Payees</h3>
                                    <button onClick={() => {
                                        const newPayees = [...formData.lossPayees, { name: "", address: "", serialNumbers: "" }];
                                        handleInputChange('lossPayees', newPayees);
                                    }} className="flex items-center gap-2 text-xs font-bold text-[#9A8B7A] hover:text-[#8A7B6A] transition-colors">
                                        <Plus size={14} /> ADD LOSS PAYEE
                                    </button>
                                </div>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600">Name</th>
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600">Street Address</th>
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600 w-1/4">Equipment Serial Numbers</th>
                                            <th className="border border-gray-200 p-2 text-center text-xs font-bold text-gray-600 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.lossPayees.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-gray-200 p-2">
                                                    <input type="text" value={row.name} onChange={(e) => {
                                                        const newPayees = [...formData.lossPayees];
                                                        newPayees[idx].name = e.target.value;
                                                        handleInputChange('lossPayees', newPayees);
                                                    }} className="w-full px-2 py-1 text-sm outline-none focus:bg-stone-50" />
                                                </td>
                                                <td className="border border-gray-200 p-2">
                                                    <input type="text" value={row.address} onChange={(e) => {
                                                        const newPayees = [...formData.lossPayees];
                                                        newPayees[idx].address = e.target.value;
                                                        handleInputChange('lossPayees', newPayees);
                                                    }} className="w-full px-2 py-1 text-sm outline-none focus:bg-stone-50" />
                                                </td>
                                                <td className="border border-gray-200 p-2">
                                                    <input type="text" value={row.serialNumbers} onChange={(e) => {
                                                        const newPayees = [...formData.lossPayees];
                                                        newPayees[idx].serialNumbers = e.target.value;
                                                        handleInputChange('lossPayees', newPayees);
                                                    }} className="w-full px-2 py-1 text-sm outline-none focus:bg-stone-50" />
                                                </td>
                                                <td className="border border-gray-200 p-2 text-center text-red-400">
                                                    {formData.lossPayees.length > 1 && (
                                                        <button onClick={() => {
                                                            const newPayees = formData.lossPayees.filter((_, i) => i !== idx);
                                                            handleInputChange('lossPayees', newPayees);
                                                        }} className="hover:text-red-600 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Receipts and Payroll Table */}
                            <div className="mt-8">
                                <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide uppercase">Receipts and Payroll</h3>
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600">Period</th>
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600">Revenue ($)</th>
                                            <th className="border border-gray-200 p-2 text-left text-xs font-bold text-gray-600">Payroll ($)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.revenuePayroll.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="border border-gray-200 p-2 text-sm text-gray-700 font-medium bg-gray-50">{row.period}</td>
                                                <td className="border border-gray-200 p-2 text-sm text-gray-700">
                                                    <input type="text" value={row.revenue} onChange={(e) => {
                                                        const newRev = [...formData.revenuePayroll];
                                                        newRev[idx].revenue = e.target.value;
                                                        handleInputChange('revenuePayroll', newRev);
                                                    }} className="w-full px-2 py-1 outline-none focus:bg- stone-50" />
                                                </td>
                                                <td className="border border-gray-200 p-2 text-sm text-gray-700">
                                                    <input type="text" value={row.payroll} onChange={(e) => {
                                                        const newRev = [...formData.revenuePayroll];
                                                        newRev[idx].payroll = e.target.value;
                                                        handleInputChange('revenuePayroll', newRev);
                                                    }} className="w-full px-2 py-1 outline-none focus:bg-stone-50" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ))}

                    {renderSection("Operations", (
                        <>
                            <div className="space-y-6">
                                <LongGridRow label="Do you loan or rent equipment to others?">
                                    <YesNoRadio value={formData.loansRentsToOthers} onChange={(v) => handleInputChange("loansRentsToOthers", v)} />
                                </LongGridRow>
                                <LongGridRow label="Is any equipment loaned or rented from others to you?">
                                    <YesNoRadio value={formData.loansRentsFromOthers} onChange={(v) => handleInputChange("loansRentsFromOthers", v)} />
                                </LongGridRow>

                                {formData.loansRentsFromOthers === true && (
                                    <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                                        <GridRow label="Rental expenditures (last 12 months)" className="border-0"><input type="text" value={formData.rentalExpendituresLast12} onChange={(e) => handleInputChange("rentalExpendituresLast12", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                        <GridRow label="Projected rental expenditures (coming year)" className="border-0"><input type="text" value={formData.rentalExpendituresProjected} onChange={(e) => handleInputChange("rentalExpendituresProjected", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                        <LongGridRow label="Are you contractually required to insure this equipment against damage or loss?" className="border-0"><YesNoRadio value={formData.requiredToInsureRentals} onChange={(v) => handleInputChange("requiredToInsureRentals", v)} /></LongGridRow>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 pt-8 mt-8">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase">Scheduled Equipment</h3>
                                        <button onClick={() => {
                                            const newEquip = [...formData.scheduledEquipment, { makeModel: "", typeCapacity: "", serialVin: "", datePurchased: "", manufactureAge: "", purchasePrice: "", insuredValue: "" }];
                                            handleInputChange('scheduledEquipment', newEquip);
                                        }} className="flex items-center gap-2 text-xs font-bold text-[#9A8B7A] hover:text-[#8A7B6A] transition-colors">
                                            <Plus size={14} /> ADD ITEM
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 text-xs font-bold text-gray-600">
                                                    <th className="border border-gray-200 p-2 text-left">Make & Model</th>
                                                    <th className="border border-gray-200 p-2 text-left">Type & Capacity</th>
                                                    <th className="border border-gray-200 p-2 text-left">Serial/VIN</th>
                                                    <th className="border border-gray-200 p-2 text-left">Purchase Date</th>
                                                    <th className="border border-gray-200 p-2 text-left">Price ($)</th>
                                                    <th className="border border-gray-200 p-2 text-left">Value ($)</th>
                                                    <th className="border border-gray-200 p-2 w-10"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formData.scheduledEquipment.map((row, idx) => (
                                                    <tr key={idx}>
                                                        <td className="border border-gray-200 p-2"><input type="text" value={row.makeModel} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].makeModel = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2"><input type="text" value={row.typeCapacity} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].typeCapacity = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2"><input type="text" value={row.serialVin} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].serialVin = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2"><input type="date" value={row.datePurchased} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].datePurchased = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2"><input type="text" value={row.purchasePrice} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].purchasePrice = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2"><input type="text" value={row.insuredValue} onChange={(e) => { const n = [...formData.scheduledEquipment]; n[idx].insuredValue = e.target.value; handleInputChange('scheduledEquipment', n); }} className="w-full text-xs outline-none focus:bg-stone-50 py-1" /></td>
                                                        <td className="border border-gray-200 p-2 text-center">
                                                            {formData.scheduledEquipment.length > 1 && (
                                                                <button onClick={() => { const n = formData.scheduledEquipment.filter((_, i) => i !== idx); handleInputChange('scheduledEquipment', n); }} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-8 mt-8 space-y-6">
                                    <LongGridRow label="Are all employees, including any temporary or seasonal hires, trained to handle the equipment they will operate?">
                                        <YesNoRadio value={formData.employeesTrained} onChange={(v) => handleInputChange("employeesTrained", v)} />
                                    </LongGridRow>
                                    {formData.employeesTrained === false && (
                                        <GridRow label="Please attach explanation">
                                            <input type="text" value={formData.employeesTrainedExplanation} onChange={(e) => handleInputChange("employeesTrainedExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" placeholder="Details..." />
                                        </GridRow>
                                    )}

                                    <LongGridRow label="Do you have a written employee handbook or formal safety guidelines?">
                                        <YesNoRadio value={formData.hasEmployeeHandbook} onChange={(v) => handleInputChange("hasEmployeeHandbook", v)} />
                                    </LongGridRow>
                                    <GridRow label="How frequently are safety meetings held?">
                                        <input type="text" value={formData.safetyMeetingsFrequency} onChange={(e) => handleInputChange("safetyMeetingsFrequency", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>

                                    <LongGridRow label="How is equipment transported to job sites?">
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.transportOwnVehicles} onChange={(e) => handleInputChange('transportOwnVehicles', e.target.checked)} className="rounded text-[#9A8B7A]" /><span className="text-sm">Own vehicles/Driven</span></label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.transportCommonCarrier} onChange={(e) => handleInputChange('transportCommonCarrier', e.target.checked)} className="rounded text-[#9A8B7A]" /><span className="text-sm">Common Carrier</span></label>
                                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.transportOther} onChange={(e) => handleInputChange('transportOther', e.target.checked)} className="rounded text-[#9A8B7A]" /><span className="text-sm">Other</span></label>
                                            {formData.transportOther && <input type="text" value={formData.transportOtherText} onChange={(e) => handleInputChange("transportOtherText", e.target.value)} className="px-3 py-1 border border-gray-300 rounded text-sm col-span-2" placeholder="Describe..." />}
                                        </div>
                                    </LongGridRow>

                                    <LongGridRow label="Will equipment be used near water, including on bridges, dams, and levees, or on barges?">
                                        <YesNoRadio value={formData.usedNearWater} onChange={(v) => handleInputChange("usedNearWater", v)} />
                                    </LongGridRow>
                                    {formData.usedNearWater === true && (
                                        <GridRow label="If yes, please attach details">
                                            <input type="text" value={formData.usedNearWaterDetails} onChange={(e) => handleInputChange("usedNearWaterDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}

                                    <LongGridRow label="Will equipment be used on bridges or overpasses not over or near water?">
                                        <YesNoRadio value={formData.usedOnBridgesNotNearWater} onChange={(v) => handleInputChange("usedOnBridgesNotNearWater", v)} />
                                    </LongGridRow>

                                    <LongGridRow label="Will equipment be used underground, including in mining operations?">
                                        <YesNoRadio value={formData.usedUnderground} onChange={(v) => handleInputChange("usedUnderground", v)} />
                                    </LongGridRow>
                                    {formData.usedUnderground === true && (
                                        <GridRow label="If yes, please attach details">
                                            <input type="text" value={formData.usedUndergroundDetails} onChange={(e) => handleInputChange("usedUndergroundDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}
                                </div>

                                {formData.loansRentsToOthers === true && (
                                    <>
                                        <div className="border-t border-gray-300 pt-8 mt-8"></div>
                                        <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase mb-6 bg-gray-50 p-3 rounded border border-gray-200">Rentals Section (Only complete if renting equipment to others)</h3>
                                        <div className="space-y-6 pl-4 border-l-4 border-[#9A8B7A]">
                                            <LongGridRow label="Is equipment rental, leasing, or rent to own your sole operation?">
                                                <YesNoRadio value={formData.rentalSoleOperation} onChange={(v) => handleInputChange("rentalSoleOperation", v)} />
                                            </LongGridRow>

                                            <LongGridRow label="Is all of your scheduled equipment available for rental, lease, or loan to others?">
                                                <YesNoRadio value={formData.allEquipmentScheduledAvailable} onChange={(v) => handleInputChange("allEquipmentScheduledAvailable", v)} />
                                            </LongGridRow>
                                            {formData.allEquipmentScheduledAvailable === false && (
                                                <GridRow label="If no, what equipment is not available to others?">
                                                    <input type="text" value={formData.equipmentNotAvailableDetails} onChange={(e) => handleInputChange("equipmentNotAvailableDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                                </GridRow>
                                            )}

                                            <LongGridRow label="Do you provide rentals with operators?">
                                                <YesNoRadio value={formData.rentalsWithOperators} onChange={(v) => handleInputChange("rentalsWithOperators", v)} />
                                            </LongGridRow>

                                            <LongGridRow label="Do you have a written rental contract, lease agreement, or loan agreement in place before releasing any equipment?">
                                                <YesNoRadio value={formData.writtenRentalContract} onChange={(v) => handleInputChange("writtenRentalContract", v)} />
                                            </LongGridRow>
                                            {formData.writtenRentalContract === false && (
                                                <GridRow label="If no, please attach an explanation">
                                                    <input type="text" value={formData.writtenRentalContractExplanation} onChange={(e) => handleInputChange("writtenRentalContractExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                                </GridRow>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ))}

                    {renderSection("Equipment Security", (
                        <>
                            <div className="space-y-6">
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">Storage Location Security Measures</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.lighting} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, lighting: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Security Lighting</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.fencing} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, fencing: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Locked Fencing</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.garages} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, garages: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Locked Garages</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.cameras} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, cameras: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Premise Cameras</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.guards} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, guards: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Security Guards</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresStorage.other} onChange={(e) => handleInputChange('securityMeasuresStorage', { ...formData.securityMeasuresStorage, other: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Other</span></label>
                                    </div>
                                    {formData.securityMeasuresStorage.other && (
                                        <div className="mt-3"><input type="text" value={formData.securityMeasuresStorage.otherText} onChange={(e) => handleInputChange("securityMeasuresStorage", { ...formData.securityMeasuresStorage, otherText: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" placeholder="Describe other measures..." /></div>
                                    )}
                                </div>

                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">Job Site Security Measures</h3>
                                    <div className="grid grid-cols-4 gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresJobSite.lighting} onChange={(e) => handleInputChange('securityMeasuresJobSite', { ...formData.securityMeasuresJobSite, lighting: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Security Lighting</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresJobSite.fencing} onChange={(e) => handleInputChange('securityMeasuresJobSite', { ...formData.securityMeasuresJobSite, fencing: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Locked Fencing</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresJobSite.guards} onChange={(e) => handleInputChange('securityMeasuresJobSite', { ...formData.securityMeasuresJobSite, guards: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Security Guards</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresJobSite.offSiteGaraging} onChange={(e) => handleInputChange('securityMeasuresJobSite', { ...formData.securityMeasuresJobSite, offSiteGaraging: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Off-site Garaging</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={formData.securityMeasuresJobSite.other} onChange={(e) => handleInputChange('securityMeasuresJobSite', { ...formData.securityMeasuresJobSite, other: e.target.checked })} className="rounded text-[#9A8B7A]" /><span className="text-sm">Other</span></label>
                                    </div>
                                    {formData.securityMeasuresJobSite.other && (
                                        <div className="mt-3"><input type="text" value={formData.securityMeasuresJobSite.otherText} onChange={(e) => handleInputChange("securityMeasuresJobSite", { ...formData.securityMeasuresJobSite, otherText: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" placeholder="Describe other measures..." /></div>
                                    )}
                                </div>

                                <div className="border-t border-gray-200 mt-8 pt-6 space-y-6">
                                    <LongGridRow label="How frequently is equipment inspected?">
                                        <input type="text" value={formData.inspectionFrequency} onChange={(e) => handleInputChange("inspectionFrequency", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </LongGridRow>
                                    <LongGridRow label="How frequently is equipment given routine maintenance?">
                                        <input type="text" value={formData.maintenanceFrequency} onChange={(e) => handleInputChange("maintenanceFrequency", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </LongGridRow>
                                    <LongGridRow label="Is all equipment tracked with a GPS, LoJack, remote disable, or similar device?">
                                        <YesNoRadio value={formData.equipmentTrackedGPS} onChange={(v) => handleInputChange("equipmentTrackedGPS", v)} />
                                    </LongGridRow>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-sm font-bold text-gray-700 mb-4 tracking-wide">Are all bulldozers, loaders, cranes, and backhoes equipped with the following:</h3>
                                        <div className="space-y-4">
                                            <GridRow label="Locking gas caps?" className="border-0 py-0"><YesNoRadio value={formData.heavyEquipLockingGasCaps} onChange={(v) => handleInputChange("heavyEquipLockingGasCaps", v)} /></GridRow>
                                            <GridRow label="Anti-theft devices?" className="border-0 py-0"><YesNoRadio value={formData.heavyEquipAntiTheft} onChange={(v) => handleInputChange("heavyEquipAntiTheft", v)} /></GridRow>
                                            <GridRow label="Additional deterrent devices (describe)" className="border-0 py-0">
                                                <input type="text" value={formData.heavyEquipAdditionalDeterrent} onChange={(e) => handleInputChange("heavyEquipAdditionalDeterrent", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" />
                                            </GridRow>
                                        </div>
                                    </div>

                                    <LongGridRow label="Are fire extinguishers present on or in all equipment?">
                                        <YesNoRadio value={formData.fireExtinguishersPresent} onChange={(v) => handleInputChange("fireExtinguishersPresent", v)} />
                                    </LongGridRow>
                                    {formData.fireExtinguishersPresent === false && (
                                        <GridRow label="If no, please attach an explanation">
                                            <input type="text" value={formData.fireExtinguishersExplanation} onChange={(e) => handleInputChange("fireExtinguishersExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}
                                    {formData.fireExtinguishersPresent === true && (
                                        <GridRow label="How frequently are extinguishers charged or replaced?">
                                            <input type="text" value={formData.fireExtinguishersChargingFreq} onChange={(e) => handleInputChange("fireExtinguishersChargingFreq", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}

                                    <LongGridRow label="Does any equipment have automatic fire suppression systems installed?">
                                        <YesNoRadio value={formData.automaticFireSuppression} onChange={(v) => handleInputChange("automaticFireSuppression", v)} />
                                    </LongGridRow>
                                    {formData.automaticFireSuppression === true && (
                                        <GridRow label="If yes, which equipment?">
                                            <input type="text" value={formData.automaticFireSuppressionEquip} onChange={(e) => handleInputChange("automaticFireSuppressionEquip", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}

                                    <LongGridRow label="Is any equipment stored in areas subject to flooding or wildfire?">
                                        <YesNoRadio value={formData.storedInFloodWildfireAreas} onChange={(v) => handleInputChange("storedInFloodWildfireAreas", v)} />
                                    </LongGridRow>
                                    {formData.storedInFloodWildfireAreas === true && (
                                        <GridRow label="If yes, please attach details as to how these risks are mitigated.">
                                            <input type="text" value={formData.storedInFloodWildfireDetails} onChange={(e) => handleInputChange("storedInFloodWildfireDetails", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                        </GridRow>
                                    )}
                                </div>
                            </div>
                        </>
                    ))}

                    {renderSection("Claims History", (
                        <>
                            <div className="space-y-6">
                                <LongGridRow label="Do you know of any incidents not currently reported to insurance that may result in a claim against you?">
                                    <YesNoRadio value={formData.unreportedIncidents} onChange={(v) => handleInputChange("unreportedIncidents", v)} />
                                </LongGridRow>
                                {formData.unreportedIncidents === true && (
                                    <GridRow label="If yes, please attach an explanation">
                                        <input type="text" value={formData.unreportedIncidentsExplanation} onChange={(e) => handleInputChange("unreportedIncidentsExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>
                                )}

                                <LongGridRow label="During the past five years, has any insurer ever canceled or non-renewed similar insurance to any applicant or has your insurance been canceled for nonpayment of premium?">
                                    <YesNoRadio value={formData.insurerCanceledNonRenewed} onChange={(v) => handleInputChange("insurerCanceledNonRenewed", v)} />
                                </LongGridRow>
                                {formData.insurerCanceledNonRenewed === true && (
                                    <GridRow label="If yes, please attach an explanation">
                                        <input type="text" value={formData.insurerCanceledExplanation} onChange={(e) => handleInputChange("insurerCanceledExplanation", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                    </GridRow>
                                )}

                                <div className="border-t border-gray-200 mt-8 pt-6"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-sm font-bold text-gray-700 tracking-wide uppercase">Claim Details</h3>
                                    <button onClick={() => {
                                        const newClaims = [...formData.claims, {
                                            date: "", circumstances: "", totalClaimed: "",
                                            coverageLines: { equip: false, equipRental: false, autoLiab: false, cgl: false, pollution: false, autoPhys: false, uninsured: false, other: false, otherText: "" },
                                            closed: null, trialSettlement: null, open: null, anticipateTrial: null, anticipateTrialWhen: "", proceduresChanged: null, totalLoss: null, repairedReturned: null
                                        }];
                                        handleInputChange('claims', newClaims);
                                    }} className="flex items-center gap-2 text-xs font-bold text-[#9A8B7A] hover:text-[#8A7B6A] transition-colors">
                                        <Plus size={14} /> ADD CLAIM
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    {formData.claims.map((claim, idx) => (
                                        <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6 relative">
                                            {formData.claims.length > 1 && (
                                                <button onClick={() => { const n = formData.claims.filter((_, i) => i !== idx); handleInputChange('claims', n); }} className="absolute top-4 right-4 text-red-400 hover:text-red-600 transition-colors bg-white rounded-full p-2 shadow-sm border border-gray-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            <h4 className="font-bold text-gray-700 mb-6 pb-2 border-b border-gray-200">Claim {idx + 1}</h4>

                                            <div className="space-y-6">
                                                <GridRow label="Date of incident">
                                                    <input type="date" value={claim.date} onChange={(e) => { const n = [...formData.claims]; n[idx].date = e.target.value; handleInputChange('claims', n); }} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" />
                                                </GridRow>

                                                <div className="bg-white p-4 rounded border border-gray-100">
                                                    <label className="text-sm font-medium text-gray-700 block mb-3">Coverage Line(s) Reported On</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.equip} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.equip = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Contractors Equipment</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.equipRental} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.equipRental = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Contractors Equip. Rental</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.autoLiab} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.autoLiab = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Commercial Auto - Liability</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.cgl} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.cgl = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Commercial Gen. Liability</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.pollution} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.pollution = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Transportation Pollution</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.autoPhys} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.autoPhys = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Commercial Auto - Phys. Damage</span></label>
                                                        <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={claim.coverageLines.uninsured} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.uninsured = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Uninsured/Self Insured</span></label>
                                                        <div className="flex items-center gap-2">
                                                            <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap"><input type="checkbox" checked={claim.coverageLines.other} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.other = e.target.checked; handleInputChange('claims', n); }} className="rounded text-[#9A8B7A]" /><span className="text-sm">Other</span></label>
                                                            {claim.coverageLines.other && <input type="text" value={claim.coverageLines.otherText} onChange={(e) => { const n = [...formData.claims]; n[idx].coverageLines.otherText = e.target.value; handleInputChange('claims', n); }} className="w-full px-2 py-1 border border-gray-300 rounded text-sm bg-white" />}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="text-sm font-medium text-gray-700 block mb-2">Description of circumstances</label>
                                                    <textarea value={claim.circumstances} onChange={(e) => { const n = [...formData.claims]; n[idx].circumstances = e.target.value; handleInputChange('claims', n); }} className="w-full px-4 py-3 border border-gray-300 rounded text-sm bg-white min-h-[100px]" placeholder="Factual details, equipment lost, steps taken to mitigate..." />
                                                </div>

                                                <div className="grid grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-200">
                                                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">If closed, did it require trial/arbitration?</span><YesNoRadio value={claim.trialSettlement} onChange={(v) => { const n = [...formData.claims]; n[idx].trialSettlement = v; handleInputChange('claims', n); }} /></div>
                                                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">Were procedures changed after incident?</span><YesNoRadio value={claim.proceduresChanged} onChange={(v) => { const n = [...formData.claims]; n[idx].proceduresChanged = v; handleInputChange('claims', n); }} /></div>
                                                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">If open, do you anticipate trial/arbitration?</span><YesNoRadio value={claim.anticipateTrial} onChange={(v) => { const n = [...formData.claims]; n[idx].anticipateTrial = v; handleInputChange('claims', n); }} /></div>
                                                    <div className="flex justify-between items-center"><span className="text-sm font-medium text-gray-700">Was equipment a total loss claimed?</span><YesNoRadio value={claim.totalLoss} onChange={(v) => { const n = [...formData.claims]; n[idx].totalLoss = v; handleInputChange('claims', n); }} /></div>
                                                </div>

                                                {claim.anticipateTrial === true && (
                                                    <GridRow label="If yes, when?"><input type="text" value={claim.anticipateTrialWhen} onChange={(e) => { const n = [...formData.claims]; n[idx].anticipateTrialWhen = e.target.value; handleInputChange('claims', n); }} className="w-full px-4 py-2 border border-gray-300 rounded text-sm bg-white" /></GridRow>
                                                )}
                                                {claim.totalLoss === false && (
                                                    <GridRow label="If no, has equipment been repaired/returned?"><YesNoRadio value={claim.repairedReturned} onChange={(v) => { const n = [...formData.claims]; n[idx].repairedReturned = v; handleInputChange('claims', n); }} /></GridRow>
                                                )}

                                                <div className="flex items-center gap-4 justify-end pt-4">
                                                    <label className="text-sm font-bold text-gray-700">Total claimed: $</label>
                                                    <input type="text" value={claim.totalClaimed} onChange={(e) => { const n = [...formData.claims]; n[idx].totalClaimed = e.target.value.replace(/[^\d.]/g, ''); handleInputChange('claims', n); }} className="w-[150px] px-4 py-2 border border-gray-300 rounded font-mono text-sm bg-white text-right" placeholder="0.00" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ))}

                    {renderSection("Overview & Submission", (
                        <>
                            <div className="space-y-6">
                                <div className="bg-gray-50 border border-[#9A8B7A] rounded-lg p-6 mb-8 text-sm text-gray-700">
                                    <p className="mb-4">By submitting this application, you declare that all information provided is accurate and complete to the best of your knowledge.</p>
                                    <p>This document will form part of your insurance application and may be relied upon by underwriters.</p>
                                </div>

                                <GridRow label="Applicant Name"><input type="text" value={formData.applicantName} onChange={(e) => handleInputChange("applicantName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Title"><input type="text" value={formData.applicantTitle} onChange={(e) => handleInputChange("applicantTitle", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="FEIN #"><input type="text" value={formData.fein} onChange={(e) => handleInputChange("fein", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>
                                <GridRow label="Date"><input type="date" value={formData.signatureDate} onChange={(e) => handleInputChange("signatureDate", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" /></GridRow>

                                <GridRow label="Agent/Broker Name">
                                    <input type="text" value={formData.agentBrokerName} onChange={(e) => handleInputChange("agentBrokerName", e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded text-sm" />
                                </GridRow>
                            </div>
                        </>
                    ))}
                </div>

                {/* Continue Actions */}
                <div className="flex justify-end pt-4 mt-8">
                    <button
                        onClick={() => {
                            router.back();
                        }}
                        className="px-8 py-2.5 bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white font-medium rounded shadow-sm transition-all flex items-center gap-2 text-sm"
                    >
                        Save & Continue
                    </button>
                </div>
            </div>
        </div>
    );
}
