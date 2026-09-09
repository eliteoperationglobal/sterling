"use client";
import MarketplaceSidebar from "@/components/layout/MarketplaceSidebar";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { Home, Search, ArrowLeft } from "lucide-react";


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

export default function MarketplacePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [expandedIndustry, setExpandedIndustry] = useState<string | null>("construction");
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);

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

  const isCapco = agencyName.includes("Capital & Co") || agencyName.includes("Capco") || email.includes("capcoinsurance") || email === "admin@agency1.com" || userName.includes("Gamaty");
  const isBlueAngel = agencyName.includes("Blue Angel") || email === "admin@blueangel.com";
  const isSJJ = agencyName.includes("SJJ") || email === "admin@sjjinsurance.com";
  const isPatrickArias = agencyName.includes("Patrick Arias") || email.includes("patrickariasinsurance");
  const isTitan = agencyName.toLowerCase().includes("titan") || email.includes("solutions@titaninssolutions.com");
  const isTexas = agencyName.toLowerCase().includes("texas") || email.toLowerCase().includes("texascomm@services.com");

  const CAPCO_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];
  const BLUE_ANGEL_AGENTS = ["Max Mintz"];
  const SJJ_AGENTS = ["Sam Joffe", "Nathan Gawronsky", "Jack Douek", "Will Feldsher", "Joel Gabai", "Dean Halleluyan", "Harel Fedida"];
  const PATRICK_ARIAS_AGENTS = ["Patrick Arias"];
  const TITAN_AGENTS = ["Judah Cohen"];
  const TEXAS_AGENTS = ["Eidan Gamaty", "Moshe Gamaty", "Michael Gamaty", "Yoav Anatian", "Jake Weiner", "Benjamin Solender", "Michal Kraut", "Jonathan Akwa"];

  const agentOptions = isCapco ? CAPCO_AGENTS : isBlueAngel ? BLUE_ANGEL_AGENTS : isSJJ ? SJJ_AGENTS : isPatrickArias ? PATRICK_ARIAS_AGENTS : isTitan ? TITAN_AGENTS : isTexas ? TEXAS_AGENTS : [];

  const handleGenerateLink = async () => {
    if (!selectedProgram || !selectedAgent) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/agency/links/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ programId: selectedProgram, agentName: selectedAgent })
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

  const industries: Industry[] = [
    {
      id: "construction",
      name: "Construction",
      icon: "construction",
      featured: true,
      featuredText: "New Lower Rates for Standard GL!",
      programs: [
        {
          id: "advantage-contractor",
          name: "Advantage Contractor General Liability",
          badge: "NEW All 50 States!",
          badgeColor: "teal"
        },
        // {
        //   id: "plus-contractor",
        //   name: "Plus Contractor General Liability"
        // },
        // {
        //   id: "standard-contractor",
        //   name: "Standard Contractor General Liability",
        //   badge: "NEW Lower Rates!",
        //   badgeColor: "teal"
        // },
        // {
        //   id: "builders-risk",
        //   name: "Builders Risk"
        // }
      ]
    },
    // {
    //   id: "property",
    //   name: "Property",
    //   icon: "property",
    //   programs: [
    //     { id: "investor-property", name: "Investor Property" },
    //     { id: "builders-renovation", name: "Builder's Renovation" },
    //     { id: "vacant-land", name: "Vacant Land" },
    //     { id: "vacant-package", name: "Vacant Package" },
    //     { id: "1-8-dwelling", name: "1-8 Unit Dwelling" }
    //   ]
    // },
    // {
    //   id: "hospitality",
    //   name: "Hospitality",
    //   icon: "hospitality",
    //   programs: [
    //     { id: "hospitality", name: "Hospitality" }
    //   ]
    // },
    // {
    //   id: "trucking",
    //   name: "Trucking",
    //   icon: "trucking",
    //   programs: [
    //     { id: "domestic-long-haul", name: "Domestic Long Haul" },
    //     { id: "cargo", name: "Cargo" },
    //     { id: "physical-damage", name: "Physical Damage" }
    //   ]
    // },
    // {
    //   id: "excess",
    //   name: "Excess",
    //   icon: "excess",
    //   programs: [
    //     { id: "excess-everything", name: "Excess for Everything" },
    //     { id: "construction-excess", name: "Construction Excess Liability" },
    //     { id: "petroleum-excess", name: "Petroleum Distribution Excess Liability" }
    //   ]
    // }
  ];

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [status, router]);

  const handleIndustryClick = (industryId: string) => {
    if (expandedIndustry === industryId) {
      setExpandedIndustry(null);
    } else {
      setExpandedIndustry(industryId);
    }
  };



  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e8]">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-cyan-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
          <p className="text-sm text-gray-600 font-medium">Loading marketplace...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") return null;

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex">
      {/* Sidebar - Matching Dashboard */}
      {/* <MarketplaceSidebar /> */}

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Header */}
        {/* DASHBOARD STYLE HEADER */}
        <div className="px-4 md:px-10 pt-4 md:pt-8 pb-4">
          <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">

            {/* LEFT TITLE */}
            <h1
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
                onClick={() => router.push("/agency/dashboard")}
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
                  </div>

                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/signin" })}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-[#f5f1eb] transition"
                  >
                    Logout
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row flex-wrap justify-start p-4 md:p-10 gap-4 md:gap-10">

          {/* BIG CONSTRUCTION BUTTON */}
          <button
            onClick={() => router.push("/agency/quote/advantage-contractor")}
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
          <button
            onClick={() => router.push("/agency/quote/apartment-buildings")}
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
          <button
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
          <Link href="/agency/quote/contractors-equipment" className="w-full md:w-auto">
            <button
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
          </Link>
          <Link href="/agency/quote/manufacturers" className="w-full md:w-auto">
            <button
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
          </Link>
          <Link href="/agency/quote/builders-risk" className="w-full md:w-auto">
            <button
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
          </Link>
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

    </div>
  );
}