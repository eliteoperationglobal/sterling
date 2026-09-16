/**
 * Manufacturers Supplemental Application Data Mapper for PDF Generation
 */

export interface ManufacturersPacketData {
    // Metadata
    applicationId: string;
    submissionId: string;
    submissionNumber: string;
    formDate: string;

    // Agency Information
    agencyName: string;
    agentName: string;
    agencyAddress: string;
    agencyCity: string;
    agencyState: string;
    agencyZip: string;
    agencyPhone: string;
    agencyEmail: string;
    policyNumberBound?: string;
    capitalCoLogoSVG?: string;

    // 1. General Info
    companyName?: string;
    namedInsured: string;
    firstName: string;
    lastName: string;
    dba: string;
    applicantPhone: string;
    applicantEmail: string;
    brokerage: string;
    agencyAgent: string;
    policyNumber: string;
    effectiveDate: string;
    desiredCoverageDates?: string;
    website: string;

    // Addresses
    sameAsMailing: boolean;
    mailingAddress: string;
    mailingCity: string;
    mailingState: string;
    mailingZip: string;
    premiseAddress: string;
    premiseCity: string;
    premiseState: string;
    premiseZip: string;

    // Sales
    salesUpcoming: string;
    salesLast12: string;
    salesOneYearPrior: string;
    salesTwoYearsPrior: string;
    salesThreeYearsPrior: string;

    // Audit / Inspection
    auditContact: string;
    auditPhone: string;
    auditEmail: string;

    // Industries
    industries: string[];

    // Questions
    excludedProducts: string;
    coveredElsewhere: boolean | null;
    newProducts: boolean | null;
    newProductsDetails: string;
    identifiedCompetitors: boolean | null;
    identifiedHow: string;
    importProducts: boolean | null;
    aiVendorStatus: boolean | null;
    domesticCarrier: boolean | null;
    offPremiseOps: boolean | null;
    offPremiseClarify: string;
    hireSubcontractors: boolean | null;
    collectCoi: boolean | null;
    condoTownhouseWork: boolean | null;
    discontinuedProducts: boolean | null;
    discontinuedReason: string;
    rentEquipment: boolean | null;
    withoutOperator: boolean | null;
    holdHarmlessAgreement: boolean | null;
    tracingRecordsMaintained: boolean | null;
    recordsMaintainedHowLong: string;

    recallPlan: boolean | null;
    recallInsurance: boolean | null;
    recallMeansDisposal: string;
    recallEvent: boolean | null;
    recallDate: string;
    recallType: string;
    recallAgency: string;
    recallProductsInvolved: string;
    recallReasonDiscovery: string;
    recallRemedy: string;
    recallPercentReturned: string;
    presentSituationsRecall: boolean | null;
    presentSituationsDetails: string;
    citedByAgency: boolean | null;
    citedAgencyDetails: string;
    productLiabilityClaims: boolean | null;
    productLiabilityExplanation: string;
    canceledNonRenewed: boolean | null;
    canceledNonRenewedDetails: string;
    awareOfOccurrences: boolean | null;
    awareOfOccurrencesDetails: string;

    // Financial fields for Proposal & Invoice
    carrierName?: string;
    premium?: string;
    carrierPolicyFee?: string;
    sterlingFees?: string;
    surplusLinesTax?: string;
    stampingFee?: string;
    stampingFeePerFiling?: string;
    slaServiceCharge?: string;
    fireMarshalTax?: string;
    totalCostOfPolicy?: string;
    quoteType?: string;
    coverageType?: string;

    // Deposit & Payment Breakdown
    depositPremium?: string;
    depositPolicyFee?: string;
    depositInspectionFee?: string;
    depositStateTax?: string;
    depositFireMarshal?: string;
    depositAssociationDues?: string;
    totalDeposit?: string;
    totalToRetain?: string;
    totalToBeSent?: string;
    totalToFinanceCompany?: string;
}

/**
 * Helper to format currency strings or numbers to $0,000.00
 */
