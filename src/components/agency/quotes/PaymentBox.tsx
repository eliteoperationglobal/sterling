import Link from "next/link";

interface PaymentBoxProps {
  esignCompleted: boolean;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  paymentDate?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  finalAmount: number;
  quoteId: string;
  hasFinancePlan?: boolean;
  onPayNow: () => void;
  processing?: boolean;
}

export default function PaymentBox({
  esignCompleted,
  paymentStatus,
  paymentDate,
  paymentAmount,
  paymentMethod,
  finalAmount,
  quoteId,
  hasFinancePlan,
  onPayNow,
  processing,
}: PaymentBoxProps) {
  // If e-signature not completed, show locked message
  if (!esignCompleted) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Payment</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">🔒 Payment is locked until all documents are signed</p>
          <p className="text-sm text-yellow-700 mt-2">
            Please complete the e-signature process before making a payment.
          </p>
        </div>
      </div>
    );
  }

  // If payment is completed, show receipt
  if (paymentStatus === "PAID") {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Payment</h2>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold mb-3">✓ Payment Received</p>
          <div className="space-y-2 text-sm">
            {paymentDate && (
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="text-gray-900 font-medium">
                  {new Date(paymentDate).toLocaleString()}
                </span>
              </div>
            )}
            {paymentAmount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Amount:</span>
                <span className="text-gray-900 font-medium">${paymentAmount.toFixed(2)}</span>
              </div>
            )}
            {paymentMethod && (
              <div className="flex justify-between">
                <span className="text-gray-600">Method:</span>
                <span className="text-gray-900 font-medium">{paymentMethod}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // If e-sign completed but payment pending, show payment options
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Payment</h2>
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Pay the full amount or select finance options.
        </p>

        <button
          onClick={onPayNow}
          disabled={processing}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {processing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing Payment...
            </span>
          ) : (
            `Pay Now - $${finalAmount.toFixed(2)}`
          )}
        </button>

        <Link
          href={`/agency/quotes/${quoteId}/finance`}
          className="block w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-center transition-colors"
        >
          {hasFinancePlan ? "View Finance Plan" : "Finance Options"}
        </Link>
      </div>
    </div>
  );
}



