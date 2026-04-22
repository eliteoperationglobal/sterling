"use client";
import MarketplaceSidebar from "@/components/layout/MarketplaceSidebar";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
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
              <button
                type="button"
                onClick={() => setProfileOpen(prev => !prev)}
                className="h-11 w-11 rounded-full bg-[#9A8B7A] text-white flex items-center justify-center font-semibold hover:bg-[#7A6F64] hover:shadow-lg hover:-translate-y-[1px] active:scale-95 transition-all duration-200"
              >
                {session?.user?.name?.[0] || "U"}
              </button>

              {/* ⭐ DROPDOWN */}
              <div
                className={`absolute right-0 top-14 w-64 bg-white rounded-full shadow-lg border border-[#E5E7EB] z-50
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
                  onClick={() => signOut()}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-[#f5f1eb] transition"
                >
                  Logout
                </button>
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
        </div>
      </main>
    </div>
  );
}