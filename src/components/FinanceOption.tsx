"use client";

import { useState, useEffect } from "react";
import { calculateFinancePlan, type AmortizationScheduleEntry } from "@/services/FinanceService";

interface FinanceOptionProps {
  quoteId: string;
  finalAmountUSD: number;
  esignCompleted?: boolean;
  paymentStatus?: string;
  submissionId?: string;
  onFinanceSelected?: (financePlan: any) => void;
}

export default function FinanceOption({
  quoteId,
  finalAmountUSD,
  esignCompleted = false,
  paymentStatus = "PENDING",
  submissionId,
  onFinanceSelected,
}: FinanceOptionProps) {
  const [showFinance, setShowFinance] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState(20);
  const [tenureMonths, setTenureMonths] = useState(12);
  const [annualInterestPercent, setAnnualInterestPercent] = useState(8.5);
  const [calculating, setCalculating] = useState(false);
  const [financePlan, setFinancePlan] = useState<any>(null);
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const handlePayInFull = async () => {
    if (!confirm(`Pay full amount of $${finalAmountUSD.toFixed(2)}?`)) {
      return;
    }

    setProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          paymentType: "FULL",
          amountUSD: finalAmountUSD,
          paymentMethod: "MOCK",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to process payment");
      }

      setPaymentSuccess(true);
      setShowFinance(false);

      // Refresh page after success
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Payment error:", err);
      setError(err.message || "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const calculateFinance = async () => {
    setCalculating(true);
    setError("");

    try {
      const response = await fetch("/api/finance/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amountUSD: finalAmountUSD,
          downPaymentPercent,
          tenureMonths,
          annualInterestPercent,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate finance plan");
      }

      setFinancePlan(data.financePlan);
    } catch (err: any) {
      console.error("Finance calculation error:", err);
      setError(err.message || "Failed to calculate finance plan");
    } finally {
      setCalculating(false);
    }
  };

  const handleSelectFinance = async () => {
    if (!financePlan) {
      await calculateFinance();
      return;
    }

    // Save finance plan to quote
    setProcessing(true);
    setError("");
    
    try {
      // First, save the finance plan
      const financePlanResponse = await fetch(`/api/finance/${quoteId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          downPaymentUSD: financePlan.downPaymentUSD,
          tenureMonths: financePlan.tenureMonths,
          annualInterestPercent: financePlan.annualInterestPercent,
        }),
      });

      const financePlanData = await financePlanResponse.json();

      if (!financePlanResponse.ok) {
        throw new Error(financePlanData.error || "Failed to save finance plan");
      }

      // Create down payment
      const paymentResponse = await fetch("/api/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          paymentType: "DOWN_PAYMENT",
          amountUSD: financePlan.downPaymentUSD,
          paymentMethod: "MOCK",
          financePlanId: financePlanData.financePlan._id,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || "Failed to process down payment");
      }

      setPaymentSuccess(true);
      
      if (onFinanceSelected) {
        onFinanceSelected(financePlanData.financePlan);
      }

      // Refresh page after success
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Finance plan save error:", err);
      setError(err.message || "Failed to save finance plan");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (showFinance && !financePlan) {
      calculateFinance();
    }
  }, [showFinance, downPaymentPercent, tenureMonths, annualInterestPercent]);

  return (
    <div className="space-y-4">
      {/* Success Message */}
      {paymentSuccess && (
        <div className="p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center">
          <div className="text-4xl mb-2">✅</div>
          <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful!</h3>
          <p className="text-green-700">
            Your payment has been processed. Refreshing page...
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Payment Options */}
      {!paymentSuccess && (
        <>
          {/* State A: Before E-Sign - Payment Locked */}
          {!esignCompleted && (
            <div className="p-6 bg-yellow-50 border-2 border-yellow-500 rounded-lg text-center mb-4">
              <div className="text-4xl mb-2">🔒</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-2">Payment Locked</h3>
              <p className="text-yellow-700 mb-2">
                Payment is locked until all documents are signed.
              </p>
              <p className="text-sm text-yellow-600">
                Please complete the e-signature process first.
              </p>
            </div>
          )}

          {/* State C: Payment Completed */}
          {esignCompleted && paymentStatus === "PAID" && (
            <div className="p-6 bg-green-50 border-2 border-green-500 rounded-lg text-center mb-4">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-bold text-green-800 mb-2">Payment Successful</h3>
              <p className="text-green-700">
                Your payment has been processed successfully.
              </p>
            </div>
          )}

          {/* State B: After E-Sign but before payment - Enable Payment */}
          {esignCompleted && paymentStatus !== "PAID" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Pay in Full */}
              <button
                onClick={handlePayInFull}
                disabled={processing}
                className="card-sterling p-6 text-left hover:shadow-lg transition-shadow border-2 border-[#C4A882] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">Pay in Full</h3>
                <p className="text-2xl font-bold text-[#C4A882] mb-2">
                  ${finalAmountUSD.toFixed(2)}
                </p>
                <p className="text-sm text-[#6B6B6B]">
                  {processing ? "Processing..." : "One-time payment"}
                </p>
              </button>

              {/* Finance Option */}
              <button
                onClick={() => setShowFinance(!showFinance)}
                disabled={processing}
                className={`card-sterling p-6 text-left hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed ${
                  showFinance ? "border-2 border-[#C4A882]" : ""
                }`}
              >
                <h3 className="text-xl font-bold text-[#4A4A4A] mb-2">Finance Options</h3>
                <p className="text-sm text-[#6B6B6B]">
                  {processing ? "Processing..." : showFinance ? "Hide options" : "View financing plans"}
                </p>
              </button>
            </div>
          )}
        </>
      )}

      {/* Finance Details */}
      {showFinance && (
        <div className="card-sterling p-6">
          <h3 className="text-xl font-bold text-[#4A4A4A] mb-4">Finance Plan</h3>

          {/* Finance Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                Down Payment (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="input-sterling focus-sterling w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                Tenure (Months)
              </label>
              <select
                value={tenureMonths}
                onChange={(e) => setTenureMonths(Number(e.target.value))}
                className="input-sterling focus-sterling w-full"
              >
                <option value={6}>6 months</option>
                <option value={12}>12 months</option>
                <option value={18}>18 months</option>
                <option value={24}>24 months</option>
                <option value={36}>36 months</option>
                <option value={48}>48 months</option>
                <option value={60}>60 months</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                Annual Interest (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={annualInterestPercent}
                onChange={(e) => setAnnualInterestPercent(Number(e.target.value))}
                className="input-sterling focus-sterling w-full"
              />
            </div>
          </div>

          {/* Calculate Button */}
          <button
            onClick={calculateFinance}
            disabled={calculating}
            className="btn-sterling-secondary mb-4 disabled:opacity-50"
          >
            {calculating ? "Calculating..." : "Calculate EMI"}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Finance Plan Results */}
          {financePlan && (
            <div className="space-y-4">
              <div className="p-4 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
                <h4 className="font-bold text-[#4A4A4A] mb-3">Finance Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Total Amount:</span>
                    <span className="font-semibold text-[#4A4A4A]">
                      ${finalAmountUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Down Payment:</span>
                    <span className="font-semibold text-[#4A4A4A]">
                      ${financePlan.downPaymentUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Principal (Loan Amount):</span>
                    <span className="font-semibold text-[#4A4A4A]">
                      ${financePlan.principalUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Monthly EMI:</span>
                    <span className="font-semibold text-[#4A4A4A]">
                      ${financePlan.monthlyInstallmentUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6B6B6B]">Total Interest:</span>
                    <span className="font-semibold text-[#4A4A4A]">
                      ${financePlan.totalInterestUSD.toFixed(2)}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E0E0E0] flex justify-between">
                    <span className="font-bold text-[#4A4A4A]">Total Payable:</span>
                    <span className="font-bold text-[#C4A882]">
                      ${financePlan.totalPayableUSD.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Amortization Schedule */}
              {financePlan.schedule && financePlan.schedule.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#4A4A4A] mb-3">Amortization Schedule</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E0E0E0]">
                          <th className="text-left py-2 px-2 text-[#4A4A4A]">Month</th>
                          <th className="text-right py-2 px-2 text-[#4A4A4A]">Principal</th>
                          <th className="text-right py-2 px-2 text-[#4A4A4A]">Interest</th>
                          <th className="text-right py-2 px-2 text-[#4A4A4A]">Payment</th>
                          <th className="text-right py-2 px-2 text-[#4A4A4A]">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {financePlan.schedule.slice(0, 12).map((entry: AmortizationScheduleEntry) => (
                          <tr key={entry.month} className="border-b border-[#E0E0E0]">
                            <td className="py-2 px-2 text-[#6B6B6B]">{entry.month}</td>
                            <td className="py-2 px-2 text-right text-[#4A4A4A]">
                              ${entry.principal.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right text-[#4A4A4A]">
                              ${entry.interest.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right text-[#4A4A4A]">
                              ${entry.totalPayment.toFixed(2)}
                            </td>
                            <td className="py-2 px-2 text-right text-[#6B6B6B]">
                              ${entry.remainingBalance.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                        {financePlan.schedule.length > 12 && (
                          <tr>
                            <td colSpan={5} className="py-2 px-2 text-center text-[#6B6B6B] text-xs">
                              ... and {financePlan.schedule.length - 12} more months
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Select Finance Button */}
              <button
                onClick={handleSelectFinance}
                disabled={processing}
                className="btn-sterling w-full disabled:opacity-50"
              >
                {processing ? "Processing Payment..." : "Pay Down Payment & Select Finance Plan"}
              </button>
              <p className="text-xs text-[#6B6B6B] text-center mt-2">
                Down payment of ${financePlan.downPaymentUSD.toFixed(2)} will be processed
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}




