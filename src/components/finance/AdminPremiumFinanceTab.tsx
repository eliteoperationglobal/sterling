"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { getStateCode } from "@/lib/utils/stateConverter";
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
  Layers,
  UserCheck,
  RefreshCw,
  ArrowRight
} from "lucide-react";

interface AdminPremiumFinanceTabProps {
  submission: any;
  quotes: any[];
  mutate: () => Promise<any>;
}

export default function AdminPremiumFinanceTab({
  submission,
  quotes,
  mutate,
}: AdminPremiumFinanceTabProps) {
  // Gather all valid active quotes for this submission
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

  // Execute multi-policy + broker fee calculation with AIS (Epitome AIS / Imperial PFS)
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
          carrierName: q.carrierId?.name || "",
          carrierCode: q.carrierId?.code || "",
          effectiveDate: q.effectiveDate || submission?.effectiveDate,
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
          insuredName: submission?.payload?.companyName || submission?.payload?.applicantName || submission?.payload?.namedInsured || submission?.clientContact?.name || "Client",
          address: submission?.clientContact?.businessAddress?.street || submission?.payload?.streetAddress || submission?.payload?.mailingAddress,
          city: submission?.clientContact?.businessAddress?.city || submission?.payload?.city || submission?.payload?.mailingCity,
          state: getStateCode(submission?.state || submission?.clientContact?.businessAddress?.state || submission?.payload?.state || "CA"),
          zip: submission?.clientContact?.businessAddress?.zip || submission?.payload?.zip || submission?.payload?.mailingZip || "90210",
          phone: submission?.clientContact?.phone || submission?.payload?.applicantPhone || submission?.payload?.phone,
          email: submission?.clientContact?.email || submission?.payload?.applicantEmail || submission?.payload?.email,
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
      // 1. Update quotes: apply broker fee to primary quote and 0 to remaining so it's not multi-counted
      const agreementUrl = financeTerms.premiumFinanceAgreement || "";
      for (let i = 0; i < validQuotes.length; i++) {
        const q = validQuotes[i];
        const feeForThisQuote = i === 0 ? parsedBrokerFee : 0;
        try {
          await fetch(`/api/agency/quotes/${q._id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              brokerFeeAmountUSD: feeForThisQuote,
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

      toast.success("Premium Financing & Broker Fee successfully saved to submission!");
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
      <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-4 shadow-sm">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">No Quoted Policies Found</h3>
        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
          There are currently no active quotes entered for this submission. Once you enter and post carrier quotes under the <strong>&quot;Quoting &amp; Routing&quot;</strong> tab, you will be able to add an agency broker fee and finance all policies under one contract here.
        </p>
      </div>
    );
  }

  const hasExistingAgreement = !!financeTerms?.premiumFinanceAgreement;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="bg-blue-500/20 text-blue-300 text-xs font-bold px-3 py-1 rounded-full border border-blue-400/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
                Premium Financial Partners Co. (Imperial PFS)
              </span>
              <span className="bg-purple-500/20 text-purple-200 text-xs font-semibold px-3 py-1 rounded-full border border-purple-400/30 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                Agency: {submission?.agencyId?.name || "Assigned Agency"}
              </span>
              {validQuotes.length > 1 && (
                <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-3 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-emerald-300" />
                  {validQuotes.length} Policies Combined
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Premium Financing &amp; Broker Fee Management
            </h2>
            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl leading-relaxed">
              Calculate live payment terms with Imperial PFS, manage agency broker fee disbursement, and generate the official printable Premium Finance Agreement (contract).
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15 text-left md:text-right shrink-0">
            <span className="text-xs uppercase tracking-wider text-slate-300 block font-semibold mb-1">
              Grand Total to Finance
            </span>
            <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
              {fmt(grandTotalCost)}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Policies + Taxes + Agency Broker Fee
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Policies Breakdown & Broker Fee Input */}
        <div className="lg:col-span-1 space-y-6">
          {/* Policies Included Card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-600" />
              Policies Included in Contract
            </h3>

            <div className="space-y-3">
              {validQuotes.map((q, idx) => (
                <div key={q._id || idx} className="p-3.5 bg-gray-50/80 rounded-xl border border-gray-100 space-y-1.5">
                  <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                    <span>{getPolicyLabel(q.policyType)}</span>
                    <span className="text-indigo-600">{fmt(q.finalAmountUSD || q.carrierQuoteUSD)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span className="truncate max-w-[150px]">Carrier: {q.carrierId?.name || "Carrier"}</span>
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
          <div className="bg-white rounded-2xl border-2 border-indigo-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Agency Broker Fee
              </h3>
              <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Disbursed to Agency
              </span>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Add or adjust the agency broker fee. This fee will be financed in the contract, and the finance company will disburse it directly to the agency upon loan funding.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1.5">
                Broker Fee Amount ($ USD)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-base">$</span>
                </div>
                <input
                  type="number"
                  min="0"
                  step="25"
                  value={brokerFee}
                  onChange={(e) => setBrokerFee(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 font-bold text-lg focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-2 mt-2.5">
                {[
                  { label: "Clear", val: "0" },
                  { label: "$250", val: "250" },
                  { label: "$500", val: "500" },
                  { label: "$750", val: "750" },
                  { label: "$1,000", val: "1000" }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setBrokerFee(preset.val)}
                    className="flex-1 py-1 text-xs font-semibold rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleCalculateFinance}
              disabled={calculating}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {calculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Calculating with AIS...</span>
                </>
              ) : (
                <>
                  <Calculator className="w-4 h-4" />
                  <span>Calculate Live Finance Terms</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Calculated Finance Terms & Printable Agreement */}
        <div className="lg:col-span-2 space-y-6">
          {financeError && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-sm font-medium flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
              <span>{financeError}</span>
            </div>
          )}

          {financeTerms ? (
            <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 sm:p-7 space-y-6 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                <div>
                  <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                    Imperial PFS Finance Terms Schedule
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Official schedule generated by AIS (PFC 205 - Premium Financial Partners Co.)
                  </p>
                </div>
                <span className="self-start sm:self-auto text-xs bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Terms Approved
                </span>
              </div>

              {/* Payment Terms Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gradient-to-br from-indigo-50/80 to-blue-50/60 rounded-xl border border-indigo-100">
                  <span className="text-[11px] text-indigo-700 font-bold uppercase tracking-wider block">Down Payment</span>
                  <span className="text-2xl font-black text-indigo-950 mt-1 block">
                    {fmt(financeTerms.totalDownpayAmount)}
                  </span>
                  <span className="text-[11px] text-indigo-500 mt-0.5 block font-medium">Due upon contract signing</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Amount Financed</span>
                  <span className="text-2xl font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.amountFinanced)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Net policy balance</span>
                </div>

                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-700 font-bold uppercase tracking-wider block">Monthly Installment</span>
                  <span className="text-2xl font-black text-blue-700 mt-1 block">
                    {fmt(financeTerms.paymentAmount)}
                  </span>
                  <span className="text-[11px] text-blue-600 mt-0.5 block font-medium">
                    {financeTerms.numberOfInstallments || 10} Monthly Payments
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Finance Charge</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.financeCharge)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">APR: {financeTerms.currentAPR || "35.00"}%</span>
                </div>

                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider block">Total of Payments</span>
                  <span className="text-xl font-bold text-gray-900 mt-1 block">
                    {fmt(financeTerms.totalOfPayments)}
                  </span>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">Installments sum</span>
                </div>

                <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-800 font-bold uppercase tracking-wider block">Broker Fee Financed</span>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">
                    {fmt(parsedBrokerFee)}
                  </span>
                  <span className="text-[11px] text-emerald-600 mt-0.5 block font-medium">Disbursed to agency</span>
                </div>
              </div>

              {/* Printable Contract Action Section */}
              <div className="bg-gradient-to-br from-indigo-50/80 via-blue-50/40 to-white rounded-2xl p-6 border border-indigo-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      Completed Printable Finance Agreement (Contract)
                    </h4>
                    <p className="text-xs text-gray-600 mt-0.5">
                      Official legal agreement generated by AIS with payment coupons, schedule, and signature lines.
                    </p>
                  </div>
                  {hasExistingAgreement && (
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 self-start sm:self-auto">
                      Agreement Ready
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {financeTerms.premiumFinanceAgreement && (
                    <a
                      href={`/api/finance/pdf-proxy?url=${encodeURIComponent(financeTerms.premiumFinanceAgreement)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4" />
                      <span>Print / Download Finance Contract (PDF)</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  )}

                  {financeTerms.premiumFinanceQuote && financeTerms.premiumFinanceQuote !== financeTerms.premiumFinanceAgreement && (
                    <a
                      href={`/api/finance/pdf-proxy?url=${encodeURIComponent(financeTerms.premiumFinanceQuote)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-sm font-semibold shadow-sm transition cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>View Quote Sheet (PDF)</span>
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={handleApplyToSubmission}
                    disabled={savingPlan}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50 cursor-pointer sm:ml-auto"
                  >
                    {savingPlan ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Saving to Submission...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Save &amp; Attach to Submission</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                <Calculator className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-gray-800">Ready to Calculate Premium Financing</h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                Enter or review the agency broker fee on the left, then click <strong>Calculate Live Finance Terms</strong> to fetch the installment schedule and printable contract from Imperial PFS.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
