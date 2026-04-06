/**
 * Application Packet PDF Generator (12-Page Format)
 * Matches ISC application packet format with Capital & Co branding
 */

import QRCode from 'qrcode';

interface ApplicationPacketData {
  qrCodeDataUrl?: string; // Base64 QR code data URL
  // Application Metadata
  applicationId: string;
  submissionId: string;
  formDate: string;

  // Agency Information
  agencyName: string;
  agencyContactName: string;
  agencyAddress: string;
  agencyCity: string;
  agencyState: string;
  agencyZip: string;
  agencyPhone: string;
  agencyEmail: string;
  capitalCoLogoSVG?: string; // SVG content for Capital & Co logo

  // Applicant/Insured Information
  companyName: string;
  dba?: string;
  contactPerson: string;
  applicantAddress: string;
  applicantCity: string;
  applicantState: string;
  applicantZip: string;
  applicantPhone: string;
  applicantEmail: string;
  fein: string;
  entityType: string;
  yearsInBusiness: number;
  yearsExperienceInTrades: number;
  statesOfOperation: string;
  workIn5Boroughs: boolean;
  otherBusinessNames?: string;
  paymentOption: string;


  // Loss History
  generalLiabilityLosses?: {
    dateOfLoss: string;
    amountOfLoss: string;
  }[];

  // Quote Information
  quoteType: string;
  carrierName: string;
  coverageType: string;
  desiredCoverageDates: string;
  /** When true (approved quote), state-specific forms section is included in the packet */
  includeStateForms?: boolean;

  // General Liability Coverages
  aggregateLimit: string;
  occurrenceLimit: string;
  productsCompletedOpsLimit: string;
  personalAdvertisingInjuryLimit: string;
  fireLegalLimit: string;
  medPayLimit: string;
  selfInsuredRetention: string;

  // Class Code & Gross Receipts
  classCode: string;
  grossReceipts: string;

  // Current Exposures
  estimatedTotalGrossReceipts: string;
  estimatedSubContractingCosts: string;
  estimatedMaterialCosts: string;
  estimatedTotalPayroll: string;
  numberOfFieldEmployees: string; // Format: "Owner + X"

  // Work Performed
  workDescription: string;
  percentageResidential: number;
  percentageCommercial: number;
  percentageNewConstruction: number;
  percentageRemodel: number;
  maxInteriorStories: number;
  maxExteriorStories: number;
  maxExteriorDepthBelowGrade: number;
  performOCIPWork: boolean;
  ocipReceipts?: string;
  nonOCIPReceipts?: string;
  lossesInLast5Years: number;

  // Work Experience Questions (Yes/No with explanations)
  performHazardousWork?: boolean;
  hazardousWorkExplanation?: string;
  performMedicalFacilitiesWork?: boolean;
  medicalFacilitiesExplanation?: string;
  performStructuralWork?: boolean;
  performTractHomeWork?: boolean;
  tractHomeExplanation?: string;
  workCondoConstruction?: boolean;
  performCondoRepairOnly?: boolean;
  performRoofingOps?: boolean;
  roofingExplanation?: string;
  performWaterproofing?: boolean;
  waterproofingExplanation?: string;
  useHeavyEquipment?: boolean;
  heavyEquipmentExplanation?: string;
  workOver5000SqFt?: boolean;
  workOver5000SqFtPercent?: number;
  workOver5000SqFtExplanation?: string;
  workCommercialOver20000SqFt?: boolean;
  commercialOver20000SqFtPercent?: number;
  commercialOver20000SqFtExplanation?: string;
  licensingActionTaken?: boolean;
  licensingActionExplanation?: string;
  allowedLicenseUseByOthers?: boolean;
  licenseUseExplanation?: string;
  judgementsOrLiens?: boolean;
  judgementsExplanation?: string;
  lawsuitsFiled?: boolean;
  lawsuitsExplanation?: string;
  awareOfPotentialClaims?: boolean;
  potentialClaimsExplanation?: string;

  // Written Contract Questions
  haveWrittenContract?: boolean;
  contractHasStartDate?: boolean;
  contractStartDateExplanation?: string;
  contractHasScopeOfWork?: boolean;
  contractScopeExplanation?: string;
  contractIdentifiesSubcontractedTrades?: boolean;
  contractSubcontractedTradesExplanation?: string;
  contractHasSetPrice?: boolean;
  contractSetPriceExplanation?: string;
  contractSignedByAllParties?: boolean;
  contractSignedExplanation?: string;
  doSubcontractWork?: boolean;
  alwaysCollectCertificatesFromSubs?: boolean;
  collectCertificatesExplanation?: string;
  requireSubsEqualInsuranceLimits?: boolean;
  subsEqualLimitsExplanation?: string;
  requireSubsNameAsAdditionalInsured?: boolean;
  subsAdditionalInsuredExplanation?: string;
  haveStandardFormalAgreementWithSubs?: boolean;
  standardAgreementExplanation?: string;
  agreementHasHoldHarmless?: boolean;
  holdHarmlessExplanation?: string;
  requireSubsWorkersComp?: boolean;
  subsWorkersCompExplanation?: string;

  // Policy Endorsements
  policyEndorsements?: string;

  // Policy Endorsements (checkbox-driven)
  blanketAdditionalInsured?: boolean;
  blanketWaiverOfSubrogation?: boolean;
  blanketPrimaryWording?: boolean;
  blanketPerProjectAggregate?: boolean;
  blanketCompletedOperations?: boolean;
  noticeOfCancellationThirdParties?: boolean;

  // Application Agreement - Signatures
  applicantSignature?: string;
  applicantSignatureDate?: string;
  applicantTitle?: string;
  producerSignature?: string;
  producerSignatureDate?: string;

  // Page 9: Disclosure of Premium
  terrorismCoveragePremium?: string;
  rejectionStatementSignature?: string;
  rejectionStatementDate?: string;
  rejectionStatementPrintedName?: string;

  // Page 10: Surplus Lines Compliance
  policyNumber?: string;
  surplusLinesSignature?: string;
  surplusLinesDate?: string;

  // Page 11: Loss Warranty Letter
  lossWarrantyCompanySignature?: string;
  lossWarrantyDate?: string;
  lossWarrantySignature?: string;
  lossWarrantyTitle?: string;

  // Page 12: Invoice Statement
  programName?: string;
  premium?: string;
  stateTax?: string;
  associationDues?: string;
  policyFee?: string;
  inspectionFee?: string;
  totalCostOfPolicy?: string;
  depositPremium?: string;
  depositAssociationDues?: string;
  depositStateTax?: string;
  depositPolicyFee?: string;
  depositInspectionFee?: string;
  aiProcessingFee?: string;
  totalDeposit?: string;
  totalToRetain?: string;
  totalToBeSent?: string;
  invoiceProducerSignature?: string;
}

/**
 * Generate QR code URL (using a QR code API service)
 * For PDFShift compatibility, we use smaller size or text-only in production
 */
function generateQRCodeURL(text: string, size: number = 100, useTextFallback: boolean = false): string {
  // In production/PDFShift, use text-only to reduce size
  if (useTextFallback || process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return ''; // Return empty to use text-only fallback
  }
  // Using a free QR code API - smaller size for better compatibility
  return `https://api.qrserver.com/v1/create-qr-code/?size=${Math.min(size, 60)}x${Math.min(size, 60)}&data=${encodeURIComponent(text)}`;
}

/**
 * Format Yes/No with styled options
 */
function formatYesNo(value: boolean | null | undefined, defaultValue?: boolean): string {
  // If value is explicitly null or undefined and no default, show neither selected
  if (value === null || value === undefined) {
    if (defaultValue === undefined) {
      return '<span class="yes-option">Yes</span><span class="no-option">No</span>';
    }
    // Use default value if provided
    return defaultValue
      ? '<span class="yes-option selected">Yes</span><span class="no-option">No</span>'
      : '<span class="yes-option">Yes</span><span class="no-option selected">No</span>';
  }
  // Value is explicitly true or false
  return value
    ? '<span class="yes-option selected">Yes</span><span class="no-option">No</span>'
    : '<span class="yes-option">Yes</span><span class="no-option selected">No</span>';
}

/**
 * Generate Capital & Co Logo HTML (with two hands)
 * Optimized: Uses SVG reference to avoid duplication
 */
function generateCapitalCoLogoHTML(svgContent?: string, size: string = '100%', logoId: string = 'capital-co-logo'): string {
  if (svgContent) {
    // Optimize SVG: Remove XML declaration, comments, and unnecessary whitespace
    let optimizedSVG = svgContent
      .replace(/<\?xml[^>]*\?>/g, '') // Remove XML declaration
      .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .replace(/>\s+</g, '><') // Remove space between tags
      .trim();

    // Extract viewBox if present, or use default
    const viewBoxMatch = optimizedSVG.match(/viewBox=["']([^"']+)["']/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 120';

    // Remove existing width/height/style attributes
    optimizedSVG = optimizedSVG.replace(/<svg([^>]*)>/, `<svg$1>`);

    // Create optimized inline SVG with proper sizing
    return `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:${size};height:${size};" preserveAspectRatio="xMidYMid meet">${optimizedSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;
  }
  // SVG fallback (simple placeholder)
  return `<svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:${size};height:${size};"><defs><linearGradient id="handsGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.95"/><stop offset="50%" stop-color="#60a5fa" stop-opacity="0.9"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0.85"/></linearGradient></defs><path d="M30 15 Q35 10 45 12 Q55 14 60 20 Q65 28 62 38 Q60 45 55 50 Q50 52 45 50 Q40 48 38 45 Q35 40 35 35 Q33 28 35 22 Q32 18 30 15 Z" fill="url(#handsGradient)"/><path d="M70 15 Q65 10 55 12 Q45 14 40 20 Q35 28 38 38 Q40 45 45 50 Q50 52 55 50 Q60 48 62 45 Q65 40 65 35 Q67 28 65 22 Q68 18 70 15 Z" fill="url(#handsGradient)"/><ellipse cx="50" cy="45" rx="12" ry="8" fill="url(#handsGradient)" opacity="0.4"/></svg>`;
}

/**
 * Generate Page 1: Bind Request Checklist
 */
/**
 * Generate QR Code as base64 data URL (no external API calls)
 */
async function generateQRCodeBase64(text: string, size: number = 200): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(text, {
      width: size,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    });
    return qrCodeDataUrl;
  } catch (error) {
    console.error('[QR Code] Error generating QR code:', error);
    // Return a simple placeholder SVG if QR generation fails
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
  }
}

/**
 * Generate QR Code HTML with embedded base64 data URL
 */
function generateQRCodeHTML(qrCodeDataUrl: string): string {
  return `<div class="qr-code"><img src="${qrCodeDataUrl}" alt="QR Code" style="width: 0.7in; height: 0.7in; display: block;" /></div>`;
}

function generatePage1(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P1`;

  return `
    <div class="page page1-specific" style="page-break-after: always;">
      <div class="sidebar sidebar-page1">
        <div class="logo-container logo-page1">
          <div class="logo logo-sterling-page1">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <defs>
                <linearGradient id="sterlingGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00BCD4" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#0097A7" stop-opacity="0.95" />
                </linearGradient>
                <linearGradient id="sterlingGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.1" />
                </linearGradient>
              </defs>
              <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#sterlingGradient1)" />
              <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#sterlingGradient2)" />
              <path d="M50 30 L50 65" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
              <path d="M40 47 L60 47" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
            </svg>
          </div>
        </div>
        <div class="sidebar-title-vertical page1-title">Bind Request Checklist</div>
        <div class="qr-container qr-page1">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page1">${qrCodeText}</div>
          <div class="qr-page qr-page-text">${qrCodePageText}</div>
          <div class="producer-icon">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="16" r="8" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M12 50c0-6.627 5.373-12 12-12h8c6.627 0 12 5.373 12 12" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="20" y="30" width="16" height="12" rx="2" stroke="#1f2937" stroke-width="2.5" fill="none"/>
              <path d="M24 30V26c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v4" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <line x1="26" y1="36" x2="30" y2="36" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="producer-label">Producer</div>
        </div>
      </div>
      <div class="main-content main-content-page1">
        <div class="header-info-page1">
          <div class="broker-name-page1"><strong>Broker Name:</strong> ${data.agencyName}</div>
          <div class="applicant-name-page1"><strong>Applicant Name:</strong> ${data.companyName}</div>
          <div class="application-id-page1"><strong>Application ID:</strong> ${data.applicationId}</div>
        </div>
        <div class="instructions-page1">
          Thank you for your business. In order to expedite your request efficiently, we will need you to submit the following documents:
        </div>
        <div class="checklist-page1">
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Application</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Loss Warranty Letter</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Terrorism Coverage Disclosure Notice</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Surplus Lines Affidavit</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Copy of Applicant Contractor License (If Applicable)</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Invoice Statement</div>
          <div class="checklist-item-page1"><span class="checkbox-square"></span> Signed Finance Agreement</div>
        </div>
        <div class="submission-instructions-page1">
          Please submit complete and approved apps by visiting the application detail page for App ${data.applicationId} and uploading the above documents.
        </div>
        <div class="binding-instructions-page1">
          All documents must be submitted to be bound by Integrated Specialty Coverages, LLC, no binds are in effect until Broker receives confirmation from Integrated Specialty Coverages, LLC via email.
        </div>
        <div class="page-number page-number-page1">Page 1 of 1</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 2: Insurance Application - ISC Format (All details on one page)
 */
function generatePage2(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P2`;

  return `
    <div class="page page2-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page2">
        <div class="logo-container logo-page2">
          <div class="logo logo-capital-co-hands">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page2-title">Insurance Application</div>
        <div class="qr-container qr-page2">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page2">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page2">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page2">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <defs>
                <linearGradient id="personGradPage2" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stop-color="#1f2937"/>
                  <stop offset="100%" stop-color="#374151"/>
                </linearGradient>
              </defs>
              <circle cx="28" cy="18" r="9" stroke="url(#personGradPage2)" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="url(#personGradPage2)" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page2">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page2">
        <div class="header-top-page2">
          <div class="agency-info-page2-left">
            <div class="agency-name-page2">${data.agencyName}</div>
            <div class="agency-contact-page2">${data.agencyContactName}</div>
            <div class="agency-address-page2">${data.agencyAddress}</div>
            <div class="agency-city-state-zip-page2">${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
            <div class="agency-phone-page2">${data.agencyPhone}</div>
            <div class="agency-email-page2">email: ${data.agencyEmail}</div>
          </div>
          <div class="logo-brand-page2">
            <div class="logo-icon-page2-hands">
              ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
            </div>
          </div>
        </div>
        
        <div class="app-id-quote-parallel-page2">
          <div class="app-id-column-page2">
            <div class="application-id-large-page2"><strong>General Liability Application ID:</strong> ${data.applicationId}</div>
            <div class="date-section-page2"><strong>Date</strong> ${data.formDate}</div>
          </div>
          <div class="quote-column-page2">
            <div class="section-title-page2"><strong>Quote Information</strong></div>
            <div class="quote-detail-page2"><strong>Type:</strong> ${data.quoteType}</div>
            <div class="quote-detail-page2"><strong>Insurance Company:</strong> ${data.carrierName}</div>
            <div class="quote-detail-page2"><strong>Coverage Type:</strong> ${data.coverageType}</div>
            <div class="quote-detail-page2"><strong>Desired Coverage Dates:</strong> ${data.desiredCoverageDates}</div>
          </div>
        </div>
        
        <div class="insured-info-section-page2">
          <div class="section-title-page2"><strong>Insured Information</strong></div>
          <div class="insured-detail-page2">${data.companyName}</div>
          <div class="insured-detail-page2">${data.contactPerson}</div>
          <div class="insured-detail-page2">${data.applicantAddress}</div>
          <div class="insured-detail-page2">${data.applicantCity}, ${data.applicantState} ${data.applicantZip}</div>
          <div class="insured-detail-page2">${data.applicantPhone}</div>
          <div class="insured-detail-page2">email: ${data.applicantEmail}</div>
        </div>
        
        <div class="applicant-info-section-page2">
          <div class="section-title-underline-page2"><strong>APPLICANT INFORMATION</strong></div>
          <div class="applicant-field-page2"><strong>Mailing Address:</strong> ${data.applicantAddress}</div>
          <div class="applicant-field-page2"><strong>FEIN:</strong> ${data.fein || 'N/A'}</div>
          <div class="applicant-field-page2"><strong>Entity of Company:</strong> ${data.entityType}</div>
          <div class="applicant-field-page2"><strong>Years in Business:</strong> ${data.yearsInBusiness}</div>
          <div class="applicant-field-page2"><strong>Years of experience in the Trades for which you are applying for insurance:</strong> ${data.yearsExperienceInTrades}</div>
          <div class="applicant-field-page2"><strong>States in which you do business that for which you are currently applying for insurance:</strong> ${data.statesOfOperation}</div>
          <div class="applicant-field-page2"><strong>Will any of your work be performed in the 5 boroughs:</strong> ${data.workIn5Boroughs ? 'Yes' : 'No'}</div>
          <div class="applicant-field-page2"><strong>Are there any other business names which you have used in the past or are currently using in addition to that for which you're currently applying for insurance?</strong> ${data.otherBusinessNames || 'No'}</div>
          <div class="applicant-field-page2"><strong>Payment Option Details:</strong> ${data.paymentOption}</div>
        </div>
        
        <div class="coverages-section-page2">
          <div class="section-title-underline-page2"><strong>GENERAL LIABILITY COVERAGES</strong></div>
          <table class="coverages-table-page2">
            <tr><td><strong>Aggregate:</strong></td><td>${data.aggregateLimit}</td></tr>
            <tr><td><strong>Occurrence:</strong></td><td>${data.occurrenceLimit}</td></tr>
            <tr><td><strong>Products/Completed Operations:</strong></td><td>${data.productsCompletedOpsLimit}</td></tr>
            <tr><td><strong>Personal/Advertising Injury:</strong></td><td>${data.personalAdvertisingInjuryLimit}</td></tr>
            <tr><td><strong>Fire Legal:</strong></td><td>${data.fireLegalLimit}</td></tr>
            <tr><td><strong>Med Pay:</strong></td><td>${data.medPayLimit}</td></tr>
            <tr><td><strong>Self-Insured Retention:</strong></td><td>${data.selfInsuredRetention}</td></tr>
          </table>
        </div>
        
        <div class="section-divider-page2"></div>
        
        <div class="class-code-gross-section-page2">
          <div class="class-code-column-page2">
            <div class="class-code-title-page2"><strong>CLASS CODE</strong></div>
            <div class="class-code-value-page2">${data.classCode}</div>
          </div>
          <div class="class-code-divider-page2"></div>
          <div class="gross-receipts-column-page2">
            <div class="gross-receipts-title-page2"><strong>GROSS RECEIPTS</strong></div>
            <div class="gross-receipts-value-page2">${data.grossReceipts}</div>
          </div>
        </div>
        
        <div class="page-number page-number-page2">Page 2 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 3: Current Exposures, Work Performed, Work Experience (ISC Format - All on One Page)
 */
function generatePage3(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P3`;

  return `
    <div class="page page3-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page3">
        <div class="logo-container logo-page3">
          <div class="logo logo-capital-co-hands-page3">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page3-title">Insurance Application</div>
        <div class="qr-container qr-page3">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page3">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page3">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page3">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page3">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page3">
        <div class="section-title-uppercase-page3">CURRENT EXPOSURES</div>
        <div class="exposures-grid-page3">
          <div class="exposure-item-page3"><strong>Estimated Total Gross Receipts:</strong> ${data.estimatedTotalGrossReceipts}</div>
          <div class="exposure-item-page3"><strong>Estimated Sub Contracting Costs:</strong> ${data.estimatedSubContractingCosts}</div>
          <div class="exposure-item-page3"><strong>Estimated Material Costs:</strong> ${data.estimatedMaterialCosts}</div>
          <div class="exposure-item-page3"><strong>Estimated Total Payroll:</strong> ${data.estimatedTotalPayroll}</div>
          <div class="exposure-item-page3"><strong>Number of Field Employees*:</strong> ${data.numberOfFieldEmployees}</div>
        </div>
        <div class="footnote-page3">* For purposes of this application, "Employee" is defined as an individual working for you (the applicant), which receives a W-2 tax form or you withhold & pay employment related taxes for that individual.</div>
        
        <div class="section-title-uppercase-page3">WORK PERFORMED</div>
        <div class="work-description-page3"><strong>Complete Descriptions of operations that for which you are currently applying for insurance:</strong> ${data.workDescription || ''}</div>
        <div class="work-percentages-page3">
          <div class="percentage-item-page3"><strong>Percentage of Residential work performed:</strong> ${data.percentageResidential}%</div>
          <div class="percentage-item-page3"><strong>Percentage of Commercial work performed:</strong> ${data.percentageCommercial}%</div>
          <div class="percentage-item-page3"><strong>Percentage of New (Ground Up) work performed:</strong> ${data.percentageNewConstruction}%</div>
          <div class="percentage-item-page3"><strong>Percentage of Remodel/Service/Repair work performed:</strong> ${data.percentageRemodel}%</div>
        </div>
        <div class="structural-details-page3">
          <div class="detail-item-page3"><strong>Maximum # of Interior Stories:</strong> ${data.maxInteriorStories}</div>
          <div class="detail-item-page3"><strong>Maximum # of Exterior Stories:</strong> ${data.maxExteriorStories}</div>
          <div class="detail-item-page3"><strong>Maximum Exterior Depth Below Grade in Feet:</strong> ${data.maxExteriorDepthBelowGrade}</div>
        </div>
        <div class="ocip-section-page3">
          <div class="ocip-question-page3"><strong>Will you perform OCIP (Wrap-up) work:</strong> ${formatYesNo(data.performOCIPWork)}</div>
          ${data.performOCIPWork ? `<div class="ocip-followup-page3"><strong>If "Yes", what are the estimated receipts for work covered separately under OCIP/Wrap-up:</strong> ${data.ocipReceipts || ''}</div>` : ''}
          <div class="ocip-receipts-page3"><strong>Estimated Receipts for non-Wrap/OCIP:</strong> ${data.nonOCIPReceipts || ''}</div>
          <div class="losses-page3"><strong>Number of losses in the last 5 years:</strong> ${data.lossesInLast5Years}</div>
        </div>
        
        <div class="section-title-uppercase-page3">WORK EXPERIENCE</div>
        <div class="work-experience-questions-page3">
          <div class="question-item-page3">
            <div class="question-text-page3">Will you or do you perform or subcontract any work involving the following: blasting operations, hazardous waste, asbestos, mold, PCBs, oil fields, dams/levees, bridges, quarries, railroads, earthquake retrofitting, fuel tanks, pipelines, or foundation repair?</div>
            <div class="yes-no-options-page3">${formatYesNo(data.performHazardousWork)}</div>
            ${data.performHazardousWork ? `<div class="explanation-field-page3"><strong>If "Yes", please explain:</strong> ${data.hazardousWorkExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page3">
            <div class="question-text-page3">Will you or do you perform or subcontract any work involving the following: medical facilities (including new construction), hospitals (including new construction), churches or other house of worship, museums, historic buildings, airports, schools/playgrounds/recreational facilities (including new construction)?</div>
            <div class="yes-no-options-page3">${formatYesNo(data.performMedicalFacilitiesWork)}</div>
            ${data.performMedicalFacilitiesWork ? `<div class="explanation-field-page3"><strong>If "Yes", please explain:</strong> ${data.medicalFacilitiesExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page3">
            <div class="question-text-page3"><strong>Will you perform structural work?</strong></div>
            <div class="yes-no-options-page3">${formatYesNo(data.performStructuralWork)}</div>
          </div>
          
          <div class="question-item-page3">
            <div class="question-text-page3"><strong>Will you perform work in new tract home developments of 25 or more units?</strong></div>
            <div class="yes-no-options-page3">${formatYesNo(data.performTractHomeWork)}</div>
            ${data.performTractHomeWork ? `<div class="explanation-field-page3"><strong>If "Yes", please explain:</strong> ${data.tractHomeExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page3">
            <div class="question-text-page3"><strong>Will any of your work involve the construction of or be for new condominiums/townhouses/multi-unit residences?:</strong></div>
            <div class="yes-no-options-page3">${formatYesNo(data.workCondoConstruction)}</div>
          </div>
          
          <div class="question-item-page3">
            <div class="question-text-page3"><strong>Will you perform repair only for individual unit owners of condominiums/townhouses/multi-unit residences?:</strong></div>
            <div class="yes-no-options-page3">${formatYesNo(data.performCondoRepairOnly)}</div>
          </div>
        </div>
        
        <div class="page-number page-number-page3">Page 3 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 4: Work Experience - Continued (ISC Format - All on One Page)
 */
function generatePage4(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P4`;

  return `
    <div class="page page4-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page4">
        <div class="logo-container logo-page4">
          <div class="logo logo-capital-co-hands-page4">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page4-title">Insurance Application</div>
        <div class="qr-container qr-page4">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page4">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page4">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page4">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page4">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page4">
        <div class="section-title-uppercase-page4">WORK EXPERIENCE - CONT.</div>
        
        <div class="work-experience-questions-page4">
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Will you perform or subcontract any roofing operations, work on the roof or deck work on roofs?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.performRoofingOps)}</div>
            ${data.performRoofingOps ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.roofingExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Does your company perform any waterproofing?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.performWaterproofing)}</div>
            ${data.performWaterproofing ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.waterproofingExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Do you use motorized or heavy equipment in any of your operations?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.useHeavyEquipment)}</div>
            ${data.useHeavyEquipment ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.heavyEquipmentExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Will you perform work (new/remodel) on single family residences, in which the dwelling exceeds 5,000 square feet?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.workOver5000SqFt)}</div>
            ${data.workOver5000SqFt ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.workOver5000SqFtExplanation || ''}</div>` : ''}
            <div class="percentage-field-page4"><strong>What percentage of your work will be on homes over 5,000 square feet:</strong> ${data.workOver5000SqFtPercent || 0}%</div>
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Will you perform work on commercial buildings over 20,000 square feet?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.workCommercialOver20000SqFt)}</div>
            ${data.workCommercialOver20000SqFt ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.commercialOver20000SqFtExplanation || ''}</div>` : ''}
            <div class="percentage-field-page4"><strong>What percentage of your work will be on commercial buildings over 20,000 square feet:</strong> ${data.commercialOver20000SqFtPercent || 0}%</div>
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Has any licensing authority taken any action against you, your company or any affiliates?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.licensingActionTaken)}</div>
            ${data.licensingActionTaken ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.licensingActionExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Have you allowed or will you allow your license to be used by any other contractor?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.allowedLicenseUseByOthers)}</div>
            ${data.allowedLicenseUseByOthers ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.licenseUseExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Has the applicant or business owner ever had any judgements or liens filed against them or filed for bankruptcy?</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.judgementsOrLiens)}</div>
            ${data.judgementsOrLiens ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.judgementsExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Has any lawsuit ever been filed or any claim otherwise been made against your company (including any partnership or any joint venture of which you have been a member of, any of your company's predecessors, or any person, company or entities on whose behalf your company has assumed liability)? (For the purposes of this application, a claim means a receipt of a demand for money, services or arbitration.)</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.lawsuitsFiled)}</div>
            ${data.lawsuitsFiled ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.lawsuitsExplanation || ''}</div>` : ''}
          </div>
          
          <div class="question-item-page4">
            <div class="question-text-page4"><strong>Is your company aware of any facts, circumstances, incidents, situations, damages or accidents (including but not limited to: faulty or defective workmanship, product failure, construction dispute, property damage or construction worker injury) that a reasonably prudent person might expect to give rise to a claim or lawsuit, whether valid or not, which might directly or indirectly involve the company? (For the purposes of this application, a claim means a receipt of a demand for money, services or arbitration.)</strong></div>
            <div class="yes-no-options-page4">${formatYesNo(data.awareOfPotentialClaims)}</div>
            ${data.awareOfPotentialClaims ? `<div class="explanation-field-page4"><strong>If "Yes", please explain:</strong> ${data.potentialClaimsExplanation || ''}</div>` : ''}
          </div>


          ${data.generalLiabilityLosses && data.generalLiabilityLosses.length > 0 ? `
          <div class="loss-history-section">
            <h3>General Liability Loss Information</h3>

            <table class="loss-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date of Loss</th>
                  <th>Amount of Loss</th>
                </tr>
              </thead>
              <tbody>
                ${data.generalLiabilityLosses.map(loss => `
                  <tr>
                    <td>General Liability</td>
                    <td>${loss.dateOfLoss || "-"}</td>
                    <td>${loss.amountOfLoss || "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          ` : `
          <div class="loss-history-section">
            <strong>Loss History:</strong> No losses reported
          </div>
          `}



        </div>
        
        <div class="page-number page-number-page4">Page 4 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 5: Written Contract & Policy Endorsements (ISC Format - All on One Page)
 */
function generatePage5(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P5`;

  return `
    <div class="page page5-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page5">
        <div class="logo-container logo-page5">
          <div class="logo logo-capital-co-hands-page5">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page5-title">Insurance Application</div>
        <div class="qr-container qr-page5">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page5">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page5">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page5">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page5">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page5">
        <div class="section-title-uppercase-page5">WRITTEN CONTRACT</div>
        
        <div class="written-contract-questions-page5">
          <div class="question-item-page5">
            <div class="question-text-page5"><strong>Do you have a written contract for all work you perform?</strong></div>
            <div class="yes-no-options-page5">${formatYesNo(data.haveWrittenContract)}</div>
            ${data.haveWrittenContract ? `<div class="sub-question-header-page5">If "Yes", answer the following questions:</div>` : ''}
            ${data.haveWrittenContract ? `
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Does the contract identify a start date for the work?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.contractHasStartDate, true)}</div>
              ${!data.contractHasStartDate ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.contractStartDateExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Does the contract identify a precise scope of work?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.contractHasScopeOfWork, true)}</div>
              ${!data.contractHasScopeOfWork ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.contractScopeExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Does the contract identify all subcontracted trades (if any)?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.contractIdentifiesSubcontractedTrades, true)}</div>
              ${!data.contractIdentifiesSubcontractedTrades ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.contractSubcontractedTradesExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Does the contract provide a set price?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.contractHasSetPrice, true)}</div>
              ${!data.contractHasSetPrice ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.contractSetPriceExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Is the contract signed by all parties to the contract?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.contractSignedByAllParties, true)}</div>
              ${!data.contractSignedByAllParties ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.contractSignedExplanation || ''}</div>` : ''}
            </div>
            ` : ''}
          </div>
          
          <div class="question-item-page5">
            <div class="question-text-page5"><strong>Do you subcontract work?</strong></div>
            <div class="yes-no-options-page5">${formatYesNo(data.doSubcontractWork)}</div>
            ${data.doSubcontractWork ? `<div class="sub-question-header-page5">If "Yes", answer the following questions:</div>` : ''}
            ${data.doSubcontractWork ? `
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Do you always collect certificates of insurance from subcontractors?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.alwaysCollectCertificatesFromSubs, true)}</div>
              ${!data.alwaysCollectCertificatesFromSubs ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.collectCertificatesExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Do you require subcontractors to have insurance limits equal to your own?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.requireSubsEqualInsuranceLimits, true)}</div>
              ${!data.requireSubsEqualInsuranceLimits ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.subsEqualLimitsExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Do you always require subcontractors to name you as additional insured?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.requireSubsNameAsAdditionalInsured, true)}</div>
              ${!data.requireSubsNameAsAdditionalInsured ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.subsAdditionalInsuredExplanation || ''}</div>` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Do you have a standard formal agreement with subcontractors?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.haveStandardFormalAgreementWithSubs, true)}</div>
              ${!data.haveStandardFormalAgreementWithSubs ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.standardAgreementExplanation || ''}</div>` : ''}
              ${data.haveStandardFormalAgreementWithSubs ? `
              <div class="sub-question-item-page5">
                <div class="question-text-page5"><strong>If "Yes", does it have a hold harmless/indemnification agreement in your favor?</strong></div>
                <div class="yes-no-options-page5">${formatYesNo(data.agreementHasHoldHarmless, true)}</div>
                ${!data.agreementHasHoldHarmless ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.holdHarmlessExplanation || ''}</div>` : ''}
              </div>
              ` : ''}
            </div>
            <div class="sub-question-item-page5">
              <div class="question-text-page5"><strong>Do you require subcontractors to carry Worker's Compensation?</strong></div>
              <div class="yes-no-options-page5">${formatYesNo(data.requireSubsWorkersComp, true)}</div>
              ${!data.requireSubsWorkersComp ? `<div class="explanation-field-page5"><strong>If "No", please explain:</strong> ${data.subsWorkersCompExplanation || ''}</div>` : ''}
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="section-title-uppercase-page5 policy-endorsements-title-page5">POLICY ENDORSEMENTS</div>
        <div class="policy-endorsements-content-page5">${data.policyEndorsements}</div>
        
        <div class="page-number page-number-page5">Page 5 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 6: Notice & Policy Exclusions (ISC Format - All on One Page)
 */
