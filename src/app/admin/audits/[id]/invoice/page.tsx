"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Printer, Download } from "lucide-react";

export default function AuditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const auditIdParam = params?.id as string;

  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const surplusTaxRate = Number(audit.surplusLinesTaxRate) || 0;
  const stampingFeeRate = Number(audit.stampingFeeRate) || 0;
  const carrierFee = Number(audit.carrierFee) || 0;
  const sterlingFee = Number(audit.sterlingFee) || 0;

  const slTax = premiumDifference * (surplusTaxRate / 100);
  const stampFee = premiumDifference * (stampingFeeRate / 100);

  const additionalPremiumDue = premiumDifference + slTax + stampFee + carrierFee + sterlingFee;

  const payload = audit.submissionId?.payload || {};
  const applicantAddress = payload.applicantAddress || payload.address || "";
  const applicantCity = payload.applicantCity || payload.city || "";
  const applicantState = payload.applicantState || payload.state || "";
  const applicantZip = payload.applicantZip || payload.zip || "";
  const cityStateZip = [applicantCity, applicantState].filter(Boolean).join(", ") + (applicantZip ? ` ${applicantZip}` : "");

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 print:bg-white print:p-0 print:m-0 print:min-h-0">
      {/* Print styles to guarantee exact 1-page fit and suppress browser headers/footers (URL & page numbers) */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: letter portrait;
            margin: 0; /* Suppresses Chrome/browser default URL header and footer 1/1 */
          }
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            font-family: Arial, Helvetica, sans-serif !important;
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
          <a
            href={`/api/admin/audits/${audit._id}/invoice`}
            download
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded hover:bg-rose-700 transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Download PDF
          </a>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-black text-white font-bold text-xs rounded hover:bg-slate-800 transition shadow-sm cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* INVOICE SHEET (Pure Black & White Reference Format) */}
      <div className="invoice-sheet max-w-[760px] mx-auto bg-white border border-slate-200 p-8 text-black font-sans text-[13.5px] leading-relaxed shadow-sm print:p-0 print:border-none print:shadow-none">
        
        {/* HEADER */}
        <div className="flex justify-between items-start mb-6 text-[13.5px] leading-relaxed">
          <div>
            <div className="font-normal text-black">{audit.namedInsured || "Insured"}</div>
            {applicantAddress && <div>{applicantAddress}</div>}
            {cityStateZip && <div>{cityStateZip}</div>}
            {audit.clientPhone && <div>{audit.clientPhone}</div>}
            {audit.clientEmail && <div>Email: {audit.clientEmail}</div>}
            <div>App ID: {audit.auditId ? audit.auditId.replace("AUD-", "") : audit._id.slice(-6)}</div>
          </div>

          <div className="text-right">
            <div className="font-bold">Gamaty Insurance Agency LLC DBA</div>
            <div className="font-bold">Capital & Co Insurance Services</div>
            <div>5455 Wilshire Blvd. #1816</div>
            <div>Los Angeles, CA 90036</div>
            <div>(310) 492-2007</div>
            <div>CS@capcoinsurance.com</div>
          </div>
        </div>

        {/* SECTION 1: AUDIT PREMIUM CALCULATION */}
        <div className="mt-6 mb-2">
          <div className="font-bold text-[14px] uppercase border-b-2 border-black pb-1 mb-2 text-black">
            AUDIT PREMIUM CALCULATION*
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Audited Premium</span>
              <span>{formatCurrency(auditedPremium)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Original (Deposit) Premium</span>
              <span>{formatCurrency(originalPremium)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px] font-semibold">
              <span>Premium Difference</span>
              <span>{formatCurrency(premiumDifference)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Carrier Policy Fee</span>
              <span>{formatCurrency(carrierFee)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Premium Audit Service Fee</span>
              <span>{formatCurrency(sterlingFee)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Surplus Lines Tax</span>
              <span>{formatCurrency(slTax)}</span>
            </div>
            <div className="flex justify-between py-1 text-[13.5px]">
              <span>Stamping Fee</span>
              <span>{formatCurrency(stampFee)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-12 pt-3 mt-2 font-bold text-[14px]">
            <span>TOTAL ADDITIONAL PREMIUM DUE*</span>
            <span className="min-w-[110px] text-right font-extrabold text-[14.5px]">{formatCurrency(additionalPremiumDue)}</span>
          </div>
        </div>

      </div>
    </div>
  );
}
