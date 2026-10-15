"use client";

import { useParams, useRouter } from "next/navigation";
import PolicyAuditTab from "@/components/audits/PolicyAuditTab";
import { ArrowLeft } from "lucide-react";

export default function AgencyAuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params?.id as string;

  const handleBack = () => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("agency_selected_stage", "MANUAL_AUDIT");
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/agency/dashboard");
    }
  };

  return (
    <div className="bg-[#FAF9F6] min-h-screen">
      <div className="max-w-[1400px] mx-auto p-6 md:p-8">
        
        <button 
          onClick={handleBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold mb-6 transition-colors px-3 py-2 bg-white rounded-lg border border-gray-200 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-[#E5E2DF] overflow-hidden">
          <PolicyAuditTab auditId={auditId} />
        </div>
      </div>
    </div>
  );
}
