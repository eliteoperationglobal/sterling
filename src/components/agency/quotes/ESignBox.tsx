interface ESignBoxProps {
  esignCompleted: boolean;
  esignCompletedAt?: string;
  documentsCount: number;
  signingUrl?: string;
  onSendForSignature: () => void;
  onRefreshStatus: () => void;
  sending?: boolean;
  refreshing?: boolean;
}

export default function ESignBox({
  esignCompleted,
  esignCompletedAt,
  documentsCount,
  signingUrl,
  onSendForSignature,
  onRefreshStatus,
  sending,
  refreshing,
}: ESignBoxProps) {
  const getStatusDisplay = () => {
    if (esignCompleted) {
      return {
        icon: "✍️",
        text: "Completed",
        color: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
      };
    }

    if (signingUrl) {
      return {
        icon: "📨",
        text: "Sent",
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        borderColor: "border-blue-200",
      };
    }

    return {
      icon: "❌",
      text: "Not Sent",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      borderColor: "border-gray-200",
    };
  };

  const status = getStatusDisplay();

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">E-Signature</h2>

      {/* Status Display */}
      <div className={`${status.bgColor} ${status.borderColor} border rounded-lg p-4 mb-4`}>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{status.icon}</span>
          <div>
            <p className={`font-semibold ${status.color}`}>STATUS → {status.text}</p>
            {esignCompleted && esignCompletedAt && (
              <p className="text-sm text-gray-600 mt-1">
                Completed: {new Date(esignCompletedAt).toLocaleString()}
              </p>
            )}
          </div>
        </div>
        {signingUrl && !esignCompleted && (
          <div className="mt-3 p-2 bg-white rounded border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Signing URL:</p>
            <a
              href={signingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:underline break-all"
            >
              {signingUrl}
            </a>
          </div>
        )}
      </div>

      {/* Actions */}
      {!esignCompleted && (
        <div className="space-y-3">
          <button
            onClick={onSendForSignature}
            disabled={sending || documentsCount === 0}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Sending...
              </span>
            ) : (
              "Send For Signature"
            )}
          </button>

          {documentsCount === 0 && (
            <p className="text-xs text-gray-500 text-center">
              Generate documents first before sending for signature.
            </p>
          )}

          <button
            onClick={onRefreshStatus}
            disabled={refreshing}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Refreshing...
              </span>
            ) : (
              "Refresh E-Sign Status"
            )}
          </button>
        </div>
      )}
    </div>
  );
}



