"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface Industry {
  name: string;
  subtypes: {
    name: string;
    stateSpecific: boolean;
    templateId: string;
  }[];
  hasStateSpecific: boolean;
}

export default function SubmitPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [isCAOperations, setIsCAOperations] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      setLoading(true);
      const stateParam = isCAOperations ? "?state=CA" : "";
      fetch(`/api/industries${stateParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.industries) {
            setIndustries(data.industries);
            setError("");
          } else if (data.error) {
            setError(data.error);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching industries:", err);
          setError("Failed to load industries. Please try again.");
          setLoading(false);
        });
    }
  }, [status, isCAOperations]);

  useEffect(() => {
    setSelectedSubtype("");
    setSelectedTemplateId("");
  }, [selectedIndustry]);

  const handleContinue = () => {
    if (!selectedIndustry || !selectedSubtype || !selectedTemplateId) {
      setError("Please select both industry and subtype to continue.");
      return;
    }
    router.push(`/agency/submit/${selectedTemplateId}`);
  };

  const selectedIndustryData = industries.find((ind) => ind.name === selectedIndustry);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f1eb]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-[#6b5e52] font-medium">Loading...</p>
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/agency/dashboard" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">New Submission</h1>
                <p className="text-sm text-gray-600">Create a new insurance application</p>
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
        <div className="p-6 max-w-5xl mx-auto">

          {/* Hero Section */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e5ddd5] rounded-lg mb-4">
              <svg className="w-4 h-4 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="text-sm font-semibold text-[#9A8B7A]">New Submission</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create Insurance Application
            </h1>
            <p className="text-gray-600">
              Select your industry and coverage type to get started with your submission.
            </p>
          </div>

          {/* Main Form Card */}
          <div className="bg-white rounded-lg border border-[#e5ddd5] overflow-hidden">
            {/* Progress Steps */}
            <div className="bg-[#fdfaf7] px-6 py-4 border-b border-[#e5ddd5]">
              <div className="flex items-center justify-between max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#9A8B7A] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#2d2a26]">Select Coverage</p>
                    <p className="text-xs text-[#6b5e52]">Choose industry type</p>
                  </div>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-4"></div>
                <div className="flex items-center gap-3 opacity-50">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">Application Form</p>
                    <p className="text-xs text-gray-500">Fill details</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 lg:p-8">
              {/* CA Operations Toggle */}
              <div className="mb-8 p-5 bg-[#fdfaf7] rounded-xl border border-[#e5ddd5]">
                <label className="flex items-start gap-4 cursor-pointer">
                  <div className="relative flex items-center h-6 mt-1">
                    <input
                      type="checkbox"
                      checked={isCAOperations}
                      onChange={(e) => setIsCAOperations(e.target.checked)}
                      className="w-5 h-5 text-[#9A8B7A] border-2 border-[#e5ddd5] rounded focus:ring-2 focus:ring-[#9A8B7A] focus:ring-offset-0 transition cursor-pointer"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <svg className="w-5 h-5 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="text-base font-bold text-[#2d2a26]">California Operations</span>
                    </div>
                    <p className="text-sm text-[#6b5e52]">
                      Enable this option if you're submitting for California-specific operations. This will prioritize CA-compliant form templates.
                    </p>
                  </div>
                </label>
              </div>

              {/* Selection Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Industry Selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#2d2a26]">
                    <svg className="w-5 h-5 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Industry Type
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedIndustry}
                    onChange={(e) => {
                      setSelectedIndustry(e.target.value);
                      setSelectedSubtype("");
                      setSelectedTemplateId("");
                    }}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-white border border-[#e5ddd5] rounded-lg text-[#2d2a26] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                  >
                    <option value="">Select an industry...</option>
                    {industries.map((industry) => (
                      <option key={industry.name} value={industry.name}>
                        {industry.name}
                        {industry.hasStateSpecific && isCAOperations && " (CA Available)"}
                      </option>
                    ))}
                  </select>
                  {loading && (
                    <p className="text-xs text-[#6b5e52] flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-gray-300 border-t-[#9A8B7A] rounded-full animate-spin"></div>
                      Loading industries...
                    </p>
                  )}
                </div>

                {/* Subtype Selection */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-bold text-[#2d2a26]">
                    <svg className="w-5 h-5 text-[#9A8B7A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Coverage Subtype
                    <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedSubtype}
                    onChange={(e) => {
                      const subtypeName = e.target.value;
                      setSelectedSubtype(subtypeName);
                      const subtype = selectedIndustryData?.subtypes.find((s) => s.name === subtypeName);
                      if (subtype) {
                        setSelectedTemplateId(subtype.templateId);
                      }
                    }}
                    disabled={!selectedIndustryData || selectedIndustryData.subtypes.length === 0}
                    className="w-full px-4 py-2.5 bg-white border border-[#e5ddd5] rounded-lg text-[#2d2a26] font-medium focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:border-gray-400"
                  >
                    <option value="">Select coverage type...</option>
                    {selectedIndustryData?.subtypes.map((subtype) => (
                      <option key={subtype.name} value={subtype.name}>
                        {subtype.name}
                        {subtype.stateSpecific && " (CA-Specific)"}
                      </option>
                    ))}
                  </select>
                  {selectedIndustryData?.hasStateSpecific && (
                    <p className="text-xs text-[#9A8B7A] flex items-center gap-1.5 font-medium">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      CA-specific templates are prioritized when available
                    </p>
                  )}
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border-l-4 border-red-500 rounded-xl">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-red-800">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
                <button
                  onClick={handleContinue}
                  disabled={!selectedIndustry || !selectedSubtype || !selectedTemplateId || loading}
                  className="flex-1 px-6 py-3 bg-[#9A8B7A] text-white rounded-lg font-semibold hover:bg-[#8a6f4d] focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
                >
                  Continue to Application
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Help Card */}
          <div className="mt-6 bg-white rounded-lg border border-[#e5ddd5] p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[#9A8B7A] rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Need Assistance?</h3>
                <p className="text-gray-700 mb-4">
                  If you're unsure which industry or coverage type to select, our support team is here to help. Contact your Sterling Wholesale Insurance representative for personalized guidance.
                </p>
                <div className="flex items-center gap-4">
                  <Link
                    href="/help"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#9A8B7A] hover:text-[#8a6f4d] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    View Documentation
                  </Link>
                  <span className="text-gray-400">or</span>
                  <a
                    href="mailto:support@sterlingwholesale.com"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[#9A8B7A] hover:text-[#8a6f4d] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Email Support
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
