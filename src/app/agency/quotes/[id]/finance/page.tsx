"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import FinanceOption from "@/components/FinanceOption";

interface Quote {
  _id: string;
  submissionId: string;
  carrierName: string;
  clientName: string;
  finalAmountUSD: number;
  status: string;
  esignCompleted?: boolean;
  paymentStatus?: string;
  paymentDate?: string;
}

export default function QuoteFinancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const quoteId = params?.id as string;

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated" && quoteId) {
      fetchQuote();
    }
  }, [status, quoteId]);

  const fetchQuote = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/agency/quotes/${quoteId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch quote");
      }

      if (data.quote) {
        setQuote(data.quote);
      }
    } catch (err: any) {
      console.error("Error fetching quote:", err);
      setError(err.message || "Failed to load quote");
    } finally {
      setLoading(false);
    }
  };

  const handleFinanceSelected = (financePlan: any) => {
    // Redirect back to quotes page with success message
    router.push(`/agency/quotes?financeCreated=true`);
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

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-[#F5F5F5]">
        <header className="bg-white border-b border-[#E0E0E0]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/agency/dashboard" className="text-xl font-bold text-[#4A4A4A]">
              Sterling Portal
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="card-sterling p-8">
            <h1 className="text-2xl font-bold text-[#4A4A4A] mb-4">Error</h1>
            <p className="text-red-600 mb-4">{error || "Quote not found"}</p>
            <Link href="/agency/quotes" className="btn-sterling-secondary">
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
            <Link href="/agency/dashboard" className="text-xl font-bold text-[#4A4A4A]">
              Sterling Portal
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
            href="/agency/quotes"
            className="text-sm text-[#6B6B6B] hover:text-[#4A4A4A] inline-flex items-center gap-1"
          >
            ← Back to Quotes
          </Link>
        </div>

        <div className="card-sterling p-8">
          <h1 className="text-3xl font-bold text-[#4A4A4A] mb-2">Finance Options</h1>
          <p className="text-[#6B6B6B] mb-6">
            For: {quote.clientName} - ${quote.finalAmountUSD.toFixed(2)}
          </p>

          <FinanceOption
            quoteId={quote._id}
            finalAmountUSD={quote.finalAmountUSD}
            esignCompleted={quote.esignCompleted || false}
            paymentStatus={quote.paymentStatus || "PENDING"}
            submissionId={quote.submissionId}
            onFinanceSelected={handleFinanceSelected}
          />
        </div>
      </main>
    </div>
  );
}




