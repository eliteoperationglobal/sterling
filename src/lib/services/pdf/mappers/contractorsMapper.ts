import { IAgency } from "../../../../models/Agency";

export interface AI {
    name: string;
    contractNumber: string;
    address: string;
    aptSuite: string;
    zip: string;
    city: string;
    state: string;
}

export interface EquipmentItem {
    type: string;
    year: string;
    make: string;
    model: string;
    serialNumber: string;
    valuation: string;
    description?: string;
}

export interface ContractorsPacketData {
    // Metadata
    applicationId: string;
    submissionId: string;
    submissionNumber?: string;
    formDate: string;
    capitalCoLogoSVG?: string;

    // Agency Information
    agencyName: string;
    agentName: string;
    agencyAddress: string;
    agencyCity: string;
    agencyState: string;
    agencyZip: string;
    agencyPhone: string;
    agencyEmail: string;

    // Company Information
    applicantName: string;
    firstName: string;
    lastName: string;
    companyName: string;
    dba: string;
    licenseNum: string;
    licenseClass: string;
    entityType: string;
    ssn: string;
    dlNum: string;
    phone: string;
    fax: string;
    email: string;
    opsDescription: string;
    statesOfBusiness: string;
    yearsExp: string;
    grossReceipts: string;

    // Address Information
    physAddress: string;
    physCity: string;
    physApt: string;
    physState: string;
    physZip: string;
    mailAddress: string;
    mailApt: string;
    mailZip: string;
    mailCity: string;
    mailState: string;
    sameAsMailing: boolean;

    // Quote/Policy Details
    deductible: string;
    losses: string;
    yearsInBusiness: string;
    effectiveDate: string;
    policyDuration: string;
    carrierName?: string;
    coverageType?: string;
    desiredCoverageDates?: string;

    // Floating Limits & Coverages
    miscToolsLimit: string;
    lightMedLimit: string;
    heavyLimit: string;
    rentedEquipLimit: string;
    installFloaterLimit: string;
    officeContentsLimit: string;
    computerDataMediaLimit: string;

    // Equipment Schedules
    lightMedItems: EquipmentItem[];
    heavyItems: EquipmentItem[];
    rentedItems: string[];

    // Underwriting Questions
    cancelled: boolean | null;
    cancelledExplain: string;
    bankruptcy: boolean | null;
    bankruptcyExplain: string;
    moreThanOneLoss: boolean | null;
    lossExplain: string;
    asphaltCranes: boolean | null;
    asphaltExplain: string;
    tandemLifting: boolean | null;
    tandemExplain: string;
    overWater: boolean | null;
    waterExplain: string;
    oilfield: boolean | null;
    oilfieldExplain: string;
    demolition: boolean | null;
    demolitionExplain: string;
    garaged: boolean | null;
    stumpGrinder: boolean | null;
    stumpExplain: string;
    rentToOthers: boolean | null;
    rentExplain: string;
    subcontractHazardous: boolean | null;
    hazardousExplain: string;
    subcontractAgri: boolean | null;
    agriExplain: string;
    subcontractBridges: boolean | null;
    bridgesExplain: string;
    subcontractDrones: boolean | null;
    dronesExplain: string;
    subcontractTrailers: boolean | null;
    trailersExplain: string;

    // Additional Interests / Lienholders
    hasLienholder: boolean | null;
    lienholderExplain: string;
    interests: AI[];

    // Payment & Fees
    brokerFee: string;
    displayBrokerFee: boolean | null;
    paymentOption: string;
    terrorism: boolean;

    // Financial fields for Proposal & Invoice
    quoteType?: string;
    policyType?: string;
    premium?: string;
    carrierPolicyFee?: string;
    sterlingFees?: string;
    surplusLinesTax?: string;
    stampingFee?: string;
    fireMarshalTax?: string;
    totalCostOfPolicy?: string;
    
    totalDeposit?: string;
    totalToBeSent?: string;

    // Coverage Limits for Proposal
    occurrenceLimit?: string;
    aggregateLimit?: string;
    productsCompletedOpsLimit?: string;
    personalAdvertisingInjuryLimit?: string;
    fireLegalLimit?: string;
    medPayLimit?: string;
}

