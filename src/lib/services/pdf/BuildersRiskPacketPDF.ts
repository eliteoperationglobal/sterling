/**
 * Builders Risk Supplemental Application PDF HTML Generator
 * Matches all questions (1 to 38) across all sections of the BUILDERS RISK - SUPPLEMENTAL APPLICATION
 */

export function generateBuildersRiskPacketHTML(data: any): string {
  const payload = data?.payload || data || {};

  // Section 1: General Information
  const namedInsured = payload.namedInsured || payload.companyName || '';
  const brokerage = payload.brokerage || payload.broker || '';
  const isNewVenture = payload.isNewVenture;
  const isRenewal = payload.isRenewal;
  const policyNumber = payload.policyNumber || '';
  const currentEffectiveDate = payload.currentEffectiveDate || '';
  const currentExpiryDate = payload.currentExpiryDate || '';
  const requestedEffectiveDate = payload.requestedEffectiveDate || payload.effectiveDate || '';
  const requestedExpiryDate = payload.requestedExpiryDate || '';
  const website = payload.website || '';

  // 2) Current Carrier Info
  const carrier = payload.carrier || '';
  const limitOfInsurance = payload.limitOfInsurance || '';
  const effectiveDate = payload.effectiveDate || '';
  const expiryDate = payload.expiryDate || '';
  const deductible = payload.deductible || '';
  const premium = payload.premium || '';
  const offeringRenewal = payload.offeringRenewal;

  // 3) Mailing Address
  const mailingAddress = payload.mailingAddress || payload.streetAddress || '';
  const mailingCity = payload.mailingCity || payload.city || '';
  const mailingState = payload.mailingState || payload.state || '';
  const mailingZip = payload.mailingZip || payload.zip || '';

  // 4) Property Address
  const propertyAddress = payload.sameAsMailing ? mailingAddress : (payload.propertyAddress || '');
  const propertyCity = payload.sameAsMailing ? mailingCity : (payload.propertyCity || '');
  const propertyState = payload.sameAsMailing ? mailingState : (payload.propertyState || '');
  const propertyZip = payload.sameAsMailing ? mailingZip : (payload.propertyZip || '');

  // 5) Entity Type
  const entityType: string[] = Array.isArray(payload.entityType) ? payload.entityType : payload.entityType ? [payload.entityType] : [];
  const entityTypeOther = payload.entityTypeOther || '';

  // 6) Operation history
  const operationHistory = payload.operationHistory || '';

  // 7) Project Interest
  const projectInterest = payload.projectInterest || '';
  const projectInterestOther = payload.projectInterestOther || '';

  // 8 & 9) Dates
  const constructionStartDate = payload.constructionStartDate || '';
  const constructionProjectedEndDate = payload.constructionProjectedEndDate || '';

  // 10) Prior work started
  const workAlreadyStarted = payload.workAlreadyStarted;
  const priorCoverageInPlace = payload.priorCoverageInPlace;
  const workStartedExplanation = payload.workStartedExplanation || '';
  const percentageWorkCompleted = payload.percentageWorkCompleted || '';

  // 11) Coverages requested
  const coverages = payload.coverages || {};

  // 12) Receipts & Payroll
  const projectedRevenue = payload.projectedRevenue || '';
  const projectedPayroll = payload.projectedPayroll || '';
  const last12Revenue = payload.last12Revenue || '';
  const last12Payroll = payload.last12Payroll || '';
  const prior2YearRevenue = payload.prior2YearRevenue || '';
  const prior2YearPayroll = payload.prior2YearPayroll || '';

  // 13) Contractor
  const contractorName = payload.contractorName || '';
  const contractorExperienceYears = payload.contractorExperienceYears || '';

  // Section II: Property Details
  // 14) Renovation / Ground-up
  const isRenovated = payload.isRenovated;
  const isGroundUp = payload.isGroundUp;
  const groundUpExplanation = payload.groundUpExplanation || '';
  const totalInsurableValue = payload.totalInsurableValue || '';

  // 15) Work description
  const workDescription = payload.workDescription || '';

  // 16) Intended occupancy
  const intendedOccupancy = payload.intendedOccupancy || '';

  // 17) Construction material
  const constructionMaterials: string[] = Array.isArray(payload.constructionMaterials) ? payload.constructionMaterials : [];
  const constructionMaterialOther = payload.constructionMaterialOther || '';

  // 18) Stories & Cranes
  const numberOfStories = payload.numberOfStories || '';
  const involvesCranes = payload.involvesCranes;

  // 19) Roofing
  const roofingMaterials = payload.roofingMaterials || '';

  // 20) Protection class
  const protectionClass = payload.protectionClass || '';

  // 21) Structure occupied prior to completion
  const occupiedPriorToCompletion = payload.occupiedPriorToCompletion;
  const occupiedByWhom = payload.occupiedByWhom || '';
  const occupancyDetails = payload.occupancyDetails || '';

  // 22) Site Security
  const siteFenced = payload.siteFenced;
  const siteLighted = payload.siteLighted;
  const siteLocked = payload.siteLocked;
  const siteGuards = payload.siteGuards;
  const siteOtherSecurity = payload.siteOtherSecurity || '';
  const siteOtherSecurityActive = payload.siteOtherSecurityActive;

  // Section III: Renovation (Questions 23 - 35)
  const demoExistingStructure = payload.demoExistingStructure;
  const structuralAlterations = payload.structuralAlterations;
  const existingDamage = payload.existingDamage;
  const existingDamageClarification = payload.existingDamageClarification || '';
  const coverageExistingStructure = payload.coverageExistingStructure;
  const structureCoveredOtherPolicy = payload.structureCoveredOtherPolicy;
  const existingStructureValue = payload.existingStructureValue || '';
  const buildingMaterialsValue = payload.buildingMaterialsValue || '';
  const insurableValueTotal = payload.insurableValueTotal || '';
  const yearBuilt = payload.yearBuilt || '';
  const originalSquareFootage = payload.originalSquareFootage || '';
  const additionSquareFootage = payload.additionSquareFootage || '';
  const previousOccupancy = payload.previousOccupancy || '';
  const fireSafetySystems: string[] = Array.isArray(payload.fireSafetySystems) ? payload.fireSafetySystems : [];
  const fireSafetyOther = payload.fireSafetyOther || '';
  const fireSystemsWorkingOrder = payload.fireSystemsWorkingOrder;
  const fireSystemsMaintained = payload.fireSystemsMaintained;
  const fireSystemsExplanation = payload.fireSystemsExplanation || '';
  const electricalServiceMaintained = payload.electricalServiceMaintained;
  const electricalLastUpdated = payload.electricalLastUpdated || '';
  const heatingServiceMaintained = payload.heatingServiceMaintained;
  const heatingLastUpdated = payload.heatingLastUpdated || '';
  const waterServiceShutOff = payload.waterServiceShutOff;
  const plumbingLastUpdated = payload.plumbingLastUpdated || '';
  const burglarAlarmInPlace = payload.burglarAlarmInPlace;
  const burglarAlarmMaintained = payload.burglarAlarmMaintained;

  // Section IV: Claims History (Questions 36 - 38)
  const unreportedIncidents = payload.unreportedIncidents;
  const unreportedIncidentsExplanation = payload.unreportedIncidentsExplanation || '';
  const canceledNonRenewed = payload.canceledNonRenewed;
  const canceledExplanation = payload.canceledExplanation || '';
  const claimsList: any[] = Array.isArray(payload.claimsList) ? payload.claimsList : [];

  const renderCheck = (checked: boolean) => (checked ? '&#9632;' : '&#9633;');
  const renderYesNo = (val: boolean | null | undefined) => {
    return `Yes ${renderCheck(val === true)} &nbsp;&nbsp; No ${renderCheck(val === false)}`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Builders Risk - Supplemental Application</title>
  <style>
    @page {
      size: letter portrait;
      margin: 10mm 12mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      line-height: 1.3;
      font-size: 9pt;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header-title {
      text-align: center;
      font-weight: 900;
      font-size: 12.5pt;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .header-subtitle {
      text-align: center;
      font-weight: 700;
      font-size: 8pt;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .header-instruction {
      text-align: center;
      font-weight: 700;
      font-size: 7.5pt;
      margin-bottom: 8px;
      text-transform: uppercase;
    }
    .section-banner {
      background-color: #0b396b;
      color: #ffffff;
      font-weight: 800;
      font-size: 9pt;
      padding: 3px 8px;
      margin-top: 10px;
      margin-bottom: 6px;
      text-transform: uppercase;
    }
    .form-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .form-table td, .form-table th {
      border: 1px solid #333;
      padding: 2.5px 5px;
      font-size: 8.5pt;
      vertical-align: middle;
    }
    .field-row {
      margin-bottom: 4px;
      display: flex;
      align-items: baseline;
    }
    .field-label {
      font-weight: 600;
      margin-right: 6px;
    }
    .field-val {
      border-bottom: 1px solid #444;
      padding: 1px 4px;
      min-height: 12px;
      display: inline-block;
      flex-grow: 1;
    }
    .textarea-box {
      border: 1px solid #444;
      min-height: 28px;
      padding: 3px 5px;
      margin-top: 2px;
      margin-bottom: 4px;
      background-color: #fafafa;
      font-size: 8.5pt;
      white-space: pre-wrap;
    }
    .checkbox-group {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 2px;
      margin-bottom: 4px;
    }
    .page-break {
      page-break-before: always;
      padding-top: 10px;
    }
  </style>
</head>
<body>

  <div class="header-title">BUILDERS RISK - SUPPLEMENTAL APPLICATION</div>
  <div class="header-subtitle">ATTACH ADDITIONAL SHEETS AS NECESSARY.</div>
  <div class="header-instruction">ANSWER ALL QUESTIONS. If not applicable, indicate N/A.</div>

  <div class="section-banner">I. GENERAL INFORMATION</div>

  <!-- 1) Basic Info Table -->
  <table class="form-table">
    <tr>
      <td colspan="2"><span class="field-label">Named Insured:</span> ${namedInsured}</td>
    </tr>
    <tr>
      <td><span class="field-label">Brokerage/Broker:</span> ${brokerage}</td>
      <td><span class="field-label">New Venture?</span> ${renderYesNo(isNewVenture)}</td>
    </tr>
    <tr>
      <td><span class="field-label">Renewal?</span> ${renderYesNo(isRenewal)}</td>
      <td><span class="field-label">Policy Number:</span> ${policyNumber}</td>
    </tr>
    <tr>
      <td><span class="field-label">Current Effective Date:</span> ${currentEffectiveDate}</td>
      <td><span class="field-label">Current Expiry Date:</span> ${currentExpiryDate}</td>
    </tr>
    <tr>
      <td><span class="field-label">Requested Effective Date:</span> ${requestedEffectiveDate}</td>
      <td><span class="field-label">Requested Expiry Date:</span> ${requestedExpiryDate}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Website:</span> ${website}</td>
    </tr>
  </table>

  <!-- 2) Current Carrier Info -->
  <div style="font-weight: 700; margin: 3px 0;">2) Current Carrier Information:</div>
  <table class="form-table">
    <tr>
      <td colspan="2"><span class="field-label">Carrier:</span> ${carrier}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Limit of Insurance:</span> ${limitOfInsurance}</td>
    </tr>
    <tr>
      <td><span class="field-label">Effective Date:</span> ${effectiveDate}</td>
      <td><span class="field-label">Expiry Date:</span> ${expiryDate}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Deductible:</span> ${deductible}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Premium:</span> ${premium}</td>
    </tr>
    <tr>
      <td colspan="2"><span class="field-label">Offering renewal?</span> ${renderYesNo(offeringRenewal)}</td>
    </tr>
  </table>

  <!-- 3 & 4) Addresses -->
  <table class="form-table" style="margin-top: 4px;">
    <tr>
      <td colspan="4"><span class="field-label">3) Mailing Address:</span> ${mailingAddress}</td>
    </tr>
    <tr>
      <td style="width: 40%;"><span class="field-label">City:</span> ${mailingCity}</td>
      <td style="width: 30%;"><span class="field-label">State:</span> ${mailingState}</td>
      <td colspan="2" style="width: 30%;"><span class="field-label">Zip Code:</span> ${mailingZip}</td>
    </tr>
    <tr>
      <td colspan="4"><span class="field-label">4) Property Address:</span> ${propertyAddress}</td>
    </tr>
    <tr>
      <td><span class="field-label">City:</span> ${propertyCity}</td>
      <td><span class="field-label">State:</span> ${propertyState}</td>
      <td colspan="2"><span class="field-label">Zip Code:</span> ${propertyZip}</td>
    </tr>
  </table>

  <!-- 5) Entity Type -->
  <div style="margin-top: 4px;">
    <span class="field-label">5) Are you a(n):</span>
    <div class="checkbox-group">
      <span>${renderCheck(entityType.includes('Corporation'))} Corporation</span>
      <span>${renderCheck(entityType.includes('Individual'))} Individual</span>
      <span>${renderCheck(entityType.includes('Partnership'))} Partnership</span>
      <span>${renderCheck(entityType.includes('Municipality'))} Municipality</span>
      <span>${renderCheck(entityType.includes('For Profit'))} For Profit</span>
      <span>${renderCheck(entityType.includes('Joint Venture'))} Joint Venture</span>
      <span>${renderCheck(entityType.includes('Other'))} Other: <u>${entityTypeOther || '_______'}</u></span>
    </div>
  </div>

  <!-- 6) Operation history -->
  <div style="margin-top: 4px;">
    <span class="field-label">6) How long have you been in operation under this business name or any others?</span>
    <div class="textarea-box">${operationHistory || 'N/A'}</div>
  </div>

  <!-- 7) Project Interest -->
  <div style="margin-top: 4px;">
    <span class="field-label">7) What is your interest in this project?</span>
    <div class="checkbox-group">
      <span>${renderCheck(projectInterest === 'Owner')} Owner</span>
      <span>${renderCheck(projectInterest === 'Contractor')} Contractor</span>
      <span>${renderCheck(projectInterest === 'Owner and Contractor')} Owner and Contractor</span>
      <span>${renderCheck(projectInterest === 'Other')} Other: <u>${projectInterestOther || '_______'}</u></span>
    </div>
  </div>

  <!-- 8 & 9) Dates -->
  <table class="form-table" style="margin-top: 4px;">
    <tr>
      <td style="width: 50%;"><span class="field-label">8) Construction Start Date:</span> ${constructionStartDate}</td>
      <td style="width: 50%;"><span class="field-label">9) Construction Projected End Date:</span> ${constructionProjectedEndDate}</td>
    </tr>
  </table>

  <div class="page-break"></div>

  <!-- 10) Prior work started -->
  <div style="margin-top: 6px;">
    <div class="field-row">
      <span class="field-label">10) Has any construction work already started?</span>
      <span>${renderYesNo(workAlreadyStarted)}</span>
    </div>
    <div style="margin-left: 15px;">
      <div class="field-row">
        <span>a. If yes, has prior coverage been in place?</span>
        <span style="margin-left: 10px;">${renderYesNo(priorCoverageInPlace)}</span>
      </div>
      <div style="margin-top: 2px;">
        <span>b. If yes to 10) and no to a., please attach an explanation:</span>
        <div class="textarea-box">${workStartedExplanation || 'N/A'}</div>
      </div>
      <div class="field-row" style="margin-top: 2px;">
        <span>c. What percentage of work is completed?</span>
        <span style="margin-left: 6px; font-weight: bold;">${percentageWorkCompleted ? percentageWorkCompleted + '%' : 'N/A'}</span>
      </div>
    </div>
  </div>

  <!-- 11) Requested Coverages -->
  <div style="margin-top: 6px;">
    <span class="field-label">11) What coverage(s) are you requesting? Check and provide requested limits for all that apply:</span>
    <table class="form-table" style="margin-top: 3px;">
      <tr>
        <td style="width: 50%;">${renderCheck(!!coverages.businessIncome)} Business Income w/Extra Expense: <b>${coverages.businessIncomeLimit || 'N/A'}</b></td>
        <td style="width: 50%;">${renderCheck(!!coverages.mechanicalBreakdown)} Mechanical Breakdown & Testing: <b>${coverages.mechanicalBreakdownLimit || 'N/A'}</b></td>
      </tr>
      <tr>
        <td>${renderCheck(!!coverages.propertyInTransit)} Property in Transit: <b>${coverages.propertyInTransitLimit || 'N/A'}</b></td>
        <td>${renderCheck(!!coverages.propertyInStorage)} Property in Storage: <b>${coverages.propertyInStorageLimit || 'N/A'}</b></td>
      </tr>
      <tr>
        <td>${renderCheck(!!coverages.earthMovement)} Earth Movement: <b>${coverages.earthMovementLimit || 'N/A'}</b></td>
        <td>${renderCheck(!!coverages.flood)} Flood: <b>${coverages.floodLimit || 'N/A'}</b></td>
      </tr>
      <tr>
        <td colspan="2">${renderCheck(!!coverages.other)} Other: <u>${coverages.otherName || '_______'}</u> Limit: <b>${coverages.otherLimit || 'N/A'}</b></td>
      </tr>
    </table>
  </div>

  <!-- 12) Receipts & Payroll -->
  <div style="margin-top: 6px;">
    <span class="field-label">12) Please complete the following table for your receipts and payroll:</span>
    <table class="form-table" style="margin-top: 3px; text-align: center;">
      <tr style="background-color: #f2f2f2; font-weight: bold;">
        <th style="width: 34%; text-align: left;">Period</th>
        <th style="width: 33%;">Revenue</th>
        <th style="width: 33%;">Payroll</th>
      </tr>
      <tr>
        <td style="text-align: left; font-weight: bold;">Projected Year</td>
        <td>${projectedRevenue || '-'}</td>
        <td>${projectedPayroll || '-'}</td>
      </tr>
      <tr>
        <td style="text-align: left; font-weight: bold;">Last 12 Months</td>
        <td>${last12Revenue || '-'}</td>
        <td>${last12Payroll || '-'}</td>
      </tr>
      <tr>
        <td style="text-align: left; font-weight: bold;">2nd Prior Year</td>
        <td>${prior2YearRevenue || '-'}</td>
        <td>${prior2YearPayroll || '-'}</td>
      </tr>
    </table>
  </div>

  <!-- 13) Contractor -->
  <div style="margin-top: 6px;">
    <div class="field-row">
      <span class="field-label">13) If you are not the contractor or owner/contractor, please list the contractor:</span>
      <span class="field-val">${contractorName || 'N/A'}</span>
    </div>
    <div class="field-row" style="margin-left: 15px; margin-top: 2px;">
      <span>a. How many years of experience does this contractor have?</span>
      <span style="margin-left: 6px; font-weight: bold;">${contractorExperienceYears || 'N/A'}</span>
    </div>
  </div>

  <!-- SECTION II: PROPERTY DETAILS -->
  <div class="section-banner">II. PROPERTY DETAILS</div>

  <!-- 14) Renovation & Ground up -->
  <div>
    <div class="field-row">
      <span class="field-label">14) Is the property being renovated?</span>
      <span>${renderYesNo(isRenovated)}</span>
    </div>
    <div style="margin-left: 15px;">
      <div class="field-row">
        <span>a. If no, is the building work being performed ground up?</span>
        <span style="margin-left: 10px;">${renderYesNo(isGroundUp)}</span>
      </div>
      <div class="field-row">
        <span>b. If no to 14) and a., please explain:</span>
        <span class="field-val">${groundUpExplanation || 'N/A'}</span>
      </div>
      <div class="field-row">
        <span>c. If yes to a., what is the total insurable value of building materials (assume 100% coinsurance)?</span>
        <span style="margin-left: 6px; font-weight: bold;">${totalInsurableValue || 'N/A'}</span>
      </div>
    </div>
  </div>

  <!-- 15) Work Performed -->
  <div style="margin-top: 6px;">
    <span class="field-label">15) Briefly describe the work being performed:</span>
    <div class="textarea-box">${workDescription || 'N/A'}</div>
  </div>

  <!-- 16) Intended Occupancy -->
  <div style="margin-top: 6px;">
    <span class="field-label">16) What is the intended occupancy after work is completed?</span>
    <div class="textarea-box">${intendedOccupancy || 'N/A'}</div>
  </div>

  <!-- 17) Construction Materials -->
  <div style="margin-top: 6px;">
    <span class="field-label">17) What is the building construction material?</span>
    <div class="checkbox-group">
      <span>${renderCheck(constructionMaterials.includes('Frame'))} Frame</span>
      <span>${renderCheck(constructionMaterials.includes('Joisted Masonry'))} Joisted Masonry</span>
      <span>${renderCheck(constructionMaterials.includes('Non-Combustible'))} Non-Combustible</span>
      <span>${renderCheck(constructionMaterials.includes('Masonry Non-Combustible'))} Masonry Non-Combustible</span>
      <span>${renderCheck(constructionMaterials.includes('Fire-Resistive'))} Fire-Resistive</span>
      <span>${renderCheck(constructionMaterials.includes('Other'))} Other: <u>${constructionMaterialOther || '_______'}</u></span>
    </div>
  </div>

  <!-- 18, 19, 20) Structure characteristics -->
  <table class="form-table" style="margin-top: 6px;">
    <tr>
      <td><span class="field-label">18) Number of stories:</span> ${numberOfStories || 'N/A'}</td>
      <td><span class="field-label">a. Tandem crane lifts or tower cranes?</span> ${renderYesNo(involvesCranes)}</td>
    </tr>
    <tr>
      <td><span class="field-label">19) Roofing materials:</span> ${roofingMaterials || 'N/A'}</td>
      <td><span class="field-label">20) Protection class:</span> ${protectionClass || 'N/A'}</td>
    </tr>
  </table>

  <!-- 21) Structure occupied prior to completion -->
  <div style="margin-top: 6px;">
    <div class="field-row">
      <span class="field-label">21) Will any portion of the structure be occupied prior to completion of the project?</span>
      <span>${renderYesNo(occupiedPriorToCompletion)}</span>
    </div>
    <div style="margin-left: 15px;">
      <div class="field-row">
        <span>a. If yes, by whom?</span>
        <span class="field-val">${occupiedByWhom || 'N/A'}</span>
      </div>
      <div style="margin-top: 2px;">
        <span>b. Details about occupancy & restricted access:</span>
        <div class="textarea-box">${occupancyDetails || 'N/A'}</div>
      </div>
    </div>
  </div>

  <!-- 22) Site Security -->
  <div style="margin-top: 6px;">
    <div class="field-label">22) Is the project site:</div>
    <table class="form-table" style="margin-top: 3px;">
      <tr>
        <td style="width: 50%;">a. Fenced? ${renderYesNo(siteFenced)}</td>
        <td style="width: 50%;">b. Lighted? ${renderYesNo(siteLighted)}</td>
      </tr>
      <tr>
        <td>c. Locked? ${renderYesNo(siteLocked)}</td>
        <td>d. Security guards or night watchmen? ${renderYesNo(siteGuards)}</td>
      </tr>
      <tr>
        <td colspan="2">e. Other security: <u>${siteOtherSecurity || '_______'}</u> &nbsp; ${renderYesNo(siteOtherSecurityActive)}</td>
      </tr>
    </table>
  </div>

  <div class="page-break"></div>

  <!-- SECTION III: RENOVATION -->
  <div class="section-banner">III. RENOVATION (complete only if the property is being renovated)</div>

  <table class="form-table">
    <tr>
      <td colspan="2">23) Does the project include any demolition of existing structure(s)? ${renderYesNo(demoExistingStructure)}</td>
    </tr>
    <tr>
      <td colspan="2">24) Does the project include any structural, frame, or foundation alterations? ${renderYesNo(structuralAlterations)}</td>
    </tr>
    <tr>
      <td colspan="2">
        25) Does the building have any existing damage? ${renderYesNo(existingDamage)}
        ${existingDamage ? `<div style="margin-top: 4px;"><b>a. If yes, please clarify:</b><div class="textarea-box">${existingDamageClarification || 'N/A'}</div></div>` : ''}
      </td>
    </tr>
    <tr>
      <td colspan="2">
        26) Are you seeking coverage for the existing structure? ${renderYesNo(coverageExistingStructure)}
        <div style="margin-left: 15px; margin-top: 3px;">
          <div>a. If no, is structure covered under another property insurance policy? ${renderYesNo(structureCoveredOtherPolicy)}</div>
          <div style="margin-top: 3px;">b. Total insurable value (completed value and 100% coinsurance):</div>
          <div style="margin-left: 15px;">
            <div>+ Existing Structure: <b>${existingStructureValue || '$0.00'}</b></div>
            <div>+ Building Materials: <b>${buildingMaterialsValue || '$0.00'}</b></div>
            <div>+ TOTAL: <b>${insurableValueTotal || '$0.00'}</b></div>
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td>27) What year was existing structure built? <b>${yearBuilt || 'N/A'}</b></td>
      <td>28) Square footage of original building: <b>${originalSquareFootage || 'N/A'}</b></td>
    </tr>
    <tr>
      <td>29) If addition, new square footage: <b>${additionSquareFootage || 'N/A'}</b></td>
      <td>30) Previous occupancy of structure(s): <b>${previousOccupancy || 'N/A'}</b></td>
    </tr>
    <tr>
      <td colspan="2">
        31) Current fire safety systems installed in the structure:
        <div class="checkbox-group" style="margin: 3px 0;">
          <span>${renderCheck(fireSafetySystems.includes('Central Alarms'))} Central Alarms</span>
          <span>${renderCheck(fireSafetySystems.includes('Local Alarms'))} Local Alarms</span>
          <span>${renderCheck(fireSafetySystems.includes('Automatic Sprinklers'))} Automatic Sprinklers</span>
          <span>${renderCheck(fireSafetySystems.includes('Automatic Suppressants'))} Automatic Suppressants</span>
          <span>${renderCheck(fireSafetySystems.includes('Manual Extinguishers'))} Manual Extinguishers</span>
          <span>${renderCheck(fireSafetySystems.includes('Other'))} Other: <u>${fireSafetyOther || '_______'}</u></span>
        </div>
        <div style="margin-left: 15px;">
          <div>a. Are all of above checked in working order? ${renderYesNo(fireSystemsWorkingOrder)}</div>
          <div>b. Maintained and operable for duration of construction? ${renderYesNo(fireSystemsMaintained)}</div>
          ${(fireSystemsWorkingOrder === false || fireSystemsMaintained === false) ? `<div>c. Explanation & fire prevention measures:<div class="textarea-box">${fireSystemsExplanation || 'N/A'}</div></div>` : ''}
        </div>
      </td>
    </tr>
    <tr>
      <td>
        32) Will electrical service be maintained? ${renderYesNo(electricalServiceMaintained)}<br/>
        <span style="font-size: 8pt;">a. Electrical last updated: <b>${electricalLastUpdated || 'N/A'}</b></span>
      </td>
      <td>
        33) Will heating service (gas, oil, etc.) be maintained? ${renderYesNo(heatingServiceMaintained)}<br/>
        <span style="font-size: 8pt;">a. Heating/HVAC last updated: <b>${heatingLastUpdated || 'N/A'}</b></span>
      </td>
    </tr>
    <tr>
      <td>
        34) Will water service be shut off & pipes drained/winterized? ${renderYesNo(waterServiceShutOff)}<br/>
        <span style="font-size: 8pt;">a. Plumbing last updated: <b>${plumbingLastUpdated || 'N/A'}</b></span>
      </td>
      <td>
        35) Burglar or intrusion alarm in place? ${renderYesNo(burglarAlarmInPlace)}<br/>
        <span style="font-size: 8pt;">a. Maintained during construction? ${renderYesNo(burglarAlarmMaintained)}</span>
      </td>
    </tr>
  </table>

  <!-- SECTION IV: CLAIMS HISTORY -->
  <div class="section-banner">IV. CLAIMS HISTORY</div>

  <table class="form-table">
    <tr>
      <td>
        36) Do you know of any incidents not currently reported that may result in a claim against you? ${renderYesNo(unreportedIncidents)}
        ${unreportedIncidents ? `<div style="margin-top: 3px;"><b>Explanation:</b><div class="textarea-box">${unreportedIncidentsExplanation || 'N/A'}</div></div>` : ''}
      </td>
    </tr>
    <tr>
      <td>
        37) During past 5 years, has any insurer canceled or non-renewed similar insurance, or canceled for nonpayment? ${renderYesNo(canceledNonRenewed)}
        ${canceledNonRenewed ? `<div style="margin-top: 3px;"><b>Explanation:</b><div class="textarea-box">${canceledExplanation || 'N/A'}</div></div>` : ''}
      </td>
    </tr>
  </table>

  <!-- 38) Claim Details -->
  <div style="font-weight: 700; margin: 4px 0;">38) Claim Details:</div>
  ${claimsList.length === 0 ? '<div style="font-style: italic; color: #666; font-size: 8.5pt; margin-bottom: 8px;">No prior claims reported.</div>' : ''}
  ${claimsList.map((claim, idx) => `
    <div style="border: 1px solid #777; padding: 6px; margin-bottom: 8px; background-color: #fafafa;">
      <div style="font-weight: bold; margin-bottom: 4px;">Claim #${idx + 1}</div>
      <table class="form-table">
        <tr>
          <td><b>a. Date of incident:</b> ${claim.incidentDate || 'N/A'}</td>
          <td><b>h. Total claimed:</b> ${claim.totalClaimed || '$0.00'}</td>
        </tr>
        <tr>
          <td colspan="2">
            <b>b. Line(s) of coverage reported on:</b><br/>
            ${claim.linesCovered ? claim.linesCovered.join(', ') : 'N/A'}
          </td>
        </tr>
        <tr>
          <td colspan="2">
            <b>c. Circumstances & details of incident:</b>
            <div class="textarea-box">${claim.circumstances || 'N/A'}</div>
          </td>
        </tr>
        <tr>
          <td><b>d. Closed with trial/arbitration?</b> ${renderYesNo(claim.closedWithTrial)}</td>
          <td><b>e. Open & anticipate trial/arbitration?</b> ${renderYesNo(claim.openAnticipateTrial)} ${claim.trialDate ? `(When: ${claim.trialDate})` : ''}</td>
        </tr>
        <tr>
          <td><b>f. Procedures/rules changed?</b> ${renderYesNo(claim.proceduresChanged)}</td>
          <td><b>g. Total loss/full insured value claimed?</b> ${renderYesNo(claim.totalLoss)} ${claim.percentLost ? `(${claim.percentLost}% lost)` : ''}</td>
        </tr>
      </table>
    </div>
  `).join('')}

</body>
</html>`;
}