const fs = require('fs');
const filepath = 'src/app/agency/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const targetContent = content.substring(content.indexOf('{activeTab === "Rating Information" && ('), content.indexOf('</div>\n          )}', content.indexOf('{activeTab === "Rating Information" && (')) + 19);

const replacement = `{activeTab === "Rating Information" && (
            <div className="space-y-12">
              {(() => {
                const policyQuotes = data?.quotes?.filter((q: any) =>
                  q.policyType === currentPolicyType ||
                  (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
                ) ?? [];

                if (ratingLoading) {
                  return (
                    <div className="animate-pulse space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
                        <div className="bg-white rounded-lg border border-gray-200 p-6 h-[400px]"></div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6 h-[400px]"></div>
                      </div>
                    </div>
                  );
                }

                if (policyQuotes.length === 0) {
                  return (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <span className="text-2xl">????</span>
                      </div>
                      <p className="text-gray-500 font-medium">No quote entered yet for</p>
                      <p className="text-gray-900 font-bold mt-1">
                        {currentPolicyType === "GENERAL_LIABILITY" ? "General Liability" : "Excess Liability"}
                      </p>
                    </div>
                  );
                }

                return policyQuotes.map((quote: any) => (
                  <div key={quote._id} className="space-y-4">
                    <h4 className="text-lg font-bold text-gray-900 border-b pb-2">
                       Carrier: {quote.carrierId?.name || "Unknown Carrier"}
                    </h4>
                    <div className="flex flex-col lg:flex-row gap-6 w-full items-stretch">
                      {/* Rate Breakdown */}
                      <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-[18px]">$</span>
                          </div>
                          <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                            Rate Breakdown
                          </h3>
                        </div>
                        <div className="flex flex-col gap-5 flex-grow mb-8">
                          <RatingRow label="Total Premium" value={formatCurrency(quote.carrierQuoteUSD || 0)} />
                          <RatingRow label="Carrier Fees" value={formatCurrency(quote.carrierFeesUSD || 0)} />
                          <RatingRow label="Sterling Insurance Services Fees" value={formatCurrency(quote.sterlingInsuranceServicesFeesUSD || 0)} />
                          <RatingRow label="Surplus Lines Tax (%)" value={formatCurrency(quote.premiumTaxAmountUSD || 0)} />
                          <RatingRow label="Stamping Fee (%)" value={formatCurrency(quote.stampingFeeAmountUSD || 0)} />
                          <RatingRow label="Fire Marshal Tax (%)" value={formatCurrency(quote.fireMarshalTaxAmountUSD || 0)} />
                        </div>

                        {/* Total Cost inside the Left Card pinned to bottom */}
                        <div className="mt-auto pt-6 border-t flex justify-between items-center">
                          <span className="text-[16px] font-bold text-gray-900">Total Cost:</span>
                          <span className="text-[22px] font-bold text-gray-900">
                            {formatCurrency(quote.finalAmountUSD || 0)}
                          </span>
                        </div>
                      </div>

                      {/* Broker Breakdown */}
                      <div className="bg-white rounded-lg border border-gray-200 p-8 flex flex-col flex-1 h-full min-h-[450px]">
                        <div className="flex items-center gap-4 mb-8">
                          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center">
                            <User className="w-[20px] h-[20px] text-white" />
                          </div>
                          <h3 className="text-[17px] font-semibold text-gray-900 tracking-tight">
                            Broker Breakdown
                          </h3>
                        </div>
                        <div className="flex flex-col gap-5 flex-grow mb-8">
                          <RatingRow label="Commission (10%)" value={formatCurrency((quote.carrierQuoteUSD || 0) * 0.1)} />
                          <RatingRow label="Broker Fee" value={formatCurrency(quote.brokerFeeAmountUSD || 0)} />
                        </div>

                        {/* Total for Broker inside the Right Card pinned to bottom */}
                        <div className="mt-auto pt-6 border-t flex justify-between items-center">
                          <span className="text-[16px] font-bold text-gray-900">Total for Broker:</span>
                          <span className="text-[22px] font-bold text-gray-900">
                            {formatCurrency(((quote.carrierQuoteUSD || 0) * 0.1) + (quote.brokerFeeAmountUSD || 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}`;

content = content.replace(targetContent, replacement);
fs.writeFileSync(filepath, content);
console.log('Successfully replaced!');
