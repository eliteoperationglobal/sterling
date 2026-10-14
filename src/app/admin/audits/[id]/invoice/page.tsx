"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AuditInvoicePage() {
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
      try {
        const res = await fetch(`/api/admin/audits?auditId=${auditIdParam}`);
        const data = await res.json();
        if (data.success && data.audits && data.audits.length > 0) {
          setAudit(data.audits[0]);
        } else {
          setError("Audit record not found");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load audit");
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-sm text-black">
        Loading invoice...
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center text-sm text-black">
        <div>
          <p className="mb-4">{error || "Audit not found."}</p>
          <button
            onClick={() => router.push(`/admin/audits/${auditIdParam}/complete`)}
            className="px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded cursor-pointer"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  // Exact math calculations
  const estExposure = Number(audit.estimatedExposure) || 0;
  const auditedExposure = Number(audit.auditedExposure) || 0;
  const rate = Number(audit.rate) || 0;
  const rateBasis = Number(audit.rateBasis) || 1000;

  const originalPremium = (estExposure / rateBasis) * rate;
  const auditedPremium = (auditedExposure / rateBasis) * rate;
  const premiumDifference = auditedPremium - originalPremium;

  const exposureDiff = auditedExposure - estExposure;
  const pctChange = estExposure > 0 ? ((auditedExposure - estExposure) / estExposure) * 100 : 0;
  const isPositiveExposure = exposureDiff >= 0;
  const varianceAmountStr = `${isPositiveExposure ? '+' : '-'}${formatCurrency(Math.abs(exposureDiff))}`;
  const pctChangeStr = `${isPositiveExposure ? '+' : ''}${pctChange.toFixed(1)}% change`;

  const surplusTaxRate = Number(audit.surplusLinesTaxRate) || 0;
  const stampingFeeRate = Number(audit.stampingFeeRate) || 0;
  const carrierFee = Number(audit.carrierFee) || 0;
  const sterlingFee = Number(audit.sterlingFee) || 0;

  const slTax = premiumDifference * (surplusTaxRate / 100);
  const stampFee = premiumDifference * (stampingFeeRate / 100);

  const additionalPremiumDue = premiumDifference + slTax + stampFee + carrierFee + sterlingFee;

  const payload = audit.submissionId?.payload || {};
  const clientPhone = audit.clientPhone || payload.applicantPhone || payload.phone || "";
  const clientEmail = audit.clientEmail || payload.applicantEmail || payload.email || "";
  const clientContactParts = [clientPhone, clientEmail].filter(Boolean);
  const clientContactLine = clientContactParts.join(" | ");

  const startDateStr = audit.auditPeriodStart ? new Date(audit.auditPeriodStart).toLocaleDateString("en-US") : "";
  const endDateStr = audit.auditPeriodEnd ? new Date(audit.auditPeriodEnd).toLocaleDateString("en-US") : "";
  const effectiveDatesStr = startDateStr && endDateStr ? `${startDateStr} - ${endDateStr}` : "";

  const appId = audit.auditId ? audit.auditId.replace("AUD-", "") : audit._id.slice(-6);
  const policyNumberStr = audit.policyNumber || "PENDING";

  // Dynamic Agency Details from audit.agencyId or submission.agencyId
  const agency: any = (audit.agencyId && typeof audit.agencyId === "object" ? audit.agencyId : null) || (audit.submissionId as any)?.agencyId || null;
  const agencyName = agency?.name || "Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services";
  const agencyStreet = agency?.address?.street || "5455 Wilshire Blvd. #1816";
  const agencyCity = agency?.address?.city || "Los Angeles";
  const agencyState = agency?.address?.state || "CA";
  const agencyZip = agency?.address?.zip || "90036";
  const agencyCityStateZip = [agencyCity, agencyState].filter(Boolean).join(", ") + (agencyZip ? ` ${agencyZip}` : "");
  const agencyPhone = agency?.phone || "(310) 492-2007";
  const agencyEmail = agency?.email || "CS@capcoinsurance.com";
  const agencyContactParts = [agencyPhone, agencyEmail].filter(Boolean);
  const agencyContactLine = agencyContactParts.join(" | ");

  const renderAgencyName = () => {
    if (agencyName.includes(" DBA ")) {
      const [legal, dba] = agencyName.split(" DBA ");
      return (
        <>
          <div className="font-bold text-[#0f172a]">{legal} DBA</div>
          <div className="font-bold text-[#0f172a]">{dba}</div>
        </>
      );
    }
    return <div className="font-bold text-[#0f172a]">{agencyName}</div>;
  };

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 print:bg-white print:p-0 print:m-0 print:min-h-0">
      {/* Print styles to guarantee exact 1-page fit and suppress browser headers/footers (URL & page numbers) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        @media print {
          @page {
            size: letter portrait;
            margin: 0; /* Suppresses Chrome/browser default URL header and footer 1/1 */
          }
          html, body {
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          .invoice-sheet {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 14mm 18mm !important;
            box-sizing: border-box !important;
            border: none !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}} />

      {/* Floating Action Controls (Hidden on print) */}
      <div className="max-w-[760px] mx-auto mb-4 flex items-center justify-between no-print">
        <button
          onClick={() => router.push(`/admin/audits/${audit._id}/complete`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-slate-700 font-semibold text-xs rounded border border-slate-300 hover:bg-slate-100 transition shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Summary
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadInvoice}
            disabled={isDownloading}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded hover:bg-rose-700 disabled:bg-rose-400 disabled:cursor-not-allowed transition shadow-sm cursor-pointer"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                Download PDF
              </>
            )}
          </button>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white font-bold text-xs rounded hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* INVOICE SHEET (Pixel-Perfect Reference Format matching client PDF) */}
      <div className="invoice-sheet max-w-[760px] mx-auto bg-white border border-slate-200 p-8 sm:p-12 text-[#0f172a] font-['Inter',sans-serif] text-[14px] leading-relaxed shadow-sm print:p-0 print:border-none print:shadow-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-9 text-[13.5px] leading-relaxed">
          <div className="text-left">
            <h1 className="text-[18.5px] font-extrabold text-[#0f172a] uppercase tracking-wide mb-1.5">
              {audit.namedInsured || "Insured"}
            </h1>
            {clientContactLine && <div className="text-[#334155] font-medium leading-relaxed">{clientContactLine}</div>}
            {policyNumberStr && <div className="text-[#334155] font-medium leading-relaxed">Policy #: {policyNumberStr}</div>}
            {effectiveDatesStr && <div className="text-[#334155] font-medium leading-relaxed">Policy Effective Dates {effectiveDatesStr}</div>}
            <div className="text-[#334155] font-medium leading-relaxed">App ID: {appId}</div>
          </div>

          <div className="text-right text-[13.5px] leading-relaxed">
            {renderAgencyName()}
            {agencyStreet && <div className="text-[#334155] font-medium">{agencyStreet}</div>}
            {agencyCityStateZip && <div className="text-[#334155] font-medium">{agencyCityStateZip}</div>}
            {agencyContactLine && <div className="text-[#334155] font-medium">{agencyContactLine}</div>}
          </div>
        </div>

        {/* SECTION 1: REVENUE & EXPOSURE AUDIT */}
        <div className="mb-8">
          <h2 className="text-[16px] font-extrabold text-[#0f172a] uppercase tracking-wide mb-1">
            REVENUE & EXPOSURE AUDIT
          </h2>
          <p className="text-[13px] text-[#475569] font-medium mb-3.5">
            Rating basis: per ${(rateBasis || 1000).toLocaleString()} of revenue
          </p>

          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg px-6 py-1">
            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <div>
                <div className="text-[14.5px] font-bold text-[#0f172a]">Original Estimated Exposure</div>
                <div className="text-[12.5px] text-[#64748b] font-medium mt-0.5">Initial policy basis</div>
              </div>
              <div className="text-[15.5px] font-bold text-[#0f172a] tabular-nums">{formatCurrency(estExposure)}</div>
            </div>

            <div className="flex justify-between items-center py-3 border-b border-slate-200">
              <div>
                <div className="text-[14.5px] font-bold text-[#0f172a]">Audited Gross Revenue</div>
                <div className="text-[12.5px] text-[#64748b] font-medium mt-0.5">Verified actual basis</div>
              </div>
              <div className="text-[15.5px] font-bold text-[#0f172a] tabular-nums">{formatCurrency(auditedExposure)}</div>
            </div>

            <div className="flex justify-between items-center py-3">
              <div>
                <div className="text-[14.5px] font-bold text-[#0f172a]">Exposure Variance</div>
                <div className="text-[12.5px] text-[#64748b] font-medium mt-0.5">{pctChangeStr}</div>
              </div>
              <div className="text-[15.5px] font-bold text-[#0f172a] tabular-nums">{varianceAmountStr}</div>
            </div>
          </div>
        </div>

        {/* SECTION 2: ADDITIONAL AUDIT CHARGES */}
        <div className="mb-6">
          <h2 className="text-[14.5px] font-extrabold text-[#0f172a] uppercase tracking-wider border-b-2 border-[#0f172a] pb-2 mb-3">
            ADDITIONAL AUDIT CHARGES
          </h2>

          <div className="space-y-0.5">
            <div className="flex justify-between py-2 text-[14px] text-[#1e293b] font-medium">
              <span>Premium</span>
              <span className="font-bold text-[14.5px] text-[#0f172a] tabular-nums">{formatCurrency(premiumDifference)}</span>
            </div>
            {carrierFee > 0 && (
              <div className="flex justify-between py-2 text-[14px] text-[#1e293b] font-medium">
                <span>Carrier Policy Fee</span>
                <span className="font-bold text-[14.5px] text-[#0f172a] tabular-nums">{formatCurrency(carrierFee)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 text-[14px] text-[#1e293b] font-medium">
              <span>Premium Audit Service Fee</span>
              <span className="font-bold text-[14.5px] text-[#0f172a] tabular-nums">{formatCurrency(sterlingFee)}</span>
            </div>
            <div className="flex justify-between py-2 text-[14px] text-[#1e293b] font-medium">
              <span>Surplus Lines Tax</span>
              <span className="font-bold text-[14.5px] text-[#0f172a] tabular-nums">{formatCurrency(slTax)}</span>
            </div>
            <div className="flex justify-between py-2 text-[14px] text-[#1e293b] font-medium">
              <span>Stamping Fee</span>
              <span className="font-bold text-[14.5px] text-[#0f172a] tabular-nums">{formatCurrency(stampFee)}</span>
            </div>
          </div>

          {/* TOTAL DUE BOX */}
          <div className="bg-[#f1f5f9] border-[1.5px] border-slate-300 rounded-lg px-6 py-4.5 flex justify-between items-center mt-6">
            <span className="text-[14.5px] font-extrabold text-[#0f172a] tracking-wide uppercase">
              TOTAL ADDITIONAL PREMIUM DUE*
            </span>
            <span className="text-[23px] font-black text-[#0f172a] tabular-nums">
              {formatCurrency(additionalPremiumDue)}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
