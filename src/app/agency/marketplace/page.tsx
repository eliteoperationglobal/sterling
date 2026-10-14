"use client";
export const dynamic = 'force-dynamic';

import MarketplaceSidebar from "@/components/layout/MarketplaceSidebar";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import Image from "next/image";
import { Home, Search, ArrowLeft, ShoppingBag, X, Check, ArrowRight, Loader2, Building2, User } from "lucide-react";

interface Program {
  id: string;
  name: string;
  badge?: string;
  badgeColor?: string;
}

interface Industry {
  id: string;
  name: string;
  icon: string;
  featured?: boolean;
  featuredText?: string;
  programs: Program[];
}

function MarketplaceContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlAgencyId = searchParams.get("agencyId");

  const [expandedIndustry, setExpandedIndustry] = useState<string | null>("construction");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

  // Admin Impersonation / Acting Agency State
  const isAdmin = (session?.user as any)?.role === "system_admin";
  const [effectiveAgencyId, setEffectiveAgencyId] = useState<string | null>(null);
  const [actingAgency, setActingAgency] = useState<any>(null);
  const [actingAgencyLoading, setActingAgencyLoading] = useState(false);
  const [dbAgents, setDbAgents] = useState<string[]>([]);

  // Switch Agency Modal State (for admin)
  const [switchAgencyModalOpen, setSwitchAgencyModalOpen] = useState(false);
  const [availableAgencies, setAvailableAgencies] = useState<any[]>([]);
  const [agenciesLoading, setAgenciesLoading] = useState(false);
  const [agencySearchQuery, setAgencySearchQuery] = useState("");
  const [selectedSwitchAgencyId, setSelectedSwitchAgencyId] = useState("");

  // Resolve effective agency ID on load
  useEffect(() => {
    if (isAdmin) {
      const storedId = urlAgencyId || (typeof window !== "undefined" ? sessionStorage.getItem("adminActingAgencyId") : null);
      if (storedId) {
        setEffectiveAgencyId(storedId);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("adminActingAgencyId", storedId);
        }
      } else {
        // If admin is on marketplace without an agency selected, open agency selection modal
        handleOpenSwitchAgencyModal();
      }
    }
  }, [isAdmin, urlAgencyId]);

  // Fetch acting agency details and agents
  useEffect(() => {
    if (isAdmin && effectiveAgencyId) {
      setActingAgencyLoading(true);
      fetch(`/api/agency/me?agencyId=${effectiveAgencyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.agency) {
            setActingAgency(data.agency);
            if (typeof window !== "undefined") {
              sessionStorage.setItem("adminActingAgencyName", data.agency.name || "");
              sessionStorage.setItem("adminActingAgencyEmail", data.agency.email || "");
            }
          }
        })
        .catch((err) => console.error("Error fetching agency details:", err))
        .finally(() => setActingAgencyLoading(false));

      fetch(`/api/agency/agents?agencyId=${effectiveAgencyId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.agents && Array.isArray(data.agents)) {
            setDbAgents(data.agents.map((a: any) => a.name));
          }
        })
        .catch((err) => console.error("Error fetching agency agents:", err));
    }
  }, [isAdmin, effectiveAgencyId]);

  // Fetch all agencies for admin switch modal
  const fetchAvailableAgencies = async () => {
    if (availableAgencies.length > 0) return;
    try {
      setAgenciesLoading(true);
      const res = await fetch("/api/admin/agencies");
      const data = await res.json();
      if (data.success && Array.isArray(data.agencies)) {
        setAvailableAgencies(data.agencies);
      }
    } catch (err) {
      console.error("Error fetching agencies:", err);
    } finally {
      setAgenciesLoading(false);
    }
  };

  const handleOpenSwitchAgencyModal = () => {
    setSelectedSwitchAgencyId(effectiveAgencyId || "");
    setSwitchAgencyModalOpen(true);
    fetchAvailableAgencies();
  };

  const handleConfirmSwitchAgency = () => {
    if (!selectedSwitchAgencyId) return;
    const selectedAgency = availableAgencies.find((a) => a._id === selectedSwitchAgencyId);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("adminActingAgencyId", selectedSwitchAgencyId);
      if (selectedAgency?.name) {
        sessionStorage.setItem("adminActingAgencyName", selectedAgency.name);
      }
      if (selectedAgency?.email) {
        sessionStorage.setItem("adminActingAgencyEmail", selectedAgency.email);
      }
    }
    setEffectiveAgencyId(selectedSwitchAgencyId);
    setSwitchAgencyModalOpen(false);
    router.replace(`/agency/marketplace?agencyId=${selectedSwitchAgencyId}`);
  };

  const filteredSwitchAgencies = useMemo(() => {
    if (!agencySearchQuery.trim()) return availableAgencies;
    const q = agencySearchQuery.toLowerCase();
    return availableAgencies.filter((a) => a.name?.toLowerCase().includes(q));
  }, [availableAgencies, agencySearchQuery]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Link Generation State
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("");
  const [generatedLink, setGeneratedLink] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Agent Logic
  const userName = session?.user?.name || "Agent";
  const email = session?.user?.email || "";
  const agencyName = (session?.user as any)?.agencyName || "";

  const effectiveAgencyName = isAdmin
    ? (actingAgency?.name || (typeof window !== "undefined" ? sessionStorage.getItem("adminActingAgencyName") : "") || "")
    : agencyName;

  const effectiveEmail = isAdmin
    ? (actingAgency?.email || (typeof window !== "undefined" ? sessionStorage.getItem("adminActingAgencyEmail") : "") || "")
    : email;

  const isCapco = effectiveAgencyName.includes("Capital & Co") || effectiveAgencyName.includes("Capco") || effectiveEmail.includes("capcoinsurance") || effectiveEmail === "admin@agency1.com" || userName.includes("Gamaty");
  const isBlueAngel = effectiveAgencyName.includes("Blue Angel") || effectiveEmail === "admin@blueangel.com";
  const isSJJ = effectiveAgencyName.includes("SJJ") || effectiveEmail === "admin@sjjinsurance.com";
  const isPatrickArias = effectiveAgencyName.includes("Patrick Arias") || effectiveEmail.includes("patrickariasinsurance");
  const isTitan = effectiveAgencyName.toLowerCase().includes("titan") || effectiveEmail.includes("solutions@titaninssolutions.com");
  const isTexas = effectiveAgencyName.toLowerCase().includes("texas") || effectiveEmail.toLowerCase().includes("texascomm@services.com");

  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa", "Juan Montoya"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];
  const TEXAS_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa", "Juan Montoya"];

  const defaultAgents = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? TEXAS_AGENTS : [];
  const agentOptions = Array.from(new Set([...defaultAgents, ...dbAgents]));

  const handleGenerateLink = async () => {
    if (!selectedProgram || !selectedAgent) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/agency/links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId: selectedProgram,
          agentName: selectedAgent,
          agencyId: (isAdmin && effectiveAgencyId) ? effectiveAgencyId : undefined,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setGeneratedLink(data.url);
      } else {
        alert(data.error || "Failed to generate link");
      }
    } catch (e) {
      alert("Error generating link");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const getProgramUrl = (basePath: string) => {
    if (isAdmin && effectiveAgencyId) {
      return `${basePath}?agencyId=${effectiveAgencyId}`;
    }
    return basePath;
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
            <div className="absolute inset-0 border-2 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex">
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        <div className="px-4 md:px-10 pt-4 md:pt-8 pb-4">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

            {/* LEFT TITLE */}
            <h1
              onClick={() => router.push(isAdmin ? "/admin/dashboard" : "/agency/dashboard")}
              className="
                px-4 md:px-6 py-2 md:py-2.5 rounded-2xl bg-[#9A8B7A] text-white
                shadow-md hover:shadow-lg hover:scale-[1.04]
                active:scale-[0.98] transition-all duration-200
                text-[34px] md:text-[34px] font-semibold inline-block cursor-pointer
              "
            >
              Sterling Insurance Services
            </h1>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-5 relative">
              <button
                onClick={() => setLinkModalOpen(true)}
                className="text-sm md:text-base font-medium text-[#9A8B7A] bg-white border border-[#9A8B7A] px-4 py-1.5 rounded-lg shadow-sm hover:bg-[#9A8B7A] hover:text-white transition-colors hidden md:block"
              >
                + Generate Application Link
              </button>

              <button
                type="button"
                onClick={() => router.push(isAdmin ? "/admin/dashboard" : "/agency/dashboard")}
                title={isAdmin ? "Return to Admin Dashboard" : "Go to Dashboard"}
                className="
                  h-11 w-11
                  rounded-full
                  bg-[#9A8B7A]
                  flex items-center justify-center
                  shadow-md
                  hover:bg-[#7A6F64]
                  hover:shadow-lg
                  hover:-translate-y-[1px]
                  active:scale-95
                  transition-all duration-200
                "
              >
                <Home className="w-5 h-5 text-white" />
              </button>

              {/* ⭐ PROFILE */}
              <div ref={profileRef} className="relative">
                <button
                  type="button"
                  onClick={() => setProfileOpen(prev => !prev)}
                  className="h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold hover:bg-[#7A6F64] hover:shadow-lg hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
                >
                  {session?.user?.name?.[0] || "U"}
                </button>

                {/* ⭐ DROPDOWN */}
                <div
                  className={`absolute right-0 top-14 w-64 bg-white rounded-2xl shadow-lg border border-[#E5E7EB] z-50
                    transition-all duration-150 ease-out
                    ${profileOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 translate-y-1 pointer-events-none"
                    }`}
                >
                  <div className="px-4 py-3 border-b border-[#E5E7EB]">
                    <p className="font-medium text-sm text-gray-900">
                      {session?.user?.name || "User"}
                    </p>
                    <p className="text-xs text-gray-600">
                      {session?.user?.email || "email@example.com"}
                    </p>
                    {isAdmin && (
                      <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider bg-rose-100 text-rose-700 px-2 py-0.5 rounded">
                        System Admin
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => router.push("/admin/dashboard")}
                      className="w-full text-left px-4 py-2 text-sm text-[#7A6F64] font-medium hover:bg-[#f5f1eb] transition border-b border-gray-100"
                    >
                      ← Back to Admin Dashboard
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-[#f5f1eb] transition"
                  >
                    Logout
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ⭐ ADMIN IMPERSONATION BANNER ⭐ */}
        {isAdmin && (
          <div className="max-w-[1400px] mx-auto px-4 md:px-10 mb-4">
            <div className="bg-white/95 backdrop-blur-md border border-[#9A8B7A]/30 rounded-2xl px-6 py-4 shadow-sm flex items-center justify-between gap-4">
              <h2 className="text-lg md:text-xl font-bold text-gray-900">
                {effectiveAgencyName || (actingAgencyLoading ? "Loading..." : "Agency")}
              </h2>

              <button
                type="button"
                onClick={() => router.push("/admin/dashboard")}
                className="text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-[#9A8B7A] hover:text-white transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            </div>
          </div>
        )}

        {/* Content: Insurance Program Cards */}
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row flex-wrap justify-center p-4 md:p-10 gap-4 md:gap-10">

          {/* 1. Advantage Contractor GL */}
          <button
            onClick={() => router.push(getProgramUrl("/agency/quote/advantage-contractor"))}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            Construction
          </button>

          {/* 2. Apartment Buildings / Commercial Property */}
          <button
            onClick={() => router.push(getProgramUrl("/agency/quote/apartment-buildings"))}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            Commercial Property
          </button>

          {/* 3. Hospitals */}
          <button
            onClick={() => alert("Hospitals program is coming soon!")}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            Hospitals
          </button>

          {/* 4. Contractors Equipment */}
          <button
            onClick={() => router.push(getProgramUrl("/agency/quote/contractors-equipment"))}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            Contractors Equipment
          </button>

          {/* 5. Manufacturers */}
          <button
            onClick={() => router.push(getProgramUrl("/agency/quote/manufacturers"))}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            Manufacturers
          </button>

          {/* 6. Builders Risk */}
          <button
            onClick={() => router.push(getProgramUrl("/agency/quote/builders-risk"))}
            className="
              w-full md:w-[320px] 
              h-[120px] 
              rounded-2xl 
              bg-[#9A8B7A] 
              text-white 
              text-2xl 
              font-semibold
              flex 
              items-center 
              justify-center
              shadow-md
              hover:shadow-lg
              hover:scale-[1.02]
              active:scale-[0.98]
              transition-all
              duration-200
            "
          >
            BUILDERS RISK
          </button>
        </div>
      </main>

      {/* Link Generation Modal */}
      {linkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-[#f9f9f9]">
              <h2 className="text-xl font-semibold text-gray-800">Generate Application Link</h2>
              <button onClick={() => { setLinkModalOpen(false); setGeneratedLink(""); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-5">
              {isAdmin && effectiveAgencyName && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                  <span className="font-semibold">Generating link for agency:</span>
                  <span className="font-bold underline">{effectiveAgencyName}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Which program is this for?</label>
                <select
                  value={selectedProgram}
                  onChange={(e) => { setSelectedProgram(e.target.value); setGeneratedLink(""); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9A8B7A]"
                >
                  <option value="">Select a program</option>
                  <option value="advantage-contractor">Construction</option>
                  <option value="apartment-buildings">Commercial Property</option>
                  <option value="contractors-equipment">Contractors Equipment</option>
                  <option value="manufacturers">Manufacturers</option>
                  <option value="builders-risk">Builders Risk</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Which agent is handling the account?</label>
                <select
                  value={selectedAgent}
                  onChange={(e) => { setSelectedAgent(e.target.value); setGeneratedLink(""); }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#9A8B7A]"
                >
                  <option value="">Select an agent</option>
                  {agentOptions.map(agent => (
                    <option key={agent} value={agent}>{agent}</option>
                  ))}
                </select>
              </div>

              {generatedLink && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Share this link with the insured:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={generatedLink}
                      className="flex-1 border border-gray-300 rounded-md px-3 py-1.5 text-sm bg-white text-gray-600"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(generatedLink);
                        setIsCopied(true);
                        setTimeout(() => setIsCopied(false), 2000);
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isCopied
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                        }`}
                    >
                      {isCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">This is a single-use link that expires in 7 days.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-[#f9f9f9] flex justify-end gap-3">
              <button
                onClick={() => { setLinkModalOpen(false); setGeneratedLink(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateLink}
                disabled={!selectedProgram || !selectedAgent || isGenerating}
                className="px-4 py-2 bg-[#9A8B7A] hover:bg-[#8A7B6A] text-white rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isGenerating ? "Generating..." : "Generate Link"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Switch Agency Modal (for Admin) */}
      {switchAgencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-[#e5ddd5] flex flex-col max-h-[88vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-[#fcfbf9] to-[#f5f0e8]/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#9A8B7A] to-[#7A6F64] flex items-center justify-center text-white shadow-md">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Select Agency</h3>
                  <p className="text-xs text-gray-500">Choose an agency to access the marketplace on their behalf</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSwitchAgencyModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search agency by name..."
                  value={agencySearchQuery}
                  onChange={(e) => setAgencySearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#9A8B7A] focus:border-transparent bg-gray-50/50 hover:bg-white transition"
                  autoFocus
                />
              </div>
            </div>

            {/* Agency List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[350px]">
              {agenciesLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-center">
                  <Loader2 className="w-8 h-8 text-[#9A8B7A] animate-spin mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Loading agencies...</p>
                </div>
              ) : filteredSwitchAgencies.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-500">
                  No agencies found matching &quot;{agencySearchQuery}&quot;
                </div>
              ) : (
                filteredSwitchAgencies.map((agency) => {
                  const isSelected = selectedSwitchAgencyId === agency._id;
                  return (
                    <div
                      key={agency._id}
                      onClick={() => setSelectedSwitchAgencyId(agency._id)}
                      className={`px-4 py-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "border-[#9A8B7A] bg-[#f5f0e8]/70 shadow-sm ring-1 ring-[#9A8B7A]"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/70"
                      }`}
                    >
                      <span className={`text-sm truncate ${isSelected ? "text-gray-900 font-semibold" : "text-gray-800 font-medium"}`}>
                        {agency.name}
                      </span>

                      <div className="flex-shrink-0">
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            isSelected
                              ? "border-[#9A8B7A] bg-[#9A8B7A] text-white"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSwitchAgencyModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-xl transition"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!selectedSwitchAgencyId}
                onClick={handleConfirmSwitchAgency}
                className="px-5 py-2.5 text-sm font-semibold text-white bg-[#9A8B7A] hover:bg-[#7A6F64] rounded-xl shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-2 border-gray-200 rounded-full"></div>
              <div className="absolute inset-0 border-2 border-transparent border-t-[#9A8B7A] rounded-full animate-spin"></div>
            </div>
            <p className="text-sm text-gray-600 font-medium">Loading marketplace...</p>
          </div>
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}