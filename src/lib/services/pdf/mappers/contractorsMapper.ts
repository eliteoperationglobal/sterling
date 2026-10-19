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
    programName?: string;
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
    bundle: boolean | null;

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

    // Financial fields for Proposal & Invoice
    premium?: string;
    carrierPolicyFee?: string;
    sterlingFees?: string;
    surplusLinesTax?: string;
    stampingFee?: string;
    stampingFeePerFiling?: string;
    slaServiceCharge?: string;
    slasTransactionFee?: string;
    fireMarshalTax?: string;
    totalCostOfPolicy?: string;
    quoteType?: string;


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

    // Payment & Fees (Original)
    brokerFee: string;
    displayBrokerFee: boolean | null;
    paymentOption: string;
    terrorism: boolean;
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
    const progName = submission?.programName || p?.programName || (
        submission?.programId === "inland-marine" || p?.programId === "inland-marine" ? "Inland Marine" : "Contractors Equipment"
    );

    return {
        // Metadata
        applicationId: submission.applicationNumber || submission.submissionNumber || p.applicationNumber || "Pending",
        submissionId: submissionId,
        submissionNumber: submission.submissionNumber || submission.applicationNumber || p.submissionNumber || "Pending",
        programName: progName,
        formDate: submission.createdAt ? new Date(submission.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC' }) : new Date().toLocaleDateString(),
        capitalCoLogoSVG,

        // Agency Information
        agencyName: agency?.name || "Unknown Agency",
        agentName: p?.agentName || submission?.agentName || agency?.agentName || "Unknown Agent",
        agencyAddress: agency?.address?.street || agency?.address || "",
        agencyCity: agency?.address?.city || agency?.city || "",
        agencyState: agency?.address?.state || agency?.state || "",
        agencyZip: agency?.address?.zip || agency?.zip || "",
        agencyPhone: agency?.phone || "",
        agencyEmail: agency?.email || "",

        // Company Information
        applicantName: p.companyName || `${p.firstName || ""} ${p.lastName || ""}`.trim() || p.applicantName || submission?.applicantName || "Unknown",
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
        physAddress: p.physAddress || p.streetAddress || "",
        physCity: p.physCity || p.city || "",
        physApt: p.physApt || "",
        physState: p.physState || p.state || "",
        physZip: p.physZip || p.zip || "",
        mailAddress: p.mailAddress || (p.sameAsMailing ? (p.physAddress || p.streetAddress || "") : ""),
        mailApt: p.mailApt || (p.sameAsMailing ? (p.physApt || "") : ""),
        mailZip: p.mailZip || (p.sameAsMailing ? (p.physZip || p.zip || "") : ""),
        mailCity: p.mailCity || (p.sameAsMailing ? (p.physCity || p.city || "") : ""),
        mailState: p.mailState || (p.sameAsMailing ? (p.physState || p.state || "") : ""),
        sameAsMailing: p.sameAsMailing || false,

        // Quote Details
        deductible: p.deductible || "$1,000/$2,500",
        losses: p.losses || "0",
        yearsInBusiness: p.yearsInBusiness || "0",
        effectiveDate: p.effectiveDate || "",
        policyDuration: p.policyDuration || "12 Months",
        carrierName: carrierName,
        desiredCoverageDates: p.effectiveDate ? `${p.effectiveDate} to ${new Date(new Date(p.effectiveDate).setFullYear(new Date(p.effectiveDate).getFullYear() + 1)).toLocaleDateString('en-US', { timeZone: 'UTC' })}` : "To Be Determined",

        // Floating Limits
        miscToolsLimit: p.miscToolsLimit || "$10,000",
        lightMedLimit: p.lightMedLimit || "$0",
        heavyLimit: p.heavyLimit || "$0",
        rentedEquipLimit: p.rentedEquipLimit || p.rentedEquipLimitRental || "$0",
        installFloaterLimit: p.installFloaterLimit || "$0",
        officeContentsLimit: p.officeContentsLimit || "$0",
        computerDataMediaLimit: p.computerDataMediaLimit || "$0",

        // Equipment Schedules
        lightMedItems: Array.isArray(p.lightMedItems) ? p.lightMedItems : [],
        heavyItems: Array.isArray(p.heavyItems) ? p.heavyItems : [],
        rentedItems: Array.isArray(p.rentedItems) ? p.rentedItems : [],

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
        bundle: p.bundle ?? false,
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
        interests: Array.isArray(p.interests) ? p.interests : [],

        // Payment
        brokerFee: p.brokerFee || submission?.brokerFee || "$0.00",
        displayBrokerFee: p.displayBrokerFee ?? submission?.displayBrokerFee ?? true,
        paymentOption: p.paymentOption || submission?.paymentOption || "",
        terrorism: p.terrorism ?? false,

        // Financials (if quote exists)
        premium: formatUSD(quote?.costs?.premium ?? quote?.carrierQuoteUSD ?? submission?.quote?.costs?.premium),
        carrierPolicyFee: formatUSD(quote?.costs?.carrierPolicyFee ?? quote?.carrierFeesUSD ?? submission?.quote?.costs?.carrierPolicyFee),
        sterlingFees: formatUSD(quote?.costs?.sterlingFees ?? quote?.sterlingInsuranceServicesFeesUSD ?? submission?.quote?.costs?.sterlingFees),
        surplusLinesTax: formatUSD(quote?.costs?.surplusLinesTax ?? quote?.premiumTaxAmountUSD ?? submission?.quote?.costs?.surplusLinesTax),
        stampingFee: formatUSD(quote?.costs?.stampingFee ?? quote?.stampingFeeAmountUSD ?? submission?.quote?.costs?.stampingFee),
        stampingFeePerFiling: formatUSD(quote?.costs?.stampingFeePerFiling ?? quote?.stampingFeePerFilingUSD ?? submission?.quote?.costs?.stampingFeePerFiling),
        slaServiceCharge: formatUSD(quote?.costs?.slaServiceCharge ?? quote?.slaServiceChargeUSD ?? submission?.quote?.costs?.slaServiceCharge),
        slasTransactionFee: formatUSD(quote?.costs?.slasTransactionFee ?? quote?.slasTransactionFeeAmountUSD ?? submission?.quote?.costs?.slasTransactionFee),
        fireMarshalTax: formatUSD(quote?.costs?.fireMarshalTax ?? quote?.fireMarshalTaxAmountUSD ?? submission?.quote?.costs?.fireMarshalTax),
        totalCostOfPolicy: formatUSD(quote?.costs?.totalCostOfPolicy ?? quote?.finalAmountUSD ?? submission?.quote?.costs?.totalCostOfPolicy),
        quoteType: quote?.metadata?.type || quote?.policyType || submission?.quote?.metadata?.type || "General Liability",
        coverageType: quote?.metadata?.coverageType || quote?.coverageType || submission?.quote?.metadata?.coverageType || "Occurrence",


        // Deposits
        depositPremium: formatUSD(quote?.deposit?.premium ?? quote?.depositPremiumUSD ?? submission?.quote?.deposit?.premium),
        depositPolicyFee: formatUSD(quote?.deposit?.policyFee ?? quote?.depositStampingUSD ?? submission?.quote?.deposit?.policyFee),
        depositInspectionFee: formatUSD(quote?.deposit?.inspectionFee ?? quote?.depositSterlingFeesUSD ?? submission?.quote?.deposit?.inspectionFee),
        depositStateTax: formatUSD(quote?.deposit?.stateTax ?? quote?.depositTaxUSD ?? submission?.quote?.deposit?.stateTax),
        depositFireMarshal: formatUSD(quote?.deposit?.fireMarshal ?? quote?.depositFireMarshalUSD ?? submission?.quote?.deposit?.fireMarshal),
        depositAssociationDues: formatUSD(quote?.deposit?.associationDues ?? quote?.depositCarrierFeesUSD ?? submission?.quote?.deposit?.associationDues),
        totalDeposit: formatUSD(quote?.deposit?.totalDeposit ?? quote?.totalDepositUSD ?? submission?.quote?.deposit?.totalDeposit),

        // Payment Details
        totalToRetain: formatUSD(quote?.commission?.totalToRetain ?? quote?.totalToRetainUSD ?? submission?.quote?.commission?.totalToRetain),
        totalToBeSent: formatUSD(quote?.payment?.totalToBeSent ?? quote?.totalToBeSentUSD ?? submission?.quote?.payment?.totalToBeSent),
        totalToFinanceCompany: formatUSD(quote?.payment?.totalToFinanceCompany ?? quote?.totalToFinanceCompanyUSD ?? submission?.quote?.payment?.totalToFinanceCompany),
    };
}
