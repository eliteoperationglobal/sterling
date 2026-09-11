/**
 * Builders Risk Supplemental Application Data Mapper for PDF Generation
 * Styled and structured to match Manufacturers & Apartment Packet mappers
 */

export interface BuildersRiskPacketData {
    isMappedPacketData?: boolean;

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

    // Section 1: General Info
    namedInsured: string;
    brokerage: string;
    agencyAgent: string;
    isNewVenture: boolean | null;
    isRenewal: boolean | null;
    policyNumber: string;
    currentEffectiveDate: string;
    currentExpiryDate: string;
    requestedEffectiveDate: string;
    requestedExpiryDate: string;
    website: string;
    phone?: string;
    email?: string;

    // 2. Current Carrier Info
    carrier: string;
    limitOfInsurance: string;
    effectiveDate: string;
    expiryDate: string;
    deductible: string;
    premium: string;
    offeringRenewal: boolean | null;

    // 3 & 4. Addresses
    mailingAddress: string;
    mailingCity: string;
    mailingState: string;
    mailingZip: string;
    sameAsMailing: boolean;
    propertyAddress: string;
    propertyCity: string;
    propertyState: string;
    propertyZip: string;

    // 5. Entity Type
    entityType: string[];
    entityTypeOther: string;

    // 6. Operation History
    operationHistory: string;

    // 7. Project Interest
    projectInterest: string;
    projectInterestOther: string;

    // 8 & 9. Dates
    constructionStartDate: string;
    constructionProjectedEndDate: string;

    // 10. Prior Work Started
    workAlreadyStarted: boolean | null;
    priorCoverageInPlace: boolean | null;
    workStartedExplanation: string;
    percentageWorkCompleted: string;

    // 11. Requested Coverages
    coverages: {
        businessIncome?: boolean;
        businessIncomeLimit?: string;
        mechanicalBreakdown?: boolean;
        mechanicalBreakdownLimit?: string;
        propertyInTransit?: boolean;
        propertyInTransitLimit?: string;
        propertyInStorage?: boolean;
        propertyInStorageLimit?: string;
        earthMovement?: boolean;
        earthMovementLimit?: string;
        flood?: boolean;
        floodLimit?: string;
        other?: boolean;
        otherName?: string;
        otherLimit?: string;
    };

    // 12. Receipts & Payroll
    projectedRevenue: string;
    projectedPayroll: string;
    last12Revenue: string;
    last12Payroll: string;
    prior2YearRevenue: string;
    prior2YearPayroll: string;

    // 13. Contractor
    contractorName: string;
    contractorExperienceYears: string;

    // Section II: Property Details
    // 14. Renovation / Ground-up
    isRenovated: boolean | null;
    isGroundUp: boolean | null;
    groundUpExplanation: string;
    totalInsurableValue: string;

    // 15. Work Performed
    workDescription: string;

    // 16. Intended Occupancy
    intendedOccupancy: string;

    // 17. Construction Materials
    constructionMaterials: string[];
    constructionMaterialOther: string;

    // 18. Stories & Cranes
    numberOfStories: string;
    involvesCranes: boolean | null;

    // 19. Roofing
    roofingMaterials: string;

    // 20. Protection Class
    protectionClass: string;

    // 21. Structure Occupied Prior to Completion
    occupiedPriorToCompletion: boolean | null;
    occupiedByWhom: string;
    occupancyDetails: string;

    // 22. Site Security
    siteFenced: boolean | null;
    siteLighted: boolean | null;
    siteLocked: boolean | null;
    siteGuards: boolean | null;
    siteOtherSecurity: string;
    siteOtherSecurityActive: boolean | null;

    // Section III: Renovation
    demoExistingStructure: boolean | null;
    structuralAlterations: boolean | null;
    existingDamage: boolean | null;
    existingDamageClarification: string;
    coverageExistingStructure: boolean | null;
    structureCoveredOtherPolicy: boolean | null;
    existingStructureValue: string;
    buildingMaterialsValue: string;
    insurableValueTotal: string;
    yearBuilt: string;
    originalSquareFootage: string;
    additionSquareFootage: string;
    previousOccupancy: string;
    fireSafetySystems: string[];
    fireSafetyOther: string;
    fireSystemsWorkingOrder: boolean | null;
    fireSystemsMaintained: boolean | null;
    fireSystemsExplanation: string;
    electricalServiceMaintained: boolean | null;
    electricalLastUpdated: string;
    heatingServiceMaintained: boolean | null;
    heatingLastUpdated: string;
    waterServiceShutOff: boolean | null;
    plumbingLastUpdated: string;
    burglarAlarmInPlace: boolean | null;
    burglarAlarmMaintained: boolean | null;

