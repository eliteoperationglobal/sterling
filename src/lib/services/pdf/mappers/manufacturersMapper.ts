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
    namedInsured: string;
    brokerage: string;
    agencyAgent: string;
    isRenewal: boolean | null;
    policyNumber: string;
    effectiveDate: string;
    website: string;

    // Carrier Info
    carrier: string;
    limitOfInsurance: string;
    deductible: string;
    premium: string;
    offeringRenewal: boolean | null;
    claimsMade: boolean | null;
    retroactiveDate: string;

    // Addresses
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
    const rawDate = submission?.createdAt ? new Date(submission.createdAt) : new Date();
    const formDate = rawDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    // Addresses mapping
    const mailingAddress = safeData.mailingAddress || safeData.streetAddress || '';
    const mailingCity = safeData.mailingCity || safeData.city || '';
    const mailingState = safeData.mailingState || safeData.state || '';
    const mailingZip = safeData.mailingZip || safeData.zip || '';

    const premiseAddress = safeData.sameAsMailing ? mailingAddress : (safeData.premiseAddress || '');
    const premiseCity = safeData.sameAsMailing ? mailingCity : (safeData.premiseCity || '');
    const premiseState = safeData.sameAsMailing ? mailingState : (safeData.premiseState || '');
    const premiseZip = safeData.sameAsMailing ? mailingZip : (safeData.premiseZip || '');

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
        namedInsured: safeData.namedInsured || safeData.companyName || '',
        brokerage: safeData.brokerage || safeData.broker || '',
        agencyAgent: safeData.agencyAgent || safeData.agentName || submission?.agentName || '',
        isRenewal: safeData.isRenewal === true ? true : (safeData.isRenewal === false ? false : null),
        policyNumber: safeData.policyNumber || '',
        effectiveDate: safeData.effectiveDate || '',
        website: safeData.website || '',

        // Carrier Info
        carrier: safeData.carrier || '',
        limitOfInsurance: safeData.limitOfInsurance || '',
        deductible: safeData.deductible || '',
        premium: safeData.premium || '',
        offeringRenewal: safeData.offeringRenewal === true ? true : (safeData.offeringRenewal === false ? false : null),
        claimsMade: safeData.claimsMade === true ? true : (safeData.claimsMade === false ? false : null),
        retroactiveDate: safeData.retroactiveDate || '',

        // Addresses
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
        auditPhone: safeData.auditPhone || safeData.phone || '',
        auditEmail: safeData.auditEmail || safeData.email || '',

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
        recallDate: safeData.recallDate || '',
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
        awareOfOccurrencesDetails: safeData.awareOfOccurrencesDetails || ''
    };
}
