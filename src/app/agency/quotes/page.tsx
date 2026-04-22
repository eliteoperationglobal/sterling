"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import FinanceOption from "@/components/FinanceOption";

interface Quote {
  _id: string;
  submissionId: string;
  carrierName: string;
  clientName: string;
  carrierQuoteUSD: number;
  // No wholesale fee - removed per user request
  brokerFeeAmountUSD: number;
  premiumTaxPercent?: number;
  premiumTaxAmountUSD?: number;
  policyFeeUSD?: number;
  finalAmountUSD: number;
  status: string;
  submissionStatus: string;
  esignCompleted?: boolean;
  paymentStatus?: string;
  binderPdfUrl?: string;
  createdAt: string;
}

export default function AgencyQuotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuoteId, setEditingQuoteId] = useState<string | null>(null);
  const [brokerFee, setBrokerFee] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCarrier, setFilterCarrier] = useState<string>("ALL");
  const [showFilters, setShowFilters] = useState(false);
  const [allQuotes, setAllQuotes] = useState<Quote[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchQuotes();
    }
  }, [status, filterStatus]);

  // Apply client-side filters (search, carrier)
  const applyFilters = (quotesToFilter: Quote[]) => {
    let filtered = [...quotesToFilter];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (quote) =>
          quote.clientName?.toLowerCase().includes(query) ||
          quote.carrierName?.toLowerCase().includes(query) ||
          quote.submissionId?.toLowerCase().includes(query)
      );
    }

    // Apply carrier filter
    if (filterCarrier !== "ALL") {
      filtered = filtered.filter((quote) => quote.carrierName === filterCarrier);
    }

    setQuotes(filtered);
  };

  useEffect(() => {
    if (allQuotes.length > 0) {
      applyFilters(allQuotes);
    }
  }, [searchQuery, filterCarrier]);

  // Get filter from URL params
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const statusParam = params.get("status");
      if (statusParam) {
        // Map URL param to filter value
        if (statusParam === "POSTED") {
          setFilterStatus("POSTED");
        } else if (statusParam === "APPROVED") {
          setFilterStatus("APPROVED");
        } else {
          setFilterStatus(statusParam);
        }
      }
    }
  }, []);

  const fetchQuotes = async (statusFilter?: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const currentFilter = statusFilter || filterStatus;
      if (currentFilter !== "ALL") {
        params.append("status", currentFilter);
      }
      
      console.log("📡 Fetching quotes with filter:", currentFilter);
      const response = await fetch(`/api/agency/quotes?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Quotes fetch failed:", errorData);
        throw new Error(errorData.error || "Failed to fetch quotes");
      }
      
      const data = await response.json();
      console.log("✅ Quotes fetched:", data.count || 0);
      
      if (data.quotes) {
        setAllQuotes(data.quotes);
        // Apply client-side filtering for search and carrier
        applyFilters(data.quotes);
      } else {
        console.warn("⚠️  No quotes in response");
        setAllQuotes([]);
        setQuotes([]);
      }
    } catch (err: any) {
      console.error("❌ Error fetching quotes:", err.message);
      setError("Failed to load quotes: " + err.message);
      setQuotes([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleEditBrokerFee = (quote: Quote) => {
    setEditingQuoteId(quote._id);
    setBrokerFee(quote.brokerFeeAmountUSD.toString());
    setError("");
  };

  const handleCancelEdit = () => {
    setEditingQuoteId(null);
    setBrokerFee("");
    setError("");
  };

  const handleSaveBrokerFee = async (quoteId: string) => {
    setSubmitting(true);
    setError("");

    const feeAmount = parseFloat(brokerFee);
    if (isNaN(feeAmount) || feeAmount < 0) {
      setError("Broker fee must be a non-negative number");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`/api/agency/quotes/${quoteId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brokerFeeAmountUSD: feeAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update quote");
      }

      // Refresh quotes
      await fetchQuotes();
      setEditingQuoteId(null);
      setBrokerFee("");
    } catch (err: any) {
      console.error("Quote update error:", err);
      setError(err.message || "Failed to update quote");
    } finally {
      setSubmitting(false);
    }
  };

  const calculateFinalAmount = (quote: Quote, newBrokerFee?: number) => {
    const brokerFeeAmount = newBrokerFee !== undefined ? newBrokerFee : quote.brokerFeeAmountUSD;
    // No wholesale fee - removed per user request
    const taxAmount = quote.premiumTaxAmountUSD || 0;
    const policyFee = quote.policyFeeUSD || 0;
    return quote.carrierQuoteUSD + taxAmount + policyFee + brokerFeeAmount;
  };

  const handleApproveQuote = async (quoteId: string) => {
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch(`/api/agency/quotes/${quoteId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to approve quote");
      }

      // If we're viewing posted quotes, switch to approved quotes view
      if (filterStatus === "POSTED") {
        // Update filter status
        setFilterStatus("APPROVED");
        // Update URL without full page reload
        router.replace("/agency/quotes?status=APPROVED", { scroll: false });
        // Fetch quotes with new filter immediately (before useEffect triggers)
        await fetchQuotes("APPROVED");
      } else {
        // Refresh quotes with current filter
        await fetchQuotes();
      }
      
      // Always reset submitting state after fetch completes
      setSubmitting(false);
    } catch (err: any) {
      console.error("Quote approval error:", err);
      setError(err.message || "Failed to approve quote");
      setSubmitting(false);
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ENTERED":
        return "bg-blue-100 text-blue-800 border border-blue-200";
      case "POSTED":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      case "APPROVED":
        return "bg-green-100 text-green-800 border border-green-200";
      case "BIND_REQUESTED":
        return "bg-orange-100 text-orange-800 border border-orange-200";
      case "BOUND":
        return "bg-emerald-100 text-emerald-800 border border-emerald-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading quotes...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f5f1eb] flex">
      {/* Sidebar - Matching Dashboard */}
      <aside className="w-[70px] bg-[#3A3C3F] flex flex-col items-center pt-6 pb-8 fixed h-full z-50 border-r border-gray-700">
        <Link href="/agency/dashboard" className="mb-8 group flex flex-col items-center">
          <div className="relative mb-3">
            <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-[#0097A7] rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all"></div>
            <div className="relative w-14 h-14 bg-gradient-to-br from-[#1A1F2E] via-[#2A3240] to-[#1A1F2E] rounded-xl flex items-center justify-center shadow-2xl border border-[#9A8B7A]/20 group-hover:border-[#9A8B7A]/40 transition-all overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-gradient-to-br from-[#9A8B7A] to-transparent"></div>
              </div>
              <svg className="relative w-9 h-9" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#logoGradient1)" className="drop-shadow-lg" />
                <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#logoGradient2)" className="drop-shadow-md" />
                <path d="M50 30 L50 65" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" className="drop-shadow-sm" />
                <path d="M40 47 L60 47" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
                <defs>
                  <linearGradient id="logoGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#9A8B7A" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0097A7" stopOpacity="0.95" />
                  </linearGradient>
                  <linearGradient id="logoGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#9A8B7A] rounded-full opacity-60"></div>
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#9A8B7A] rounded-full opacity-60"></div>
            </div>
          </div>
          <div className="text-center px-2">
            <p className="text-[9px] font-semibold text-gray-400 leading-tight tracking-wide uppercase group-hover:text-gray-300 transition-colors" style={{ letterSpacing: '0.05em' }}>Sterling</p>
            <p className="text-[8px] font-medium text-gray-500 leading-tight group-hover:text-gray-400 transition-colors">Wholesale Insurance</p>
          </div>
        </Link>

        <nav className="flex flex-col gap-6 flex-1">
          <Link href="/agency/dashboard" className="p-3 text-gray-400 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[70px] overflow-auto">
        {/* Header */}
        <div className="bg-white border-b border-[#e5ddd5] px-6 py-4 sticky top-0 z-40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-0">
            <div className="flex items-center gap-4">
              <Link href="/agency/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Quotes</h1>
                <p className="text-sm text-gray-600">View and manage quotes for your submissions</p>
              </div>
            </div>
            <div className="flex items-center gap-4 self-start md:self-auto">
              {/* Filter Dropdown */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 border border-[#e5ddd5] rounded-lg text-sm text-[#2d2a26] font-medium hover:bg-[#f5f1eb] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]"
              >
                <option value="ALL">All Quotes</option>
                <option value="POSTED">Posted Quotes</option>
                <option value="APPROVED">Approved Quotes</option>
                <option value="BIND_REQUESTED">Bind Requested</option>
                <option value="BOUND">Bound Policies</option>
              </select>
              <button
                onClick={() => signOut({ callbackUrl: "/signin" })}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Filters Bar */}
          <div className="bg-white rounded-lg border border-[#e5ddd5] p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by client name, carrier, or submission ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[#e5ddd5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent"
                  />
                </div>
              </div>
              
              {/* Carrier Filter */}
              <div className="md:w-48">
                <select
                  value={filterCarrier}
                  onChange={(e) => setFilterCarrier(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e5ddd5] rounded-lg text-sm text-[#2d2a26] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent"
                >
                  <option value="ALL">All Carriers</option>
                  {Array.from(new Set(allQuotes.map(q => q.carrierName))).map((carrier) => (
                    <option key={carrier} value={carrier}>{carrier}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters Button */}
              {(searchQuery || filterCarrier !== "ALL") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setFilterCarrier("ALL");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            
            {/* Results Count */}
            {(searchQuery || filterCarrier !== "ALL") && (
              <p className="text-xs text-gray-500 mt-3">
                Showing {quotes.length} of {allQuotes.length} quotes
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl shadow-sm">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-semibold text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Quotes List */}
          {quotes.length === 0 ? (
            <div className="bg-white rounded-lg border border-[#e5ddd5] p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Quotes Available</h3>
              <p className="text-gray-600">
                Quotes will appear here after admin creates them.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {quotes.map((quote) => {
                const isEditing = editingQuoteId === quote._id;
                const previewFinalAmount = isEditing
                  ? calculateFinalAmount(quote, parseFloat(brokerFee) || 0)
                  : quote.finalAmountUSD;

                return (
                  <div key={quote._id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-cyan-200 transition-all duration-300">
                    {quote.status === "APPROVED" && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                          <div className="flex-1">
                            <p className="text-blue-800 font-bold mb-2">
                              ✓ Quote Approved - Ready for Workflow
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`font-semibold ${quote.esignCompleted ? "text-green-600" : "text-gray-500"}`}>
                                {quote.esignCompleted ? "✓" : "○"} E-Sign
                              </span>
                              <span className={`font-semibold ${quote.paymentStatus === "PAID" ? "text-green-600" : "text-gray-500"}`}>
                                {quote.paymentStatus === "PAID" ? "✓" : "○"} Payment
                              </span>
                              <span className="font-semibold text-gray-500">○ Bind Request</span>
                            </div>
                            {!quote.esignCompleted && (
                              <p className="text-xs text-blue-700 mt-2 font-medium">
                                Next: Generate documents and complete e-signature
                              </p>
                            )}
                            {quote.esignCompleted && quote.paymentStatus !== "PAID" && (
                              <p className="text-xs text-blue-700 mt-2 font-medium">
                                Next: Complete payment to proceed
                              </p>
                            )}
                            {quote.esignCompleted && quote.paymentStatus === "PAID" && (
                              <p className="text-xs text-green-700 mt-2 font-bold">
                                Ready: Request bind to complete the process
                              </p>
                            )}
                          </div>
                          <Link
                            href={`/agency/quotes/${quote._id}`}
                            className="sm:ml-4 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] font-semibold transition-colors whitespace-nowrap text-center"
                          >
                            Manage Workflow →
                          </Link>
                        </div>
                      </div>
                    )}
                    {quote.status === "BOUND" && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                          <div className="flex-1">
                            <p className="text-green-800 font-bold mb-2">
                              ✓ Policy Bound Successfully
                            </p>
                            <p className="text-sm text-green-700 font-medium">
                              Your policy has been bound and is now active. Coverage is in effect.
                            </p>
                          </div>
                          <Link
                            href={`/agency/quotes/${quote._id}`}
                            className="sm:ml-4 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors whitespace-nowrap text-center"
                          >
                            View Policy →
                          </Link>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {quote.clientName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Carrier: {quote.carrierName}
                        </p>
                      </div>
                      <div className="self-start sm:self-auto">
                        <span
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${getStatusBadgeColor(
                            quote.status
                          )}`}
                        >
                          {quote.status}
                        </span>
                      </div>
                    </div>

                    {/* Quote Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b border-[#e5ddd5]">
                          <span className="text-sm text-gray-600 font-medium">Carrier Quote:</span>
                          <span className="font-bold text-gray-900">
                            ${quote.carrierQuoteUSD.toFixed(2)}
                          </span>
                        </div>
                        {quote.premiumTaxAmountUSD && quote.premiumTaxAmountUSD > 0 && (
                          <div className="flex justify-between py-2 border-b border-[#e5ddd5]">
                            <span className="text-sm text-gray-600 font-medium">
                              Premium Tax{quote.premiumTaxPercent ? ` (${quote.premiumTaxPercent}%)` : ''}:
                            </span>
                            <span className="font-bold text-gray-900">
                              ${quote.premiumTaxAmountUSD.toFixed(2)}
                            </span>
                          </div>
                        )}
                        {quote.policyFeeUSD && quote.policyFeeUSD > 0 && (
                          <div className="flex justify-between py-2 border-b border-[#e5ddd5]">
                            <span className="text-sm text-gray-600 font-medium">Policy Fee:</span>
                            <span className="font-bold text-gray-900">
                              ${quote.policyFeeUSD.toFixed(2)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between items-center py-2 border-b border-[#e5ddd5]">
                          <span className="text-sm text-gray-600 font-medium">Broker Fee:</span>
                          {isEditing ? (
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600">$</span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={brokerFee}
                                onChange={(e) => setBrokerFee(e.target.value)}
                                className="w-24 px-2 py-1 border border-[#e5ddd5] rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#9A8B7A]"
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveBrokerFee(quote._id)}
                                disabled={submitting}
                                className="px-3 py-1.5 bg-[#9A8B7A] text-white rounded-lg text-sm font-semibold hover:bg-[#8a6f4d] disabled:bg-gray-300 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-900">
                                ${quote.brokerFeeAmountUSD.toFixed(2)}
                              </span>
                              <button
                                onClick={() => handleEditBrokerFee(quote)}
                                className="text-sm text-[#9A8B7A] hover:text-[#8a6f4d] font-semibold"
                              >
                                Edit
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="border-l border-gray-200 pl-6">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-lg font-bold text-[#2d2a26]">
                            Final Amount:
                          </span>
                          <span className="text-2xl font-bold text-[#9A8B7A]">
                            ${previewFinalAmount.toFixed(2)}
                          </span>
                        </div>
                        {quote.status === "POSTED" && (
                          <div className="mt-4 space-y-2">
                            {quote.binderPdfUrl && (
                              <a
                                href={quote.binderPdfUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors font-semibold mb-2"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Download Binder PDF
                              </a>
                            )}
                            <button
                              onClick={() => handleApproveQuote(quote._id)}
                              disabled={submitting}
                              className="w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {submitting ? "Approving..." : "Approve Quote"}
                            </button>
                          </div>
                        )}
                        {quote.status === "APPROVED" && (
                          <div className="mt-4 space-y-3">
                            <Link
                              href={`/agency/quotes/${quote._id}`}
                              className="block w-full px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] text-center font-semibold transition-colors"
                            >
                              View Quote Details & Workflow
                            </Link>
                          <FinanceOption
                            quoteId={quote._id}
                            finalAmountUSD={previewFinalAmount}
                            esignCompleted={quote.esignCompleted || false}
                            paymentStatus={quote.paymentStatus || "PENDING"}
                            submissionId={quote.submissionId}
                          />
                        </div>
                      )}
                        {quote.status === "BOUND" && (
                          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                            <p className="text-green-800 font-bold mb-2">
                              ✓ Policy Bound Successfully
                            </p>
                            <p className="text-sm text-green-700 font-medium">
                              Your policy has been bound and is now active.
                            </p>
                            <Link
                              href={`/agency/quotes/${quote._id}`}
                              className="mt-3 inline-block px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-center font-semibold transition-colors"
                            >
                              View Policy Details →
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Binder PDF Download */}
                    {quote.binderPdfUrl && (
                      <div className="mt-4 pt-4 border-t border-[#e5ddd5]">
                        <a
                          href={quote.binderPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Download Binder PDF
                        </a>
                      </div>
                    )}

                    <div className="pt-4 border-t border-[#e5ddd5] flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                      <div className="flex flex-wrap items-center gap-4">
                        <Link
                          href={`/agency/submissions/${quote.submissionId}`}
                          className="text-sm text-[#9A8B7A] hover:text-[#8a6f4d] font-semibold"
                        >
                          View Submission Details
                        </Link>
                        {quote.status === "APPROVED" && (
                          <Link
                            href={`/agency/quotes/${quote._id}`}
                            className="text-sm text-[#9A8B7A] hover:text-[#8a6f4d] font-semibold"
                          >
                            Manage Quote Workflow →
                          </Link>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        Created: {new Date(quote.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </span>
                    </div>
                </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

