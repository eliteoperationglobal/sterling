"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Quote {
  _id: string;
  submissionId: {
    _id: string;
    clientContact: {
      name: string;
      email: string;
    };
  };
  carrierId: {
    _id: string;
    name: string;
    email: string;
  };
  carrierQuoteUSD: number;
  wholesaleFeeAmountUSD: number;
  brokerFeeAmountUSD: number;
  finalAmountUSD: number;
  status: string;
  createdAt: string;
}

export default function PostQuotePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [carrierReference, setCarrierReference] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      const userRole = (session?.user as any)?.role;
      if (userRole !== "system_admin") {
        router.push("/agency/dashboard");
      }
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated" && quoteId) {
      fetchQuote();
    }
  }, [status, quoteId]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}`);
      const data = await response.json();
      if (data.quote) {
        setQuote(data.quote);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error("Error fetching quote:", err);
      setError("Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          carrierReference: carrierReference.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to post quote");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/admin/quotes");
      }, 2000);
    } catch (err: any) {
      console.error("Post quote error:", err);
      setError(err.message || "Failed to post quote");
      setSubmitting(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-[#6B6B6B]">Loading...</div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="card-sterling p-8 max-w-md text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-[#4A4A4A] mb-2">
            Quote Posted Successfully!
          </h2>
          <p className="text-[#6B6B6B] mb-4">
            The quote is now visible to the agency. Redirecting...
          </p>
        </div>
      </div>
    );
  }

  if (!quote || error) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <header className="bg-white border-b border-[#E0E0E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/admin/dashboard" className="text-xl font-bold text-[#4A4A4A]">
              Sterling Portal - Admin
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card-sterling p-8">
            <h1 className="text-2xl font-bold text-[#4A4A4A] mb-4">Error</h1>
            <p className="text-red-600 mb-4">{error || "Quote not found"}</p>
            <Link href="/admin/quotes" className="btn-sterling-secondary">
              ← Back to Quotes
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      {/* Header */}
      <header className="bg-white border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/dashboard" className="text-xl font-bold text-[#4A4A4A]">
              Sterling Portal - Admin
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#6B6B6B]">
                {session?.user?.name || session?.user?.email}
              </span>
              <Link
                href="/api/auth/signout"
                className="text-sm text-[#6B6B6B] hover:text-[#4A4A4A]"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href="/admin/quotes"
            className="text-sm text-[#6B6B6B] hover:text-[#4A4A4A] inline-flex items-center gap-1"
          >
            ← Back to Quotes
          </Link>
        </div>

        <div className="card-sterling p-8">
          <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2">
            Post Quote to Agency
          </h1>
          <p className="text-[#6B6B6B] mb-8">
            Review and post this quote to make it visible to the agency
          </p>

          {/* Quote Details */}
          <div className="mb-8 p-6 bg-[#F5F5F5] rounded-lg border border-[#E0E0E0]">
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">Quote Details</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Client:</span>
                <span className="font-semibold text-[#4A4A4A]">
                  {quote.submissionId.clientContact.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Carrier:</span>
                <span className="font-semibold text-[#4A4A4A]">
                  {quote.carrierId.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Carrier Quote:</span>
                <span className="font-semibold text-[#4A4A4A]">
                  ${quote.carrierQuoteUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Wholesale Fee:</span>
                <span className="text-[#4A4A4A]">
                  ${quote.wholesaleFeeAmountUSD.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6B6B6B]">Broker Fee:</span>
                <span className="text-[#4A4A4A]">
                  ${quote.brokerFeeAmountUSD.toFixed(2)}
                </span>
              </div>
              <div className="pt-3 border-t border-[#E0E0E0] flex justify-between">
                <span className="text-[#4A4A4A] font-semibold">Final Amount:</span>
                <span className="text-xl font-bold text-[#4A4A4A]">
                  ${quote.finalAmountUSD.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Post Form */}
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label
                htmlFor="carrierReference"
                className="block text-sm font-semibold text-[#4A4A4A] mb-2"
              >
                Carrier Reference / Quote ID (Optional)
              </label>
              <input
                id="carrierReference"
                type="text"
                value={carrierReference}
                onChange={(e) => setCarrierReference(e.target.value)}
                placeholder="e.g., CARR-2024-001, Q123456"
                className="input-sterling focus-sterling w-full"
              />
              <p className="text-sm text-[#6B6B6B] mt-2">
                Enter the carrier's quote reference number or ID for tracking purposes
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-sterling flex-1 disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post Quote to Agency"}
              </button>
              <Link
                href="/admin/quotes"
                className="btn-sterling-secondary flex-1 text-center"
              >
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
