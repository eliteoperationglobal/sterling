/**
 * Application PDF Generator
 * Generates a comprehensive PDF application to send to carriers
 */

interface ApplicationData {
  // Company Information
  companyName: string;
  dba?: string;
  firstName: string;
  lastName: string;
  entityType: string;
  companyFEIN: string;
  phone: string;
  fax?: string;
  email: string;
  website?: string;
  
  // Address
  streetAddress: string;
  aptSuite?: string;
  city: string;
  state: string;
  zipCode: string;
  
  // Mailing Address
  mailingAddressSameAsPhysical: boolean;
  mailingStreetAddress?: string;
  mailingAptSuite?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingZipCode?: string;
  
  // Indication Information
  leadSource?: string;
  estimatedGrossReceipts: string;
  estimatedSubcontractingCosts: string;
  estimatedMaterialCosts: string;
  activeOwnersInField: number;
  fieldEmployees: number;
  yearsInBusiness: number;
  yearsExperienceInTrades: number;
  totalPayrollAmount: string;
  
  // Class Codes (can be array or object)
  classCodes?: Array<{
    code: string;
    description: string;
    percentage: number;
  }>;
  classCodeWork?: Record<string, number>; // Alternative format: { "code": percentage }
  
  // Work Distribution
  newConstructionPercent: number;
  remodelPercent: number;
  residentialPercent: number;
  commercialPercent: number;
  
  // Limits & Coverage
  generalLiabilityLimit: string;
  fireLegalLimit: string;
  medicalExpenseLimit: string;
  deductible: string;
  lossesInLast5Years: number;
  effectiveDate: string;
  statesOfOperation?: string[] | string; // Can be array or string
  performStructuralWork: boolean;
  
  // Endorsements
  blanketAdditionalInsured: boolean;
  blanketWaiverOfSubrogation: boolean;
  blanketPrimaryWording: boolean;
  blanketPerProjectAggregate: boolean;
  blanketCompletedOpsAggregate: boolean;
  actsOfTerrorism: boolean;
  noticeOfCancellationToThirdParties: boolean;
  
  // Payment
  brokerFee: string;
  displayBrokerFee: boolean;
  paymentOption: string;
  
  // License
  hasContractorsLicense: boolean;
  
  // Carrier Description
  carrierDescriptionAccurate: boolean;
  carrierApprovedDescription: string;
  
  // Resume Questions
  employeesHave3YearsExp?: boolean;
  hasConstructionSupervisionExp?: boolean;
  hasConstructionCertifications?: boolean;
  certificationsExplanation?: string;
  
  // Type of Work
  maxInteriorStories?: number;
  maxExteriorStories?: number;
  workBelowGrade?: boolean;
  buildOnHillside?: boolean;
  performRoofingOps?: boolean;
  actAsGeneralContractor?: boolean;
  performWaterproofing?: boolean;
  useHeavyEquipment?: boolean;
  workNewTractHomes?: boolean;
  workCondoConstruction?: boolean;
  performCondoStructuralRepair?: boolean;
  performOCIPWork?: boolean;
  performHazardousWork?: boolean;
  workOver5000SqFt?: boolean;
  
  // Additional Business Information
  performIndustrialOps?: boolean;
  otherBusinessNames?: string;
  citedForOSHAViolations?: boolean;
  lossInfoVerifiable?: boolean;
  licensingActionTaken?: boolean;
  allowedLicenseUseByOthers?: boolean;
  lawsuitsFiled?: boolean;
  awareOfPotentialClaims?: boolean;
  hasWrittenContracts?: boolean;
  
  // Excess Liability
  addExcessLiability?: boolean;
  
  // Metadata
  submittedDate: string;
  agencyName: string;
  programName: string;
}

