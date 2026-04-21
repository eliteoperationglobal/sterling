"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { toast } from "sonner";

interface BoundPolicy {
  _id: string;
  clientContact: {
    name: string;
    email: string;
    phone: string;
  };
  programName?: string;
  status: string;
  bindApprovedAt?: string;
  finalPolicyDocuments?: {
    finalBinderPdfUrl?: string;
    finalPolicyPdfUrl?: string;
    certificateOfInsuranceUrl?: string;
  };
  quote?: {
    _id: string;
    carrierName: string;
    finalAmountUSD: number;
    effectiveDate?: string;
    expirationDate?: string;
    policyNumber?: string;
  };
  createdAt: string;
}

export default function AgencyBoundPoliciesPage() {
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
      if (userRole !== "agency_admin" && userRole !== "agency_user") {
        router.push("/signin");
      } else {
        fetchPolicies();
      }
    }
  }, [status, session, router]);

  const fetchPolicies = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/agency/bound-policies", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch bound policies");
      }

      const data = await response.json();
      setPolicies(data.policies || []);
    } catch (err: any) {
      console.error("Fetch policies error:", err);
      setError(err.message || "Failed to load bound policies");
      toast.error("Failed to load bound policies", {
        description: err.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading bound policies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
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
        <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agency/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bound Policies</h1>
                <p className="text-sm text-gray-600">View and manage your bound insurance policies</p>
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/signin" })}
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
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

          {/* Policies List */}
          {policies.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Bound Policies Yet</h3>
              <p className="text-gray-600">
                Policies will appear here once they are bound by the carrier
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {policies.map((policy) => (
                <div
                  key={policy._id}
                  className="bg-white rounded-lg border border-gray-200 hover:shadow-lg hover:border-cyan-200 transition-all duration-300 p-6"
                >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {policy.clientContact.name}
                      </h3>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        ✓ BOUND
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {policy.programName || "Insurance Policy"}
                    </p>
                  </div>
                  {policy.bindApprovedAt && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Bound on</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(policy.bindApprovedAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                      </p>
                    </div>
                  )}
                </div>

                  {/* Policy Details */}
                  {policy.quote && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div>
                      <span className="text-xs text-gray-500">Carrier</span>
                      <p className="font-semibold text-gray-900">{policy.quote.carrierName}</p>
                    </div>
                    {policy.quote.policyNumber && (
                      <div>
                        <span className="text-xs text-gray-500">Policy Number</span>
                        <p className="font-semibold text-gray-900">{policy.quote.policyNumber}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Premium</span>
                      <p className="font-semibold text-green-600">
                        ${policy.quote.finalAmountUSD.toFixed(2)}
                      </p>
                    </div>
                    {policy.quote.effectiveDate && (
                      <div>
                        <span className="text-xs text-gray-500">Effective Date</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(policy.quote.effectiveDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                    {policy.quote.expirationDate && (
                      <div>
                        <span className="text-xs text-gray-500">Expiration Date</span>
                        <p className="font-semibold text-gray-900">
                          {new Date(policy.quote.expirationDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Final Documents */}
                {policy.finalPolicyDocuments && (
                  policy.finalPolicyDocuments.finalBinderPdfUrl ||
                  policy.finalPolicyDocuments.finalPolicyPdfUrl ||
                  policy.finalPolicyDocuments.certificateOfInsuranceUrl
                ) ? (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Final Policy Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {policy.finalPolicyDocuments.finalBinderPdfUrl && (
                        <a
                          href={policy.finalPolicyDocuments.finalBinderPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Final Binder
                        </a>
                      )}
                      {policy.finalPolicyDocuments.finalPolicyPdfUrl && (
                        <a
                          href={policy.finalPolicyDocuments.finalPolicyPdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Final Policy
                        </a>
                      )}
                      {policy.finalPolicyDocuments.certificateOfInsuranceUrl && (
                        <a
                          href={policy.finalPolicyDocuments.certificateOfInsuranceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2.5 bg-[#9A8B7A] text-white rounded-lg hover:bg-[#8a6f4d] transition-colors text-sm font-semibold"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          Certificate
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      ⏳ Final documents pending upload by admin
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      Client: {policy.clientContact.email}
                    </span>
                  </div>
                  {policy.quote && (
                    <Link
                      href={`/agency/quotes/${policy.quote._id}`}
                      className="text-[#9A8B7A] hover:text-[#8a6f4d] text-sm font-semibold"
                    >
                      View Quote Details →
                    </Link>
                  )}
                </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
