"use client"

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Plus } from 'lucide-react'
import { toast } from 'sonner'

// ── Sterling section wrapper ──────────────────────────────────────
const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="bg-white rounded shadow-md overflow-visible border border-gray-200 mb-5">
        <div className="bg-[#7A6F64] text-white px-6 py-3.5">
            <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="px-8 pt-6 pb-7">
            <div className="space-y-6">{children}</div>
        </div>
    </div>
)

// ── Label + input row ─────────────────────────────────────────────
const Row = ({ label, children, required = false }: { label: string; children: React.ReactNode; bold?: boolean; required?: boolean }) => (
    <div className="grid grid-cols-[300px_1fr_320px] gap-x-6 items-start">
        <label className="text-sm font-medium text-gray-900 pt-2 leading-snug">
            {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        <div></div>
        <div>{children}</div>
    </div>
)

// ── Question row with Yes / No radios + optional explain ───────────
const QRow = ({ label, value, onChange, explainValue, onExplainChange }: {
    label: string
    value: boolean | null
    onChange: (v: boolean) => void
    explainValue?: string
    onExplainChange?: (v: string) => void
}) => (
    <div className="py-4 border-b border-gray-50 last:border-0">
        <div className="flex items-center">
            <div className="flex-1 text-sm text-gray-700 pr-6">{label}</div>
            <div className="flex items-center gap-6 text-sm text-gray-700 shrink-0">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={value === true} onChange={() => onChange(true)} className="w-4 h-4 accent-gray-700" />
                    Yes
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={value === false} onChange={() => onChange(false)} className="w-4 h-4 accent-gray-700" />
                    No
                </label>
            </div>
        </div>
        {value === true && onExplainChange !== undefined && (
            <div className="mt-3">
                <label className="text-sm font-bold text-gray-700 block mb-1">Please explain:</label>
                <input
                    type="text"
                    value={explainValue ?? ''}
                    onChange={e => onExplainChange(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white"
                />
            </div>
        )}
    </div>
)

const inp = "w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white"
const sel = `${inp} appearance-none`

// ── Bundle card ───────────────────────────────────────────────────
const BundleCard = ({ label, price, icon, selected, onClick }: {
    label: string; price: string; icon: React.ReactNode; selected: boolean; onClick: () => void
}) => (
    <button onClick={onClick} className={`flex flex-col w-full rounded overflow-hidden border-2 transition-all
        ${selected ? 'border-gray-700 shadow-md' : 'border-gray-200 hover:border-gray-400'}`}>
        <div className="bg-[#3A3A3A] text-white px-3 py-3 relative text-center">
            {selected && (
                <span className="absolute top-2 right-2 w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </span>
            )}
            <p className="text-xs opacity-70 font-medium">As Low As</p>
            <p className="text-2xl font-bold leading-tight">{price}</p>
        </div>
        <div className="bg-white py-5 flex flex-col items-center gap-2">
            <span className="text-gray-500">{icon}</span>
            <span className="text-sm font-semibold text-gray-700">{label}</span>
        </div>
    </button>
)

const HammerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
)
const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
)

type AI = { name: string; contractNumber: string; address: string; aptSuite: string; zip: string; city: string; state: string }
const emptyAI = (): AI => ({ name: '', contractNumber: '', address: '', aptSuite: '', zip: '', city: '', state: '' })

// ── All US states ─────────────────────────────────────────────────
const ALL_STATES = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
    'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
    'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
    'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
    'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
    'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
]

// ── Smarty state code to full name map ──────────────────────────
const STATE_CODE_TO_NAME: Record<string, string> = {
    AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
    CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
    DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii',
    ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
    KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
    MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
    MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
    NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
    NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
    OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
    SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
    VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
    WI: 'Wisconsin', WY: 'Wyoming',
};

// ── Agent Lists ───────────────────────────────────────────────────
const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
const BLUE_ANGEL_AGENTS = ["Max Mintz"];
const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];

