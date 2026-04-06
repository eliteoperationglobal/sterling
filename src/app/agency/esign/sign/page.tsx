"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface Document {
  documentType: string;
  documentName: string;
  signatureStatus: string;
}

interface ESignStatus {
  documents: Document[];
  allSigned: boolean;
  esignCompleted: boolean;
  esignCompletedAt?: string;
}

function AgencyESignSignContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const submissionId = searchParams.get("submissionId");
  const envelopeId = searchParams.get("envelopeId");

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [status, setStatus] = useState<ESignStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteId, setQuoteId] = useState<string | null>(null);

  // Fetch submission status and quote ID
  useEffect(() => {
    if (!submissionId) {
      setError("Missing submissionId parameter");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch e-sign status
        const statusRes = await fetch(`/api/esign/status/${submissionId}`, {
          cache: "no-store",
        });

        if (!statusRes.ok) {
          throw new Error("Failed to fetch e-signature status");
        }

        const statusData = await statusRes.json();
        setStatus(statusData);

        // Fetch quotes to find the one matching this submissionId
        const quoteRes = await fetch(`/api/agency/quotes`, {
          cache: "no-store",
        });
        if (quoteRes.ok) {
          const quotesData = await quoteRes.json();
          if (quotesData.quotes && quotesData.quotes.length > 0) {
            // Find quote with matching submissionId
            const matchingQuote = quotesData.quotes.find(
              (q: any) => q.submissionId === submissionId
            );
            if (matchingQuote) {
              setQuoteId(matchingQuote._id);
            }
          }
        }
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load signing page");
        toast.error("Error loading signing page", {
          description: err.message || "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [submissionId]);

  const handleSignAll = async () => {
    if (!submissionId) {
      toast.error("Missing submission ID");
      return;
    }

    try {
      setSigning(true);
      setError(null);

      const res = await fetch("/api/esign/webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status: "SIGNED",
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to sign documents");
      }

      const data = await res.json();
      if (data.success) {
        toast.success("Documents signed successfully!");
        
        // Redirect back to quote details page
        if (quoteId) {
          router.push(`/agency/quotes/${quoteId}`);
        } else {
          // Fallback: try to find quote ID again
          const quoteRes = await fetch(`/api/agency/quotes`, {
            cache: "no-store",
          });
          if (quoteRes.ok) {
            const quotesData = await quoteRes.json();
            if (quotesData.quotes && quotesData.quotes.length > 0) {
              const matchingQuote = quotesData.quotes.find(
                (q: any) => q.submissionId === submissionId
              );
              if (matchingQuote) {
                router.push(`/agency/quotes/${matchingQuote._id}`);
              } else {
                router.push("/agency/quotes");
              }
            } else {
              router.push("/agency/quotes");
            }
          } else {
            router.push("/agency/quotes");
          }
        }
      } else {
        throw new Error(data.error || "Failed to sign documents");
      }
    } catch (err: any) {
      console.error("Sign error:", err);
      setError(err.message || "An error occurred while signing documents");
      toast.error("Error signing documents.", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading signing page...</p>
        </div>
      </div>
    );
  }

  if (error && !submissionId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Invalid Signing Link</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link
              href="/agency/quotes"
              className="inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Return to Quotes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const documents = status?.documents || [];
  const allSigned = status?.allSigned || false;
  const esignCompleted = status?.esignCompleted || false;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Sign Documents</h1>
          <p className="text-gray-600 mt-2">
            Please review and sign the documents below
          </p>
          {envelopeId && (
            <p className="text-sm text-gray-500 mt-1">
              Envelope ID: {envelopeId}
            </p>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Documents to Sign
          </h2>
          {documents.length === 0 ? (
            <p className="text-gray-500">No documents found.</p>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">
                      {doc.documentName}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {doc.documentType}
                    </p>
                  </div>
                  <div className="ml-4">
                    {doc.signatureStatus === "SIGNED" ? (
                      <span className="px-3 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                        ✓ Signed
                      </span>
                    ) : doc.signatureStatus === "SENT" ? (
                      <span className="px-3 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                        Ready to Sign
                      </span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                        {doc.signatureStatus}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sign Button */}
        {!esignCompleted && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Ready to Sign
                </h3>
                <p className="text-sm text-gray-600">
                  Click the button below to sign all documents
                </p>
              </div>
              <button
                onClick={handleSignAll}
                disabled={signing || allSigned}
                className="rounded-md px-6 py-3 font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {signing ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing...
                  </span>
                ) : allSigned ? (
                  "All Documents Signed"
                ) : (
                  "Sign All Documents"
                )}
              </button>
            </div>
          </div>
        )}

        {/* Already Signed Message */}
        {esignCompleted && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <svg
                className="h-6 w-6 text-green-600 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-green-800">
                  All Documents Signed
                </h3>
                <p className="text-sm text-green-700 mt-1">
                  E-Signature completed successfully
                  {status?.esignCompletedAt && (
                    <span className="block mt-1">
                      Completed on: {new Date(status.esignCompletedAt).toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
            {quoteId && (
              <Link
                href={`/agency/quotes/${quoteId}`}
                className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Return to Quote Details
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AgencyESignSignPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <AgencyESignSignContent />
    </Suspense>
  );
}