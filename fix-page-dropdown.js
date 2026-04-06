const fs = require('fs');
const filepath = 'src/app/agency/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add `selectedQuoteId` to state variables
content = content.replace(
  'const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY" | "INLAND_MARINE">("GENERAL_LIABILITY");',
  'const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY" | "INLAND_MARINE">("GENERAL_LIABILITY");\n  const [globalSelectedQuoteId, setGlobalSelectedQuoteId] = useState<string | null>(null);'
);

// 2. Replace the currentQuote logic
const oldCurrentQuote = `  // Find the quote whose policyType matches the active tab (no fallback to avoid data bleed).
  const currentQuote = quotes.find((q: any) =>
    q.policyType === currentPolicyType ||
    (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
  ) ?? null;`;

const newCurrentQuote = `  const policyQuotes = data?.quotes?.filter((q: any) =>
    q.policyType === currentPolicyType ||
    (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
  ) ?? [];

  useEffect(() => {
    if (policyQuotes.length > 0) {
      if (!globalSelectedQuoteId || !policyQuotes.find(q => q._id === globalSelectedQuoteId)) {
        setGlobalSelectedQuoteId(policyQuotes[0]._id);
      }
    } else {
      setGlobalSelectedQuoteId(null);
    }
  }, [currentPolicyType, policyQuotes.length]); // Intentionally omitting full deps to avoid cycles

  const currentQuote = policyQuotes.find((q: any) => q._id === globalSelectedQuoteId) ?? policyQuotes[0] ?? null;`;

content = content.replace(oldCurrentQuote, newCurrentQuote);

// 3. Insert the Global Carrier Selector above the A-Rated section
const policySelectorStr = `        {/* Policy Selector (Critical Requirement) */}`;
const globalSelectorStr = `        {/* Global Carrier Selector */}
        {policyQuotes.length > 1 && (
          <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shadow-sm rounded-md mb-2">
            <span className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">Select Carrier:</span>
            <select
              value={globalSelectedQuoteId || ""}
              onChange={(e) => setGlobalSelectedQuoteId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-black focus:border-black block p-2 font-semibold outline-none"
            >
              {policyQuotes.map((quote: any) => (
                <option key={quote._id} value={quote._id}>
                  {quote.carrierId?.name || "Unknown Carrier"}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Policy Selector (Critical Requirement) */}`;

content = content.replace(policySelectorStr, globalSelectorStr);

// 4. Update Rating Information Tab to just use currentQuote
const ratingTarget = content.substring(content.indexOf('{activeTab === "Rating Information" && ('), content.indexOf('</div>\n          )}', content.indexOf('{activeTab === "Rating Information" && (')) + 19);

const newRating = `{activeTab === "Rating Information" && (
            <div className="space-y-6">
              {!currentQuote ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-2xl">????</span>
                  </div>
                  <p className="text-gray-500 font-medium">No quote entered yet for</p>
                  <p className="text-gray-900 font-bold mt-1">
                    {currentPolicyType === "GENERAL_LIABILITY" ? "General Liability" : "Excess Liability"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch animate-in fade-in zoom-in duration-300">
                  {/* Rate Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-[18px]">$</span>
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                        Rate Breakdown
                      </h3>
                    </div>
                    <div className="flex flex-col gap-5 flex-grow mb-8">
                      <RatingRow label="Total Premium" value={formatCurrency(currentQuote.carrierQuoteUSD || 0)} />
                      <RatingRow label="Carrier Fees" value={formatCurrency(currentQuote.carrierFeesUSD || 0)} />
                      <RatingRow label="Sterling Insurance Services Fees" value={formatCurrency(currentQuote.sterlingInsuranceServicesFeesUSD || 0)} />
                      <RatingRow label="Surplus Lines Tax (%)" value={formatCurrency(currentQuote.premiumTaxAmountUSD || 0)} />
                      <RatingRow label="Stamping Fee (%)" value={formatCurrency(currentQuote.stampingFeeAmountUSD || 0)} />
                      <RatingRow label="Fire Marshal Tax (%)" value={formatCurrency(currentQuote.fireMarshalTaxAmountUSD || 0)} />
                    </div>

                    {/* Total Cost inside the Left Card pinned to bottom */}
                    <div className="mt-auto pt-6 border-t flex justify-between items-center">
                      <span className="text-[16px] font-bold text-gray-900">Total Cost:</span>
                      <span className="text-[22px] font-bold text-gray-900">
                        {formatCurrency(currentQuote.finalAmountUSD || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Broker Breakdown */}
                  <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                        <User className="w-[20px] h-[20px] text-white" />
                      </div>
                      <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                        Broker Breakdown
                      </h3>
                    </div>
                    <div className="flex flex-col gap-5 flex-grow mb-8">
                      <RatingRow label="Commission (10%)" value={formatCurrency((currentQuote.carrierQuoteUSD || 0) * 0.1)} />
                      <RatingRow label="Broker Fee" value={formatCurrency(currentQuote.brokerFeeAmountUSD || 0)} />
                    </div>

                    {/* Total for Broker inside the Right Card pinned to bottom */}
                    <div className="mt-auto pt-6 border-t flex justify-between items-center">
                      <span className="text-[16px] font-bold text-gray-900">Total for Broker:</span>
                      <span className="text-[22px] font-bold text-gray-900">
                        {formatCurrency(((currentQuote.carrierQuoteUSD || 0) * 0.1) + (currentQuote.brokerFeeAmountUSD || 0))}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}`;

content = content.replace(ratingTarget, newRating);

fs.writeFileSync(filepath, content);
console.log('Successfully updated the agency submissions page layout!');
