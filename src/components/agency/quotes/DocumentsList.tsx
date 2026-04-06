import StatusBadge from "./StatusBadge";

interface Document {
  documentType: "PROPOSAL" | "FINANCE_AGREEMENT" | "CARRIER_FORM";
  documentName: string;
  documentUrl: string;
  generatedAt: string;
  signatureStatus: "GENERATED" | "SENT" | "SIGNED" | "FAILED";
  sentForSignatureAt?: string;
  signedAt?: string;
}

interface DocumentsListProps {
  documents: Document[];
  onGenerateProposal: () => void;
  onGenerateFinanceAgreement: () => void;
  onGenerateCarrierForms: () => void;
  generating?: string | null;
  hasFinancePlan?: boolean;
}

export default function DocumentsList({
  documents,
  onGenerateProposal,
  onGenerateFinanceAgreement,
  onGenerateCarrierForms,
  generating,
  hasFinancePlan = false,
}: DocumentsListProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold mb-4">Documents</h2>

      {/* Generate Buttons */}
      <div className="space-y-3 mb-4">
        <button
          onClick={onGenerateProposal}
          disabled={generating === "proposal"}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating === "proposal" ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Proposal PDF"
          )}
        </button>

        {hasFinancePlan && (
          <button
            onClick={onGenerateFinanceAgreement}
            disabled={generating === "finance-agreement"}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {generating === "finance-agreement" ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Finance Agreement PDF"
            )}
          </button>
        )}

        <button
          onClick={onGenerateCarrierForms}
          disabled={generating === "carrier-forms"}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {generating === "carrier-forms" ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            "Generate Carrier Forms PDF"
          )}
        </button>
      </div>

      {/* Documents List */}
      {documents.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold mb-2 text-gray-700">Generated Documents</h3>
          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{doc.documentName}</p>
                  <p className="text-xs text-gray-500 mt-1">{doc.documentType}</p>
                  {doc.generatedAt && (
                    <p className="text-xs text-gray-400 mt-1">
                      Generated: {new Date(doc.generatedAt).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={doc.signatureStatus} type="signature" />
                  <a
                    href={doc.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline text-sm font-medium"
                  >
                    View
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">No documents generated yet.</p>
          <p className="text-xs mt-1">Generate documents using the buttons above.</p>
        </div>
      )}
    </div>
  );
}



