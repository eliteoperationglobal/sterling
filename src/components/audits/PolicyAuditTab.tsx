"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText, AlertCircle, Save, Send, Eye } from "lucide-react";
import { toast } from "sonner";

export default function PolicyAuditTab({ submissionId }: { submissionId: string }) {
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);

  // Edit states for Exposure
  const [isEditingExposure, setIsEditingExposure] = useState(false);
  const [auditedExposure, setAuditedExposure] = useState("");
  const [rate, setRate] = useState("");

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/audits?submissionId=${submissionId}`);
      const data = await res.json();
      if (data.success && data.audits && data.audits.length > 0) {
        setAudit(data.audits[0]);
        setAuditedExposure(data.audits[0].auditedExposure.toString());
        setRate(data.audits[0].rate.toString());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const updateAudit = async (statusUpdate?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        auditedExposure,
        rate,
        action: statusUpdate ? `Status updated to ${statusUpdate}` : "Saved draft values"
      };
      
      if (statusUpdate) {
        payload.status = statusUpdate;
      }

      const res = await fetch(`/api/admin/audits/${audit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(statusUpdate ? `Audit submitted for review!` : `Audit draft saved!`);
        setIsEditingExposure(false);
        fetchAudit(); // refresh data
      } else {
        toast.error(data.error || "Failed to update audit");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    fetchAudit();
  }, [submissionId]);

  if (loading) {
    return <div className="p-12 text-center text-gray-500">Loading audit details...</div>;
  }

  if (!audit) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-sm border border-gray-100">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">No Audit Record Found</h3>
        <p className="text-gray-500 mb-6">An audit has not been requested for this policy yet.</p>
        <button 
          onClick={async () => {
            const res = await fetch("/api/admin/audits", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ submissionIds: [submissionId] })
            });
            const data = await res.json();
            if(data.success) fetchAudit();
          }}
          className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition"
        >
          Start Manual Audit
        </button>
      </div>
    );
  }

  // Derived values
  const auditedPremiumCalc = (parseFloat(auditedExposure) / audit.rateBasis) * parseFloat(rate);
  const premiumDifference = auditedPremiumCalc - audit.depositPremium;
  const isAdditionalPremium = premiumDifference > 0;

  // Workflow Stages
  const stages = [
    { id: "REQUESTED", label: "Requested", date: new Date(audit.createdAt).toLocaleDateString("en-US"), desc: "Audit requested by carrier" },
    { id: "DOCS_RECEIVED", label: "Documents Received", date: "Pending", desc: "Awaiting documents" },
    { id: "UNDERWRITER_REVIEW", label: "Underwriter Review", date: "Pending", desc: "Underwriter review" },
    { id: "FINALIZED", label: "Finalized", date: "Pending", desc: "Audit will be finalized" }
  ];

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      
      {/* LEFT COLUMN */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Workflow Strip */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5ddd5]">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Audit Workflow</h3>
          <div className="flex items-start justify-between relative">
            {/* Connecting Line */}
            <div className="absolute top-5 left-8 right-8 h-1 bg-gray-200 -z-10 rounded-full"></div>
            
            {stages.map((stage, idx) => {
              const isPast = ["FINALIZED", "APPROVED", "COMPLETE"].includes(audit.status) || 
                             (audit.status === "UNDERWRITER_REVIEW" && idx < 2) ||
                             (audit.status === "DOCS_RECEIVED" && idx < 1);
              const isCurrent = audit.status === stage.id || (audit.status === "APPROVED" && stage.id === "FINALIZED");
              
              return (
                <div key={stage.id} className="flex flex-col items-center w-1/4 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-sm mb-3
                    ${isPast ? 'bg-emerald-500 text-white' : 
                      isCurrent ? 'bg-rose-600 text-white ring-4 ring-rose-100' : 
                      'bg-gray-200 text-gray-400'}`}
                  >
                    {isPast ? <CheckCircle className="w-5 h-5" /> : 
                     isCurrent ? <Clock className="w-5 h-5" /> : 
                     <div className="w-3 h-3 rounded-full bg-white"></div>}
                  </div>
                  <h4 className={`font-bold text-sm ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>{stage.label}</h4>
                  <p className={`text-xs mt-1 font-semibold ${isCurrent ? 'text-rose-600' : 'text-gray-500'}`}>{stage.date}</p>
                  <p className="text-[11px] text-gray-400 mt-1 px-2 leading-tight">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audited Exposure */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5ddd5]">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Audited Exposure</h3>
            {!isEditingExposure ? (
              <button 
                onClick={() => setIsEditingExposure(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition shadow-sm"
              >
                <FileText className="w-4 h-4" /> Edit Values
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setAuditedExposure(audit.auditedExposure.toString());
                    setRate(audit.rate.toString());
                    setIsEditingExposure(false);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-gray-600 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => updateAudit()}
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-emerald-600 border border-emerald-700 rounded-lg hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-4 gap-6">
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Estimated {audit.exposureBasis}</p>
              <p className="text-xl font-bold text-gray-900">${audit.estimatedExposure.toLocaleString()}</p>
            </div>
            
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 col-span-2">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wide mb-1">Audited {audit.exposureBasis}</p>
              {isEditingExposure ? (
                <input 
                  type="text" 
                  value={auditedExposure}
                  onChange={(e) => setAuditedExposure(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full text-xl font-bold text-emerald-900 bg-white border border-emerald-200 rounded px-3 py-1 outline-none focus:ring-2 focus:ring-emerald-500" 
                />
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold text-emerald-700">${parseFloat(auditedExposure || "0").toLocaleString("en-US")}</p>
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                </div>
              )}
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Rate per ${audit.rateBasis.toLocaleString("en-US")}</p>
              {isEditingExposure ? (
                <input 
                  type="text" 
                  value={rate}
                  onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, ''))}
                  className="w-full text-lg font-bold text-gray-900 bg-white border border-gray-200 rounded px-2 py-1 outline-none" 
                />
              ) : (
                <p className="text-xl font-bold text-gray-900">${parseFloat(rate || "0").toFixed(4)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5ddd5] overflow-hidden">
          <div className="p-6 border-b border-[#e5ddd5]">
            <h3 className="text-xl font-bold text-gray-900">Supporting Documents</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-[#fcfaf8]">
              <tr>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Document Name</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Uploaded On</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5ddd5]">
              {audit.documents?.map((doc: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-sm text-gray-900">{doc.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString("en-US") : 'Pending'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${
                      doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' : 
                      doc.status === 'RECEIVED' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <CheckCircle className="w-3 h-3 mr-1 inline" /> {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-sm font-semibold text-blue-600 hover:underline">View</button>
                  </td>
                </tr>
              ))}
              {(!audit.documents || audit.documents.length === 0) && (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No documents requested.</td></tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">
        
        {/* Premium Reconciliation */}
        <div className="bg-rose-50/50 p-6 rounded-2xl border border-rose-100 shadow-sm">
          <div className="flex items-center gap-2 mb-6 text-rose-900">
            <FileText className="w-5 h-5" />
            <h3 className="text-lg font-bold">Premium Reconciliation</h3>
          </div>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Deposit Premium</span>
              <span>${audit.depositPremium.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-600">
              <span>Audited Premium</span>
              <span>${(auditedPremiumCalc || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center py-4 border-y border-rose-200/50 mb-6 bg-rose-100/30 px-3 rounded-lg">
            <span className="font-bold text-rose-900">Premium Difference</span>
            <span className="font-bold text-rose-700 text-lg">
              {isAdditionalPremium ? '+' : ''}${(premiumDifference || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>

          <div className="space-y-3 mb-8">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Surplus Lines Tax ({audit.surplusLinesTaxRate}%)</span>
              <span>${((premiumDifference * audit.surplusLinesTaxRate) / 100 || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Stamping Fee ({audit.stampingFeeRate}%)</span>
              <span>${((premiumDifference * audit.stampingFeeRate) / 100 || 0).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center mb-8">
            <span className="font-bold text-rose-900 text-lg">
              {isAdditionalPremium ? 'Additional Premium Due' : 'Return Premium Due'}
            </span>
            <span className="text-2xl font-black text-rose-600">
              ${Math.abs(premiumDifference + ((premiumDifference * audit.surplusLinesTaxRate)/100) + ((premiumDifference * audit.stampingFeeRate)/100) || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}
            </span>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={() => updateAudit()}
              disabled={isSaving}
              className="flex-1 py-3 bg-white border border-gray-300 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
            <button 
              onClick={() => updateAudit("UNDERWRITER_REVIEW")}
              disabled={isSaving}
              className="flex-1 py-3 bg-rose-600 rounded-xl text-sm font-bold text-white hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
            >
              Submit Review
            </button>
          </div>
        </div>

        {/* Audit Activity */}
        <div className="bg-white p-6 rounded-2xl border border-[#e5ddd5] shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Audit Activity</h3>
          <div className="space-y-4">
            {audit.activities && audit.activities.length > 0 ? (
              audit.activities.map((activity: any) => (
                <div key={activity._id} className="flex gap-3 text-sm">
                  <div className="w-24 flex-shrink-0 text-xs text-gray-500 font-medium">
                    {new Date(activity.timestamp).toLocaleDateString("en-US")}<br/>
                    {new Date(activity.timestamp).toLocaleTimeString("en-US", {hour: '2-digit', minute:'2-digit'})}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{activity.user} <span className="text-gray-400 font-normal">({activity.role})</span></p>
                    <p className="font-semibold text-gray-700">{activity.activity}</p>
                    {activity.details && <p className="text-gray-500 text-xs mt-0.5">{activity.details}</p>}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No activity recorded yet.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
