/**
 * Commercial Property Data Mapper for PDF Generation
 */

export interface ApartmentPacketData {
    // Metadata
    applicationId: string;
    submissionId: string;
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
    hasMultipleBuildings: boolean | null;

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
    submissionNumber?: string;
    capitalCoLogoSVG?: string;

    // Financial fields for Proposal & Invoice
    quoteType?: string;
    coverageType?: string;
    policyType?: "GENERAL_LIABILITY" | "EXCESS_LIABILITY";
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
        formDate: new Date().toLocaleDateString(),

        // Agency Information
        agencyName: agency?.name || "Sterling Insurance Services",
        agentName: formData.agentName || "-",
        agencyAddress: agency?.address?.street || "5455 Wilshire Blvd",
        agencyCity: agency?.address?.city || "Los Angeles",
        agencyState: agency?.address?.state || "CA",
        agencyZip: agency?.address?.zip || "90036",
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
        proposedEffectiveDateFrom: formData.proposedEffectiveDateFrom || "-",
        proposedEffectiveDateTo: formData.proposedEffectiveDateTo || "-",
        bankruptcyPending: formData.bankruptcyPending,

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
                    return i.limit ? `${cleanSubject} ($${parseInt(i.limit).toLocaleString()})` : cleanSubject;
                })
                .join(", ")
            : (formData.subjectOfInsurance || "").replace(/\s*\([^)]+\)/, "").trim(),
        percentageElderly: formData.percentageElderly || "",
        hasMultipleBuildings: formData.hasMultipleBuildings,

        // Property Insurance Details
        subjectOfInsurance: formData.subjectOfInsurance || "-",
        propertyLimit: Array.isArray(formData.subjectsOfInsurance)
            ? formData.subjectsOfInsurance
                .filter((i: any) => i && i.limit)
                .map((i: any) => `$${parseInt(i.limit).toLocaleString()}`)
                .join(", ") || "-"
            : (formData.propertyLimit || "-"),
        propertyCoinsurance: formData.propertyCoinsurance || "-",
        propertyValuation: formData.propertyValuation || "-",
        propertyCausesOfLoss: formData.propertyCausesOfLoss || "-",
        propertyDeductible: formData.propertyDeductible || "-",
        propertyDeductibleType: (() => {
            const v = formData.propertyDeductibleType || "";
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
                    limit: i.limit ? `$${parseInt(i.limit).toLocaleString()}` : "-",
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
        batteryRoutineInspection: formData.batteryRoutineInspection,
        certificateNumber: formData.propertyDeductible || "",
        certificateExpirationDate: formData.certificateExpirationDate || "",
        fireAlarmManufacturer: formData.fireAlarmManufacturer || "",
        complianceWithSafetyLaws: formData.complianceWithSafetyLaws,
        unitsRekeyed: formData.unitsRekeyed,
        doorDoubleLocksPeepHoles: formData.doorDoubleLocksPeepHoles,
        perimeterFencing: formData.perimeterFencing,
        securityGuardOnsite: formData.securityGuardOnsite,
        proceduresNotifyingTenantsCriminal: formData.proceduresNotifyingTenantsCriminal,
        proceduresTenantSafetyComplaints: formData.proceduresTenantSafetyComplaints,
        fullTimeMaintenanceStaff: formData.fullTimeMaintenanceStaff,
        proceduresInspectingSystems: formData.proceduresInspectingSystems,

        // 5. Contractors, Pools & Additions
        hireContractorsMaintenance: formData.hireContractorsMaintenance,
        hireContractorsMaintenanceDetails: formData.hireContractorsMaintenanceDetails || "-",
        contractorsRequiredCGL: formData.contractorsRequiredCGL,
        contractorsRequiredCGLExplanation: formData.contractorsRequiredCGLExplanation || "-",
        proceduresTenantComplaintsBuilding: formData.proceduresTenantComplaintsBuilding,

        // Swimming Pools
        hasPools: formData.hasPools,
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

        nurseryDayCareFacility: formData.nurseryDayCareFacility,
        leaseProhibitsTenantsDogs: formData.leaseProhibitsTenantsDogs,
        describeOtherBuildingsHazards: formData.describeOtherBuildingsHazards || "N/A",
        ownControlParkingFacilities: formData.ownControlParkingFacilities,
        parkingAccessControlled: formData.parkingAccessControlled,
        parkingDescription: formData.parkingDescription || "-",
        proceduresRegularInspectionsHazards: formData.proceduresRegularInspectionsHazards,

        // Metadata & Financials
        submissionNumber: submission?.submissionNumber?.toString() || formData.applicationId || submissionId,
        capitalCoLogoSVG: agency?.capitalCoLogoSVG || capitalCoLogoSVG,
        quoteType: quote?.metadata?.type || "General Liability",
        coverageType: quote?.metadata?.coverageType || "Occurrence",
        policyType: quote?.metadata?.type || "GENERAL_LIABILITY",
        carrierName: quote?.metadata?.carrierName || "-",
        premium: quote?.costs?.premium ? `$${quote.costs.premium.toLocaleString()}` : "$0.00",
        carrierPolicyFee: quote?.costs?.carrierPolicyFee ? `$${quote.costs.carrierPolicyFee.toLocaleString()}` : "$0.00",
        sterlingFees: quote?.costs?.sterlingFees ? `$${quote.costs.sterlingFees.toLocaleString()}` : "$0.00",
        surplusLinesTax: quote?.costs?.surplusLinesTax ? `$${quote.costs.surplusLinesTax.toLocaleString()}` : "$0.00",
        stampingFee: quote?.costs?.stampingFee ? `$${quote.costs.stampingFee.toLocaleString()}` : "$0.00",
        stampingFeePerFiling: quote?.costs?.stampingFeePerFiling ? `$${quote.costs.stampingFeePerFiling.toLocaleString()}` : "$0.00",
        slaServiceCharge: quote?.costs?.slaServiceCharge ? `$${quote.costs.slaServiceCharge.toLocaleString()}` : "$0.00",
        fireMarshalTax: quote?.costs?.fireMarshalTax ? `$${quote.costs.fireMarshalTax.toLocaleString()}` : "$0.00",
        fireMarshalFlatFee: quote?.costs?.fireMarshalFlatFee ? `$${quote.costs.fireMarshalFlatFee.toLocaleString()}` : "$0.00",
        totalCostOfPolicy: quote?.costs?.totalCostOfPolicy ? `$${quote.costs.totalCostOfPolicy.toLocaleString()}` : "$0.00",

        depositPremium: quote?.deposit?.premium ? `$${quote.deposit.premium.toLocaleString()}` : "$0.00",
        depositAssociationDues: quote?.deposit?.associationDues ? `$${quote.deposit.associationDues.toLocaleString()}` : "$0.00",
        depositInspectionFee: quote?.deposit?.inspectionFee ? `$${quote.deposit.inspectionFee.toLocaleString()}` : "$0.00",
        depositStateTax: quote?.deposit?.stateTax ? `$${quote.deposit.stateTax.toLocaleString()}` : "$0.00",
        depositPolicyFee: quote?.deposit?.policyFee ? `$${quote.deposit.policyFee.toLocaleString()}` : "$0.00",
        depositFireMarshal: quote?.deposit?.fireMarshal ? `$${quote.deposit.fireMarshal.toLocaleString()}` : "$0.00",
        totalDeposit: quote?.deposit?.totalDeposit ? `$${quote.deposit.totalDeposit.toLocaleString()}` : "$0.00",

        totalToRetain: quote?.commission?.totalToRetain ? `$${quote.commission.totalToRetain.toLocaleString()}` : "$0.00",
        totalToBeSent: quote?.payment?.totalToBeSent ? `$${quote.payment.totalToBeSent.toLocaleString()}` : "$0.00",
        totalToFinanceCompany: quote?.payment?.totalToFinanceCompany ? `$${quote.payment.totalToFinanceCompany.toLocaleString()}` : "$0.00",

        desiredCoverageDates: quote ? `${new Date(quote.effectiveDate).toLocaleDateString()} - ${new Date(quote.expirationDate).toLocaleDateString()}` : "",
        policyEndorsements: quote?.endorsements ? quote.endorsements.join(", ") : "-",

        // Limits mapping from quote metadata
        occurrenceLimit: quote?.metadata?.limits?.occurrence ? `$${quote.metadata.limits.occurrence.toLocaleString()}` : undefined,
        aggregateLimit: quote?.metadata?.limits?.aggregate ? `$${quote.metadata.limits.aggregate.toLocaleString()}` : undefined,
        productsCompletedOpsLimit: quote?.metadata?.limits?.productsCompletedOps ? `$${quote.metadata.limits.productsCompletedOps.toLocaleString()}` : undefined,
        personalAdvertisingInjuryLimit: quote?.metadata?.limits?.personalAdvertisingInjury ? `$${quote.metadata.limits.personalAdvertisingInjury.toLocaleString()}` : undefined,
        fireLegalLimit: quote?.metadata?.limits?.fireLegal ? `$${quote.metadata.limits.fireLegal.toLocaleString()}` : undefined,
        medPayLimit: quote?.metadata?.limits?.medicalExpense ? `$${quote.metadata.limits.medicalExpense.toLocaleString()}` : undefined,

        // New Coverage & Metadata
        mineSubsidenceSelected: formData.mineSubsidenceSelected || "None",
        mineSubsidenceLimit: formData.mineSubsidenceLimit || "",
        sinkholeSelected: formData.sinkholeSelected || "None",
        sinkholeLimit: formData.sinkholeLimit || "",
        isHistoricalLandmark: formData.isHistoricalLandmark ?? null,
        openSides: formData.openSides || "",
    };
}