// ── Multi-select states dropdown ──────────────────────────────────
const StatesMultiSelect = ({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) => {
    const [open, setOpen] = React.useState(false)
    const [search, setSearch] = React.useState('')
    const ref = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const toggle = (state: string) => {
        onChange(selected.includes(state) ? selected.filter(s => s !== state) : [...selected, state])
    }

    const filtered = ALL_STATES.filter(s => s.toLowerCase().includes(search.toLowerCase()))

    return (
        <div ref={ref} className="relative">
            {/* Input bar with tags */}
            <div
                onClick={() => setOpen(true)}
                className="min-h-[38px] w-full border border-gray-300 rounded px-2 py-1 flex flex-wrap gap-1 items-center cursor-text focus-within:border-teal-400 bg-white"
            >
                {selected.map(s => (
                    <span key={s} className="flex items-center gap-1 bg-gray-100 border border-gray-300 text-gray-700 text-xs rounded px-2 py-0.5">
                        {s}
                        <button type="button" onClick={e => { e.stopPropagation(); toggle(s) }} className="text-gray-400 hover:text-gray-700 font-bold leading-none">&times;</button>
                    </span>
                ))}
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onFocus={() => setOpen(true)}
                    placeholder={selected.length === 0 ? 'Select all states that apply' : ''}
                    className="flex-1 min-w-[120px] outline-none text-sm text-gray-700 bg-transparent py-0.5 px-1"
                />
            </div>

            {/* Dropdown list */}
            {open && (
                <div className="absolute z-50 w-full bg-white border border-gray-300 rounded shadow-lg mt-1 max-h-52 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <div className="px-4 py-2 text-sm text-gray-400">No results</div>
                    ) : filtered.map(state => (
                        <div
                            key={state}
                            onClick={() => toggle(state)}
                            className={`px-4 py-2 text-sm cursor-pointer transition-colors
                                ${selected.includes(state) ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-blue-600 hover:text-white'}`}
                        >
                            {state}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════
function ContractorsEquipmentContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const mode = searchParams.get('mode')
    const submissionId = searchParams.get('id')
    const isViewMode = mode === 'view'
    const isEditMode = mode === 'edit'

    const { data: session } = useSession()
    const userName = session?.user?.name || ""
    const userEmail = (session?.user as any)?.email || ""
    const agencyName = (session?.user as any)?.agencyName || ""

    const isCapco = agencyName.includes("Capital & Co") || agencyName.includes("Capco") || userEmail.includes("capcoinsurance") || userEmail === "admin@agency1.com" || userName.includes("Gamaty")
    const isBlueAngel = agencyName.includes("Blue Angel") || userEmail === "admin@blueangel.com"
    const isSJJ = agencyName.includes("SJJ") || userEmail === "admin@sjjinsurance.com"
    const isPatrickArias = agencyName.includes("Patrick Arias") || userEmail.includes("patrickariasinsurance")

    const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : []

    // State
    const [agentName, setAgentName] = useState('')

    // Auto-select agent if userName matches
    useEffect(() => {
        if (!agentName && userName && agentOptions.includes(userName)) {
            setAgentName(userName)
        }
    }, [userName, agentOptions, agentName])

    // Load existing submission data
    useEffect(() => {
        const fetchSubmissionData = async () => {
            if (!submissionId) return;

            try {
                const res = await fetch(`/api/agency/submissions/${submissionId}`);
                const result = await res.json();
                if (!res.ok) throw new Error(result.error);

                const p = result.submission.payload;
                if (!p) return;

                // Hydrate all fields
                if (p.agentName) setAgentName(p.agentName);
                if (p.leadSource) setLeadSource(p.leadSource);
                if (p.companyName) setCompanyName(p.companyName);
                if (p.zip) setZip(p.zip);
                if (p.deductible) setDeductible(p.deductible);
                if (p.losses) setLosses(p.losses);
                if (p.yearsInBusiness) setYearsInBusiness(p.yearsInBusiness);
                if (p.effectiveDate) setEffectiveDate(p.effectiveDate);
                if (p.bundle) setBundle(p.bundle);

                if (p.policyDuration) setPolicyDuration(p.policyDuration);
                if (p.rentedEquipLimitRental) setRentedEquipLimitRental(p.rentedEquipLimitRental);
                if (p.rentedItems) setRentedItems(p.rentedItems);

                if (p.miscToolsLimit) setMiscToolsLimit(p.miscToolsLimit);
                if (p.lightMedLimit) setLightMedLimit(p.lightMedLimit);
                if (p.heavyLimit) setHeavyLimit(p.heavyLimit);
                if (p.rentedEquipLimit) setRentedEquipLimit(p.rentedEquipLimit);
                if (p.installFloaterLimit) setInstallFloaterLimit(p.installFloaterLimit);
                if (p.officeContentsLimit) setOfficeContentsLimit(p.officeContentsLimit);

                if (p.hasLienholder !== undefined) setHasLienholder(p.hasLienholder);
                if (p.lienholderExplain) setLienholderExplain(p.lienholderExplain);
                if (p.interests) setInterests(p.interests);

                if (p.terrorism !== undefined) setTerrorism(p.terrorism);

                if (p.cancelled !== undefined) setCancelled(p.cancelled);
                if (p.bankruptcy !== undefined) setBankruptcy(p.bankruptcy);
                if (p.moreThanOneLoss !== undefined) setMoreThanOneLoss(p.moreThanOneLoss);
                if (p.asphaltCranes !== undefined) setAsphaltCranes(p.asphaltCranes);
                if (p.tandemLifting !== undefined) setTandemLifting(p.tandemLifting);
                if (p.overWater !== undefined) setOverWater(p.overWater);
                if (p.oilfield !== undefined) setOilfield(p.oilfield);
                if (p.demolition !== undefined) setDemolition(p.demolition);
                if (p.garaged !== undefined) setGaraged(p.garaged);
                if (p.stumpGrinder !== undefined) setStumpGrinder(p.stumpGrinder);
                if (p.rentToOthers !== undefined) setRentToOthers(p.rentToOthers);
                if (p.subcontractHazardous !== undefined) setSubcontractHazardous(p.subcontractHazardous);
                if (p.subcontractAgri !== undefined) setSubcontractAgri(p.subcontractAgri);
                if (p.subcontractBridges !== undefined) setSubcontractBridges(p.subcontractBridges);
                if (p.subcontractDrones !== undefined) setSubcontractDrones(p.subcontractDrones);
                if (p.subcontractTrailers !== undefined) setSubcontractTrailers(p.subcontractTrailers);

                if (p.cancelledExplain) setCancelledExplain(p.cancelledExplain);
                if (p.bankruptcyExplain) setBankruptcyExplain(p.bankruptcyExplain);
                if (p.lossExplain) setLossExplain(p.lossExplain);
                if (p.asphaltExplain) setAsphaltExplain(p.asphaltExplain);
                if (p.tandemExplain) setTandemExplain(p.tandemExplain);
                if (p.waterExplain) setWaterExplain(p.waterExplain);
                if (p.oilfieldExplain) setOilfieldExplain(p.oilfieldExplain);
                if (p.demolitionExplain) setDemolitionExplain(p.demolitionExplain);
                if (p.stumpExplain) setStumpExplain(p.stumpExplain);
                if (p.rentExplain) setRentExplain(p.rentExplain);
                if (p.hazardousExplain) setHazardousExplain(p.hazardousExplain);
                if (p.agriExplain) setAgriExplain(p.agriExplain);
                if (p.bridgesExplain) setBridgesExplain(p.bridgesExplain);
                if (p.dronesExplain) setDronesExplain(p.dronesExplain);
                if (p.trailersExplain) setTrailersExplain(p.trailersExplain);

                if (p.brokerFee) setBrokerFee(p.brokerFee);
                if (p.displayBrokerFee !== undefined) setDisplayBrokerFee(p.displayBrokerFee);
                if (p.paymentOption) setPaymentOption(p.paymentOption);

                if (p.licenseNum) setLicenseNum(p.licenseNum);
                if (p.licenseClass) setLicenseClass(p.licenseClass);
                if (p.dba) setDba(p.dba);
                if (p.firstName) setFirstName(p.firstName);
                if (p.lastName) setLastName(p.lastName);
                if (p.yearsExp) setYearsExp(p.yearsExp);
                if (p.grossReceipts) setGrossReceipts(p.grossReceipts);
                if (p.entityType) setEntityType(p.entityType);
                if (p.ssn) setSsn(p.ssn);
                if (p.dlNum) setDlNum(p.dlNum);
                if (p.phone) setPhone(p.phone);
                if (p.fax) setFax(p.fax);
                if (p.email) setEmail(p.email);
                if (p.opsDescription) setOpsDescription(p.opsDescription);
                if (p.statesOfBusiness) setStatesOfBusiness(p.statesOfBusiness);

                if (p.physAddress) setPhysAddress(p.physAddress);
                if (p.physCity) setPhysCity(p.physCity);
                if (p.physApt) setPhysApt(p.physApt);
                if (p.sameAsMailing !== undefined) setSameAsMailing(p.sameAsMailing);
                if (p.mailAddress) setMailAddress(p.mailAddress);
                if (p.mailApt) setMailApt(p.mailApt);
                if (p.mailZip) setMailZip(p.mailZip);
                if (p.mailCity) setMailCity(p.mailCity);
                if (p.mailState) setMailState(p.mailState);

            } catch (err) {
                console.error("Failed to fetch submission data:", err);
                toast.error("Failed to load application data");
            }
        };

        fetchSubmissionData();
    }, [submissionId]);

    // Quick Quote
    const [leadSource, setLeadSource] = useState('capital_co')
    const [companyName, setCompanyName] = useState('')
    const [zip, setZip] = useState('')
    const [deductible, setDeductible] = useState('$1,000/$2,500')
    const [losses, setLosses] = useState('0')
    const [yearsInBusiness, setYearsInBusiness] = useState('')
    const [effectiveDate, setEffectiveDate] = useState('')
    const [bundle, setBundle] = useState('bundle1')

    // Rental bundle fields
    const [policyDuration, setPolicyDuration] = useState('3 Months')
    const [rentedEquipLimitRental, setRentedEquipLimitRental] = useState('$14,000')
    const [rentedItems, setRentedItems] = useState<string[]>([])

    // Custom bundle coverage limit fields
    const [miscToolsLimit, setMiscToolsLimit] = useState('$10,000')
    const [lightMedLimit, setLightMedLimit] = useState('$0')
    const [heavyLimit, setHeavyLimit] = useState('$0')
    const [rentedEquipLimit, setRentedEquipLimit] = useState('$0')
    const [installFloaterLimit, setInstallFloaterLimit] = useState('$0')
    const [officeContentsLimit, setOfficeContentsLimit] = useState('$0')

    // Additional Interests
    const [hasLienholder, setHasLienholder] = useState<boolean | null>(true)
    const [lienholderExplain, setLienholderExplain] = useState('')
    const [interests, setInterests] = useState<AI[]>([emptyAI()])

    // Endorsements
    const [terrorism, setTerrorism] = useState(false)

    // Additional Business Info — all questions
    const [cancelled, setCancelled] = useState<boolean | null>(false)
    const [bankruptcy, setBankruptcy] = useState<boolean | null>(false)
    const [moreThanOneLoss, setMoreThanOneLoss] = useState<boolean | null>(false)
    const [asphaltCranes, setAsphaltCranes] = useState<boolean | null>(false)
    const [tandemLifting, setTandemLifting] = useState<boolean | null>(false)
    const [overWater, setOverWater] = useState<boolean | null>(false)
    const [oilfield, setOilfield] = useState<boolean | null>(false)
    const [demolition, setDemolition] = useState<boolean | null>(false)
    const [garaged, setGaraged] = useState<boolean | null>(true)
    const [stumpGrinder, setStumpGrinder] = useState<boolean | null>(false)
    const [rentToOthers, setRentToOthers] = useState<boolean | null>(false)
    const [subcontractHazardous, setSubcontractHazardous] = useState<boolean | null>(false)
    const [subcontractAgri, setSubcontractAgri] = useState<boolean | null>(false)
    const [subcontractBridges, setSubcontractBridges] = useState<boolean | null>(false)
    const [subcontractDrones, setSubcontractDrones] = useState<boolean | null>(false)
    const [subcontractTrailers, setSubcontractTrailers] = useState<boolean | null>(false)

    // Explain fields for Additional Business Info
    const [cancelledExplain, setCancelledExplain] = useState('')
    const [bankruptcyExplain, setBankruptcyExplain] = useState('')
    const [lossExplain, setLossExplain] = useState('')
    const [asphaltExplain, setAsphaltExplain] = useState('')
    const [tandemExplain, setTandemExplain] = useState('')
    const [waterExplain, setWaterExplain] = useState('')
    const [oilfieldExplain, setOilfieldExplain] = useState('')
    const [demolitionExplain, setDemolitionExplain] = useState('')
    const [stumpExplain, setStumpExplain] = useState('')
    const [rentExplain, setRentExplain] = useState('')
    const [hazardousExplain, setHazardousExplain] = useState('')
    const [agriExplain, setAgriExplain] = useState('')
    const [bridgesExplain, setBridgesExplain] = useState('')
    const [dronesExplain, setDronesExplain] = useState('')
    const [trailersExplain, setTrailersExplain] = useState('')

    // Payment Options
    const [brokerFee, setBrokerFee] = useState('$0.00')
    const [displayBrokerFee, setDisplayBrokerFee] = useState<boolean | null>(true)
    const [paymentOption, setPaymentOption] = useState('')

    // Company Information
    const [licenseNum, setLicenseNum] = useState('')
    const [licenseClass, setLicenseClass] = useState('')
    const [dba, setDba] = useState('')
    const [firstName, setFirstName] = useState('')
    const [lastName, setLastName] = useState('')
    const [yearsExp, setYearsExp] = useState('')
    const [grossReceipts, setGrossReceipts] = useState('')
    const [entityType, setEntityType] = useState('Individual')
    const [ssn, setSsn] = useState('')
    const [dlNum, setDlNum] = useState('')
    const [phone, setPhone] = useState('')
    const [fax, setFax] = useState('')
    const [email, setEmail] = useState('')
    const [opsDescription, setOpsDescription] = useState('')
    const [statesOfBusiness, setStatesOfBusiness] = useState<string[]>([])

    // Physical / Mailing Address
    const [physAddress, setPhysAddress] = useState('')
    const [physCity, setPhysCity] = useState('')
    const [physApt, setPhysApt] = useState('')
    const [sameAsMailing, setSameAsMailing] = useState(false)
    const [mailAddress, setMailAddress] = useState('')
    const [mailApt, setMailApt] = useState('')
    const [mailZip, setMailZip] = useState('')
    const [mailCity, setMailCity] = useState('')
    const [mailState, setMailState] = useState('')
    const [mailZipError, setMailZipError] = useState(false)

    // Address Autocomplete State
    const suggestionRef = useRef<HTMLDivElement>(null)
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([])
    const [showSuggestions, setShowSuggestions] = useState(false)
    const [addressLoading, setAddressLoading] = useState(false)
    const [activeSearchType, setActiveSearchType] = useState<'physical' | 'mailing' | null>(null)

    const handleAddressSearch = async (value: string, type: 'physical' | 'mailing') => {
        if (type === 'physical') setPhysAddress(value)
        else setMailAddress(value)

        if (value.length < 3) {
            setAddressSuggestions([])
            setShowSuggestions(false)
            return
        }

        setAddressLoading(true)
        setActiveSearchType(type)
        try {
            const res = await fetch(`/api/address/autocomplete?search=${encodeURIComponent(value)}`)
            const data = await res.json()
            setAddressSuggestions(data.suggestions || [])
            setShowSuggestions(true)
        } catch (err) {
            console.error('Address search error:', err)
        } finally {
            setAddressLoading(false)
        }
    }

    const handleSelectSuggestion = (suggestion: any) => {
        const fullStateName = STATE_CODE_TO_NAME[suggestion.state] || suggestion.state

        if (activeSearchType === 'physical') {
            setPhysAddress(`${suggestion.street_line} ${suggestion.secondary || ''}, ${suggestion.city}, ${suggestion.state} ${suggestion.zipcode}`.trim())
            setPhysCity(suggestion.city)
        } else {
            setMailAddress(`${suggestion.street_line} ${suggestion.secondary || ''}`.trim())
            setMailCity(suggestion.city)
            setMailZip(suggestion.zipcode)
            setMailState(fullStateName)
        }
        setAddressSuggestions([])
        setShowSuggestions(false)
        setActiveSearchType(null)
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
                setShowSuggestions(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleMailZip = (val: string) => {
        setMailZip(val)
        setMailZipError(val.length > 0 && !/^\d{5}(-\d{4})?$/.test(val))
    }

    const removeAI = (i: number) => {
        setInterests(prev => prev.filter((_, idx) => idx !== i))
    }

    const updateAI = (i: number, field: keyof AI, val: string) =>
        setInterests(prev => prev.map((ai, idx) => idx === i ? { ...ai, [field]: val } : ai))

    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!companyName.trim()) {
            toast.error("Company name is required")
            return
        }

        try {
            setIsSubmitting(true)

            const payload = {
                agentName, leadSource, companyName, zip, deductible, losses, yearsInBusiness, effectiveDate, bundle,
                policyDuration, rentedEquipLimitRental, rentedItems,
                miscToolsLimit, lightMedLimit, heavyLimit, rentedEquipLimit, installFloaterLimit, officeContentsLimit,
                hasLienholder, lienholderExplain, interests, terrorism,
                cancelled, cancelledExplain, bankruptcy, bankruptcyExplain, moreThanOneLoss, lossExplain,
                asphaltCranes, asphaltExplain, tandemLifting, tandemExplain, overWater, waterExplain,
                oilfield, oilfieldExplain, demolition, demolitionExplain, garaged, stumpGrinder, stumpExplain,
                rentToOthers, rentExplain, subcontractHazardous, hazardousExplain, subcontractAgri, agriExplain,
                subcontractBridges, bridgesExplain, subcontractDrones, dronesExplain, subcontractTrailers, trailersExplain,
                brokerFee, displayBrokerFee, paymentOption,
                licenseNum, licenseClass, dba, firstName, lastName, yearsExp, grossReceipts, entityType,
                ssn, dlNum, phone, fax, email, opsDescription, statesOfBusiness,
                physAddress, physCity, physApt,
                streetAddress: physAddress, // Map for backend validation
                city: physCity || 'N/A', // Map for backend validation
                state: statesOfBusiness[0] || 'CA', // Map for backend validation
                sameAsMailing, mailAddress, mailApt, mailZip, mailCity, mailState
            }

            let response;
            if (isEditMode && submissionId) {
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
                        programId: "contractors-equipment",
                        programName: "Construction Equipment",
                        formData: payload,
                    }),
                });
            }

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || "Failed to submit")
            }

            toast.success(isEditMode ? "Application updated successfully!" : "Application submitted successfully!")

            setTimeout(() => {
                router.refresh()
                router.push("/agency/dashboard")
            }, 1500)

        } catch (error: any) {
            console.error(error)
            toast.error(error.message || "Failed to submit application")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 pb-24">
            <div className="py-4 px-6">
                <button onClick={() => router.back()}
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back
                </button>
            </div>

            <div className="max-w-[980px] mx-auto px-4">
                <form id="contractors-form" onSubmit={handleSubmit}>
                <fieldset disabled={isViewMode} className="contents">

                {/* ═══ 1. Quick Quote Information ═══════════════════════════ */}
                <Section title="Quick Quote Information">
                    {agentOptions.length > 0 && (
                        <Row label="Agent Name" bold required>
                            <select value={agentName} onChange={e => setAgentName(e.target.value)} className={sel}>
                                <option value="">Select Agent</option>
                                {agentOptions.map(name => (
                                    <option key={name} value={name}>{name}</option>
                                ))}
                            </select>
                        </Row>
                    )}
                    <Row label="Lead Source" bold>
                        <select value={leadSource} onChange={e => setLeadSource(e.target.value)} className={sel}>
                            <option value="capital_co"></option>
                            <option value="direct">Direct</option>
                            <option value="referral">Referral</option>
                            <option value="broker">Broker</option>
                        </select>
                    </Row>
                    <Row label="Company Name" bold>
                        <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                            placeholder="Company Name" className={inp} />
                    </Row>
                    <Row label="Zip" bold>
                        <input type="text" value={zip} onChange={e => setZip(e.target.value)}
                            placeholder="90210" className={inp} />
                    </Row>
                    <Row label="Deductible (AOP/Theft)" bold>
                        <select value={deductible} onChange={e => setDeductible(e.target.value)} className={sel}>
                            <option>$1,000/$2,500</option>
                            <option>$2,500/$5,000</option>
                            <option>$5,000/$10,000</option>
                            <option>$10,000/$25,000</option>
                        </select>
                    </Row>
                    <Row label="# Inland Marine Losses in last 5 years" bold>
                        <select value={losses} onChange={e => setLosses(e.target.value)} className={sel}>
                            <option value="0">0</option>
                            <option value="1">1</option>
                            <option value="2">2</option>
                            <option value="3+">3+</option>
                        </select>
                    </Row>
                    <Row label="Years in Business" bold>
                        <input type="number" value={yearsInBusiness} onChange={e => setYearsInBusiness(e.target.value)}
                            placeholder="4" className={inp} />
                    </Row>
                    <Row label="Desired Effective Date" bold>
                        <input type="date" value={effectiveDate} onChange={e => setEffectiveDate(e.target.value)} className={inp} />
                    </Row>

                    {/* Bundle selector */}
                    <div className="bg-gray-100 rounded-lg p-5 my-5">
                        <div className="grid grid-cols-4 gap-4">
                            <BundleCard label="Bundle 1" price="$350" icon={<HammerIcon />} selected={bundle === 'bundle1'} onClick={() => setBundle('bundle1')} />
                            <BundleCard label="Bundle 2" price="$475" icon={<HammerIcon />} selected={bundle === 'bundle2'} onClick={() => setBundle('bundle2')} />
                            <BundleCard label="Custom" price="Varies" icon={<ListIcon />} selected={bundle === 'custom'} onClick={() => setBundle('custom')} />
                            <BundleCard label="Rental" price="$350" icon={<HammerIcon />} selected={bundle === 'rental'} onClick={() => setBundle('rental')} />
                        </div>
                        {/* Rental bundle fields */}
                        {bundle === 'rental' && (
                            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                                <Row label="Policy Duration">
                                    <select value={policyDuration} onChange={e => setPolicyDuration(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400 bg-white">
                                        <option>3 Months</option>
                                        <option>6 Months</option>
                                        <option>12 Months</option>
                                    </select>
                                </Row>
                                <Row label="Rented/Leased Equipment Limit">
                                    <input type="text" value={rentedEquipLimitRental} onChange={e => setRentedEquipLimitRental(e.target.value)}
                                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                            </div>
                        )}
                        {bundle === 'rental' && (
                            <div className="mt-4 rounded border border-gray-200 overflow-hidden">
                                {/* Header bar */}
                                <div className="flex items-center justify-between bg-[#3A3A3A] px-4 py-2.5">
                                    <span className="text-sm font-semibold text-white">Rented/Leased Equipment</span>
                                    <span className="text-sm font-semibold text-white">Remaining Limit: {rentedEquipLimitRental}.00</span>
                                </div>
                                {/* Action row */}
                                <div className="flex items-center justify-between px-4 py-3 bg-white">
                                    <button className="flex items-center gap-1.5 text-sm font-semibold text-[#7A6F64] hover:text-[#5A4F44] transition-colors">
                                        <span className="text-lg leading-none">+</span> Add Rented/Leased Item
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-400 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            Clear All
                                        </button>
                                        <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Set Limit
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Custom bundle fields */}
                        {bundle === 'custom' && (
                            <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                                <Row label="Miscellaneous Tools Limit">
                                    <input type="text" value={miscToolsLimit} onChange={e => setMiscToolsLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                                <Row label="Scheduled - Light/Medium Limit">
                                    <input type="text" value={lightMedLimit} onChange={e => setLightMedLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                                <Row label="Scheduled - Heavy Limit">
                                    <input type="text" value={heavyLimit} onChange={e => setHeavyLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                                <Row label="Rented/Leased Equipment Limit">
                                    <input type="text" value={rentedEquipLimit} onChange={e => setRentedEquipLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                                <Row label="Installation Floater Limit">
                                    <input type="text" value={installFloaterLimit} onChange={e => setInstallFloaterLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                                <Row label="Office Contents Limit">
                                    <input type="text" value={officeContentsLimit} onChange={e => setOfficeContentsLimit(e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-gray-400" />
                                </Row>
                            </div>
                        )}
                        {bundle === 'custom' && (
                            <>
                                <div className="mt-4 rounded border border-gray-200 overflow-hidden">
                                    <div className="flex items-center justify-between bg-[#3A3A3A] px-4 py-2.5">
                                        <span className="text-sm font-semibold text-white">Light/Medium Scheduled Equipment</span>
                                        <span className="text-sm font-semibold text-white">Remaining Limit: {lightMedLimit}.00</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 bg-white">
                                        <button className="flex items-center gap-1.5 text-sm font-semibold text-[#7A6F64] hover:text-[#5A4F44] transition-colors">
                                            <span className="text-lg leading-none">+</span> Add Light/Medium Item
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-400 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Clear All
                                            </button>
                                            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Set Limit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 rounded border border-gray-200 overflow-hidden">
                                    <div className="flex items-center justify-between bg-[#3A3A3A] px-4 py-2.5">
                                        <span className="text-sm font-semibold text-white">Heavy Scheduled Equipment</span>
                                        <span className="text-sm font-semibold text-white">Remaining Limit: {heavyLimit}.00</span>
                                    </div>
                                    <div className="flex items-center justify-between px-4 py-3 bg-white">
                                        <button className="flex items-center gap-1.5 text-sm font-semibold text-[#7A6F64] hover:text-[#5A4F44] transition-colors">
                                            <span className="text-lg leading-none">+</span> Add Heavy Item
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button className="flex items-center gap-1.5 px-4 py-1.5 border border-gray-400 text-gray-700 text-sm font-medium rounded hover:bg-gray-50 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Clear All
                                            </button>
                                            <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                Set Limit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </Section>

                {/* ═══ 2. Additional Interests ═══════════════════════════════ */}
                <Section title="Additional Interests">
                    <QRow label="Is there an additional lienholder?" value={hasLienholder} onChange={setHasLienholder} />
                    {hasLienholder === true && (
                        <div className="py-4 space-y-4">
                            <div>
                                <label className="text-sm font-bold text-gray-700 block mb-1">Please explain:</label>
                                <input type="text" value={lienholderExplain} onChange={e => setLienholderExplain(e.target.value)} className={`${inp} mb-3`} />
                            </div>
                            {interests.map((ai, i) => (
                                <div key={i} className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">Name</label>
                                            <input type="text" value={ai.name} onChange={e => updateAI(i, 'name', e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">Contract Number</label>
                                            <input type="text" value={ai.contractNumber} onChange={e => updateAI(i, 'contractNumber', e.target.value)} className={inp} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-5 gap-3">
                                        <div className="col-span-2">
                                            <label className="text-sm font-bold text-gray-700 block mb-1">Address</label>
                                            <input type="text" value={ai.address} onChange={e => updateAI(i, 'address', e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">Apt/Suite</label>
                                            <input type="text" value={ai.aptSuite} onChange={e => updateAI(i, 'aptSuite', e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">Zip</label>
                                            <input type="text" value={ai.zip} onChange={e => updateAI(i, 'zip', e.target.value)} className={inp} />
                                        </div>
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">City</label>
                                            <input type="text" value={ai.city} onChange={e => updateAI(i, 'city', e.target.value)} className={inp} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-5 gap-3">
                                        <div>
                                            <label className="text-sm font-bold text-gray-700 block mb-1">State</label>
                                            <input type="text" value={ai.state} onChange={e => updateAI(i, 'state', e.target.value)} className={inp} />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 pt-2">
                                        {interests.length > 1 && (
                                            <button onClick={() => removeAI(i)} className="px-5 py-2 border border-red-200 text-red-500 hover:bg-red-50 text-sm font-semibold rounded transition-colors">
                                                Remove
                                            </button>
                                        )}
                                        <button className="px-6 py-2 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors">
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <button onClick={() => setInterests(prev => [...prev, emptyAI()])}
                                className="flex items-center gap-2 text-sm font-semibold text-teal-500 hover:text-teal-700 transition-colors mt-2">
                                <Plus size={16} className="rounded-full border-2 border-current" />
                                Add Additional Interest
                            </button>
                        </div>
                    )}
                </Section>

                {/* ═══ 3. Endorsements ════════════════════════════════════════ */}
                <Section title="Endorsements">
                    <div className="py-3">
                        <label className="flex items-center gap-3 border border-gray-200 rounded px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={terrorism} onChange={e => setTerrorism(e.target.checked)}
                                className="w-5 h-5 rounded accent-gray-700" />
                            <span className="text-sm text-gray-700">Acts of Terrorism</span>
                        </label>
                    </div>
                </Section>

                {/* ═══ 4. Additional Business Info ════════════════════════════ */}
                <Section title="Additional Business Info">
                    <QRow label="Has insurance for this risk ever been cancelled?" value={cancelled} onChange={setCancelled} explainValue={cancelledExplain} onExplainChange={setCancelledExplain} />
                    <QRow label="Have you filed for bankruptcy in the past 5 years?" value={bankruptcy} onChange={setBankruptcy} explainValue={bankruptcyExplain} onExplainChange={setBankruptcyExplain} />
                    <QRow label="Have you had more than one Inland Marine contractor's equipment loss in the past three years?" value={moreThanOneLoss} onChange={setMoreThanOneLoss} explainValue={lossExplain} onExplainChange={setLossExplain} />
                    <QRow label="Do you own or rent asphalt plants or cranes?" value={asphaltCranes} onChange={setAsphaltCranes} explainValue={asphaltExplain} onExplainChange={setAsphaltExplain} />
                    <QRow label="Do your operations include or require any tandem lifting?" value={tandemLifting} onChange={setTandemLifting} explainValue={tandemExplain} onExplainChange={setTandemExplain} />
                    <QRow label="Any operations next to or over water?" value={overWater} onChange={setOverWater} explainValue={waterExplain} onExplainChange={setWaterExplain} />
                    <QRow label="Any oilfield support operations?" value={oilfield} onChange={setOilfield} explainValue={oilfieldExplain} onExplainChange={setOilfieldExplain} />
                    <QRow label="Any demolition and/or blasting work?" value={demolition} onChange={setDemolition} explainValue={demolitionExplain} onExplainChange={setDemolitionExplain} />
                    <QRow label="Is your equipment garaged at your physical location?" value={garaged} onChange={setGaraged} />
                    <QRow label="Is any of your equipment, scheduled or otherwise, a stump grinder?" value={stumpGrinder} onChange={setStumpGrinder} explainValue={stumpExplain} onExplainChange={setStumpExplain} />
                    <QRow label="Will you rent or lease your equipment to others?" value={rentToOthers} onChange={setRentToOthers} explainValue={rentExplain} onExplainChange={setRentExplain} />
                    <QRow
                        label="Will you perform or subcontract any work involving (including but not limited to construction or repair of) the following: blasting, wrecking, or demolition operations; chimney construction or smoke stack lining; foundry operations (any type); fuel tanks; liquefied petrochemical gases or gasoline; oil fields; pipelines; transportation of fuels/explosives/butane/propane?"
                        value={subcontractHazardous} onChange={setSubcontractHazardous} explainValue={hazardousExplain} onExplainChange={setHazardousExplain}
                    />
                    <QRow
                        label="Will you perform or subcontract any work involving (including but not limited to construction or repair of) the following: agricultural or farming operations; iron or steel rolling mill; logging/lumbering/sawmills; quarries and mining operations; silica, flint, spar grinding; stone cutting or polishing or crushing?"
                        value={subcontractAgri} onChange={setSubcontractAgri} explainValue={agriExplain} onExplainChange={setAgriExplain}
                    />
                    <QRow
                        label="Will you perform or subcontract any work involving (including but not limited to construction or repair of) the following: bridges; dams/levees; dredging; USL&H Exposures; Jones Act Exposures; marine salvage operations; marine wrecking; offshore exposures; ocean marine, when written as such; shoring buildings; public utilities – electric, gas, telephone, traffic signs, etc.?"
                        value={subcontractBridges} onChange={setSubcontractBridges} explainValue={bridgesExplain} onExplainChange={setBridgesExplain}
                    />
                    <QRow
                        label="Will you perform or subcontract any work or use equipment involving (including but not limited to use, rental, construction, or repair of) the following: drones; manufacturing equipment; homemade or altered equipment?"
                        value={subcontractDrones} onChange={setSubcontractDrones} explainValue={dronesExplain} onExplainChange={setDronesExplain}
                    />
                    <QRow
                        label="Will you perform or subcontract any work or use equipment involving (including but not limited to use, rental, construction, or repair of) the following: street legal trailers or any equipment which is licensed and tagged for public road use; equipment permanently affixed to a trailer (bolted or welded); street legal bucket trucks?"
                        value={subcontractTrailers} onChange={setSubcontractTrailers} explainValue={trailersExplain} onExplainChange={setTrailersExplain}
                    />
                </Section>

                {/* ═══ 5. Payment Options ════════════════════════════════════ */}
                <Section title="Payment Options">
                    <Row label="Broker Fee" bold>
                        <input type="text" value={brokerFee} onChange={e => setBrokerFee(e.target.value)} className={inp} />
                    </Row>
                    <div className="flex items-center py-5 gap-6 border-b border-gray-50">
                        <div className="w-[45%] shrink-0">
                            <span className="text-sm font-bold text-gray-700">Display Broker Fee Line on Retail Proposal?</span>
                        </div>
                        <div className="flex-1 flex items-center gap-6 text-sm text-gray-700">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={displayBrokerFee === true} onChange={() => setDisplayBrokerFee(true)} className="w-4 h-4 accent-gray-700" />
                                Yes
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" checked={displayBrokerFee === false} onChange={() => setDisplayBrokerFee(false)} className="w-4 h-4 accent-gray-700" />
                                No
                            </label>
                        </div>
                    </div>
                    <Row label="Payment Options" bold>
                        <select value={paymentOption} onChange={e => setPaymentOption(e.target.value)} className={sel}>
                            <option value=""></option>
                            <option value="full">Full Payment</option>
                            <option value="installment">Installment</option>
                            <option value="financing">Premium Financing</option>
                        </select>
                    </Row>
                </Section>

                {/* ═══ 6. Company Information ════════════════════════════════ */}
                <Section title="Company Information">
                    <Row label="License #">
                        <input type="text" value={licenseNum} onChange={e => setLicenseNum(e.target.value)} className={inp} />
                    </Row>
                    <Row label="License Classification">
                        <input type="text" value={licenseClass} onChange={e => setLicenseClass(e.target.value)} className={inp} />
                    </Row>
                    <Row label="DBA">
                        <input type="text" value={dba} onChange={e => setDba(e.target.value)} placeholder="Doing Business As" className={inp} />
                    </Row>
                    <Row label="First Name" bold>
                        <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="First Name" className={inp} />
                    </Row>
                    <Row label="Last Name" bold>
                        <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Last Name" className={inp} />
                    </Row>
                    <Row label="Years of Experience">
                        <input type="text" value={yearsExp} onChange={e => setYearsExp(e.target.value)} placeholder="6" className={inp} />
                    </Row>
                    <Row label="Estimated Total Gross Receipts">
                        <input type="text" value={grossReceipts} onChange={e => setGrossReceipts(e.target.value)} placeholder="$500,000" className={inp} />
                    </Row>
                    <Row label="Entity of Company">
                        <select value={entityType} onChange={e => setEntityType(e.target.value)} className={sel}>
                            <option>Individual</option>
                            <option>Corporation</option>
                            <option>Partnership</option>
                            <option>LLC</option>
                            <option>Other</option>
                        </select>
                    </Row>
                    <Row label="Applicant SSN">
                        <input type="text" value={ssn} onChange={e => setSsn(e.target.value)} placeholder="111-22-1234" className={inp} />
                    </Row>
                    <Row label="Applicant DL #">
                        <input type="text" value={dlNum} onChange={e => setDlNum(e.target.value)} placeholder="111-22-1234" className={inp} />
                    </Row>
                    <Row label="Applicant Phone" bold>
                        <input type="text" value={phone} onChange={e => setPhone(e.target.value)} placeholder="123-456-7890" className={inp} />
                    </Row>
                    <Row label="Applicant Fax">
                        <input type="text" value={fax} onChange={e => setFax(e.target.value)} placeholder="123-456-7890" className={inp} />
                    </Row>
                    <Row label="Applicant Email" bold>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="insured@example.com" className={inp} />
                    </Row>

                    {/* Full-width fields */}
                    <div className="py-5 border-b border-gray-50">
                        <label className="text-sm text-gray-700 block mb-2">
                            Complete description of operations for which you are currently applying for insurance:
                        </label>
                        <textarea value={opsDescription} onChange={e => setOpsDescription(e.target.value)}
                            className={`${inp} min-h-[80px]`} />
                    </div>
                    <div className="py-5">
                        <label className="text-sm text-gray-700 block mb-2">
                            States in which you do business for which you are currently applying for insurance:
                        </label>
                        <StatesMultiSelect selected={statesOfBusiness} onChange={setStatesOfBusiness} />
                    </div>
                </Section>

                {/* ═══ 7. Applicant Physical Location ════════════════════════ */}
                <Section title="Applicant Physical Location">
                    <div className="py-5 border-b border-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                            <label className="text-sm font-bold text-gray-700">Address</label>
                            <span className="w-5 h-5 rounded-full bg-teal-400 text-white text-xs flex items-center justify-center font-bold cursor-help" title="Enter your physical street address">?</span>
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={physAddress}
                                onChange={e => handleAddressSearch(e.target.value, 'physical')}
                                placeholder="Start typing address..."
                                className={inp}
                                autoComplete="off"
                            />
                            {/* Loading */}
                            {addressLoading && activeSearchType === 'physical' && (
                                <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                            )}

                            {/* Dropdown */}
                            {showSuggestions && activeSearchType === 'physical' && addressSuggestions.length > 0 && (
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
                                            <span className="font-medium text-gray-900">{suggestion.street_line} {suggestion.secondary}</span>
                                            <span className="text-gray-500 ml-1">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <Row label="Apt/Suite">
                        <input type="text" value={physApt} onChange={e => setPhysApt(e.target.value)}
                            placeholder="Apt. #24" className={inp} />
                    </Row>
                </Section>

                {/* ═══ 8. Applicant Mailing Address ══════════════════════════ */}
                <Section title="Applicant Mailing Address">
                    <div className="py-4 border-b border-gray-50">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={sameAsMailing} onChange={e => setSameAsMailing(e.target.checked)}
                                className="w-4 h-4 accent-teal-500 rounded" />
                            <span className="text-sm font-bold text-gray-700">Same as physical location</span>
                        </label>
                    </div>
                    {!sameAsMailing && (
                        <div className="pb-4 space-y-1">
                            {/* Street Address - full width */}
                            <div className="py-4 border-b border-gray-50">
                                <label className="text-sm font-bold text-gray-700 block mb-2">Street Address</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={mailAddress}
                                        onChange={e => handleAddressSearch(e.target.value, 'mailing')}
                                        className={inp}
                                        placeholder="Start typing address..."
                                        autoComplete="off"
                                    />
                                    {/* Loading indicator */}
                                    {addressLoading && activeSearchType === 'mailing' && (
                                        <div className="absolute right-3 top-2.5 text-xs text-gray-400">Searching...</div>
                                    )}

                                    {/* Dropdown for Mailing */}
                                    {showSuggestions && activeSearchType === 'mailing' && addressSuggestions.length > 0 && (
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
                                                    <span className="font-medium text-gray-900">{suggestion.street_line} {suggestion.secondary}</span>
                                                    <span className="text-gray-500 ml-1">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {/* Apt/Suite */}
                            <Row label="Apt/Suite">
                                <input type="text" value={mailApt} onChange={e => setMailApt(e.target.value)} placeholder="Apt. #24" className={inp} />
                            </Row>
                            {/* Zip with validation */}
                            <Row label="Zip">
                                <div>
                                    <input type="text" value={mailZip} onChange={e => handleMailZip(e.target.value)}
                                        placeholder="90210"
                                        className={`${inp} ${mailZipError ? 'border-red-400 focus:border-red-400' : ''}`} />
                                    {mailZipError && (
                                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                            <span>⚠</span> Not a valid zip.
                                        </p>
                                    )}
                                </div>
                            </Row>
                            {/* City */}
                            <Row label="City">
                                <input type="text" value={mailCity} onChange={e => setMailCity(e.target.value)} placeholder="Mainville" className={inp} />
                            </Row>
                            {/* State — read-only, determined from zip */}
                            <Row label="State">
                                <input type="text" readOnly placeholder="Determined from Zip" value={mailState}
                                    className={`${inp} bg-gray-100 text-gray-400 cursor-not-allowed`} />
                            </Row>
                        </div>
                    )}
                </Section>
                </fieldset>
                </form>

                {/* ═══ Fixed bottom bar ═══════════════════════════════════════════════ */}
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between z-50">
                    <button onClick={() => router.back()}
                        className="px-6 py-2.5 border border-gray-400 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors">
                        Return to Dashboard
                    </button>
                    <div className="flex items-center gap-3">
                        <button type="button" disabled className="flex items-center gap-2 px-6 py-2.5 border border-gray-400 text-gray-700 text-sm font-semibold rounded hover:bg-gray-50 transition-colors opacity-50 cursor-not-allowed">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Download PDF
                        </button>
                        
                        {!isViewMode && (
                            <button type="submit" form="contractors-form" disabled={isSubmitting} className="flex items-center gap-2 px-6 py-2.5 bg-[#7A6F64] hover:bg-[#6A5F54] text-white text-sm font-semibold rounded transition-colors disabled:opacity-50">
                                {isSubmitting ? (
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {isSubmitting ? "Submitting..." : isEditMode ? "Update Application" : "Submit Application"}
                            </button>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default function ContractorsEquipmentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block w-8 h-8 border-4 border-[#7A6F64] border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-500 font-medium text-sm">Loading Application...</p>
                </div>
            </div>
        }>
            <ContractorsEquipmentContent />
        </Suspense>
    )
}