function generatePage6(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P6`;

  return `
    <div class="page page6-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page6">
        <div class="logo-container logo-page6">
          <div class="logo logo-capital-co-hands-page6">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page6-title">Insurance Application</div>
        <div class="qr-container qr-page6">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page6">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page6">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page6">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page6">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page6">
        <div class="section-title-uppercase-page6">NOTICE</div>
        
        <div class="notice-content-page6">
          <p>This is a quotation only. No coverage is in effect until an application is approved and policy binder is received. This policy is issued by your insurance company. Nothing is bound until final underwriting approval. Your insurance company may not be subject to all of the insurance laws and regulations of your state. State insurance insolvency guaranty funds may not available. Therefore please consult with your insurance agent for further information.</p>
          
          <p>Please note that your policy is subject to audit. Audits are routinely performed and specifically provided for in the policy. The initial premium is regarded as a deposit premium only since the underwriters are relying on the accuracy of the information provided by the insured. This includes the estimated gross receipts. Thus, the audit is necessary to verify the financial information provided since the premium is based upon these representations. ${data.carrierName} policies are audited by Zoom Professional Services. Zoom is the authorized representative in regard to your policy audit. We appreciate your anticipated cooperation.</p>
        </div>
        
        <div class="initial-line-page6">Initial: _________________________</div>
        
        <div class="section-title-uppercase-page6">POLICY EXCLUSIONS</div>
        
        <div class="exclusions-content-page6">
          <p><strong>Section I – Coverages, Coverage A – Bodily Injury and Property Damage Liability:</strong> Expected or Intended Injury; Action Over; Worker's Compensation and Similar Laws; Aircraft, Auto or Watercraft; Mobile Equipment; Drywall Manufactured in China; Exterior Insulation and Finish Systems ("EIFS"); Assault and Battery; Professional Services; Damage to Property; Damage to Your Product; Damage to Your Work; Damage to Impaired Property or Property Not Physically Injured; Recall of Products; Work or Impaired Property; Personal and Advertising Injury; Subsidence, Movement, or Vibration of Land; School or Recreational Facility; Deleterious Substances; Open Structure "Water" Damage; Heating Devices; Explosives; Communicable Disease; Abuse or Molestation; Prior Work and Prior Products; Wrap Up.</p>
          
          <p><strong>Common Policy Exclusions:</strong> Past Work or Construction Projects; Buildings and Structures Exceeding Three Stories; Water or Fire Damage Liability; Hospital, Medical or Care Facilities; Physical or Mental Disability or Impairment; Material Misrepresentation; Overspray; House/Structure Raising; Fall from Heights; Animals; Independent Contractors/Subcontractors Sublimit; Airports; House of Worship; Underground Utility Location; Fire Suppression Systems; Collapse; Injury or Damage to Day Laborers; Undisclosed Waterproofing Operations; Abandoned Work; Urethane or Spray Roofing; Museums and Historic Buildings and Structures; Tract Home Project.</p>
          
          <p><strong>Coverage B – Personal and Advertising Injury:</strong> Knowing Violation of Rights of Another; Material Published with Knowledge of Falsity; Material Published Prior to Policy Period; Insureds in Media and Internet Type Business; Electronic Chat Rooms, Bulletin Boards, or Social Media; Unauthorized Use of Another's Name or Product; "Bodily Injury" and "Property Damage"; Quality or Performance of Goods – Failure to Conform to Statements; Wrong Description of Prices; Infringement of Copyright, Patent, Trademark or Trade Secret; Expected or Intended Injury or Damage; Common Policy Exclusions.</p>
          
          <p><strong>Coverage C – Medical Payments:</strong> Any Insured; Hired Person; Injury on Normally Occupied Premises; Workers Compensation and Similar Laws; Athletic Activities; Products-Completed Operations Hazard, Coverage A and B Exclusions.</p>
          
          <p><strong>Section II. Common Policy Exclusions:</strong> Breach of Contract/Contractual Liability; Employer's Liability; Pollution; Residential Project/Structure Size Restriction Exclusion; Commercial or Mixed Use Building/Project Size Restriction Exclusion; Multi-Unit Structures; War or Terrorism; Employment Practices; Cross Suits; Fraudulent, Intentional, or Criminal Acts; Unlicensed Contractors; Non-Compliance with Safety Regulations; Prior Litigation; Prior Knowledge; Ongoing Operations; Unsolicited Communications; Punitive Damages, Fines or Penalties; Attorney, Expert, and Vendor Fees and Costs of Others; Classification Limitation Exclusion; Social and Entertainment Activities and Events; Force Majeure or Acts of God; Liquor Liability; State Specific Operations; Electronic Data; Mental Injury; Roofing Operations; Louisiana Operations; Slip and Fall, Underground Horizontal Drilling, Cyber.</p>
          
          <p>Please refer to the policy for a complete list of exclusions. This list is subject to change and may differ from prior policy years.</p>
        </div>
        
        <div class="initial-line-page6">* I have read and understand the policy exclusions identified above. Initial: _________________________</div>
        
        <div class="page-number page-number-page6">Page 6 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 7: Application Agreement (ISC Format - All on One Page)
 */
function generatePage7(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P7`;

  return `
    <div class="page page7-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page7">
        <div class="logo-container logo-page7">
          <div class="logo logo-capital-co-hands-page7">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page7-title">Insurance Application</div>
        <div class="qr-container qr-page7">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page7">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page7">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page7">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page7">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page7">
        <div class="section-title-uppercase-page7">APPLICATION AGREEMENT</div>
        
        <div class="agreement-content-page7">
          <p>The purpose of this application is to assist in the underwriting process information contained herein is specifically relied upon in determination of insurability. The no loss letter shall be the basis of any insurance that may be issued and will be a part of such policy. The undersigned, therefore, warrants that the information contained herein is true and accurate to the best of his/her knowledge, information and belief.</p>
          
          <p>The undersigned Applicant warrants that the above statements and particulars, together with any attached or appended documents or materials ("this Application"), are true and complete and do not misrepresent, misstate or omit any material facts. The undersigned Applicant warrants that the representations and information supplied in each of the above sections entitled Applicant Information, Entity of Company, Additional Business Names, Description of Operations, Estimated Exposures, Previous Exposures, Work Experience and related information are specifically relied upon in the determination of insurability, are material to the risk to be insured, and will be a part of any policy issued. The undersigned Applicant understands that any misrepresentation or omission of any information in any part of this Application shall constitute grounds for immediate cancellation of coverage and denial of claims, if any. It is further understood that the applicant and or affiliated company is under a continuing obligation to immediately notify his/her underwriter through his/her broker of any material alteration of the information given. The Applicant agrees to notify the Company of any material changes in the answers to the questions on this Application which may arise prior to the effective date of any policy issued pursuant to this Application. The Applicant understands that any outstanding quotations may be modified or withdrawn based upon such changes at the sole discretion of the Company.</p>
          
          <p>Notwithstanding any of the foregoing, the Applicant understands the Company is not obligated nor under any duty to issue a policy of insurance based upon this Application. The Applicant further understands that, if a policy is issued, this Application will be incorporated into and form a part of such policy and any false information provided on this application will result in the nullification of such policy. Furthermore, the Applicant authorizes the Company, as administrative and servicing manager, to make any investigation and inquiry in connection with the Application as it may deem necessary.</p>
          
          <p>For your protection, this information is provided as required by applicable State and Federal law. Any person who knowingly presents false, fraudulent, misleading, incomplete or misleading facts or information or aids, abets, solicits, or conspires with any person to do so, for the purpose of obtaining insurance coverage, amending insurance coverage, seeking insurance benefits or to make a claim for the payment of a loss, is unlawful and is guilty of a crime and may be subject to fines and confinement in state or federal prison.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p>The applicant acknowledges that explanation of the terms, conditions and provisions of the policy of insurance, including but not limited to coverage being afforded, amendments, endorsements, exclusions and any other such information effecting the policy of insurance are provided solely by the applicant's agent, broker or producer and NOT the Company. The coverage type, nature, amounts and insurance needs of the applicant are the sole responsibility of the applicant and its agent/ broker or producer. The applicant understands the agent/ broker or producer has no authority to act on behalf of the insurance company.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p>Applicant acknowledges that this policy is subject to a self-insured retention. The total limit of liability as stated in the policy declarations shall apply in excess of the self-insured retention. The limits of insurance applicable to such coverages will not be reduced by the amount of such self-insured retention. This policy applies only to the amount excess of the self-insured retention. Complete satisfaction of the SIR by the applicant is a "condition precedent" to Company's duty to defend and/or indemnity. Please note that Company is not obligated to defend and/or indemnify the applicant until the SIR is paid in full. The self-insured retention shall remain applicable even if you file for bankruptcy, discontinues business or otherwise becomes unable to unwilling to pay the self-insured retention. The risk of insolvency is retained by you and is not transferrable. Please consult your policy for the full terms and conditions of the SIR.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p>If you are applying for a "claims made" policy then please note that policy provides coverage only for "claims made" and reported to the company in writing during the policy period. Thus there is NO retroactive coverage. Please consult your policy and or agent/broker for further information.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p>The coverage provided by your policy may also be subject to other limitations including, but not limited to, sublimits of liability and/or, per- project shared aggregate limits of liability. In addition, defense costs and claim expenses are included within the applicable limits of liability. This means that the limits of liability available to pay indemnity, settlements, judgments and "claim expenses" will be reduced, and may be exhausted, by payment of "claim expenses" including payment of any defense fees and costs. Please consult your policy and or agent/broker for further information.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p>Applicants must strictly comply with all applicable state and/or other governmental licensing requirements and regulations. Should an applicant's license become suspended, revoked or inactive at any time during the policy period, then NO coverage will be afforded under the policy.</p>
        </div>
        
        <div class="initial-line-page7">Initial: _________________________</div>
        
        <div class="agreement-content-page7">
          <p><strong>* Deposit Premium & Fees are fully earned.</strong></p>
          
          <p>We will compute all premiums for this policy in accordance with our rules and rates. Premium shown in this policy as advance premium is a deposit premium only and is based upon the information provided by the applicant and or its agent. This information is subject to audit.</p>
          
          <p>Please note that issuance of the policy includes membership in Preferred Contractors Association (PCA). For a complete list of benefits and information, visit the website at www.pcamembers.com</p>
        </div>
        
        <div class="signature-section-page7">
          <div class="signature-field-page7">
            <div class="signature-label-page7">Signature of Applicant</div>
            <div class="signature-line-page7">${data.applicantSignature || '_________________________'}</div>
          </div>
          <div class="signature-field-page7" style="display: flex; gap: 0.2in;">
            <div style="flex: 1;">
              <div class="signature-label-page7">Date</div>
              <div class="signature-line-page7">${data.applicantSignatureDate || '_________________________'}</div>
            </div>
          </div>
          <div class="signature-field-page7">
            <div class="signature-label-page7">Title (Owner, Officer, Partner)</div>
            <div class="signature-line-page7">${data.applicantTitle || '_________________________'}</div>
          </div>
          <div class="signature-field-page7">
            <div class="signature-label-page7">Signature of Producer (Agent or Broker)</div>
            <div class="signature-line-page7">${data.producerSignature || '_________________________'}</div>
          </div>
        </div>
        
        <div class="page-number page-number-page7">Page 7 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 8: Terrorism Coverage Disclosure Notice (ISC Format - All on One Page)
 */
function generatePage8(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P8`;

  return `
    <div class="page page8-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page8">
        <div class="logo-container logo-page8">
          <div class="logo logo-capital-co-hands-page8">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page8-title">Acknowledgment</div>
        <div class="qr-container qr-page8">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page8">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page8">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page8">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page8">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page8">
        <div class="carrier-header-page8">
          <div class="carrier-name-large-page8">${data.carrierName}</div>
          <div class="endorsement-notice-page8">THIS ENDORSEMENT CHANGES THE POLICY. PLEASE READ IT CAREFULLY</div>
          <div class="carrier-name-medium-page8">${data.carrierName}</div>
          <div class="policy-type-page8">COMMERCIAL GENERAL LIABILITY POLICY</div>
          <div class="document-title-page8">**TERRORISM COVERAGE DISCLOSURE NOTICE**</div>
          <div class="section-title-bold-page8">**TERRORISM COVERAGE PROVIDED UNDER THIS POLICY**</div>
        </div>
        
        <div class="terrorism-content-page8">
          <p>The Terrorism Risk Insurance Act of 2002 and amendments thereto (collectively referred to as the "Act") established a program within the Department of the Treasury, under which the federal government shares, with the insurance industry, the risk of loss from future terrorist attacks. An act of terrorism is defined as any act certified by the Secretary of the Treasury, in concurrence with the Secretary of State and the Attorney General of the United States, to be an act of terrorism; to be a violent act or an act that is dangerous to human life, property or infrastructure; to have resulted in damage within the United States, or outside the United States in the case of an air carrier or vessel or the premises of a United States Mission; and to have been committed by an individual or individuals as part of an effort to coerce the civilian population of the United States or to influence the policy or affect the conduct of the United States Government by coercion.</p>
          
          <p>In accordance with the Act we are required to offer you coverage for losses resulting from an act of terrorism that is certified under the federal program as an act of terrorism. The policy's other provisions will still apply to such an act. <strong>This offer does not include coverage for incidents of nuclear, biological, chemical, or radiological terrorism which will be excluded from your policy.</strong> Your decision is needed on this question: do you choose to pay the premium for terrorism coverage stated in this offer of coverage, or do you reject the offer of coverage and not pay the premium? You may accept or reject this offer.</p>
          
          <p>If your policy provides commercial property coverage, in certain states, statutes or regulations may require coverage for fire following an act of terrorism. In those states, if terrorism results in fire, we will pay for the loss or damage caused by that fire, subject to all applicable policy provisions including the Limit of Insurance on the affected property. Such coverage for fire applies only to direct loss or damage by fire to Covered Property. Therefore, for example, the coverage does not apply to insurance provided under Business Income and/or Extra Expense coverage forms or endorsements that apply to those coverage forms, or to Legal Liability coverage forms or Leasehold Interest coverage forms.</p>
          
          <p>Your premium <strong>will include</strong> the additional premium for terrorism as stated in the section of this Notice titled <strong>DISCLOSURE OF PREMIUM.</strong></p>
        </div>
        
        <div class="section-title-bold-page8">DISCLOSURE OF FEDERAL PARTICIPATION IN PAYMENT OF TERRORISM LOSSES</div>
        
        <div class="terrorism-content-page8">
          <p>You should know that where coverage is provided by this policy for losses resulting from certified acts of terrorism, such losses may be partially reimbursed by the United States government under a formula established by federal law. However, your policy may contain other exclusions which might affect your coverage, such as an exclusion for nuclear events. Under the formula, the United States government generally <strong>reimburses 80% beginning on January 1, 2020</strong> of covered terrorism losses exceeding the statutorily established deductible paid by the insurance company providing the coverage.</p>
        </div>
        
        <div class="section-title-bold-page8">DISCLOSURE OF CAP ON ANNUAL LIABILITY</div>
        
        <div class="terrorism-content-page8">
          <p><strong>You Should Also Know That the Terrorism Risk Insurance Act, As Amended, Contains A $100 Billion Cap That Limits U.S. Government Reimbursement As Well As Insurers' Liability For Losses Resulting From Certified Acts Of Terrorism When The Amount Of Such Losses In Any One Calendar Year Exceeds $100 Billion. If The Aggregate Insured Losses For All Insurers Exceed $100 Billion, Your Coverage May Be Reduced.</strong></p>
        </div>
        
        <div class="agreement-content-page8" style="margin-top: 0.08in;">
          <p><strong>* Deposit Premium & Fees are fully earned.</strong></p>
          
          <p>We will compute all premiums for this policy in accordance with our rules and rates. Premium shown in this policy as advance premium is a deposit premium only and is based upon the information provided by the applicant and or its agent. This information is subject to audit.</p>
          
          <p>Please note that issuance of the policy includes membership in Preferred Contractors Association (PCA). For a complete list of benefits and information, visit the website at www.pcamembers.com</p>
        </div>
        
        <div class="signature-section-page8">
          <div class="signature-field-page8" style="display: flex; gap: 0.3in; align-items: flex-end;">
            <div style="flex: 1;">
              <div class="signature-label-page8">Signature of Applicant</div>
              <div class="signature-line-page8">${data.applicantSignature || '_________________________'}</div>
            </div>
            <div style="flex: 1;">
              <div class="signature-label-page8">Date</div>
              <div class="signature-line-page8">${data.applicantSignatureDate || '_________________________'}</div>
            </div>
          </div>
          <div class="signature-field-page8">
            <div class="signature-label-page8">Title (Owner, Officer, Partner)</div>
            <div class="signature-line-page8">${data.applicantTitle || '_________________________'}</div>
          </div>
          <div class="signature-field-page8">
            <div class="signature-label-page8">Signature of Producer (Agent or Broker)</div>
            <div class="signature-line-page8">${data.producerSignature || '_________________________'}</div>
          </div>
        </div>
        
        <div class="page-number page-number-page8">Page 8 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 9: Disclosure of Premium (Terrorism Coverage) - ISC Format
 */
function generatePage9(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P9`;

  return `
    <div class="page page9-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page9">
        <div class="logo-container logo-page9">
          <div class="logo logo-capital-co-hands-page9">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page9-title">Acknowledgment</div>
        <div class="qr-container qr-page9">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page9">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page9">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page9">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page9">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page9">
        <div class="carrier-header-page9">
          <div class="carrier-name-large-page9">${data.carrierName}</div>
          <div class="carrier-divider-page9"></div>
        </div>
        
        <div class="section-title-bold-page9">DISCLOSURE OF PREMIUM</div>
        
        <div class="premium-disclosure-content-page9">
          <p><strong>Your premium for terrorism coverage is:</strong> ${data.terrorismCoveragePremium || '$0.00'}</p>
          
          <p>Premium charged is for the policy period up to your policy expiration. (This charge/amount is applied to obtain the final premium.)</p>
          
          <p><strong>You may choose to reject the offer by signing the statement below and returning it to us.</strong> Your policy will be changed to exclude the described coverage. If you chose to accept this offer, this form does not have to be returned.</p>
        </div>
        
        <div class="section-title-bold-page9 rejection-title-page9">REJECTION STATEMENT</div>
        
        <div class="rejection-statement-box-page9">
          <p>I hereby decline to purchase coverage for certified acts of terrorism. I understand that an exclusion of certain terrorism losses will be made part of this policy.</p>
        </div>
        
        <div class="signature-section-page9">
          <div class="signature-field-page9">
            <div class="signature-label-page9">Member/Insured: <strong>${data.companyName}</strong></div>
            <div class="signature-line-page9 signature-line-extended-page9"></div>
          </div>
          <div class="signature-field-page9" style="display: flex; gap: 0.3in; align-items: flex-end;">
            <div style="flex: 1;">
              <div class="signature-label-page9">Member/Insured Signature:</div>
              <div class="signature-line-page9">${data.rejectionStatementSignature || '_________________________'}</div>
            </div>
            <div style="flex: 1;">
              <div class="signature-label-page9">Date:</div>
              <div class="signature-line-page9">${data.rejectionStatementDate || '_________________________'}</div>
            </div>
          </div>
          <div class="signature-field-page9">
            <div class="signature-label-page9">Printed Name/Title:</div>
            <div class="signature-line-page9">${data.rejectionStatementPrintedName || '_________________________'}</div>
          </div>
        </div>
        
        <div class="footer-code-page9">SSI TCDN 00 02 0123</div>
        <div class="page-number page-number-page9">Page 9 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 10: Surplus Lines Compliance Certification - ISC Format
 */
function generatePage10(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P10`;

  return `
    <div class="page page10-isc" style="page-break-after: always;">
      <div class="main-content main-content-page10">
        <div class="section-title-bold-page10">SURPLUS LINES COMPLIANCE CERTIFICATION</div>
        
        <div class="certification-content-page10">
          <p>I, the retail or producing resident or non‐resident licensed producer/agent/broker, affirm I have expressly advised the insured prior to placement of the insurance that I was unable to obtain the full amount or kind of insurance necessary to protect the desired risk(s) from authorized insurers, as required by the risk state, currently writing this type of coverage in this State.</p>
          
          <p>In addition, I confirm that coverage was not procured for the purpose of securing a lower premium rate than would be accepted by an authorized insurer nor to secure any other competitive advantage.</p>
          
          <p>Under the penalty of suspension or revocation of my producer/agent/broker's license, the facts contained in this certification are true and correct.</p>
        </div>
        
        <div class="signature-section-page10">
          <div class="signature-field-page10">
            <div class="signature-label-page10">TBD-AppID ${data.applicationId}</div>
            <div class="signature-line-page10">${data.policyNumber || '_________________________'}</div>
          </div>
          <div class="signature-field-page10">
            <div class="signature-label-page10">Policy Number</div>
            <div class="signature-line-page10">${data.policyNumber || '_________________________'}</div>
          </div>
          <div class="signature-field-page10">
            <div class="signature-label-page10">Signature of Licensed Retail/Producing Agent/Broker</div>
            <div class="signature-line-page10">${data.surplusLinesSignature || '_________________________'}</div>
          </div>
          <div class="signature-field-page10" style="display: flex; gap: 0.3in; align-items: flex-end;">
            <div style="flex: 1;">
              <div class="signature-label-page10">Date</div>
              <div class="signature-line-page10">${data.surplusLinesDate || '_________________________'}</div>
            </div>
          </div>
        </div>
        
        <div class="page-number page-number-page10">Page 10 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 11: Loss Warranty Letter - ISC Format
 */
function generatePage11(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P11`;

  return `
    <div class="page page11-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page11">
        <div class="logo-container logo-page11">
          <div class="logo logo-capital-co-hands-page11">
            ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG)}
          </div>
        </div>
        <div class="sidebar-title-vertical page11-title">Loss Warranty Letter</div>
        <div class="qr-container qr-page11">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page11">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page11">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page11">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="18" r="9" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M10 52c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page11">Applicant</div>
        </div>
      </div>
      <div class="main-content main-content-page11">
        <div class="header-section-page11">
          <div class="header-left-page11">
            <div class="applicant-info-page11">
              <div class="applicant-name-large-page11">${data.companyName}</div>
              <div class="applicant-address-page11">${data.applicantAddress}</div>
              <div class="applicant-city-state-zip-page11">${data.applicantCity}, ${data.applicantState} ${data.applicantZip}</div>
              <div class="applicant-phone-page11">${data.applicantPhone}</div>
              <div class="applicant-email-page11">email: ${data.applicantEmail}</div>
              <div class="quote-id-page11">Quote ID: ${data.applicationId}</div>
            </div>
          </div>
          <div class="header-right-page11">
            <div class="logo-capital-co-page11-right">
              ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG, '100%', 'capital-co-logo-page11-right')}
            </div>
          </div>
        </div>
        
        <div class="warranty-content-page11">
          <p>During the last Five (5) years, we warrant that with respect to the insurance being applied for:</p>
          
          <ol class="warranty-list-page11">
            <li>I/ we have not sustained a loss</li>
            <li>Have not had a claim made against us</li>
            <li>Have not been denied coverage or had coverage canceled by an insurance company</li>
            <li>Have no knowledge or a reason to anticipate a claims or loss.</li>
          </ol>
          
          <p>If my business is less than five (5) years old, the above referenced warranty applies to work performed through all my prior business entities whether as an owner or an employee. The undersigned Applicant understands and agrees that all of the statements, information and responses provided in the Application for this policy are material to the risk sought to be insured, and that the entirety of the information provided in the Application forms a basis for the insurer to provide the requested insurance, and that said insurance is provided in reliance on such material representations.</p>
          
          <p>The undersigned Applicant further authorizes the Insurer or its representative to obtain directly or on Applicant's behalf, any and all loss runs or other such information identifying any claim, action or loss against the undersigned Applicant or the denial of coverage or cancelation of insurance. This authorization shall also include and encompass any prior business entity as provided above. The Insurer or its representative may contact the undersigned Applicant's Insurance Brokers, Agents, Insurers, Attorneys or other such individuals for this information and its release.</p>
          
          <p>I understand that this warranty and authorization for release of information as provided above will be incorporated into the insurance contract.</p>
        </div>
        
        <div class="signature-section-page11">
          <div class="signature-field-page11">
            <div class="signature-label-page11"><strong>${data.companyName}</strong></div>
            <div class="signature-line-page11">${data.lossWarrantyCompanySignature || '_________________________'}</div>
            <div class="signature-row-page11">
              <div class="signature-label-small-page11" style="margin-right: auto;">Company/ Member</div>
              <div class="signature-label-small-page11">Date</div>
              <div class="signature-line-page11 signature-line-date-page11">${data.lossWarrantyDate || '_________________________'}</div>
            </div>
          </div>
          <div class="signature-field-page11">
            <div class="signature-label-page11">Signature of Partner, Officer, Principal or Owner</div>
            <div class="signature-line-page11">${data.lossWarrantySignature || '_________________________'}</div>
            <div class="signature-label-small-page11" style="margin-top: 0.05in;">Title</div>
            <div class="signature-line-page11">${data.lossWarrantyTitle || '_________________________'}</div>
          </div>
        </div>
        
        <div class="warranty-footer-page11">
          <p><strong>Warranty:</strong> The purpose of this no loss letter is to assist in the underwriting process information contained herein is specifically relied upon in determination of insurability. The undersigned, therefore, warrants that the information contained herein is true and accurate to the best of his/her knowledge, information and belief. This no loss letter shall be the basis of any insurance that may be issued and will be a part of such policy. It is understood that any misrepresentation or omission shall constitute grounds for immediate cancellation of coverage and denial of claims, if any. It is further understood that the applicant and or affiliated company is under a continuing obligation to immediately notify his/her underwriter through his/her broker of any material alteration of the information given.</p>
        </div>
        
        <div class="page-number page-number-page11">Page 11 of 12</div>
      </div>
    </div>
  `;
}

/**
 * Generate Page 12: Invoice Statement - ISC Format
 */
function generatePage12(data: ApplicationPacketData): string {
  const qrCodeText = `${data.applicationId}`;
  const qrCodePageText = `00${data.applicationId}P12`;

  return `
    <div class="page page12-isc" style="page-break-after: always;">
      <div class="sidebar sidebar-page12">
        <div class="logo-container logo-page12">
          <div class="logo logo-sterling-page12">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
              <defs>
                <linearGradient id="sterlingGradient1Page12" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#00BCD4" stop-opacity="0.9" />
                  <stop offset="100%" stop-color="#0097A7" stop-opacity="0.95" />
                </linearGradient>
                <linearGradient id="sterlingGradient2Page12" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.25" />
                  <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.1" />
                </linearGradient>
              </defs>
              <path d="M50 10 L80 25 L80 55 Q80 75 50 90 Q20 75 20 55 L20 25 Z" fill="url(#sterlingGradient1Page12)" />
              <path d="M50 25 L65 40 L50 70 L35 40 Z" fill="url(#sterlingGradient2Page12)" />
              <path d="M50 30 L50 65" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" />
              <path d="M40 47 L60 47" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" opacity="0.8" />
            </svg>
          </div>
        </div>
        <div class="sidebar-title-vertical page12-title">Invoice Statement</div>
        <div class="qr-container qr-page12">
          ${data.qrCodeDataUrl ? generateQRCodeHTML(data.qrCodeDataUrl) : `<div class="qr-code-text-only">${qrCodeText}</div>`}
          <div class="qr-text qr-text-page12">${qrCodeText}</div>
          <div class="qr-page qr-page-text-page12">${qrCodePageText}</div>
          <div class="applicant-icon applicant-icon-page12">
            <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 0.48in; height: 0.48in;">
              <circle cx="28" cy="16" r="8" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <path d="M12 50c0-6.627 5.373-12 12-12h8c6.627 0 12 5.373 12 12" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              <rect x="20" y="30" width="16" height="12" rx="2" stroke="#1f2937" stroke-width="2.5" fill="none"/>
              <path d="M24 30V26c0-1.105.895-2 2-2h4c1.105 0 2 .895 2 2v4" stroke="#1f2937" stroke-width="2.5" fill="none" stroke-linecap="round"/>
              <line x1="26" y1="36" x2="30" y2="36" stroke="#1f2937" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
          <div class="applicant-label applicant-label-page12">Producer</div>
        </div>
      </div>
      <div class="main-content main-content-page12">
        <div class="invoice-header-page12">
          <div class="invoice-field-page12"><strong>Program:</strong> ${data.programName || 'Standard GL A-Rated'}</div>
          <div class="invoice-field-page12"><strong>Applicant Name:</strong> ${data.companyName}</div>
          <div class="invoice-field-page12"><strong>Application ID:</strong> ${data.applicationId}</div>
        </div>
        
        <div class="invoice-section-page12">
          <div class="invoice-section-title-page12">TOTAL COST OF POLICY*</div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">Premium</div>
            <div class="invoice-value-page12">${data.premium || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">State Tax</div>
            <div class="invoice-value-page12">${data.stateTax || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">Association Dues</div>
            <div class="invoice-value-page12">${data.associationDues || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">Policy Fee</div>
            <div class="invoice-value-page12">${data.policyFee || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">Inspection Fee</div>
            <div class="invoice-value-page12">${data.inspectionFee || '$0.00'}</div>
          </div>
          <div class="invoice-row-total-page12">
            <div class="invoice-label-page12"><strong>TOTAL COST OF POLICY*</strong></div>
            <div class="invoice-value-page12"><strong>${data.totalCostOfPolicy || '$0.00'}</strong></div>
          </div>
        </div>
        
        <div class="invoice-section-page12">
          <div class="invoice-section-title-page12">TOTAL DEPOSIT*</div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% Premium</div>
            <div class="invoice-value-page12">${data.depositPremium || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% Association Dues</div>
            <div class="invoice-value-page12">${data.depositAssociationDues || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% State Tax</div>
            <div class="invoice-value-page12">${data.depositStateTax || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% Policy Fee</div>
            <div class="invoice-value-page12">${data.depositPolicyFee || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% Inspection Fee</div>
            <div class="invoice-value-page12">${data.depositInspectionFee || '$0.00'}</div>
          </div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% AI Processing Fee</div>
            <div class="invoice-value-page12">${data.aiProcessingFee || '$0.00'}</div>
          </div>
          <div class="invoice-row-total-page12">
            <div class="invoice-label-page12"><strong>TOTAL DEPOSIT*</strong></div>
            <div class="invoice-value-page12"><strong>${data.totalDeposit || '$0.00'}</strong></div>
          </div>
        </div>
        
        <div class="invoice-section-page12">
          <div class="invoice-section-title-page12">TOTAL TO RETAIN*</div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12">15% Commission on Total (${data.totalCostOfPolicy || '$0.00'})</div>
            <div class="invoice-value-page12">${data.totalToRetain || '$0.00'}</div>
          </div>
          <div class="invoice-row-total-page12">
            <div class="invoice-label-page12"><strong>TOTAL TO RETAIN*</strong></div>
            <div class="invoice-value-page12"><strong>${data.totalToRetain || '$0.00'}</strong></div>
          </div>
        </div>
        
        <div class="invoice-section-page12">
          <div class="invoice-section-title-page12">TOTAL TO BE SENT</div>
          <div class="invoice-row-page12">
            <div class="invoice-label-page12"><strong>MAKE CHECK PAYABLE FOR</strong></div>
            <div class="invoice-value-page12"><strong>${data.totalToBeSent || '$0.00'}</strong></div>
          </div>
        </div>
        
        <div class="payment-option-page12"><strong>Payment Option:</strong> ${data.paymentOption || '3rd Party Finance'}</div>
        
        <div class="binding-statement-page12">
          <p>The binding of this insurance policy is an agreement to the above-referenced prices and its terms and conditions</p>
          <div class="signature-field-page12">
            <div class="signature-label-page12">Signature of Producer (Agent or Broker):</div>
            <div class="signature-line-page12">${data.invoiceProducerSignature || '_________________________'}</div>
          </div>
        </div>
        
        <div class="invoice-disclaimer-page12">
          <p>*Please note that any added agency broker fee or other charge, fee or cost assessed to the insured is your sole responsibility. All such amounts added in connection with this policy shall be in compliance with all applicable state and federal law.</p>
        </div>
        
        <div class="page-number page-number-page12">Page 12 of 12</div>
      </div>
    </div>
  `;
}

/** State display names for state forms section */
const STATE_DISPLAY_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California',
  CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts',
  MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana',
  NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico',
  NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  DC: 'District of Columbia',
};

/** Resolve state name or 2-letter code to 2-letter code (e.g. "Pennsylvania" -> "PA"). */
function toStateCode(state: string): string {
  const s = (state || '').trim();
  if (!s) return '';
  const upper = s.toUpperCase();
  if (s.length === 2) return upper;
  const entry = Object.entries(STATE_DISPLAY_NAMES).find(([, name]) => name.toLowerCase() === s.toLowerCase());
  return entry ? entry[0] : upper.slice(0, 2);
}

/** Shared wrapper for Pennsylvania form pages — full width, no sidebar. */
function paFormPageWrapper(data: ApplicationPacketData, pageLabel: string, bodyHtml: string): string {
  return `
    <div class="page state-forms-isc pa-form-page pa-form-no-sidebar" style="page-break-after: always;">
      <div class="pa-form-content-full">
        ${bodyHtml}
        <div class="pa-form-page-number">${pageLabel}</div>
      </div>
    </div>
  `;
}

/**
 * Pennsylvania 1609-PR (REV. 08/12) – Page 1: Header, boxes, intro, DECLARATION BY PRODUCER grid and footnotes.
 */
function generatePennsylvaniaFormPage1(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const location = data.applicantAddress || '';
  const city = data.applicantCity || '';
  const state = data.applicantState || '';
  const zip = data.applicantZip || '';
  const coverageType = data.coverageType || data.quoteType || '';
  const workDesc = data.workDescription || '';
  const aggregateLimit = data.aggregateLimit || '';
  const occurrenceLimit = data.occurrenceLimit || '';
  const dates = data.desiredCoverageDates || '';
  const [fromDate = '', toDate = ''] = dates.includes(' - ') ? dates.split(' - ').map((s: string) => s.trim()) : [dates, ''];

  const body = `
    <div class="pa-form-doc">
      <div class="pa-form-header-block">
        <div class="pa-form-title">COMMONWEALTH OF PENNSYLVANIA INSURANCE DEPARTMENT</div>
        <div class="pa-form-meta">
          <span class="pa-form-rev">1609-PR (REV. 08/12)</span>
          <span class="pa-form-note">(Must be included with SLL Affidavit type 1609-SLL/1609-PR)</span>
        </div>
      </div>
      <div class="pa-form-two-boxes">
        <div class="pa-form-box pa-form-box-left">
          <div class="pa-form-box-title">Pennsylvania Surplus Lines Association</div>
          <div class="pa-form-box-address">180 Sheree Blvd., Suite 3100</div>
          <div class="pa-form-box-address">Exton, PA  19341</div>
        </div>
        <div class="pa-form-box pa-form-box-right">
          <div class="pa-form-id-row"><span class="pa-form-id-label">Customer ID #</span><span class="pa-ul pa-ul-id"></span></div>
          <div class="pa-form-id-row"><span class="pa-form-id-label">Policy #</span><span class="pa-ul pa-ul-id"></span></div>
          <div class="pa-form-id-row"><span class="pa-form-id-label">Binder #</span><span class="pa-ul pa-ul-id"></span></div>
        </div>
      </div>
      <p class="pa-form-intro">
        Report of transactions with unlicensed insurer(s) in accordance with Section 1609 of Article XVI, Surplus Lines of the Insurance Company Law, Act of May 17, 1921, P.L. 682, No. 284, as amended
      </p>
      <div class="pa-form-section-title">DECLARATION BY PRODUCER</div>
      <table class="pa-form-declaration-table" cellpadding="0" cellspacing="0">
        <colgroup>
          <col class="pa-form-col-label" />
          <col class="pa-form-col-input" />
          <col class="pa-form-col-small" />
          <col class="pa-form-col-small" />
          <col class="pa-form-col-small" />
        </colgroup>
        <tr>
          <td class="pa-form-td-label">Insured Name</td>
          <td class="pa-form-td-input" colspan="4"><span class="pa-ul pa-ul-long">${insuredName}</span></td>
        </tr>
        <tr>
          <td class="pa-form-td-label">Location of Risk***</td>
          <td class="pa-form-td-input"><span class="pa-ul pa-ul-mid">${location}</span></td>
          <td class="pa-form-td-small"><span class="pa-form-cell-label">City</span><span class="pa-ul pa-ul-short">${city}</span></td>
          <td class="pa-form-td-small"><span class="pa-form-cell-label">State</span><span class="pa-ul pa-ul-short">${state}</span></td>
          <td class="pa-form-td-small"><span class="pa-form-cell-label">Zip</span><span class="pa-ul pa-ul-short">${zip}</span></td>
        </tr>
        <tr>
          <td class="pa-form-td-label">Type of Coverage:</td>
          <td class="pa-form-td-input"><span class="pa-ul pa-ul-long">${coverageType}</span></td>
          <td class="pa-form-td-label">Description of Insured's Operation:</td>
          <td class="pa-form-td-input" colspan="2"><span class="pa-ul pa-ul-long">${workDesc}</span></td>
        </tr>
        <tr>
          <td class="pa-form-td-label">Amount of Insurance<br/><span class="pa-form-label-sub">(Total Insured Value)</span></td>
          <td class="pa-form-td-small"><span class="pa-form-cell-label">Property*</span><span class="pa-ul pa-ul-amt">${aggregateLimit ? '$ ' + aggregateLimit : ''}</span></td>
          <td class="pa-form-td-small" colspan="3"><span class="pa-form-cell-label">Casualty**</span><span class="pa-ul pa-ul-amt">${occurrenceLimit ? '$ ' + occurrenceLimit : ''}</span></td>
        </tr>
        <tr>
          <td class="pa-form-td-label">Effective Dates<br/><span class="pa-form-label-sub">(term) of Coverage</span></td>
          <td class="pa-form-td-small"><span class="pa-form-cell-label">FROM</span><span class="pa-ul pa-ul-date">${fromDate}</span></td>
          <td class="pa-form-td-small" colspan="3"><span class="pa-form-cell-label">TO</span><span class="pa-ul pa-ul-date">${toDate}</span></td>
        </tr>
      </table>
      <div class="pa-form-footnotes">
        <span>*Total Insured Value</span>
        <span>** General or Policy Aggregate</span>
        <span>***If more than one location of risk, then give address with most exposure</span>
      </div>
      <p class="pa-form-declaration">
        I declare under the penalties provided for perjury, that I have made a diligent effort to procure the insurance coverage described above from licensed insurers which are authorized to transact the kind of insurance involved and which provide, in the usual course of business, coverage comparable to the coverage being sought and have been unable to procure said insurance. I have documented a declination of coverage from at least three admitted insurers.
      </p>
      <p class="pa-form-declaration">
        I further declare under the penalties provided for perjury, that at the time of presenting a quotation to the insured, the insured was given notice in writing, either directly or through the producer, that:
      </p>
      <p class="pa-form-notice">
        The insurer with whom the insurance is to be placed is not admitted to transact business in this Commonwealth and is subject to limited regulation by the Department; and in the event of the insolvency of the insurer, losses will not be paid by the Pennsylvania Property and Casualty Insurance Guaranty Association.
      </p>
      <p class="pa-form-legal pa-form-legal-dark">
        ALL applicable provisions of ARTICLE XVI of the Insurance Company Law (40 P.S. §991.1601 et seq.) and Title 31 PA Code, Chapter 124 have been or will be complied with.
      </p>
      <div class="pa-form-producer-block">
        <div class="pa-form-producer-col">
          <div class="pa-form-producer-row">
            <span class="pa-form-label pa-form-label-dark">Name of Producer Agency:</span>
            <span class="pa-ul pa-ul-producer">${data.agencyName || ''}</span>
          </div>
          <div class="pa-form-hint">(Type or Print Name of Producer Agency)</div>
          <div class="pa-form-producer-row">
            <span class="pa-form-label pa-form-label-dark">Name of Producer:</span>
            <span class="pa-ul pa-ul-producer">${data.agencyContactName || ''}</span>
          </div>
          <div class="pa-form-hint">(Type or Print Name of Individual Producer)</div>
        </div>
        <div class="pa-form-producer-col">
          <div class="pa-form-producer-row">
            <span class="pa-form-label pa-form-label-dark">License # of Producer Agency:</span>
            <span class="pa-ul pa-ul-producer"></span>
          </div>
          <div class="pa-form-hint">(Agency's License No.)</div>
          <div class="pa-form-producer-row">
            <span class="pa-form-label pa-form-label-dark">License # of Producer:</span>
            <span class="pa-ul pa-ul-producer"></span>
          </div>
          <div class="pa-form-hint">(Individual's License No.)</div>
        </div>
      </div>
      <div class="pa-form-signature-block">
        <span class="pa-form-label pa-form-sig-label">Signature of Producer</span>
        <span class="pa-ul pa-ul-sig"></span>
        <span class="pa-form-label pa-form-date-label pa-form-label-dark">Date:</span>
        <span class="pa-ul pa-ul-date-sig"></span>
      </div>
      <div class="pa-form-sig-hint">(Signature of Producer)</div>
    </div>
  `;
  return paFormPageWrapper(data, 'Pennsylvania 1609-PR – Page 1', body);
}

/**
 * Pennsylvania 1609-SLL – Page 2: Electronic Signature Addendum to the Declaration
 */
function generatePennsylvaniaFormPage2(data: ApplicationPacketData): string {
  const policyNum = ''; // Policy # filled at binding
  const effectiveDate = data.desiredCoverageDates || '';
  const [fromDate = ''] = effectiveDate.includes(' - ') ? effectiveDate.split(' - ').map((s: string) => s.trim()) : [effectiveDate];

  const body = `
    <div class="pa-form-doc pa-form-addendum">
      <div class="pa-form-addendum-title">Electronic Signature 1609-SLL Addendum to the Declaration</div>
      <p class="pa-form-addendum-intro">
        With respect to this filing for Policy #<span class="pa-ul pa-ul-addendum">${policyNum}</span> with a policy effective date of <span class="pa-ul pa-ul-addendum">${fromDate}</span>,
        consisting of the 1609-SLL and the 1609-PR in combination, the following is applicable.
      </p>
      <p class="pa-form-addendum-body">
        By submitting this addendum to the Pennsylvania Surplus Lines Association, I affirm that I am a
        duly licensed Surplus Lines Licensee, and that I have entered into an agreement with the duly
        licensed Producer indicated on the 1609-PR, forming a part of this Surplus Lines filing. This
        declaration is being submitted electronically and that the electronic signature appearing on this
        1609-PR provided by the duly licensed producer is in accordance with said agreement.
      </p>
    </div>
  `;
  return paFormPageWrapper(data, 'Pennsylvania 1609-SLL – Page 2', body);
}

/**
 * Washington Surplus Lines Certification form
 */
function generateWashingtonFormPage(data: ApplicationPacketData): string {
  const stateName = toStateCode(data.applicantState || '') === 'WA' ? 'Washington' : (data.applicantState || '');
  const insuredName = data.companyName || '';
  const coverageProvided = data.coverageType || data.quoteType || '';
  const producerName = data.agencyContactName || '';
  const agencyName = data.agencyName || '';

  const body = `
    <div class="wa-form-doc">
      <div class="wa-form-header">
        <div class="wa-form-badge">OFFICIAL DOCUMENT</div>
        <div class="wa-form-title">State of Washington</div>
        <div class="wa-form-subtitle">Office of the Insurance Commissioner</div>
        <div class="wa-form-doc-type">Surplus Lines Certification</div>
      </div>
      <div class="wa-form-info-block">
        <div class="wa-form-block-label">Filing Information</div>
        <div class="wa-form-field-row">
          <span class="wa-form-field-label">To</span>
          <span class="wa-form-field-sep">:</span>
          <span class="wa-form-field-value">Insurance Commissioner</span>
        </div>
        <div class="wa-form-field-row">
          <span class="wa-form-field-label">State</span>
          <span class="wa-form-field-sep">:</span>
          <span class="wa-form-ul wa-form-ul-long">${stateName}</span>
          <span class="wa-form-field-hint">(State insured is located in)</span>
        </div>
        <div class="wa-form-field-row">
          <span class="wa-form-field-label">Insured Name</span>
          <span class="wa-form-field-sep">:</span>
          <span class="wa-form-ul wa-form-ul-long">${insuredName}</span>
        </div>
        <div class="wa-form-field-row">
          <span class="wa-form-field-label">Coverage Provided</span>
          <span class="wa-form-field-sep">:</span>
          <span class="wa-form-ul wa-form-ul-long">${coverageProvided}</span>
        </div>
      </div>
      <div class="wa-form-producer-section">
        <div class="wa-form-block-label">Certifying Party</div>
        <div class="wa-form-producer-row">
          <span class="wa-form-field-label">I</span>
          <span class="wa-form-ul wa-form-ul-producer">${producerName}</span>
          <span class="wa-form-field-label">of</span>
          <span class="wa-form-ul wa-form-ul-agency">${agencyName}</span>
        </div>
        <div class="wa-form-producer-hints">
          <span class="wa-form-producer-hint">Producer/Agent</span>
          <span class="wa-form-producer-hint">Agency Name</span>
        </div>
      </div>
      <div class="wa-form-certify-block">
        <p class="wa-form-certify">
          hereby certify that I have made diligent effort to place this insurance with companies
          admitted to write business in the state of <span class="wa-form-ul wa-form-ul-inline">${stateName}</span> for this class. I am unable
          to place the full amount or kind of insurance with companies admitted to transact and
          who are actually writing the particular kind and class of insurance in this state. I am
          therefore placing this insurance in the <span class="wa-form-emphasis">SURPLUS LINES MARKET</span>.
        </p>
      </div>
      <div class="wa-form-disclosure-section">
        <div class="wa-form-block-label">Required Disclosure</div>
        <p class="wa-form-disclosure-intro">
          The Insured was expressly advised prior to placement of this insurance in the <span class="wa-form-emphasis">SURPLUS LINES</span> market that:
        </p>
        <div class="wa-form-disclosure-list">
          <div class="wa-form-disclosure-item">
            <span class="wa-form-bullet">A</span>
            <span>The Surplus Lines insurer with whom the insurance was placed is not licensed in this state and is not subject to its supervision.</span>
          </div>
          <div class="wa-form-disclosure-item">
            <span class="wa-form-bullet">B</span>
            <span>In the event of the insolvency of the SURPLUS LINES insurer, losses will not be paid by the STATE INSURANCE GUARANTY FUND.</span>
          </div>
        </div>
      </div>
      <div class="wa-form-signature-block">
        <div class="wa-form-block-label">Authorized Signature</div>
        <div class="wa-form-sig-row">
          <span class="wa-form-sig-label">Signature of Producing Agent</span>
          <span class="wa-form-ul wa-form-ul-sig"></span>
        </div>
        <div class="wa-form-date-row">
          <span class="wa-form-date-label">Date</span>
          <span class="wa-form-ul wa-form-ul-date"></span>
        </div>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Washington Surplus Lines Certification', body);
}

/**
 * Texas Diligent Effort form (Form No. 1.1) — SLTX style
 * Uses sltxLogoBase64 when provided (from public/logos/sltx-logo.png)
 */
function generateTexasFormPage(data: ApplicationPacketData, sltxLogoBase64?: string): string {
  const insuredName = data.companyName || '';
  const agencyName = data.agencyName || '';
  const agencyContactName = data.agencyContactName || '';
  const coverageType = data.coverageType || data.quoteType || '';
  const carrierName = data.carrierName || '';

  const body = `
    <div class="tx-form-doc">
      <div class="tx-form-header">
        <div class="tx-form-logo">
          ${sltxLogoBase64
      ? `<img src="${sltxLogoBase64}" alt="SLTX" class="tx-logo-img" />`
      : `<div class="tx-logo-wrapper">
            <div class="tx-logo-svg-wrap">
              <svg class="tx-logo-svg" viewBox="0 0 120 52" xmlns="http://www.w3.org/2000/svg">
                <text x="0" y="34" fill="#ff6600" font-family="Arial,sans-serif" font-weight="bold" font-size="24">SL</text>
                <text x="32" y="34" fill="none" stroke="#0066b3" stroke-width="1.2" font-family="Arial,sans-serif" font-weight="bold" font-size="24" paint-order="stroke">TX</text>
                <line x1="72" y1="42" x2="112" y2="10" stroke="#0066b3" stroke-width="1.2"/>
                <line x1="68" y1="46" x2="108" y2="14" stroke="#ff6600" stroke-width="1.2"/>
                <line x1="2" y1="48" x2="44" y2="32" stroke="#0066b3" stroke-width="1.5"/>
                <line x1="6" y1="46" x2="48" y2="30" stroke="#ff6600" stroke-width="1.5"/>
                <line x1="10" y1="44" x2="52" y2="28" stroke="#d4a574" stroke-width="1.5"/>
                <line x1="14" y1="42" x2="56" y2="26" stroke="#0066b3" stroke-width="1.5"/>
              </svg>
            </div>
            <div class="tx-logo-text">
              <span class="tx-logo-surplus">SURPLUS<sup>™</sup></span>
              <span class="tx-logo-lines">LINES</span>
              <span class="tx-logo-office">STAMPING OFFICE OF TEXAS</span>
            </div>
          </div>`}
        </div>
        <div class="tx-form-number">Form No. 1.1</div>
      </div>
      <h1 class="tx-form-title">Texas Diligent Effort</h1>
      <p class="tx-form-intro">
        Form may serve as evidence that diligent effort was performed in accordance with
        <span class="tx-form-link">Texas Insurance Code §981.004</span>.
      </p>
      <div class="tx-form-section">
        <div class="tx-section-title">BROKER INFORMATION</div>
        <div class="tx-field-row"><span class="tx-field-label">Retail Broker:</span><span class="tx-ul tx-ul-long">${agencyName}</span></div>
        <div class="tx-field-row"><span class="tx-field-label">Retail Broker License No.:</span><span class="tx-ul tx-ul-long"></span></div>
        <div class="tx-field-row"><span class="tx-field-label">Surplus Lines Broker:</span><span class="tx-ul tx-ul-long"></span></div>
        <div class="tx-field-row"><span class="tx-field-label">Surplus Lines Broker License No.:</span><span class="tx-ul tx-ul-long"></span></div>
        <div class="tx-field-row tx-options-row">
          <span class="tx-field-label">Broker Type:</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Wholesale Broker</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Managing General Agent</span>
        </div>
      </div>
      <div class="tx-form-section">
        <div class="tx-section-title">POLICY INFORMATION</div>
        <div class="tx-field-row"><span class="tx-field-label">Policy/Binder No.:</span><span class="tx-ul tx-ul-long"></span></div>
        <div class="tx-field-row"><span class="tx-field-label">Insured Name:</span><span class="tx-ul tx-ul-long">${insuredName}</span></div>
        <div class="tx-field-row tx-options-row">
          <span class="tx-field-label">Coverage Type:</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Personal</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Commercial</span>
        </div>
      </div>
      <div class="tx-form-section tx-form-section-carrier">
        <div class="tx-section-title">CARRIER INFORMATION</div>
        <div class="tx-field-row"><span class="tx-field-label">Surplus Lines Carrier:</span><span class="tx-ul tx-ul-long">${carrierName}</span></div>
        <div class="tx-field-row"><span class="tx-field-label">Declination(s):</span><span class="tx-ul tx-ul-long"></span></div>
        <div class="tx-field-row tx-options-row tx-options-three">
          <span class="tx-field-label">Declination Reason:</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Capacity Reached</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Underwriting Reason</span>
          <span class="tx-option"><span class="tx-checkbox">□</span> Other</span>
        </div>
        <div class="tx-field-row"><span class="tx-field-label">Comment (if any):</span><span class="tx-ul tx-ul-long"></span></div>
      </div>
      <div class="tx-form-section">
        <div class="tx-section-title">SURPLUS LINES PRINCIPAL BROKER ACKNOWLEDGEMENT</div>
        <p class="tx-ack-statement">An attempt to place this business with the admitted market was performed.</p>
        <div class="tx-sig-block">
          <div class="tx-sig-row">
            <span class="tx-field-label">Signed:</span><span class="tx-ul tx-ul-sig"></span>
          </div>
          <div class="tx-sig-row tx-sig-row-date">
            <span class="tx-field-label">Date:</span><span class="tx-ul tx-ul-date"></span>
          </div>
          <div class="tx-sig-row">
            <span class="tx-field-label">Printed Name:</span><span class="tx-ul tx-ul-long">${agencyContactName}</span>
          </div>
        </div>
      </div>
      <div class="tx-form-footer">
        <p class="tx-footer-italic">Attach additional correspondence as evidence and file with SLTX and/or keep for your records in the event of audits, investigations, or lawsuits.</p>
        <p class="tx-footer-italic">Texas does not have an export or white list for surplus lines coverage. Workers' compensation and private passenger auto are prohibited coverages in the Texas excess and surplus lines market.</p>
        <p class="tx-footer-bullet"><span class="tx-form-link">*Exempt commercial purchasers (TIC 981.0031)</span> need not provide evidence of diligent effort.</p>
        <p class="tx-footer-bullet"><span class="tx-form-link">*Industrial insureds (TIC 981.0033)</span> need not provide evidence of diligent effort.</p>
        <p class="tx-disclaimer"><strong>Disclaimer:</strong> SLTX is not liable for determining if diligent effort has occurred, as determinations are made in Texas by a court of law.</p>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Texas Diligent Effort – Form No. 1.1', body);
}

/**
 * Oregon Diligent Search Statement form
 */
function generateOregonFormPage(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const coverageType = data.coverageType || data.quoteType || '';
  const dates = data.desiredCoverageDates || '';
  const [inceptionDate = '', expirationDate = ''] = dates.includes(' - ') ? dates.split(' - ').map((s: string) => s.trim()) : [dates, ''];

  const body = `
    <div class="or-form-doc">
      <h1 class="or-form-title">DILIGENT SEARCH STATEMENT</h1>
      <div class="or-form-fields">
        <div class="or-field-row">
          <span class="or-field-label">To:</span>
          <span class="or-field-value">Insurance Commissioner, State of Oregon</span>
        </div>
        <div class="or-field-row">
          <span class="or-field-label">Insured Name:</span>
          <span class="or-ul or-ul-long">${insuredName}</span>
        </div>
        <div class="or-field-row">
          <span class="or-field-label">Policy Number:</span>
          <span class="or-ul or-ul-long"></span>
        </div>
        <div class="or-field-row">
          <span class="or-field-label">Policy Inception Date:</span>
          <span class="or-ul or-ul-long">${inceptionDate}</span>
        </div>
        <div class="or-field-row">
          <span class="or-field-label">Policy Expiration Date:</span>
          <span class="or-ul or-ul-long">${expirationDate}</span>
        </div>
        <div class="or-field-row">
          <span class="or-field-label">Type of Coverage Provided:</span>
          <span class="or-ul or-ul-long">${coverageType}</span>
        </div>
      </div>
      <p class="or-paragraph">
        I have determined that, as per the definition as stated in the federal <strong>Nonadmitted and Reinsurance Reform Act of 2010 Sec. 527</strong>, Oregon is the "home state" for this policy. (A copy of the federal Nonadmitted and Reinsurance Reform Act of 2010 can be viewed online at <a href="https://www.OregonSLA.org" class="or-link">www.OregonSLA.org</a> under "Publications").
      </p>
      <p class="or-paragraph or-indent">
        The Insured was expressly advised prior to placement of this insurance in the <strong>SURPLUS LINE MARKET</strong> that:
      </p>
      <div class="or-bullets">
        <p class="or-bullet"><strong>A.</strong> The Surplus Lines insurer with whom the insurance was placed is not licensed in this state and is not subject to its supervision.</p>
        <p class="or-bullet"><strong>B.</strong> In the event of the insolvency of the <strong>SURPLUS LINES</strong> insurer, losses will not be paid by the <strong>STATE INSURANCE GUARANTY FUND</strong>.</p>
      </div>
      <div class="or-select-prompt">
        <span class="or-select-text">Select (check) Statement 1, Statement 2, OR Statement 3:</span>
      </div>
      <div class="or-red-divider">
        <span class="or-red-arrow">→</span>
        <span class="or-red-dash"></span>
      </div>
      <div class="or-statement or-statement-1">
        <p class="or-statement-title"><span class="or-checkbox"></span> Statement 1:</p>
        <p class="or-statement-text">I hereby certify that I have made a diligent effort to place this insurance with companies admitted to write business in Oregon for this class. I am unable to place the full amount or kind of insurance with companies admitted to transact and who are actually writing the particular kind and class of insurance in this state. I am therefore placing this insurance in the <strong>SURPLUS LINE MARKET</strong>.</p>
      </div>
      <div class="or-dash-line"></div>
      <div class="or-statement or-statement-2">
        <p class="or-statement-title"><span class="or-checkbox"></span> Statement 2:</p>
        <p class="or-statement-text">I have determined that the insured is currently registered with Oregon as a <strong>Risk Purchasing Group (RPG)</strong>, to purchase liability insurance on a group basis, and that this policy placement is exempt from the Diligent Search requirement.</p>
      </div>
      <div class="or-dash-line"></div>
      <div class="or-statement or-statement-3">
        <p class="or-statement-title"><span class="or-checkbox"></span> Statement 3:</p>
        <p class="or-statement-text">I have determined that, as per the definition as stated in the <strong>Nonadmitted and Reinsurance Reform Act of 2010 Sec. 527</strong>, this insured is an <strong>exempt commercial purchaser</strong>, that the requirements as set forth in the federal <strong>Nonadmitted and Reinsurance Reform Act of 2010 Sec. 525</strong> have been complied with, and that this policy placement is exempt from the Diligent Search requirement. (A copy of the federal Nonadmitted and Reinsurance Reform Act of 2010 can be viewed online at <a href="https://www.OregonSLA.org" class="or-link">www.OregonSLA.org</a> under "Publications").</p>
      </div>
      <div class="or-dash-line"></div>
      <div class="or-signature-block">
        <div class="or-sig-row">
          <span class="or-field-label">Printed Name of Producing Agent</span>
          <span class="or-ul or-ul-sig">${data.agencyContactName || ''}</span>
        </div>
        <div class="or-sig-row">
          <span class="or-field-label">Signature of Producing Agent</span>
          <span class="or-ul or-ul-sig"></span>
        </div>
        <div class="or-sig-row">
          <span class="or-field-label">Printed Name of Agency</span>
          <span class="or-ul or-ul-sig">${data.agencyName || ''}</span>
        </div>
        <div class="or-sig-row">
          <span class="or-field-label">Date Signed</span>
          <span class="or-ul or-ul-date"></span>
        </div>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Oregon Diligent Search Statement', body);
}

/**
 * Nevada Surplus Lines Association – DECLINATION DETAIL (NSLA 105)
 */
function generateNevadaFormPage(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const brokerName = data.agencyContactName || '';
  const agencyName = data.agencyName || '';

  const body = `
    <div class="nv-form-doc">
      <div class="nv-form-header">
        <h1 class="nv-form-org">Nevada Surplus Lines Association</h1>
        <h2 class="nv-form-title">DECLINATION DETAIL</h2>
      </div>
      
      <p class="nv-form-intro">
        This form is to be used when the policy provides insurance for coverage that cannot be written with admitted insurers. (Category is not listed on open lines eligible for export). In pursuant of 685A.215 of NRS, identify three admitted insurers marketing the class of insurance that declined the risk. Include with this submission form NSLA 101.
      </p>
      
      <div class="nv-form-field-row">
        <span class="nv-form-label">NAME OF INSURED</span>
        <span class="nv-form-ul nv-form-ul-long">${insuredName}</span>
      </div>
      <div class="nv-form-field-row">
        <span class="nv-form-label">POLICY NUMBER</span>
        <span class="nv-form-ul nv-form-ul-long"></span>
      </div>
      
      <div class="nv-form-decline-block">
        <p class="nv-form-decline-heading">1.</p>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Admitted Insurer</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Address</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row nv-form-row-two-col">
          <span class="nv-form-label">Phone Number</span>
          <span class="nv-form-ul nv-form-ul-phone"></span>
          <span class="nv-form-label nv-form-label-underwriter">Underwriter</span>
          <span class="nv-form-ul nv-form-ul-underwriter"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Reason For Declination (enter code from bottom)</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
      </div>
      
      <div class="nv-form-decline-block">
        <p class="nv-form-decline-heading">2.</p>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Admitted Insurer</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Address</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row nv-form-row-two-col">
          <span class="nv-form-label">Phone Number</span>
          <span class="nv-form-ul nv-form-ul-phone"></span>
          <span class="nv-form-label nv-form-label-underwriter">Underwriter</span>
          <span class="nv-form-ul nv-form-ul-underwriter"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Reason For Declination (enter code from bottom)</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
      </div>
      
      <div class="nv-form-decline-block">
        <p class="nv-form-decline-heading">3.</p>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Admitted Insurer</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Address</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
        <div class="nv-form-field-row nv-form-row-two-col">
          <span class="nv-form-label">Phone Number</span>
          <span class="nv-form-ul nv-form-ul-phone"></span>
          <span class="nv-form-label nv-form-label-underwriter">Underwriter</span>
          <span class="nv-form-ul nv-form-ul-underwriter"></span>
        </div>
        <div class="nv-form-field-row">
          <span class="nv-form-label">Reason For Declination (enter code from bottom)</span>
          <span class="nv-form-ul nv-form-ul-long"></span>
        </div>
      </div>
      
      <p class="nv-form-codes-heading">Reason for Declination Codes:</p>
      <div class="nv-form-codes-grid">
        <div class="nv-form-codes-col">
          <p class="nv-form-code-item">1 – Unacceptable class of business</p>
          <p class="nv-form-code-item">2 – Age of building</p>
          <p class="nv-form-code-item">3 – Declined to quote</p>
          <p class="nv-form-code-item">4 – Doesn't fit underwriting requirement</p>
        </div>
        <div class="nv-form-codes-col">
          <p class="nv-form-code-item">5 – No Market</p>
          <p class="nv-form-code-item">6 – No Prior Insurance</p>
          <p class="nv-form-code-item">7 – Excessive claims</p>
          <p class="nv-form-code-item">8 – Other (please explain)</p>
        </div>
      </div>
      
      <p class="nv-form-explanation">
        <strong>PLEASE</strong> PROVIDE ANY ADDITIONAL EXPLANATION AND EFFORTS TO PLACE THIS INSURANCE WITH AN ADMITTED INSURER THAT WOULD HELP SUPPORT THE NEED TO PLACE THE POLICY WITH A SURPLUS LINES COMPANY.
      </p>
      
      <div class="nv-form-sig-block">
        <div class="nv-form-sig-row nv-form-sig-left">
          <span class="nv-form-label">PRINT BROKER'S NAME</span>
          <span class="nv-form-ul nv-form-ul-sig">${brokerName}</span>
        </div>
        <div class="nv-form-sig-row nv-form-sig-center">
          <span class="nv-form-label">SIGNATURE</span>
          <span class="nv-form-ul nv-form-ul-sig"></span>
        </div>
        <div class="nv-form-sig-row nv-form-sig-right">
          <span class="nv-form-label">DATE</span>
          <span class="nv-form-ul nv-form-ul-sig"></span>
        </div>
      </div>
      
      <div class="nv-form-footer">
        <span class="nv-form-footer-left">NSLA 105 7/01/99</span>
        <span class="nv-form-footer-right">*Signature date must be the effective date or prior*</span>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Nevada Surplus Lines Association – Declination Detail', body);
}

/**
 * Florida Surplus Lines Disclosure and Acknowledgement
 */
function generateFloridaFormPage(data: ApplicationPacketData): string {
  const agencyName = data.agencyName || '';
  const insuredName = data.companyName || '';
  const carrierName = data.carrierName || '';
  const coverageType = data.coverageType || data.quoteType || '';
  const effectiveDate = data.desiredCoverageDates ? data.desiredCoverageDates.split(' - ').map((s: string) => s.trim())[0] || 'TBD' : 'TBD';

  const body = `
    <div class="fl-form-doc">
      <h1 class="fl-form-title">Surplus Lines Disclosure and Acknowledgement</h1>
      
      <p class="fl-form-paragraph">
        At my direction, <span class="fl-form-ul fl-form-ul-agency">${agencyName}</span> has placed my coverage in the surplus lines market.
      </p>
      <p class="fl-form-hint">*name of insurance agency*</p>
      
      <p class="fl-form-paragraph">
        As required by Florida Statute 626.916, I have agreed to this placement. I understand that coverage may be available in the admitted market and that persons insured by surplus lines carriers are not protected by the Florida Insurance Guaranty Act with respect to any right of recovery for the obligation of an insolvent unlicensed insurer. Additionally, I understand surplus lines insurers' policy rates and forms are not approved by any Florida regulatory agency.
      </p>
      
      <p class="fl-form-paragraph">
        I further understand the policy forms, conditions, premiums, and deductibles used by surplus lines insurers may be different from those found in policies used in the admitted market. I have been advised to carefully read the entire policy.
      </p>
      
      <div class="fl-form-field-block">
        <span class="fl-form-ul fl-form-ul-field">${insuredName}</span>
        <span class="fl-form-label-below">Named Insured</span>
      </div>
      
      <div class="fl-form-sig-row">
        <div class="fl-form-sig-left">
          <div class="fl-form-sig-line-row">
            <span class="fl-form-label-inline">By:</span>
            <span class="fl-form-ul fl-form-ul-sig"></span>
          </div>
          <span class="fl-form-label-below">Signature of Named Insured</span>
        </div>
        <div class="fl-form-sig-right">
          <div class="fl-form-sig-line-row">
            <span class="fl-form-label-inline">Date</span>
            <span class="fl-form-ul fl-form-ul-date"></span>
          </div>
          <span class="fl-form-label-below">Date</span>
        </div>
      </div>
      
      <div class="fl-form-field-block">
        <span class="fl-form-ul fl-form-ul-long"></span>
        <span class="fl-form-label-below">Printed Name and Title of Person Signing</span>
      </div>
      
      <div class="fl-form-field-block">
        <span class="fl-form-ul fl-form-ul-field">${carrierName}</span>
        <span class="fl-form-label-below">Name of Excess and Surplus Lines Carrier</span>
      </div>
      
      <div class="fl-form-field-block">
        <span class="fl-form-ul fl-form-ul-field">${coverageType}</span>
        <span class="fl-form-label-below">Type of Insurance</span>
      </div>
      
      <div class="fl-form-field-block">
        <span class="fl-form-ul fl-form-ul-field">${effectiveDate}</span>
        <span class="fl-form-label-below">Effective Date of Coverage</span>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Florida Surplus Lines Disclosure and Acknowledgement', body);
}

/**
 * California Important Notice – Surplus Line Disclosure (Page 1)
 */
function generateCaliforniaFormPage1(data: ApplicationPacketData): string {
  const body = `
    <div class="ca-form-doc">
      <h1 class="ca-form-title">IMPORTANT NOTICE:</h1>
      <div class="ca-form-content">
        <p class="ca-form-item"><strong>1.</strong> The insurance policy that you are applying to purchase is being issued by an insurer that is not licensed by the State of California. These companies are called "nonadmitted" or "surplus line" insurers.</p>
        <p class="ca-form-item"><strong>2.</strong> The insurer is not subject to the financial solvency regulation and enforcement that apply to California licensed insurers.</p>
        <p class="ca-form-item"><strong>3.</strong> The insurer does not participate in any of the insurance guarantee funds created by California law. Therefore, these funds will not pay your claims or protect your assets if the insurer becomes insolvent and is unable to make payments as promised.</p>
        <p class="ca-form-item"><strong>4.</strong> The insurer should be licensed either as a foreign insurer in another state in the United States or as a non-United States (alien) insurer. You should ask questions of your insurance agent, broker, or "surplus line" broker or contact the California Department of Insurance at the toll-free number 1-800-927-4357 or internet website www.insurance.ca.gov. Ask whether or not the insurer is licensed as a foreign or non-United States (alien) insurer and for additional information about the insurer. You may also visit the NAIC's internet website at www.naic.org. The NAIC—the National Association of Insurance Commissioners—is the regulatory support organization created and governed by the chief insurance regulators in the United States.</p>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'California Surplus Line Disclosure (Page 1)', body);
}

/**
 * California Important Notice – Surplus Line Disclosure (Page 2)
 */
function generateCaliforniaFormPage2(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const body = `
    <div class="ca-form-doc">
      <div class="ca-form-content">
        <p class="ca-form-item"><strong>5.</strong> Foreign insurers should be licensed by a state in the United States and you may contact that state's department of insurance to obtain more information about that insurer. You can find a link to each state from this NAIC internet website: https://naic.org/state_web_map.htm.</p>
        <p class="ca-form-item"><strong>6.</strong> For non-United States (alien) insurers, the insurer should be licensed by a country outside of the United States and should be on the NAIC's International Insurers Department (IID) listing of approved nonadmitted non-United States insurers. Ask your agent, broker, or "surplus line" broker to obtain more information about that insurer.</p>
        <p class="ca-form-item"><strong>7.</strong> California maintains a "List of Approved Surplus Line Insurers (LASLI)." Ask your agent or broker if the insurer is on that list, or view that list at the internet website of the California Department of Insurance: www.insurance.ca.gov/01-consumers/120-company/07-lasli/lasli.cfm.</p>
        <p class="ca-form-item"><strong>8.</strong> If you, as the applicant, required that the insurance policy you have purchased be effective immediately, either because existing coverage was going to lapse within two business days or because you were required to have coverage within two business days, and you did not receive this disclosure form and a request for your signature until after coverage became effective, you have the right to cancel this policy within five days of receiving this disclosure. If you cancel coverage, the premium will be prorated and any broker's fee charged for this insurance will be returned to you.</p>
      </div>
      <div class="ca-form-sig-block">
        <div class="ca-form-sig-row">
          <span class="ca-form-label">Date:</span>
          <span class="ca-form-ul"></span>
        </div>
        <div class="ca-form-sig-row">
          <span class="ca-form-label">Insured:</span>
          <span class="ca-form-ul">${insuredName}</span>
        </div>
      </div>
      <div class="ca-form-footer">D-1 (Effective January 1, 2020)</div>
    </div>
  `;
  return paFormPageWrapper(data, 'California Surplus Line Disclosure (Page 2)', body);
}

/**
 * California DILIGENT SEARCH REPORT (SL-2 FORM) – Page 3
 * The Surplus Line Association of California; exact layout, grey sections, black number boxes, table.
 */
function generateCaliforniaFormPage3(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const coverageType = data.coverageType || data.quoteType || '';
  const agentName = data.agencyContactName || '';
  const agencyName = data.agencyName || '';

  const body = `
    <div class="ca-sl2-doc" style="page-break-inside: avoid;">
      <div class="ca-sl2-header">
        <p class="ca-sl2-org">The Surplus Line Association of California</p>
        <p class="ca-sl2-title">DILIGENT SEARCH REPORT (SL-2 FORM)</p>
      </div>
      
      <div class="ca-sl2-section">
        <span class="ca-sl2-num">1</span>
        <div class="ca-sl2-section-body">
          <p class="ca-sl2-instruction">Before completing this report, please review the instructions on page 2.</p>
          <p class="ca-sl2-statement">I, <span class="ca-sl2-ul ca-sl2-ul-name">${agentName}</span>, hereby submit that I performed or supervised this diligent search, and I am:</p>
          <p class="ca-sl2-option"><strong>(A)</strong> licensed as an individual agent-broker for the applicable lines of insurance or surplus line broker under California license number <span class="ca-sl2-ul ca-sl2-ul-mid"></span></p>
          <p class="ca-sl2-or">OR</p>
          <p class="ca-sl2-option"><strong>(B)</strong> licensed and an endorsee on the license of <span class="ca-sl2-ul ca-sl2-ul-mid">${agencyName}</span> (Full Name of Organization), California license number <span class="ca-sl2-ul ca-sl2-ul-mid"></span></p>
        </div>
      </div>
      
      <div class="ca-sl2-section ca-sl2-section-grey">
        <span class="ca-sl2-num">2</span>
        <div class="ca-sl2-section-body">
          <p class="ca-sl2-option"><strong>(A)</strong> Name of Insured: <span class="ca-sl2-ul ca-sl2-ul-long">${insuredName}</span></p>
          <p class="ca-sl2-option"><strong>(B)</strong> Description of Risk: <span class="ca-sl2-ul ca-sl2-ul-long"></span></p>
          <p class="ca-sl2-hint">(e.g., Tattoo Parlor, Cannabis Dispensary, Vacant Building, <strong>NOT TYPE OF COVERAGE</strong>)</p>
          <p class="ca-sl2-option"><strong>(C)</strong> Type of Insurance or Coverage Code: <span class="ca-sl2-ul ca-sl2-ul-long">${coverageType}</span></p>
        </div>
      </div>
      
      <div class="ca-sl2-section">
        <span class="ca-sl2-num">3</span>
        <div class="ca-sl2-section-body">
          <p class="ca-sl2-intro">Describe the diligent efforts made to place this coverage with admitted insurers by completing (A) or, if applicable, (B) below.</p>
          <p class="ca-sl2-option"><strong>(A)</strong> List the insurers admitted in California who actually write the type of insurance described on lines 2(B) and 2(C) to which you or someone under your supervision submitted the risk described in lines 2(A) through 2(C). Please complete ALL sections of the table below.</p>
          <div class="ca-sl2-table">
            <div class="ca-sl2-table-row ca-sl2-table-header">
              <div class="ca-sl2-table-cell ca-sl2-cell-header"><span>INSURER 1</span></div>
              <div class="ca-sl2-table-cell ca-sl2-cell-header"><span>INSURER 2</span></div>
              <div class="ca-sl2-table-cell ca-sl2-cell-header"><span>INSURER 3</span></div>
            </div>
            <div class="ca-sl2-table-row">
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">NAIC ID</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">NAIC ID</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">NAIC ID</span><span class="ca-sl2-input"></span></div>
            </div>
            <div class="ca-sl2-table-row">
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">MONTH, YEAR OF DECLINATION</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">MONTH, YEAR OF DECLINATION</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">MONTH, YEAR OF DECLINATION</span><span class="ca-sl2-input"></span></div>
            </div>
            <div class="ca-sl2-table-row">
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">FULL NAME OF ADMITTED INSURER</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">FULL NAME OF ADMITTED INSURER</span><span class="ca-sl2-input"></span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">FULL NAME OF ADMITTED INSURER</span><span class="ca-sl2-input"></span></div>
            </div>
            <div class="ca-sl2-table-row">
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">CONTACT INFORMATION</span><span class="ca-sl2-input ca-sl2-input-sub">FULL NAME</span><span class="ca-sl2-input ca-sl2-input-sub">PHONE / EMAIL</span><span class="ca-sl2-input ca-sl2-input-sub">OR WEBSITE</span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">CONTACT INFORMATION</span><span class="ca-sl2-input ca-sl2-input-sub">FULL NAME</span><span class="ca-sl2-input ca-sl2-input-sub">PHONE / EMAIL</span><span class="ca-sl2-input ca-sl2-input-sub">OR WEBSITE</span></div>
              <div class="ca-sl2-table-cell"><span class="ca-sl2-cell-label">CONTACT INFORMATION</span><span class="ca-sl2-input ca-sl2-input-sub">FULL NAME</span><span class="ca-sl2-input ca-sl2-input-sub">PHONE / EMAIL</span><span class="ca-sl2-input ca-sl2-input-sub">OR WEBSITE</span></div>
            </div>
          </div>
          <p class="ca-sl2-option"><strong>(B)</strong> If you did not list at least three insurers in 3(A) above, describe in detail how you determined that fewer than THREE admitted insurers write the type of insurance described on lines 2(B) and 2(C).</p>
          <div class="ca-sl2-textarea"></div>
        </div>
      </div>
      
      <div class="ca-sl2-section ca-sl2-section-grey">
        <span class="ca-sl2-num">4</span>
        <div class="ca-sl2-section-body">
          <p class="ca-sl2-option">Is the type of insurance you are reporting as identified in line 2(C) <strong>private passenger automobile liability or health</strong>? <span class="ca-sl2-yn">Yes <span class="ca-sl2-cb"></span> No <span class="ca-sl2-cb"></span></span></p>
          <p class="ca-sl2-addendum">If you answered "yes," please complete the <span class="ca-sl2-link">Diligent Search Report Addendum</span>.</p>
        </div>
      </div>
      
      <p class="ca-sl2-cert">The undersigned licensee hereby certifies that this report is true and correct, and that this risk is not being placed with a non-admitted insurer for the sole purpose of securing a rate or premium lower than the lowest rate or premium available from an admitted insurer.</p>
      
      <div class="ca-sl2-sig-row">
        <div class="ca-sl2-sig-block">
          <span class="ca-sl2-ul ca-sl2-ul-sig"></span>
          <span class="ca-sl2-sig-label">(Signature of Licensee Named on Line 1)</span>
        </div>
        <div class="ca-sl2-sig-block">
          <span class="ca-sl2-ul ca-sl2-ul-sig"></span>
          <span class="ca-sl2-sig-label">(Date)</span>
        </div>
      </div>
      
      <div class="ca-sl2-footer" style="page-break-inside: avoid;">SL-2 Form (Revised 01/2024)</div>
    </div>
  `;
  return paFormPageWrapper(data, 'California Diligent Search Report (SL-2)', body);
}

/**
 * Colorado Statement of Diligent Effort
 * Dark blue header/border, grey underlines, watermark; fits on one page.
 */
function generateColoradoFormPage(data: ApplicationPacketData): string {
  const agentName = data.agencyContactName || '';
  const agencyName = data.agencyName || '';
  const insuredName = data.companyName || '';
  const coverageType = data.coverageType || data.quoteType || '';

  const body = `
    <div class="co-form-doc" style="page-break-inside: avoid;">
      <div class="co-form-border">
        <div class="co-form-watermark" aria-hidden="true">COLORADO<br>1876</div>
        <header class="co-form-header">STATEMENT OF DILIGENT EFFORT</header>
        
        <div class="co-form-intro-row">
          <span class="co-form-intro-text">I,</span>
          <span class="co-form-ul co-form-ul-intro"></span>
          <span class="co-form-intro-text">License #:</span>
          <span class="co-form-ul co-form-ul-license"></span>
        </div>
        <div class="co-form-field-block co-form-field-centered">
          <span class="co-form-label-above">Name of Retail/Producing Agent</span>
          <span class="co-form-ul co-form-ul-long">${agentName}</span>
        </div>
        <div class="co-form-field-row">
          <span class="co-form-label">Name of Agency:</span>
          <span class="co-form-ul co-form-ul-long">${agencyName}</span>
        </div>
        <div class="co-form-field-row">
          <span class="co-form-label">Have sought to obtain:</span>
          <span class="co-form-ul co-form-ul-long"></span>
        </div>
        <div class="co-form-field-row co-form-row-inline">
          <span class="co-form-label">Specific Type of Coverage</span>
          <span class="co-form-ul co-form-ul-mid"></span>
          <span class="co-form-label">for</span>
          <span class="co-form-ul co-form-ul-mid"></span>
          <span class="co-form-label">Named Insured</span>
          <span class="co-form-ul co-form-ul-mid">${insuredName}</span>
          <span class="co-form-label">from the following</span>
        </div>
        <div class="co-form-field-row">
          <span class="co-form-label">authorized insurers currently writing this type of coverage:</span>
          <span class="co-form-ul co-form-ul-long"></span>
        </div>
        
        <div class="co-form-insurer-block">
          <p class="co-form-insurer-num">(1) Authorized Insurer:</p>
          <div class="co-form-field-row">
            <span class="co-form-label">Person Contacted</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(or indicate if obtained online declination)</p>
          <div class="co-form-field-row co-form-row-two">
            <span class="co-form-label">Telephone Number/Email:</span>
            <span class="co-form-ul co-form-ul-mid"></span>
            <span class="co-form-label">Date of Contact:</span>
            <span class="co-form-ul co-form-ul-date"></span>
          </div>
          <div class="co-form-field-row">
            <span class="co-form-label">The reason(s) for declination by the insurer was (were) as follows</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(Attach electronic declinations if applicable)</p>
        </div>
        
        <div class="co-form-insurer-block">
          <p class="co-form-insurer-num">(2) Authorized Insurer:</p>
          <div class="co-form-field-row">
            <span class="co-form-label">Person Contacted</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(or indicate if obtained online declination)</p>
          <div class="co-form-field-row co-form-row-two">
            <span class="co-form-label">Telephone Number/Email:</span>
            <span class="co-form-ul co-form-ul-mid"></span>
            <span class="co-form-label">Date of Contact:</span>
            <span class="co-form-ul co-form-ul-date"></span>
          </div>
          <div class="co-form-field-row">
            <span class="co-form-label">The reason(s) for declination by the insurer was (were) as follows</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(Attach electronic declinations if applicable)</p>
        </div>
        
        <div class="co-form-insurer-block">
          <p class="co-form-insurer-num">(3) Authorized Insurer:</p>
          <div class="co-form-field-row">
            <span class="co-form-label">Person Contacted</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(or indicate if obtained online declination)</p>
          <div class="co-form-field-row co-form-row-two">
            <span class="co-form-label">Telephone Number/Email:</span>
            <span class="co-form-ul co-form-ul-mid"></span>
            <span class="co-form-label">Date of Contact:</span>
            <span class="co-form-ul co-form-ul-date"></span>
          </div>
          <div class="co-form-field-row">
            <span class="co-form-label">The reason(s) for declination by the insurer was (were) as follows</span>
            <span class="co-form-ul co-form-ul-long"></span>
          </div>
          <p class="co-form-hint">(Attach electronic declinations if applicable)</p>
        </div>
        
        <div class="co-form-sig-row">
          <div class="co-form-sig-block">
            <span class="co-form-label">Signature of Retail/Producing Agent</span>
            <span class="co-form-ul co-form-ul-sig"></span>
          </div>
          <div class="co-form-sig-block">
            <span class="co-form-label">Date</span>
            <span class="co-form-ul co-form-ul-date"></span>
          </div>
        </div>
        
        <div class="co-form-attest">
          <span class="co-form-checkbox"></span>
          <p class="co-form-attest-text">OR, by checking this box, I attest that I am familiar with the insurance market and this particular risk cannot be placed in the admitted market. I understand that the requirement to satisfy due diligence by documentation that the coverage required was not procurable after a comprehensive search was made from a minimum of three admitted insurers shall be waived. A written record documenting knowledge of the insurance market shall be maintained by the broker and must be current within 90 days of writing this policy.</p>
        </div>
        <div class="co-form-sig-row">
          <div class="co-form-sig-block">
            <span class="co-form-label">Signature of Producing Agent</span>
            <span class="co-form-ul co-form-ul-sig"></span>
          </div>
          <div class="co-form-sig-block">
            <span class="co-form-label">Date</span>
            <span class="co-form-ul co-form-ul-date"></span>
          </div>
        </div>
        
        <p class="co-form-definition">"Diligent effort" means seeking coverage from and having been rejected by at least three authorized insurers currently writing this type of coverage and documenting these rejections. Surplus lines agents must verify that a diligent effort form was completed by retaining a properly documented statement of diligent effort from the retail or producing agent. Declinations must be documented on a risk-by-risk basis.</p>
        
        <div class="co-form-footer-rev">Rev. 4/15/2025 | Colorado Division of Insurance</div>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'Colorado Statement of Diligent Effort', body);
}

/**
 * New York Part C – Affidavit by Producing Broker (NYSID Form 41C)
 */
function generateNewYorkFormPage(data: ApplicationPacketData): string {
  const name = data.agencyContactName || '';
  const address = data.agencyAddress || '';
  const city = data.agencyCity || '';
  const state = data.agencyState || '';
  const zip = data.agencyZip || '';
  const insuredName = data.companyName || '';

  const body = `
    <div class="ny-form-doc ny-form-page1" style="page-break-inside: avoid;">
      <h1 class="ny-form-title">PART C – AFFIDAVIT BY PRODUCING BROKER</h1>
      <div class="ny-form-section ny-form-section-1">
        <div class="ny-form-section-head-row">
          <span class="ny-form-section-heading">1. PRODUCING BROKER INFORMATION</span>
          <span class="ny-form-inline-label">AFFIDAVIT NO.</span>
          <span class="ny-form-input-box ny-form-box-affidavit"></span>
        </div>
        <div class="ny-form-row-boxes">
          <div class="ny-form-field-block">
            <span class="ny-form-input-box ny-form-box-name">${name}</span>
            <span class="ny-form-label-below">Name</span>
          </div>
          <div class="ny-form-field-block">
            <span class="ny-form-input-box ny-form-box-license"></span>
            <span class="ny-form-label-below">License No. BR-</span>
          </div>
        </div>
        <div class="ny-form-row-boxes ny-form-row-address">
          <div class="ny-form-field-block ny-form-field-addr">
            <span class="ny-form-input-box ny-form-box-addr">${address}</span>
            <span class="ny-form-label-below">Address</span>
          </div>
          <div class="ny-form-field-block">
            <span class="ny-form-input-box ny-form-box-city">${city}</span>
            <span class="ny-form-label-below">City</span>
          </div>
          <div class="ny-form-field-block">
            <span class="ny-form-input-box ny-form-box-state">${state}</span>
            <span class="ny-form-label-below">State</span>
          </div>
          <div class="ny-form-field-block">
            <span class="ny-form-input-box ny-form-box-zip">${zip}</span>
            <span class="ny-form-label-below">Zip Code</span>
          </div>
        </div>
      </div>
      <div class="ny-form-section ny-form-section-boxed">
        <p class="ny-form-section-heading">2. RISK INFORMATION:</p>
        <div class="ny-form-field-block ny-form-field-insured">
          <span class="ny-form-input-box ny-form-box-insured">${insuredName}</span>
          <span class="ny-form-label-below">Name of the Insured</span>
        </div>
        <p class="ny-form-note">(The name of the insured must be precisely the same in this affidavit and the declarations page, binder, cover note or confirmation of coverage.)</p>
      </div>
      <div class="ny-form-section ny-form-section-boxed">
        <p class="ny-form-section-heading">3. DISCLOSURE INFORMATION</p>
        <div class="ny-form-question-row">
          <span class="ny-form-yn">
            <span class="ny-form-cb"></span> Yes
            <span class="ny-form-cb ny-form-cb-right"></span> No
          </span>
          <span class="ny-form-question">Did you personally provide a written Notice of Excess Line Placement (Form: NELP/2011) to the insured as required by Section 2118 of the New York Insurance Law and Regulation 41?</span>
        </div>
      </div>
      <div class="ny-form-section ny-form-section-boxed">
        <p class="ny-form-section-heading">4. DECLINATION INFORMATION</p>
        <p class="ny-form-declination-item">
          <span class="ny-form-yn"><span class="ny-form-cb"></span> Yes <span class="ny-form-cb ny-form-cb-right"></span> No</span>
          <strong>(a)</strong> Has the Superintendent determined that declinations are not required for this type of risk? IF ANSWER TO QUESTION (a) IS "YES", SKIP QUESTIONS (b) AND (c) GO ON TO THE AFFIRMATION SECTION.
        </p>
        <p class="ny-form-declination-item">
          <span class="ny-form-yn"><span class="ny-form-cb"></span> Yes <span class="ny-form-cb ny-form-cb-right"></span> No</span>
          <strong>(b)</strong> Does the insured qualify as an "Exempt Commercial Purchaser" that made a written request consistent with the requirements of New York Insurance Law Section 2118(b)(3)(F)? IF ANSWER TO QUESTION (b) IS "YES", SKIP QUESTION (c) GO ON TO THE AFFIRMATION SECTION.
        </p>
        <p class="ny-form-declination-item">
          <span class="ny-form-yn"><span class="ny-form-cb"></span> Yes <span class="ny-form-cb ny-form-cb-right"></span> No</span>
          <strong>(c)</strong> Was the risk described above submitted by the producing broker to companies: (1) each authorized in New York to write coverages of the kind requested; (2) which the licensee has reason to believe might consider writing the type of coverage or class of insurance involved; and (3) was such risk declined by each such company? If the answer to QUESTION (c) above is "YES", COMPLETE THE FOLLOWING SCHEDULE:
        </p>
      </div>
      <p class="ny-form-subsection-heading">AUTHORIZED COMPANIES DECLINING THE RISK</p>
      <div class="ny-form-decline-schedule">
        <div class="ny-form-decline-row">
          <span class="ny-form-label">1. Name of company</span>
          <span class="ny-form-ul ny-form-ul-company"></span>
          <span class="ny-form-label ny-form-label-date">Date of Declin.:</span>
          <span class="ny-form-ul ny-form-ul-date"></span>
          <span class="ny-form-label ny-form-label-naic">NAIC Code</span>
          <span class="ny-form-ul ny-form-ul-naic"></span>
        </div>
        <p class="ny-form-reason-intro">I believed this insurer would consider underwriting this risk because:</p>
        <div class="ny-form-reason-list">
          <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Recent acceptance by the insurer of a risk, requiring that type of coverage or class of Insurance.</div>
          <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Advertising by the insurer or its agent indicating it entertains that type of risk/coverage.</div>
          <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Media communications (Newspapers, Trade Magazines, Radio) which indicate the insurer will underwrite that type of coverage.</div>
          <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Communications with other professionals, such as brokers, agents, risk managers, insurance department or ELANY Personnel indicating the insurer entertains such risks.</div>
          <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Any other valid basis you can document. <span class="ny-form-ul ny-form-ul-other"></span></div>
        </div>
      </div>
      <div class="ny-form-footer-combined" style="page-break-inside: avoid;">
        <span class="ny-form-footer-left">NYSID Form 41C - W (Ed. January 2023)</span>
        <span class="ny-form-footer-center">Page 1 of 2</span>
        <span class="ny-form-footer-right">New York Part C – Affidavit by Producing Broker (Page 1)</span>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, '', body);
}

/**
 * New York Part C – Affidavit by Producing Broker - Page 2 (NYSID Form 41C)
 * AUTHORIZED COMPANIES DECLINING THE RISK (entries 2–3) and AFFIRMATION
 */
function generateNewYorkFormPage2(data: ApplicationPacketData): string {
  const affiantName = data.agencyContactName || '';

  const body = `
    <div class="ny-form-doc ny-form-page2">
      <h1 class="ny-form-title">PART C – AFFIDAVIT BY PRODUCING BROKER</h1>
      <div class="ny-form-section ny-form-section-1">
        <p class="ny-form-section-heading"><span class="ny-form-inline-label">AFFIDAVIT NO.</span> <span class="ny-form-ul ny-form-ul-affidavit"></span></p>
      </div>
      <p class="ny-form-subsection-heading">AUTHORIZED COMPANIES DECLINING THE RISK</p>
      <div class="ny-form-decline-schedule">
        <div class="ny-form-decline-block">
          <div class="ny-form-decline-row">
            <span class="ny-form-label">2. Name of Company</span>
            <span class="ny-form-ul ny-form-ul-company"></span>
            <span class="ny-form-label ny-form-label-date">Date of Declin.:</span>
            <span class="ny-form-ul ny-form-ul-date"></span>
          </div>
          <div class="ny-form-decline-row">
            <span class="ny-form-label">NAIC Code</span>
            <span class="ny-form-ul ny-form-ul-naic"></span>
          </div>
          <p class="ny-form-reason-intro">I believed this insurer would consider underwriting this risk because:</p>
          <div class="ny-form-reason-list">
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Recent acceptance by the insurer of a risk, requiring that type of coverage or class of Insurance.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Advertising by the insurer or its agent indicating it entertains that type of risk/coverage.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Media communications (Newspapers, Trade Magazines, Radio) which indicate the insurer will underwrite that type of coverage.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Communications with other professionals, such as brokers, agents, risk managers, insurance department or ELANY Personnel indicating the insurer entertains such risks.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Any other valid basis you can document. <span class="ny-form-ul ny-form-ul-other"></span></div>
          </div>
        </div>
        <div class="ny-form-decline-block">
          <div class="ny-form-decline-row">
            <span class="ny-form-label">3. Name of Company</span>
            <span class="ny-form-ul ny-form-ul-company"></span>
            <span class="ny-form-label ny-form-label-date">Date of Declin.:</span>
            <span class="ny-form-ul ny-form-ul-date"></span>
          </div>
          <div class="ny-form-decline-row">
            <span class="ny-form-label">NAIC Code</span>
            <span class="ny-form-ul ny-form-ul-naic"></span>
          </div>
          <p class="ny-form-reason-intro">I believed this insurer would consider underwriting this risk because:</p>
          <div class="ny-form-reason-list">
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Recent acceptance by the insurer of a risk, requiring that type of coverage or class of Insurance.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Advertising by the insurer or its agent indicating it entertains that type of risk/coverage.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Media communications (Newspapers, Trade Magazines, Radio) which indicate the insurer will underwrite that type of coverage.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Communications with other professionals, such as brokers, agents, risk managers, insurance department or ELANY Personnel indicating the insurer entertains such risks.</div>
            <div class="ny-form-reason-item"><span class="ny-form-cb"></span> Any other valid basis you can document. <span class="ny-form-ul ny-form-ul-other"></span></div>
          </div>
        </div>
      </div>
      <div class="ny-form-affirmation-box">
        <p class="ny-form-affirmation-heading">AFFIRMATION</p>
        <p class="ny-form-affirmation-text">
          I, <span class="ny-form-ul ny-form-ul-affiant">${affiantName}</span>, am the licensee or sublicensee of the named broker in Section 1 of this affirmation and I hereby affirm under penalties of perjury that all of the information contained herein is true to the best of my knowledge and belief.
        </p>
        <div class="ny-form-affirmation-sig-row">
          <div class="ny-form-sig-left">
            <span class="ny-form-label">Signature of Affiant</span>
            <span class="ny-form-ul ny-form-ul-sig"></span>
          </div>
          <div class="ny-form-sig-right">
            <span class="ny-form-label">Date</span>
            <span class="ny-form-ul ny-form-ul-date"></span>
          </div>
        </div>
      </div>
      <div class="ny-form-footer">
        <span class="ny-form-footer-left">NYSID Form 41C - W (Ed. January 2023)</span>
        <span class="ny-form-footer-right">Page 2 of 2</span>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'New York Part C – Affidavit by Producing Broker (Page 2)', body);
}

/**
 * New York Notice of Excess Line Placement - Page 3
 * Cost breakdown and signature form
 */
function generateNewYorkFormPage3(data: ApplicationPacketData): string {
  const insuredName = data.companyName || '';
  const producerName = data.agencyContactName || '';

  const body = `
    <div class="ny-form-doc ny-form-page3" style="page-break-inside: avoid;">
      <div class="ny-form-notice-box"></div>
      <h1 class="ny-form-notice-title">NOTICE OF EXCESS LINE PLACEMENT</h1>
      <div class="ny-form-notice-date">Date: <span class="ny-form-ul ny-form-ul-date"></span></div>
      
      <p class="ny-form-notice-text">
        Consistent with the requirements of the New York Insurance Law and Regulation 41 
        <span class="ny-form-ul ny-form-ul-insured">${insuredName}</span> is hereby advised that all or a portion of the required coverages have been 
        placed by <span class="ny-form-ul ny-form-ul-producer">${producerName}</span> with insurers not authorized to do an insurance business in 
        New York and which are not subject to supervision by this State. Placements with unauthorized insurers can 
        only be made under one of the following circumstances:
      </p>
      
      <div class="ny-form-notice-list">
        <p class="ny-form-notice-list-item">
          <strong>a)</strong> A diligent effort was first made to place the required insurance with companies authorized in New 
          York to write coverages of the kind requested; or
        </p>
        <p class="ny-form-notice-list-item">
          <strong>b)</strong> NO diligent effort was required because i) the coverage qualifies as an "Export List" risk, or ii) the 
          insured qualifies as an "Exempt Commercial Purchaser."
        </p>
      </div>
      
      <p class="ny-form-notice-text">
        Policies issued by such unauthorized insurers may not be subject to all of the regulations of the 
        Superintendent of Financial Services pertaining to policy forms. In the event of insolvency of the 
        unauthorized insurers, losses will not be covered by any New York State security fund.
      </p>
      
      <h2 class="ny-form-cost-title">TOTAL COST FORM (NON TAX ALLOCATED PREMIUM TRANSACTION)</h2>
      
      <p class="ny-form-cost-text">
        In consideration of your placing my insurance as described in the policy referenced below, I agree to pay the 
        total cost below which includes all premiums, inspection charges<sup>(1)</sup> and a service fee that includes taxes, 
        stamping fees, and (if indicated) a fee<sup>(1)</sup> for compensation in addition to commissions received, and other 
        expenses<sup>(1)</sup>.
      </p>
      
      <p class="ny-form-cost-text">
        I further understand and agree that all fees, inspection charges and other expenses denoted by<sup>(1)</sup> are fully 
        earned from the inception date of the policy and are non-refundable regardless of whether said policy is 
        cancelled. Any policy changes which generate additional premium are subject to additional tax and stamping 
        fee charges.
      </p>
      
      <div class="ny-form-cost-table">
        <div class="ny-form-cost-row ny-form-cost-header">
          <div class="ny-form-cost-col-left">Re: Policy No.</div>
          <div class="ny-form-cost-col-right">Insurer</div>
        </div>
        
        <div class="ny-form-cost-row">
          <div class="ny-form-cost-col-full"><strong>Policy Premium</strong></div>
          <div class="ny-form-cost-col-amount">$</div>
        </div>
        
        <div class="ny-form-cost-section">
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-full"><strong><u>Insurer Imposed Charges:</u></strong></div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Policy Fees<sup>(1)</sup></div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Inspection Fees<sup>(1)</sup></div>
            <div class="ny-form-cost-col-amount">$__________________</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-full"><strong>Total Taxable Charges</strong></div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
        </div>
        
        <div class="ny-form-cost-section">
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-full"><strong><u>Service Fee Charges:</u></strong></div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Excess Line Tax (3.60%)</div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Stamping Fee</div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Broker Fee<sup>(1)</sup></div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Inspection Fee<sup>(1)</sup></div>
            <div class="ny-form-cost-col-amount">$</div>
          </div>
          <div class="ny-form-cost-row">
            <div class="ny-form-cost-col-left">Other Expenses (specify)<sup>(1)</sup> _____________________________</div>
            <div class="ny-form-cost-col-amount">$ ___________________</div>
          </div>
          <div class="ny-form-cost-row ny-form-cost-total">
            <div class="ny-form-cost-col-left"><strong>Total Policy Cost</strong></div>
            <div class="ny-form-cost-col-amount"><strong>$ ___________________</strong></div>
          </div>
        </div>
      </div>
      
      <div class="ny-form-page3-footer" style="page-break-inside: avoid;">
        <div class="ny-form-signature-section">
          <div class="ny-form-signature-line">_____________________________________</div>
          <div class="ny-form-signature-label">(Signature of Insured)</div>
        </div>
        <p class="ny-form-footnote"><sup>(1)</sup> = Fully earned</p>
      </div>
    </div>
  `;
  return paFormPageWrapper(data, 'New York Notice of Excess Line Placement (Page 3)', body);
}

/**
 * Generate State-Specific Forms section (included only for approved quotes).
 * Uses submission state (applicantState). Each state has different forms; content can be extended per state.
 */
function generateStateFormsPage(data: ApplicationPacketData): string {
  const stateCode = toStateCode(data.applicantState || '');
  const stateName = stateCode ? (STATE_DISPLAY_NAMES[stateCode] || data.applicantState || stateCode) : 'Applicant State';

  return `
    <div class="page state-forms-isc pa-form-no-sidebar" style="page-break-after: always;">
      <div class="pa-form-content-full state-forms-content">
        <div class="section-title-uppercase-page4">State-Specific Forms – ${stateName}</div>
        <p class="state-forms-intro">This section contains the state-required forms for <strong>${stateName}</strong> (${stateCode || 'N/A'}) as applicable to this application.</p>
        <div class="state-forms-placeholder">
          <p><strong>Application ID:</strong> ${data.applicationId}</p>
          <p><strong>Applicant:</strong> ${data.companyName}</p>
          <p><strong>State of operation:</strong> ${stateName}</p>
          <p class="state-forms-note">State-specific form content for ${stateName} will appear here. Forms vary by state.</p>
        </div>
        <div class="pa-form-page-number">State Forms – ${stateName}</div>
      </div>
    </div>
  `;
}

/**
 * Map form submission data to ApplicationPacketData format
 */
/**
 * Helper function to load SLTX logo PNG (for Texas form)
 * Place the file at: public/logos/sltx-logo.png
 */
export async function loadSltxLogo(): Promise<string | undefined> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logosDir = path.join(process.cwd(), 'public', 'logos');
    const possibleNames = ['sltx-logo.png', 'sltx.png', 'sltx.logo.png'];
    for (const name of possibleNames) {
      const logoPath = path.join(logosDir, name);
      if (fs.existsSync(logoPath)) {
        const buffer = fs.readFileSync(logoPath);
        return `data:image/png;base64,${buffer.toString('base64')}`;
      }
    }
  } catch (error) {
    console.warn('Could not load SLTX logo:', error);
  }
  return undefined;
}

/**
 * Helper function to load Capital & Co logo SVG
 */
export async function loadCapitalCoLogo(): Promise<string | undefined> {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const logoPath = path.join(process.cwd(), 'public', 'logos', 'capital-co-logo.svg');

    if (fs.existsSync(logoPath)) {
      const logoSVG = fs.readFileSync(logoPath, 'utf-8');
      return logoSVG;
    }
  } catch (error) {
    console.warn('Could not load Capital & Co logo:', error);
  }
  return undefined;
}

export function mapFormDataToPacketData(
  formData: any,
  submissionId: string,
  agency: any,
  quote?: any,
  submission?: any,
  capitalCoLogoSVG?: string
): ApplicationPacketData {
  // Extract class code and description
  const classCodeWork = formData.classCodeWork || {};
  const classCodes = Object.keys(classCodeWork);
  const firstClassCode = classCodes[0] || '';
  const classCodeDescription = formData.carrierApprovedDescription || firstClassCode;

  // Calculate field employees
  const activeOwners = formData.activeOwnersInField || 0;
  const fieldEmployees = formData.fieldEmployees || 0;
  const numberOfFieldEmployees = activeOwners > 0
    ? `Owner + ${fieldEmployees}`
    : `${fieldEmployees}`;

  // Format dates
  const formDate = formData.effectiveDate
    ? new Date(formData.effectiveDate).toLocaleDateString()
    : new Date().toLocaleDateString();

  const coverageDates = formData.effectiveDate && formData.expirationDate
    ? `${new Date(formData.effectiveDate).toLocaleDateString()} - ${new Date(formData.expirationDate).toLocaleDateString()}`
    : formData.effectiveDate
      ? `${new Date(formData.effectiveDate).toLocaleDateString()} - ${new Date(new Date(formData.effectiveDate).setFullYear(new Date(formData.effectiveDate).getFullYear() + 1)).toLocaleDateString()}`
      : '';

  // Format states of operation
  const statesOfOperation = Array.isArray(formData.statesOfOperation)
    ? formData.statesOfOperation.join(', ')
    : (formData.statesOfOperation || formData.state || '');

  // Format address
  const applicantAddress = formData.streetAddress
    ? `${formData.streetAddress}${formData.aptSuite ? ', ' + formData.aptSuite : ''}`
    : '';

  // Format agency address
  const agencyAddress = agency?.address?.street || '';
  const agencyCity = agency?.address?.city || '';
  const agencyState = agency?.address?.state || '';
  const agencyZip = agency?.address?.zip || '';

  // endorsements
  const endorsements: string[] = [];

  if (formData.blanketAdditionalInsured) {
    endorsements.push("Blanket Additional Insured");
  }

  if (formData.blanketWaiverOfSubrogation) {
    endorsements.push("Blanket Waiver of Subrogation");
  }

  if (formData.blanketPrimaryWording) {
    endorsements.push("Blanket Primary Wording");
  }

  if (formData.blanketPerProjectAggregate) {
    endorsements.push("Blanket Per Project Aggregate");
  }

  if (formData.blanketCompletedOperations) {
    endorsements.push("Blanket Completed Operations");
  }

  if (formData.noticeOfCancellationThirdParties) {
    endorsements.push("Notice of Cancellation to Third Parties");
  }

  return {
    // Application Metadata
    applicationId: formData.applicationId || submissionId.substring(0, 7) || '0000000',
    submissionId: submissionId,
    formDate: formDate,

    // Agency Information
    agencyName: agency?.name || 'Gamaty Insurance Agency LLC DBA Capital & Co Insurance Services',
    agencyContactName: formData.agencyContactName || 'Eidan Gamaty',
    agencyAddress: agencyAddress,
    agencyCity: agencyCity,
    agencyState: agencyState,
    agencyZip: agencyZip,
    agencyPhone: agency?.phone || '(310) 284-2136',
    agencyEmail: agency?.email || 'eidan@capcoinsurance.com',

    // Applicant/Insured Information
    companyName: formData.companyName || formData.business_name || '',
    dba: formData.dba,
    contactPerson: `${formData.firstName || ''} ${formData.lastName || ''}`.trim() || formData.contactPerson || '',
    applicantAddress: applicantAddress,
    applicantCity: formData.city || '',
    applicantState: (formData.state || formData.addressState || '').trim(),
    applicantZip: (formData.zipCode || formData.zip || '').trim(),
    applicantPhone: formData.phone || '',
    applicantEmail: formData.email || '',
    fein: formData.companyFEIN || formData.EIN || 'N/A',
    entityType: formData.entityType || '',
    yearsInBusiness: formData.yearsInBusiness || 0,
    yearsExperienceInTrades: formData.yearsExperienceInTrades || 0,
    statesOfOperation: statesOfOperation,
    workIn5Boroughs: formData.workIn5Boroughs || false,
    otherBusinessNames: formData.otherBusinessNames || 'No',
    paymentOption: formData.paymentOption || '3rd Party Finance',

    // Loss History
    generalLiabilityLosses: Array.isArray(formData.generalLiabilityLosses)
      ? formData.generalLiabilityLosses
      : [],

    // Quote Information
    quoteType: quote?.type || 'General Liability',
    carrierName: quote?.carrierName || 'Richmond National Insurance',
    coverageType: quote?.coverageType || 'Manuscript Occurrence',
    desiredCoverageDates: coverageDates,
    // Include state forms when we have an applicant state (show in packet for new submissions and when quote approved)
    includeStateForms: !!((formData.state || formData.addressState || '').trim()) &&
      !!(quote?.status && ['APPROVED'].includes(quote.status)),

    // General Liability Coverages
    aggregateLimit: formData.generalLiabilityLimit || '$1,000,000',
    occurrenceLimit: formData.generalLiabilityLimit || '$1,000,000',
    productsCompletedOpsLimit: formData.generalLiabilityLimit || '$1,000,000',
    personalAdvertisingInjuryLimit: formData.generalLiabilityLimit || '$1,000,000',
    fireLegalLimit: formData.fireLegalLimit || '$50,000',
    medPayLimit: formData.medicalExpenseLimit || '$5,000',
    selfInsuredRetention: formData.deductible || '$2,500',

    // Class Code & Gross Receipts
    classCode: classCodeDescription || firstClassCode,
    grossReceipts: formData.estimatedGrossReceipts ? `$${parseInt(formData.estimatedGrossReceipts).toLocaleString()}` : '$0',

    // Current Exposures
    estimatedTotalGrossReceipts: formData.estimatedGrossReceipts ? `$${parseInt(formData.estimatedGrossReceipts).toLocaleString()}` : '$0',
    estimatedSubContractingCosts: formData.estimatedSubcontractingCosts ? `$${parseInt(formData.estimatedSubcontractingCosts).toLocaleString()}` : '$0',
    estimatedMaterialCosts: formData.estimatedMaterialCosts ? `$${parseInt(formData.estimatedMaterialCosts).toLocaleString()}` : '$0',
    estimatedTotalPayroll: formData.totalPayrollAmount || '0',
    numberOfFieldEmployees: numberOfFieldEmployees,

    // Work Performed
    workDescription: formData.carrierApprovedDescription || '',
    percentageResidential: formData.residentialPercent || 0,
    percentageCommercial: formData.commercialPercent || 0,
    percentageNewConstruction: formData.newConstructionPercent || 0,
    percentageRemodel: formData.remodelPercent || 0,
    maxInteriorStories: formData.maxInteriorStories || 0,
    maxExteriorStories: formData.maxExteriorStories || 0,
    maxExteriorDepthBelowGrade: formData.maxExteriorDepthBelowGrade || 0,
    performOCIPWork: formData.performOCIPWork || false,
    ocipReceipts: formData.ocipReceipts,
    nonOCIPReceipts: formData.nonOCIPReceipts,
    lossesInLast5Years: formData.lossesInLast5Years || 0,

    // Work Experience Questions
    performHazardousWork: formData.performHazardousWork,
    hazardousWorkExplanation: formData.hazardousWorkExplanation,
    performMedicalFacilitiesWork: formData.performMedicalFacilitiesWork,
    medicalFacilitiesExplanation: formData.medicalFacilitiesExplanation,
    performStructuralWork: formData.performStructuralWork || false,
    performTractHomeWork: formData.workNewTractHomes,
    tractHomeExplanation: formData.tractHomeExplanation,
    workCondoConstruction: formData.workCondoConstruction,
    performCondoRepairOnly: formData.performCondoStructuralRepair,
    performRoofingOps: formData.performRoofingOps,
    roofingExplanation: formData.roofingExplanation,
    performWaterproofing: formData.performWaterproofing,
    waterproofingExplanation: formData.waterproofingExplanation,
    useHeavyEquipment: formData.useHeavyEquipment,
    heavyEquipmentExplanation: formData.heavyEquipmentExplanation,
    workOver5000SqFt: formData.workOver5000SqFt,
    workOver5000SqFtPercent: formData.workOver5000SqFtPercent,
    workOver5000SqFtExplanation: formData.workOver5000SqFtExplanation,
    workCommercialOver20000SqFt: formData.workCommercialOver20000SqFt,
    commercialOver20000SqFtPercent: formData.commercialOver20000SqFtPercent,
    commercialOver20000SqFtExplanation: formData.commercialOver20000SqFtExplanation,
    licensingActionTaken: formData.licensingActionTaken,
    licensingActionExplanation: formData.licensingActionExplanation,
    allowedLicenseUseByOthers: formData.allowedLicenseUseByOthers,
    licenseUseExplanation: formData.licenseUseExplanation,
    judgementsOrLiens: formData.judgementsOrLiens,
    judgementsExplanation: formData.judgementsExplanation,
    lawsuitsFiled: formData.lawsuitsFiled,
    lawsuitsExplanation: formData.lawsuitsExplanation,
    awareOfPotentialClaims: formData.awareOfPotentialClaims,
    potentialClaimsExplanation: formData.potentialClaimsExplanation,

    // Written Contract Questions
    haveWrittenContract: formData.haveWrittenContract,
    contractHasStartDate: formData.contractHasStartDate,
    contractStartDateExplanation: formData.contractStartDateExplanation,
    contractHasScopeOfWork: formData.contractHasScopeOfWork,
    contractScopeExplanation: formData.contractScopeExplanation,
    contractIdentifiesSubcontractedTrades: formData.contractIdentifiesSubcontractedTrades,
    contractSubcontractedTradesExplanation: formData.contractSubcontractedTradesExplanation,
    contractHasSetPrice: formData.contractHasSetPrice,
    contractSetPriceExplanation: formData.contractSetPriceExplanation,
    contractSignedByAllParties: formData.contractSignedByAllParties,
    contractSignedExplanation: formData.contractSignedExplanation,
    agreementHasHoldHarmless: formData.agreementHasHoldHarmless,
    holdHarmlessExplanation: formData.holdHarmlessExplanation,
    doSubcontractWork: formData.useSubcontractors,

    alwaysCollectCertificatesFromSubs: formData.collectSubCertificates,
    collectCertificatesExplanation: formData.collectSubCertificatesExplanation,

    requireSubsEqualInsuranceLimits: formData.requireSubInsuranceEqual,
    subsEqualLimitsExplanation: formData.requireSubInsuranceEqualExplanation,

    requireSubsNameAsAdditionalInsured: formData.requireAdditionalInsured,
    subsAdditionalInsuredExplanation: formData.requireAdditionalInsuredExplanation,

    haveStandardFormalAgreementWithSubs: formData.haveWrittenSubContracts,
    standardAgreementExplanation: formData.haveWrittenSubContractsExplanation,

    requireSubsWorkersComp: formData.requireWorkersComp,
    subsWorkersCompExplanation: formData.requireWorkersCompExplanation,

    // Policy Endorsements (flags)
    blanketAdditionalInsured: formData.blanketAdditionalInsured ?? false,
    blanketWaiverOfSubrogation: formData.blanketWaiverOfSubrogation ?? false,
    blanketPrimaryWording: formData.blanketPrimaryWording ?? false,
    blanketPerProjectAggregate: formData.blanketPerProjectAggregate ?? false,
    blanketCompletedOperations: formData.blanketCompletedOperations ?? false,
    noticeOfCancellationThirdParties: formData.noticeOfCancellationThirdParties ?? false,

    // Policy Endorsements (rendered text)
    policyEndorsements: endorsements.length
      ? endorsements.join(", ")
      : "None",


    // Application Agreement - Signatures
    applicantSignature: formData.applicantSignature,
    applicantSignatureDate: formData.applicantSignatureDate || formDate,
    applicantTitle: formData.applicantTitle,
    producerSignature: formData.producerSignature,
    producerSignatureDate: formData.producerSignatureDate || formDate,

    // Page 9: Disclosure of Premium
    terrorismCoveragePremium: formData.terrorismCoveragePremium || '$126.66',
    rejectionStatementSignature: formData.rejectionStatementSignature,
    rejectionStatementDate: formData.rejectionStatementDate,
    rejectionStatementPrintedName: formData.rejectionStatementPrintedName,

    // Page 10: Surplus Lines Compliance
    policyNumber: formData.policyNumber || quote?.policyNumber,
    surplusLinesSignature: formData.surplusLinesSignature,
    surplusLinesDate: formData.surplusLinesDate || formDate,

    // Page 11: Loss Warranty Letter
    lossWarrantyCompanySignature: formData.lossWarrantyCompanySignature,
    lossWarrantyDate: formData.lossWarrantyDate || formDate,
    lossWarrantySignature: formData.lossWarrantySignature,
    lossWarrantyTitle: formData.lossWarrantyTitle || formData.applicantTitle,

    // Page 12: Invoice Statement
    programName: formData.programName || submission?.programName || 'Standard GL A-Rated',
    premium: formData.premium || (quote?.finalAmountUSD ? `$${parseFloat(quote.finalAmountUSD.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    stateTax: formData.stateTax || (quote?.stateTax ? `$${parseFloat(quote.stateTax.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    associationDues: formData.associationDues || (quote?.associationDues ? `$${parseFloat(quote.associationDues.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    policyFee: formData.policyFee || (quote?.policyFee ? `$${parseFloat(quote.policyFee.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    inspectionFee: formData.inspectionFee || (quote?.inspectionFee ? `$${parseFloat(quote.inspectionFee.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    totalCostOfPolicy: formData.totalCostOfPolicy || (quote?.totalCost ? `$${parseFloat(quote.totalCost.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    depositPremium: formData.depositPremium || (quote?.depositPremium ? `$${parseFloat(quote.depositPremium.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    depositAssociationDues: formData.depositAssociationDues || (quote?.depositAssociationDues ? `$${parseFloat(quote.depositAssociationDues.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    depositStateTax: formData.depositStateTax || (quote?.depositStateTax ? `$${parseFloat(quote.depositStateTax.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    depositPolicyFee: formData.depositPolicyFee || (quote?.depositPolicyFee ? `$${parseFloat(quote.depositPolicyFee.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    depositInspectionFee: formData.depositInspectionFee || (quote?.depositInspectionFee ? `$${parseFloat(quote.depositInspectionFee.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    aiProcessingFee: formData.aiProcessingFee || '$0.00',
    totalDeposit: formData.totalDeposit || (quote?.totalDeposit ? `$${parseFloat(quote.totalDeposit.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    totalToRetain: formData.totalToRetain || (quote?.totalToRetain ? `$${parseFloat(quote.totalToRetain.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    totalToBeSent: formData.totalToBeSent || (quote?.totalToBeSent ? `$${parseFloat(quote.totalToBeSent.toString()).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00'),
    invoiceProducerSignature: formData.invoiceProducerSignature || formData.producerSignature,
    capitalCoLogoSVG: capitalCoLogoSVG,
  };
}

/**
 * Optimize CSS by removing unnecessary whitespace and comments
 */
function optimizeCSS(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*:\s*/g, ':')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .replace(/;}/g, '}')
    .trim();
}

/**
 * Minify HTML by removing unnecessary whitespace and optimizing SVG
 */
function minifyHTML(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove space between tags
    // Optimize SVG content - remove unnecessary whitespace in paths and attributes
    .replace(/(<svg[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<path[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<circle[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<ellipse[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<rect[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<polygon[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<polyline[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<defs[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<linearGradient[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .replace(/(<stop[^>]*>)/gi, (match) => match.replace(/\s+/g, ' ').replace(/\s*=\s*/g, '='))
    .trim();
}

/**
 * Generate the complete 12-page application packet HTML
 */
export async function generateApplicationPacketHTML(data: ApplicationPacketData): Promise<string> {
  // Generate QR codes for all pages upfront (base64 data URLs, no external API calls)
  const qrCodeText = data.applicationId;
  let qrCodeDataUrl: string;

  try {
    qrCodeDataUrl = await generateQRCodeBase64(qrCodeText, 80);
  } catch (error) {
    console.error('[Application Packet] Error generating QR code, using placeholder:', error);
    qrCodeDataUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y1ZjVmNSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTk5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlPC90ZXh0Pjwvc3ZnPg==';
  }

  // Add QR code data URL to data object for page generation
  const dataWithQR = { ...data, qrCodeDataUrl };

  // Generate all pages; state-specific forms (only for approved quotes) go just before Invoice Statement (page 12)
  const pagesBeforeStateForms = [
    generatePage1(dataWithQR),
    generatePage2(dataWithQR),
    generatePage3(dataWithQR),
    generatePage4(dataWithQR),
    generatePage5(dataWithQR),
    generatePage6(dataWithQR),
    generatePage7(dataWithQR),
    generatePage8(dataWithQR),
    generatePage9(dataWithQR),
    generatePage10(dataWithQR),
    generatePage11(dataWithQR),
  ];
  const stateFormPages: string[] = [];
  if (data.includeStateForms && data.applicantState) {
    const stateCode = toStateCode(data.applicantState);
    if (stateCode === 'PA') {
      stateFormPages.push(generatePennsylvaniaFormPage1(dataWithQR));
      stateFormPages.push(generatePennsylvaniaFormPage2(dataWithQR));
    } else if (stateCode === 'WA') {
      stateFormPages.push(generateWashingtonFormPage(dataWithQR));
    } else if (stateCode === 'TX') {
      const sltxLogo = await loadSltxLogo();
      stateFormPages.push(generateTexasFormPage(dataWithQR, sltxLogo));
    } else if (stateCode === 'OR') {
      stateFormPages.push(generateOregonFormPage(dataWithQR));
    } else if (stateCode === 'NV') {
      stateFormPages.push(generateNevadaFormPage(dataWithQR));
    } else if (stateCode === 'FL') {
      stateFormPages.push(generateFloridaFormPage(dataWithQR));
    } else if (stateCode === 'CA') {
      stateFormPages.push(generateCaliforniaFormPage1(dataWithQR));
      stateFormPages.push(generateCaliforniaFormPage2(dataWithQR));
      stateFormPages.push(generateCaliforniaFormPage3(dataWithQR));
    } else if (stateCode === 'CO') {
      stateFormPages.push(generateColoradoFormPage(dataWithQR));
    } else if (stateCode === 'NY') {
      stateFormPages.push(generateNewYorkFormPage(dataWithQR));
      stateFormPages.push(generateNewYorkFormPage2(dataWithQR));
      stateFormPages.push(generateNewYorkFormPage3(dataWithQR));
    } else {
      stateFormPages.push(generateStateFormsPage(dataWithQR));
    }
  }
  const pages = [...pagesBeforeStateForms, ...stateFormPages, generatePage12(dataWithQR)].join('');
  // Minify page body to reduce HTML size (PDFShift 2MB limit)
  const pagesMinified = pages.replace(/>\s+</g, '><').replace(/\s+/g, ' ');

  const cssContent = `
    /* ============================================
       PROFESSIONAL DESIGN SYSTEM - CSS VARIABLES
       ============================================ */
    :root {
      /* Brand Colors */
      --primary-color: #4A9EFF;
      --primary-dark: #3a7fd4;
      --primary-light: #6bb0ff;
      --secondary-color: #1f2937;
      --accent-color: #10b981;
      --warning-color: #f59e0b;
      --error-color: #ef4444;
      
      /* Text Colors */
      --text-primary: #1f2937;
      --text-secondary: #6b7280;
      --text-tertiary: #9ca3af;
      --text-inverse: #ffffff;
      --heading-color: #0f172a;
      --heading-dark: #000000;
      
      /* Background Colors */
      --bg-white: #ffffff;
      --bg-light: #f9fafb;
      --bg-medium: #f3f4f6;
      --bg-dark: #e5e7eb;
      
      /* Border Colors */
      --border-light: #e5e7eb;
      --border-medium: #d1d5db;
      --border-dark: #9ca3af;
      
      /* Spacing System */
      --spacing-xs: 0.1in;
      --spacing-sm: 0.15in;
      --spacing-md: 0.25in;
      --spacing-lg: 0.4in;
      --spacing-xl: 0.6in;
      
      /* Typography - Inter Font */
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      --font-size-xs: 9pt;
      --font-size-sm: 10pt; /* Field labels: 13-14px ≈ 10-10.5pt */
      --font-size-base: 12pt; /* Input text: 16-18px ≈ 12-13.5pt */
      --font-size-lg: 13.5pt; /* Input text larger: 18px ≈ 13.5pt */
      --font-size-xl: 16.5pt; /* Section headers: 22-24px ≈ 16.5-18pt */
      --font-size-2xl: 18pt; /* Section headers larger: 24px ≈ 18pt */
      
      /* Shadows */
      --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
      --shadow-md: 0 2px 4px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 4px 8px rgba(0, 0, 0, 0.15);
      --shadow-xl: 0 8px 16px rgba(0, 0, 0, 0.1);
      --shadow-premium: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    /* Ensure all text elements have explicit colors for CustomJS compatibility */
    /* Base fallback - will be overridden by more specific selectors */
    body, p, div, span, h1, h2, h3, h4, h5, h6, label, td, th, li {
      color: #1f2937;
    }
    
    /* Inter Font Face - Modern Fintech Style */
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 400;
      font-display: swap;
      src: local('Inter Regular'), local('Inter-Regular');
    }
    
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 500;
      font-display: swap;
      src: local('Inter Medium'), local('Inter-Medium');
    }
    
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 600;
      font-display: swap;
      src: local('Inter SemiBold'), local('Inter-SemiBold');
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', 'Helvetica', 'Arial', sans-serif;
      font-size: 12pt;
      font-weight: 400; /* Inter Regular */
      line-height: 1.6;
      color: #1f2937 !important; /* Explicit black/dark gray for CustomJS compatibility */
      background: #ffffff !important;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    
    /* Ensure base text elements inherit explicit color for CustomJS */
    p, div, span, h1, h2, h3, h4, h5, h6, label, td, th, li {
      color: #1f2937;
    }
    
    .page {
      width: 8.5in;
      min-height: 11in;
      max-height: 11in;
      padding: 0;
      margin: 0;
      display: flex;
      position: relative;
      background: #fff;
      page-break-after: always;
      overflow: hidden; /* Ensure all content fits on single pages */
    }
    .pa-form-page.page {
      max-height: none;
      overflow: visible;
    }
    
    .main-content {
      position: relative;
      z-index: 1;
    }
    
    .sidebar {
      width: 1.25in;
      background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
      padding: 0.4in 0.25in;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      border-right: 2px solid #e5e7eb;
      box-shadow: inset -2px 0 4px rgba(0, 0, 0, 0.02);
      z-index: 1;
    }
    
    .logo-container {
      margin-bottom: 0.25in;
    }
    
    .logo {
      width: 0.65in;
      height: 0.65in;
      background: linear-gradient(135deg, #4A9EFF 0%, #3a7fd4 100%);
      color: #ffffff;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 20pt;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      border: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }
    
    .logo::after {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      height: 30%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
      border-radius: 12px 12px 0 0;
      pointer-events: none;
    }
    
    .sidebar-title {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 15pt;
      font-weight: 700;
      color: #1f2937;
      margin: 0.4in 0;
      transform: rotate(180deg);
      letter-spacing: 1px;
    }
    
    .sidebar-title-vertical {
      writing-mode: vertical-rl;
      text-orientation: mixed;
      font-size: 17pt;
      font-weight: 700;
      color: #1f2937;
      margin: 0.4in 0;
      transform: rotate(180deg);
      letter-spacing: 1px;
    }
    
    .qr-container {
      position: absolute;
      bottom: 0.4in;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    
    .qr-code {
      background: #ffffff;
      padding: 0.1in;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      border: 2px solid #e5e7eb;
      position: relative;
      overflow: hidden;
    }
    
    .qr-code::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.03) 0%, transparent 100%);
      pointer-events: none;
    }
    
    .qr-code img {
      width: 0.85in;
      height: 0.85in;
      display: block;
    }
    
    .qr-code-text-only {
      width: 0.85in;
      height: 0.85in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      border: 2px solid #4A9EFF;
      border-radius: 8px;
      font-size: var(--font-size-xs);
      font-weight: 700;
      color: #4A9EFF;
      text-align: center;
      padding: 0.05in;
      word-break: break-all;
      box-shadow: var(--shadow-sm);
    }
    
    .qr-text {
      font-size: 9pt;
      font-weight: 600;
      margin-top: 0.08in;
      color: #1f2937;
      letter-spacing: 0.5px;
    }
    
    .qr-page {
      font-size: 8pt;
      color: #6b7280;
      margin-top: 0.03in;
    }
    
    .applicant-icon {
      font-size: 20pt;
      margin-top: var(--spacing-xs);
      color: #4A9EFF;
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.1) 0%, rgba(74, 158, 255, 0.05) 100%);
      width: 0.5in;
      height: 0.5in;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: var(--shadow-sm);
      border: 2px solid #4A9EFF;
    }
    
    .applicant-label {
      font-size: var(--font-size-xs);
      color: #6b7280;
      margin-top: var(--spacing-xs);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      padding: 0.03in 0.1in;
      background: #f9fafb;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
    }
    
    .main-content {
      flex: 1;
      padding: 0.6in;
      padding-left: 0.5in;
      padding-right: 0.5in;
    }
    
    .header-info {
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 3px solid #4A9EFF;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
    }
    
    .broker-name {
      font-size: var(--font-size-lg);
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
      color: #1f2937;
      letter-spacing: 0.5px;
      line-height: 1.5;
    }
    
    .applicant-name {
      font-size: var(--font-size-lg);
      font-weight: 700;
      margin-bottom: var(--spacing-xs);
      color: #1f2937;
      line-height: 1.5;
    }
    
    .application-id {
      font-size: var(--font-size-sm);
      color: #6b7280;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    
    .instructions {
      margin: var(--spacing-md) 0;
      font-size: var(--font-size-base);
      line-height: 1.8;
      color: #6b7280;
      padding: var(--spacing-md);
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, transparent 100%);
      border-radius: 8px;
      border-left: 4px solid #4A9EFF;
      box-shadow: var(--shadow-sm);
    }
    
    .instructions p {
      margin-bottom: var(--spacing-sm);
      text-align: justify;
    }
    
    .instructions p:first-child::before {
      content: 'ℹ';
      display: inline-block;
      margin-right: var(--spacing-xs);
      color: #4A9EFF;
      font-weight: 700;
      font-size: 12pt;
    }
    
    .checklist {
      margin: 0.25in 0;
    }
    
    .checklist-item {
      font-size: var(--font-size-base);
      margin: var(--spacing-sm) 0;
      padding: var(--spacing-sm) var(--spacing-md);
      padding-left: var(--spacing-lg);
      line-height: 1.8;
      color: #1f2937;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px;
      border-left: 4px solid #4A9EFF;
      box-shadow: var(--shadow-sm);
      position: relative;
      font-weight: 500;
    }
    
    .checklist-item::before {
      content: '✓';
      position: absolute;
      left: var(--spacing-sm);
      top: 50%;
      transform: translateY(-50%);
      width: 0.2in;
      height: 0.2in;
      background: #4A9EFF;
      color: #ffffff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10pt;
      font-weight: 700;
      box-shadow: var(--shadow-sm);
    }
    
    .checklist-item:hover {
      background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
      transform: translateX(3px);
      box-shadow: var(--shadow-md);
    }
    
    .submission-instructions,
    .binding-instructions {
      margin: var(--spacing-md) 0;
      font-size: var(--font-size-sm);
      color: #6b7280;
      line-height: 1.8;
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
      border-left: 4px solid #4A9EFF;
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
      border-top: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .submission-instructions strong,
    .binding-instructions strong {
      color: #1f2937;
      font-weight: 700;
    }
    
    /* ============================================
       PAGE 1 SPECIFIC STYLES - MATCHES ISC FORMAT
       ============================================ */
    .page1-specific .sidebar-page1 {
      background: #e5e7eb;
      width: 1.2in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      box-shadow: none;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      min-height: 10.3in;
    }
    
    .page1-specific .logo-container.logo-page1 {
      flex-shrink: 0;
      margin-top: 0.3in;
      margin-bottom: auto;
    }
    
    .page1-specific .logo-sterling-page1 {
      width: 0.6in;
      height: 0.6in;
      background: linear-gradient(135deg, #1A1F2E 0%, #2A3240 50%, #1A1F2E 100%);
      border-radius: 8px;
      border: 1px solid rgba(0, 188, 212, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    .page1-specific .page1-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page1-specific .qr-container.qr-page1 {
      flex-shrink: 0;
      margin-top: auto;
      margin-bottom: 0.3in;
      position: relative;
      bottom: auto;
    }
    
    .page1-specific .qr-text-page1 {
      font-size: 9pt;
      margin-top: 0.06in;
      font-weight: 500;
    }
    
    .page1-specific .qr-page-text {
      font-size: 7pt;
      margin-top: 0.02in;
      color: #6b7280;
    }
    
    .page1-specific .producer-icon {
      width: 0.55in;
      height: 0.55in;
      margin-top: 0.12in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      padding: 0.08in;
    }
    
    .page1-specific .producer-icon svg {
      width: 100%;
      height: 100%;
      display: block;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
    }
    
    .page1-specific .producer-label {
      font-size: 9pt;
      margin-top: 0.05in;
      color: #374151;
      font-weight: 500;
      text-transform: none;
      background: transparent;
      border: none;
      padding: 0;
      letter-spacing: 0.5px;
      border-radius: 0;
    }
    
    .page1-specific .main-content-page1 {
      padding: 0.5in 0.6in;
    }
    
    .page1-specific .header-info-page1 {
      margin-bottom: 0.3in;
      padding: 0;
      background: transparent;
      border: none;
      box-shadow: none;
    }
    
    .page1-specific .broker-name-page1,
    .page1-specific .applicant-name-page1,
    .page1-specific .application-id-page1 {
      font-size: 11pt;
      font-weight: 400;
      color: #1f2937;
      margin-bottom: 0.05in;
      line-height: 1.5;
      letter-spacing: 0;
    }
    
    .page1-specific .broker-name-page1 strong,
    .page1-specific .applicant-name-page1 strong,
    .page1-specific .application-id-page1 strong {
      font-weight: 600;
      color: #1f2937;
    }
    
    .page1-specific .instructions-page1 {
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      margin: 0.25in 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
    
    .page1-specific .checklist-page1 {
      margin: 0.25in 0;
    }
    
    .page1-specific .checklist-item-page1 {
      font-size: 11pt;
      margin: 0.15in 0;
      padding: 0.08in 0;
      padding-left: 0.3in;
      line-height: 1.6;
      color: #1f2937;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
      position: relative;
      font-weight: 400;
    }
    
    .page1-specific .checkbox-square {
      position: absolute;
      left: 0;
      top: 0.12in;
      width: 0.18in;
      height: 0.18in;
      border: 1.5px solid #1f2937;
      background: #ffffff;
      display: inline-block;
      border-radius: 2px;
    }
    
    .page1-specific .submission-instructions-page1,
    .page1-specific .binding-instructions-page1 {
      font-size: 11pt;
      line-height: 1.6;
      color: #1f2937;
      margin: 0.2in 0;
      padding: 0;
      background: transparent;
      border: none;
      border-radius: 0;
      box-shadow: none;
    }
    
    .page1-specific .page-number-page1 {
      position: absolute;
      bottom: 0.4in;
      right: 0.6in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 2 SPECIFIC STYLES - ISC APPLICATION FORMAT
       ============================================ */
    .page2-isc .sidebar-page2 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page2-isc .logo-capital-co-hands {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page2-isc .logo-capital-co-hands svg,
    .page2-isc .logo-capital-co-hands img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page2-isc .qr-container.qr-page2 {
      flex-shrink: 0;
      margin-top: auto;
      margin-bottom: 0.3in;
      position: relative;
      bottom: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      visibility: visible;
      opacity: 1;
    }
    
    .page2-isc .qr-container.qr-page2 .qr-code {
      display: block;
      visibility: visible;
      opacity: 1;
      margin-bottom: 0.05in;
    }
    
    .page2-isc .qr-container.qr-page2 .qr-code img {
      display: block;
      visibility: visible;
      opacity: 1;
      width: 0.7in !important;
      height: 0.7in !important;
    }
    
    .page2-isc .page2-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page2-isc .qr-page2 {
      bottom: 0.3in;
    }
    
    .page2-isc .qr-text-page2 {
      font-size: 9pt;
      margin-top: 0.06in;
      font-weight: 500;
    }
    
    .page2-isc .qr-page-text-page2 {
      font-size: 7pt;
      margin-top: 0.02in;
      color: #6b7280;
    }
    
    .page2-isc .applicant-icon-page2 {
      width: 0.55in;
      height: 0.55in;
      margin-top: 0.12in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      padding: 0.08in;
    }
    
    .page2-isc .applicant-icon-page2 svg {
      width: 100%;
      height: 100%;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
    }
    
    /* General applicant icon styling for all pages */
    .applicant-icon {
      width: 0.55in;
      height: 0.55in;
      margin-top: 0.12in;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f8f9fa;
      border: 1.5px solid #e0e0e0;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
      padding: 0.08in;
    }
    
    .applicant-icon svg {
      width: 100%;
      height: 100%;
      display: block;
      filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.08));
    }
    
    .page2-isc .applicant-label-page2 {
      font-size: 9pt;
      margin-top: 0.05in;
      color: #374151;
      font-weight: 500;
      text-transform: none;
      background: transparent;
      border: none;
      padding: 0;
    }
    
    .page2-isc .main-content-page2 {
      padding: 0.25in 0.4in 0.2in 0.4in;
      font-size: 11pt;
      line-height: 1.3;
      max-height: 11in;
      overflow: visible;
      display: flex;
      flex-direction: column;
      position: relative;
    }
    
    .page2-isc .header-top-page2 {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.06in;
      padding-bottom: 0.03in;
      flex-shrink: 0;
    }
    
    .page2-isc .agency-info-page2-left {
      font-size: 10pt;
      line-height: 1.4;
      color: #1f2937;
      text-align: left;
      flex: 1;
    }
    
    .page2-isc .logo-brand-page2 {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0;
      flex-shrink: 0;
    }
    
    .page2-isc .logo-icon-page2-hands {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      padding: 0;
    }
    
    .page2-isc .logo-icon-page2-hands svg,
    .page2-isc .logo-icon-page2-hands img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page2-isc .agency-info-page2 {
      font-size: 10pt;
      line-height: 1.4;
      color: #1f2937;
      text-align: right;
    }
    
    .page2-isc .agency-name-page2 {
      font-weight: 600;
      margin-bottom: 0.02in;
    }
    
    .page2-isc .agency-contact-page2,
    .page2-isc .agency-address-page2,
    .page2-isc .agency-city-state-zip-page2,
    .page2-isc .agency-phone-page2,
    .page2-isc .agency-email-page2 {
      margin-bottom: 0.015in;
      font-size: 9.5pt;
    }
    
    .page2-isc .agency-info-page2-left .agency-name-page2,
    .page2-isc .agency-info-page2-left .agency-contact-page2,
    .page2-isc .agency-info-page2-left .agency-address-page2,
    .page2-isc .agency-info-page2-left .agency-city-state-zip-page2,
    .page2-isc .agency-info-page2-left .agency-phone-page2,
    .page2-isc .agency-info-page2-left .agency-email-page2 {
      margin-bottom: 0.015in;
    }
    
    .page2-isc .app-id-quote-parallel-page2 {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.05in;
      gap: 0.2in;
      flex-shrink: 0;
    }
    
    .page2-isc .app-id-column-page2 {
      flex: 1;
    }
    
    .page2-isc .quote-column-page2 {
      flex: 1;
      text-align: right;
    }
    
    .page2-isc .application-id-large-page2 {
      font-size: 10.5pt;
      font-weight: 600;
      margin-bottom: 0.05in;
      color: #1f2937;
      line-height: 1.25;
    }
    
    .page2-isc .date-section-page2 {
      font-size: 10.5pt;
      color: #1f2937;
      line-height: 1.25;
    }
    
    .page2-isc .insured-info-section-page2 {
      margin-bottom: 0.04in;
      padding-bottom: 0.02in;
      flex-shrink: 0;
    }
    
    .page2-isc .section-title-page2 {
      font-size: 11pt;
      font-weight: 600;
      margin-bottom: 0.04in;
      color: #1f2937;
      line-height: 1.2;
    }
    
    .page2-isc .insured-detail-page2 {
      font-size: 9.5pt;
      line-height: 1.2;
      margin-bottom: 0.01in;
      color: #1f2937;
    }
    
    .page2-isc .quote-detail-page2 {
      font-size: 9.5pt;
      line-height: 1.2;
      margin-bottom: 0.03in;
      color: #1f2937;
      text-align: right;
    }
    
    .page2-isc .quote-column-page2 .section-title-page2 {
      text-align: right;
    }
    
    .page2-isc .applicant-info-section-page2 {
      margin-bottom: 0.05in;
      flex-shrink: 0;
    }
    
    .page2-isc .section-title-underline-page2 {
      font-size: 10.5pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.04in;
      padding-bottom: 0.02in;
      border-bottom: 2px solid #0f172a;
      color: #0f172a;
      letter-spacing: 0.8px;
      line-height: 1.2;
      position: relative;
    }
    
    .page2-isc .section-title-underline-page2::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
    
    .page2-isc .applicant-field-page2 {
      font-size: 9.5pt;
      line-height: 1.15;
      margin-bottom: 0.02in;
      color: #1f2937;
    }
    
    .page2-isc .coverages-section-page2 {
      margin-bottom: 0.04in;
      flex-shrink: 0;
    }
    
    .page2-isc .section-divider-page2 {
      width: 100%;
      height: 2px;
      background: #0f172a;
      margin-bottom: 0.06in;
      margin-top: 0.03in;
      flex-shrink: 0;
      position: relative;
    }
    
    .page2-isc .section-divider-page2::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: 0;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
    
    .page2-isc .coverages-table-page2 {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
      margin-top: 0.03in;
    }
    
    .page2-isc .coverages-table-page2 td {
      padding: 0.025in 0.04in;
      border-bottom: 1px solid #e5e7eb;
      color: #1f2937;
      vertical-align: top;
      line-height: 1.2;
    }
    
    .page2-isc .coverages-table-page2 td:first-child {
      width: 60%;
      font-weight: 600;
    }
    
    .page2-isc .coverages-table-page2 td:last-child {
      width: 40%;
    }
    
    .page2-isc .class-code-gross-section-page2 {
      display: flex !important;
      justify-content: flex-start;
      align-items: flex-start;
      margin-bottom: 0.1in;
      margin-top: 0;
      gap: 0;
      flex-shrink: 0;
      visibility: visible !important;
      opacity: 1 !important;
      position: relative;
      z-index: 10;
      width: 100% !important;
      min-height: 1in;
      padding: 0.05in 0;
      clear: both;
      page-break-inside: avoid;
    }
    
    .page2-isc .class-code-column-page2,
    .page2-isc .gross-receipts-column-page2 {
      flex: 1;
      visibility: visible;
      opacity: 1;
      display: flex;
      flex-direction: column;
    }
    
    .page2-isc .class-code-title-page2,
    .page2-isc .gross-receipts-title-page2 {
      font-size: 11pt;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.05in;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
    }
    
    .page2-isc .class-code-divider-page2 {
      width: 1px;
      height: 1.1in;
      background: #1f2937;
      flex-shrink: 0;
      margin: 0 0.2in;
      align-self: flex-start;
      margin-top: 0.2in;
    }
    
    .page2-isc .class-code-value-page2,
    .page2-isc .gross-receipts-value-page2 {
      font-size: 11pt;
      font-weight: 500;
      margin-top: 0;
      color: #1f2937;
      padding: 0.1in 0.12in;
      background: #f5f5f5;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      line-height: 1.3;
      min-height: 0.45in;
      display: flex !important;
      align-items: center;
      visibility: visible !important;
      opacity: 1 !important;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      text-align: left;
    }
      display: flex;
      align-items: center;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      text-align: left;
    }
    
    .page2-isc .page-number-page2 {
      position: absolute;
      bottom: 0.35in;
      right: 0.4in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 3 - ISC FORMAT: CURRENT EXPOSURES, WORK PERFORMED, WORK EXPERIENCE
       ============================================ */
    .page3-isc .sidebar-page3 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page3-isc .logo-capital-co-hands-page3 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page3-isc .logo-capital-co-hands-page3 svg,
    .page3-isc .logo-capital-co-hands-page3 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page3-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page3-isc .page3-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page3-isc .main-content-page3 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.25;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      width: 87.5%; /* Use 85-90% of page width */
      max-width: 87.5%;
    }
    
    .page3-isc .section-title-uppercase-page3 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.08in;
      margin-top: 0.1in;
      color: #0f172a;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 0.03in;
      position: relative;
    }
    
    .page3-isc .section-title-uppercase-page3::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
    
    .page3-isc .exposures-grid-page3 {
      margin-bottom: 0.1in;
    }
    
    .page3-isc .exposure-item-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page3-isc .footnote-page3 {
      font-size: 9pt;
      line-height: 1.3;
      margin-bottom: 0.1in;
      color: #6b7280;
      font-style: italic;
    }
    
    .page3-isc .work-description-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.08in;
      color: #1f2937;
    }
    
    .page3-isc .work-percentages-page3 {
      margin-bottom: 0.08in;
    }
    
    .page3-isc .percentage-item-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page3-isc .structural-details-page3 {
      margin-bottom: 0.08in;
    }
    
    .page3-isc .detail-item-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page3-isc .ocip-section-page3 {
      margin-bottom: 0.1in;
    }
    
    .page3-isc .ocip-question-page3,
    .page3-isc .ocip-followup-page3,
    .page3-isc .ocip-receipts-page3,
    .page3-isc .losses-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page3-isc .work-experience-questions-page3 {
      margin-top: 0.08in;
    }
    
    .page3-isc .question-item-page3 {
      margin-bottom: 0.12in; /* Increased spacing between questions */
    }
    
    .page3-isc .question-text-page3 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.08in; /* Increased spacing before Yes/No */
      color: #1f2937;
    }
    
    .page3-isc .yes-no-options-page3 {
      font-size: 11pt;
      font-weight: 500; /* Inter Medium */
      margin-bottom: 0.08in; /* Increased spacing after Yes/No */
      color: #1f2937;
      display: flex;
      gap: 0.3in; /* Space between Yes and No */
      align-items: center;
    }
    
    .page3-isc .yes-no-options-page3 .yes-option,
    .page3-isc .yes-no-options-page3 .no-option {
      padding: 0.08in 0.2in;
      border: none;
      border-radius: 0;
      background: transparent;
      min-width: 0.8in;
      text-align: center;
      font-weight: 500;
      color: #1f2937;
    }
    
    .page3-isc .yes-no-options-page3 .yes-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page3-isc .yes-no-options-page3 .no-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page3-isc .explanation-field-page3 {
      font-size: 9pt;
      line-height: 1.25;
      margin-top: 0.03in;
      margin-left: 0.15in;
      color: #4b5563;
    }
    
    .page3-isc .page-number-page3 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 4 - ISC FORMAT: WORK EXPERIENCE - CONT.
       ============================================ */
    .page4-isc .sidebar-page4 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page4-isc .logo-capital-co-hands-page4 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page4-isc .logo-capital-co-hands-page4 svg,
    .page4-isc .logo-capital-co-hands-page4 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page4-isc .page4-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page4-isc .main-content-page4 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.25;
      max-height: 10.5in;
      overflow: visible;
      display: flex;
      flex-direction: column;
      width: 87.5%; /* Use 85-90% of page width */
      max-width: 87.5%;
    }
    
    .page4-isc .section-title-uppercase-page4 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.08in;
      margin-top: 0.08in;
      color: #0f172a;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 0.03in;
      position: relative;
    }
    
    .page4-isc .section-title-uppercase-page4::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
      padding-bottom: 0.03in;
    }
    
    .page4-isc .work-experience-questions-page4 {
      margin-top: 0.06in;
    }
    
    .page4-isc .question-item-page4 {
      margin-bottom: 0.1in; /* Spacing between questions */
    }
    
    .page4-isc .question-text-page4 {
      font-size: 9.5pt;
      line-height: 1.2;
      margin-bottom: 0.06in; /* Spacing before Yes/No */
      color: #1f2937;
    }
    
    .page4-isc .yes-no-options-page4 {
      font-size: 11pt;
      font-weight: 500; /* Inter Medium */
      margin-bottom: 0.06in; /* Spacing after Yes/No */
      color: #1f2937;
      display: flex !important;
      visibility: visible !important;
      gap: 0.3in; /* Space between Yes and No */
      align-items: center;
    }
    
    .page4-isc .yes-no-options-page4 .yes-option,
    .page4-isc .yes-no-options-page4 .no-option {
      padding: 0.06in 0.15in;
      border: none;
      border-radius: 0;
      background: transparent;
      min-width: 0.6in;
      text-align: center;
      font-weight: 500;
      color: #1f2937;
      display: inline-block !important;
      visibility: visible !important;
    }
    
    .page4-isc .yes-no-options-page4 .yes-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page4-isc .yes-no-options-page4 .no-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page4-isc .explanation-field-page4 {
      font-size: 9pt;
      line-height: 1.25;
      margin-top: 0.02in;
      margin-left: 0.15in;
      color: #4b5563;
    }
    
    .page4-isc .percentage-field-page4 {
      font-size: 10pt;
      line-height: 1.25;
      margin-top: 0.02in;
      color: #1f2937;
    }
    
    .page4-isc .page-number-page4 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }


    .loss-history-section {
      margin-top: 16px;
      font-size: 12px;
    }

    .loss-table {
      width: 100%;
      border-collapse: collapse;
    }

    .loss-table th,
    .loss-table td {
      border: 1px solid #ccc;
      padding: 6px 8px;
      text-align: left;
    }

    .loss-table th {
      background: #f5f5f5;
      font-weight: 600;
    }
    
    /* ============================================
       PAGE 5 - ISC FORMAT: WRITTEN CONTRACT & POLICY ENDORSEMENTS
       ============================================ */
    .page5-isc .sidebar-page5 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page5-isc .logo-capital-co-hands-page5 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page5-isc .logo-capital-co-hands-page5 svg,
    .page5-isc .logo-capital-co-hands-page5 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page5-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page5-isc .page5-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page5-isc .main-content-page5 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.25;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      width: 87.5%; /* Use 85-90% of page width */
      max-width: 87.5%;
    }
    
    .page5-isc .section-title-uppercase-page5 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.08in;
      margin-top: 0.08in;
      color: #0f172a;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 0.03in;
      position: relative;
    }
    
    .page5-isc .section-title-uppercase-page5::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
      padding-bottom: 0.03in;
    }
    
    .page5-isc .written-contract-questions-page5 {
      margin-top: 0.06in;
    }
    
    .page5-isc .question-item-page5 {
      margin-bottom: 0.12in; /* Increased spacing between questions */
    }
    
    .page5-isc .question-text-page5 {
      font-size: 10pt;
      line-height: 1.25;
      margin-bottom: 0.08in; /* Increased spacing before Yes/No */
      color: #1f2937;
    }
    
    .page5-isc .yes-no-options-page5 {
      font-size: 11pt;
      font-weight: 500; /* Inter Medium */
      margin-bottom: 0.08in; /* Increased spacing after Yes/No */
      color: #1f2937;
      display: flex;
      gap: 0.3in; /* Space between Yes and No */
      align-items: center;
    }
    
    .page5-isc .yes-no-options-page5 .yes-option,
    .page5-isc .yes-no-options-page5 .no-option {
      padding: 0.08in 0.2in;
      border: none;
      border-radius: 0;
      background: transparent;
      min-width: 0.8in;
      text-align: center;
      font-weight: 500;
      color: #1f2937;
    }
    
    .page5-isc .yes-no-options-page5 .yes-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page5-isc .yes-no-options-page5 .no-option.selected {
      background: transparent;
      border: none;
      color: #1f2937;
      font-weight: 500;
      text-decoration: underline;
      text-decoration-thickness: 2px;
    }
    
    .page5-isc .sub-question-header-page5 {
      font-size: 10pt;
      font-weight: 600;
      margin-top: 0.03in;
      margin-bottom: 0.04in;
      color: #374151;
    }
    
    .page5-isc .sub-question-item-page5 {
      margin-left: 0.15in;
      margin-bottom: 0.04in;
      margin-top: 0.03in;
    }
    
    .page5-isc .explanation-field-page5 {
      font-size: 9pt;
      line-height: 1.25;
      margin-top: 0.02in;
      margin-left: 0.15in;
      color: #4b5563;
    }
    
    .page5-isc .policy-endorsements-title-page5 {
      margin-top: 0.15in;
    }
    
    .page5-isc .policy-endorsements-content-page5 {
      font-size: 10pt;
      line-height: 1.25;
      margin-top: 0.06in;
      color: #1f2937;
      font-weight: 500;
    }
    
    .page5-isc .page-number-page5 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 6 - ISC FORMAT: NOTICE & POLICY EXCLUSIONS
       ============================================ */
    .page6-isc .sidebar-page6 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page6-isc .logo-capital-co-hands-page6 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page6-isc .logo-capital-co-hands-page6 svg,
    .page6-isc .logo-capital-co-hands-page6 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page6-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page6-isc .page6-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page6-isc .main-content-page6 {
      padding: 0.25in 0.35in;
      font-size: 9pt;
      line-height: 1.2;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page6-isc .section-title-uppercase-page6 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.06in;
      margin-top: 0.08in;
      color: #0f172a;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 0.03in;
      position: relative;
    }
    
    .page6-isc .section-title-uppercase-page6::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
      padding-bottom: 0.02in;
    }
    
    .page6-isc .notice-content-page6 {
      margin-bottom: 0.08in;
    }
    
    .page6-isc .notice-content-page6 p {
      font-size: 9pt;
      line-height: 1.2;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page6-isc .initial-line-page6 {
      font-size: 9pt;
      margin-top: 0.05in;
      margin-bottom: 0.08in;
      color: #1f2937;
    }
    
    .page6-isc .exclusions-content-page6 {
      margin-top: 0.06in;
    }
    
    .page6-isc .exclusions-content-page6 p {
      font-size: 8.5pt;
      line-height: 1.2;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page6-isc .page-number-page6 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 7 - ISC FORMAT: APPLICATION AGREEMENT
       ============================================ */
    .page7-isc .sidebar-page7 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page7-isc .logo-capital-co-hands-page7 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page7-isc .logo-capital-co-hands-page7 svg,
    .page7-isc .logo-capital-co-hands-page7 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page7-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page7-isc .page7-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page7-isc .main-content-page7 {
      padding: 0.25in 0.35in;
      font-size: 9pt;
      line-height: 1.2;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page7-isc .section-title-uppercase-page7 {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      margin-bottom: 0.06in;
      margin-top: 0.08in;
      color: #0f172a;
      letter-spacing: 0.8px;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 0.03in;
      position: relative;
    }
    
    .page7-isc .section-title-uppercase-page7::before {
      content: '';
      position: absolute;
      left: 0;
      bottom: -2px;
      width: 0.3in;
      height: 2px;
      background: #4A9EFF;
    }
      padding-bottom: 0.02in;
    }
    
    .page7-isc .agreement-content-page7 {
      margin-bottom: 0.05in;
    }
    
    .page7-isc .agreement-content-page7 p {
      font-size: 9pt;
      line-height: 1.2;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page7-isc .initial-line-page7 {
      font-size: 9pt;
      margin-top: 0.03in;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page7-isc .signature-section-page7 {
      margin-top: 0.15in;
      display: flex;
      flex-direction: column;
      gap: 0.08in;
    }
    
    .page7-isc .signature-field-page7 {
      margin-bottom: 0.05in;
    }
    
    .page7-isc .signature-label-page7 {
      font-size: 9pt;
      font-weight: 600;
      margin-bottom: 0.02in;
      color: #1f2937;
    }
    
    .page7-isc .signature-line-page7 {
      font-size: 9pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
    }
    
    .page7-isc .page-number-page7 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 8 - ISC FORMAT: TERRORISM COVERAGE DISCLOSURE NOTICE
       ============================================ */
    .page8-isc .sidebar-page8 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page8-isc .logo-capital-co-hands-page8 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page8-isc .logo-capital-co-hands-page8 svg,
    .page8-isc .logo-capital-co-hands-page8 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page8-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page8-isc .page8-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page8-isc .main-content-page8 {
      padding: 0.25in 0.35in;
      font-size: 9pt;
      line-height: 1.2;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page8-isc .carrier-header-page8 {
      margin-bottom: 0.08in;
    }
    
    .page8-isc .carrier-name-large-page8 {
      font-size: 12pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page8-isc .endorsement-notice-page8 {
      font-size: 9pt;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page8-isc .carrier-name-medium-page8 {
      font-size: 11pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page8-isc .policy-type-page8 {
      font-size: 10pt;
      font-weight: 600;
      text-align: center;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page8-isc .document-title-page8 {
      font-size: 11pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page8-isc .section-title-bold-page8 {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      margin-top: 0.08in;
      margin-bottom: 0.05in;
      color: #0f172a;
      text-decoration: underline;
      letter-spacing: 0.3px;
    }
    
    .page8-isc .terrorism-content-page8 {
      margin-bottom: 0.06in;
    }
    
    .page8-isc .terrorism-content-page8 p {
      font-size: 9pt;
      line-height: 1.2;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page8-isc .agreement-content-page8 {
      margin-bottom: 0.08in;
    }
    
    .page8-isc .agreement-content-page8 p {
      font-size: 9pt;
      line-height: 1.2;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page8-isc .signature-section-page8 {
      margin-top: 0.15in;
      display: flex;
      flex-direction: column;
      gap: 0.08in;
    }
    
    .page8-isc .signature-field-page8 {
      margin-bottom: 0.05in;
    }
    
    .page8-isc .signature-label-page8 {
      font-size: 9pt;
      font-weight: 600;
      margin-bottom: 0.02in;
      color: #1f2937;
    }
    
    .page8-isc .signature-line-page8 {
      font-size: 9pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
      padding-bottom: 0.05in;
    }
    
    .page8-isc .page-number-page8 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 9 - ISC FORMAT: DISCLOSURE OF PREMIUM (TERRORISM)
       ============================================ */
    .page9-isc .sidebar-page9 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page9-isc .logo-capital-co-hands-page9 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page9-isc .logo-capital-co-hands-page9 svg,
    .page9-isc .logo-capital-co-hands-page9 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page9-isc .logo-isc-blue {
      width: 0.55in;
      height: 0.55in;
      background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      border-radius: 8px;
      font-size: 16pt;
      margin-bottom: 0.25in;
    }
    
    .page9-isc .page9-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page9-isc .main-content-page9 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.3;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page9-isc .carrier-header-page9 {
      margin-bottom: 0.1in;
    }
    
    .page9-isc .carrier-name-large-page9 {
      font-size: 14pt;
      font-weight: 700;
      text-align: center;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page9-isc .carrier-divider-page9 {
      border-bottom: 1px solid #1f2937;
      margin-bottom: 0.1in;
    }
    
    .page9-isc .section-title-bold-page9 {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      text-align: center;
      text-decoration: underline;
      margin-bottom: 0.08in;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    
    .page9-isc .rejection-title-page9 {
      margin-top: 0.15in;
    }
    
    .page9-isc .premium-disclosure-content-page9 p {
      font-size: 10pt;
      line-height: 1.3;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page9-isc .rejection-statement-box-page9 {
      border: 1px solid #1f2937;
      padding: 0.1in;
      margin-top: 0.08in;
      margin-bottom: 0.15in;
    }
    
    .page9-isc .rejection-statement-box-page9 p {
      font-size: 10pt;
      line-height: 1.3;
      color: #1f2937;
      margin: 0;
    }
    
    .page9-isc .signature-section-page9 {
      margin-top: 0.15in;
      display: flex;
      flex-direction: column;
      gap: 0.1in;
    }
    
    .page9-isc .signature-field-page9 {
      margin-bottom: 0.08in;
    }
    
    .page9-isc .signature-label-page9 {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 0.03in;
      color: #1f2937;
    }
    
    .page9-isc .signature-line-page9 {
      font-size: 10pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
    }
    
    .page9-isc .signature-line-extended-page9 {
      width: 3in;
    }
    
    .page9-isc .footer-code-page9 {
      position: absolute;
      bottom: 0.35in;
      left: 1.7in;
      font-size: 9pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    .page9-isc .page-number-page9 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 10 - ISC FORMAT: SURPLUS LINES COMPLIANCE CERTIFICATION
       ============================================ */
    .page10-isc .main-content-page10 {
      padding: 0.5in 0.75in;
      font-size: 10pt;
      line-height: 1.3;
      max-height: 11in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      width: 100%;
      max-width: 100%;
    }
    
    .page10-isc .section-title-bold-page10 {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      text-align: center;
      text-decoration: underline;
      margin-bottom: 0.15in;
      margin-top: 0.15in;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    
    .page10-isc .certification-content-page10 p {
      font-size: 10pt;
      line-height: 1.3;
      margin-bottom: 0.1in;
      color: #1f2937;
    }
    
    .page10-isc .signature-section-page10 {
      margin-top: 0.2in;
      display: flex;
      flex-direction: column;
      gap: 0.1in;
    }
    
    .page10-isc .signature-field-page10 {
      margin-bottom: 0.08in;
    }
    
    .page10-isc .signature-label-page10 {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 0.03in;
      color: #1f2937;
    }
    
    .page10-isc .signature-line-page10 {
      font-size: 10pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
    }
    
    .page10-isc .page-number-page10 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 11 - ISC FORMAT: LOSS WARRANTY LETTER
       ============================================ */
    .page11-isc .sidebar-page11 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page11-isc .logo-capital-co-hands-page11 {
      width: 1.8in;
      height: 1.8in;
      background: transparent;
      border-radius: 0;
      margin-bottom: 0.25in;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
    }
    
    .page11-isc .logo-capital-co-hands-page11 svg,
    .page11-isc .logo-capital-co-hands-page11 img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page11-isc .page11-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page11-isc .main-content-page11 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.3;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page11-isc .header-section-page11 {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.15in;
      align-items: flex-start;
    }
    
    .page11-isc .header-left-page11,
    .page11-isc .header-right-page11 {
      flex: 1;
    }
    
    .page11-isc .header-right-page11 {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
    }
    
    .page11-isc .logo-capital-co-page11-right {
      width: 1.5in;
      height: 1.5in;
      background: transparent;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: none;
      flex-shrink: 0;
      padding: 0;
      margin-bottom: 0.1in;
    }
    
    .page11-isc .logo-capital-co-page11-right svg,
    .page11-isc .logo-capital-co-page11-right img {
      width: 100% !important;
      height: 100% !important;
      object-fit: contain;
    }
    
    .page11-isc .applicant-name-large-page11 {
      font-size: 11pt;
      font-weight: 700;
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page11-isc .applicant-address-page11,
    .page11-isc .applicant-city-state-zip-page11,
    .page11-isc .applicant-phone-page11,
    .page11-isc .applicant-email-page11,
    .page11-isc .quote-id-page11 {
      font-size: 9pt;
      line-height: 1.3;
      margin-bottom: 0.03in;
      color: #1f2937;
    }
    
    
    .page11-isc .warranty-content-page11 p {
      font-size: 10pt;
      line-height: 1.3;
      margin-bottom: 0.06in;
      color: #1f2937;
    }
    
    .page11-isc .warranty-list-page11 {
      margin-left: 0.25in;
      margin-top: 0.06in;
      margin-bottom: 0.1in;
      font-size: 10pt;
      line-height: 1.3;
      color: #1f2937;
    }
    
    .page11-isc .signature-section-page11 {
      margin-top: 0.15in;
      display: flex;
      flex-direction: column;
      gap: 0.1in;
    }
    
    .page11-isc .signature-field-page11 {
      margin-bottom: 0.08in;
    }
    
    .page11-isc .signature-label-page11 {
      font-size: 10pt;
      font-weight: 600;
      margin-bottom: 0.03in;
      color: #1f2937;
    }
    
    .page11-isc .signature-label-small-page11 {
      font-size: 9pt;
      color: #1f2937;
      display: inline-block;
      margin-right: 0.3in;
    }
    
    .page11-isc .signature-row-page11 {
      display: flex;
      gap: 0.3in;
      align-items: flex-end;
      margin-top: 0.05in;
    }
    
    .page11-isc .signature-line-page11 {
      font-size: 10pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
      width: 100%;
    }
    
    .page11-isc .signature-line-date-page11 {
      width: 1.5in;
      margin-left: auto;
      flex: 0 0 1.5in;
    }
    
    .page11-isc .warranty-footer-page11 {
      margin-top: 0.15in;
      font-size: 9pt;
      line-height: 1.3;
    }
    
    .page11-isc .warranty-footer-page11 p {
      margin: 0;
      color: #1f2937;
    }
    
    .page11-isc .page-number-page11 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    /* ============================================
       PAGE 12 - ISC FORMAT: INVOICE STATEMENT
       ============================================ */
    .page12-isc .sidebar-page12 {
      background: #e5e7eb;
      width: 1.8in;
      padding: 0.35in 0.2in;
      border-right: 1px solid #d1d5db;
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    
    .page12-isc .logo-sterling-page12 {
      width: 0.6in;
      height: 0.6in;
      background: linear-gradient(135deg, #1A1F2E 0%, #2A3240 50%, #1A1F2E 100%);
      border-radius: 8px;
      border: 1px solid rgba(0, 188, 212, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      overflow: hidden;
      margin-bottom: 0.25in;
    }
    
    .page12-isc .logo-sterling-page12 svg {
      width: 100% !important;
      height: 100% !important;
    }
    
    .page12-isc .page12-title {
      font-size: 24pt;
      font-weight: 600;
      color: #374151;
      letter-spacing: 2px;
      writing-mode: vertical-rl;
      text-orientation: mixed;
      white-space: nowrap;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(180deg);
      margin: 0;
    }
    
    .page12-isc .main-content-page12 {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.3;
      max-height: 10.5in;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .page12-isc .invoice-header-page12 {
      margin-bottom: 0.15in;
    }
    
    .page12-isc .invoice-field-page12 {
      font-size: 10pt;
      line-height: 1.3;
      margin-bottom: 0.04in;
      color: #1f2937;
    }
    
    .page12-isc .invoice-section-page12 {
      margin-top: 0.12in;
      margin-bottom: 0.1in;
    }
    
    .page12-isc .invoice-section-title-page12 {
      font-size: 11pt;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 0.06in;
      color: #1f2937;
      border-bottom: 1.5px solid #1f2937;
      padding-bottom: 0.02in;
    }
    
    .page12-isc .invoice-row-page12 {
      display: flex;
      justify-content: space-between;
      padding: 0.03in 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .page12-isc .invoice-label-page12 {
      font-size: 10pt;
      color: #1f2937;
    }
    
    .page12-isc .invoice-value-page12 {
      font-size: 10pt;
      font-weight: 600;
      text-align: right;
      color: #1f2937;
    }
    
    .page12-isc .invoice-row-total-page12 {
      display: flex;
      justify-content: space-between;
      padding: 0.05in 0;
      margin-top: 0.05in;
      border-top: 2px solid #1f2937;
      border-bottom: 2px solid #1f2937;
    }
    
    .page12-isc .payment-option-page12 {
      font-size: 10pt;
      margin-top: 0.12in;
      margin-bottom: 0.1in;
      color: #1f2937;
    }
    
    .page12-isc .binding-statement-page12 {
      margin-top: 0.1in;
      font-size: 9pt;
    }
    
    .page12-isc .binding-statement-page12 p {
      margin-bottom: 0.05in;
      color: #1f2937;
    }
    
    .page12-isc .signature-field-page12 {
      margin-top: 0.05in;
    }
    
    .page12-isc .signature-label-page12 {
      font-size: 9pt;
      font-weight: 600;
      margin-bottom: 0.02in;
      color: #1f2937;
    }
    
    .page12-isc .signature-line-page12 {
      font-size: 9pt;
      border-bottom: 1px solid #1f2937;
      min-height: 0.2in;
      color: #1f2937;
    }
    
    .page12-isc .invoice-disclaimer-page12 {
      margin-top: 0.1in;
      font-size: 8pt;
      font-style: italic;
    }
    
    .page12-isc .invoice-disclaimer-page12 p {
      margin: 0;
      color: #6b7280;
    }
    
    .page12-isc .page-number-page12 {
      position: absolute;
      bottom: 0.35in;
      right: 0.35in;
      font-size: 10pt;
      color: #6b7280;
      font-weight: 400;
    }
    
    .state-forms-isc .main-content-page12.state-forms-content {
      padding: 0.25in 0.35in;
      font-size: 10pt;
      line-height: 1.35;
      color: #1f2937;
    }
    .state-forms-isc .state-forms-intro {
      margin-top: 0.1in;
      margin-bottom: 0.15in;
      color: #374151;
    }
    .state-forms-isc .state-forms-placeholder {
      margin-top: 0.15in;
      padding: 0.15in;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
    .state-forms-isc .state-forms-placeholder p {
      margin: 0.08in 0;
      color: #1f2937;
    }
    .state-forms-isc .state-forms-note {
      margin-top: 0.12in;
      font-size: 9pt;
      color: #6b7280;
    }
    
    /* State forms: full width, no sidebar */
    .pa-form-no-sidebar {
      display: block !important;
      padding: 0;
    }
    .pa-form-no-sidebar .pa-form-content-full {
      width: 100%;
      box-sizing: border-box;
      padding: 0.5in 0.6in 0.55in 0.6in;
      min-height: 11in;
      position: relative;
      font-size: 10pt;
      line-height: 1.4;
      color: #000000;
    }
    .pa-form-no-sidebar .pa-form-page-number {
      position: absolute;
      bottom: 0.35in;
      right: 0.6in;
      font-size: 9pt;
      color: #4b5563;
    }
    .pa-form-no-sidebar .state-forms-content {
      padding: 0.5in 0.6in;
    }
    
    /* Pennsylvania 1609-PR form — clean, professional, easy to read */
    .pa-form-doc {
      font-family: Arial, Helvetica, sans-serif;
      color: #111827;
      line-height: 1.45;
      font-size: 9pt;
    }
    .pa-form-header-block {
      text-align: center;
      margin-bottom: 0.16in;
    }
    .pa-form-title {
      font-weight: 700;
      font-size: 11pt;
      letter-spacing: 0.03em;
      color: #111827;
    }
    .pa-form-meta {
      font-size: 8pt;
      margin-top: 0.05in;
      color: #4b5563;
    }
    .pa-form-rev { display: block; font-weight: 600; color: #374151; }
    .pa-form-note {
      font-size: 7pt;
      display: block;
      margin-top: 0.03in;
      color: #6b7280;
      font-style: italic;
    }
    
    .pa-form-two-boxes {
      display: flex;
      justify-content: space-between;
      align-items: stretch;
      margin-bottom: 0.16in;
      gap: 0.22in;
    }
    .pa-form-box {
      border: 1px solid #374151;
      padding: 0.11in 0.14in;
      font-size: 8pt;
      line-height: 1.4;
      background: #ffffff;
    }
    .pa-form-box-left { flex: 1; min-width: 0; }
    .pa-form-box-right {
      width: 2.1in;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
    }
    .pa-form-box-title {
      font-weight: 700;
      margin-bottom: 0.05in;
      font-size: 8.5pt;
      color: #111827;
    }
    .pa-form-box-address {
      margin-bottom: 0.02in;
      color: #374151;
    }
    .pa-form-id-row {
      display: flex;
      align-items: baseline;
      gap: 0.1in;
      margin-bottom: 0.06in;
    }
    .pa-form-id-row:last-child { margin-bottom: 0; }
    .pa-form-id-label {
      white-space: nowrap;
      font-size: 8pt;
      font-weight: 600;
      color: #374151;
    }
    .pa-form-box-right .pa-ul-id {
      border-bottom: none;
      min-height: 0.9em;
      flex: 1;
      min-width: 1.2in;
      display: inline-block;
    }
    
    .pa-form-intro {
      font-size: 8.5pt;
      margin-bottom: 0.14in;
      line-height: 1.5;
      color: #374151;
      text-align: justify;
    }
    .pa-form-section-title {
      font-weight: 700;
      margin-bottom: 0.1in;
      font-size: 10pt;
      letter-spacing: 0.02em;
      color: #111827;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 0.05in;
    }
    .pa-form-declaration-table {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #374151;
      margin-bottom: 0.12in;
      font-size: 8.5pt;
      table-layout: fixed;
    }
    .pa-form-col-label { width: 1.55in; }
    .pa-form-col-input { width: auto; }
    .pa-form-col-small { width: 1in; }
    .pa-form-declaration-table td {
      border: 1px solid #d1d5db;
      border-bottom: none;
      padding: 0.07in 0.1in;
      vertical-align: middle;
      min-height: 0.26in;
    }
    .pa-form-declaration-table tr:last-child td {
      border-bottom: 1px solid #374151;
    }
    .pa-form-declaration-table .pa-ul {
      min-height: 0.9em;
      border-bottom: none;
      display: inline;
    }
    .pa-form-td-label {
      font-weight: 600;
      font-size: 8pt;
      background: #f8fafc;
      color: #374151;
    }
    .pa-form-td-input { min-width: 0; color: #111827; }
    .pa-form-td-small { text-align: center; color: #111827; }
    .pa-form-cell-label {
      display: block;
      font-size: 7pt;
      font-weight: 600;
      margin-bottom: 0.02in;
      color: #6b7280;
      letter-spacing: 0.02em;
    }
    .pa-form-label-sub {
      font-weight: normal;
      font-size: 6.5pt;
      color: #6b7280;
    }
    .pa-ul {
      display: inline-block;
      border-bottom: 1px solid #374151;
      min-height: 1.15em;
      vertical-align: bottom;
    }
    .pa-ul-mid { min-width: 1.4in; }
    .pa-ul-short { min-width: 0.7in; }
    .pa-ul-long { min-width: 2.8in; flex: 1; }
    .pa-ul-amt { min-width: 1.1in; }
    .pa-ul-date { min-width: 1.1in; }
    .pa-ul-producer { min-width: 1.5in; flex: 1; }
    .pa-ul-sig { min-width: 2.2in; flex: 1; margin-left: 0.1in; }
    .pa-ul-date-sig { min-width: 1in; margin-left: 0.1in; }
    .pa-form-footnotes {
      font-size: 6.5pt;
      margin-bottom: 0.12in;
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 0.1in 0.25in;
      color: #6b7280;
      line-height: 1.35;
    }
    .pa-form-footnotes span { flex: 1; min-width: 1.2in; }
    .pa-form-doc .pa-form-declaration {
      margin-bottom: 0.1in;
      line-height: 1.5;
      font-size: 8pt;
      color: #374151;
      text-align: justify;
    }
    .pa-form-notice {
      margin-left: 0.25in;
      margin-bottom: 0.1in;
      font-size: 8pt;
      line-height: 1.5;
      color: #4b5563;
      text-align: justify;
    }
    .pa-form-legal {
      font-weight: 700;
      margin: 0.1in 0;
      font-size: 8pt;
      line-height: 1.45;
      color: #374151;
    }
    .pa-form-legal-dark { color: #000000 !important; }
    .pa-form-label-dark { color: #000000 !important; font-weight: 700; }
    .pa-form-producer-block {
      display: flex;
      gap: 0.35in;
      margin-top: 0.16in;
      margin-bottom: 0.12in;
      padding-top: 0.1in;
      border-top: 1px solid #e5e7eb;
    }
    .pa-form-producer-col { flex: 1; }
    .pa-form-producer-row {
      display: flex;
      align-items: baseline;
      gap: 0.12in;
      margin-bottom: 0.08in;
    }
    .pa-form-producer-row .pa-form-label {
      min-width: 1.5in;
      font-weight: 600;
      font-size: 8pt;
      color: #374151;
    }
    .pa-form-hint {
      font-size: 6.5pt;
      color: #9ca3af;
      margin-bottom: 0.1in;
    }
    .pa-form-signature-block {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.12in;
      margin-top: 0.14in;
      padding-top: 0.06in;
    }
    .pa-form-sig-label {
      color: #000000 !important;
      font-weight: 700;
    }
    .pa-form-date-label {
      margin-left: 0.25in;
      min-width: auto !important;
      font-weight: 600;
      font-size: 8pt;
      color: #374151;
    }
    .pa-form-sig-hint {
      font-size: 6.5pt;
      text-align: center;
      margin-top: 0.03in;
      color: #9ca3af;
    }
    
    /* Pennsylvania 1609-SLL Addendum (Page 2) */
    .pa-form-addendum .pa-form-addendum-title {
      font-weight: 700;
      font-size: 11pt;
      color: #000000;
      margin-bottom: 0.18in;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .pa-form-addendum-intro {
      font-size: 9pt;
      line-height: 1.5;
      color: #374151;
      margin-bottom: 0.14in;
    }
    .pa-form-addendum-body {
      font-size: 9pt;
      line-height: 1.55;
      color: #374151;
    }
    .pa-ul-addendum {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-width: 1.2in;
      min-height: 1em;
      vertical-align: bottom;
    }
    
    /* Washington Surplus Lines — Fintech-grade professional */
    .wa-form-doc {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
      color: #1e293b;
      line-height: 1.6;
      font-size: 9pt;
    }
    .wa-form-header {
      text-align: center;
      margin-bottom: 0.28in;
      padding-bottom: 0.2in;
      border-bottom: 1px solid #e2e8f0;
    }
    .wa-form-badge {
      font-size: 6.5pt;
      font-weight: 600;
      letter-spacing: 0.15em;
      color: #64748b;
      margin-bottom: 0.12in;
    }
    .wa-form-title {
      font-weight: 600;
      font-size: 14pt;
      letter-spacing: 0.02em;
      color: #0f172a;
    }
    .wa-form-subtitle {
      font-size: 9pt;
      font-weight: 500;
      color: #64748b;
      margin-top: 0.04in;
    }
    .wa-form-doc-type {
      font-weight: 600;
      font-size: 10pt;
      color: #0f172a;
      margin-top: 0.08in;
    }
    .wa-form-block-label {
      font-size: 7pt;
      font-weight: 600;
      letter-spacing: 0.08em;
      color: #64748b;
      margin-bottom: 0.1in;
      text-transform: uppercase;
    }
    .wa-form-info-block {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.16in 0.18in;
      margin-bottom: 0.24in;
      background: #f8fafc;
    }
    .wa-form-info-block .wa-form-block-label { margin-bottom: 0.12in; }
    .wa-form-field-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.04in;
      margin-bottom: 0.12in;
    }
    .wa-form-field-row:last-child { margin-bottom: 0; }
    .wa-form-field-label {
      font-weight: 500;
      font-size: 9pt;
      color: #334155;
      min-width: 1.4in;
    }
    .wa-form-field-sep { color: #94a3b8; }
    .wa-form-field-value { color: #475569; font-weight: 500; }
    .wa-form-field-hint {
      font-size: 7pt;
      color: #94a3b8;
      margin-left: 0.08in;
    }
    .wa-form-ul {
      display: inline-block;
      border-bottom: 1px solid #1e293b;
      min-height: 1.15em;
      vertical-align: bottom;
    }
    .wa-form-ul-long { min-width: 2.5in; flex: 1; }
    .wa-form-ul-inline { min-width: 1.1in; }
    .wa-form-ul-producer { min-width: 1.7in; }
    .wa-form-ul-agency { min-width: 1.9in; flex: 1; }
    .wa-form-ul-sig { min-width: 2.4in; flex: 1; }
    .wa-form-ul-date { min-width: 1.4in; }
    .wa-form-producer-section {
      margin-bottom: 0.22in;
    }
    .wa-form-producer-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.1in;
    }
    .wa-form-producer-hints {
      display: flex;
      gap: 1.35in;
      margin-top: 0.05in;
      padding-left: 0.12in;
    }
    .wa-form-producer-hint {
      font-size: 7pt;
      color: #94a3b8;
    }
    .wa-form-certify-block {
      margin-bottom: 0.22in;
    }
    .wa-form-certify {
      font-size: 9pt;
      line-height: 1.65;
      color: #475569;
      margin: 0;
      text-align: justify;
    }
    .wa-form-emphasis {
      font-weight: 600;
      color: #1e293b;
    }
    .wa-form-disclosure-section {
      margin-bottom: 0.26in;
    }
    .wa-form-disclosure-intro {
      font-size: 9pt;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 0.12in;
    }
    .wa-form-disclosure-list {
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 0.14in 0.18in;
      background: #ffffff;
    }
    .wa-form-disclosure-item {
      display: flex;
      gap: 0.12in;
      font-size: 9pt;
      line-height: 1.6;
      color: #475569;
      margin-bottom: 0.1in;
      text-align: justify;
    }
    .wa-form-disclosure-item:last-child { margin-bottom: 0; }
    .wa-form-bullet {
      font-weight: 600;
      color: #0f172a;
      min-width: 0.2in;
    }
    .wa-form-signature-block {
      display: flex;
      flex-direction: column;
      gap: 0.16in;
      padding: 0.2in 0;
      margin-top: 0.06in;
      border-top: 1px solid #e2e8f0;
    }
    .wa-form-sig-row {
      display: flex;
      align-items: baseline;
      gap: 0.14in;
    }
    .wa-form-date-row {
      display: flex;
      align-items: baseline;
      gap: 0.14in;
    }
    .wa-form-sig-label {
      font-weight: 600;
      font-size: 9pt;
      color: #0f172a;
      white-space: nowrap;
      min-width: 2in;
    }
    .wa-form-date-label {
      font-weight: 600;
      font-size: 9pt;
      color: #0f172a;
      min-width: 0.45in;
    }
    
    /* Texas Diligent Effort — clean, professional, easy to read */
    .tx-form-doc {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
      color: #1e293b;
      font-size: 9pt;
      line-height: 1.5;
      padding-bottom: 0.3in;
    }
    .tx-form-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.24in;
      padding-bottom: 0.16in;
      border-bottom: 1px solid #e2e8f0;
    }
    .tx-form-logo {
      display: flex;
      align-items: flex-start;
    }
    .tx-logo-wrapper {
      display: flex;
      align-items: flex-start;
      gap: 0.1in;
    }
    .tx-logo-img {
      height: 0.85in;
      width: auto;
      max-width: 2.5in;
      object-fit: contain;
    }
    .tx-logo-svg-wrap {
      width: 1.9in;
      flex-shrink: 0;
    }
    .tx-logo-svg {
      width: 100%;
      height: auto;
    }
    .tx-logo-text {
      display: flex;
      flex-direction: column;
    }
    .tx-logo-surplus {
      font-weight: 700;
      font-size: 14pt;
      color: #0f172a;
    }
    .tx-logo-surplus sup {
      font-size: 0.55em;
      vertical-align: super;
    }
    .tx-logo-lines {
      font-weight: 400;
      font-size: 10pt;
      color: #0f172a;
    }
    .tx-logo-office {
      font-size: 7pt;
      color: #64748b;
      margin-top: 0.02in;
    }
    .tx-form-number {
      font-size: 9pt;
      color: #64748b;
      font-weight: 500;
    }
    .tx-form-title {
      font-weight: 700;
      font-size: 17pt;
      text-align: center;
      margin: 0 0 0.14in 0;
      color: #0f172a;
      letter-spacing: 0.02em;
    }
    .tx-form-intro {
      font-size: 9pt;
      text-align: center;
      margin-bottom: 0.16in;
      color: #475569;
      line-height: 1.55;
    }
    .tx-form-link {
      color: #2563eb;
      text-decoration: underline;
    }
    .tx-form-section {
      margin-bottom: 0.14in;
      padding: 0.1in 0.14in;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
    }
    .tx-section-title {
      font-weight: 700;
      font-size: 9pt;
      letter-spacing: 0.06em;
      margin-bottom: 0.08in;
      color: #0f172a;
    }
    .tx-field-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.08in;
      margin-bottom: 0.06in;
    }
    .tx-field-row:last-child { margin-bottom: 0; }
    .tx-field-label {
      font-size: 9pt;
      font-weight: 500;
      color: #334155;
      min-width: 2.1in;
    }
    .tx-ul {
      display: inline-block;
      border-bottom: 1px solid #334155;
      min-height: 1.15em;
      vertical-align: bottom;
      flex: 1;
      min-width: 2in;
    }
    .tx-ul-long { min-width: 3in; flex: 1; }
    .tx-ul-sig { min-width: 2.2in; flex: 1; }
    .tx-ul-date {
      min-width: 1.2in;
      max-width: 1.5in;
      flex: none;
    }
    .tx-options-row {
      display: flex;
      align-items: baseline;
      gap: 0.22in;
      margin-bottom: 0.1in;
    }
    .tx-options-three {
      gap: 0.35in;
      flex-wrap: wrap;
    }
    .tx-form-section-carrier .tx-options-row {
      margin-top: 0.02in;
      margin-bottom: 0.1in;
      align-items: baseline;
    }
    .tx-option { font-size: 9pt; color: #475569; }
    .tx-checkbox { font-family: Arial; }
    .tx-ack-statement {
      font-size: 9pt;
      margin: 0 0 0.14in 0;
      color: #475569;
      line-height: 1.5;
    }
    .tx-sig-block {
      margin-top: 0.12in;
      padding-top: 0.1in;
      border-top: 1px solid #e2e8f0;
    }
    .tx-sig-row {
      display: flex;
      align-items: baseline;
      gap: 0.1in;
      margin-bottom: 0.1in;
      flex-wrap: wrap;
    }
    .tx-sig-row-date .tx-ul-date {
      max-width: 1.5in;
    }
    .tx-form-footer {
      margin-top: 0.18in;
      padding-top: 0.12in;
      border-top: 1px solid #334155;
      page-break-inside: avoid;
    }
    .tx-footer-italic {
      font-size: 8pt;
      font-style: italic;
      color: #334155;
      margin-bottom: 0.06in;
      line-height: 1.45;
    }
    .tx-footer-bullet {
      font-size: 8pt;
      font-style: italic;
      color: #334155;
      margin-bottom: 0.05in;
      line-height: 1.45;
    }
    .tx-disclaimer {
      font-size: 8pt;
      font-style: italic;
      color: #334155;
      margin: 0.08in 0 0 0;
      line-height: 1.45;
    }
    
    /* Oregon Diligent Search Statement — matches official form */
    .or-form-doc {
      font-family: 'Times New Roman', Times, serif;
      color: #000000;
      font-size: 10pt;
      line-height: 1.4;
    }
    .or-form-title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 0.2in 0;
      letter-spacing: 0.15em;
    }
    .or-form-fields { margin-bottom: 0.18in; }
    .or-field-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.06in;
    }
    .or-field-label {
      min-width: 2.2in;
      font-size: 10pt;
    }
    .or-field-value {
      font-size: 10pt;
      margin-left: 0.1in;
    }
    .or-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 1.1em;
      flex: 1;
      min-width: 2.5in;
      margin-left: 0.1in;
      vertical-align: bottom;
    }
    .or-ul-long { min-width: 3in; }
    .or-ul-sig { min-width: 3in; }
    .or-ul-date { min-width: 1.5in; }
    .or-paragraph {
      margin: 0 0 0.1in 0;
      font-size: 10pt;
      text-align: justify;
    }
    .or-indent { margin-left: 0.2in; }
    .or-bullets { margin: 0.1in 0 0.18in 0.4in; }
    .or-bullet {
      margin: 0 0 0.06in 0;
      font-size: 10pt;
      text-align: justify;
    }
    .or-select-prompt { margin-bottom: 0.08in; }
    .or-select-text {
      color: #c00;
      font-weight: bold;
      text-decoration: underline;
      font-size: 10pt;
    }
    .or-red-divider {
      display: flex;
      align-items: center;
      gap: 0.08in;
      margin-bottom: 0.14in;
    }
    .or-red-arrow {
      color: #c00;
      font-size: 12pt;
    }
    .or-red-dash {
      flex: 1;
      height: 0;
      border-bottom: 2px dashed #c00;
    }
    .or-statement {
      margin-bottom: 0.12in;
    }
    .or-statement-title {
      font-weight: bold;
      margin: 0 0 0.06in 0;
      font-size: 10pt;
      color: #c00;
      display: flex;
      align-items: center;
      gap: 0.08in;
    }
    .or-checkbox {
      display: inline-block;
      width: 0.14in;
      height: 0.14in;
      border: 2px solid #c00;
      background: #fff;
      flex-shrink: 0;
    }
    .or-statement-text {
      margin: 0 0 0 0.25in;
      font-size: 10pt;
      line-height: 1.45;
      text-align: justify;
    }
    .or-dash-line {
      border-bottom: 2px dashed #000000;
      margin: 0.12in 0;
    }
    .or-link {
      color: #000000;
      text-decoration: underline;
    }
    .or-signature-block { margin-top: 0.2in; }
    .or-sig-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.1in;
    }
    .or-sig-row .or-field-label { min-width: 2.2in; }
    .or-sig-row .or-ul { margin-left: 0.1in; }
    
    /* Nevada Surplus Lines Association – DECLINATION DETAIL (NSLA 105) */
    .nv-form-doc {
      font-family: 'Times New Roman', Times, serif;
      font-size: 10pt;
      color: #000000;
      line-height: 1.4;
    }
    .nv-form-header {
      text-align: center;
      margin-bottom: 0.2in;
    }
    .nv-form-org {
      font-size: 12pt;
      font-weight: bold;
      font-style: italic;
      margin: 0 0 0.08in 0;
      color: #000000;
    }
    .nv-form-title {
      font-size: 12pt;
      font-weight: bold;
      font-style: italic;
      margin: 0;
      color: #000000;
    }
    .nv-form-intro {
      text-align: left;
      margin: 0 0 0.18in 0;
      font-size: 10pt;
      line-height: 1.5;
    }
    .nv-form-field-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.12in;
    }
    .nv-form-label {
      font-weight: bold;
      font-size: 10pt;
      min-width: 2.8in;
      flex-shrink: 0;
    }
    .nv-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 1.1em;
      flex: 1;
      min-width: 2in;
      margin-left: 0.1in;
      vertical-align: bottom;
    }
    .nv-form-ul-long { min-width: 3.5in; }
    .nv-form-row-two-col {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.15in;
    }
    .nv-form-ul-phone { min-width: 1.5in; }
    .nv-form-label-underwriter { min-width: 1in; margin-left: 0.2in; }
    .nv-form-ul-underwriter { min-width: 2in; }
    .nv-form-decline-block {
      margin-bottom: 0.2in;
      padding-bottom: 0.15in;
      border-bottom: 1px solid #e5e7eb;
    }
    .nv-form-decline-heading {
      font-weight: bold;
      font-size: 10pt;
      margin: 0 0 0.12in 0;
    }
    .nv-form-codes-heading {
      font-weight: bold;
      font-style: italic;
      text-align: center;
      margin: 0.2in 0 0.12in 0;
      font-size: 10pt;
      color: #000000;
    }
    .nv-form-codes-grid {
      display: flex;
      gap: 0.5in;
      margin-bottom: 0.2in;
    }
    .nv-form-codes-col {
      flex: 1;
    }
    .nv-form-code-item {
      margin: 0 0 0.06in 0;
      font-size: 10pt;
      color: #000000;
    }
    .nv-form-explanation {
      font-size: 9pt;
      margin: 0 0 0.2in 0;
      line-height: 1.5;
      text-align: left;
    }
    .nv-form-sig-block {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.2in;
      margin: 0.2in 0 0.15in 0;
    }
    .nv-form-sig-row {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.04in;
      flex: 1;
    }
    .nv-form-sig-center { align-items: center; }
    .nv-form-sig-right { align-items: flex-end; }
    .nv-form-sig-right .nv-form-ul { margin-left: 0; }
    .nv-form-ul-sig {
      min-width: 2in;
      width: 100%;
    }
    .nv-form-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 0.15in;
      padding-top: 0.08in;
      font-size: 9pt;
      color: #333;
    }
    .nv-form-footer-left {}
    .nv-form-footer-right {}
    
    /* Florida Surplus Lines Disclosure and Acknowledgement */
    .fl-form-doc {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #000000;
      line-height: 1.4;
    }
    .fl-form-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 0.2in 0;
      text-align: left;
    }
    .fl-form-paragraph {
      margin: 0 0 0.15in 0;
      text-align: left;
      line-height: 1.5;
    }
    .fl-form-paragraph .fl-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-width: 3in;
      min-height: 1.1em;
      margin: 0 0.05in;
      vertical-align: bottom;
    }
    .fl-form-ul-agency { min-width: 3.5in; }
    .fl-form-hint {
      font-size: 9pt;
      font-style: italic;
      color: #555;
      margin: -0.08in 0 0.15in 0;
    }
    .fl-form-field-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.03in;
      margin-bottom: 0.2in;
    }
    .fl-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 1.1em;
      min-width: 2in;
    }
    .fl-form-ul-field { min-width: 3.5in; }
    .fl-form-ul-long { min-width: 4.5in; width: 100%; }
    .fl-form-label-below {
      font-size: 10pt;
      color: #000000;
    }
    .fl-form-sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.3in;
      margin-bottom: 0.2in;
    }
    .fl-form-sig-left {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.03in;
    }
    .fl-form-sig-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.03in;
    }
    .fl-form-sig-line-row {
      display: flex;
      align-items: baseline;
      gap: 0.1in;
    }
    .fl-form-sig-right .fl-form-sig-line-row {
      flex-direction: row;
      align-items: baseline;
    }
    .fl-form-ul-sig { min-width: 3in; flex: 1; }
    .fl-form-ul-date { min-width: 1.5in; }
    .fl-form-label-inline {
      font-size: 10pt;
      flex-shrink: 0;
    }
    .fl-form-label-date {}
    
    /* California Surplus Line Disclosure (D-1) – two pages */
    .ca-form-doc {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10pt;
      color: #000000;
      line-height: 1.5;
    }
    .ca-form-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 0 0 0.2in 0;
    }
    .ca-form-content {
      margin-bottom: 0.2in;
    }
    .ca-form-item {
      margin: 0 0 0.15in 0;
      text-align: left;
    }
    .ca-form-sig-block {
      margin-top: 0.25in;
    }
    .ca-form-sig-row {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.15in;
      gap: 0.15in;
    }
    .ca-form-sig-row .ca-form-label {
      flex-shrink: 0;
    }
    .ca-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 1.1em;
      flex: 1;
      min-width: 2in;
    }
    .ca-form-footer {
      margin-top: 0.3in;
      font-size: 9pt;
      color: #333;
    }
    
    /* California DILIGENT SEARCH REPORT (SL-2 FORM) – Page 3 */
    .ca-sl2-doc {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8.5pt;
      color: #000000;
      line-height: 1.3;
      padding-bottom: 0.08in;
    }
    .ca-sl2-header {
      text-align: center;
      margin-bottom: 0.1in;
    }
    .ca-sl2-org {
      margin: 0 0 0.04in 0;
      font-size: 9.5pt;
    }
    .ca-sl2-title {
      margin: 0;
      font-size: 10pt;
      font-weight: bold;
    }
    .ca-sl2-section {
      display: flex;
      align-items: flex-start;
      gap: 0.08in;
      margin-bottom: 0.08in;
    }
    .ca-sl2-section-grey .ca-sl2-section-body {
      background: #f1f5f9;
      border: 1px solid #000000;
      padding: 0.08in;
    }
    .ca-sl2-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 0.22in;
      height: 0.22in;
      background: #000000;
      color: #ffffff;
      font-weight: bold;
      font-size: 10pt;
      flex-shrink: 0;
    }
    .ca-sl2-section-body { flex: 1; }
    .ca-sl2-instruction {
      margin: 0 0 0.06in 0;
      font-size: 8.5pt;
    }
    .ca-sl2-statement { margin: 0 0 0.06in 0; }
    .ca-sl2-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 0.9em;
      min-width: 1.5in;
    }
    .ca-sl2-ul-name { min-width: 3in; }
    .ca-sl2-ul-mid { min-width: 2in; }
    .ca-sl2-ul-long { min-width: 2.5in; }
    .ca-sl2-ul-sig { min-width: 2.5in; width: 100%; }
    .ca-sl2-option { margin: 0 0 0.05in 0; }
    .ca-sl2-or {
      text-align: center;
      margin: 0.02in 0;
      font-size: 8.5pt;
    }
    .ca-sl2-hint {
      font-size: 7.5pt;
      color: #333;
      margin: -0.03in 0 0.05in 0;
    }
    .ca-sl2-intro { margin: 0 0 0.06in 0; }
    .ca-sl2-table {
      border: 1px solid #000000;
      margin: 0.06in 0;
      width: 100%;
    }
    .ca-sl2-table-row {
      display: flex;
      border-bottom: 1px solid #000000;
    }
    .ca-sl2-table-row:last-child { border-bottom: none; }
    .ca-sl2-table-cell {
      flex: 1;
      border-right: 1px solid #000000;
      padding: 0.04in;
      display: flex;
      flex-direction: column;
      gap: 0.02in;
    }
    .ca-sl2-table-cell:last-child { border-right: none; }
    .ca-sl2-cell-header {
      background: #000000;
      color: #ffffff;
      font-weight: bold;
      font-size: 7pt;
      padding: 0.04in;
      justify-content: center;
      align-items: center;
    }
    .ca-sl2-cell-header span { text-align: center; }
    .ca-sl2-cell-label {
      font-size: 7pt;
      font-weight: bold;
    }
    .ca-sl2-input {
      border: 1px solid #000000;
      min-height: 0.18in;
      background: #fff;
    }
    .ca-sl2-input-sub {
      min-height: 0.14in;
      margin-top: 0.01in;
    }
    .ca-sl2-textarea {
      border: 1px solid #000000;
      min-height: 0.45in;
      background: #fff;
      margin-top: 0.05in;
    }
    .ca-sl2-yn {
      display: inline-flex;
      align-items: center;
      gap: 0.06in;
    }
    .ca-sl2-cb {
      display: inline-block;
      width: 0.1in;
      height: 0.1in;
      border: 1.5px solid #000000;
      background: #fff;
      vertical-align: middle;
    }
    .ca-sl2-addendum { margin: 0.05in 0 0 0; }
    .ca-sl2-link {
      color: #2563eb;
      text-decoration: underline;
    }
    .ca-sl2-cert {
      margin: 0.08in 0;
      font-size: 8.5pt;
      line-height: 1.35;
    }
    .ca-sl2-sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.2in;
      margin: 0.08in 0;
    }
    .ca-sl2-sig-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.02in;
      flex: 1;
    }
    .ca-sl2-sig-label {
      font-size: 7.5pt;
      color: #333;
    }
    .ca-sl2-footer {
      font-size: 7.5pt;
      color: #333;
      margin-top: 0.05in;
      margin-bottom: 0;
    }
    
    /* Colorado Statement of Diligent Effort */
    .co-form-doc {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 9pt;
      color: #000000;
      line-height: 1.3;
      position: relative;
      padding: 0.15in;
    }
    .co-form-watermark {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 42pt;
      font-weight: bold;
      color: rgba(0, 0, 0, 0.07);
      text-align: center;
      pointer-events: none;
      line-height: 1.2;
    }
    .co-form-watermark-sub {
      font-size: 12pt;
      display: block;
      margin: 0.02in 0;
    }
    .co-form-border {
      position: relative;
      border: 2px solid #1e3a5f;
      padding: 0.15in;
      background: #ffffff;
      overflow: hidden;
    }
    .co-form-border > .co-form-watermark {
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .co-form-header {
      position: relative;
      z-index: 1;
      background: #1e3a5f;
      color: #ffffff;
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      padding: 0.12in 0.15in;
      margin: -0.15in -0.15in 0.15in -0.15in;
    }
    .co-form-intro-row {
      display: flex;
      align-items: baseline;
      gap: 0.1in;
      margin-bottom: 0.06in;
    }
    .co-form-intro-text { flex-shrink: 0; }
    .co-form-ul {
      display: inline-block;
      border-bottom: 1px solid #999999;
      min-height: 1em;
      flex: 1;
      min-width: 1in;
    }
    .co-form-ul-intro { min-width: 2in; }
    .co-form-ul-license { min-width: 1.2in; }
    .co-form-ul-long { min-width: 2.5in; }
    .co-form-ul-mid { min-width: 1.2in; }
    .co-form-ul-date { min-width: 1.2in; }
    .co-form-ul-sig { min-width: 2in; }
    .co-form-field-block { margin-bottom: 0.06in; }
    .co-form-field-centered {
      text-align: center;
    }
    .co-form-field-centered .co-form-ul { margin: 0 auto; }
    .co-form-label-above {
      display: block;
      font-size: 9pt;
      margin-bottom: 0.02in;
      text-align: center;
    }
    .co-form-field-row {
      display: flex;
      align-items: baseline;
      gap: 0.1in;
      margin-bottom: 0.05in;
      flex-wrap: wrap;
    }
    .co-form-label {
      flex-shrink: 0;
      font-size: 9pt;
    }
    .co-form-row-inline { flex-wrap: wrap; }
    .co-form-insurer-block {
      margin-bottom: 0.1in;
      padding-bottom: 0.08in;
      border-bottom: 1px solid #e5e7eb;
    }
    .co-form-insurer-num {
      font-weight: bold;
      margin: 0 0 0.05in 0;
      font-size: 9pt;
    }
    .co-form-hint {
      font-size: 8pt;
      font-style: italic;
      color: #000000;
      margin: -0.02in 0 0.04in 0;
    }
    .co-form-row-two {
      flex-wrap: wrap;
    }
    .co-form-sig-divider {
      border: none;
      border-top: 1px solid #cbd5e1;
      margin: 0.12in 0 0.08in 0;
    }
    .co-form-sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.2in;
      margin: 0.1in 0;
    }
    .co-form-sig-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.02in;
      flex: 1;
    }
    .co-form-definition {
      font-size: 8.5pt;
      line-height: 1.4;
      margin: 0.1in 0;
      text-align: left;
    }
    .co-form-footer-rev {
      font-size: 8pt;
      text-align: right;
      margin: 0.08in 0;
    }
    .co-form-attest {
      display: flex;
      align-items: flex-start;
      gap: 0.1in;
      margin: 0.1in 0;
    }
    .co-form-checkbox {
      display: inline-block;
      width: 0.14in;
      height: 0.14in;
      border: 2px solid #000000;
      background: #fff;
      flex-shrink: 0;
    }
    .co-form-attest-text {
      flex: 1;
      font-size: 8.5pt;
      line-height: 1.4;
      margin: 0;
    }
    
    /* New York Part C – Affidavit by Producing Broker (NYSID Form 41C) */
    .ny-form-doc {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9.5pt;
      color: #000000;
      line-height: 1.25;
    }
    .ny-form-page1 {
      padding-bottom: 0.15in;
      page-break-inside: avoid;
    }
    .ny-form-page1 .ny-form-title {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 0.1in 0;
    }
    .ny-form-page1 .ny-form-section { margin-bottom: 0.08in; }
    .ny-form-section-heading {
      font-weight: bold;
      margin: 0 0 0.05in 0;
      font-size: 9.5pt;
    }
    .ny-form-inline-label { font-weight: normal; }
    .ny-form-section-head-row {
      display: flex;
      align-items: center;
      gap: 0.1in;
      margin-bottom: 0.08in;
      flex-wrap: wrap;
    }
    .ny-form-input-box {
      display: inline-block;
      border: 1px solid #000000;
      min-height: 0.28in;
      padding: 0.04in 0.08in;
      font-size: 10pt;
      background: #fff;
    }
    .ny-form-box-affidavit { min-width: 1.2in; }
    .ny-form-box-name { min-width: 2.2in; }
    .ny-form-box-license { min-width: 1.5in; }
    .ny-form-box-addr { min-width: 2.5in; flex: 1; }
    .ny-form-box-city { min-width: 1.4in; }
    .ny-form-box-state { min-width: 0.7in; }
    .ny-form-box-zip { min-width: 1in; }
    .ny-form-field-block {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.03in;
    }
    .ny-form-label-below {
      font-size: 9pt;
      color: #000;
    }
    .ny-form-row-boxes {
      display: flex;
      align-items: flex-end;
      gap: 0.1in;
      margin-bottom: 0.08in;
      flex-wrap: wrap;
    }
    .ny-form-row-address { margin-bottom: 0.06in; }
    .ny-form-field-addr { flex: 1; min-width: 2in; }
    .ny-form-field-addr .ny-form-input-box { width: 100%; }
    .ny-form-field-insured .ny-form-input-box { min-width: 3in; }
    .ny-form-footer-combined {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.12in;
      padding-top: 0.08in;
      font-size: 7.5pt;
      color: #333;
      flex-wrap: wrap;
      gap: 0.08in;
      page-break-inside: avoid;
    }
    .ny-form-footer-center { flex: 1; text-align: center; }
    .ny-form-section-boxed {
      border: 3px solid #000000;
      padding: 0.08in;
      margin: 0.08in 0;
    }
    .ny-form-row-inline {
      display: flex;
      align-items: baseline;
      margin-bottom: 0.06in;
      flex-wrap: wrap;
      gap: 0.05in;
    }
    .ny-form-row-city-state-zip { flex-wrap: wrap; }
    .ny-form-label {
      font-size: 10pt;
      white-space: nowrap;
    }
    .ny-form-label-state { margin-left: 0.2in; }
    .ny-form-label-date { margin-left: 0.15in; }
    .ny-form-label-naic { margin-left: 0.15in; }
    .ny-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-height: 1.1em;
      flex: 1;
      min-width: 1.5in;
      vertical-align: bottom;
    }
    .ny-form-ul-affidavit { min-width: 1.2in; max-width: 2in; }
    .ny-form-ul-license { min-width: 1.5in; }
    .ny-form-ul-name { min-width: 2.5in; }
    .ny-form-ul-addr { min-width: 3in; }
    .ny-form-ul-city { min-width: 1.5in; }
    .ny-form-ul-state { min-width: 0.8in; }
    .ny-form-ul-zip { min-width: 1in; }
    .ny-form-ul-insured { min-width: 3in; }
    .ny-form-ul-company { min-width: 2.5in; }
    .ny-form-ul-date { min-width: 1.2in; }
    .ny-form-ul-naic { min-width: 1in; }
    .ny-form-ul-other { min-width: 1.5in; margin-left: 0.1in; }
    .ny-form-note {
      font-size: 8.5pt;
      color: #333;
      margin: 0.04in 0 0 0;
      font-style: italic;
    }
    .ny-form-question-row {
      display: flex;
      align-items: flex-start;
      gap: 0.1in;
      margin-bottom: 0.05in;
    }
    .ny-form-yn {
      flex-shrink: 0;
      font-size: 10pt;
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 0.04in;
    }
    .ny-form-question { flex: 1; }
    .ny-form-cb {
      display: inline-block;
      width: 0.12in;
      height: 0.12in;
      border: 1.5px solid #000000;
      background: #fff;
      flex-shrink: 0;
      vertical-align: middle;
    }
    .ny-form-cb-right { margin-left: 0.08in; }
    .ny-form-declination-item {
      margin: 0 0 0.08in 0;
      font-size: 9.5pt;
      display: flex;
      align-items: flex-start;
      gap: 0.08in;
    }
    .ny-form-declination-item .ny-form-yn { margin-top: 0.02in; }
    .ny-form-subsection-heading {
      font-weight: bold;
      text-align: center;
      margin: 0.1in 0 0.08in 0;
      font-size: 9.5pt;
    }
    .ny-form-decline-schedule { margin-top: 0.08in; }
    .ny-form-decline-row {
      display: flex;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 0.06in;
      margin-bottom: 0.06in;
    }
    .ny-form-reason-intro { margin: 0.06in 0 0.05in 0; font-size: 9.5pt; }
    .ny-form-reason-list { margin-left: 0; }
    .ny-form-reason-item {
      display: flex;
      align-items: flex-start;
      gap: 0.06in;
      margin-bottom: 0.04in;
      font-size: 9pt;
    }
    .ny-form-reason-item .ny-form-cb { flex-shrink: 0; margin-top: 0.02in; }
    .ny-form-footer {
      display: flex;
      justify-content: space-between;
      margin-top: 0.25in;
      padding-top: 0.1in;
      font-size: 9pt;
      color: #333;
    }
    .ny-form-footer-left {}
    .ny-form-footer-right {}
    .ny-form-decline-block {
      margin-bottom: 0.2in;
    }
    .ny-form-affirmation-box {
      border: 3px solid #000000;
      padding: 0.15in;
      margin-top: 0.2in;
    }
    .ny-form-affirmation-heading {
      font-weight: bold;
      text-align: center;
      margin: 0 0 0.12in 0;
      font-size: 11pt;
    }
    .ny-form-affirmation-text {
      margin: 0 0 0.15in 0;
      font-size: 10pt;
      line-height: 1.5;
    }
    .ny-form-affirmation-sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      gap: 0.2in;
      margin-top: 0.15in;
    }
    .ny-form-sig-left, .ny-form-sig-right {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.04in;
    }
    .ny-form-sig-left { flex: 1; min-width: 2.5in; }
    .ny-form-sig-right { align-items: flex-end; }
    .ny-form-affirmation-sig-row .ny-form-ul-date { min-width: 1.2in; }
    .ny-form-ul-affiant { min-width: 2in; }
    .ny-form-ul-sig { min-width: 2.5in; width: 100%; }
    
    /* New York Page 3 - Notice of Excess Line Placement */
    .ny-form-page3 {
      font-family: 'Times New Roman', Times, serif;
      font-size: 9.5pt;
      line-height: 1.3;
      color: #000000;
      padding-bottom: 0.1in;
    }
    .ny-form-notice-box {
      width: 100%;
      height: 0.4in;
      border: 2px solid #000000;
      margin: 0 auto 0.08in auto;
      max-width: 4in;
    }
    .ny-form-notice-title {
      font-size: 11pt;
      font-weight: bold;
      text-align: center;
      margin: 0 0 0.08in 0;
    }
    .ny-form-notice-date {
      text-align: center;
      margin-bottom: 0.08in;
      font-size: 9.5pt;
    }
    .ny-form-notice-date .ny-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-width: 1.5in;
      min-height: 1em;
    }
    .ny-form-notice-text {
      text-align: justify;
      margin: 0 0 0.06in 0;
      font-size: 9.5pt;
      line-height: 1.35;
    }
    .ny-form-notice-text .ny-form-ul {
      display: inline-block;
      border-bottom: 1px solid #000000;
      min-width: 2in;
      min-height: 1em;
      margin: 0 0.05in;
    }
    .ny-form-ul-insured { min-width: 2.5in; }
    .ny-form-ul-producer { min-width: 2in; }
    .ny-form-notice-list {
      margin: 0.06in 0 0.06in 0.2in;
    }
    .ny-form-notice-list-item {
      margin: 0 0 0.05in 0;
      text-indent: -0.3in;
      padding-left: 0.3in;
      line-height: 1.35;
    }
    .ny-form-cost-title {
      font-size: 10pt;
      font-weight: bold;
      text-align: center;
      text-decoration: underline;
      margin: 0.1in 0 0.08in 0;
    }
    .ny-form-cost-text {
      text-align: justify;
      margin: 0 0 0.06in 0;
      font-size: 9.5pt;
      line-height: 1.35;
    }
    .ny-form-cost-text sup {
      font-size: 7pt;
      vertical-align: super;
    }
    .ny-form-cost-table {
      margin: 0.1in 0;
      font-size: 9.5pt;
    }
    .ny-form-cost-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      padding: 0.02in 0;
      border-bottom: 1px solid #000000;
    }
    .ny-form-cost-header {
      border-bottom: 2px solid #000000;
      padding-bottom: 0.04in;
      margin-bottom: 0.05in;
    }
    .ny-form-cost-col-left {
      flex: 1;
      padding-right: 0.2in;
    }
    .ny-form-cost-col-right {
      flex: 1;
      text-align: right;
    }
    .ny-form-cost-col-full {
      flex: 1;
    }
    .ny-form-cost-col-amount {
      min-width: 1.5in;
      text-align: right;
      padding-left: 0.2in;
    }
    .ny-form-cost-section {
      margin: 0.08in 0;
    }
    .ny-form-cost-total {
      border-top: 2px solid #000000;
      border-bottom: 3px double #000000;
      padding: 0.05in 0;
      margin-top: 0.05in;
    }
    .ny-form-page3-footer {
      margin-top: 0.1in;
    }
    .ny-form-signature-section {
      margin: 0 0 0.06in 0;
    }
    .ny-form-signature-line {
      border-bottom: 1px solid #000000;
      width: 3.5in;
      min-height: 0.25in;
      margin-bottom: 0.03in;
    }
    .ny-form-signature-label {
      font-size: 8.5pt;
      color: #000;
    }
    .ny-form-footnote {
      margin-top: 0.06in;
      margin-bottom: 0;
      font-size: 8.5pt;
      color: #333;
    }
    .ny-form-footnote sup {
      font-size: 7pt;
      vertical-align: super;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 3px solid #4A9EFF;
      align-items: flex-start;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px 8px 0 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
    }
    
    .header-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4A9EFF 0%, #6bb0ff 50%, #4A9EFF 100%);
    }
    
    .header-left,
    .header-right {
      flex: 1;
    }
    
    .logo-small {
      width: 0.5in;
      height: 0.5in;
      background: linear-gradient(135deg, #4A9EFF 0%, #3a7fd4 100%);
      color: #ffffff;
      border-radius: 10px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 18pt;
      margin-bottom: var(--spacing-sm);
      box-shadow: var(--shadow-md);
      border: 2px solid rgba(255, 255, 255, 0.2);
    }
    
    .agency-info {
      font-size: 10pt;
      line-height: 1.7;
      color: #374151;
    }
    
    .agency-info > div {
      margin-bottom: 0.06in;
    }
    
    .agency-name {
      font-weight: 700;
      font-size: 10.5pt;
      margin-bottom: 0.08in;
      color: #1f2937;
    }
    
    .brand-name {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      color: #1f2937;
      letter-spacing: -0.3px;
      margin-bottom: var(--spacing-xs);
      line-height: 1.3;
    }
    
    .brand-subtitle {
      font-size: var(--font-size-base);
      color: #6b7280;
      font-weight: 500;
      letter-spacing: 0.8px;
      text-transform: uppercase;
      font-size: 10pt;
    }
    
    .application-id-section {
      font-size: var(--font-size-base);
      margin-bottom: var(--spacing-md);
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-left: 4px solid #4A9EFF;
      border-radius: 8px;
      font-weight: 600;
      color: #1f2937;
      box-shadow: var(--shadow-sm);
      border-top: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .two-column-section {
      display: flex;
      gap: 0.4in;
      margin-bottom: 0.3in;
      align-items: flex-start;
    }
    
    .column-left,
    .column-right {
      flex: 1;
    }
    
    .section-title {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      margin-bottom: var(--spacing-sm);
      text-transform: uppercase;
      color: #1f2937;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }
    
    .section-title-underline {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      margin: var(--spacing-md) 0 var(--spacing-sm) 0;
      text-transform: uppercase;
      text-decoration: underline;
      text-decoration-thickness: 2px;
      text-underline-offset: 6px;
      text-decoration-color: #4A9EFF;
      color: #1f2937;
      letter-spacing: 0.5px;
      line-height: 1.3;
    }
    
    .section-title-uppercase {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      margin: var(--spacing-lg) 0 var(--spacing-md) 0;
      text-transform: uppercase;
      color: #1f2937;
      letter-spacing: 0.5px;
      padding: var(--spacing-xs) var(--spacing-sm);
      padding-bottom: var(--spacing-xs);
      border-bottom: 3px solid #4A9EFF;
      line-height: 1.3;
      background: linear-gradient(135deg, rgba(74, 158, 255, 0.05) 0%, transparent 100%);
      border-radius: 6px 6px 0 0;
      position: relative;
    }
    
    .section-title-uppercase::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4A9EFF 0%, #6bb0ff 50%, #4A9EFF 100%);
    }
    
    .field-row {
      font-size: var(--font-size-base); /* 16-18px ≈ 12-13.5pt - Input text */
      font-weight: 400; /* Inter Regular */
      margin: var(--spacing-sm) 0;
      padding: var(--spacing-xs) var(--spacing-sm);
      line-height: 1.6;
      color: #6b7280;
      border-bottom: 1px dotted #e5e7eb;
      position: relative;
      padding-left: var(--spacing-md);
    }
    
    .field-row::before {
      content: '▸';
      position: absolute;
      left: 0;
      color: #4A9EFF;
      font-weight: 700;
      font-size: 10pt;
    }
    
    .field-row strong {
      color: #1f2937;
      font-weight: 500; /* Inter Medium for field labels */
      font-size: var(--font-size-sm); /* 13-14px ≈ 10-10.5pt */
      letter-spacing: 0.2px;
      display: inline-block;
      min-width: 2.5in;
      margin-right: var(--spacing-xs);
    }
    
    .field-row:last-child {
      border-bottom: none;
    }
    
    .field-value {
      font-size: var(--font-size-base); /* 16-18px ≈ 12-13.5pt - Input text */
      font-weight: 400; /* Inter Regular */
      margin: var(--spacing-xs) 0;
      color: #1f2937;
      line-height: 1.6;
    }
    
    .field-value-large {
      font-size: var(--font-size-xl);
      font-weight: 700;
      margin-top: var(--spacing-sm);
      color: #1f2937;
      letter-spacing: 0.3px;
    }
    
    .quote-information-section,
    .applicant-information-section {
      margin: 0.3in 0;
    }
    
    .coverages-section {
      margin: 0.3in 0;
    }
    
    .coverages-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--spacing-sm);
      margin-top: var(--spacing-sm);
      padding: var(--spacing-md);
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 10px;
      border: 1px solid #e5e7eb;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      position: relative;
    }
    
    .coverages-grid::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #4A9EFF 0%, transparent 100%);
      border-radius: 10px 10px 0 0;
    }
    
    .coverage-item {
      font-size: var(--font-size-sm);
      padding: var(--spacing-xs) 0;
      line-height: 1.7;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .coverage-item:last-child {
      border-bottom: none;
    }
    
    .coverage-item strong {
      color: #1f2937;
      font-weight: 600;
      display: inline-block;
      min-width: 2.5in;
    }
    
    .class-code-section {
      display: flex;
      gap: 0.4in;
      margin: 0.3in 0;
      padding: 0.2in;
      background: #f9fafb;
      border-radius: 6px;
    }
    
    .class-code-left,
    .class-code-right {
      flex: 1;
    }
    
    .exposures-grid {
      margin: 0.2in 0;
    }
    
    .exposure-item {
      font-size: var(--font-size-sm);
      margin: var(--spacing-sm) 0;
      line-height: 1.8;
      color: #6b7280;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: 1px solid #e5e7eb;
      background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      border-radius: 6px;
      border-left: 2px solid #4A9EFF;
      position: relative;
    }
    
    .exposure-item::before {
      content: '●';
      position: absolute;
      left: var(--spacing-xs);
      color: #4A9EFF;
      font-size: 8pt;
    }
    
    .exposure-item:last-child {
      border-bottom: none;
    }
    
    .exposure-item strong {
      color: #1f2937;
      font-weight: 600;
      display: inline-block;
      min-width: 2.5in;
      margin-left: var(--spacing-sm);
    }
    
    .footnote {
      font-size: var(--font-size-xs);
      color: #9ca3af;
      margin: var(--spacing-sm) 0;
      font-style: italic;
      line-height: 1.7;
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-left: 3px solid #d1d5db;
      border-radius: 6px;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    
    .footnote::before {
      content: '※';
      position: absolute;
      left: var(--spacing-xs);
      top: var(--spacing-xs);
      color: #9ca3af;
      font-size: 10pt;
    }
    
    .work-description {
      margin: 0.2in 0;
    }
    
    .description-text {
      font-size: var(--font-size-sm);
      margin-top: var(--spacing-xs);
      padding: var(--spacing-sm);
      background: #ffffff;
      border: 2px solid #d1d5db;
      border-radius: 8px;
      min-height: 0.7in;
      line-height: 1.8;
      color: #1f2937;
      box-shadow: var(--shadow-sm);
      transition: border-color 0.2s;
    }
    
    .description-text:focus {
      border-color: #4A9EFF;
      outline: none;
      box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
    }
    
    .work-percentages,
    .structural-details {
      margin: 0.2in 0;
    }
    
    .percentage-item,
    .detail-item {
      font-size: var(--font-size-sm);
      margin: var(--spacing-sm) 0;
      line-height: 1.8;
      color: #6b7280;
      padding: var(--spacing-xs) var(--spacing-sm);
      background: #ffffff;
      border-left: 2px solid #4A9EFF;
      border-radius: 4px;
      position: relative;
    }
    
    .percentage-item::before,
    .detail-item::before {
      content: '▹';
      position: absolute;
      left: var(--spacing-xs);
      color: #4A9EFF;
      font-size: 8pt;
    }
    
    .percentage-item strong,
    .detail-item strong {
      color: #1f2937;
      font-weight: 600;
      display: inline-block;
      min-width: 2in;
      margin-left: var(--spacing-sm);
    }
    
    .ocip-section {
      margin: 0.2in 0;
    }
    
    .ocip-question,
    .ocip-followup,
    .ocip-receipts,
    .losses {
      font-size: 10pt;
      margin: 0.12in 0;
      line-height: 1.7;
      color: #374151;
    }
    
    .ocip-question strong,
    .ocip-followup strong,
    .ocip-receipts strong,
    .losses strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .work-experience-questions {
      margin: 0.2in 0;
    }
    
    .question-item {
      margin: var(--spacing-md) 0;
      padding: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 2px solid #e5e7eb;
      background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
      border-radius: 8px;
      border-left: 3px solid #4A9EFF;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    
    .question-item::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(180deg, #4A9EFF 0%, #6bb0ff 100%);
      border-radius: 8px 0 0 8px;
    }
    
    .question-item:last-child {
      border-bottom: none;
    }
    
    .question-text {
      font-size: var(--font-size-sm);
      margin-bottom: var(--spacing-xs);
      line-height: 1.8;
      color: #6b7280;
      text-align: justify;
    }
    
    .question-text strong {
      color: #1f2937;
      font-weight: 700;
      letter-spacing: 0.2px;
    }
    
    .yes-no-options {
      font-size: var(--font-size-sm);
      margin: var(--spacing-xs) 0;
      padding: var(--spacing-xs) var(--spacing-sm);
      font-weight: 600;
      color: #1f2937;
      background: #f9fafb;
      border-radius: 6px;
      display: inline-block;
      border: 1px solid #e5e7eb;
    }
    
    .yes-no-options span {
      margin: 0 var(--spacing-xs);
      padding: 0 var(--spacing-xs);
    }
    
    .yes-no-options span[style*="underline"] {
      color: #4A9EFF;
      font-weight: 700;
    }
    
    .explanation-field {
      font-size: 10pt;
      margin-top: 0.1in;
      padding: 0.1in;
      padding-left: 0.15in;
      background: #f9fafb;
      border-left: 3px solid #d1d5db;
      border-radius: 4px;
      line-height: 1.7;
      color: #374151;
    }
    
    .explanation-field strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .percentage-field {
      font-size: 10pt;
      margin-top: 0.1in;
      padding: 0.08in 0;
      color: #374151;
    }
    
    .percentage-field strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .page-number {
      position: absolute;
      bottom: 0.4in;
      right: 0.6in;
      font-size: var(--font-size-xs);
      color: #9ca3af;
      font-weight: 600;
      padding: 0.06in 0.18in;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 20px;
      border: 1px solid #e5e7eb;
      box-shadow: var(--shadow-sm);
      letter-spacing: 0.5px;
    }
    
    /* Professional Badges */
    .badge {
      display: inline-block;
      padding: 0.05in 0.15in;
      border-radius: 20px;
      font-size: var(--font-size-xs);
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: var(--shadow-sm);
    }
    
    .badge-primary {
      background: #4A9EFF;
      color: #ffffff;
      border: 1px solid #3a7fd4;
    }
    
    .badge-success {
      background: var(--accent-color);
      color: #ffffff;
      border: 1px solid #059669;
    }
    
    .badge-warning {
      background: var(--warning-color);
      color: #ffffff;
      border: 1px solid #d97706;
    }
    
    .badge-secondary {
      background: #f3f4f6;
      color: #1f2937;
      border: 1px solid #d1d5db;
    }
    
    /* Application ID Badge */
    .application-id-badge {
      display: inline-block;
      padding: 0.08in 0.2in;
      background: linear-gradient(135deg, #4A9EFF 0%, #3a7fd4 100%);
      color: #ffffff;
      border-radius: 25px;
      font-size: var(--font-size-sm);
      font-weight: 700;
      letter-spacing: 1px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03), 0 0 0 1px rgba(255, 255, 255, 0.1) inset;
      border: 2px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }
    
    .application-id-badge::before {
      content: '';
      position: absolute;
      top: 2px;
      left: 2px;
      right: 2px;
      height: 40%;
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.3) 0%, transparent 100%);
      border-radius: 25px 25px 0 0;
      pointer-events: none;
    }
    
    .sub-question-header {
      font-size: var(--font-size-base);
      font-weight: 700;
      margin: var(--spacing-sm) 0 var(--spacing-xs) 0;
      color: #1f2937;
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, #f3f4f6 0%, #f9fafb 100%);
      border-left: 4px solid #4A9EFF;
      border-radius: 6px;
      box-shadow: var(--shadow-sm);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 10pt;
    }
    
    .sub-question-item {
      margin: var(--spacing-sm) 0;
      padding: var(--spacing-sm) var(--spacing-md);
      padding-left: var(--spacing-lg);
      background: #ffffff;
      border-left: 2px solid #d1d5db;
      border-radius: 4px;
      position: relative;
    }
    
    .sub-question-item::before {
      content: '→';
      position: absolute;
      left: var(--spacing-sm);
      color: #4A9EFF;
      font-weight: 700;
    }
    
    .policy-endorsements-content {
      font-size: 11pt;
      margin-top: 0.15in;
      padding: 0.15in;
      background: #f9fafb;
      border-radius: 6px;
      font-weight: 600;
      color: #1f2937;
    }
    
    .notice-content,
    .exclusions-content,
    .agreement-content,
    .terrorism-content {
      font-size: 10pt;
      line-height: 1.8;
      margin: 0.2in 0;
      color: #374151;
    }
    
    .notice-content p,
    .exclusions-content p,
    .agreement-content p,
    .terrorism-content p {
      margin: 0.15in 0;
      text-align: justify;
    }
    
    .initial-line {
      font-size: 10pt;
      margin: 0.2in 0;
      padding-top: 0.15in;
      padding-bottom: 0.1in;
      border-top: 1px solid #e5e7eb;
      color: #374151;
      font-weight: 500;
    }
    
    .signature-section {
      margin-top: var(--spacing-lg);
      padding: var(--spacing-md);
      border-top: 3px solid #4A9EFF;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
      position: relative;
      overflow: hidden;
    }
    
    .signature-section::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4A9EFF 0%, #6bb0ff 50%, #4A9EFF 100%);
    }
    
    .signature-field {
      margin: var(--spacing-md) 0;
      padding: var(--spacing-sm);
      background: #ffffff;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    
    .signature-label {
      font-size: var(--font-size-sm);
      font-weight: 600;
      margin-bottom: var(--spacing-xs);
      color: #1f2937;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      font-size: 9pt;
    }
    
    .signature-line {
      font-size: var(--font-size-sm);
      border-bottom: 2px dotted #1f2937;
      min-width: 3.5in;
      padding-bottom: var(--spacing-xs);
      color: #1f2937;
      margin-top: var(--spacing-xs);
      background: #ffffff;
    }
    
    .signature-date {
      font-size: var(--font-size-xs);
      color: #6b7280;
      margin-top: var(--spacing-xs);
      font-style: italic;
    }
    
    .carrier-header {
      text-align: center;
      margin-bottom: var(--spacing-lg);
      padding: var(--spacing-md);
      padding-bottom: var(--spacing-md);
      border-bottom: 3px solid #4A9EFF;
      background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
      border-radius: 8px;
      box-shadow: var(--shadow-sm);
    }
    
    .carrier-name-large {
      font-size: var(--font-size-2xl);
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
      color: #1f2937;
      letter-spacing: 0.8px;
      text-transform: uppercase;
    }
    
    .endorsement-notice {
      font-size: 10.5pt;
      font-weight: 700;
      margin: 0.12in 0;
      text-transform: uppercase;
      color: #dc2626;
      letter-spacing: 0.5px;
    }
    
    .carrier-name-medium {
      font-size: 13pt;
      font-weight: 700;
      margin: 0.12in 0;
      color: #1f2937;
    }
    
    .policy-type {
      font-size: 10.5pt;
      margin: 0.08in 0;
      color: #6b7280;
      font-weight: 500;
    }
    
    .document-title {
      font-size: 12pt;
      font-weight: 700;
      margin: 0.2in 0;
      color: #1f2937;
    }
    
    .section-title-bold {
      font-size: var(--font-size-xl); /* 22-24px ≈ 16.5-18pt */
      font-weight: 600; /* Inter SemiBold */
      margin: var(--spacing-md) 0 var(--spacing-md) 0;
      text-transform: uppercase;
      color: #1f2937;
      letter-spacing: 0.5px;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: 3px solid #4A9EFF;
      background: #f9fafb;
      border-radius: 8px 8px 0 0;
    }
    
    .premium-disclosure-content,
    .certification-content,
    .warranty-content {
      font-size: 10pt;
      line-height: 1.8;
      margin: 0.2in 0;
      color: #374151;
    }
    
    .premium-disclosure-content p,
    .certification-content p,
    .warranty-content p {
      margin: 0.15in 0;
      text-align: justify;
    }
    
    .premium-disclosure-content strong,
    .certification-content strong,
    .warranty-content strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .rejection-statement-box {
      border: 3px solid var(--warning-color);
      padding: var(--spacing-md);
      margin: var(--spacing-md) 0;
      font-size: var(--font-size-sm);
      background: linear-gradient(135deg, #fef3c7 0%, #fef9e7 100%);
      border-radius: 8px;
      line-height: 1.8;
      color: #1f2937;
      box-shadow: var(--shadow-md);
    }
    
    .applicant-name-large {
      font-size: 13pt;
      font-weight: 700;
      margin-bottom: 0.08in;
      color: #1f2937;
    }
    
    .applicant-address,
    .applicant-city-state-zip,
    .applicant-phone,
    .applicant-email,
    .quote-id {
      font-size: 10pt;
      margin: 0.05in 0;
      line-height: 1.6;
      color: #374151;
    }
    
    .warranty-footer {
      font-size: 9pt;
      line-height: 1.7;
      margin-top: 0.35in;
      padding: 0.15in;
      background: #f9fafb;
      border-left: 3px solid #d1d5db;
      border-radius: 4px;
      color: #374151;
    }
    
    .warranty-footer strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .invoice-header {
      margin-bottom: 0.3in;
      padding-bottom: 0.2in;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .invoice-field {
      font-size: 10pt;
      margin: 0.08in 0;
      line-height: 1.6;
      color: #374151;
    }
    
    .invoice-field strong {
      color: #1f2937;
      font-weight: 600;
    }
    
    .invoice-section {
      margin: 0.3in 0;
    }
    
    .invoice-section-title {
      font-size: var(--font-size-base);
      font-weight: 700;
      margin-bottom: var(--spacing-sm);
      text-transform: uppercase;
      color: #1f2937;
      letter-spacing: 0.8px;
      padding: var(--spacing-sm) var(--spacing-md);
      border-bottom: 3px solid #4A9EFF;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 8px 8px 0 0;
      box-shadow: var(--shadow-sm);
      position: relative;
    }
    
    .invoice-section-title::before {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4A9EFF 0%, #6bb0ff 50%, #4A9EFF 100%);
    }
    
    .invoice-row {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-xs) var(--spacing-sm);
      border-bottom: 1px solid #e5e7eb;
      font-size: var(--font-size-sm);
      line-height: 1.7;
      color: #6b7280;
      transition: background-color 0.2s;
    }
    
    .invoice-row:nth-child(even) {
      background: #f9fafb;
    }
    
    .invoice-row:hover {
      background: #f3f4f6;
    }
    
    .invoice-row-total {
      display: flex;
      justify-content: space-between;
      padding: var(--spacing-sm) var(--spacing-md);
      border-top: 3px solid #4A9EFF;
      margin-top: var(--spacing-xs);
      font-size: var(--font-size-base);
      font-weight: 700;
      color: #1f2937;
      background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
      border-radius: 0 0 8px 8px;
      box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
    }
    
    .invoice-row-total::before {
      content: '';
      position: absolute;
      top: -3px;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #4A9EFF 0%, #6bb0ff 50%, #4A9EFF 100%);
    }
    
    .invoice-label {
      flex: 1;
      font-weight: 500;
    }
    
    .invoice-value {
      text-align: right;
      min-width: 1.3in;
      font-weight: 600;
      color: #1f2937;
    }
    
    .invoice-row-total .invoice-label {
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .invoice-row-total .invoice-value {
      font-weight: 700;
      font-size: var(--font-size-lg);
      color: #4A9EFF;
    }
    
    .payment-option {
      font-size: var(--font-size-sm);
      margin: var(--spacing-md) 0;
      padding: var(--spacing-sm) var(--spacing-md);
      background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      border-left: 4px solid var(--accent-color);
      border-radius: 8px;
      color: #1f2937;
      font-weight: 600;
      box-shadow: var(--shadow-sm);
      border-top: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .payment-option strong {
      color: var(--accent-color);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .binding-statement {
      font-size: 10pt;
      margin: 0.25in 0;
      line-height: 1.7;
      color: #374151;
    }
    
    .invoice-disclaimer {
      font-size: 9pt;
      font-style: italic;
      margin-top: 0.25in;
      line-height: 1.6;
      color: #6b7280;
      padding: 0.1in;
      background: #f9fafb;
      border-radius: 4px;
    }
    
    @media print {
      .page {
        page-break-after: always;
      }
      .page:last-child {
        page-break-after: auto;
      }
    }
  `;

  // Optimize CSS and minify HTML to reduce size for PDFShift 2MB limit
  const optimizedCSS = optimizeCSS(cssContent);
  const fullHTML = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>${optimizedCSS}</style></head><body>${pagesMinified}</body></html>`;

  return minifyHTML(fullHTML);
}

