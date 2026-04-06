"use client";

export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ESignSuccessContent() {
  const searchParams = useSearchParams();
  const submissionId = searchParams.get("submissionId");
  const envelopeId = searchParams.get("envelopeId");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-4">
            <svg
              className="h-16 w-16 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Documents Signed Successfully!
          </h1>
          <p className="text-gray-600">
            Your documents have been signed and submitted successfully.
          </p>
        </div>

        {submissionId && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Submission ID:</span> {submissionId}
            </p>
            {envelopeId && (
              <p className="text-sm text-gray-600 mt-1">
                <span className="font-medium">Envelope ID:</span> {envelopeId}
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/agency/dashboard"
            className="block w-full rounded-md px-4 py-2 font-medium shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Return to Dashboard
          </Link>
          <p className="text-sm text-gray-500">
            You will receive a confirmation email shortly.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ESignSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ESignSuccessContent />
    </Suspense>
  );
}