/**
 * Commercial Property Data Mapper for PDF Generation
 */

export interface ApartmentPacketData {
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

    // 1. Apartment Application (General Info)
    applicantName: string;
    companyName: string;
    dba: string;
    contactPerson: string;
    applicantMailingAddress: string;
    applicantAddress: string;
    applicantCity: string;
    applicantState: string;
    applicantZip: string;
    applicantPhone: string;
    applicantEmail: string;
    propertyNameAndAddress: string;
    proposedEffectiveDateFrom: string;
    proposedEffectiveDateTo: string;
    bankruptcyPending: boolean | null;
    fein: string;
    website: string;
    yearsInBusiness: string;
    descriptionOfOperations: string;
    isNewVenture: boolean | null;
    numEmployeesFullTime: string;
    numEmployeesPartTime: string;
    numberOfFieldEmployees: string;
    annualGrossReceipts: string;
    estimatedTotalGrossReceipts: string;
    totalSqFt: string;
    classCode: string;

    // Building Type Sub-fields
    buildingType: string;
    mixedUseResidentialPct: string;
    mixedUseCommercialPct: string;
    mixedUseCommercialTenants: string;
    mixedUseCookingExposure: boolean | null;
    mixedUseSeparateEntrances: boolean | null;
    mixedUseSeparateUtilities: boolean | null;
    officeOccupancyType: string;
    officeTenantTypes: string;
    officeMedicalOffices: boolean | null;
    officeHighFootTraffic: boolean | null;
    retailType: string;
    retailCooking: boolean | null;
    retailHours: string;
    warehouseStoredItems: string;
    warehouseStorageHeight: string;
    warehouseHazardousMaterials: boolean | null;
    warehouseOccupancyType: string;
    warehouseUsageType: string;
    mfgOpsDescription: string;
    mfgProductTypes: string;
    mfgHeavyMachinery: boolean | null;
    mfgFlammableMaterials: boolean | null;
    mfgMfgPct: string;
    mfgStoragePct: string;

    // 2. Properties & Systems
    interestInPropertyRadio: "Owner" | "Manager" | "";
    propertyManagementFirmName: string;
    isManagementFirmInsured: boolean | null;
    yearFirstOwnedOrManaged: string;

    // 3. Property Details
    yearBuilt: string;
    yearRoofInstalled: string;
    yearWiringInstalled: string;
    yearPlumbingInstalled: string;
    yearHeatingInstalled: string;
    numberOfUnits: string;
    numberOfStories: string;
    hasBasement: boolean | null;
    totalBuildingArea: string;
    protectionClass: string;
    constructionType: string;
    percentageOccupied: string;
    distanceToFireHydrant: string;
    distanceToFireStation: string;
    fireDistrict: string;
    taxCode: string;
    windClass: string;
    grade: string;
    otherOccupancies: string;
    percentageElderly: string;

    // Property Insurance Details
    subjectOfInsurance: string;
    propertyLimit: string;
    propertyCoinsurance: string;
    propertyValuation: string;
    propertyCausesOfLoss: string;
    propertyDeductible: string;
    propertyDeductibleType: string;
    entityType: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    subjectsList: { subject: string, limit: string, coinsurance?: string, valuation?: string, causesOfLoss?: string, deductible?: string, deductibleType?: string }[];

    // Systems
    heatingType: string;
    buildingWiring: "Copper" | "Aluminum" | "Other" | "";
    aluminumWiringPigtailedOrCOALR: boolean | null;
    plumbingType: string;
    roofingType: string;

    // 4. Safety, Security & Operations
    hasSprinklers: boolean | null;
    percentageSprinklered: string;
    hasBurglarAlarm: boolean | null;
    burglarAlarmType: string;
    burglarAlarmInstalledBy: string;
    smokeAlarms: "Hardwire" | "Battery" | "";
    hardwiredCentralStation: boolean | null;
    batteryRoutineInspection: boolean | null;
    certificateNumber: string;
    certificateExpirationDate: string;
    fireAlarmManufacturer: string;
    complianceWithSafetyLaws: boolean | null;
    unitsRekeyed: boolean | null;
    doorDoubleLocksPeepHoles: boolean | null;
    perimeterFencing: boolean | null;
    securityGuardOnsite: boolean | null;
    proceduresNotifyingTenantsCriminal: boolean | null;
    proceduresTenantSafetyComplaints: boolean | null;
    fullTimeMaintenanceStaff: boolean | null;
    proceduresInspectingSystems: boolean | null;

