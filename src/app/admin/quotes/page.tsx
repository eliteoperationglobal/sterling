"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu } from "lucide-react";
import MobileNav from "@/components/layout/MobileNav";

interface Quote {
  _id: string;
  submissionId: string;
  carrierName: string;
  clientName: string;
  carrierQuoteUSD: number;
  wholesaleFeePercent: number;
  wholesaleFeeAmountUSD: number;
  brokerFeeAmountUSD: number;
  finalAmountUSD: number;
  status: string;
  createdAt: string;
}

export default function AdminQuotesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

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
    if (status === "authenticated") {
      fetchQuotes();
    }
  }, [status]);

  const fetchQuotes = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/quotes");
      const data = await response.json();
      if (data.quotes) {
        setQuotes(data.quotes);
      } else if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      console.error("Error fetching quotes:", err);
      setError("Failed to load quotes");
    } finally {
      setLoading(false);
    }
  };

  const handlePostQuote = async (quoteId: string) => {
    if (!confirm("Are you sure you want to post this quote? It will become visible to the agency.")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/quotes/${quoteId}/post`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Quote posted successfully!");
        fetchQuotes();
      } else {
        alert(data.error || "Failed to post quote");
      }
    } catch (err: any) {
      console.error("Error posting quote:", err);
      alert("Failed to post quote");
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "ENTERED":
        return "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 border border-blue-200";
      case "POSTED":
        return "bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 border border-purple-200";
      case "APPROVED":
        return "bg-gradient-to-r from-green-50 to-green-100 text-green-700 border border-green-200";
      case "BIND_REQUESTED":
        return "bg-gradient-to-r from-orange-50 to-orange-100 text-orange-700 border border-orange-200";
      case "BOUND":
        return "bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 border border-emerald-200";
      default:
        return "bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const filteredQuotes = quotes.filter((quote) => {
    const matchesFilter = filter === "ALL" || quote.status === filter;
    if (!matchesFilter) return false;

    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();

    const clientName = String(quote.clientName || "").toLowerCase();
    const carrierName = String(quote.carrierName || "").toLowerCase();
    const subId = String(quote.submissionId || "").toLowerCase();

    return clientName.includes(q) || carrierName.includes(q) || subId.includes(q);
  });

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
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
    <div className="min-h-screen bg-[#f5f1eb]">
      <MobileNav isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-[#e5ddd5] sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between py-4 lg:py-0 lg:h-16 gap-4 lg:gap-0">
            <div className="flex items-center justify-between w-full lg:w-auto">
              <div className="flex items-center gap-4 md:gap-10">
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <Menu className="w-6 h-6 text-[#9A8B7A]" />
                </button>
                <Link href="/admin/dashboard" className="flex items-center gap-4 group">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-orange-500 rounded-2xl blur-md opacity-50 group-hover:opacity-75 animate-pulse transition-all duration-500"></div>
                    <div className="relative w-12 h-12 bg-gradient-to-br from-rose-600 via-rose-700 to-pink-700 rounded-2xl flex items-center justify-center shadow-2xl shadow-rose-600/40 group-hover:shadow-rose-600/60 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3">
                      <div className="absolute inset-1 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
                      <div className="relative">
                        <span className="text-white font-black text-lg tracking-tighter drop-shadow-lg">SP</span>
                      </div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 animate-ping"></div>
                      <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-yellow-400 rounded-full opacity-0 group-hover:opacity-100"></div>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-900 font-bold text-lg tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">Sterling Portal</span>
                      <div className="px-2 py-0.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-md">
                        <span className="text-[10px] font-black text-rose-600 tracking-wider">ADMIN</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 font-semibold -mt-0.5 tracking-wide">Control Center</p>
                  </div>
                </Link>
                <nav className="hidden lg:flex items-center gap-1">
                  <Link href="/admin/dashboard" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Dashboard
                  </Link>
                  <Link href="/admin/things-to-do" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Things To Do
                  </Link>
                  <Link href="/admin/quotes" className="relative px-4 py-2 text-sm font-semibold text-[#9A8B7A]">
                    Quotes
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#9A8B7A] rounded-full"></div>
                  </Link>
                  <Link href="/admin/quote-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Quote Request
                  </Link>
                  <Link href="/admin/bind-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Bind Requests
                  </Link>
                  <Link href="/admin/bound-policies" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Policies
                  </Link>
                  <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                    Tool Requests
                  </Link>
                </nav>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="group relative px-4 py-2 text-sm font-semibold text-[#2d2a26] hover:text-white bg-[#f5f1eb] hover:bg-[#9A8B7A] rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-8">
        {/* Page Title */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#9A8B7A] rounded-xl flex items-center justify-center shadow-lg shadow-gray-200/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Quote Management</h1>
              <p className="text-sm text-gray-600 font-medium mt-0.5">Review and manage all insurance quotes</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-6 relative max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by Client Name, Carrier, or App ID..."
              className="block w-full pl-11 pr-4 py-3 border border-[#e5ddd5] rounded-xl bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent sm:text-sm shadow-sm transition-all duration-300"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-2 mb-6">
          <div className="flex flex-wrap gap-2">
            {["ALL", "ENTERED", "POSTED", "APPROVED", "BIND_REQUESTED", "BOUND"].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filter === status
                    ? "bg-[#9A8B7A] text-white shadow-lg shadow-gray-200/30"
                    : "text-[#6b5e52] hover:bg-[#f5f1eb]"
                  }`}
              >
                {status.replace("_", " ")}
                <span className="ml-2 text-xs opacity-80">
                  ({quotes.filter((q) => status === "ALL" || q.status === status).length})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-center gap-3">
              <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-semibold text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quotes Grid */}
        {quotes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No quotes found</p>
            <p className="text-sm text-gray-600">No quotes have been created yet.</p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No Results Found</p>
            <p className="text-sm text-gray-600">No quotes match your search or filter criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredQuotes.map((quote) => (
              <div
                key={quote._id}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-[#e5ddd5] hover:shadow-xl hover:border-[#9A8B7A] transition-all duration-300 overflow-hidden"
              >
                <div className="p-4 md:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 sm:gap-0 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900">{quote.clientName}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadgeColor(quote.status)}`}>
                          {quote.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">{quote.carrierName}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{new Date(quote.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', month: '2-digit', day: '2-digit', year: 'numeric' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-sm text-[#6b5e52] font-medium mb-1">Final Amount</p>
                      <p className="text-2xl font-bold text-[#9A8B7A]">
                        ${quote.finalAmountUSD.toLocaleString('en-US')}
                      </p>
                    </div>
                  </div>

                  {/* Quote Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/60 mb-4">
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Carrier Quote</p>
                      <p className="text-sm font-bold text-gray-900">${quote.carrierQuoteUSD.toLocaleString('en-US')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium mb-1">Broker Fee</p>
                      <p className="text-sm font-bold text-gray-900">${quote.brokerFeeAmountUSD.toLocaleString('en-US')}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs text-gray-500 font-medium mb-1">Submission ID</p>
                      <p className="text-sm font-mono font-bold text-gray-900">{quote.submissionId}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
                    {quote.status === "ENTERED" && (
                      <button
                        onClick={() => handlePostQuote(quote._id)}
                        className="px-4 py-2 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#8a6f4d] rounded-xl shadow-lg shadow-gray-200/30 hover:shadow-gray-300 transition-all duration-300 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                        Post Quote
                      </button>
                    )}
                    <Link
                      href={`/admin/submissions/${quote.submissionId}`}
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2"
                    >
                      View Details
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
