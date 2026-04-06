const fs = require('fs');
const filepath = 'src/app/admin/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add availablePolicies state
content = content.replace(
  'const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");',
  'const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");\n  const [availablePolicies, setAvailablePolicies] = useState<string[]>([]);'
);

// 2. Add useEffect for availablePolicies
content = content.replace(
  'useEffect(() => {\n    if (status === "authenticated" && submissionId) {',
  'useEffect(() => {\n    if (data?.quotes) {\n      const types = Array.from(new Set(data.quotes.map((q: any) => q.policyType || "GENERAL_LIABILITY")));\n      setAvailablePolicies(types as string[]);\n      if (types.length > 0 && !types.includes(currentPolicyType)) {\n        setCurrentPolicyType(types[0] as any);\n      }\n    }\n  }, [data]);\n\n  useEffect(() => {\n    if (status === "authenticated" && submissionId) {'
);

// 3. Add Global Carrier Selector in Header
const headerTarget = `<div className="flex items-center gap-4 pr-8">
              <span className="text-[14px] text-gray-500">
                App ID {submission.submissionNumber}
              </span>
            </div>`;

const headerReplacement = `<div className="flex items-center gap-6 pr-8">
              {/* Global Carrier Selector */}
              {policyQuotes.length > 0 && (
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
                  <span className="text-[12px] font-bold text-gray-500 uppercase tracking-wider">Carrier:</span>
                  <select
                    value={selectedQuoteId || ""}
                    onChange={(e) => setSelectedQuoteId(e.target.value)}
                    className="bg-transparent text-gray-900 text-[14px] font-bold outline-none cursor-pointer min-w-[200px]"
                  >
                    {policyQuotes.map((quote: any) => (
                      <option key={quote._id} value={quote._id}>
                        {quote.carrierId?.name || "Unknown Carrier"} ({formatCurrency(quote.finalAmountUSD)})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <span className="text-[14px] text-gray-500 font-medium">
                App ID {submission.submissionNumber}
              </span>
            </div>`;

content = content.replace(headerTarget, headerReplacement);

// 4. Add Policy Selector UI above App Info row
const actionRowStart = `{/* Action Row */}`;
const policySelectorUI = `{/* Policy Selector */}
        {availablePolicies.length > 1 && (
          <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center gap-4 shadow-sm">
            <span className="text-[13px] font-bold text-gray-500 uppercase tracking-wider">Policy Type:</span>
            <div className="flex gap-2">
              {availablePolicies.map((type: any) => (
                <button
                  key={type}
                  onClick={() => setCurrentPolicyType(type)}
                  className={\`px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all \${
                    currentPolicyType === type
                      ? "bg-[#7A6F64] text-white shadow-md shadow-gray-200"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }\`}
                >
                  {type === "GENERAL_LIABILITY" ? "General Liability" : "Excess Liability"}
                </button>
              ))}
            </div>
          </div>
        )}\n\n        `;

content = content.replace(actionRowStart, policySelectorUI + actionRowStart);

// 5. Update Metadata Table
// Program Name -> Actually Program Name
content = content.replace(
  '<p className="font-semibold text-gray-900 break-words">{(submission?.clientContact?.name || "???")}</p>',
  '<p className="font-semibold text-gray-900 break-words">{submission.programName || "General Liability"}</p>'
);

// Effective Date
content = content.replace(
  `<p className="font-semibold text-gray-900">
                {submission.effectiveDate
                  ? new Date(submission.effectiveDate).toLocaleDateString()
                  : (quotes?.find((q: any) => q.status === "BOUND")?.effectiveDate
                      ? new Date(quotes.find((q: any) => q.status === "BOUND").effectiveDate).toLocaleDateString()
                      : (submission?.createdAt ? new Date(submission.createdAt) : new Date()).toLocaleDateString())}
              </p>`,
  `<p className="font-semibold text-gray-900">
                {currentQuote?.effectiveDate 
                  ? new Date(currentQuote.effectiveDate).toLocaleDateString()
                  : (submission.effectiveDate ? new Date(submission.effectiveDate).toLocaleDateString() : "TBD")}
              </p>`
);

// Total Cost
content = content.replace(
  '<p className="font-semibold text-gray-900">\n                {formatCurrency(quotes?.[0]?.finalAmountUSD)}\n              </p>',
  '<p className="font-semibold text-gray-900">\n                {formatCurrency(currentQuote?.finalAmountUSD)}\n              </p>'
);

// Carrier Name
content = content.replace(
  '<p className="font-semibold text-gray-900">\n                {quotes?.find((q: any) => q.carrierId?._id === submission.selectedCarrierId)?.carrierId?.name || quotes?.[0]?.carrierId?.name || "Carrier"}\n              </p>',
  '<p className="font-semibold text-gray-900">\n                {currentQuote?.carrierId?.name || "Carrier"}\n              </p>'
);

// Policy Number
content = content.replace(
  '<p className="font-semibold text-gray-900">{submission.policyNumber || quotes?.find((q: any) => q.status === "BOUND")?.policyNumber || quotes?.find((q: any) => q.policyNumber)?.policyNumber || "N/A"}</p>',
  '<p className="font-semibold text-gray-900">{currentQuote?.policyNumber || submission.policyNumber || "N/A"}</p>'
);

// 6. Update PDF buttons to pass quoteId
content = content.replace(/\/api\/admin\/submissions\/\$\{submissionId\}\/proposal`/g, '/api/admin/submissions/${submissionId}/proposal?quoteId=${currentQuote?._id || ""}`');
content = content.replace(/\/api\/admin\/submissions\/\$\{submissionId\}\/invoice`/g, '/api/admin/submissions/${submissionId}/invoice?quoteId=${currentQuote?._id || ""}`');
content = content.replace(/\/api\/admin\/submissions\/\$\{submissionId\}\/pdf`/g, '/api/admin/submissions/${submissionId}/pdf?quoteId=${currentQuote?._id || ""}`');

fs.writeFileSync(filepath, content);
console.log('Admin UI fixed!');