    // 5. Contractors, Pools & Additions
    hireContractorsMaintenance: boolean | null;
    hireContractorsMaintenanceDetails: string;
    contractorsRequiredCGL: boolean | null;
    contractorsRequiredCGLExplanation: string;
    proceduresTenantComplaintsBuilding: boolean | null;

    // Swimming Pools
    hasPools: boolean | null;
    poolNumber: string;
    heightOfDivingBoards: string;
    lengthHeightOfSlides: string;
    fenceHeight: string;
    poolFenced: boolean | null;
    gatesSelfLatching: boolean | null;
    lifeguardOnDuty: boolean | null;
    depthMarkersVisible: boolean | null;
    poolInspectionFrequency: string;
    poolHours: string;

    // Heating details
    boilerInsuranceElsewhere: boolean | null;
    secondaryBoilerInsuranceElsewhere: boolean | null;
    isPrimaryHeatBoiler: boolean;
    isPrimaryHeatSolidFuel: boolean;
    isSecondaryHeatBoiler: boolean;
    isSecondaryHeatSolidFuel: boolean;

    nurseryDayCareFacility: boolean | null;
    leaseProhibitsTenantsDogs: boolean | null;
    describeOtherBuildingsHazards: string;
    ownControlParkingFacilities: boolean | null;
    parkingAccessControlled: boolean | null;
    parkingDescription: string;
    proceduresRegularInspectionsHazards: boolean | null;

    // Packet metadata
    capitalCoLogoSVG?: string;

    // Financial fields for Proposal & Invoice
    quoteType?: string;
    coverageType?: string;
    policyType?: "GENERAL_LIABILITY" | "EXCESS_LIABILITY";
    policyLabel?: string;
    programName?: string;
    carrierName?: string;
    premium?: string;
    carrierPolicyFee?: string;
    sterlingFees?: string;
    surplusLinesTax?: string;
    stampingFee?: string;
    stampingFeePerFiling?: string;
    slaServiceCharge?: string;
    fireMarshalTax?: string;
    fireMarshalFlatFee?: string;
    totalCostOfPolicy?: string;

    depositPremium?: string;
    depositAssociationDues?: string;
    depositInspectionFee?: string;
    depositStateTax?: string;
    depositPolicyFee?: string;
    depositFireMarshal?: string;
    totalDeposit?: string;

    totalToRetain?: string;
    totalToBeSent?: string;
    totalToFinanceCompany?: string;

    desiredCoverageDates?: string;
    policyEndorsements?: string;
    paymentOption?: string;

    // Coverage Limits
    occurrenceLimit?: string;
    aggregateLimit?: string;
    productsCompletedOpsLimit?: string;
    personalAdvertisingInjuryLimit?: string;
    fireLegalLimit?: string;
    medPayLimit?: string;

    // Coverages & Additional Info
    mineSubsidenceSelected: "Accept" | "Reject" | "None";
    mineSubsidenceLimit: string;
    sinkholeSelected: "Accept" | "Reject" | "None";
    sinkholeLimit: string;
    isHistoricalLandmark: boolean | null;
    openSides: string;

    // General Liability (Optional)
    addGeneralLiability: boolean;
    glCoverageLimits: string;
    glFireLegalLimit: string;
    glMedicalExpenseLimit: string;
    glDeductible: string;
}

/**
 * Helper to format date strings or objects to MM/DD/YYYY
 */
function formatDateToUS(dateInput: any): string {
    if (!dateInput || dateInput === "-") return "-";
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return "-";
    return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
    });
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

