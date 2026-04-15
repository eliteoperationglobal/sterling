/**
 * Apartment Buildings Data Mapper for PDF Generation
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

    // 2. Properties & Systems
    interestInPropertyRadio: "Owner" | "Manager" | "";
    propertyManagementFirmName: string;
    isManagementFirmInsured: boolean | null;
    yearFirstOwnedOrManaged: string;

    // 3. Property Details
    buildingAge: string;
    roofAge: string;
    numberOfUnits: string;
    numberOfStories: string;
    protectionClass: string;
    constructionType: string;
    percentageOccupied: string;
    percentageStudents: string;
    percentageSubsidized: string;
    percentageElderly: string;
    percentageSprinklered: string;

    // Systems
    heatingType: string;
    heatingLastInspection: string;
    heatingRecordsOnFile: boolean | null;

    airConditioningType: string;
    airConditioningLastInspection: string;
    airConditioningRecordsOnFile: boolean | null;

    waterHeaterType: string;
    waterHeaterLastInspection: string;
    waterHeaterRecordsOnFile: boolean | null;

    boilerType: string;
    boilerLastInspection: string;
    boilerRecordsOnFile: boolean | null;

    buildingWiring: "Copper" | "Aluminum" | "";
    aluminumWiringPigtailedOrCOALR: boolean | null;

    // 4. Safety, Security & Operations
    smokeAlarms: "Hardwire" | "Battery" | "";
    hardwiredCentralStation: boolean | null;
    batteryRoutineInspection: boolean | null;
    smokeAlarmsDetails: string;
    otherFireSafetySystems: string;
    complianceWithSafetyLaws: boolean | null;
    complexDemastered: boolean | null;
    proceduresForMasterKey: string;
    keysCodedAndProtected: boolean | null;
    unitsRekeyed: boolean | null;
    doorDoubleLocksPeepHoles: boolean | null;
    perimeterFencing: boolean | null;
    securityLighting: boolean | null;
    securityGuardOnsite: boolean | null;
    policeBackgroundChecks: boolean | null;
    backgroundCheckCriteria: string;
    proceduresNotifyingTenantsCriminal: boolean | null;
    proceduresNotifyingTenantsCriminalDescription: string;
    proceduresTenantSafetyComplaints: boolean | null;
    proceduresTenantSafetyComplaintsDescription: string;
    fullTimeMaintenanceStaff: boolean | null;
    proceduresInspectingSystems: boolean | null;

    // 5. Contractors, Pools & Additions
    hireContractorsMaintenance: boolean | null;
    hireContractorsMaintenanceDetails: string;
    contractorsRequiredCGL: boolean | null;
    contractorsRequiredCGLExplanation: string;
    proceduresTenantComplaintsBuilding: boolean | null;
    proceduresTenantComplaintsBuildingDescription: string;
    
    // Swimming Pools
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

    nurseryDayCareFacility: boolean | null;
    proceduresProhibitingEmployeesDogs: boolean | null;
    leaseProhibitsTenantsDogs: boolean | null;
    dogWeightLimit: string;
    provideMedicalFoodTransport: boolean | null;
    describeOtherBuildingsHazards: string;
    ownControlParkingFacilities: boolean | null;
    parkingAccessControlled: boolean | null;
    parkingDescription: string;
    proceduresRegularInspectionsHazards: boolean | null;
    proceduresRegularInspectionsHazardsDescription: string;
    insuranceAgentCompletedInspection: boolean | null;

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
        contactPerson: formData.contactPerson || formData.applicantName || "-",
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

        // 2. Properties & Systems
        interestInPropertyRadio: formData.interestInPropertyRadio || "",
        propertyManagementFirmName: formData.propertyManagementFirmName || "-",
        isManagementFirmInsured: formData.isManagementFirmInsured,
        yearFirstOwnedOrManaged: formData.yearFirstOwnedOrManaged || "-",

        // 3. Property Details
        buildingAge: formData.buildingAge || "-",
        roofAge: formData.roofAge || "-",
        numberOfUnits: formData.numberOfUnits || "-",
        numberOfStories: formData.numberOfStories || "-",
        protectionClass: formData.protectionClass || "-",
        constructionType: formData.constructionType || "-",
        percentageOccupied: formData.percentageOccupied || "-",
        percentageStudents: formData.percentageStudents || "-",
        percentageSubsidized: formData.percentageSubsidized || "-",
        percentageElderly: formData.percentageElderly || "-",
        percentageSprinklered: formData.percentageSprinklered || "-",

        // Systems
        heatingType: formData.heatingType || "-",
        heatingLastInspection: formData.heatingLastInspection || "-",
        heatingRecordsOnFile: formData.heatingRecordsOnFile,

        airConditioningType: formData.airConditioningType || "-",
        airConditioningLastInspection: formData.airConditioningLastInspection || "-",
        airConditioningRecordsOnFile: formData.airConditioningRecordsOnFile,

        waterHeaterType: formData.waterHeaterType || "-",
        waterHeaterLastInspection: formData.waterHeaterLastInspection || "-",
        waterHeaterRecordsOnFile: formData.waterHeaterRecordsOnFile,

        boilerType: formData.boilerType || "-",
        boilerLastInspection: formData.boilerLastInspection || "-",
        boilerRecordsOnFile: formData.boilerRecordsOnFile,

        buildingWiring: formData.buildingWiring || "",
        aluminumWiringPigtailedOrCOALR: formData.aluminumWiringPigtailedOrCOALR,

        // 4. Safety, Security & Operations
        smokeAlarms: formData.smokeAlarms || "",
        hardwiredCentralStation: formData.hardwiredCentralStation,
        batteryRoutineInspection: formData.batteryRoutineInspection,
        smokeAlarmsDetails: formData.smokeAlarmsDetails || "-",
        otherFireSafetySystems: formData.otherFireSafetySystems || "-",
        complianceWithSafetyLaws: formData.complianceWithSafetyLaws,
        complexDemastered: formData.complexDemastered,
        proceduresForMasterKey: formData.proceduresForMasterKey || "-",
        keysCodedAndProtected: formData.keysCodedAndProtected,
        unitsRekeyed: formData.unitsRekeyed,
        doorDoubleLocksPeepHoles: formData.doorDoubleLocksPeepHoles,
        perimeterFencing: formData.perimeterFencing,
        securityLighting: formData.securityLighting,
        securityGuardOnsite: formData.securityGuardOnsite,
        policeBackgroundChecks: formData.policeBackgroundChecks,
        backgroundCheckCriteria: formData.backgroundCheckCriteria || "-",
        proceduresNotifyingTenantsCriminal: formData.proceduresNotifyingTenantsCriminal,
        proceduresNotifyingTenantsCriminalDescription: formData.proceduresNotifyingTenantsCriminalDescription || "-",
        proceduresTenantSafetyComplaints: formData.proceduresTenantSafetyComplaints,
        proceduresTenantSafetyComplaintsDescription: formData.proceduresTenantSafetyComplaintsDescription || "-",
        fullTimeMaintenanceStaff: formData.fullTimeMaintenanceStaff,
        proceduresInspectingSystems: formData.proceduresInspectingSystems,

        // 5. Contractors, Pools & Additions
        hireContractorsMaintenance: formData.hireContractorsMaintenance,
        hireContractorsMaintenanceDetails: formData.hireContractorsMaintenanceDetails || "-",
        contractorsRequiredCGL: formData.contractorsRequiredCGL,
        contractorsRequiredCGLExplanation: formData.contractorsRequiredCGLExplanation || "-",
        proceduresTenantComplaintsBuilding: formData.proceduresTenantComplaintsBuilding,
        proceduresTenantComplaintsBuildingDescription: formData.proceduresTenantComplaintsBuildingDescription || "-",
        
        // Swimming Pools
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

        nurseryDayCareFacility: formData.nurseryDayCareFacility,
        proceduresProhibitingEmployeesDogs: formData.proceduresProhibitingEmployeesDogs,
        leaseProhibitsTenantsDogs: formData.leaseProhibitsTenantsDogs,
        dogWeightLimit: formData.dogWeightLimit || "-",
        provideMedicalFoodTransport: formData.provideMedicalFoodTransport,
        describeOtherBuildingsHazards: formData.describeOtherBuildingsHazards || "-",
        ownControlParkingFacilities: formData.ownControlParkingFacilities,
        parkingAccessControlled: formData.parkingAccessControlled,
        parkingDescription: formData.parkingDescription || "-",
        proceduresRegularInspectionsHazards: formData.proceduresRegularInspectionsHazards,
        proceduresRegularInspectionsHazardsDescription: formData.proceduresRegularInspectionsHazardsDescription || "-",
        insuranceAgentCompletedInspection: formData.insuranceAgentCompletedInspection,

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
    };
}


