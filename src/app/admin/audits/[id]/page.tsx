"use client";

import { useParams, useRouter } from "next/navigation";
import PolicyAuditTab from "@/components/audits/PolicyAuditTab";
import { ArrowLeft } from "lucide-react";

export default function AdminAuditDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params?.id as string;

  return (
    <div className="bg-[#f0f4f8] min-h-screen">
      <div className="max-w-[1400px] mx-auto p-8">
        
        <button 
          onClick={() => {
            const backUrl = typeof window !== "undefined" ? sessionStorage.getItem("sterling_admin_back_url") : null;
            router.push(backUrl || "/admin/audit");
          }}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 font-medium mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" /> Back to Audits
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <PolicyAuditTab auditId={auditId} policyNumber="MANUAL AUDIT" />
        </div>
      </div>
    </div>
  );
}