export function mapApartmentDataToPacketData(
    formData: any,
    submissionId: string,
    agency: any,
    quote?: any,
    submission?: any,
    capitalCoLogoSVG?: string
): ApartmentPacketData {
    return {
        applicationId: formData.applicationId || submissionId,
        submissionId: submissionId,
        submissionNumber: submission?.submissionNumber || formData.applicationId || submissionId,
        formDate: formatDateToUS(new Date()),

        // Agency Information
        agencyName: agency?.name || "Sterling Insurance Services",
        agentName: formData.agentName || "-",
        agencyAddress: agency?.address?.street || "292 S La Cienega Blvd Ste 206",
        agencyCity: agency?.address?.city || "Beverly Hills",
        agencyState: agency?.address?.state || "CA",
        agencyZip: agency?.address?.zip || "90211",
        agencyPhone: agency?.phone || "(310) 492-2007",
        agencyEmail: agency?.email || "info@sterlinginsurancepartners.com",

        // 1. Apartment Application (General Info)
        applicantName: formData.applicantName || "-",
        companyName: formData.applicantName || "-",
        dba: formData.dba || "None",
        contactPerson: formData.applicantName || "-",
        applicantMailingAddress: formData.applicantMailingAddress || "-",
        applicantAddress: formData.applicantMailingAddress || "-",
        applicantCity: formData.applicantCity || agency?.address?.city || "-",
        applicantState: formData.applicantState || agency?.address?.state || "-",
        applicantZip: formData.applicantZip || agency?.address?.zip || "-",
        applicantPhone: formData.applicantPhone || agency?.phone || "-",
        applicantEmail: formData.applicantEmail || agency?.email || "-",
        propertyNameAndAddress: formData.propertyNameAndAddress || "-",
        proposedEffectiveDateFrom: formatDateToUS(formData.proposedEffectiveDateFrom),
        proposedEffectiveDateTo: formatDateToUS(formData.proposedEffectiveDateTo),
        bankruptcyPending: formData.bankruptcyPending,
        fein: formData.fein || "-",
        website: formData.website || "-",
        yearsInBusiness: formData.yearsInBusiness || "-",
        descriptionOfOperations: formData.descriptionOfOperations || formData.workDescription || "-",
        isNewVenture: formData.isNewVenture || false,
        numEmployeesFullTime: formData.numEmployeesFullTime || "0",
        numEmployeesPartTime: formData.numEmployeesPartTime || "0",
        numberOfFieldEmployees: formData.numEmployeesFullTime || "0",
        annualGrossReceipts: formData.annualGrossReceipts || formData.estimatedTotalGrossReceipts || "-",
        estimatedTotalGrossReceipts: formData.annualGrossReceipts || formData.estimatedTotalGrossReceipts || "-",
        totalSqFt: formData.totalBuildingArea || "-",
        classCode: formData.classCode || "-",

        // Building Type Sub-fields
        buildingType: formData.buildingType || "-",
        mixedUseResidentialPct: formData.mixedUseResidentialPct || "0",
        mixedUseCommercialPct: formData.mixedUseCommercialPct || "0",
        mixedUseCommercialTenants: formData.mixedUseCommercialTenants || "-",
        mixedUseCookingExposure: formData.mixedUseCookingExposure,
        mixedUseSeparateEntrances: formData.mixedUseSeparateEntrances,
        mixedUseSeparateUtilities: formData.mixedUseSeparateUtilities,
        officeOccupancyType: formData.officeOccupancyType || "-",
        officeTenantTypes: formData.officeTenantTypes || "-",
        officeMedicalOffices: formData.officeMedicalOffices,
        officeHighFootTraffic: formData.officeHighFootTraffic,
        retailType: formData.retailType || "-",
        retailCooking: formData.retailCooking,
        retailHours: formData.retailHours || "-",
        warehouseStoredItems: formData.warehouseStoredItems || "-",
        warehouseStorageHeight: formData.warehouseStorageHeight || "-",
        warehouseHazardousMaterials: formData.warehouseHazardousMaterials,
        warehouseOccupancyType: formData.warehouseOccupancyType || "-",
        warehouseUsageType: formData.warehouseUsageType || "-",
        mfgOpsDescription: formData.mfgOpsDescription || "-",
        mfgProductTypes: formData.mfgProductTypes || "-",
        mfgHeavyMachinery: formData.mfgHeavyMachinery,
        mfgFlammableMaterials: formData.mfgFlammableMaterials,
        mfgMfgPct: formData.mfgMfgPct || "0",
        mfgStoragePct: formData.mfgStoragePct || "0",

        // 2. Properties & Systems
        interestInPropertyRadio: formData.interestInPropertyRadio || "",
        propertyManagementFirmName: formData.propertyManagementFirmName || "-",
        isManagementFirmInsured: formData.isManagementFirmInsured,
        yearFirstOwnedOrManaged: formData.yearFirstOwnedOrManaged || "-",

        // 3. Property Details
        yearBuilt: formData.yearBuilt || "",
        yearRoofInstalled: formData.yearRoofInstalled || "",
        yearWiringInstalled: formData.yearWiringInstalled || "",
        yearPlumbingInstalled: formData.yearPlumbingInstalled || "",
        yearHeatingInstalled: formData.yearHeatingInstalled || "",
        numberOfUnits: formData.numberOfUnits || "",
        numberOfStories: formData.numberOfStories || "",
        hasBasement: formData.hasBasement,
        totalBuildingArea: formData.totalBuildingArea || "",
        protectionClass: formData.protectionClass || "",
        constructionType: formData.constructionType || "",
        percentageOccupied: formData.percentageOccupied || "",
        distanceToFireHydrant: formData.distanceToFireHydrant || "",
        distanceToFireStation: formData.distanceToFireStation || "",
        fireDistrict: formData.fireDistrict || "",
        taxCode: formData.taxCode || "",
        windClass: (() => {
            const v = formData.propertyValuation || "";
            const match = v.match(/\(([^)]+)\)/);
            return match ? match[1] : v;
        })(),
        grade: formData.propertyCoinsurance || "",
        otherOccupancies: Array.isArray(formData.subjectsOfInsurance)
            ? formData.subjectsOfInsurance
                .filter((i: any) => i && i.subject)
                .map((i: any) => {
                    const cleanSubject = i.subject.replace(/\s*\([^)]+\)/, "").trim();
                    return i.limit ? `${cleanSubject} ($${parseInt(i.limit).toLocaleString('en-US')})` : cleanSubject;
                })
                .join(", ")
            : (formData.subjectOfInsurance || "").replace(/\s*\([^)]+\)/, "").trim(),
        percentageElderly: formData.percentageElderly || "",

        // Property Insurance Details
        subjectOfInsurance: formData.subjectOfInsurance || "-",
        propertyLimit: Array.isArray(formData.subjectsOfInsurance)
            ? formData.subjectsOfInsurance
                .filter((i: any) => i && i.limit)
                .map((i: any) => `$${parseInt(i.limit).toLocaleString('en-US')}`)
                .join(", ") || "-"
            : (formData.propertyLimit || "-"),
        propertyCoinsurance: formData.propertyCoinsurance || formData.subjectsOfInsurance?.[0]?.coinsurance || "-",
        propertyValuation: (() => {
            const v = formData.propertyValuation || formData.subjectsOfInsurance?.[0]?.valuation || "-";
            if (v === "Actual Cash Value (ACV)") return "ACV";
            if (v === "Replacement Cost (RC)") return "RC";
            return v;
        })(),
        propertyCausesOfLoss: formData.propertyCausesOfLoss || formData.subjectsOfInsurance?.[0]?.causesOfLoss || "-",
        propertyDeductible: formData.propertyDeductible || formData.subjectsOfInsurance?.[0]?.deductible || "-",
        propertyDeductibleType: (() => {
            const v = formData.propertyDeductibleType || formData.subjectsOfInsurance?.[0]?.deductibleType || "";
            const match = v.match(/\(([^)]+)\)/);
            return match ? match[1] : v;
        })(),
        entityType: formData.entityType || "Individual",
        firstName: formData.firstName || "",
        lastName: formData.lastName || "",
        phone: formData.phone || "",
        email: formData.email || "",
        subjectsList: Array.isArray(formData.subjectsOfInsurance)
            ? formData.subjectsOfInsurance
                .filter((i: any) => i && i.subject)
                .map((i: any) => ({
                    subject: i.subject.replace(/\s*\([^)]+\)/, "").trim(),
                    limit: i.limit ? `$${parseInt(i.limit).toLocaleString('en-US')}` : "-",
                    coinsurance: i.coinsurance || formData.propertyCoinsurance || "",
                    valuation: (i.valuation || formData.propertyValuation) === "Actual Cash Value (ACV)" ? "ACV" : ((i.valuation || formData.propertyValuation) === "Replacement Cost (RC)" ? "RC" : ""),
                    causesOfLoss: i.causesOfLoss || formData.propertyCausesOfLoss || "",
                    deductible: i.deductible || formData.propertyDeductible || "",
                    deductibleType: i.deductibleType || formData.propertyDeductibleType || ""
                }))
            : [],

        // Systems
        heatingType: formData.heatingType || "-",
        buildingWiring: formData.buildingWiring || "",
        aluminumWiringPigtailedOrCOALR: formData.aluminumWiringPigtailedOrCOALR,
        plumbingType: formData.plumbingType || "-",
        roofingType: formData.roofingType || "-",

        // 4. Safety, Security & Operations
        hasSprinklers: formData.hasSprinklers,
        percentageSprinklered: formData.percentageSprinklered || "0",
        hasBurglarAlarm: formData.hasBurglarAlarm,
        burglarAlarmType: formData.burglarAlarmType || "",
        burglarAlarmInstalledBy: formData.burglarAlarmInstalledBy || "",
        smokeAlarms: formData.smokeAlarms || "",
        hardwiredCentralStation: formData.hardwiredCentralStation,
        batteryRoutineInspection: formData.batteryRoutineInspection ?? true,
        certificateNumber: formData.propertyDeductible || "",
        certificateExpirationDate: formatDateToUS(formData.certificateExpirationDate),
        fireAlarmManufacturer: formData.fireAlarmManufacturer || "",
        complianceWithSafetyLaws: formData.complianceWithSafetyLaws ?? true,
        unitsRekeyed: formData.unitsRekeyed ?? true,
        doorDoubleLocksPeepHoles: formData.doorDoubleLocksPeepHoles ?? true,
        perimeterFencing: formData.perimeterFencing ?? true,
        securityGuardOnsite: formData.securityGuardOnsite ?? false,
        proceduresNotifyingTenantsCriminal: formData.proceduresNotifyingTenantsCriminal ?? true,
        proceduresTenantSafetyComplaints: formData.proceduresTenantSafetyComplaints ?? true,
        fullTimeMaintenanceStaff: formData.fullTimeMaintenanceStaff ?? false,
        proceduresInspectingSystems: formData.proceduresInspectingSystems,

        // 5. Contractors, Pools & Additions
        hireContractorsMaintenance: formData.hireContractorsMaintenance ?? true,
        hireContractorsMaintenanceDetails: formData.hireContractorsMaintenanceDetails || "-",
        contractorsRequiredCGL: formData.contractorsRequiredCGL ?? true,
        contractorsRequiredCGLExplanation: formData.contractorsRequiredCGLExplanation || "-",
        proceduresTenantComplaintsBuilding: formData.proceduresTenantComplaintsBuilding ?? true,

        // Swimming Pools
        hasPools: formData.hasPools ?? false,
        poolNumber: formData.poolNumber || "-",
        heightOfDivingBoards: formData.heightOfDivingBoards || "-",
        lengthHeightOfSlides: formData.lengthHeightOfSlides || "-",
        fenceHeight: formData.fenceHeight || "-",
        poolFenced: formData.poolFenced,
        gatesSelfLatching: formData.gatesSelfLatching,
        lifeguardOnDuty: formData.lifeguardOnDuty,
        depthMarkersVisible: formData.depthMarkersVisible,
        poolInspectionFrequency: formData.poolInspectionFrequency || "-",
        poolHours: formData.poolHours || "-",

        // Heating Logic
        boilerInsuranceElsewhere: formData.boilerInsuranceElsewhere,
        secondaryBoilerInsuranceElsewhere: formData.secondaryBoilerInsuranceElsewhere,
        isPrimaryHeatBoiler: formData.heatingType === "Boiler",
        isPrimaryHeatSolidFuel: formData.heatingType === "Solid Fuel",
        isSecondaryHeatBoiler: formData.secondaryHeatingType === "Boiler",
        isSecondaryHeatSolidFuel: formData.secondaryHeatingType === "Solid Fuel",

        nurseryDayCareFacility: formData.nurseryDayCareFacility ?? false,
        leaseProhibitsTenantsDogs: formData.leaseProhibitsTenantsDogs ?? true,
        describeOtherBuildingsHazards: formData.describeOtherBuildingsHazards || "N/A",
        ownControlParkingFacilities: formData.ownControlParkingFacilities ?? false,
        parkingAccessControlled: formData.parkingAccessControlled,
        parkingDescription: formData.parkingDescription || "-",
        proceduresRegularInspectionsHazards: formData.proceduresRegularInspectionsHazards ?? true,

        // Metadata & Financials
        capitalCoLogoSVG: agency?.capitalCoLogoSVG || capitalCoLogoSVG,
        programName: submission?.programName || "Commercial Property",
        quoteType: (() => {
            const type = quote?.policyType || "GENERAL_LIABILITY";
            const isApartment = submission?.programId === 'apartment-buildings' || 
                               submission?.programName?.toLowerCase().includes("apartment building") || 
                               submission?.programName?.toLowerCase().includes("commercial property");
            
            if (isApartment) {
                return type === "GENERAL_LIABILITY" ? "Commercial Property" : "General Liability";
            }
            return type === "GENERAL_LIABILITY" ? "General Liability" : "Excess Liability";
        })(),
        coverageType: quote?.metadata?.coverageType || quote?.coverageType || "Occurrence",
        policyType: quote?.metadata?.type || quote?.policyType || "GENERAL_LIABILITY",
        policyLabel: (() => {
            const type = quote?.policyType || "GENERAL_LIABILITY";
            const isApartment = submission?.programId === 'apartment-buildings' || 
                               submission?.programName?.toLowerCase().includes("apartment building") || 
                               submission?.programName?.toLowerCase().includes("commercial property");
            
            if (isApartment) {
                return type === "GENERAL_LIABILITY" ? "Commercial Property" : "General Liability";
            }
            return type === "GENERAL_LIABILITY" ? "General Liability" : "Excess Liability";
        })(),
        carrierName: quote?.metadata?.carrierName || quote?.carrierId?.name || "-",
        premium: formatUSD(quote?.costs?.premium ?? quote?.carrierQuoteUSD),
        carrierPolicyFee: formatUSD(quote?.costs?.carrierPolicyFee ?? quote?.carrierFeesUSD),
        sterlingFees: formatUSD(quote?.costs?.sterlingFees ?? quote?.sterlingInsuranceServicesFeesUSD),
        surplusLinesTax: formatUSD(quote?.costs?.surplusLinesTax ?? quote?.premiumTaxAmountUSD),
        stampingFee: formatUSD(quote?.costs?.stampingFee ?? quote?.stampingFeeAmountUSD),
        stampingFeePerFiling: formatUSD(quote?.costs?.stampingFeePerFiling ?? quote?.stampingFeePerFilingUSD),
        slaServiceCharge: formatUSD(quote?.costs?.slaServiceCharge ?? quote?.slaServiceChargeUSD),
        fireMarshalTax: formatUSD(quote?.costs?.fireMarshalTax ?? quote?.fireMarshalTaxAmountUSD),
        fireMarshalFlatFee: formatUSD(quote?.costs?.fireMarshalFlatFee ?? quote?.fireMarshalFlatFeeUSD),
        totalCostOfPolicy: formatUSD(quote?.costs?.totalCostOfPolicy ?? quote?.finalAmountUSD),

        depositPremium: formatUSD(quote?.deposit?.premium ?? quote?.depositPremiumUSD),
        depositAssociationDues: formatUSD(quote?.deposit?.associationDues ?? quote?.depositCarrierFeesUSD),
        depositInspectionFee: formatUSD(quote?.deposit?.inspectionFee ?? quote?.depositSterlingFeesUSD),
        depositStateTax: formatUSD(quote?.deposit?.stateTax ?? quote?.depositTaxUSD),
        depositPolicyFee: formatUSD(quote?.deposit?.policyFee ?? quote?.depositStampingUSD),
        depositFireMarshal: formatUSD(quote?.deposit?.fireMarshal ?? quote?.depositFireMarshalUSD),
        totalDeposit: formatUSD(quote?.deposit?.totalDeposit ?? quote?.totalDepositUSD),

        totalToRetain: formatUSD(quote?.commission?.totalToRetain ?? quote?.totalToRetainUSD),
        totalToBeSent: formatUSD(quote?.payment?.totalToBeSent ?? quote?.totalToBeSentUSD),
        totalToFinanceCompany: formatUSD(quote?.payment?.totalToFinanceCompany ?? quote?.totalToFinanceCompanyUSD),

        desiredCoverageDates: (() => {
            const eff = quote?.effectiveDate || formData.proposedEffectiveDateFrom;
            const exp = quote?.expirationDate || formData.proposedEffectiveDateTo;

            const effStr = formatDateToUS(eff);
            const expStr = formatDateToUS(exp);

            if (effStr === "-" || expStr === "-") return "-";
            return `${effStr} - ${expStr}`;
        })(),
        policyEndorsements: quote?.endorsements ? quote.endorsements.join(", ") : "-",

        // Limits mapping from quote metadata
        occurrenceLimit: quote?.metadata?.limits?.occurrence ? `$${quote.metadata.limits.occurrence.toLocaleString('en-US')}` : undefined,
        aggregateLimit: quote?.metadata?.limits?.aggregate ? `$${quote.metadata.limits.aggregate.toLocaleString('en-US')}` : undefined,
        productsCompletedOpsLimit: quote?.metadata?.limits?.productsCompletedOps ? `$${quote.metadata.limits.productsCompletedOps.toLocaleString('en-US')}` : undefined,
        personalAdvertisingInjuryLimit: quote?.metadata?.limits?.personalAdvertisingInjury ? `$${quote.metadata.limits.personalAdvertisingInjury.toLocaleString('en-US')}` : undefined,
        fireLegalLimit: quote?.metadata?.limits?.fireLegal ? `$${quote.metadata.limits.fireLegal.toLocaleString('en-US')}` : undefined,
        medPayLimit: quote?.metadata?.limits?.medicalExpense ? `$${quote.metadata.limits.medicalExpense.toLocaleString('en-US')}` : undefined,

        // New Coverage & Metadata
        mineSubsidenceSelected: formData.mineSubsidenceSelected || "None",
        mineSubsidenceLimit: formData.mineSubsidenceLimit || "",
        sinkholeSelected: formData.sinkholeSelected || "None",
        sinkholeLimit: formData.sinkholeLimit || "",
        isHistoricalLandmark: formData.isHistoricalLandmark ?? null,
        openSides: formData.openSides || "",

        // General Liability (Optional)
        addGeneralLiability: formData.addGeneralLiability || false,
        glCoverageLimits: formData.glCoverageLimits || "-",
        glFireLegalLimit: formData.glFireLegalLimit || "-",
        glMedicalExpenseLimit: formData.glMedicalExpenseLimit || "-",
        glDeductible: formData.glDeductible || "-",
        paymentOption: formData.paymentOption || "Premium Financial Partners Co.",
    };
}