function formatUSD(amount: any): string {
    if (amount === undefined || amount === null || amount === "") return "$0.00";
    const num = typeof amount === "string" ? parseFloat(amount.replace(/[\$,]/g, "")) : amount;
    if (isNaN(num)) return "$0.00";
    return `$${num.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
}

export function formatDateToUS(dateInput: any): string {
    if (!dateInput || dateInput === "-") return "-";

    if (dateInput instanceof Date) {
        if (isNaN(dateInput.getTime())) return "-";
        return dateInput.toLocaleDateString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric'
        });
    }

    const clean = String(dateInput).trim();
    if (!clean) return "-";

    // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
    const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
        const y = isoMatch[1];
        const m = isoMatch[2].padStart(2, '0');
        const d = isoMatch[3].padStart(2, '0');
        return `${m}/${d}/${y}`;
    }

    // Handle MM-DD-YYYY or MM/DD/YYYY
    const usMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (usMatch) {
        const m = usMatch[1].padStart(2, '0');
        const d = usMatch[2].padStart(2, '0');
        const y = usMatch[3];
        return `${m}/${d}/${y}`;
    }

    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return clean;
    return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
}

export function computeDesiredCoverageDates(effectiveDateStr?: string): string {
    if (!effectiveDateStr || !effectiveDateStr.trim()) return "-";
    const clean = effectiveDateStr.trim();
    
    // Check if format is YYYY-MM-DD
    const isoMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = isoMatch[2].padStart(2, '0');
        const d = isoMatch[3].padStart(2, '0');
        return `${m}/${d}/${y} - ${m}/${d}/${y + 1}`;
    }

    // Check if format is MM-DD-YYYY or MM/DD/YYYY
    const usMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (usMatch) {
        const m = usMatch[1].padStart(2, '0');
        const d = usMatch[2].padStart(2, '0');
        const y = parseInt(usMatch[3], 10);
        return `${m}/${d}/${y} - ${m}/${d}/${y + 1}`;
    }

    // Fallback using Date object
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
        const m = String(parsed.getUTCMonth() + 1).padStart(2, '0');
        const d = String(parsed.getUTCDate()).padStart(2, '0');
        const y = parsed.getUTCFullYear();
        return `${m}/${d}/${y} - ${m}/${d}/${y + 1}`;
    }

    return clean;
}

export function mapManufacturersDataToPacketData(
    formData: any,
    submissionId: string,
    agency: any,
    quote: any,
    submission: any,
    capitalCoLogoSVG?: string
): ManufacturersPacketData {
    const safeData = formData || {};
    
    // Formatting Dates
    const formDate = formatDateToUS(submission?.createdAt || new Date());

    // Addresses mapping
    const mailingAddress = safeData.mailingAddress || safeData.streetAddress || '';
    const mailingCity = safeData.mailingCity || safeData.city || '';
    const mailingState = safeData.mailingState || safeData.state || '';
    const mailingZip = safeData.mailingZip || safeData.zip || '';

    const isSameAsMailing = Boolean(
        safeData.sameAsMailing === true ||
        !safeData.premiseAddress ||
        (
            safeData.premiseAddress.toString().trim().toLowerCase() === mailingAddress.toString().trim().toLowerCase() &&
            safeData.premiseZip.toString().trim() === mailingZip.toString().trim()
        )
    );

    const premiseAddress = isSameAsMailing ? mailingAddress : (safeData.premiseAddress || '');
    const premiseCity = isSameAsMailing ? mailingCity : (safeData.premiseCity || '');
    const premiseState = isSameAsMailing ? mailingState : (safeData.premiseState || '');
    const premiseZip = isSameAsMailing ? mailingZip : (safeData.premiseZip || '');

    // Insured Information mapping
    const companyName = (safeData.companyName || '').trim();
    const firstName = safeData.firstName || '';
    const lastName = safeData.lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ') || safeData.namedInsured || companyName || '';
    const namedInsured = companyName || safeData.namedInsured || fullName;
    const dba = safeData.dba || '';
    const applicantPhone = safeData.applicantPhone || safeData.phone || submission?.clientContact?.phone || '';
    const applicantEmail = safeData.applicantEmail || safeData.email || submission?.clientContact?.email || '';

    return {
        // Metadata
        applicationId: submissionId,
        submissionId: submissionId,
        submissionNumber: submission?.submissionNumber?.toString() || submissionId,
        formDate: formDate,

        // Agency Info
        agencyName: agency?.name || "Capital & Co Insurance Services",
        agentName: submission?.payload?.agentName || submission?.agentName || "Capital & Co",
        agencyAddress: agency?.address?.street || "292 S La Cienega Blvd Ste 206",
        agencyCity: agency?.address?.city || "Beverly Hills",
        agencyState: agency?.address?.state || "CA",
        agencyZip: agency?.address?.zip || "90211",
        agencyPhone: agency?.phone || "(310) 284-2136",
        agencyEmail: agency?.email || "eidan@capcoinsurance.com",
        policyNumberBound: quote?.status === "BOUND" ? quote?.policyNumber : "",
        capitalCoLogoSVG: capitalCoLogoSVG,

        // 1. General Info
        namedInsured: namedInsured,
        companyName: companyName,
        firstName,
        lastName,
        dba,
        applicantPhone,
        applicantEmail,
        brokerage: safeData.brokerage || safeData.broker || '',
        agencyAgent: safeData.agencyAgent || safeData.agentName || submission?.agentName || '',
        policyNumber: safeData.policyNumber || '',
        effectiveDate: formatDateToUS(safeData.effectiveDate),
        desiredCoverageDates: computeDesiredCoverageDates(safeData.effectiveDate),
        website: safeData.website || '',

        // Addresses
        sameAsMailing: isSameAsMailing,
        mailingAddress,
        mailingCity,
        mailingState,
        mailingZip,
        premiseAddress,
        premiseCity,
        premiseState,
        premiseZip,

        // Sales
        salesUpcoming: safeData.salesUpcoming || '',
        salesLast12: safeData.salesLast12 || '',
        salesOneYearPrior: safeData.salesOneYearPrior || '',
        salesTwoYearsPrior: safeData.salesTwoYearsPrior || '',
        salesThreeYearsPrior: safeData.salesThreeYearsPrior || '',

        // Audit / Inspection
        auditContact: safeData.auditContact || '',
        auditPhone: safeData.auditPhone || '',
        auditEmail: safeData.auditEmail || '',

        // Industries
        industries: Array.isArray(safeData.industries) ? safeData.industries : [],

        // Questions
        excludedProducts: safeData.excludedProducts || '',
        coveredElsewhere: safeData.coveredElsewhere === true ? true : (safeData.coveredElsewhere === false ? false : null),
        newProducts: safeData.newProducts === true ? true : (safeData.newProducts === false ? false : null),
        newProductsDetails: safeData.newProductsDetails || '',
        identifiedCompetitors: safeData.identifiedCompetitors === true ? true : (safeData.identifiedCompetitors === false ? false : null),
        identifiedHow: safeData.identifiedHow || '',
        importProducts: safeData.importProducts === true ? true : (safeData.importProducts === false ? false : null),
        aiVendorStatus: safeData.aiVendorStatus === true ? true : (safeData.aiVendorStatus === false ? false : null),
        domesticCarrier: safeData.domesticCarrier === true ? true : (safeData.domesticCarrier === false ? false : null),
        offPremiseOps: safeData.offPremiseOps === true ? true : (safeData.offPremiseOps === false ? false : null),
        offPremiseClarify: safeData.offPremiseClarify || '',
        hireSubcontractors: safeData.hireSubcontractors === true ? true : (safeData.hireSubcontractors === false ? false : null),
        collectCoi: safeData.collectCoi === true ? true : (safeData.collectCoi === false ? false : null),
        condoTownhouseWork: safeData.condoTownhouseWork === true ? true : (safeData.condoTownhouseWork === false ? false : null),
        discontinuedProducts: safeData.discontinuedProducts === true ? true : (safeData.discontinuedProducts === false ? false : null),
        discontinuedReason: safeData.discontinuedReason || '',
        rentEquipment: safeData.rentEquipment === true ? true : (safeData.rentEquipment === false ? false : null),
        withoutOperator: safeData.withoutOperator === true ? true : (safeData.withoutOperator === false ? false : null),
        holdHarmlessAgreement: safeData.holdHarmlessAgreement === true ? true : (safeData.holdHarmlessAgreement === false ? false : null),
        tracingRecordsMaintained: safeData.tracingRecordsMaintained === true ? true : (safeData.tracingRecordsMaintained === false ? false : null),
        recordsMaintainedHowLong: safeData.recordsMaintainedHowLong || '',

        recallPlan: safeData.recallPlan === true ? true : (safeData.recallPlan === false ? false : null),
        recallInsurance: safeData.recallInsurance === true ? true : (safeData.recallInsurance === false ? false : null),
        recallMeansDisposal: safeData.recallMeansDisposal || '',
        recallEvent: safeData.recallEvent === true ? true : (safeData.recallEvent === false ? false : null),
        recallDate: formatDateToUS(safeData.recallDate),
        recallType: safeData.recallType || '',
        recallAgency: safeData.recallAgency || '',
        recallProductsInvolved: safeData.recallProductsInvolved || '',
        recallReasonDiscovery: safeData.recallReasonDiscovery || '',
        recallRemedy: safeData.recallRemedy || '',
        recallPercentReturned: safeData.recallPercentReturned || '',
        presentSituationsRecall: safeData.presentSituationsRecall === true ? true : (safeData.presentSituationsRecall === false ? false : null),
        presentSituationsDetails: safeData.presentSituationsDetails || '',
        citedByAgency: safeData.citedByAgency === true ? true : (safeData.citedByAgency === false ? false : null),
        citedAgencyDetails: safeData.citedAgencyDetails || '',
        productLiabilityClaims: safeData.productLiabilityClaims === true ? true : (safeData.productLiabilityClaims === false ? false : null),
        productLiabilityExplanation: safeData.productLiabilityExplanation || '',
        canceledNonRenewed: safeData.canceledNonRenewed === true ? true : (safeData.canceledNonRenewed === false ? false : null),
        canceledNonRenewedDetails: safeData.canceledNonRenewedDetails || '',
        awareOfOccurrences: safeData.awareOfOccurrences === true ? true : (safeData.awareOfOccurrences === false ? false : null),
        awareOfOccurrencesDetails: safeData.awareOfOccurrencesDetails || '',

        // Financials (if quote exists or from formData)
        carrierName: quote?.metadata?.carrierName || quote?.carrierId?.name || submission?.carrier?.name || submission?.carrierName || quote?.carrier?.name || safeData.carrierName || "Capital & Co",
        premium: formatUSD(quote?.costs?.premium ?? quote?.carrierQuoteUSD ?? submission?.quote?.costs?.premium ?? safeData.premium),
        carrierPolicyFee: formatUSD(quote?.costs?.carrierPolicyFee ?? quote?.carrierFeesUSD ?? submission?.quote?.costs?.carrierPolicyFee ?? safeData.carrierPolicyFee),
        sterlingFees: formatUSD(quote?.costs?.sterlingFees ?? quote?.sterlingInsuranceServicesFeesUSD ?? submission?.quote?.costs?.sterlingFees ?? safeData.sterlingFees),
        surplusLinesTax: formatUSD(quote?.costs?.surplusLinesTax ?? quote?.premiumTaxAmountUSD ?? submission?.quote?.costs?.surplusLinesTax ?? safeData.surplusLinesTax),
        stampingFee: formatUSD(quote?.costs?.stampingFee ?? quote?.stampingFeeAmountUSD ?? submission?.quote?.costs?.stampingFee ?? safeData.stampingFee),
        stampingFeePerFiling: formatUSD(quote?.costs?.stampingFeePerFiling ?? quote?.stampingFeePerFilingUSD ?? submission?.quote?.costs?.stampingFeePerFiling ?? safeData.stampingFeePerFiling),
        slaServiceCharge: formatUSD(quote?.costs?.slaServiceCharge ?? quote?.slaServiceChargeUSD ?? submission?.quote?.costs?.slaServiceCharge ?? safeData.slaServiceCharge),
        fireMarshalTax: formatUSD(quote?.costs?.fireMarshalTax ?? quote?.fireMarshalTaxAmountUSD ?? submission?.quote?.costs?.fireMarshalTax ?? safeData.fireMarshalTax),
        totalCostOfPolicy: formatUSD(quote?.costs?.totalCostOfPolicy ?? quote?.finalAmountUSD ?? submission?.quote?.costs?.totalCostOfPolicy ?? safeData.totalCostOfPolicy),
        quoteType: quote?.metadata?.type || quote?.policyType || submission?.quote?.metadata?.type || safeData.quoteType || "General Liability",
        coverageType: quote?.metadata?.coverageType || quote?.coverageType || submission?.quote?.metadata?.coverageType || safeData.coverageType || "Occurrence",

        // Deposits
        depositPremium: formatUSD(quote?.deposit?.premium ?? quote?.depositPremiumUSD ?? submission?.quote?.deposit?.premium ?? safeData.depositPremium),
        depositPolicyFee: formatUSD(quote?.deposit?.policyFee ?? quote?.depositStampingUSD ?? submission?.quote?.deposit?.policyFee ?? safeData.depositPolicyFee),
        depositInspectionFee: formatUSD(quote?.deposit?.inspectionFee ?? quote?.depositSterlingFeesUSD ?? submission?.quote?.deposit?.inspectionFee ?? safeData.depositInspectionFee),
        depositStateTax: formatUSD(quote?.deposit?.stateTax ?? quote?.depositTaxUSD ?? submission?.quote?.deposit?.stateTax ?? safeData.depositStateTax),
        depositFireMarshal: formatUSD(quote?.deposit?.fireMarshal ?? quote?.depositFireMarshalUSD ?? submission?.quote?.deposit?.fireMarshal ?? safeData.depositFireMarshal),
        depositAssociationDues: formatUSD(quote?.deposit?.associationDues ?? quote?.depositCarrierFeesUSD ?? submission?.quote?.deposit?.associationDues ?? safeData.depositAssociationDues),
        totalDeposit: formatUSD(quote?.deposit?.totalDeposit ?? quote?.totalDepositUSD ?? submission?.quote?.deposit?.totalDeposit ?? safeData.totalDeposit),

        // Payment Details
        totalToRetain: formatUSD(quote?.commission?.totalToRetain ?? quote?.totalToRetainUSD ?? submission?.quote?.commission?.totalToRetain ?? safeData.totalToRetain),
        totalToBeSent: formatUSD(quote?.payment?.totalToBeSent ?? quote?.totalToBeSentUSD ?? submission?.quote?.payment?.totalToBeSent ?? safeData.totalToBeSent),
        totalToFinanceCompany: formatUSD(quote?.payment?.totalToFinanceCompany ?? quote?.totalToFinanceCompanyUSD ?? submission?.quote?.payment?.totalToFinanceCompany ?? safeData.totalToFinanceCompany),
    };                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        
}