    // Section IV: Claims History
    unreportedIncidents: boolean | null;
    unreportedIncidentsExplanation: string;
    canceledNonRenewed: boolean | null;
    canceledExplanation: string;
    claimsList: any[];
}

export function mapBuildersRiskDataToPacketData(
    formData: any,
    submissionId: string,
    agency: any,
    quote: any,
    submission: any,
    capitalCoLogoSVG?: string
): BuildersRiskPacketData {
    const safeData = formData || {};

    // Formatting Dates
    const rawDate = submission?.createdAt ? new Date(submission.createdAt) : new Date();
    const formDate = rawDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

    // Addresses
    const mailingAddress = safeData.mailingAddress || safeData.streetAddress || '';
    const mailingCity = safeData.mailingCity || safeData.city || '';
    const mailingState = safeData.mailingState || safeData.state || '';
    const mailingZip = safeData.mailingZip || safeData.zip || '';

    const sameAsMailing = !!safeData.sameAsMailing;
    const propertyAddress = sameAsMailing ? mailingAddress : (safeData.propertyAddress || '');
    const propertyCity = sameAsMailing ? mailingCity : (safeData.propertyCity || '');
    const propertyState = sameAsMailing ? mailingState : (safeData.propertyState || '');
    const propertyZip = sameAsMailing ? mailingZip : (safeData.propertyZip || '');

    const toBool = (val: any): boolean | null => {
        if (val === true) return true;
        if (val === false) return false;
        return null;
    };

    return {
        isMappedPacketData: true,

        // Metadata
        applicationId: submissionId || "Pending",
        submissionId: submissionId || "Pending",
        submissionNumber: submission?.submissionNumber?.toString() || submissionId || "Pending",
        formDate: formDate,

        // Agency Info
        agencyName: agency?.name || safeData.agencyName || "Capital & Co Insurance Services",
        agentName: safeData.agentName || safeData.agencyAgent || submission?.agentName || agency?.agentName || "Capital & Co",
        agencyAddress: agency?.address?.street || safeData.agencyAddress || "292 S La Cienega Blvd Ste 206",
        agencyCity: agency?.address?.city || safeData.agencyCity || "Beverly Hills",
        agencyState: agency?.address?.state || safeData.agencyState || "CA",
        agencyZip: agency?.address?.zip || safeData.agencyZip || "90211",
        agencyPhone: agency?.phone || safeData.agencyPhone || "(310) 284-2136",
        agencyEmail: agency?.email || safeData.agencyEmail || "eidan@capcoinsurance.com",
        policyNumberBound: quote?.status === "BOUND" ? quote?.policyNumber : "",
        capitalCoLogoSVG: capitalCoLogoSVG,

        // General Info
        namedInsured: safeData.namedInsured || safeData.companyName || '',
        brokerage: safeData.brokerage || safeData.broker || '',
        agencyAgent: safeData.agencyAgent || safeData.agentName || submission?.agentName || '',
        isNewVenture: toBool(safeData.isNewVenture),
        isRenewal: toBool(safeData.isRenewal),
        policyNumber: safeData.policyNumber || '',
        currentEffectiveDate: safeData.currentEffectiveDate || '',
        currentExpiryDate: safeData.currentExpiryDate || '',
        requestedEffectiveDate: safeData.requestedEffectiveDate || safeData.effectiveDate || '',
        requestedExpiryDate: safeData.requestedExpiryDate || '',
        website: safeData.website || '',
        phone: safeData.phone || safeData.contactPhone || '',
        email: safeData.email || safeData.contactEmail || '',

        // Current Carrier Info
        carrier: safeData.carrier || '',
        limitOfInsurance: safeData.limitOfInsurance || '',
        effectiveDate: safeData.effectiveDate || '',
        expiryDate: safeData.expiryDate || '',
        deductible: safeData.deductible || '',
        premium: safeData.premium || '',
        offeringRenewal: toBool(safeData.offeringRenewal),

        // Addresses
        mailingAddress,
        mailingCity,
        mailingState,
        mailingZip,
        sameAsMailing,
        propertyAddress,
        propertyCity,
        propertyState,
        propertyZip,

        // Entity Type
        entityType: Array.isArray(safeData.entityType) ? safeData.entityType : safeData.entityType ? [safeData.entityType] : [],
        entityTypeOther: safeData.entityTypeOther || '',

        // Operations
        operationHistory: safeData.operationHistory || '',

        // Project Interest
        projectInterest: safeData.projectInterest || '',
        projectInterestOther: safeData.projectInterestOther || '',

        // Dates
        constructionStartDate: safeData.constructionStartDate || '',
        constructionProjectedEndDate: safeData.constructionProjectedEndDate || '',

        // Work already started
        workAlreadyStarted: toBool(safeData.workAlreadyStarted),
        priorCoverageInPlace: toBool(safeData.priorCoverageInPlace),
        workStartedExplanation: safeData.workStartedExplanation || '',
        percentageWorkCompleted: safeData.percentageWorkCompleted ? `${safeData.percentageWorkCompleted}` : '',

        // Requested Coverages
        coverages: safeData.coverages || {},

        // Receipts & Payroll
        projectedRevenue: safeData.projectedRevenue || '',
        projectedPayroll: safeData.projectedPayroll || '',
        last12Revenue: safeData.last12Revenue || '',
        last12Payroll: safeData.last12Payroll || '',
        prior2YearRevenue: safeData.prior2YearRevenue || '',
        prior2YearPayroll: safeData.prior2YearPayroll || '',

        // Contractor
        contractorName: safeData.contractorName || '',
        contractorExperienceYears: safeData.contractorExperienceYears ? `${safeData.contractorExperienceYears}` : '',

        // Section II: Property Details
        isRenovated: toBool(safeData.isRenovated),
        isGroundUp: toBool(safeData.isGroundUp),
        groundUpExplanation: safeData.groundUpExplanation || '',
        totalInsurableValue: safeData.totalInsurableValue || '',
        workDescription: safeData.workDescription || '',
        intendedOccupancy: safeData.intendedOccupancy || '',
        constructionMaterials: Array.isArray(safeData.constructionMaterials) ? safeData.constructionMaterials : [],
        constructionMaterialOther: safeData.constructionMaterialOther || '',
        numberOfStories: safeData.numberOfStories ? `${safeData.numberOfStories}` : '',
        involvesCranes: toBool(safeData.involvesCranes),
        roofingMaterials: safeData.roofingMaterials || '',
        protectionClass: safeData.protectionClass || '',
        occupiedPriorToCompletion: toBool(safeData.occupiedPriorToCompletion),
        occupiedByWhom: safeData.occupiedByWhom || '',
        occupancyDetails: safeData.occupancyDetails || '',

        // Site Security
        siteFenced: toBool(safeData.siteFenced),
        siteLighted: toBool(safeData.siteLighted),
        siteLocked: toBool(safeData.siteLocked),
        siteGuards: toBool(safeData.siteGuards),
        siteOtherSecurity: safeData.siteOtherSecurity || '',
        siteOtherSecurityActive: toBool(safeData.siteOtherSecurityActive),

        // Section III: Renovation
        demoExistingStructure: toBool(safeData.demoExistingStructure),
        structuralAlterations: toBool(safeData.structuralAlterations),
        existingDamage: toBool(safeData.existingDamage),
        existingDamageClarification: safeData.existingDamageClarification || '',
        coverageExistingStructure: toBool(safeData.coverageExistingStructure),
        structureCoveredOtherPolicy: toBool(safeData.structureCoveredOtherPolicy),
        existingStructureValue: safeData.existingStructureValue || '',
        buildingMaterialsValue: safeData.buildingMaterialsValue || '',
        insurableValueTotal: safeData.insurableValueTotal || '',
        yearBuilt: safeData.yearBuilt ? `${safeData.yearBuilt}` : '',
        originalSquareFootage: safeData.originalSquareFootage ? `${safeData.originalSquareFootage}` : '',
        additionSquareFootage: safeData.additionSquareFootage ? `${safeData.additionSquareFootage}` : '',
        previousOccupancy: safeData.previousOccupancy || '',
        fireSafetySystems: Array.isArray(safeData.fireSafetySystems) ? safeData.fireSafetySystems : [],
        fireSafetyOther: safeData.fireSafetyOther || '',
        fireSystemsWorkingOrder: toBool(safeData.fireSystemsWorkingOrder),
        fireSystemsMaintained: toBool(safeData.fireSystemsMaintained),
        fireSystemsExplanation: safeData.fireSystemsExplanation || '',
        electricalServiceMaintained: toBool(safeData.electricalServiceMaintained),
        electricalLastUpdated: safeData.electricalLastUpdated || '',
        heatingServiceMaintained: toBool(safeData.heatingServiceMaintained),
        heatingLastUpdated: safeData.heatingLastUpdated || '',
        waterServiceShutOff: toBool(safeData.waterServiceShutOff),
        plumbingLastUpdated: safeData.plumbingLastUpdated || '',
        burglarAlarmInPlace: toBool(safeData.burglarAlarmInPlace),
        burglarAlarmMaintained: toBool(safeData.burglarAlarmMaintained),

        // Section IV: Claims
        unreportedIncidents: toBool(safeData.unreportedIncidents),
        unreportedIncidentsExplanation: safeData.unreportedIncidentsExplanation || '',
        canceledNonRenewed: toBool(safeData.canceledNonRenewed),
        canceledExplanation: safeData.canceledExplanation || '',
        claimsList: Array.isArray(safeData.claimsList) ? safeData.claimsList : []
    };
}
