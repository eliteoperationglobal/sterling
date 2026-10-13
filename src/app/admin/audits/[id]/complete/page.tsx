"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, Edit3, Building, DollarSign, Calendar, 
  FileText, CheckCircle2, ShieldCheck, Download, Eye, Clock, 
  User, Mail, Phone, ExternalLink, ArrowUpRight, ArrowDownRight,
  TrendingUp, AlertCircle, Receipt, Loader2
} from "lucide-react";
import { toast } from "sonner";

export default function CompleteAuditInfoPage() {
  const params = useParams();
  const router = useRouter();
  const auditIdParam = params?.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    if (!audit?._id || isDownloading) return;
    setIsDownloading(true);
    const toastId = toast.loading("Generating invoice PDF, please wait...");

    try {
      const response = await fetch(`/api/admin/audits/${audit._id}/invoice`);
      if (!response.ok) {
        throw new Error("Failed to generate PDF invoice");
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `Invoice-${audit.auditId || audit.policyNumber || "Audit"}.pdf`;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice PDF downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("PDF download error:", err);
      toast.error(err.message || "Failed to download invoice PDF. Please try again.", { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    if (!auditIdParam) return;

    const fetchAudit = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/audits?auditId=${auditIdParam}`);
        const data = await res.json();
        if (data.success && data.audits && data.audits.length > 0) {
          setAudit(data.audits[0]);
        } else {
          setError("Audit record not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load audit information");
      } finally {
        setLoading(false);
      }
    };

    fetchAudit();
  }, [auditIdParam]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const formatDate = (dateVal: any) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateVal: any) => {
    if (!dateVal) return "—";
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col items-center gap-4 max-w-sm w-full text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Loading Audit Information</h3>
            <p className="text-sm text-slate-500 mt-1">Fetching detailed records...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm max-w-md w-full text-center">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg mb-2">Audit Not Found</h3>
          <p className="text-sm text-slate-500 mb-6">{error || "The requested audit record could not be loaded."}</p>
          <button
            onClick={() => router.push(`/admin/audits/${auditIdParam}`)}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition"
          >
            Return to Audit
          </button>
        </div>
      </div>
    );
  }

  // Financial Calculations matching PolicyAuditTab
  const estExposure = Number(audit.estimatedExposure) || 0;
  const auditedExposure = Number(audit.auditedExposure) || 0;
  const rate = Number(audit.rate) || 0;
  const rateBasis = Number(audit.rateBasis) || 1000;

  const originalPremium = (estExposure / rateBasis) * rate;
  const auditedPremium = (auditedExposure / rateBasis) * rate;
  const premiumDifference = auditedPremium - originalPremium;

  const exposureDiff = auditedExposure - estExposure;
  const exposureDiffPercent = estExposure > 0 ? (exposureDiff / estExposure) * 100 : 0;

  const surplusTaxRate = Number(audit.surplusLinesTaxRate) || 0;
  const stampingFeeRate = Number(audit.stampingFeeRate) || 0;
  const carrierFee = Number(audit.carrierFee) || 0;
  const sterlingFee = Number(audit.sterlingFee) || 0;

  const slTax = premiumDifference * (surplusTaxRate / 100);
  const stampFee = premiumDifference * (stampingFeeRate / 100);

  const additionalPremiumDue = premiumDifference + slTax + stampFee + carrierFee + sterlingFee;

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-800 pb-16 print:bg-white print:p-0">
      {/* Top Action & Navigation Bar (hidden on print) */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden shadow-xs">
        <div className="max-w-[1360px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin/audits/${audit._id}`)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Audit
            </button>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <span>Audits</span>
              <span>/</span>
              <span className="text-slate-700">{audit.auditId || "Audit"}</span>
              <span>/</span>
              <span className="text-blue-600">Information & Summary</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/admin/audits/${audit._id}`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition shadow-xs"
            >
              <Edit3 className="w-4 h-4 text-slate-500" />
              Edit Audit
            </button>
            <button
              onClick={handleDownloadInvoice}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed transition shadow-xs cursor-pointer"
            >
              {isDownloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Download Invoice
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1360px] mx-auto px-6 pt-8 space-y-6">
        
        {/* HERO HEADER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-7 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                  Audit Summary
                </span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {audit.status || "COMPLETE"}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  Source: <strong className="text-slate-700 font-semibold">{audit.source === "PORTAL" ? "Portal Submission" : "Manual Audit"}</strong>
                </span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                {audit.namedInsured || "Audit Information"}
              </h1>
              <div className="flex flex-wrap items-center gap-y-1 gap-x-6 mt-3 text-sm text-slate-600">
                <div>
                  <span className="text-slate-400 font-medium">Audit ID: </span>
                  <strong className="text-slate-800 font-bold">{audit.auditId || "—"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Policy #: </span>
                  <strong className="text-slate-800 font-semibold">{audit.policyNumber || "MANUAL AUDIT"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date: </span>
                  <strong className="text-slate-800 font-semibold">{formatDate(audit.auditEffectiveDate || audit.auditPeriodStart)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Carrier: </span>
                  <strong className="text-slate-800 font-semibold">{audit.carrier || "Unknown Carrier"}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Audit Period: </span>
                  <strong className="text-slate-800 font-semibold">
                    {formatDate(audit.auditPeriodStart)} – {formatDate(audit.auditPeriodEnd)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick KPI Badge */}
            <div className="bg-[#fff5f7] border border-rose-200 rounded-2xl p-5 lg:min-w-[280px] flex flex-col justify-center">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700 mb-1">
                Additional Premium Due
              </span>
              <span className="text-3xl font-black text-rose-600 tracking-tight">
                {formatCurrency(additionalPremiumDue)}
              </span>
              <span className="text-[11px] text-rose-700/80 font-medium mt-1">
                Net balance after taxes and fees
              </span>
            </div>
          </div>
        </div>

        {/* 2-COLUMN MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* LEFT 2 COLUMNS: Details, Revenue, Notes */}
          <div className="lg:col-span-2 space-y-6">

            {/* 1. Policy & Insured Information */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Policy & Insured Information</h2>
                </div>
              </div>
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-y-5 gap-x-6 text-sm">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Named Insured</label>
                  <p className="font-semibold text-slate-900">{audit.namedInsured || "—"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Carrier</label>
                  <p className="font-semibold text-slate-900">{audit.carrier || "Unknown Carrier"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Policy Number</label>
                  <p className="font-semibold text-slate-900">{audit.policyNumber || "MANUAL AUDIT"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Program / Coverage</label>
                  <p className="font-semibold text-slate-900">{audit.program || "General Liability"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Client Email</label>
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    {audit.clientEmail || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Client Phone</label>
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {audit.clientPhone || "—"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Producing Agency</label>
                  <p className="font-medium text-slate-700">{audit.agencyId?.name || "Direct"}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Effective Date</label>
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(audit.auditEffectiveDate || audit.auditPeriodStart)}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wide block mb-1">Due Date</label>
                  <p className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {formatDate(audit.dueDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Revenue & Exposure Audit Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <h2 className="text-base font-bold text-slate-900">Revenue & Exposure Audit</h2>
                </div>
                <span className="text-xs font-medium text-slate-500">
                  Basis: per $1,000 revenue
                </span>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/70">
                    <span className="text-xs font-semibold text-slate-500 block mb-1">
                      Original Estimated Exposure
                    </span>
                    <span className="text-xl font-bold text-slate-900">
                      {formatCurrency(estExposure)}
                    </span>
                    <span className="text-[11px] text-slate-400 block mt-1">Initial policy basis</span>
                  </div>

                  <div className="bg-blue-50/60 rounded-xl p-4 border border-blue-200/70">
                    <span className="text-xs font-semibold text-blue-700 block mb-1">
                      Audited Gross Revenue
                    </span>
                    <span className="text-xl font-bold text-blue-900">
                      {formatCurrency(auditedExposure)}
                    </span>
                    <span className="text-[11px] text-blue-600 block mt-1">Verified actual basis</span>
                  </div>

                  <div className={`rounded-xl p-4 border ${exposureDiff >= 0 ? "bg-emerald-50/60 border-emerald-200/70" : "bg-amber-50/60 border-amber-200/70"}`}>
                    <span className={`text-xs font-semibold block mb-1 ${exposureDiff >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                      Exposure Variance
                    </span>
                    <span className={`text-xl font-bold flex items-center gap-1 ${exposureDiff >= 0 ? "text-emerald-900" : "text-amber-900"}`}>
                      {exposureDiff >= 0 ? "+" : ""}{formatCurrency(exposureDiff)}
                    </span>
                    <span className={`text-[11px] font-semibold block mt-1 ${exposureDiff >= 0 ? "text-emerald-700" : "text-amber-700"}`}>
                      {exposureDiff >= 0 ? `+${exposureDiffPercent.toFixed(1)}%` : `${exposureDiffPercent.toFixed(1)}%`} change
                    </span>
                  </div>
                </div>

                {/* Rating Details Strip */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Rating Parameters</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm">
                    <div>
                      <span className="text-xs text-slate-500 block">Rate / $1,000</span>
                      <strong className="text-slate-800 font-bold">{formatCurrency(rate)}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Surplus Lines Tax</span>
                      <strong className="text-slate-800 font-semibold">{surplusTaxRate}%</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Stamping Fee</span>
                      <strong className="text-slate-800 font-semibold">{stampingFeeRate}%</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Carrier Fee</span>
                      <strong className="text-slate-800 font-semibold">{formatCurrency(carrierFee)}</strong>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Premium Audit Service Fee</span>
                      <strong className="text-slate-800 font-semibold">{formatCurrency(sterlingFee)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Uploaded Documents */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Audit Documents</h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  {audit.documents?.length || 0} File(s)
                </span>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-3">Document Name</th>
                      <th className="px-6 py-3">Uploaded On</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!audit.documents || audit.documents.length === 0) ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm">
                          No audit documents attached
                        </td>
                      </tr>
                    ) : (
                      audit.documents.map((doc: any, i: number) => (
                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-semibold text-slate-900">
                            {doc.fileName || doc.name}
                          </td>
                          <td className="px-6 py-3.5 text-slate-500">
                            {formatDate(doc.uploadedAt || audit.createdAt)}
                          </td>
                          <td className="px-6 py-3.5">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              {doc.status || "RECEIVED"}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {doc.fileUrl ? (
                              <div className="inline-flex items-center gap-2">
                                <a
                                  href={`/api/download?url=${encodeURIComponent(doc.fileUrl)}&view=true`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800 transition"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </a>
                                <span className="text-slate-300">·</span>
                                <a
                                  href={`/api/download?url=${encodeURIComponent(doc.fileUrl)}`}
                                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download
                                </a>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Audit Notes */}
            {audit.auditNotes && (
              <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
                <div className="px-6 py-3.5 bg-amber-50/50 border-b border-amber-200 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <h3 className="font-bold text-amber-900 text-sm">Audit Notes & Remarks</h3>
                </div>
                <div className="p-6 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {audit.auditNotes}
                </div>
              </div>
            )}

            {/* 5. Activity Log */}
            <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-500" />
                  <h2 className="text-base font-bold text-slate-900">Audit Activity & History</h2>
                </div>
              </div>
              <div className="p-0">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-2.5">Date & Time</th>
                      <th className="px-6 py-2.5">User</th>
                      <th className="px-6 py-2.5">Action & Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(!audit.activities || audit.activities.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-6 text-center text-slate-400 text-sm">
                          No audit activity recorded yet
                        </td>
                      </tr>
                    ) : (
                      audit.activities.map((act: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-6 py-3 text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatDateTime(act.timestamp || act.createdAt)}
                          </td>
                          <td className="px-6 py-3 text-xs font-semibold text-slate-800">
                            {act.user || "System"}
                          </td>
                          <td className="px-6 py-3 text-xs text-slate-600">
                            <span className="font-semibold text-slate-800">{act.activity || act.action}</span>
                            {act.details && <span className="text-slate-500"> — {act.details}</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Premium Calculation Statement */}
          <div className="space-y-6">
            
            {/* AUDIT PREMIUM CALCULATION STATEMENT CARD */}
            <div className="bg-[#fffdfd] rounded-2xl border-2 border-rose-200 p-6 shadow-sm sticky top-24">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-rose-600" />
                  Audit Premium Calculation
                </h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Official reconciled premium statement calculated from audited gross revenue.
              </p>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Original (Deposit) Premium</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(originalPremium)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Audited Premium</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(auditedPremium)}</span>
                </div>

                <div className="flex justify-between items-center font-bold text-rose-700 bg-rose-50 px-3 py-2.5 rounded-xl border border-rose-100">
                  <span>Premium Difference</span>
                  <span>{premiumDifference >= 0 ? "+" : ""}{formatCurrency(premiumDifference)}</span>
                </div>

                <div className="pt-2 space-y-2.5 border-t border-slate-100 text-xs text-slate-600">
                  <div className="flex justify-between items-center">
                    <span>Surplus Lines Tax ({surplusTaxRate}%)</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(slTax)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Stamping Fee ({stampingFeeRate}%)</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(stampFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Carrier Fee</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(carrierFee)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Premium Audit Service Fee</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(sterlingFee)}</span>
                  </div>
                </div>

                <div className="h-px bg-rose-200 my-4"></div>

                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wide block">
                      Total Additional Due
                    </span>
                    <span className="text-[11px] text-slate-500">Payable to Sterling Insurance</span>
                  </div>
                  <span className="text-2xl font-black text-rose-600 tracking-tight">
                    {formatCurrency(additionalPremiumDue)}
                  </span>
                </div>
              </div>

              {/* Action buttons inside calculation card */}
              <div className="mt-8 pt-5 border-t border-rose-100 flex flex-col gap-2.5 print:hidden">
                <button
                  onClick={handleDownloadInvoice}
                  disabled={isDownloading}
                  className="w-full py-3 px-4 bg-rose-600 text-white font-bold text-sm rounded-xl hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed transition shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Download Invoice (PDF)
                    </>
                  )}
                </button>
                <button
                  onClick={() => router.push(`/admin/audits/${audit._id}`)}
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 text-slate-700 font-bold text-sm rounded-xl hover:bg-slate-50 transition shadow-xs text-center cursor-pointer"
                >
                  Edit Audit Parameters
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