export function generateApplicationHTML(data: ApplicationData): string {
  // Normalize class codes - handle both array and object formats
  let normalizedClassCodes: Array<{ code: string; description: string; percentage: number }> = [];
  
  if (data.classCodes && Array.isArray(data.classCodes)) {
    normalizedClassCodes = data.classCodes;
  } else if (data.classCodeWork && typeof data.classCodeWork === 'object') {
    // Convert object format { "code": percentage } to array format
    normalizedClassCodes = Object.entries(data.classCodeWork).map(([code, percentage]) => ({
      code,
      description: code, // Use code as description if not provided
      percentage: typeof percentage === 'number' ? percentage : parseFloat(percentage as any) || 0,
    }));
  }
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      font-size: 10px;
      line-height: 1.5;
      color: #2c3e50;
      padding: 25px;
      background: #ffffff;
    }
    
    .header {
      text-align: center;
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 4px solid #00BCD4;
    }
    
    .header h1 {
      font-size: 28px;
      color: #1a1a1a;
      margin-bottom: 8px;
      font-weight: 700;
      letter-spacing: -0.5px;
    }
    
    .header .subtitle {
      font-size: 12px;
      color: #666;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    
    .header .program-name {
      font-size: 18px;
      color: #00BCD4;
      font-weight: 600;
      margin-top: 5px;
    }
    
    .meta-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 25px;
      padding: 12px 15px;
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
      border-left: 4px solid #00BCD4;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }
    
    .meta-info div {
      font-size: 10px;
      line-height: 1.6;
    }
    
    .meta-info strong {
      color: #00BCD4;
      font-weight: 600;
      display: block;
      margin-bottom: 2px;
    }
    
    .section {
      margin-bottom: 20px;
      page-break-inside: avoid;
      background: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }
    
    .section-header {
      background: linear-gradient(135deg, #3A3C3F 0%, #2c2d30 100%);
      color: white;
      padding: 10px 15px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }
    
    .section-content {
      padding: 15px;
    }
    
    .field-group {
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #f0f0f0;
    }
    
    .field-group:last-child {
      border-bottom: none;
    }
    
    .field-label {
      font-weight: 600;
      color: #555;
      margin-bottom: 4px;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    
    .field-value {
      color: #1a1a1a;
      padding-left: 8px;
      font-size: 11px;
      font-weight: 400;
    }
    
    .two-column {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .three-column {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
    }
    
    .table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .table th {
      background: linear-gradient(135deg, #3A3C3F 0%, #2c2d30 100%);
      color: white;
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: none;
    }
    
    .table td {
      padding: 10px 12px;
      border-bottom: 1px solid #e0e0e0;
      font-size: 10px;
      background: #ffffff;
    }
    
    .table tr:last-child td {
      border-bottom: none;
      background: #f8f9fa;
      font-weight: 600;
    }
    
    .table tr:hover td {
      background: #f5f5f5;
    }
    
    .endorsements-list {
      padding-left: 20px;
      list-style: none;
    }
    
    .endorsements-list li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
      font-size: 10px;
    }
    
    .endorsements-list li:before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #00BCD4;
      font-weight: bold;
      font-size: 12px;
    }
    
    .yes-no {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 3px;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
    }
    
    .yes {
      background-color: #4CAF50;
      color: white;
    }
    
    .no {
      background-color: #f44336;
      color: white;
    }
    
    .highlight-box {
      background: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 12px;
      margin: 15px 0;
      border-radius: 3px;
    }
    
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 3px solid #e0e0e0;
      text-align: center;
      font-size: 9px;
      color: #888;
      line-height: 1.6;
    }
    
    .page-break {
      page-break-before: always;
    }
    
    @media print {
      body {
        padding: 20px;
      }
      .section {
        page-break-inside: avoid;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>STERLING WHOLESALE INSURANCE</h1>
    <div class="subtitle">Insurance Application Form</div>
    <div class="program-name">${data.programName || 'Advantage Contractor GL'}</div>
  </div>
  
  <div class="meta-info">
    <div>
      <strong>Application Date:</strong>
      <span>${data.submittedDate}</span>
    </div>
    <div>
      <strong>Submitted By:</strong>
      <span>${data.agencyName}</span>
    </div>
    <div>
      <strong>Applicant Company:</strong>
      <span>${data.companyName}</span>
    </div>
  </div>
  
  <!-- Company Information -->
  <div class="section">
    <div class="section-header">Company Information</div>
    <div class="section-content">
      <div class="two-column">
      <div class="field-group">
        <div class="field-label">Company Name:</div>
        <div class="field-value">${data.companyName}</div>
      </div>
      ${data.dba ? `
      <div class="field-group">
        <div class="field-label">DBA (Doing Business As):</div>
        <div class="field-value">${data.dba}</div>
      </div>
      ` : ''}
      <div class="field-group">
        <div class="field-label">First Name:</div>
        <div class="field-value">${data.firstName}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Last Name:</div>
        <div class="field-value">${data.lastName}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Entity Type:</div>
        <div class="field-value">${data.entityType}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Company FEIN:</div>
        <div class="field-value">${data.companyFEIN}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Phone:</div>
        <div class="field-value">${data.phone}</div>
      </div>
      ${data.fax ? `
      <div class="field-group">
        <div class="field-label">Fax:</div>
        <div class="field-value">${data.fax}</div>
      </div>
      ` : ''}
      <div class="field-group">
        <div class="field-label">Email:</div>
        <div class="field-value">${data.email}</div>
      </div>
      ${data.website ? `
      <div class="field-group">
        <div class="field-label">Website:</div>
        <div class="field-value">${data.website}</div>
      </div>
      ` : ''}
      <div class="field-group">
        <div class="field-label">Contractors License:</div>
        <div class="field-value"><span class="yes-no ${data.hasContractorsLicense ? 'yes' : 'no'}">${data.hasContractorsLicense ? 'Yes' : 'No'}</span></div>
      </div>
      </div>
    </div>
  </div>
  
  <!-- Physical Address -->
  <div class="section">
    <div class="section-header">Applicant Physical Location</div>
    <div class="section-content">
    <div class="field-group">
      <div class="field-label">Address:</div>
      <div class="field-value">${data.streetAddress}${data.aptSuite ? ', ' + data.aptSuite : ''}</div>
    </div>
    <div class="field-group">
      <div class="field-label">City, State ZIP:</div>
      <div class="field-value">${data.city}, ${data.state} ${data.zipCode}</div>
    </div>
    </div>
  </div>
  
  <!-- Mailing Address -->
  ${!data.mailingAddressSameAsPhysical ? `
  <div class="section">
    <div class="section-header">Applicant Mailing Address</div>
    <div class="section-content">
    <div class="field-group">
      <div class="field-label">Address:</div>
      <div class="field-value">${data.mailingStreetAddress}${data.mailingAptSuite ? ', ' + data.mailingAptSuite : ''}</div>
    </div>
    <div class="field-group">
      <div class="field-label">City, State ZIP:</div>
      <div class="field-value">${data.mailingCity}, ${data.mailingState} ${data.mailingZipCode}</div>
    </div>
    </div>
  </div>
  ` : ''}
  
  <!-- Indication Information -->
  <div class="section">
    <div class="section-header">Indication Information</div>
    <div class="section-content">
      <div class="two-column">
      ${data.leadSource ? `
      <div class="field-group">
        <div class="field-label">Lead Source:</div>
        <div class="field-value">${data.leadSource}</div>
      </div>
      ` : ''}
      <div class="field-group">
        <div class="field-label">Estimated Total Gross Receipts:</div>
        <div class="field-value">$${data.estimatedGrossReceipts}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Estimated Subcontracting Costs:</div>
        <div class="field-value">$${data.estimatedSubcontractingCosts}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Estimated Material Costs:</div>
        <div class="field-value">$${data.estimatedMaterialCosts}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Active Owners in Field:</div>
        <div class="field-value">${data.activeOwnersInField}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Field Employees:</div>
        <div class="field-value">${data.fieldEmployees}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Years in Business:</div>
        <div class="field-value">${data.yearsInBusiness}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Years Experience in Trades:</div>
        <div class="field-value">${data.yearsExperienceInTrades}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Total Payroll Amount:</div>
        <div class="field-value">${data.totalPayrollAmount}</div>
      </div>
      </div>
    </div>
  </div>
  
  <!-- Class Codes -->
  <div class="section">
    <div class="section-header">Class Codes</div>
    <div class="section-content">
    <table class="table">
      <thead>
        <tr>
          <th>Class Code</th>
          <th>Description</th>
          <th>% of Work</th>
        </tr>
      </thead>
      <tbody>
        ${normalizedClassCodes.length > 0 ? normalizedClassCodes.map(cc => `
        <tr>
          <td>${cc.code}</td>
          <td>${cc.description}</td>
          <td>${cc.percentage}%</td>
        </tr>
        `).join('') : '<tr><td colspan="3" style="text-align: center; color: #999;">No class codes specified</td></tr>'}
        ${normalizedClassCodes.length > 0 ? `
        <tr>
          <td colspan="2" style="text-align: right;"><strong>Total:</strong></td>
          <td><strong>${normalizedClassCodes.reduce((sum, cc) => sum + cc.percentage, 0)}%</strong></td>
        </tr>
        ` : ''}
      </tbody>
    </table>
    </div>
  </div>
  
  <!-- Work Distribution -->
  <div class="section">
    <div class="section-header">Work Distribution</div>
    <div class="section-content">
      <div class="two-column">
      <div class="field-group">
        <div class="field-label">New Construction:</div>
        <div class="field-value">${data.newConstructionPercent}%</div>
      </div>
      <div class="field-group">
        <div class="field-label">Remodel/Service/Repair:</div>
        <div class="field-value">${data.remodelPercent}%</div>
      </div>
      <div class="field-group">
        <div class="field-label">Residential Work:</div>
        <div class="field-value">${data.residentialPercent}%</div>
      </div>
      <div class="field-group">
        <div class="field-label">Commercial Work:</div>
        <div class="field-value">${data.commercialPercent}%</div>
      </div>
      </div>
    </div>
  </div>
  
  <!-- Limits & Coverage -->
  <div class="section">
    <div class="section-header">Requested Limits & Coverage</div>
    <div class="section-content">
      <div class="two-column">
      <div class="field-group">
        <div class="field-label">General Liability Limit:</div>
        <div class="field-value">${data.generalLiabilityLimit}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Fire Legal Limit:</div>
        <div class="field-value">$${data.fireLegalLimit}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Medical Expense Limit:</div>
        <div class="field-value">$${data.medicalExpenseLimit}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Deductible:</div>
        <div class="field-value">$${data.deductible}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Losses in Last 5 Years:</div>
        <div class="field-value">${data.lossesInLast5Years}</div>
      </div>
      <div class="field-group">
        <div class="field-label">Desired Effective Date:</div>
        <div class="field-value">${data.effectiveDate}</div>
      </div>
      <div class="field-group">
        <div class="field-label">States of Operation:</div>
        <div class="field-value">${
          Array.isArray(data.statesOfOperation) 
            ? data.statesOfOperation.join(', ') 
            : (typeof data.statesOfOperation === 'string' 
              ? data.statesOfOperation 
              : (data.statesOfOperation || 'Not specified'))
        }</div>
      </div>
      <div class="field-group">
        <div class="field-label">Perform Structural Work:</div>
        <div class="field-value"><span class="yes-no ${data.performStructuralWork ? 'yes' : 'no'}">${data.performStructuralWork ? 'Yes' : 'No'}</span></div>
      </div>
      </div>
    </div>
  </div>
  
  <!-- Endorsements -->
  <div class="section">
    <div class="section-header">Requested Endorsements</div>
    <div class="section-content">
    <ul class="endorsements-list">
      ${data.blanketAdditionalInsured ? '<li>✓ Blanket Additional Insured</li>' : ''}
      ${data.blanketWaiverOfSubrogation ? '<li>✓ Blanket Waiver of Subrogation</li>' : ''}
      ${data.blanketPrimaryWording ? '<li>✓ Blanket Primary Wording</li>' : ''}
      ${data.blanketPerProjectAggregate ? '<li>✓ Blanket Per Project Aggregate</li>' : ''}
      ${data.blanketCompletedOpsAggregate ? '<li>✓ Blanket Completed Operations Aggregate</li>' : ''}
      ${data.actsOfTerrorism ? '<li>✓ Acts of Terrorism</li>' : ''}
      ${data.noticeOfCancellationToThirdParties ? '<li>✓ Notice of Cancellation to Third Parties</li>' : ''}
      ${normalizedClassCodes.length === 0 && !data.blanketAdditionalInsured && !data.blanketWaiverOfSubrogation && !data.blanketPrimaryWording && !data.blanketPerProjectAggregate && !data.blanketCompletedOpsAggregate && !data.actsOfTerrorism && !data.noticeOfCancellationToThirdParties ? '<li style="color: #999; font-style: italic;">No endorsements requested</li>' : ''}
    </ul>
    </div>
  </div>
  
  <!-- Carrier Description -->
  <div class="section">
    <div class="section-header">Business Description</div>
    <div class="section-content">
    <div class="field-group">
      <div class="field-label">Carrier Approved Description:</div>
      <div class="field-value">${data.carrierApprovedDescription || 'Not provided'}</div>
    </div>
    </div>
  </div>
  
  <!-- Additional Sections can be added here for Resume Questions, Type of Work, etc. -->
  
  <div class="footer">
    <p><strong>Sterling Wholesale Insurance</strong></p>
    <p>This application was submitted electronically through the Sterling Wholesale Insurance portal.</p>
    <p>Application generated on ${data.submittedDate} | Submitted by ${data.agencyName}</p>
    <p style="margin-top: 10px; font-size: 8px; color: #aaa;">© ${new Date().getFullYear()} Sterling Wholesale Insurance. All rights reserved. This document is confidential and intended solely for the use of the carrier.</p>
  </div>
</body>
</html>
  `.trim();
}

