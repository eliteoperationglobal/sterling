"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, FileText, AlertCircle, Save, ArrowLeft, Calendar, FileCheck, Check, Info, File as FileIcon, MoreHorizontal, Eye, UploadCloud, X, Download } from "lucide-react";
import { toast } from "sonner";
import { useCallback } from "react";

export default function PolicyAuditTab({ submissionId, auditId, policyNumber = "PENDING" }: { submissionId?: string, auditId?: string, policyNumber?: string }) {
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"overview" | "edit">("overview");

  // File Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingDocs, setUploadingDocs] = useState(false);

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);

  // Form states
  const [estimatedExposure, setEstimatedExposure] = useState("");
  const [auditedExposure, setAuditedExposure] = useState("");
  const [rate, setRate] = useState("");
  const [surplusTaxRate, setSurplusTaxRate] = useState("");
  const [stampingFeeRate, setStampingFeeRate] = useState("");
  const [carrierFee, setCarrierFee] = useState("");
  const [sterlingFee, setSterlingFee] = useState("");
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    try {
      const queryParam = submissionId ? `submissionId=${submissionId}` : `auditId=${auditId}`;
      const res = await fetch(`/api/admin/audits?${queryParam}`);
      const data = await res.json();
      if (data.success && data.audits && data.audits.length > 0) {
        setAudit(data.audits[0]);
        if (data.audits[0].estimatedExposure !== undefined) {
          setEstimatedExposure(data.audits[0].estimatedExposure.toString());
        }
        if (data.audits[0].auditedExposure > 0) {
          setAuditedExposure(data.audits[0].auditedExposure.toString());
        }
        setRate(data.audits[0].rate ? data.audits[0].rate.toString() : "");
        setCarrierFee(data.audits[0].carrierFee ? data.audits[0].carrierFee.toString() : "");
        setSterlingFee(data.audits[0].sterlingFee ? data.audits[0].sterlingFee.toString() : "");
        if (data.audits[0].surplusLinesTaxRate !== undefined) setSurplusTaxRate(data.audits[0].surplusLinesTaxRate.toString());
        if (data.audits[0].stampingFeeRate !== undefined) setStampingFeeRate(data.audits[0].stampingFeeRate.toString());
        if (data.audits[0].auditNotes) setNotes(data.audits[0].auditNotes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAudit = async (statusUpdate?: string) => {
    setIsSaving(true);
    try {
      const payload: any = {
        estimatedExposure: parseFloat(estimatedExposure) || 0,
        auditedExposure: parseFloat(auditedExposure) || 0,
        rate: parseFloat(rate) || 0,
        carrierFee: parseFloat(carrierFee) || 0,
        sterlingFee: parseFloat(sterlingFee) || 0,
        surplusLinesTaxRate: parseFloat(surplusTaxRate) || 0,
        stampingFeeRate: parseFloat(stampingFeeRate) || 0,
        auditNotes: notes,
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
        setViewMode("overview");
        fetchAudit();
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

  const handleFileUpload = useCallback(async (files: FileList | File[]) => {
    if (!audit || !audit._id || !files || files.length === 0) return;

    const MAX_MB = 10;
    const filesArray = Array.from(files);

    for (const file of filesArray) {
      if (file.size > MAX_MB * 1024 * 1024) {
        toast.error(`File ${file.name} exceeds ${MAX_MB}MB`);
        return;
      }
    }

    try {
      setUploadingDocs(true);
      let successCount = 0;

      for (const file of filesArray) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(`/api/admin/audits/${audit._id}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          toast.error(`Failed: ${errData.error || res.statusText} | ${errData.details || ""}`);
        } else {
          successCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount} document(s) uploaded successfully`);
        fetchAudit(); // Refresh the audit to get new documents
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to upload documents");
    } finally {
      setUploadingDocs(false);
      setIsDragging(false);
    }
  }, [audit]);

  const openDeleteModal = (docId: string) => {
    setDocToDelete(docId);
    setDeleteModalOpen(true);
  };

  const confirmDeleteDocument = async () => {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    try {
      const res = await fetch(`/api/admin/audits/${audit._id}/documents/${docToDelete}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Document deleted");
        fetchAudit();
        setDeleteModalOpen(false);
        setDocToDelete(null);
      } else {
        toast.error(data.error || "Failed to delete");
      }
    } catch (error) {
      toast.error("Error deleting document");
    } finally {
      setIsDeletingDoc(false);
    }
  };

  useEffect(() => {
    if (submissionId || auditId) {
      fetchAudit();
    }
  }, [submissionId, auditId]);

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
            if (data.success) fetchAudit();
          }}
          className="px-6 py-3 bg-rose-600 text-white font-semibold rounded-lg hover:bg-rose-700 transition shadow-sm"
        >
          Start Manual Audit
        </button>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  const parseNum = (val: string) => parseFloat(val.replace(/[^0-9.-]+/g, "")) || 0;

  // Math variables
  const estExposure = parseNum(estimatedExposure);
  const originalPremium = (estExposure / 1000) * parseNum(rate);
  const currentAuditedExposure = parseNum(auditedExposure);
  const auditedPremium = (currentAuditedExposure / 1000) * parseNum(rate);

  const exposureDiff = currentAuditedExposure - estExposure;
  const exposureDiffPercent = estExposure > 0 ? (exposureDiff / estExposure) * 100 : 0;

  const premiumDifference = auditedPremium - originalPremium;

  const slTax = premiumDifference * (parseNum(surplusTaxRate) / 100);
  const stampFee = premiumDifference * (parseNum(stampingFeeRate) / 100);
  const cFee = parseNum(carrierFee);
  const sFee = parseNum(sterlingFee);

  const additionalPremiumDue = premiumDifference + slTax + stampFee + cFee + sFee;

  // Workflow Stages
  const stages = [
    { id: "REQUESTED", label: "Requested", date: new Date(audit.createdAt).toLocaleDateString("en-US"), desc: "Audit requested by carrier" },
    { id: "DOCS_RECEIVED", label: "Documents Received", date: "Pending", desc: "All required documents received" },
    { id: "UNDERWRITER_REVIEW", label: "Underwriter Review", date: "Pending", desc: "Underwriter is reviewing documents and exposures" },
    { id: "FINALIZED", label: "Finalized", date: "Pending", desc: "Audit will be finalized after approval" }
  ];

  if (viewMode === "edit") {
    return (
      <div className="bg-[#fcfbf9] -m-6 p-6 min-h-[800px]">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[28px] font-bold text-slate-900 tracking-tight flex items-center gap-4">
            <button
              onClick={() => setViewMode("overview")}
              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-gray-500" />
            </button>
            Enter Audit Revenue
          </h2>
          <div className="flex items-center gap-6 mt-2 ml-11 text-sm text-gray-500 font-medium">
            <span className="flex items-center gap-2">Policy Number: <strong className="text-gray-900">{policyNumber}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">Carrier: <strong className="text-gray-900">{audit.carrier}</strong></span>
            <span className="text-gray-300">|</span>
            <span className="flex items-center gap-2">Audit ID: <strong className="text-gray-900">{audit.auditId}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Forms */}
          <div className="lg:col-span-2 space-y-6">

            {/* Revenue Audit */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#f0f4f8] px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Revenue Audit</h3>
              </div>
              <div className="p-6">
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Audit Period</label>
                  <div className="relative w-64">
                    <input
                      type="text"
                      readOnly
                      value={`${new Date(audit.auditPeriodStart).toLocaleDateString("en-US")} - ${new Date(audit.auditPeriodEnd).toLocaleDateString("en-US")}`}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 pr-10 outline-none"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6 items-start">
                  <div>
                    <label className="block text-xs font-semibold text-blue-600 mb-1.5 flex items-center gap-1">
                      Original Estimated Gross Revenue
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-blue-500 font-bold">$</span>
                      <input
                        type="text"
                        value={estimatedExposure ? parseNum(estimatedExposure).toLocaleString() : ""}
                        onChange={(e) => setEstimatedExposure(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))}
                        className="w-full bg-white border border-blue-300 text-slate-900 text-sm font-semibold rounded-lg pl-7 pr-3 py-2 outline-none focus:ring-2 focus:ring-blue-200 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">Audited Gross Revenue</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-emerald-600 font-bold">$</span>
                      <input
                        type="text"
                        value={auditedExposure ? parseNum(auditedExposure).toLocaleString() : ""}
                        onChange={(e) => setAuditedExposure(e.target.value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, ''))}
                        className="w-full bg-white border-2 border-emerald-500 text-slate-900 text-sm font-bold rounded-lg pl-7 pr-8 py-2 outline-none focus:ring-2 focus:ring-emerald-200 transition-all"
                      />
                      <div className="absolute right-3 top-2.5 bg-emerald-500 rounded-full p-0.5">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                    {exposureDiff !== 0 && (
                      <p className={`text-xs font-bold mt-1.5 flex items-center gap-1 ${exposureDiff > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {exposureDiff > 0 ? '↑' : '↓'} {exposureDiff > 0 ? '+' : ''}{formatCurrency(exposureDiff)} ({exposureDiff > 0 ? '+' : ''}{exposureDiffPercent.toFixed(1)}%)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Difference</label>
                    <input
                      type="text"
                      readOnly
                      value={`${exposureDiff > 0 ? '+' : ''}${formatCurrency(exposureDiff)}`}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Rating Details */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-[#f0f4f8] px-5 py-3 border-b border-slate-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-800 text-sm">Rating Details</h3>
              </div>
              <div className="p-6 grid grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Rate per $1,000</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                    <input
                      type="text"
                      value={rate}
                      onChange={(e) => setRate(e.target.value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-7 pr-3 py-2 outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Surplus Lines Tax</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={surplusTaxRate}
                      onChange={(e) => setSurplusTaxRate(e.target.value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Stamping Fee</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={stampingFeeRate}
                      onChange={(e) => setStampingFeeRate(e.target.value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg px-3 py-2 outline-none focus:bg-white focus:border-blue-400"
                    />
                    <span className="absolute right-3 top-2.5 text-slate-400 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Carrier Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                    <input
                      type="text"
                      value={carrierFee}
                      onChange={(e) => setCarrierFee(e.target.value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-7 pr-3 py-2 outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Sterling Service Fee</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-400 font-medium">$</span>
                    <input
                      type="text"
                      value={sterlingFee}
                      onChange={(e) => setSterlingFee(e.target.value.replace(/[^0-9.]/g, '').replace(/^0+(?=\d)/, ''))}
                      className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg pl-7 pr-3 py-2 outline-none focus:bg-white focus:border-blue-400"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 overflow-hidden">
              <div className="bg-[#fffcf3] px-5 py-3 border-b border-amber-200 flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-900 text-sm">Audit Notes</h3>
              </div>
              <div className="p-6 bg-[#fffdf8]">
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter notes about the audited revenue, supporting documentation, or other relevant details..."
                  className="w-full bg-white border border-amber-200 text-slate-700 text-sm rounded-lg px-4 py-3 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all resize-none"
                />
              </div>
            </div>

          </div>

          {/* Right Column - Calculations */}
          <div>
            <div className="bg-[#fff0f5] rounded-2xl p-7 border border-rose-100 shadow-sm sticky top-6">
              <h3 className="text-lg font-bold text-rose-900 mb-1 flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                Audit Premium Calculation
              </h3>
              <p className="text-xs text-rose-700/70 mb-8">Calculated automatically from audited revenue.</p>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                  <span>Original Premium</span>
                  <span>{formatCurrency(originalPremium)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-medium text-slate-700">
                  <span>Audited Premium</span>
                  <span>{formatCurrency(auditedPremium)}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-bold text-rose-600 bg-rose-100/50 -mx-4 px-4 py-3 my-2 rounded-lg">
                  <span>Premium Difference</span>
                  <span>{formatCurrency(premiumDifference)}</span>
                </div>

                <div className="pt-2 space-y-4">
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Surplus Lines Tax ({surplusTaxRate}%)</span>
                    <span>{formatCurrency(slTax)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Stamping Fee ({stampingFeeRate}%)</span>
                    <span>{formatCurrency(stampFee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Carrier Fee</span>
                    <span>{formatCurrency(cFee)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-600">
                    <span>Sterling Service Fee</span>
                    <span>{formatCurrency(sFee)}</span>
                  </div>
                </div>

                <div className="h-px bg-rose-200/60 my-6"></div>

                <div className="flex justify-between items-center">
                  <span className="text-base font-bold text-rose-600">Additional Premium Due</span>
                  <span className="text-2xl font-black text-rose-600">{formatCurrency(additionalPremiumDue)}</span>
                </div>
              </div>

              <div className="mt-10 flex gap-3">
                <button
                  onClick={() => updateAudit()}
                  disabled={isSaving}
                  className="w-1/3 py-3 px-4 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
                >
                  Save Draft
                </button>
                <button
                  onClick={() => updateAudit("UNDERWRITER_REVIEW")}
                  disabled={isSaving}
                  className="w-2/3 py-3 px-4 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 transition-colors shadow-sm shadow-rose-200 disabled:opacity-50"
                >
                  Submit for Underwriter Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6 pb-12">

      {/* LEFT COLUMN - Overview */}
      <div className="lg:col-span-2 space-y-6">

        {/* Workflow Strip */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#e5ddd5]">
          <h3 className="text-[17px] font-bold text-gray-900 mb-8">Audit Workflow</h3>
          <div className="flex items-start justify-between relative px-2">
            <div className="absolute top-5 left-10 right-10 h-0.5 bg-gray-200 -z-10"></div>

            {stages.map((stage, idx) => {
              const isPast = ["FINALIZED", "APPROVED", "COMPLETE"].includes(audit.status) ||
                (audit.status === "UNDERWRITER_REVIEW" && idx < 2) ||
                (audit.status === "DOCS_RECEIVED" && idx < 1);
              const isCurrent = audit.status === stage.id || (audit.status === "APPROVED" && stage.id === "FINALIZED");

              return (
                <div key={stage.id} className="flex flex-col items-center w-1/4 text-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-colors
                    ${isPast ? 'bg-emerald-500 text-white shadow-sm' :
                      isCurrent ? 'bg-rose-600 text-white ring-[6px] ring-rose-50' :
                        'bg-gray-100 text-gray-300 border-2 border-white'}`}
                  >
                    {isPast ? <Check className="w-5 h-5 stroke-[3]" /> :
                      isCurrent ? <div className="w-3 h-3 rounded-full bg-white animate-pulse"></div> :
                        <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>}
                  </div>
                  <h4 className={`font-bold text-[13px] ${isCurrent ? 'text-gray-900' : 'text-gray-600'}`}>{stage.label}</h4>
                  {isCurrent && <p className="text-[11px] font-bold text-rose-600 mt-1 uppercase tracking-wider">In Progress</p>}
                  {isPast && <p className="text-[11px] font-semibold text-gray-500 mt-1">{stage.date}</p>}
                  <p className="text-[11px] text-gray-400 mt-2 px-4 leading-relaxed hidden md:block">{stage.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audited Exposure */}
        <div className="bg-white p-7 rounded-2xl shadow-sm border border-[#e5ddd5]">
          <h3 className="text-[17px] font-bold text-gray-900 mb-6">Audited Exposure</h3>

          <div className="grid grid-cols-4 gap-8">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Estimated Gross Sales</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(estExposure)}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Audited Gross Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {audit.auditedExposure > 0 ? formatCurrency(audit.auditedExposure) : "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Rate per $1,000</p>
              <p className="text-2xl font-bold text-gray-900">${rate}</p>
            </div>

            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Audit Effective Date</p>
              <p className="text-2xl font-bold text-gray-900">{new Date(audit.auditPeriodStart).toLocaleDateString("en-US")}</p>
            </div>
          </div>

          {/* Fees Summary */}
          <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-4 gap-8">
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Sterling Service Fee</p>
              <p className="text-lg font-bold text-gray-900">${sterlingFee}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide mb-2">Carrier Fee</p>
              <p className="text-lg font-bold text-gray-900">${carrierFee}</p>
            </div>
          </div>
        </div>

        {/* Supporting Documents */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5ddd5] overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-[17px] font-bold text-gray-900">Supporting Documents</h3>
          </div>
          
          <div className="p-6">
            <div
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${isDragging ? "border-blue-500 bg-blue-50/50" : "border-gray-300 hover:border-gray-400"} ${uploadingDocs ? "opacity-50 pointer-events-none" : ""}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleFileUpload(e.dataTransfer.files);
                }
              }}
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-200">
                <UploadCloud className="w-5 h-5 text-gray-600" />
              </div>
              <h4 className="text-[15px] font-bold text-gray-900 mb-1">Click or drag files here to upload</h4>
              <p className="text-xs text-gray-500 mb-4">Support for PDF, DOC, ZIP up to 10MB</p>
              
              <label className="cursor-pointer inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-sm font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition shadow-sm">
                <span>Select Files</span>
                <input 
                  type="file" 
                  className="hidden" 
                  multiple 
                  onChange={(e) => {
                    if (e.target.files) handleFileUpload(e.target.files);
                  }}
                />
              </label>
              
              {uploadingDocs && (
                <p className="text-sm font-semibold text-blue-600 mt-4 animate-pulse">Uploading documents...</p>
              )}
            </div>
          </div>
          
          <div className="w-full">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Filename</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Uploaded On</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wide text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!audit.documents || audit.documents.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                      No documents uploaded yet
                    </td>
                  </tr>
                )}
                {audit.documents?.map((doc: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        {doc.fileName || doc.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {new Date(doc.uploadedAt || audit.createdAt).toLocaleDateString("en-US")}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${doc.status === 'VERIFIED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                        {doc.status === 'VERIFIED' && <CheckCircle className="w-3.5 h-3.5" />} 
                        {doc.status || "RECEIVED"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {doc.fileUrl && (
                          <>
                            <a href={`/api/download?url=${encodeURIComponent(doc.fileUrl)}`} className="text-sm font-bold text-gray-500 hover:text-gray-800 transition">Download</a>
                            <a href={`/api/download?url=${encodeURIComponent(doc.fileUrl)}&view=true`} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-gray-500 hover:text-gray-800 transition">View</a>
                          </>
                        )}
                        <button onClick={() => openDeleteModal(doc.documentId)} className="text-gray-400 hover:text-rose-600 transition"><X className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-6">

        {/* Premium Reconciliation */}
        <div className="bg-[#fffdfb] rounded-2xl p-7 border border-[#e5ddd5] shadow-sm">
          <h3 className="text-[17px] font-bold text-slate-900 mb-6">Premium Reconciliation</h3>

          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-medium text-slate-600">
              <span>Deposit Premium</span>
              <span className="font-bold text-slate-900">{formatCurrency(originalPremium)}</span>
            </div>
            <div className="flex justify-between items-center text-sm font-medium text-slate-600">
              <span>Audited Premium</span>
              <span className="font-bold text-slate-900">
                {audit.auditedExposure > 0 ? formatCurrency(auditedPremium) : "—"}
              </span>
            </div>

            <div className="h-px bg-gray-200 my-4"></div>

            <div className="flex justify-between items-center">
              <span className="text-[15px] font-bold text-slate-900">Additional Premium Due</span>
              <span className="text-2xl font-black text-rose-600">
                {audit.auditedExposure > 0 ? formatCurrency(additionalPremiumDue) : "—"}
              </span>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <button
              className="w-1/3 py-2.5 px-4 bg-white border border-gray-300 text-gray-700 font-bold text-sm rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
            >
              Save Draft
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className="w-2/3 py-2.5 px-4 bg-blue-600 text-white font-bold text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200"
            >
              Enter Audit Revenue
            </button>
          </div>
        </div>

        {/* Audit Activity */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e5ddd5] overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-[15px] font-bold text-gray-900">Audit Activity</h3>
          </div>
          <div className="p-0">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="px-5 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">User</th>
                  <th className="px-5 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wide">Activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(!audit.activities || audit.activities.length === 0) ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-gray-500 text-sm">
                      No activity recorded yet
                    </td>
                  </tr>
                ) : (
                  audit.activities.map((activityObj: any, index: number) => {
                    const dateObj = new Date(activityObj.timestamp || activityObj.createdAt);
                    return (
                      <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <p className="text-xs font-semibold text-gray-900">{dateObj.toLocaleDateString("en-US")}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">{dateObj.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit' })}</p>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-600 font-medium">
                          {activityObj.user || "System"}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-700 leading-tight">
                          {activityObj.activity || activityObj.action}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && docToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Document?</h3>
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to permanently delete this document? This action cannot be undone.
              </p>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => {
                    setDeleteModalOpen(false);
                    setDocToDelete(null);
                  }}
                  disabled={isDeletingDoc}
                  className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteDocument}
                  disabled={isDeletingDoc}
                  className="flex-1 px-4 py-2.5 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition flex items-center justify-center gap-2"
                >
                  {isDeletingDoc ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Document"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
