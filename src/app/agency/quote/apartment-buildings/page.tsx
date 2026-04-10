"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
    AtSign
} from "lucide-react";

export default function ApartmentBuildingsSubmission() {
    const router = useRouter();
    const [currentView, setCurrentView] = useState<'overview' | 'insured-info'>('overview');
    const [appExpanded, setAppExpanded] = useState(true);
    const [quoteExpanded, setQuoteExpanded] = useState(false);
    const [policyExpanded, setPolicyExpanded] = useState(false);
    const [insuredInfoCompleted, setInsuredInfoCompleted] = useState(false);
    const [insuredInfoCompletedAt, setInsuredInfoCompletedAt] = useState<string | null>(null);
    const [appId, setAppId] = useState<string | null>(null);
    const [lastEditedAt, setLastEditedAt] = useState<string | null>(null);

    // Form State
    const [entityTypeOpen, setEntityTypeOpen] = useState(false);
    const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
    const [submitClicked, setSubmitClicked] = useState(false);

    // Define comprehensive formData for all inputs
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        entityType: "",
        email: "",
        phone: "",
        streetAddress: "",
        aptSuite: "",
        city: "",
        state: "California",
        zip: ""
    });

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const formatPhone = (value: string) => {
        if (!value) return value;
        const phone = value.replace(/[^\d]/g, '');
        if (phone.length < 4) return phone;
        if (phone.length < 7) {
            return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
        }
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    };

    const validatePhone = (value: string, field: string) => {
        const phone = value.replace(/[^\d]/g, '');
        if (phone.length > 0 && phone.length < 10) {
            setValidationErrors(prev => ({ ...prev, [field]: 'Incomplete phone number' }));
        } else {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validateEmail = (value: string, field: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            setValidationErrors(prev => ({ ...prev, [field]: 'Invalid email address' }));
        } else {
            setValidationErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const isFieldInvalid = (field: keyof typeof formData) => {
        if (!submitClicked) return false;
        // Required fields
        const required = ['firstName', 'lastName', 'entityType', 'streetAddress', 'city', 'state', 'zip'];
        if (required.includes(field) && !formData[field]) return true;
        // Format errors (phone, email)
        if (validationErrors[field]) return true;
        return false;
    };

    const dropdownRef = useRef<HTMLDivElement>(null);
    const suggestionRef = useRef<HTMLDivElement>(null);
    const addressInputRef = useRef<HTMLInputElement>(null);

    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [addressLoading, setAddressLoading] = useState(false);

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

    const entityTypes = [
        "Corporation",
        "Individual/Sole Proprietor",
        "Join Venture",
        "LLC",
        "Partnership",
        "Subchapter 'S' Corp"
    ];

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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setEntityTypeOpen(false);
            }
            if (suggestionRef.current && !suggestionRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const renderOverview = () => (
        <div className="max-w-4xl mx-auto py-4 animate-in fade-in duration-500">
            {/* Header */}
            <h1 className="text-[28px] font-medium text-center mb-12 text-gray-900 tracking-tight">Submission</h1>

            {/* Main Content Layout with Timeline */}
            <div className="relative pl-12">
                {/* Vertical Line for Timeline */}
                <div className="absolute left-[15px] top-6 bottom-6 w-[2px] bg-gray-100"></div>

                <div className="space-y-6">
                    {/* Application Card */}
                    <div className="relative">
                        {/* Timeline Marker */}
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full border-2 border-gray-500 bg-white z-10 ring-4 ring-[#fafaf9]"></div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            {/* Application Header */}
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                                onClick={() => setAppExpanded(!appExpanded)}
                            >
                                <div className="flex items-center gap-3 text-gray-700">
                                    <FileText className="w-5 h-5 text-[#9A8B7A]" />
                                    <span className="font-medium text-[16px]">Application</span>
                                </div>
                                {appExpanded ? <ChevronUp className="w-5 h-5 text-gray-800" /> : <ChevronDown className="w-5 h-5 text-gray-800" />}
                            </div>

                            {/* Application Content */}
                            {appExpanded && (
                                <div className="border-t border-gray-100 p-6 sm:p-8 space-y-10">
                                    {/* Insured Info Section */}
                                    <div className="flex flex-col items-end gap-1">
                                        <div className="flex items-center justify-between w-full">
                                            <h3 className="text-[17px] text-gray-600">Insured Info</h3>
                                            <button
                                                onClick={() => setCurrentView('insured-info')}
                                                className={`px-6 py-1.5 border rounded-md text-sm font-medium transition-all active:scale-95 ${insuredInfoCompleted ? 'border-gray-300 text-gray-700 hover:bg-gray-50' : 'bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white shadow-sm'}`}
                                            >
                                                {insuredInfoCompleted ? 'Review' : 'Start'}
                                            </button>
                                        </div>
                                        {insuredInfoCompleted && insuredInfoCompletedAt && (
                                            <p className="text-[12px] text-[#9A8B7A] font-medium">Completed {insuredInfoCompletedAt}</p>
                                        )}
                                    </div>

                                    {/* Coverages Section */}
                                    <div>
                                        <h3 className="text-[17px] text-gray-600 mb-4">Coverages</h3>

                                        {/* Table */}
                                        <div className="border border-gray-200 rounded-lg text-sm overflow-hidden flex flex-col">
                                            {/* Table Header */}
                                            <div className="grid grid-cols-[2fr_1fr_1fr_100px] gap-4 items-center bg-[#e5e7eb] px-5 py-2.5 font-[600] text-[11px] text-gray-600 uppercase tracking-widest">
                                                <div className="flex items-center gap-2"><Shield className="w-3.5 h-3.5 fill-current" /> TYPE</div>
                                                <div className="flex items-center gap-2"><FileIcon className="w-3.5 h-3.5 fill-current" /> APP ID</div>
                                                <div className="flex items-center gap-2"><CircleDot className="w-3.5 h-3.5 fill-current" /> STATUS</div>
                                                <div></div>
                                            </div>

                                            {/* Table Row */}
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
                                                    <span className={`px-2.5 py-1.5 text-[12px] rounded font-semibold whitespace-nowrap ${insuredInfoCompleted ? 'bg-[#f1f5f9] text-[#64748b]' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
                                                        {insuredInfoCompleted ? 'In Progress' : 'Not Started'}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <button
                                                        className={`px-6 py-1.5 rounded-md text-sm font-medium transition-all active:scale-95 ${insuredInfoCompleted ? 'bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white shadow-sm' : 'border border-gray-300 text-gray-400 cursor-not-allowed bg-white'}`}
                                                        disabled={!insuredInfoCompleted}
                                                    >
                                                        Continue
                                                    </button>
                                                </div>
                                            </div>
                                            {insuredInfoCompleted && lastEditedAt && (
                                                <div className="px-5 py-2 border-t border-gray-100 flex justify-end">
                                                    <p className="text-[12px] text-[#9A8B7A] font-medium text-right">Edited {lastEditedAt}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quote Summary Card */}
                    <div className="relative">
                        {/* Timeline Marker */}
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#f1f5f9] z-10 border-4 border-[#fafaf9]"></div>

                        <div className="bg-[#f8fafc] rounded-xl border border-[#f1f5f9] overflow-hidden opacity-90">
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                                onClick={() => setQuoteExpanded(!quoteExpanded)}
                            >
                                <div className="flex items-center gap-3 text-[#94a3b8]">
                                    <DollarSign className="w-5 h-5 font-bold" />
                                    <span className="font-semibold text-[15px]">Quote Summary</span>
                                </div>
                                {quoteExpanded ? <ChevronUp className="w-5 h-5 text-[#94a3b8]" /> : <ChevronDown className="w-5 h-5 text-[#94a3b8]" />}
                            </div>
                        </div>
                    </div>

                    {/* Policy Summary Card */}
                    <div className="relative">
                        {/* Timeline Marker */}
                        <div className="absolute left-[-39px] top-[26px] transform -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#f1f5f9] z-10 border-4 border-[#fafaf9]"></div>

                        <div className="bg-[#f8fafc] rounded-xl border border-[#f1f5f9] overflow-hidden opacity-90">
                            <div
                                className="flex items-center justify-between p-5 cursor-pointer hover:bg-[#f1f5f9] transition-colors"
                                onClick={() => setPolicyExpanded(!policyExpanded)}
                            >
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

    const renderInsuredInfo = () => (
        <div className="max-w-[950px] mx-auto py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-10">
                {/* Insured Info Section */}
                <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
                    <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                        <h2 className="text-lg font-semibold">Insured Info</h2>
                    </div>
                    <div className="px-8 pt-6 pb-7">
                        <div className="space-y-6 mt-1">
                            
                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    Insured first name <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('firstName') ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    Insured last name <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.lastName}
                                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('lastName') ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <div className="relative" ref={dropdownRef}>
                                    <label className="text-sm font-medium text-gray-900">
                                        Entity type <span className="text-red-500">*</span>
                                    </label>
                                </div>
                                <div></div>
                                <div className="relative">
                                    <div
                                        className={`w-full bg-white flex items-center justify-between rounded px-4 py-2.5 text-sm cursor-pointer transition-all border ${entityTypeOpen ? 'border-[#9A8B7A] ring-1 ring-[#9A8B7A]' : isFieldInvalid('entityType') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}`}
                                        onClick={() => setEntityTypeOpen(!entityTypeOpen)}
                                    >
                                        <span className={formData.entityType ? "text-gray-900" : "text-gray-400"}>{formData.entityType || "Select entity type"}</span>
                                        {entityTypeOpen ? <ChevronUp className="w-5 h-5 text-gray-800" /> : <ChevronDown className="w-5 h-5 text-gray-800" />}
                                    </div>
                                    {entityTypeOpen && (
                                        <div className="absolute top-[100%] left-0 w-full mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 py-1 max-h-60 overflow-y-auto">
                                            {entityTypes.map((type) => (
                                                <div
                                                    key={type}
                                                    className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                                                    onClick={() => {
                                                        handleInputChange('entityType', type);
                                                        setEntityTypeOpen(false);
                                                    }}
                                                >
                                                    {type}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">Email address</label>
                                <div></div>
                                <div className="relative">
                                    <input
                                        type="email"
                                        placeholder="admin@company.com"
                                        value={formData.email}
                                        onChange={(e) => {
                                            handleInputChange('email', e.target.value);
                                            validateEmail(e.target.value, 'email');
                                        }}
                                        className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {validationErrors.email && (
                                        <div className="absolute -bottom-5 left-0 text-[11px] text-red-500 font-medium">{validationErrors.email}</div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">Phone number</label>
                                <div></div>
                                <div className="relative">
                                    <input
                                        type="tel"
                                        placeholder="(123) 456-7890"
                                        value={formData.phone}
                                        onChange={(e) => {
                                            const formatted = formatPhone(e.target.value);
                                            handleInputChange('phone', formatted);
                                            validatePhone(formatted, 'phone');
                                        }}
                                        maxLength={14}
                                        className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                    />
                                    {validationErrors.phone && (
                                        <div className="absolute -bottom-5 left-0 text-[11px] text-red-500 font-medium">{validationErrors.phone}</div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* Physical Address Section */}
                <div className="bg-white rounded shadow-md overflow-hidden border border-gray-200">
                    <div className="bg-[#7A6F64] text-white px-6 py-3.5">
                        <h2 className="text-lg font-semibold">Physical Address</h2>
                    </div>
                    <div className="px-8 pt-6 pb-7">
                        <div className="space-y-6 mt-1">
                            
                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    Street Address <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <div className="relative">
                                    <input
                                        ref={addressInputRef}
                                        type="text"
                                        value={formData.streetAddress}
                                        onChange={(e) => handleAddressSearch(e.target.value)}
                                        className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('streetAddress') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                        placeholder="Start typing address..."
                                        autoComplete="off"
                                    />
                                    {addressLoading && (
                                        <div className="absolute right-3.5 top-3 text-xs text-gray-400">Searching...</div>
                                    )}
                                    {showSuggestions && addressSuggestions.length > 0 && (
                                        <div
                                            ref={suggestionRef}
                                            className="absolute z-50 w-full bg-white border border-gray-200 rounded shadow-lg mt-1 max-h-60 overflow-y-auto"
                                        >
                                            {addressSuggestions.map((suggestion, index) => (
                                                <div
                                                    key={index}
                                                    onMouseDown={() => handleSelectSuggestion(suggestion)}
                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b border-gray-100 last:border-0"
                                                >
                                                    <span className="font-medium text-gray-900">{suggestion.street_line} {suggestion.secondary}</span>
                                                    <span className="text-gray-500 ml-1 block text-xs">{suggestion.city}, {suggestion.state} {suggestion.zipcode}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">Apt/Suite</label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.aptSuite}
                                    onChange={(e) => handleInputChange('aptSuite', e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm"
                                    placeholder="Apt. #24"
                                />
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('city') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    State <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={(e) => handleInputChange('state', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('state') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>

                            <div className="grid grid-cols-[200px_1fr_320px] gap-x-6 items-center">
                                <label className="text-sm font-medium text-gray-900">
                                    Zip Code <span className="text-red-500">*</span>
                                </label>
                                <div></div>
                                <input
                                    type="text"
                                    value={formData.zip}
                                    onChange={(e) => handleInputChange('zip', e.target.value)}
                                    className={`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm ${isFieldInvalid('zip') ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                                />
                            </div>

                        </div>
                    </div>
                </div>

                {/* Continue Actions */}
                <div className="flex justify-end pt-4">
                    <button
                        onClick={() => {
                            setSubmitClicked(true);
                            const required = ['firstName', 'lastName', 'entityType', 'streetAddress', 'city', 'state', 'zip'];
                            const missing = required.filter(f => !formData[f as keyof typeof formData]);
                            const hasErrors = Object.values(validationErrors).some(err => err !== '');

                            if (missing.length > 0 || hasErrors) {
                                toast.error("Please fill in all required fields and correct any errors.");
                                return;
                            }

                            const now = new Date();
                            const formattedDate = now.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });
                            const formattedTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
                            const fullTimestamp = `${formattedDate} ${formattedTime}`;

                            setInsuredInfoCompleted(true);
                            setInsuredInfoCompletedAt(fullTimestamp);
                            setLastEditedAt(fullTimestamp);
                            if (!appId) {
                                setAppId(Math.floor(1000000 + Math.random() * 9000000).toString());
                            }
                            setCurrentView('overview');
                            window.scrollTo(0, 0);
                        }}
                        className="px-8 py-2.5 bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white font-medium rounded shadow-sm transition-all flex items-center gap-2 text-sm"
                    >
                        Continue
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white md:bg-[#fafaf9] p-4 md:p-8 font-sans text-gray-800 overflow-x-hidden">
            <button
                onClick={() => currentView === 'insured-info' ? setCurrentView('overview') : router.back()}
                className="flex items-center text-gray-500 hover:text-[#9A8B7A] transition-colors mb-6 font-medium text-sm w-fit"
            >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
            </button>

            {currentView === 'overview' ? renderOverview() : renderInsuredInfo()}
        </div>
    );
}
