const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', 'agency', 'quote', 'apartment-buildings', 'page.tsx');
let code = fs.readFileSync(filePath, 'utf8');

const newRenderInsuredInfo = `const renderInsuredInfo = () => (
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
                                    className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('firstName') ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300'}\`}
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
                                    className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('lastName') ? 'border-red-300 bg-red-50 focus:border-red-400' : 'border-gray-300'}\`}
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
                                        className={\`w-full bg-white flex items-center justify-between rounded px-4 py-2.5 text-sm cursor-pointer transition-all border \${entityTypeOpen ? 'border-[#9A8B7A] ring-1 ring-[#9A8B7A]' : isFieldInvalid('entityType') ? 'border-red-300 bg-red-50' : 'border-gray-300 hover:border-gray-400'}\`}
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
                                        className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                                        className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${validationErrors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                                        className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('streetAddress') ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                                    className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('city') ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                                    className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('state') ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                                    className={\`w-full px-4 py-2.5 border rounded focus:ring-1 focus:ring-[#9A8B7A] focus:border-[#9A8B7A] text-sm \${isFieldInvalid('zip') ? 'border-red-300 bg-red-50' : 'border-gray-300'}\`}
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
                            const fullTimestamp = \`\${formattedDate} \${formattedTime}\`;

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
    );`;

// Regex replacement
const regex = /const renderInsuredInfo = \(\) => \([\s\S]*?\n    \);/g;
if (regex.test(code)) {
    code = code.replace(regex, newRenderInsuredInfo);
    fs.writeFileSync(filePath, code);
    console.log("Successfully updated apartment-buildings/page.tsx");
} else {
    console.error("Could not find renderInsuredInfo");
    process.exit(1);
}