/**
 * Maps raw submission payload to ContractorsPacketData
 */
export function mapContractorsDataToPacketData(
    p: any,
    submissionId: string,
    agency: any,
    carrierName: string = "Capital & Co",
    submission: any = {},
    capitalCoLogoSVG?: string,
    quote?: any
): ContractorsPacketData {
    return {
        // Metadata
        applicationId: submission.applicationNumber || "Pending",
        submissionId: submissionId,
        submissionNumber: submission.submissionNumber || submission.applicationNumber || "Pending",
        formDate: submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        capitalCoLogoSVG,

        // Agency Information
        agencyName: agency?.name || "Unknown Agency",
        agentName: submission?.agentName || agency?.agentName || "Unknown Agent",
        agencyAddress: typeof agency?.address === 'object' ? agency.address.street : (agency?.address || ""),
        agencyCity: agency?.city || (typeof agency?.address === 'object' ? agency.address.city : ""),
        agencyState: agency?.state || (typeof agency?.address === 'object' ? agency.address.state : ""),
        agencyZip: agency?.zip || (typeof agency?.address === 'object' ? agency.address.zip : ""),
        agencyPhone: agency?.phone || "",
        agencyEmail: agency?.email || "",

        // Company Information
        applicantName: p.companyName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || "Unknown",
        firstName: p.firstName || "",
        lastName: p.lastName || "",
        companyName: p.companyName || "",
        dba: p.dba || "",
        licenseNum: p.licenseNum || "",
        licenseClass: p.licenseClass || "",
        entityType: p.entityType || "Individual",
        ssn: p.ssn || "",
        dlNum: p.dlNum || "",
        phone: p.phone || "",
        fax: p.fax || "",
        email: p.email || "",
        opsDescription: p.opsDescription || "",
        statesOfBusiness: Array.isArray(p.statesOfBusiness) ? p.statesOfBusiness.join(', ') : (p.statesOfBusiness || ""),
        yearsExp: p.yearsExp || "0",
        grossReceipts: p.grossReceipts || "$0",

        // Address Information
        physAddress: p.physAddress || "",
        physCity: p.physCity || "",
        physApt: p.physApt || "",
        physState: p.physState || "",
        physZip: p.physZip || "",
        mailAddress: p.mailAddress || "",
        mailApt: p.mailApt || "",
        mailZip: p.mailZip || "",
        mailCity: p.mailCity || "",
        mailState: p.mailState || "",
        sameAsMailing: p.sameAsMailing || false,

        // Quote Details
        deductible: p.deductible || "$1,000/$2,500",
        losses: p.losses || "0",
        yearsInBusiness: p.yearsInBusiness || "0",
        effectiveDate: p.effectiveDate || "",
        policyDuration: p.policyDuration || "12 Months",
        carrierName: carrierName,
        coverageType: "Contractors Equipment",
        desiredCoverageDates: p.effectiveDate ? `${p.effectiveDate} to ${new Date(new Date(p.effectiveDate).setFullYear(new Date(p.effectiveDate).getFullYear() + 1)).toLocaleDateString()}` : "To Be Determined",

        // Floating Limits
        miscToolsLimit: p.miscToolsLimit || "$10,000",
        lightMedLimit: p.lightMedLimit || "$0",
        heavyLimit: p.heavyLimit || "$0",
        rentedEquipLimit: p.rentedEquipLimit || "$0",
        installFloaterLimit: p.installFloaterLimit || "$0",
        officeContentsLimit: p.officeContentsLimit || "$0",
        computerDataMediaLimit: p.computerDataMediaLimit || "$0",

        // Equipment Schedules
        lightMedItems: p.lightMedItems || [],
        heavyItems: p.heavyItems || [],
        rentedItems: p.rentedItems || [],

        // Underwriting
        cancelled: p.cancelled ?? false,
        cancelledExplain: p.cancelledExplain || "",
        bankruptcy: p.bankruptcy ?? false,
        bankruptcyExplain: p.bankruptcyExplain || "",
        moreThanOneLoss: p.moreThanOneLoss ?? false,
        lossExplain: p.lossExplain || "",
        asphaltCranes: p.asphaltCranes ?? false,
        asphaltExplain: p.asphaltExplain || "",
        tandemLifting: p.tandemLifting ?? false,
        tandemExplain: p.tandemExplain || "",
        overWater: p.overWater ?? false,
        waterExplain: p.waterExplain || "",
        oilfield: p.oilfield ?? false,
        oilfieldExplain: p.oilfieldExplain || "",
        demolition: p.demolition ?? false,
        demolitionExplain: p.demolitionExplain || "",
        garaged: p.garaged ?? true,
        stumpGrinder: p.stumpGrinder ?? false,
        stumpExplain: p.stumpExplain || "",
        rentToOthers: p.rentToOthers ?? false,
        rentExplain: p.rentExplain || "",
        subcontractHazardous: p.subcontractHazardous ?? false,
        hazardousExplain: p.hazardousExplain || "",
        subcontractAgri: p.subcontractAgri ?? false,
        agriExplain: p.agriExplain || "",
        subcontractBridges: p.subcontractBridges ?? false,
        bridgesExplain: p.bridgesExplain || "",
        subcontractDrones: p.subcontractDrones ?? false,
        dronesExplain: p.dronesExplain || "",
        subcontractTrailers: p.subcontractTrailers ?? false,
        trailersExplain: p.trailersExplain || "",

        // Interests
        hasLienholder: p.hasLienholder ?? false,
        lienholderExplain: p.lienholderExplain || "",
        interests: p.interests || [],

        // Payment
        brokerFee: p.brokerFee || "$0.00",
        displayBrokerFee: p.displayBrokerFee ?? true,
        paymentOption: p.paymentOption || "",
        terrorism: p.terrorism || false,

        // Financials (if quote provided)
        quoteType: quote?.metadata?.type || "Contractors Equipment",
        policyType: quote?.metadata?.type || "CONTRACTORS_EQUIPMENT",
        premium: quote?.costs?.premium ? `$${quote.costs.premium.toLocaleString()}` : "$0.00",
        carrierPolicyFee: quote?.costs?.carrierPolicyFee ? `$${quote.costs.carrierPolicyFee.toLocaleString()}` : "$0.00",
        sterlingFees: quote?.costs?.sterlingFees ? `$${quote.costs.sterlingFees.toLocaleString()}` : "$0.00",
        surplusLinesTax: quote?.costs?.surplusLinesTax ? `$${quote.costs.surplusLinesTax.toLocaleString()}` : "$0.00",
        stampingFee: quote?.costs?.stampingFee ? `$${quote.costs.stampingFee.toLocaleString()}` : "$0.00",
        fireMarshalTax: quote?.costs?.fireMarshalTax ? `$${quote.costs.fireMarshalTax.toLocaleString()}` : "$0.00",
        totalCostOfPolicy: quote?.costs?.totalCostOfPolicy ? `$${quote.costs.totalCostOfPolicy.toLocaleString()}` : "$0.00",
        totalDeposit: quote?.deposit?.totalDeposit ? `$${quote.deposit.totalDeposit.toLocaleString()}` : "$0.00",
        totalToBeSent: quote?.payment?.totalToBeSent ? `$${quote.payment.totalToBeSent.toLocaleString()}` : "$0.00",

        // Limits
        occurrenceLimit: quote?.metadata?.limits?.occurrence ? `$${quote.metadata.limits.occurrence.toLocaleString()}` : undefined,
        aggregateLimit: quote?.metadata?.limits?.aggregate ? `$${quote.metadata.limits.aggregate.toLocaleString()}` : undefined,
        productsCompletedOpsLimit: quote?.metadata?.limits?.productsCompletedOps ? `$${quote.metadata.limits.productsCompletedOps.toLocaleString()}` : undefined,
        personalAdvertisingInjuryLimit: quote?.metadata?.limits?.personalAdvertisingInjury ? `$${quote.metadata.limits.personalAdvertisingInjury.toLocaleString()}` : undefined,
        fireLegalLimit: quote?.metadata?.limits?.fireLegal ? `$${quote.metadata.limits.fireLegal.toLocaleString()}` : undefined,
        medPayLimit: quote?.metadata?.limits?.medicalExpense ? `$${quote.metadata.limits.medicalExpense.toLocaleString()}` : undefined,
    };
}

