interface BindRequestBoxProps {
  esignCompleted: boolean;
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  quoteStatus: string;
  submissionStatus?: string;
  onRequestBind: () => void;
  requesting?: boolean;
}

export default function BindRequestBox({
  esignCompleted,
  paymentStatus,
  quoteStatus,
  submissionStatus,
  onRequestBind,
  requesting,
}: BindRequestBoxProps) {
  const canRequestBind = esignCompleted && paymentStatus === "PAID" && quoteStatus === "APPROVED";
  const isBindRequested = submissionStatus === "BIND_REQUESTED" || quoteStatus === "BIND_REQUESTED";

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Bind Request</h2>

      {isBindRequested ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-semibold mb-2">✓ Bind Request Submitted</p>
          <p className="text-sm text-green-700">
            Your bind request has been successfully submitted. The carrier will process your request and notify you once the policy is bound.
          </p>
        </div>
      ) : canRequestBind ? (
        <div>
          <button
            onClick={onRequestBind}
            disabled={requesting}
            className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {requesting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : (
              "Request Bind"
            )}
          </button>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3 font-semibold">
            Bind request is disabled until all requirements are met:
          </p>
          <ul className="text-xs text-gray-500 space-y-2 list-disc list-inside">
            <li className={quoteStatus === "APPROVED" ? "text-green-600 font-medium" : "text-red-600"}>
              {quoteStatus === "APPROVED" ? "✓" : "○"} Quote must be APPROVED
            </li>
            <li className={esignCompleted ? "text-green-600 font-medium" : "text-red-600"}>
              {esignCompleted ? "✓" : "○"} All documents must be signed
            </li>
            <li className={paymentStatus === "PAID" ? "text-green-600 font-medium" : "text-red-600"}>
              {paymentStatus === "PAID" ? "✓" : "○"} Payment must be completed
            </li>
          </ul>
          {!canRequestBind && (
            <p className="text-xs text-gray-500 mt-3 italic">
              Please complete all requirements above to enable the bind request button.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

