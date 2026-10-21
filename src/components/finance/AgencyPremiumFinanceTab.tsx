"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { 
  DollarSign, 
  FileText, 
  Printer, 
  ExternalLink, 
  Calculator, 
  ShieldCheck, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Layers
} from "lucide-react";

interface AgencyPremiumFinanceTabProps {
  submission: any;
  quotes: any[];
  mutate: () => Promise<any>;
}

export default function AgencyPremiumFinanceTab({
  submission,
  quotes,
  mutate,
}: AgencyPremiumFinanceTabProps) {
  // 1. Gather all valid entered or posted quotes for this submission
  const validQuotes = useMemo(() => {
    if (!Array.isArray(quotes)) return [];
    return quotes.filter(
      (q) => q && q.carrierQuoteUSD > 0 && q.status !== "CANCELLED"
    );
  }, [quotes]);

  // Initial broker fee from existing quotes or submission payload
  const initialBrokerFee = useMemo(() => {
    const existingFromQuote = validQuotes.find((q) => q.brokerFeeAmountUSD > 0)?.brokerFeeAmountUSD;
    if (existingFromQuote !== undefined) return existingFromQuote.toString();
    const fromPayload = submission?.payload?.brokerFee;
    return fromPayload ? fromPayload.toString() : "";
  }, [validQuotes, submission]);

  const [brokerFee, setBrokerFee] = useState<string>(initialBrokerFee);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [savingPlan, setSavingPlan] = useState<boolean>(false);
  const [financeTerms, setFinanceTerms] = useState<any>(
    validQuotes.find((q) => q.premiumFinanceTerms)?.premiumFinanceTerms ||
    submission?.payload?.premiumFinanceTerms ||
    null
  );
  const [financeError, setFinanceError] = useState<string>("");

  // Sum total quoted amounts
  const totalPolicyPremiums = useMemo(() => {
    return validQuotes.reduce((acc, q) => acc + (q.carrierQuoteUSD || 0), 0);
  }, [validQuotes]);

  const totalTaxesAndFees = useMemo(() => {
    return validQuotes.reduce((acc, q) => {
      const taxes = (q.premiumTaxAmountUSD || 0) + (q.stampingFeeAmountUSD || 0) + (q.fireMarshalTaxAmountUSD || 0) + (q.slasTransactionFeeAmountUSD || 0);
      const fees = (q.policyFeeUSD || 0) + (q.carrierFeesUSD || 0) + (q.sterlingInsuranceServicesFeesUSD || 0) + (q.fireMarshalFlatFeeUSD || 0) + (q.stampingFeePerFilingUSD || 0) + (q.slaServiceChargeUSD || 0);
      return acc + taxes + fees;
    }, 0);
  }, [validQuotes]);

  const parsedBrokerFee = Math.max(0, parseFloat(brokerFee) || 0);
  const grandTotalCost = totalPolicyPremiums + totalTaxesAndFees + parsedBrokerFee;

  // Format currency helper
  const fmt = (val: number | string | undefined) => {
    const num = typeof val === "string" ? parseFloat(val) : val;
    if (num === undefined || isNaN(num)) return "$0.00";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  const getPolicyLabel = (type: string) => {
    switch (type) {
      case "GENERAL_LIABILITY":
        return "General Liability";
      case "EXCESS_LIABILITY":
        return "Excess Liability";
      case "PROFESSIONAL_LIABILITY":
        return "Professional Liability";
      case "POLLUTION_LIABILITY":
        return "Pollution Liability";
      case "PROPERTY":
        return "Commercial Property";
      case "INLAND_MARINE":
        return "Inland Marine";
      default:
        return type?.replace(/_/g, " ") || "Policy";
    }
  };

  // Execute multi-policy + broker fee calculation with AIS
  const handleCalculateFinance = async () => {
    if (validQuotes.length === 0) {
      toast.error("No active quotes available to finance.");
      return;
    }

    setCalculating(true);
    setFinanceError("");

    try {
      // Build the multi-policy payload for AIS
      const policiesPayload = validQuotes.map((q) => {
        const taxes = (q.premiumTaxAmountUSD || 0) + (q.stampingFeeAmountUSD || 0) + (q.fireMarshalTaxAmountUSD || 0) + (q.slasTransactionFeeAmountUSD || 0);
        const fees = (q.policyFeeUSD || 0) + (q.carrierFeesUSD || 0) + (q.sterlingInsuranceServicesFeesUSD || 0) + (q.fireMarshalFlatFeeUSD || 0) + (q.stampingFeePerFilingUSD || 0) + (q.slaServiceChargeUSD || 0);

        return {
          policyType: q.policyType || "GENERAL_LIABILITY",
          policyNumber: q.policyNumber || "TBD",
          premiumAmount: (q.carrierQuoteUSD || 0).toString(),
          taxesAmount: taxes.toString(),
          feesAmount: fees.toString(),
        };
      });

      const response = await fetch("/api/finance/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policies: policiesPayload,
          brokerFeeAmount: parsedBrokerFee,
          insuredName: submission?.payload?.companyName || submission?.clientContact?.name || "Client",
          state: submission?.state || submission?.clientContact?.businessAddress?.state || "CA",
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to calculate finance terms with AIS");
      }

      setFinanceTerms(data.data);
      toast.success(
        validQuotes.length > 1
          ? `Combined finance terms calculated for ${validQuotes.length} policies + Broker Fee!`
          : "Finance terms calculated successfully!"
      );
    } catch (err: any) {
      console.error("Finance calculation error:", err);
      setFinanceError(err.message || "Financing calculation failed");
      toast.error(err.message || "Failed to calculate financing");
    } finally {
      setCalculating(false);
    }
  };

  // Save the calculated finance terms and broker fee to submission & quotes
  const handleApplyToSubmission = async () => {
    if (!financeTerms) {
      toast.error("Please calculate finance terms first.");
      return;
    }

    setSavingPlan(true);
    try {
      // 1. Update each quote with the broker fee & finance agreement link
      const agreementUrl = financeTerms.premiumFinanceAgreement || "";
      for (const q of validQuotes) {
        try {
          await fetch(`/api/agency/quotes/${q._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brokerFeeAmountUSD: parsedBrokerFee,
            }),
          });
        } catch (e) {
          console.warn("Failed updating quote broker fee:", e);
        }
      }

      // 2. Update submission payload with finance plan
      const updatedPayload = {
        ...(submission.payload || {}),
        brokerFee: parsedBrokerFee.toString(),
        paymentOption: "Premium Financial Partners Co.",
        premiumFinanceTerms: financeTerms,
        premiumFinanceAgreementUrl: agreementUrl,
      };

      const subRes = await fetch(`/api/agency/submissions/${submission._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: updatedPayload,
        }),
      });

      if (!subRes.ok) {
        const errData = await subRes.json();
        throw new Error(errData.error || "Failed to update submission");
      }

      toast.success("Premium Financing & Broker Fee successfully applied to submission!");
      await mutate();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to apply financing");
    } finally {
      setSavingPlan(false);
    }
  };

  if (validQuotes.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 border border-gray-200 text-center space-y-4">
        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-gray-900">No Quoted Policies Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Quotes will appear here once entered by the underwriter. Once available, you will be able to combine multiple policies and add your agency broker fee into a single finance contract.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-blue-500/30 text-blue-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-300" />
                Premium Financial Partners Co.
              </span>
              {validQuotes.length > 1 && (
                <span className="bg-emerald-500/30 text-emerald-200 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                  <Layers className="w-3 h-3 text-emerald-300" />
                  {validQuotes.length} Policies Combined
                </span>
              )}
            </div>
            <h2 className="text-2xl font-black tracking-tight">Premium Financing & Broker Fee</h2>
            <p className="text-blue-200 text-sm mt-1 max-w-xl">
              Finance multiple quoted policies under one single contract. Add your agency broker fee to be financed and disbursed directly to your agency.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 text-right">
            <span className="text-xs uppercase tracking-wider text-blue-200 block font-semibold">
              Total Quoted to Finance
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white">
              {fmt(grandTotalCost)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policies Breakdown & Broker Fee Input */}
        <div className="lg:col-span-1 space-y-6">
          {/* Policies Included Card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Policies Included in Agreement
            </h3>

            <div className="space-y-3">
              {validQuotes.map((q, idx) => (
                <div key={q._id || idx} className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-1">
                  <div className="flex justify-between items-center text-sm font-semibold text-gray-900">
                    <span>{getPolicyLabel(q.policyType)}</span>
                    <span>{fmt(q.finalAmountUSD || q.carrierQuoteUSD)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>Carrier: {q.carrierId?.name || "Assigned Carrier"}</span>
                    <span>Premium: {fmt(q.carrierQuoteUSD)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-sm">
              <span className="text-gray-600 font-medium">Policy Premiums + Fees:</span>
              <span className="font-bold text-gray-900">{fmt(totalPolicyPremiums + totalTaxesAndFees)}</span>
            </div>
          </div>

          {/* Agency Broker Fee Input Card */}
          <div className="bg-white rounded-xl border-2 border-indigo-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Agency Broker Fee
              </h3>
              <span className="text-xs bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded border border-emerald-200">
                Disbursed to You
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Enter the broker fee your agency wishes to charge. It will be combined into the financing, and the finance company will pay it to you upfront.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Broker Fee Amount ($ USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm font-semibold">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={brokerFee}
                  onChange={(e) => setBrokerFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 font-bold text-base focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateFinance}
              disabled={calculating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-sm shadow-md shadow-indigo-100 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculating with AIS...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Finance Agreement</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Finance Terms & Printable Agreement */}
        <div className="lg:col-span-2 space-y-6">
          {financeError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{financeError}</span>
            </div>
          )}

          {financeTerms ? (
            <div className="bg-white rounded-xl border border-indigo-100 shadow-md p-6 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-2">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Combined Finance Terms
                  </h3>
                  <p className="text-xs text-gray-500">
                    Official schedule generated by AIS (PFC 205 - Premium Financial Partners Co.)
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Approved Status
                </span>
              </div>

              {/* Payment Terms Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                  <span className="text-xs text-indigo-700 font-semibold uppercase tracking-wider block">Down Payment</span>
                  <span className="text-2xl font-black text-indigo-950 mt-1 block">
                    {fmt(financeTerms.totalDownpayAmount)}
                  </span>
                  <span className="text-[11px] text-indigo-500 mt-1 block">Due upon contract signing</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Amount Financed</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.amountFinanced)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">Net policy balance</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Monthly Payment</span>
                  <span className="text-2xl font-black text-blue-600 mt-1 block">
                    {fmt(financeTerms.paymentAmount)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    {financeTerms.numberOfInstallments || 10} Monthly Payments
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Finance Charge</span>
                  <span className="text-lg font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.financeCharge)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">APR: {financeTerms.currentAPR || "35.00"}%</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider block">Total of Payments</span>
                  <span className="text-lg font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.totalOfPayments)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-1 block">All installments sum</span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="text-xs text-emerald-700 font-semibold uppercase tracking-wider block">Broker Fee Financed</span>
                  <span className="text-lg font-black text-emerald-700 mt-1 block">
                    {fmt(parsedBrokerFee)}
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-1 block">Paid upfront to agency</span>
                </div>
              </div>

              {/* Printable Contract Action Section (Client Request #2) */}
              <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 rounded-xl p-5 border border-indigo-200/80 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Completed Printable Finance Agreement (Contract)
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Official legal agreement generated by AIS with payment coupons, down payment terms, and signature lines.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {financeTerms.premiumFinanceAgreement && (
                    <a
                      href={financeTerms.premiumFinanceAgreement}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-bold shadow-md shadow-indigo-100 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Download Finance Contract (PDF)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  )}

                  {financeTerms.premiumFinanceQuote && (
                    <a
                      href={financeTerms.premiumFinanceQuote}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-semibold shadow-sm transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>View Quote Sheet (PDF)</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyToSubmission}
                    disabled={savingPlan}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm transition disabled:opacity-50 cursor-pointer ml-auto"
                  >
                    {savingPlan ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Applying...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save & Attach to Submission</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-gray-300 p-8 text-center space-y-3">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Calculator className="w-5 h-5" />
              </div>
              <h4 className="text-base font-bold text-gray-800">Ready to Calculate Financing</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Enter your optional agency broker fee on the left and click <strong>Calculate Finance Agreement</strong> to generate terms and the printable legal contract.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
