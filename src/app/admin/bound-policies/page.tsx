"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { signOut } from "next-auth/react";

interface BoundPolicy {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  agencyId: {
    _id: string;
    name: string;
  } | null;
  templateId: {
    _id: string;
    industry: string;
    subcategory?: string;
  } | null;
  status: string;
  bindRequested: boolean;
  bindRequestedAt: string;
  bindApproved: boolean;
  bindApprovedAt: string;
  bindStatus: string;
  esignCompleted: boolean;
  esignCompletedAt?: string;
  paymentStatus: string;
  paymentDate?: string;
  paymentAmount?: number;
  paymentMethod?: string;
  quote: {
    _id: string;
    carrierId: string;
    carrierName: string;
    carrierQuoteUSD: number;
    premiumTaxAmountUSD?: number;
    policyFeeUSD?: number;
    brokerFeeAmountUSD: number;
    finalAmountUSD: number;
    policyNumber?: string;
    status: string;
  } | null;
  createdAt: string;
}

export default function AdminBoundPoliciesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [policies, setPolicies] = useState<BoundPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
      fetchBoundPolicies();
    }
  }, [status]);

  const fetchBoundPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/bound-policies", {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch bound policies");
      }

      const policiesData = data.policies || [];
      console.log("Fetched bound policies:", policiesData.length);
      console.log("Policy IDs:", policiesData.map((p: any) => p._id));
      setPolicies(policiesData);
    } catch (err: any) {
      console.error("Fetch bound policies error:", err);
      setError(err.message || "Failed to load bound policies");
      toast.error("Failed to load bound policies", {
        description: err.message || "An unexpected error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="text-center">
          <div className="relative w-12 h-12 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-rose-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-rose-600 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading bound policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/60 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
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
                <Link href="/admin/quotes" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quotes
                </Link>
                <Link href="/admin/quote-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Quote Request
                </Link>
                <Link href="/admin/bind-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Bind Requests
                </Link>
                <Link href="/admin/bound-policies" className="relative px-4 py-2 text-sm font-semibold text-rose-600">
                  Policies
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-rose-600 rounded-full"></div>
                </Link>
                <Link href="/admin/tool-requests" className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition">
                  Tool Requests
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-semibold text-gray-900">{(session?.user as any)?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 font-medium">{(session?.user as any)?.email}</p>
              </div>
              <button
                onClick={() => signOut()}
                className="group relative px-4 py-2 text-sm font-semibold text-gray-700 hover:text-white bg-gradient-to-r from-gray-100 to-gray-200 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
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
      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Bound Policies</h1>
              <p className="text-sm text-gray-600 font-medium mt-0.5">
                Manage bound insurance policies • {policies.length} {policies.length === 1 ? 'Policy' : 'Policies'}
              </p>
            </div>
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

        {/* Policies Grid */}
        {policies.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 p-12 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-1">No Bound Policies</p>
            <p className="text-sm text-gray-600">Approved bind requests will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {policies.map((policy) => (
              <div
                key={policy._id}
                className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/60 hover:shadow-xl hover:border-emerald-200 transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{policy.clientContact.name}</h3>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 border border-emerald-200">
                          ✓ BOUND
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {policy.agencyId && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            <span className="font-medium">{policy.agencyId.name}</span>
                          </div>
                        )}
                        {policy.quote && (
                          <div className="flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            <span className="font-medium">{policy.quote.carrierName}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{new Date(policy.bindApprovedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    {policy.quote && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500 font-medium mb-1">Premium</p>
                        <p className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                          ${policy.quote.finalAmountUSD.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Policy Details Grid */}
                  {policy.quote && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl border border-gray-200/60 mb-4">
                      {policy.quote.policyNumber && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Policy Number</p>
                          <p className="text-sm font-bold text-gray-900">{policy.quote.policyNumber}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Carrier Quote</p>
                        <p className="text-sm font-bold text-gray-900">${policy.quote.carrierQuoteUSD.toLocaleString()}</p>
                      </div>
                      {policy.quote.premiumTaxAmountUSD && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Premium Tax</p>
                          <p className="text-sm font-bold text-gray-900">${policy.quote.premiumTaxAmountUSD.toFixed(2)}</p>
                        </div>
                      )}
                      {policy.quote.policyFeeUSD && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Policy Fee</p>
                          <p className="text-sm font-bold text-gray-900">${policy.quote.policyFeeUSD.toFixed(2)}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-500 font-medium mb-1">Broker Fee</p>
                        <p className="text-sm font-bold text-gray-900">${policy.quote.brokerFeeAmountUSD.toLocaleString()}</p>
                      </div>
                      {policy.paymentStatus === "PAID" && policy.paymentDate && (
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-1">Payment Date</p>
                          <p className="text-sm font-bold text-green-600">
                            ✓ {new Date(policy.paymentDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3">
                    {policy._id ? (
                      <>
                        <Link
                          href={`/admin/bound-policies/${policy._id}/upload`}
                          className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          Upload Final Documents
                        </Link>
                        <Link
                          href={`/admin/submissions/${policy._id}`}
                          className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center gap-2 cursor-pointer"
                        >
                          View Details
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400 italic">Policy ID missing</span>
                    )}
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
