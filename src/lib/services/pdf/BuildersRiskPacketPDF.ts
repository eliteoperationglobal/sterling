import { BuildersRiskPacketData, mapBuildersRiskDataToPacketData } from "./mappers/buildersRiskMapper";
import { blueAngelLogoSVG, sjjLogoSVG, patrickAriasLogoSVG, titanLogoSVG, texasLogoSVG } from "./ApartmentPacketPDF";

export type { BuildersRiskPacketData };
export { mapBuildersRiskDataToPacketData };

/**
 * Builders Risk Supplemental Application PDF Generator
 * Styled to exactly match ManufacturersPacketPDF & ApartmentPacketPDF professional format
 */
export function generateBuildersRiskPacketHTML(data: any): string {
  const packetData: BuildersRiskPacketData = (data && data.isMappedPacketData)
    ? data
    : mapBuildersRiskDataToPacketData(
      data?.payload || data,
      data?.submissionNumber || data?.applicationId || data?.submissionId || data?._id?.toString() || "Pending",
      data?.agency || {
        name: data?.agencyName,
        address: { street: data?.agencyAddress, city: data?.agencyCity, state: data?.agencyState, zip: data?.agencyZip },
        phone: data?.agencyPhone,
        email: data?.agencyEmail
      },
      data?.quote,
      data?.submission || data,
      data?.capitalCoLogoSVG
    );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Builders Risk Supplemental Application</title>
  <style>${cssContent}</style>
</head>
<body>
  ${generateApplicationPage1(packetData)}
  ${generateApplicationPage2(packetData)}
  ${generateApplicationPage3(packetData)}
  ${generateApplicationPage4(packetData)}
  ${generateApplicationPage5(packetData)}
  ${generateApplicationPage6(packetData)}
  ${generateApplicationPage7(packetData)}
  ${generateApplicationPage8(packetData)}
  ${generateAcord125Page1(packetData)}
  ${generateAcord125Page2(packetData)}
  ${generateAcord125Page3(packetData)}
  ${generateAcord125Page4(packetData)}
</body>
</html>`;
}

// ── Exact same renderYesNo as ManufacturersPacketPDF & ApartmentPacketPDF ────
function renderYesNo(label: string, value: boolean | null | undefined, explanation?: string): string {
  const isYes = value === true;
  const isNo = value === false;

  return `
    <div class="question-row">
      <div class="question-text">${label}</div>
      <div class="yes-no-options">
        <span class="option ${isYes ? 'selected' : ''}">Yes</span>
        <span class="option ${isNo ? 'selected' : ''}">No</span>
      </div>
    </div>
    ${explanation && explanation !== '-' && explanation.trim() !== '' ? `<div class="explanation-text"><strong>Details:</strong> ${explanation}</div>` : ''}
  `;
}

// ── Exact same renderField as ManufacturersPacketPDF & ApartmentPacketPDF ───
function renderField(label: string, value: string | number | undefined, width: string = '100%'): string {
  return `
    <div class="field-item" style="width: ${width};">
      <span class="field-label">${label}:</span>
      <span class="field-value">${value || '-'}</span>
    </div>
  `;
}

// ── Checkbox (solid square for checked) ──────────────────────────────────────
function renderCheck(checked: boolean): string {
  return `<span style="display:inline-block; width:10px; height:10px; border:1.5px solid #1f2937; background-color:${checked ? '#1f2937' : 'transparent'}; margin-right:4px; vertical-align:middle; position:relative; top:-1px;"></span>`;
}

// ── Logo Generator ────────────────────────────────────────────────────────────
function generateCapitalCoLogoHTML(svgContent?: string, size: string = '100%'): string {
  if (svgContent) {
    let optimizedSVG = svgContent
      .replace(/<\?xml[^>]*\?>/g, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/\s+/g, ' ')
      .replace(/>\s+</g, '><')
      .trim();

    const viewBoxMatch = optimizedSVG.match(/viewBox=["']([^"']+)["']/);
    const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 100 120';
    optimizedSVG = optimizedSVG.replace(/<svg([^>]*)>/, `<svg$1>`);

    return `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:${size};height:${size};" preserveAspectRatio="xMidYMid meet">${optimizedSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '')}</svg>`;
  }
  // Fallback hands logo
  return `<svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:${size};height:${size};"><defs><linearGradient id="handsGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.95"/><stop offset="50%" stop-color="#60a5fa" stop-opacity="0.9"/><stop offset="100%" stop-color="#3b82f6" stop-opacity="0.85"/></linearGradient></defs><path d="M30 15 Q35 10 45 12 Q55 14 60 20 Q65 28 62 38 Q60 45 55 50 Q50 52 45 50 Q40 48 38 45 Q35 40 35 35 Q33 28 35 22 Q32 18 30 15 Z" fill="url(#handsGradient)"/><path d="M70 15 Q65 10 55 12 Q45 14 40 20 Q35 28 38 38 Q40 45 45 50 Q50 52 55 50 Q60 48 62 45 Q65 40 65 35 Q67 28 65 22 Q68 18 70 15 Z" fill="url(#handsGradient)"/><ellipse cx="50" cy="45" rx="12" ry="8" fill="url(#handsGradient)" opacity="0.4"/></svg>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 1 — Header + General Information & Carrier Information & Addresses
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage1(data: BuildersRiskPacketData): string {
  const email = data.agencyEmail?.toLowerCase() || "";
  let selectedLogo = data.capitalCoLogoSVG;

  if (email === "max@blueangelins.com") selectedLogo = blueAngelLogoSVG;
  if (email === "office@sjinsuranceservices.com") selectedLogo = sjjLogoSVG;
  if (email === "patrick@patrickariasinsurance.com") selectedLogo = patrickAriasLogoSVG;
  if (email === "solutions@titaninssolutions.com") selectedLogo = titanLogoSVG;
  if (email === "texascomm@services.com" || (email === "cs@capcoinsurance.com" && (data.agencyName || "").toLowerCase().includes("texas"))) {
    selectedLogo = texasLogoSVG;
  }

  const logoSize = email === "patrick@patrickariasinsurance.com" ? "60%" : "100%";

  return `
    <div class="page page2-isc">
      <div class="main-content main-content-page2">
        <!-- Top Agency + Logo -->
        <div class="header-top-page2">
          <div class="agency-info-page2-left">
            <div class="agency-name-page2">${data.agencyName}</div>
            <div>${data.agentName}</div>
            <div>${data.agencyAddress}</div>
            <div>${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
            <div>${data.agencyPhone}</div>
            <div>Email: ${data.agencyEmail?.toLowerCase() || ""}</div>
          </div>
          <div class="logo-icon-page2-hands">
            ${generateCapitalCoLogoHTML(selectedLogo, logoSize)}
          </div>
        </div>

        <!-- Application ID -->
        <div class="application-id-large-page2">
          Builders Risk Application ID: ${data.submissionNumber || data.applicationId || "Pending"}
        </div>

        <!-- 3 Column Layout -->
        <div class="app-id-quote-parallel-page2">
          <div>
            <div class="section-title-page2">Date</div>
            <div class="date-section-page2">${data.formDate || new Date().toLocaleDateString('en-US')}</div>
          </div>
          <div>
            <div class="section-title-page2">Insured Information</div>
            <div class="insured-detail-page2"><strong>${data.namedInsured || ""}</strong></div>
            <div class="invoice-field-page12">${data.mailingAddress ? data.mailingAddress.split(',')[0].trim() : ''}</div>
            <div class="insured-detail-page2">${data.mailingCity || ""}, ${data.mailingState || ""} ${data.mailingZip || ""}</div>
            <div class="insured-detail-page2">${data.applicantPhone || data.phone || ""}</div>
            <div class="insured-detail-page2">Email: ${(data.applicantEmail || data.email || "")?.toLowerCase()}</div>
          </div>
          <div>
            <div class="section-title-page2">Quote Information</div>
            <div class="quote-detail-page2">Builders Risk</div>
            <div class="quote-detail-page2">${data.projectInterest || "Ground Up / Renovation"}</div>
            <div class="quote-detail-page2">Effective Date: ${data.requestedEffectiveDate || data.effectiveDate || "-"}</div>
          </div>
        </div>

        <!-- 1. GENERAL INFORMATION Section -->
        <div class="section-container" style="margin-top: 0.1in;">
          <div class="section-header">1. General Information</div>
          <hr class="section-divider" />

          ${renderField("Agency / Agent", data.agencyAgent || data.brokerage)}
          ${data.firstName || data.lastName ? `
            ${renderField("First Name", data.firstName)}
            ${renderField("Last Name", data.lastName)}
          ` : `
            ${renderField("Named Insured", data.namedInsured)}
          `}
          ${renderField("Applicant Phone", data.applicantPhone || data.phone)}
          ${renderField("Applicant Email", data.applicantEmail || data.email)}

          <div class="field-item">
            <span class="field-label">New Venture?</span>
            <span class="field-value yes-no-options" style="justify-content: flex-start; gap: 15px;">
              <span class="option ${data.isNewVenture === true ? 'selected' : ''}">Yes</span>
              <span class="option ${data.isNewVenture === false ? 'selected' : ''}">No</span>
            </span>
          </div>

          <div class="field-item">
            <span class="field-label">Renewal?</span>
            <span class="field-value yes-no-options" style="justify-content: flex-start; gap: 15px;">
              <span class="option ${data.isRenewal === true ? 'selected' : ''}">Yes</span>
              <span class="option ${data.isRenewal === false ? 'selected' : ''}">No</span>
            </span>
          </div>

          ${renderField("Policy Number", data.policyNumber)}
          ${renderField("Current Effective Date", data.currentEffectiveDate)}
          ${renderField("Current Expiry Date", data.currentExpiryDate)}
          ${renderField("Requested Effective Date", data.requestedEffectiveDate)}
          ${renderField("Requested Expiry Date", data.requestedExpiryDate)}
          ${renderField("Website", data.website)}
        </div>

        <!-- 2. CURRENT CARRIER INFORMATION -->
        <div class="section-container">
          <div class="section-header">2. Current Carrier Information</div>
          <hr class="section-divider" />

          ${renderField("Carrier", data.carrier)}
          ${renderField("Limit of Insurance", data.limitOfInsurance)}
          ${renderField("Deductible", data.deductible)}
          ${renderField("Premium", data.currentCarrierPremium)}
          ${renderField("Effective Date", data.effectiveDate)}
          ${renderField("Expiry Date", data.expiryDate)}

          <div class="field-item">
            <span class="field-label">Offering Renewal?</span>
            <span class="field-value yes-no-options" style="justify-content: flex-start; gap: 15px;">
              <span class="option ${data.offeringRenewal === true ? 'selected' : ''}">Yes</span>
              <span class="option ${data.offeringRenewal === false ? 'selected' : ''}">No</span>
            </span>
          </div>
        </div>

        <!-- 3 & 4. ADDRESSES -->
        <div class="section-container">
          <div class="section-header">3. Mailing Address</div>
          <hr class="section-divider" />
          ${renderField("Street Address", data.mailingAddress)}
          ${renderField("City", data.mailingCity)}
          ${renderField("State", data.mailingState)}
          ${renderField("Zip Code", data.mailingZip)}
        </div>

        <div class="section-container">
          <div class="section-header">4. Property Address ${data.sameAsMailing ? '(Same as Mailing)' : ''}</div>
          <hr class="section-divider" />
          ${renderField("Street Address", data.propertyAddress || (data.sameAsMailing ? data.mailingAddress : "-"))}
          ${renderField("City", data.propertyCity || (data.sameAsMailing ? data.mailingCity : "-"))}
          ${renderField("State", data.propertyState || (data.sameAsMailing ? data.mailingState : "-"))}
          ${renderField("Zip Code", data.propertyZip || (data.sameAsMailing ? data.mailingZip : "-"))}
        </div>

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — Operations, Project Interest, Prior Work, Coverages, Sales/Payroll, Contractor
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage2(data: BuildersRiskPacketData): string {
  const entityTypes = data.entityType || [];
  const entityChips = ["Corporation", "Individual", "Partnership", "Municipality", "For Profit", "Joint Venture"];
  const coverages = data.coverages || {};

  return `
    <div class="page page2-isc">
      <div class="main-content main-content-page2">

        <!-- 5. Entity Type & Operation History -->
        <div class="section-container" style="margin-top: 0.1in;">
          <div class="section-header">5. Entity Type & Operations</div>
          <hr class="section-divider" />

          <div class="field-item" style="margin-bottom: 6px;">
            <span class="field-label">Entity Type:</span>
            <span class="field-value" style="font-size: 9.5pt; font-weight: normal;">
              ${entityChips.map(et => `
                <span style="display:inline-block; margin-right: 12px; margin-bottom: 2px;">
                  ${renderCheck(entityTypes.includes(et))} ${et}
                </span>
              `).join('')}
              ${entityTypes.includes('Other') || data.entityTypeOther ? `
                <span style="display:inline-block; margin-right: 12px;">
                  ${renderCheck(true)} Other: <strong>${data.entityTypeOther || 'N/A'}</strong>
                </span>
              ` : ''}
            </span>
          </div>

          ${renderField("Operation History", data.operationHistory || "N/A")}
        </div>

        <!-- 6. Project Interest & Construction Dates -->
        <div class="section-container">
          <div class="section-header">6. Project Interest & Construction Schedule</div>
          <hr class="section-divider" />

          <div class="field-item" style="margin-bottom: 6px;">
            <span class="field-label">Project Interest:</span>
            <span class="field-value" style="font-size: 9.5pt; font-weight: normal;">
              ${["Owner", "Contractor", "Owner and Contractor"].map(pi => `
                <span style="display:inline-block; margin-right: 14px;">
                  ${renderCheck(data.projectInterest === pi)} ${pi}
                </span>
              `).join('')}
              ${data.projectInterest === 'Other' || data.projectInterestOther ? `
                <span style="display:inline-block; margin-right: 12px;">
                  ${renderCheck(true)} Other: <strong>${data.projectInterestOther || 'N/A'}</strong>
                </span>
              ` : ''}
            </span>
          </div>

          ${renderField("Construction Start Date", data.constructionStartDate)}
          ${renderField("Construction Projected End Date", data.constructionProjectedEndDate)}
        </div>

        <!-- 7. Prior Work Started -->
        <div class="section-container">
          <div class="section-header">7. Prior Work Started</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("Has any construction work already started?", data.workAlreadyStarted)}
          </div>

          <div class="sub-section">
            <div class="question-block">
              ${renderYesNo("a. If yes, has prior coverage been in place?", data.priorCoverageInPlace)}
            </div>
            ${data.workStartedExplanation ? `
              <div class="explanation-text" style="margin-top: 4px;">
                <strong>Explanation:</strong> ${data.workStartedExplanation}
              </div>
            ` : ''}
            ${renderField("b. Percentage of work completed", data.percentageWorkCompleted ? `${data.percentageWorkCompleted}%` : "-")}
          </div>
        </div>

        <!-- 8. Requested Coverages -->
        <div class="section-container">
          <div class="section-header">8. Coverages Requested</div>
          <hr class="section-divider" />

          <table class="table-custom">
            <thead>
              <tr>
                <th style="width: 50%; text-align: left; padding-left: 8px;">Coverage</th>
                <th style="width: 50%; text-align: left; padding-left: 8px;">Requested Limit</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.businessIncome)} Business Income w/ Extra Expense</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.businessIncomeLimit || 'Not Requested'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.mechanicalBreakdown)} Mechanical Breakdown & Testing</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.mechanicalBreakdownLimit || 'Not Requested'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.propertyInTransit)} Property in Transit</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.propertyInTransitLimit || 'Not Requested'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.propertyInStorage)} Property in Storage</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.propertyInStorageLimit || 'Not Requested'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.earthMovement)} Earth Movement</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.earthMovementLimit || 'Not Requested'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px;">${renderCheck(!!coverages.flood)} Flood</td>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.floodLimit || 'Not Requested'}</td>
              </tr>
              ${coverages.other || coverages.otherName ? `
                <tr>
                  <td style="text-align: left; padding-left: 8px;">${renderCheck(true)} Other: ${coverages.otherName || 'Specialty'}</td>
                  <td style="text-align: left; padding-left: 8px; font-weight: bold;">${coverages.otherLimit || 'Not Requested'}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <!-- 9. Receipts & Payroll -->
        <div class="section-container">
          <div class="section-header">9. Receipts and Payroll</div>
          <hr class="section-divider" />

          <table class="table-custom">
            <thead>
              <tr>
                <th style="width: 40%; text-align: left; padding-left: 8px;">Period</th>
                <th style="width: 30%;">Revenue</th>
                <th style="width: 30%;">Payroll</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">Projected Year</td>
                <td style="font-weight: bold;">${data.projectedRevenue || '-'}</td>
                <td style="font-weight: bold;">${data.projectedPayroll || '-'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">Last 12 Months</td>
                <td style="font-weight: bold;">${data.last12Revenue || '-'}</td>
                <td style="font-weight: bold;">${data.last12Payroll || '-'}</td>
              </tr>
              <tr>
                <td style="text-align: left; padding-left: 8px; font-weight: bold;">2nd Prior Year</td>
                <td style="font-weight: bold;">${data.prior2YearRevenue || '-'}</td>
                <td style="font-weight: bold;">${data.prior2YearPayroll || '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 10. Contractor -->
        <div class="section-container">
          <div class="section-header">10. Contractor Information</div>
          <hr class="section-divider" />

          ${renderField("General Contractor Name", data.contractorName || "N/A")}
          ${renderField("Years of Contractor Experience", data.contractorExperienceYears ? `${data.contractorExperienceYears} Years` : "N/A")}
        </div>

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — Section II: Property Details
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage3(data: BuildersRiskPacketData): string {
  const constructionMats = data.constructionMaterials || [];
  const materialChips = ["Frame", "Joisted Masonry", "Non-Combustible", "Masonry Non-Combustible", "Fire-Resistive"];

  return `
    <div class="page page2-isc">
      <div class="main-content main-content-page2">

        <div class="section-container" style="margin-top: 0.1in;">
          <div class="section-header">II. Property Details</div>
          <hr class="section-divider" />
        </div>

        <!-- 11. Renovation & Ground-up -->
        <div class="section-container">
          <div class="section-header">11. Renovation & Ground-Up Status</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("Is the property being renovated?", data.isRenovated)}
          </div>

          <div class="sub-section">
            <div class="question-block">
              ${renderYesNo("a. If no, is the building work being performed ground up?", data.isGroundUp)}
            </div>
            ${data.groundUpExplanation ? `
              <div class="explanation-text" style="margin-top: 4px;">
                <strong>Explanation:</strong> ${data.groundUpExplanation}
              </div>
            ` : ''}
            ${renderField("b. Total Insurable Value of Building Materials", data.totalInsurableValue || "-")}
          </div>
        </div>

        <!-- 12. Description of Work -->
        <div class="section-container">
          <div class="section-header">12. Description of Work</div>
          <hr class="section-divider" />
          <div style="font-size: 10pt; color: #111; line-height: 1.5; padding: 4px 0;">
            ${data.workDescription || "None provided"}
          </div>
        </div>

        <!-- 13. Intended Occupancy -->
        <div class="section-container">
          <div class="section-header">13. Intended Occupancy After Completion</div>
          <hr class="section-divider" />
          <div style="font-size: 10pt; color: #111; line-height: 1.5; padding: 4px 0;">
            ${data.intendedOccupancy || "None provided"}
          </div>
        </div>

        <!-- 14. Construction Materials -->
        <div class="section-container">
          <div class="section-header">14. Construction Materials</div>
          <hr class="section-divider" />
          <div style="font-size: 9.5pt; padding: 4px 0; line-height: 1.6;">
            ${materialChips.map(m => `
              <span style="display:inline-block; margin-right: 14px;">
                ${renderCheck(constructionMats.includes(m))} ${m}
              </span>
            `).join('')}
            ${constructionMats.includes('Other') || data.constructionMaterialOther ? `
              <span style="display:inline-block; margin-right: 12px;">
                ${renderCheck(true)} Other: <strong>${data.constructionMaterialOther || 'N/A'}</strong>
              </span>
            ` : ''}
          </div>
        </div>

        <!-- 15. Structure Characteristics -->
        <div class="section-container">
          <div class="section-header">15. Structure Characteristics</div>
          <hr class="section-divider" />

          ${renderField("Number of Stories", data.numberOfStories)}
          <div class="question-block">
            ${renderYesNo("Are tandem crane lifts or tower cranes involved in the project?", data.involvesCranes)}
          </div>
          ${renderField("Roofing Materials", data.roofingMaterials)}
          ${renderField("Protection Class", data.protectionClass)}
        </div>

        <!-- 16. Structure Occupied Prior to Completion -->
        <div class="section-container">
          <div class="section-header">16. Occupancy Prior to Completion</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("Will any portion of the structure be occupied prior to project completion?", data.occupiedPriorToCompletion)}
          </div>
          ${data.occupiedPriorToCompletion ? `
            <div class="sub-section">
              ${renderField("a. Occupied by whom", data.occupiedByWhom)}
              ${renderField("b. Occupancy & restricted access details", data.occupancyDetails)}
            </div>
          ` : ''}
        </div>

        <!-- 17. Site Security -->
        <div class="section-container">
          <div class="section-header">17. Site Security</div>
          <hr class="section-divider" />

          <div class="question-block">${renderYesNo("a. Is the project site fenced?", data.siteFenced)}</div>
          <div class="question-block">${renderYesNo("b. Is the project site lighted?", data.siteLighted)}</div>
          <div class="question-block">${renderYesNo("c. Is the project site locked when unattended?", data.siteLocked)}</div>
          <div class="question-block">${renderYesNo("d. Are security guards or night watchmen present?", data.siteGuards)}</div>
          <div class="question-block">${renderYesNo(`e. Other security measures in place (${data.siteOtherSecurity || 'None specified'})`, data.siteOtherSecurityActive)}</div>
        </div>

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 4 — Section III: Renovation
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage4(data: BuildersRiskPacketData): string {
  const fireSystems = data.fireSafetySystems || [];
  const fireChips = ["Central Alarms", "Local Alarms", "Automatic Sprinklers", "Automatic Suppressants", "Manual Extinguishers"];

  return `
    <div class="page page2-isc">
      <div class="main-content main-content-page2">

        <div class="section-container" style="margin-top: 0.1in;">
          <div class="section-header">III. Renovation Information (Complete only if property is being renovated)</div>
          <hr class="section-divider" />
        </div>

        <!-- 18 - 21. Renovation Questions -->
        <div class="section-container">
          <div class="section-header">18. Scope of Structural Work & Damage</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("23) Does the project include any demolition of existing structure(s)?", data.demoExistingStructure)}
          </div>
          <div class="question-block">
            ${renderYesNo("24) Does the project include any structural, frame, or foundation alterations?", data.structuralAlterations)}
          </div>
          <div class="question-block">
            ${renderYesNo("25) Does the building have any existing damage?", data.existingDamage, data.existingDamageClarification)}
          </div>
        </div>

        <!-- 22. Existing Structure Coverage & Values -->
        <div class="section-container">
          <div class="section-header">19. Coverage for Existing Structure & Insurable Values</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("26) Are you seeking coverage for the existing structure?", data.coverageExistingStructure)}
          </div>

          <div class="sub-section">
            <div class="question-block">
              ${renderYesNo("a. If no, is the structure covered under another property insurance policy?", data.structureCoveredOtherPolicy)}
            </div>
            ${renderField("b. Existing Structure Value", data.existingStructureValue)}
            ${renderField("c. Building Materials Value", data.buildingMaterialsValue)}
            ${renderField("d. Total Insurable Value (Completed Value)", data.insurableValueTotal)}
          </div>
        </div>

        <!-- 23. Building Specifications -->
        <div class="section-container">
          <div class="section-header">20. Building Specifications</div>
          <hr class="section-divider" />

          ${renderField("27) Year Built", data.yearBuilt)}
          ${renderField("28) Square Footage of Original Building", data.originalSquareFootage)}
          ${renderField("29) If Addition, New Square Footage", data.additionSquareFootage)}
          ${renderField("30) Previous Occupancy of Structure(s)", data.previousOccupancy)}
        </div>

        <!-- 24. Fire Safety Systems -->
        <div class="section-container">
          <div class="section-header">21. Fire Safety Systems</div>
          <hr class="section-divider" />

          <div style="font-size: 10pt; color: #444; margin-bottom: 4px;">31) Current fire safety systems installed in structure:</div>
          <div style="font-size: 9.5pt; padding: 2px 0 6px 0; line-height: 1.6;">
            ${fireChips.map(fs => `
              <span style="display:inline-block; margin-right: 14px;">
                ${renderCheck(fireSystems.includes(fs))} ${fs}
              </span>
            `).join('')}
            ${fireSystems.includes('Other') || data.fireSafetyOther ? `
              <span style="display:inline-block; margin-right: 12px;">
                ${renderCheck(true)} Other: <strong>${data.fireSafetyOther || 'N/A'}</strong>
              </span>
            ` : ''}
          </div>

          <div class="sub-section">
            <div class="question-block">
              ${renderYesNo("a. Are all of the above systems in working order?", data.fireSystemsWorkingOrder)}
            </div>
            <div class="question-block">
              ${renderYesNo("b. Will they be maintained and operable for duration of construction?", data.fireSystemsMaintained, data.fireSystemsExplanation)}
            </div>
          </div>
        </div>

        <!-- 25. Utilities & Security Alarms -->
        <div class="section-container">
          <div class="section-header">22. Building Utilities & Intrusion Alarm</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("32) Will electrical service be maintained?", data.electricalServiceMaintained, data.electricalLastUpdated ? `Last updated: ${data.electricalLastUpdated}` : undefined)}
          </div>
          <div class="question-block">
            ${renderYesNo("33) Will heating service (gas, oil, etc.) be maintained?", data.heatingServiceMaintained, data.heatingLastUpdated ? `Last updated: ${data.heatingLastUpdated}` : undefined)}
          </div>
          <div class="question-block">
            ${renderYesNo("34) Will water service be shut off & pipes drained/winterized?", data.waterServiceShutOff, data.plumbingLastUpdated ? `Plumbing last updated: ${data.plumbingLastUpdated}` : undefined)}
          </div>
          <div class="question-block">
            ${renderYesNo("35) Is a burglar or intrusion alarm in place?", data.burglarAlarmInPlace)}
          </div>
          <div class="sub-section">
            <div class="question-block">
              ${renderYesNo("a. Will burglar alarm be maintained during construction?", data.burglarAlarmMaintained)}
            </div>
          </div>
        </div>

      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 5 — Section IV: Claims History & Declaration / Signatures
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage5(data: BuildersRiskPacketData): string {
  const claims = data.claimsList || [];

  return `
    <div class="page page2-isc">
      <div class="main-content main-content-page2">

        <div class="section-container" style="margin-top: 0.1in;">
          <div class="section-header">IV. Claims History</div>
          <hr class="section-divider" />
        </div>

        <!-- 26 & 27. Claims Underwriting Questions -->
        <div class="section-container">
          <div class="section-header">23. Underwriting Incidents & Non-Renewals</div>
          <hr class="section-divider" />

          <div class="question-block">
            ${renderYesNo("36) Do you know of any incidents not currently reported that may result in a claim against you?", data.unreportedIncidents, data.unreportedIncidentsExplanation)}
          </div>

          <div class="question-block">
            ${renderYesNo("37) During the past 5 years, has any insurer ever canceled or non-renewed similar insurance to any applicant, or has your insurance been canceled for nonpayment of premium?", data.canceledNonRenewed, data.canceledExplanation)}
          </div>
        </div>

        <!-- 28. Prior Claims Details -->
        <div class="section-container">
          <div class="section-header">24. Claim Details (Past 5 Years)</div>
          <hr class="section-divider" />

          ${claims.length === 0 ? `
            <div style="font-size: 10pt; color: #555; font-style: italic; margin-top: 6px; margin-bottom: 12px;">
              No prior claims reported.
            </div>
          ` : `
            ${claims.map((c, idx) => `
              <div style="border: 1px solid #d1d5db; border-radius: 4px; padding: 8px 10px; margin-top: 8px; margin-bottom: 10px; background-color: #f9fafb;">
                <div style="font-weight: bold; font-size: 10pt; color: #111; margin-bottom: 4px;">Claim Record #${idx + 1}</div>
                ${renderField("Date of Incident", c.incidentDate)}
                ${renderField("Line(s) of Coverage", Array.isArray(c.linesCovered) ? c.linesCovered.join(', ') : (c.linesCovered || "-"))}
                ${renderField("Total Claimed", c.totalClaimed)}
                <div style="font-size: 9.5pt; margin-top: 4px; color: #374151;"><strong>Circumstances:</strong> ${c.circumstances || "N/A"}</div>
                <div class="sub-section" style="margin-top: 6px; margin-bottom: 4px;">
                  <div class="question-block">${renderYesNo("Closed with trial/arbitration?", c.closedWithTrial)}</div>
                  <div class="question-block">${renderYesNo("Open & anticipate trial/arbitration?", c.openAnticipateTrial, c.trialDate ? `Anticipated date: ${c.trialDate}` : undefined)}</div>
                  <div class="question-block">${renderYesNo("Procedures or rules changed following incident?", c.proceduresChanged)}</div>
                  <div class="question-block">${renderYesNo("Total loss or full insured value claimed?", c.totalLoss, c.percentLost ? `${c.percentLost}% loss` : undefined)}</div>
                </div>
              </div>
            `).join('')}
          `}
        </div>

        <!-- Declaration and Signature: exact copy from ManufacturersPacketPDF -->
        <div class="section-container" style="margin-top: 0.2in;">
          <div class="section-header">Declaration and Signature</div>
          <hr class="section-divider" />
          <p style="font-size: 9.5pt; text-align: justify; margin-bottom: 0.20in; color: #333; line-height: 1.45;">
            The undersigned authorized officer of the applicant declares that the statements set forth herein are true.
            The undersigned authorized officer agrees that if the information supplied on this application changes between the date of this application and the effective date of the insurance, he/she (undersigned) will, in order for the information to be accurate on the effective date of the insurance, immediately notify the insurer of such changes, and the insurer may withdraw or modify any outstanding quotations and/or authorizations or agreements to bind the insurance.
          </p>

          <div class="signature-grid-row signature-grid-row-large">
            <div style="flex: 2;">
              <div class="signature-row">
                <span class="signature-label">Applicant's Signature:</span>
                <span class="signature-underline">&nbsp;</span>
              </div>
            </div>
            <div style="flex: 1;">
              <div class="signature-row">
                <span class="signature-label">Date:</span>
                <span class="signature-underline">&nbsp;</span>
              </div>
            </div>
          </div>

          <div class="signature-grid-row">
            <div style="flex: 2;">
              <div class="signature-row">
                <span class="signature-label">Title:</span>
                <span class="signature-underline">&nbsp;</span>
              </div>
            </div>
            <div style="flex: 1;"></div>
          </div>
        </div>

      </div>
    </div>`;
}

//Page 6 Acord 144 page 1//
function generateApplicationPage6(data: BuildersRiskPacketData): string {
  const isInstallation = (data.projectInterest || '').toLowerCase().includes('installation');
  const isBuildersRisk = !isInstallation;

  // Security description
  const securityItems: string[] = [];
  if (data.siteFenced) securityItems.push('Fenced');
  if (data.siteLighted) securityItems.push('Lighted');
  if (data.siteLocked) securityItems.push('Locked');
  if (data.siteGuards) securityItems.push('Guards');
  if (data.siteOtherSecurity) securityItems.push(data.siteOtherSecurity);
  const securitySummary = securityItems.length > 0 ? securityItems.join(', ') : (data.siteFenced !== null && data.siteFenced !== undefined ? 'Standard Job Site Security' : '');

  // Territory
  const territory = data.propertyState ? `${data.propertyCity ? `${data.propertyCity}, ` : ''}${data.propertyState}` : (data.operationHistory || data.mailingState || '');

  // Causes of loss flags
  const hasEarthquake = !!data.coverages?.earthMovement;
  const hasFlood = !!data.coverages?.flood;
  const hasOtherCov = !!data.coverages?.other;


  return `
    <div class="page page2-isc">
         <style>
          #p0 { width: 816px; height: 1056px; }
        </style>
        <div class="page" id="p0">

          <!-- ========================================================================= -->
          <!-- BACKGROUND GRAPHICS, BORDERS & SEPARATORS (SVG)                           -->
          <!-- ========================================================================= -->
          <svg class="vec" style="z-index:93;left:22.68px;top:974.68px;overflow:hidden" width="770.64" height="2.64" viewBox="22.68 974.68 770.64 2.64"><path d="M24 976H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:199;left:329.88px;top:118.68px;overflow:hidden" width="2.64" height="34.64" viewBox="329.88 118.68 2.64 34.64"><path d="M331.2 152V120" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:214;left:22.68px;top:86.68px;overflow:hidden" width="770.64" height="66.64" viewBox="22.68 86.68 770.64 66.64"><path d="M24 152H792" fill="none" stroke="#000000" stroke-width="0.64"/><path d="M720 120V88" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:232;left:22.68px;top:86.68px;overflow:hidden" width="770.64" height="66.64" viewBox="22.68 86.68 770.64 66.64"><path d="M24 120H792" fill="none" stroke="#000000" stroke-width="0.64"/><path d="M408 88V152" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:284;left:550.68px;top:46.68px;overflow:hidden" width="242.64" height="2.64" viewBox="550.68 46.68 242.64 2.64"><path d="M552 48H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:329;left:41.88px;top:150.68px;overflow:hidden" width="127.44" height="18.64" viewBox="41.88 150.68 127.44 18.64"><path d="M148.8 152H168V168H148.8Z" fill="none" stroke="#000000" stroke-width="0.64"/><path d="M43.2 152H62.4V168H43.2Z" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:375;left:185.88px;top:470.68px;overflow:hidden" width="21.84" height="18.64" viewBox="185.88 470.68 21.84 18.64"><path d="M187.2 472H206.4V488H187.2Z" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
          <svg class="vec" style="z-index:395;left:22.84px;top:758.84px;overflow:hidden" width="21.52" height="2.32" viewBox="22.84 758.84 21.52 2.32"><path d="M24 760H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:562;left:22.52px;top:662.52px;overflow:hidden" width="770.96" height="114.96" viewBox="22.52 662.52 770.96 114.96"><path d="M24 776H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 712H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 696H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 696H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 728H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 744H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 712H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 728H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 680V696" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 680V776" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 680V696" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 680V696" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 680V696" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 680V760" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 696V760" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 696V712" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 760H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 664H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:746;left:22.52px;top:566.52px;overflow:hidden" width="770.96" height="114.96" viewBox="22.52 566.52 770.96 114.96"><path d="M24 680H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 616H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 600H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 600H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 632H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 648H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 616H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 632H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 584V600" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 584V680" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 584V600" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 584V600" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 584V600" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 584V664" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 600V664" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 600V616" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 664H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 568H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:930;left:22.52px;top:486.52px;overflow:hidden" width="770.96" height="98.96" viewBox="22.52 486.52 770.96 98.96"><path d="M24 584H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 504H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 504H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 504H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 536H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 552H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 520H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 536H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 488V504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 488V584" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 488V504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 488V504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 488V504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 488V568" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 504V568" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 504V520" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 568H792" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:988;left:176.44px;top:442.84px;overflow:hidden" width="338.32" height="30.32" viewBox="176.44 442.84 338.32 30.32"><path d="M513.6 448V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 444V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M177.6 444V472" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1005;left:22.84px;top:422.84px;overflow:hidden" width="587.92" height="50.32" viewBox="22.84 422.84 587.92 50.32"><path d="M24 424V456" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 424V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 424V456" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M417.6 424V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M321.6 424V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M273.6 424V472" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 424V456" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M177.6 424V456" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M129.6 424V472" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1029;left:22.84px;top:390.84px;overflow:hidden" width="770.32" height="58.32" viewBox="22.84 390.84 770.32 58.32"><path d="M24 448H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 392V424" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1142;left:22.84px;top:390.84px;overflow:hidden" width="770.32" height="34.32" viewBox="22.84 390.84 770.32 34.32"><path d="M225.6 408H609.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 424H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M129.6 392V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M177.6 392V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 392V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M273.6 408V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M321.6 392V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M417.6 408V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 408V424" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 392V424" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1165;left:22.36px;top:390.36px;overflow:hidden" width="771.28" height="83.28" viewBox="22.36 390.36 771.28 83.28"><path d="M24 392H792V472H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1193;left:416.44px;top:230.84px;overflow:hidden" width="88.72" height="66.32" viewBox="416.44 230.84 88.72 66.32"><path d="M417.6 296H504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M417.6 232H504" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1208;left:272.44px;top:198.84px;overflow:hidden" width="146.32" height="98.32" viewBox="272.44 198.84 146.32 98.32"><path d="M417.6 200V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M273.6 296H417.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M273.6 232H417.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1240;left:176.44px;top:198.84px;overflow:hidden" width="98.32" height="98.32" viewBox="176.44 198.84 98.32 98.32"><path d="M273.6 200V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M177.6 296H273.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M177.6 232H273.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1261;left:22.84px;top:198.84px;overflow:hidden" width="155.92" height="98.32" viewBox="22.84 198.84 155.92 98.32"><path d="M177.6 200V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 200V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 296H177.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1292;left:22.36px;top:198.36px;overflow:hidden" width="483.28" height="99.28" viewBox="22.36 198.36 483.28 99.28"><path d="M24 232H177.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 200H504V296H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1321;left:512.44px;top:198.84px;overflow:hidden" width="2.32" height="18.32" viewBox="512.44 198.84 2.32 18.32"><path d="M513.6 200V216" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1355;left:512.44px;top:198.84px;overflow:hidden" width="280.72" height="34.32" viewBox="512.44 198.84 280.72 34.32"><path d="M513.6 216H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 200V216" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 200V216" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 216V232" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 216V232" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 216V232" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1372;left:512.44px;top:214.84px;overflow:hidden" width="280.72" height="82.32" viewBox="512.44 214.84 280.72 82.32"><path d="M513.6 232H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M532.8 216V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 232V248" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 232V248" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 232V248" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1383;left:512.44px;top:246.84px;overflow:hidden" width="280.72" height="18.32" viewBox="512.44 246.84 280.72 18.32"><path d="M513.6 248H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 248V264" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 248V264" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 248V264" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1388;left:512.44px;top:262.84px;overflow:hidden" width="280.72" height="34.32" viewBox="512.44 262.84 280.72 34.32"><path d="M513.6 264H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 296H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 264V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 264V296" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1409;left:511.96px;top:198.36px;overflow:hidden" width="281.68" height="99.28" viewBox="511.96 198.36 281.68 99.28"><path d="M513.6 280H532.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 280H628.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 280V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M628.8 280V296" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M619.2 280H628.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 200H792V296H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1467;left:22.36px;top:310.36px;overflow:hidden" width="483.28" height="67.28" viewBox="22.36 310.36 483.28 67.28"><path d="M24 312H504V376H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1514;left:512.44px;top:326.84px;overflow:hidden" width="280.72" height="50.32" viewBox="512.44 326.84 280.72 50.32"><path d="M513.6 328H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M657.6 376H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M657.6 344H792" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1544;left:512.44px;top:326.84px;overflow:hidden" width="146.32" height="50.32" viewBox="512.44 326.84 146.32 50.32"><path d="M657.6 328V376" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 376H657.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 328V376" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1562;left:22.36px;top:310.36px;overflow:hidden" width="771.28" height="683.28" viewBox="22.36 310.36 771.28 683.28"><path d="M513.6 344H657.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 312H792V376H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 928H792V992H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1590;left:512.44px;top:790.84px;overflow:hidden" width="2.32" height="50.32" viewBox="512.44 790.84 2.32 50.32"><path d="M513.6 792V840" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1663;left:512.44px;top:838.84px;overflow:hidden" width="280.72" height="2.32" viewBox="512.44 838.84 280.72 2.32"><path d="M513.6 840H792" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
          <svg class="vec" style="z-index:1690;left:511.96px;top:790.36px;overflow:hidden" width="281.68" height="123.28" viewBox="511.96 790.36 281.68 123.28"><path d="M513.6 792H792V912H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1758;left:22.36px;top:790.36px;overflow:hidden" width="483.28" height="123.28" viewBox="22.36 790.36 483.28 123.28"><path d="M24 792H504V912H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1776;left:651.16px;top:54.36px;overflow:hidden" width="142.48" height="35.28" viewBox="651.16 54.36 142.48 35.28"><path d="M652.8 56H792V88H652.8Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
          <svg class="vec" style="z-index:1813;left:22.36px;top:86.36px;overflow:hidden" width="771.28" height="691.28" viewBox="22.36 86.36 771.28 691.28"><path d="M24 88H792V168H24Z" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 520H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 488H792V776H24Z" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 600H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 696H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>

          <!-- ========================================================================= -->
          <!-- LOGO (IMG)                                                                -->
          <!-- ========================================================================= -->
          <img class="im" src="data:image/png;base64,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" style="z-index:357;width:91.2px;height:39.04px;transform:matrix(1,0,0,1,28.8,48)" alt="">

          <!-- ========================================================================= -->
          <!-- SECTION 1: HEADER & IDENTIFICATION (CUSTOMER ID, FORM TITLE, DATE) -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c0" style="z-index:285;transform:matrix(1,0,0,1,420.32,35.46)">AGENCY CUSTOMER ID:</div>
          <div class="t c6" style="z-index:1777;transform:matrix(1,0,0,1,193.76,61.1)">INSTALLATION / BUILDERS RISK SECTION</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:552px;top:32px;width:240px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.submissionNumber || data.applicationId || ''}</div>
          <div class="fld" style="left:657.33px;top:72px;width:129.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;">${data.formDate || ''}</div>
          <div class="fld" style="left:0px;top:1054.67px;width:0px;height:0px;font-family:sans-serif;color:#000000; overflow:hidden;"></div>

          <!-- ========================================================================= -->
          <!-- SECTION 2: AGENCY, CARRIER & POLICY INFORMATION -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c0" style="z-index:225;transform:matrix(1,0,0,1,412.8,89.86)">CARRIER</div>
          <div class="t c2" style="z-index:278;transform:matrix(1,0,0,1,28.8,91.44)">AGENCY</div>
          <div class="t c2" style="z-index:216;transform:matrix(1,0,0,1,724.8,91.44)">NAIC CODE</div>
          <div class="t c2" style="z-index:234;transform:matrix(1,0,0,1,28.8,123.44)">POLICY NUMBER</div>
          <div class="t c2" style="z-index:200;transform:matrix(1,0,0,1,336.24,123.44)">EFFECTIVE DATE</div>
          <div class="t c2" style="z-index:247;transform:matrix(1,0,0,1,412.8,123.92)">APPLICANT / FIRST NAMED INSURED</div>
          <div class="t c3" style="z-index:304;transform:matrix(1,0,0,1,67.2,155.4)">INSTALLATION</div>
          <div class="t c3" style="z-index:316;transform:matrix(1,0,0,1,182.88,155.4)">BUILDERS RISK</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:29.33px;top:104px;width:373.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.agencyName || ''}</div>
          <div class="fld" style="left:413.33px;top:104px;width:301.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.carrier || ''}</div>
          <div class="fld" style="left:725.33px;top:104px;width:61.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:29.33px;top:136px;width:297.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.policyNumber || ''}</div>
          <div class="fld" style="left:336px;top:136px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;">${data.requestedEffectiveDate || data.effectiveDate || ''}</div>
          <div class="fld" style="left:413.33px;top:136px;width:373.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.namedInsured || ''}</div>
          <div class="fld" style="left:42.67px;top:152px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${isInstallation ? 'X' : ''}</div>
          <div class="fld" style="left:149.33px;top:152px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${isBuildersRisk ? 'X' : ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 3: OPEN REPORTING FORM - COVERAGE LIMITS -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c4" style="z-index:1166;transform:matrix(1,0,0,1,323.68,176.21)">OPEN REPORTING FORM</div>
          <div class="t c1" style="z-index:1185;transform:matrix(1,0,0,1,28.8,187.14)">COVERAGE</div>
          <div class="t c2" style="z-index:1273;transform:matrix(1,0,0,1,59.28,209.52)">LIMIT AT ANY SINGLE</div>
          <div class="t c2" style="z-index:1252;transform:matrix(1,0,0,1,206.24,209.52)">LIMIT PER</div>
          <div class="t c2" style="z-index:1220;transform:matrix(1,0,0,1,299.04,209.52)">LIMIT AT A TEMPORARY</div>
          <div class="t c2" style="z-index:1201;transform:matrix(1,0,0,1,443.76,209.52)">TRANSIT</div>
          <div class="t c2" style="z-index:1265;transform:matrix(1,0,0,1,80.27,217.52)">LOCATION</div>
          <div class="t c2" style="z-index:1244;transform:matrix(1,0,0,1,205.71,217.52)">DISASTER</div>
          <div class="t c2" style="z-index:1212;transform:matrix(1,0,0,1,325.07,217.52)">LOCATION</div>
          <div class="t c2" style="z-index:1196;transform:matrix(1,0,0,1,450.55,217.52)">LIMIT</div>
          <div class="t c2" style="z-index:1264;transform:matrix(1,0,0,1,28.8,261.52)">$</div>
          <div class="t c2" style="z-index:1243;transform:matrix(1,0,0,1,182.4,261.52)">$</div>
          <div class="t c2" style="z-index:1211;transform:matrix(1,0,0,1,278.4,261.52)">$</div>
          <div class="t c2" style="z-index:1195;transform:matrix(1,0,0,1,422.4,261.52)">$</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:38.67px;top:256px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.totalInsurableValue || data.limitOfInsurance || ''}</div>
          <div class="fld" style="left:192px;top:256px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.limitOfInsurance || ''}</div>
          <div class="fld" style="left:288px;top:256px;width:125.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.coverages?.propertyInStorageLimit || ''}</div>
          <div class="fld" style="left:432px;top:256px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.coverages?.propertyInTransitLimit || ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 4: OPEN REPORTING FORM - CAUSES OF LOSS & DEDUCTIBLES -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:1294;transform:matrix(1,0,0,1,518.4,187.14)">CAUSES OF LOSS &amp; DEDUCTIBLE</div>
          <div class="t c2" style="z-index:1341;transform:matrix(1,0,0,1,526.88,205.52)">CAUSES OF LOSS</div>
          <div class="t c2" style="z-index:1332;transform:matrix(1,0,0,1,638.08,205.52)">SUB LIMIT</div>
          <div class="t c2" style="z-index:1322;transform:matrix(1,0,0,1,723.45,205.52)">DEDUCTIBLE</div>
          <div class="t c2" style="z-index:1371;transform:matrix(1,0,0,1,614.4,221.52)">$</div>
          <div class="t c5" style="z-index:1361;transform:matrix(1,0,0,1,537.6,221.88)">EARTHQUAKE</div>
          <div class="t c2" style="z-index:1382;transform:matrix(1,0,0,1,614.4,237.52)">$</div>
          <div class="t c5" style="z-index:1377;transform:matrix(1,0,0,1,537.6,237.88)">FLOOD</div>
          <div class="t c2" style="z-index:1387;transform:matrix(1,0,0,1,614.4,253.52)">$</div>
          <div class="t c5" style="z-index:1402;transform:matrix(1,0,0,1,537.6,269.88)">SPECIAL</div>
          <div class="t c5" style="z-index:1397;transform:matrix(1,0,0,1,537.6,285.88)">BROAD</div>
          <div class="t c5" style="z-index:1392;transform:matrix(1,0,0,1,633.6,285.88)">BASIC</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:513.33px;top:216px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasEarthquake ? 'X' : ''}</div>
          <div class="fld" style="left:624px;top:216px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasEarthquake ? (data.coverages?.earthMovementLimit || '') : ''}</div>
          <div class="fld" style="left:710.67px;top:216px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasEarthquake ? (data.deductible || '') : ''}</div>
          <div class="fld" style="left:513.33px;top:232px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasFlood ? 'X' : ''}</div>
          <div class="fld" style="left:624px;top:232px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasFlood ? (data.coverages?.floodLimit || '') : ''}</div>
          <div class="fld" style="left:710.67px;top:232px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasFlood ? (data.deductible || '') : ''}</div>
          <div class="fld" style="left:513.33px;top:248px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasOtherCov ? 'X' : ''}</div>
          <div class="fld" style="left:537.33px;top:248px;width:68px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.coverages?.otherName || '') : ''}</div>
          <div class="fld" style="left:624px;top:248px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.coverages?.otherLimit || '') : ''}</div>
          <div class="fld" style="left:710.67px;top:248px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.deductible || '') : ''}</div>
          <div class="fld" style="left:513.33px;top:264px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">X</div>
          <div class="fld" style="left:710.67px;top:272px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.deductible || ''}</div>
          <div class="fld" style="left:513.33px;top:280px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
          <div class="fld" style="left:609.33px;top:280px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>

          <!-- ========================================================================= -->
          <!-- SECTION 5: OPERATING TERRITORY -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:1415;transform:matrix(1,0,0,1,28.8,299.14)">TERRITORY</div>
          <div class="t c2" style="z-index:1424;transform:matrix(1,0,0,1,28.8,314.16)">SPECIFY THE APPLICANTS OPERATING TERRITORY:</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:29.33px;top:328px;width:469.33px;height:40px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${territory}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 6: GROSS INSTALLATION RECEIPTS -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:1468;transform:matrix(1,0,0,1,518.4,299.14)">RECEIPTS</div>
          <div class="t c2" style="z-index:1476;transform:matrix(1,0,0,1,518.4,317.52)">ENTER THE GROSS INSTALLATION RECEIPTS.</div>
          <div class="t c2" style="z-index:1548;transform:matrix(1,0,0,1,551.6,332.08)">PAST 12 MONTHS</div>
          <div class="t c2" style="z-index:1518;transform:matrix(1,0,0,1,666.16,332.08)">NEXT 12 MONTHS  (ESTIMATE)</div>
          <div class="t c2" style="z-index:1547;transform:matrix(1,0,0,1,518.4,357.52)">$</div>
          <div class="t c2" style="z-index:1517;transform:matrix(1,0,0,1,662.4,357.52)">$</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:528px;top:352px;width:125.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.last12Revenue || data.last12Payroll || ''}</div>
          <div class="fld" style="left:672px;top:352px;width:114.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.projectedRevenue || data.projectedPayroll || ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 7: JOBS / VALUES SCHEDULE (RESIDENTIAL & COMMERCIAL) -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:1152;transform:matrix(1,0,0,1,28.8,379.14)">JOBS / VALUES</div>
          <div class="t c2" style="z-index:1100;transform:matrix(1,0,0,1,231.36,397.52)"># JOBS IN PROGRESS</div>
          <div class="t c2" style="z-index:1052;transform:matrix(1,0,0,1,384.96,397.52)">COST OR VALUE OF EACH INSTALLATION</div>
          <div class="t c2" style="z-index:1132;transform:matrix(1,0,0,1,137,401.52)">ANNUAL</div>
          <div class="t c3" style="z-index:331;transform:matrix(1,0,0,1,644.96,404.28)">MATERIAL COST (% of Total)</div>
          <div class="t c2" style="z-index:1138;transform:matrix(1,0,0,1,66.52,405.52)">TYPE</div>
          <div class="t c2" style="z-index:1118;transform:matrix(1,0,0,1,180.85,405.52)">DURATION</div>
          <div class="t c2" style="z-index:1126;transform:matrix(1,0,0,1,136.35,409.52)">NUMBER</div>
          <div class="t c2" style="z-index:1093;transform:matrix(1,0,0,1,230.39,413.52)">MAXIMUM</div>
          <div class="t c2" style="z-index:1086;transform:matrix(1,0,0,1,278.15,413.52)">AVERAGE</div>
          <div class="t c2" style="z-index:1045;transform:matrix(1,0,0,1,350.39,413.52)">MAXIMUM</div>
          <div class="t c2" style="z-index:1038;transform:matrix(1,0,0,1,447.92,413.52)">MINIMUM</div>
          <div class="t c2" style="z-index:1031;transform:matrix(1,0,0,1,542.15,413.52)">AVERAGE</div>
          <div class="t c2" style="z-index:1018;transform:matrix(1,0,0,1,28.8,431.44)">RESIDENTIAL</div>
          <div class="t c2" style="z-index:1017;transform:matrix(1,0,0,1,326.4,432.08)">$</div>
          <div class="t c2" style="z-index:1016;transform:matrix(1,0,0,1,422.4,432.08)">$</div>
          <div class="t c2" style="z-index:1015;transform:matrix(1,0,0,1,518.4,432.08)">$</div>
          <div class="t c3" style="z-index:1014;transform:matrix(1,0,0,1,734.4,432.28)">%</div>
          <div class="t c2" style="z-index:995;transform:matrix(1,0,0,1,28.8,457.52)">COMMERCIAL</div>
          <div class="t c2" style="z-index:994;transform:matrix(1,0,0,1,326.4,457.52)">$</div>
          <div class="t c2" style="z-index:993;transform:matrix(1,0,0,1,422.4,457.52)">$</div>
          <div class="t c2" style="z-index:992;transform:matrix(1,0,0,1,518.4,457.52)">$</div>
          <div class="t c3" style="z-index:991;transform:matrix(1,0,0,1,734.4,458.04)">%</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:134.67px;top:428px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:182.67px;top:428px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:230.67px;top:428px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:278.67px;top:428px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:336px;top:428px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data.intendedOccupancy || '').toLowerCase().includes('residential') ? (data.totalInsurableValue || data.limitOfInsurance || '') : ''}</div>
          <div class="fld" style="left:432px;top:428px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:528px;top:428px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:653.33px;top:428px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:right; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:134.67px;top:452px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:182.67px;top:452px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:230.67px;top:452px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:278.67px;top:452px;width:38.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:336px;top:452px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${!(data.intendedOccupancy || '').toLowerCase().includes('residential') ? (data.totalInsurableValue || data.limitOfInsurance || '') : ''}</div>
          <div class="fld" style="left:432px;top:452px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:528px;top:452px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:653.33px;top:452px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:right; line-height:16px; overflow:hidden; white-space:pre;"></div>

          <!-- ========================================================================= -->
          <!-- SECTION 8: ADDITIONAL INTEREST SCHEDULE                                   -->
          <!-- ========================================================================= -->

          <!-- ========================================================================= -->
          <!-- SECTION 8.0: ADDITIONAL INTEREST SCHEDULE HEADER -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:376;transform:matrix(1,0,0,1,28.8,474.98)">ADDITIONAL INTEREST</div>
          <div class="t c1" style="z-index:358;transform:matrix(1,0,0,1,211.2,474.98)">ACORD 45 Attached</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:186.67px;top:472px;width:20px;height:16px;"></div>

          <!-- ========================================================================= -->
          <!-- SECTION 8.1: ADDITIONAL INTEREST - ITEM 1 -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c2" style="z-index:781;transform:matrix(1,0,0,1,28.8,493.52)">INTEREST</div>
          <div class="t c2" style="z-index:789;transform:matrix(1,0,0,1,105.6,493.52)">RANK:</div>
          <div class="t c2" style="z-index:794;transform:matrix(1,0,0,1,168,493.52)">NAME AND ADDRESS</div>
          <div class="t c2" style="z-index:810;transform:matrix(1,0,0,1,268.8,493.52)">REFERENCE #:</div>
          <div class="t c2" style="z-index:822;transform:matrix(1,0,0,1,494.4,493.52)">CERTIFICATE REQUIRED</div>
          <div class="t c2" style="z-index:842;transform:matrix(1,0,0,1,642.96,493.52)">INTEREST IN ITEM NUMBER</div>
          <div class="t c2" style="z-index:1818;transform:matrix(1,0,0,1,48,507.44)">LENDER'S LOSS PAYABLE</div>
          <div class="t c2" style="z-index:885;transform:matrix(1,0,0,1,604.8,509.52)">LOCATION:</div>
          <div class="t c2" style="z-index:894;transform:matrix(1,0,0,1,700.8,509.52)">BUILDING:</div>
          <div class="t c2" style="z-index:875;transform:matrix(1,0,0,1,48,523.44)">LIENHOLDER</div>
          <div class="t c2" style="z-index:903;transform:matrix(1,0,0,1,604.8,526.8)">SCHEDULED ITEM NUMBER:</div>
          <div class="t c2" style="z-index:865;transform:matrix(1,0,0,1,48,539.44)">LOSS PAYEE</div>
          <div class="t c2" style="z-index:925;transform:matrix(1,0,0,1,604.8,539.44)">OTHER</div>
          <div class="t c2" style="z-index:764;transform:matrix(1,0,0,1,168,571.44)">ITEM DESCRIPTION:</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:134.67px;top:488px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.rank || ''}</div>
          <div class="fld" style="left:330.67px;top:488px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.referenceNumber || ''}</div>
          <div class="fld" style="left:470.67px;top:488px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[0]?.certificateRequired ? 'X' : ''}</div>
          <div class="fld" style="left:24px;top:504px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[0]?.interestType === 'lenders_loss_payable' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:504px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.name ? `${(data as any).additionalInterests[0].name}, ${(data as any).additionalInterests[0].address || ''}` : ''}</div>
          <div class="fld" style="left:653.33px;top:504px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.location || ''}</div>
          <div class="fld" style="left:744px;top:504px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.building || ''}</div>
          <div class="fld" style="left:24px;top:520px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[0]?.interestType === 'lienholder' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:520px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:720px;top:520px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.scheduledItemNumber || ''}</div>
          <div class="fld" style="left:24px;top:536px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[0]?.interestType === 'loss_payee' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:536px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:24px;top:552px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[0]?.interestType === 'other' ? 'X' : ''}</div>
          <div class="fld" style="left:48px;top:552px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.otherDescription || ''}</div>
          <div class="fld" style="left:168px;top:552px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:441.33px;top:552px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:465.33px;top:552px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:605.33px;top:552px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:254.67px;top:568px;width:532px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[0]?.itemDescription || ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 8.2: ADDITIONAL INTEREST - ITEM 2 -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c2" style="z-index:597;transform:matrix(1,0,0,1,28.8,589.52)">INTEREST</div>
          <div class="t c2" style="z-index:605;transform:matrix(1,0,0,1,105.6,589.52)">RANK:</div>
          <div class="t c2" style="z-index:610;transform:matrix(1,0,0,1,168,589.52)">NAME AND ADDRESS</div>
          <div class="t c2" style="z-index:626;transform:matrix(1,0,0,1,268.8,589.52)">REFERENCE #:</div>
          <div class="t c2" style="z-index:638;transform:matrix(1,0,0,1,494.4,589.52)">CERTIFICATE REQUIRED</div>
          <div class="t c2" style="z-index:658;transform:matrix(1,0,0,1,642.96,589.52)">INTEREST IN ITEM NUMBER</div>
          <div class="t c2" style="z-index:1839;transform:matrix(1,0,0,1,48,603.44)">LENDER'S LOSS PAYABLE</div>
          <div class="t c2" style="z-index:701;transform:matrix(1,0,0,1,604.8,605.52)">LOCATION:</div>
          <div class="t c2" style="z-index:710;transform:matrix(1,0,0,1,700.8,605.52)">BUILDING:</div>
          <div class="t c2" style="z-index:691;transform:matrix(1,0,0,1,48,619.44)">LIENHOLDER</div>
          <div class="t c2" style="z-index:719;transform:matrix(1,0,0,1,604.8,622.8)">SCHEDULED ITEM NUMBER:</div>
          <div class="t c2" style="z-index:681;transform:matrix(1,0,0,1,48,635.44)">LOSS PAYEE</div>
          <div class="t c2" style="z-index:741;transform:matrix(1,0,0,1,604.8,635.44)">OTHER</div>
          <div class="t c2" style="z-index:580;transform:matrix(1,0,0,1,168,667.44)">ITEM DESCRIPTION:</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:134.67px;top:584px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.rank || ''}</div>
          <div class="fld" style="left:330.67px;top:584px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.referenceNumber || ''}</div>
          <div class="fld" style="left:470.67px;top:584px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[1]?.certificateRequired ? 'X' : ''}</div>
          <div class="fld" style="left:24px;top:600px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[1]?.interestType === 'lenders_loss_payable' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:600px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.name ? `${(data as any).additionalInterests[1].name}, ${(data as any).additionalInterests[1].address || ''}` : ''}</div>
          <div class="fld" style="left:653.33px;top:600px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.location || ''}</div>
          <div class="fld" style="left:744px;top:600px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.building || ''}</div>
          <div class="fld" style="left:24px;top:616px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[1]?.interestType === 'lienholder' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:616px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:720px;top:616px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.scheduledItemNumber || ''}</div>
          <div class="fld" style="left:24px;top:632px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[1]?.interestType === 'loss_payee' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:632px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:24px;top:648px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[1]?.interestType === 'other' ? 'X' : ''}</div>
          <div class="fld" style="left:48px;top:648px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.otherDescription || ''}</div>
          <div class="fld" style="left:168px;top:648px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:441.33px;top:648px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:465.33px;top:648px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:605.33px;top:648px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:249.33px;top:664px;width:537.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[1]?.itemDescription || ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 8.3: ADDITIONAL INTEREST - ITEM 3 -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c2" style="z-index:413;transform:matrix(1,0,0,1,28.8,685.52)">INTEREST</div>
          <div class="t c2" style="z-index:421;transform:matrix(1,0,0,1,105.6,685.52)">RANK:</div>
          <div class="t c2" style="z-index:426;transform:matrix(1,0,0,1,168,685.52)">NAME AND ADDRESS</div>
          <div class="t c2" style="z-index:442;transform:matrix(1,0,0,1,268.8,685.52)">REFERENCE #:</div>
          <div class="t c2" style="z-index:454;transform:matrix(1,0,0,1,494.4,685.52)">CERTIFICATE REQUIRED</div>
          <div class="t c2" style="z-index:474;transform:matrix(1,0,0,1,642.96,685.52)">INTEREST IN ITEM NUMBER</div>
          <div class="t c2" style="z-index:1860;transform:matrix(1,0,0,1,48,699.44)">LENDER'S LOSS PAYABLE</div>
          <div class="t c2" style="z-index:517;transform:matrix(1,0,0,1,604.8,701.52)">LOCATION:</div>
          <div class="t c2" style="z-index:526;transform:matrix(1,0,0,1,700.8,701.52)">BUILDING:</div>
          <div class="t c2" style="z-index:507;transform:matrix(1,0,0,1,48,715.44)">LIENHOLDER</div>
          <div class="t c2" style="z-index:535;transform:matrix(1,0,0,1,604.8,718.8)">SCHEDULED ITEM NUMBER:</div>
          <div class="t c2" style="z-index:497;transform:matrix(1,0,0,1,48,731.44)">LOSS PAYEE</div>
          <div class="t c2" style="z-index:557;transform:matrix(1,0,0,1,604.8,731.44)">OTHER</div>
          <div class="t c2" style="z-index:396;transform:matrix(1,0,0,1,168,763.44)">ITEM DESCRIPTION:</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:134.67px;top:680px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.rank || ''}</div>
          <div class="fld" style="left:330.67px;top:680px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.referenceNumber || ''}</div>
          <div class="fld" style="left:470.67px;top:680px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[2]?.certificateRequired ? 'X' : ''}</div>
          <div class="fld" style="left:24px;top:696px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[2]?.interestType === 'lenders_loss_payable' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:696px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.name ? `${(data as any).additionalInterests[2].name}, ${(data as any).additionalInterests[2].address || ''}` : ''}</div>
          <div class="fld" style="left:653.33px;top:696px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.location || ''}</div>
          <div class="fld" style="left:744px;top:696px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.building || ''}</div>
          <div class="fld" style="left:24px;top:712px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[2]?.interestType === 'lienholder' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:712px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:720px;top:712px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.scheduledItemNumber || ''}</div>
          <div class="fld" style="left:24px;top:728px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[2]?.interestType === 'loss_payee' ? 'X' : ''}</div>
          <div class="fld" style="left:168px;top:728px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:24px;top:744px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${(data as any).additionalInterests?.[2]?.interestType === 'other' ? 'X' : ''}</div>
          <div class="fld" style="left:48px;top:744px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.otherDescription || ''}</div>
          <div class="fld" style="left:168px;top:744px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:441.33px;top:744px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:465.33px;top:744px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:605.33px;top:744px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
          <div class="fld" style="left:249.33px;top:760px;width:537.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${(data as any).additionalInterests?.[2]?.itemDescription || ''}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 9: TRANSPORTATION, SECURITY & RIGGING -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c1" style="z-index:1691;transform:matrix(1,0,0,1,28.8,779.14)">RIGGING</div>
          <div class="t c1" style="z-index:1565;transform:matrix(1,0,0,1,518.4,779.14)">TRANSPORTATION / SECURITY</div>
          <div class="t c2" style="z-index:1698;transform:matrix(1,0,0,1,28.8,794.16)">DESCRIBE ALL HOISTING OR OTHER OPERATIONS REQUIRING RIGGING.</div>
          <div class="t c2" style="z-index:1617;transform:matrix(1,0,0,1,518.4,794.16)">ESTIMATE % OF VALUE OF MATERIAL SHIPPED TO JOB</div>
          <div class="t c2" style="z-index:1592;transform:matrix(1,0,0,1,518.4,802.16)">SITE AT APPLICANT'S RISK.</div>
          <div class="t c3" style="z-index:1591;transform:matrix(1,0,0,1,633.6,819.4)">%</div>
          <div class="t c2" style="z-index:1664;transform:matrix(1,0,0,1,518.4,842.16)">DESCRIBE JOB SITE SECURITY</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:29.33px;top:808px;width:469.33px;height:96px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${data.involvesCranes ? (data.workDescription || 'Cranes and hoisting operations required.') : 'None'}</div>
          <div class="fld" style="left:518.67px;top:816px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:right; line-height:16px; overflow:hidden; white-space:pre;">${data.percentageWorkCompleted || ''}</div>
          <div class="fld" style="left:518.67px;top:856px;width:268px;height:48px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${securitySummary}</div>

          <!-- ========================================================================= -->
          <!-- SECTION 10: REMARKS & PAGE 1 FOOTER -->
          <!-- ========================================================================= -->

          <!-- --- Labels & Headings (div) --- -->
          <div class="t c2" style="z-index:1759;transform:matrix(1,0,0,1,683.12,59.44)">DATE (MM/DD/YYYY)</div>
          <div class="t c0" style="z-index:1;transform:matrix(1,0,0,1,28.8,915.46)">REMARKS  (ACORD 101, Additional Remarks Schedule, may be attached if more space is required)</div>
          <div class="t c1" style="z-index:966;transform:matrix(1,0,0,1,341.04,977.62)">SPECIFIC JOB on Page 2</div>
          <div class="t c1" style="z-index:947;transform:matrix(1,0,0,1,28.8,993.62)">ACORD 147 (2016/03)</div>
          <div class="t c1" style="z-index:1881;transform:matrix(1,0,0,1,351.04,993.62)">Attach to ACORD 125</div>
          <div class="t c1" style="z-index:147;transform:matrix(1,0,0,1,480.16,993.62)">© 2001-2015 ACORD CORPORATION.  All rights reserved.</div>
          <div class="t c1" style="z-index:94;transform:matrix(1,0,0,1,249.6,1009.7)">The ACORD name and logo are registered marks of ACORD</div>

          <!-- --- Field Values (div) --- -->
          <div class="fld" style="left:29.33px;top:936px;width:757.33px;height:40px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${data.workStartedExplanation || data.groundUpExplanation || data.existingDamageClarification || data.workDescription || ''}</div>
        </div>
    </div>`;
}
//Page 7 Acord 144 page 2//
function generateApplicationPage7(data: BuildersRiskPacketData): string {
  // Security description
  const securityItems: string[] = [];
  if (data.siteFenced) securityItems.push('Fenced');
  if (data.siteLighted) securityItems.push('Lighted');
  if (data.siteLocked) securityItems.push('Locked');
  if (data.siteGuards) securityItems.push('Guards');
  if (data.siteOtherSecurity) securityItems.push(data.siteOtherSecurity);
  const securitySummary = securityItems.length > 0 ? securityItems.join(', ') : (data.siteFenced !== null && data.siteFenced !== undefined ? 'Standard Job Site Security' : '');

  // Causes of loss flags
  const hasEarthquake = !!data.coverages?.earthMovement;
  const hasFlood = !!data.coverages?.flood;
  const hasOtherCov = !!data.coverages?.other;

  // Remarks summary
  const p2Remarks = [
    data.workDescription ? `Work Description: ${data.workDescription}` : '',
    data.intendedOccupancy ? `Intended Occupancy: ${data.intendedOccupancy}` : '',
    data.numberOfStories ? `Stories: ${data.numberOfStories}` : '',
    data.roofingMaterials ? `Roofing: ${data.roofingMaterials}` : '',
    data.protectionClass ? `Protection Class: ${data.protectionClass}` : '',
    data.yearBuilt ? `Year Built: ${data.yearBuilt}` : '',
    data.originalSquareFootage ? `Square Footage: ${data.originalSquareFootage}` : '',
    data.groundUpExplanation ? `Ground Up: ${data.groundUpExplanation}` : '',
    data.workStartedExplanation ? `Prior Work: ${data.workStartedExplanation}` : ''
  ].filter(Boolean).join('; ');

  return `
    <div class="page page2-isc">
      <style>
        #p1 { width: 816px; height: 1056px; }
      </style>
      <div class="page" id="p1">

        <!-- ========================================================================= -->
        <!-- BACKGROUND GRAPHICS, BORDERS & SEPARATORS (SVG)                           -->
        <!-- ========================================================================= -->
        <svg class="vec" style="z-index:1;left:22.68px;top:990.68px;overflow:hidden" width="770.64" height="2.64" viewBox="22.68 990.68 770.64 2.64"><path d="M24 992H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:111;left:185.88px;top:350.68px;overflow:hidden" width="21.84" height="18.64" viewBox="185.88 350.68 21.84 18.64"><path d="M187.2 352H206.4V368H187.2Z" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:131;left:22.84px;top:638.84px;overflow:hidden" width="21.52" height="2.32" viewBox="22.84 638.84 21.52 2.32"><path d="M24 640H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:298;left:22.52px;top:542.52px;overflow:hidden" width="770.96" height="114.96" viewBox="22.52 542.52 770.96 114.96"><path d="M24 656H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 592H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 576H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 576H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 608H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 624H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 592H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 608H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 560V576" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 560V656" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 560V576" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 560V576" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 560V576" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 560V640" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 576V640" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 576V592" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 640H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 544H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:482;left:22.52px;top:446.52px;overflow:hidden" width="770.96" height="114.96" viewBox="22.52 446.52 770.96 114.96"><path d="M24 560H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 496H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 480H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 480H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 512H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 528H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 496H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 512H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 464V480" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 464V560" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 464V480" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 464V480" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 464V480" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 464V544" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 480V544" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 480V496" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 544H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 448H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:666;left:22.36px;top:366.36px;overflow:hidden" width="771.28" height="291.28" viewBox="22.36 366.36 771.28 291.28"><path d="M24 464H792" fill="none" stroke="#000000" stroke-width="0.96"/><path d="M24 400H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 384H163.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 384H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 416H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 432H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 400H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 416H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M100.8 368V384" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 368V464" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M264 368V384" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M470.4 368V384" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M489.6 368V384" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M600 368V448" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M43.2 384V448" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M696 384V400" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M163.2 448H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 368H792V656H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:733;left:550.68px;top:46.68px;overflow:hidden" width="242.64" height="2.64" viewBox="550.68 46.68 242.64 2.64"><path d="M552 48H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:774;left:637.24px;top:286.84px;overflow:hidden" width="151.12" height="2.32" viewBox="637.24 286.84 151.12 2.32"><path d="M638.4 288H787.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:823;left:22.36px;top:270.36px;overflow:hidden" width="771.28" height="83.28" viewBox="22.36 270.36 771.28 83.28"><path d="M24 272H792V352H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:836;left:22.36px;top:782.36px;overflow:hidden" width="771.28" height="227.28" viewBox="22.36 782.36 771.28 227.28"><path d="M24 784H792V1008H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:864;left:512.44px;top:78.84px;overflow:hidden" width="2.32" height="18.32" viewBox="512.44 78.84 2.32 18.32"><path d="M513.6 80V96" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:898;left:512.44px;top:78.84px;overflow:hidden" width="280.72" height="34.32" viewBox="512.44 78.84 280.72 34.32"><path d="M513.6 96H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 80V96" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 80V96" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 96V112" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 96V112" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 96V112" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:915;left:512.44px;top:94.84px;overflow:hidden" width="280.72" height="82.32" viewBox="512.44 94.84 280.72 82.32"><path d="M513.6 112H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M532.8 96V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 112V128" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 112V128" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 112V128" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:926;left:512.44px;top:126.84px;overflow:hidden" width="280.72" height="18.32" viewBox="512.44 126.84 280.72 18.32"><path d="M513.6 128H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 128V144" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 128V144" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 128V144" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:931;left:512.44px;top:142.84px;overflow:hidden" width="280.72" height="34.32" viewBox="512.44 142.84 280.72 34.32"><path d="M513.6 144H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 176H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 144V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M705.6 144V176" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:952;left:511.96px;top:78.36px;overflow:hidden" width="281.68" height="99.28" viewBox="511.96 78.36 281.68 99.28"><path d="M513.6 160H532.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 160H628.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M609.6 160V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M628.8 160V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M619.2 160H628.8" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M513.6 80H792V176H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:966;left:224.44px;top:110.84px;overflow:hidden" width="146.32" height="66.32" viewBox="224.44 110.84 146.32 66.32"><path d="M225.6 176H369.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 112H369.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:997;left:224.44px;top:78.84px;overflow:hidden" width="280.72" height="98.32" viewBox="224.44 78.84 280.72 98.32"><path d="M225.6 80V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M369.6 176H504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M369.6 112H504" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1014;left:22.84px;top:78.84px;overflow:hidden" width="347.92" height="98.32" viewBox="22.84 78.84 347.92 98.32"><path d="M369.6 80V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 80V176" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 176H225.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1035;left:22.36px;top:78.36px;overflow:hidden" width="483.28" height="99.28" viewBox="22.36 78.36 483.28 99.28"><path d="M24 112H225.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 80H504V176H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:1054;left:368.44px;top:222.84px;overflow:hidden" width="136.72" height="34.32" viewBox="368.44 222.84 136.72 34.32"><path d="M369.6 256H504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M369.6 224H504" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1088;left:224.44px;top:190.84px;overflow:hidden" width="146.32" height="66.32" viewBox="224.44 190.84 146.32 66.32"><path d="M369.6 192V256" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 256H369.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 224H369.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1107;left:22.84px;top:190.84px;overflow:hidden" width="203.92" height="66.32" viewBox="22.84 190.84 203.92 66.32"><path d="M225.6 192V256" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 192V256" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 256H225.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1140;left:22.36px;top:190.36px;overflow:hidden" width="483.28" height="67.28" viewBox="22.36 190.36 483.28 67.28"><path d="M24 208H225.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 224H225.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M129.6 208V256" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 192H504V256H24Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:1178;left:511.96px;top:190.36px;overflow:hidden" width="281.68" height="67.28" viewBox="511.96 190.36 281.68 67.28"><path d="M513.6 192H792V256H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:1240;left:511.96px;top:670.36px;overflow:hidden" width="281.68" height="99.28" viewBox="511.96 670.36 281.68 99.28"><path d="M513.6 672H792V768H513.6Z" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:1255;left:22.84px;top:670.84px;overflow:hidden" width="2.32" height="18.32" viewBox="22.84 670.84 2.32 18.32"><path d="M24 672V688" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1320;left:22.84px;top:686.84px;overflow:hidden" width="482.32" height="82.32" viewBox="22.84 686.84 482.32 82.32"><path d="M24 688H504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M369.6 768H504" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M369.6 720H504" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1340;left:224.44px;top:686.84px;overflow:hidden" width="146.32" height="82.32" viewBox="224.44 686.84 146.32 82.32"><path d="M369.6 688V768" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 768H369.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M225.6 720H369.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1371;left:128.44px;top:686.84px;overflow:hidden" width="98.32" height="82.32" viewBox="128.44 686.84 98.32 82.32"><path d="M225.6 688V768" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M129.6 768H225.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M129.6 720H225.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1400;left:22.84px;top:686.84px;overflow:hidden" width="107.92" height="82.32" viewBox="22.84 686.84 107.92 82.32"><path d="M129.6 688V768" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 688V768" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 768H129.6" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1418;left:22.36px;top:382.36px;overflow:hidden" width="483.28" height="387.28" viewBox="22.36 382.36 483.28 387.28"><path d="M24 720H129.6" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 672H504V768H24Z" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 384H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 400H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1443;left:22.84px;top:478.84px;overflow:hidden" width="21.52" height="18.32" viewBox="22.84 478.84 21.52 18.32"><path d="M24 480H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 496H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>
        <svg class="vec" style="z-index:1466;left:22.84px;top:574.84px;overflow:hidden" width="21.52" height="18.32" viewBox="22.84 574.84 21.52 18.32"><path d="M24 576H43.2" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 592H43.2" fill="none" stroke="#000000" stroke-width="0.32"/></svg>

        <!-- ========================================================================= -->
        <!-- SECTION 1: HEADER & IDENTIFICATION (CUSTOMER ID, SPECIFIC JOB TITLE) -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c0" style="z-index:734;transform:matrix(1,0,0,1,420.32,35.46)">AGENCY CUSTOMER ID:</div>
        <div class="t c4" style="z-index:824;transform:matrix(1,0,0,1,360.24,58.21)">SPECIFIC JOB</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:552px;top:32px;width:240px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.submissionNumber || data.applicationId || ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 2A: SPECIFIC JOB - COVERAGE LIMITS -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:958;transform:matrix(1,0,0,1,28.8,67.14)">COVERAGE</div>
        <div class="t c2" style="z-index:977;transform:matrix(1,0,0,1,251.04,89.52)">LIMIT AT A TEMPORARY</div>
        <div class="t c2" style="z-index:1018;transform:matrix(1,0,0,1,86.88,93.52)">LIMIT AT LOCATION</div>
        <div class="t c2" style="z-index:1001;transform:matrix(1,0,0,1,408.64,93.52)">TRANSIT LIMIT</div>
        <div class="t c2" style="z-index:969;transform:matrix(1,0,0,1,277.07,97.52)">LOCATION</div>
        <div class="t c2" style="z-index:1017;transform:matrix(1,0,0,1,28.8,141.52)">$</div>
        <div class="t c2" style="z-index:968;transform:matrix(1,0,0,1,230.4,141.52)">$</div>
        <div class="t c2" style="z-index:1000;transform:matrix(1,0,0,1,374.4,141.52)">$</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:38.67px;top:136px;width:182.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.totalInsurableValue || data.limitOfInsurance || data.insurableValueTotal || ''}</div>
        <div class="fld" style="left:240px;top:136px;width:125.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.coverages?.propertyInStorageLimit || ''}</div>
        <div class="fld" style="left:384px;top:136px;width:114.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.coverages?.propertyInTransitLimit || ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 2B: SPECIFIC JOB - CAUSES OF LOSS & DEDUCTIBLES -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:837;transform:matrix(1,0,0,1,518.4,67.14)">CAUSES OF LOSS &amp; DEDUCTIBLE</div>
        <div class="t c2" style="z-index:884;transform:matrix(1,0,0,1,526.88,85.52)">CAUSES OF LOSS</div>
        <div class="t c2" style="z-index:875;transform:matrix(1,0,0,1,638.08,85.52)">SUB LIMIT</div>
        <div class="t c2" style="z-index:865;transform:matrix(1,0,0,1,723.45,85.52)">DEDUCTIBLE</div>
        <div class="t c2" style="z-index:914;transform:matrix(1,0,0,1,614.4,101.52)">$</div>
        <div class="t c5" style="z-index:904;transform:matrix(1,0,0,1,537.6,101.88)">EARTHQUAKE</div>
        <div class="t c2" style="z-index:925;transform:matrix(1,0,0,1,614.4,117.52)">$</div>
        <div class="t c5" style="z-index:920;transform:matrix(1,0,0,1,537.6,117.88)">FLOOD</div>
        <div class="t c2" style="z-index:930;transform:matrix(1,0,0,1,614.4,133.52)">$</div>
        <div class="t c5" style="z-index:945;transform:matrix(1,0,0,1,537.6,149.88)">SPECIAL</div>
        <div class="t c5" style="z-index:940;transform:matrix(1,0,0,1,537.6,165.88)">BROAD</div>
        <div class="t c5" style="z-index:935;transform:matrix(1,0,0,1,633.6,165.88)">BASIC</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:513.33px;top:96px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasEarthquake ? 'X' : ''}</div>
        <div class="fld" style="left:624px;top:96px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasEarthquake ? (data.coverages?.earthMovementLimit || '') : ''}</div>
        <div class="fld" style="left:710.67px;top:96px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasEarthquake ? (data.deductible || '') : ''}</div>
        <div class="fld" style="left:513.33px;top:112px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasFlood ? 'X' : ''}</div>
        <div class="fld" style="left:624px;top:112px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasFlood ? (data.coverages?.floodLimit || '') : ''}</div>
        <div class="fld" style="left:710.67px;top:112px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasFlood ? (data.deductible || '') : ''}</div>
        <div class="fld" style="left:513.33px;top:128px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${hasOtherCov ? 'X' : ''}</div>
        <div class="fld" style="left:537.33px;top:128px;width:68px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.coverages?.otherName || '') : ''}</div>
        <div class="fld" style="left:624px;top:128px;width:77.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.coverages?.otherLimit || '') : ''}</div>
        <div class="fld" style="left:710.67px;top:128px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${hasOtherCov ? (data.deductible || '') : ''}</div>
        <div class="fld" style="left:513.33px;top:144px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">X</div>
        <div class="fld" style="left:710.67px;top:152px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.deductible || ''}</div>
        <div class="fld" style="left:513.33px;top:160px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:609.33px;top:160px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 3: JOB TERM, VALUES & SECURITY -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:1037;transform:matrix(1,0,0,1,28.8,179.14)">JOB TERM / VALUES</div>
        <div class="t c1" style="z-index:1144;transform:matrix(1,0,0,1,518.4,179.14)">SECURITY</div>
        <div class="t c2" style="z-index:1152;transform:matrix(1,0,0,1,518.4,194.32)">DESCRIBE JOB SITE SECURITY</div>
        <div class="t c2" style="z-index:1132;transform:matrix(1,0,0,1,104.56,197.52)">JOB TERM</div>
        <div class="t c2" style="z-index:1074;transform:matrix(1,0,0,1,400.8,201.52)">VALUE OF OWNER</div>
        <div class="t c2" style="z-index:1092;transform:matrix(1,0,0,1,257.52,205.52)">CONTRACT AMOUNT</div>
        <div class="t c2" style="z-index:1057;transform:matrix(1,0,0,1,394.48,209.52)">SUPPLIED PROPERTY</div>
        <div class="t c2" style="z-index:1120;transform:matrix(1,0,0,1,42.28,213.52)">COMMENCEMENT</div>
        <div class="t c2" style="z-index:1110;transform:matrix(1,0,0,1,151.39,213.52)">COMPLETION</div>
        <div class="t c2" style="z-index:1091;transform:matrix(1,0,0,1,230.4,237.52)">$</div>
        <div class="t c2" style="z-index:1056;transform:matrix(1,0,0,1,374.4,237.52)">$</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:518.67px;top:208px;width:268px;height:48px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${securitySummary}</div>
        <div class="fld" style="left:29.33px;top:232px;width:96px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;">${data.constructionStartDate || data.requestedEffectiveDate || ''}</div>
        <div class="fld" style="left:134.67px;top:232px;width:86.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;">${data.constructionProjectedEndDate || data.requestedExpiryDate || ''}</div>
        <div class="fld" style="left:240px;top:232px;width:125.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.totalInsurableValue || data.buildingMaterialsValue || data.limitOfInsurance || ''}</div>
        <div class="fld" style="left:384px;top:232px;width:114.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.existingStructureValue || ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 4: JOB DESCRIPTION & INSURED JOB NUMBER -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:775;transform:matrix(1,0,0,1,28.8,259.14)">JOB DESCRIPTION</div>
        <div class="t c2" style="z-index:790;transform:matrix(1,0,0,1,28.8,274.16)">DESCRIBE THE WORK TO BE PERFORMED</div>
        <div class="t c2" style="z-index:753;transform:matrix(1,0,0,1,532.8,276.08)">INSURED'S JOB NUMBER:</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:642.67px;top:272px;width:144px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.submissionNumber || data.applicationId || ''}</div>
        <div class="fld" style="left:29.33px;top:288px;width:757.33px;height:56px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${data.workDescription || data.intendedOccupancy || ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 5: ADDITIONAL INTEREST SCHEDULE                                   -->
        <!-- ========================================================================= -->

        <!-- ========================================================================= -->
        <!-- SECTION 5.0: ADDITIONAL INTEREST SCHEDULE HEADER -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:112;transform:matrix(1,0,0,1,28.8,354.98)">ADDITIONAL INTEREST</div>
        <div class="t c1" style="z-index:94;transform:matrix(1,0,0,1,211.2,354.98)">ACORD 45 Attached</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:186.67px;top:352px;width:20px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 5.1: ADDITIONAL INTEREST - ITEM 1 -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c2" style="z-index:517;transform:matrix(1,0,0,1,28.8,373.52)">INTEREST</div>
        <div class="t c2" style="z-index:525;transform:matrix(1,0,0,1,105.6,373.52)">RANK:</div>
        <div class="t c2" style="z-index:530;transform:matrix(1,0,0,1,168,373.52)">NAME AND ADDRESS</div>
        <div class="t c2" style="z-index:546;transform:matrix(1,0,0,1,268.8,373.52)">REFERENCE #:</div>
        <div class="t c2" style="z-index:558;transform:matrix(1,0,0,1,494.4,373.52)">CERTIFICATE REQUIRED</div>
        <div class="t c2" style="z-index:578;transform:matrix(1,0,0,1,642.96,373.52)">INTEREST IN ITEM NUMBER</div>
        <div class="t c2" style="z-index:1422;transform:matrix(1,0,0,1,48,387.44)">LENDER'S LOSS PAYABLE</div>
        <div class="t c2" style="z-index:621;transform:matrix(1,0,0,1,604.8,389.52)">LOCATION:</div>
        <div class="t c2" style="z-index:630;transform:matrix(1,0,0,1,700.8,389.52)">BUILDING:</div>
        <div class="t c2" style="z-index:601;transform:matrix(1,0,0,1,48,403.44)">LOSS PAYEE</div>
        <div class="t c2" style="z-index:639;transform:matrix(1,0,0,1,604.8,406.8)">SCHEDULED ITEM NUMBER:</div>
        <div class="t c2" style="z-index:611;transform:matrix(1,0,0,1,48,419.44)">LIENHOLDER</div>
        <div class="t c2" style="z-index:661;transform:matrix(1,0,0,1,604.8,419.44)">OTHER</div>
        <div class="t c2" style="z-index:500;transform:matrix(1,0,0,1,168,451.44)">ITEM DESCRIPTION:</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:134.67px;top:368px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:330.67px;top:368px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:470.67px;top:368px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:24px;top:384px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:168px;top:384px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.contractorName ? `Contractor: ${data.contractorName}` : ''}</div>
        <div class="fld" style="left:653.33px;top:384px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.contractorName ? '1' : ''}</div>
        <div class="fld" style="left:744px;top:384px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.contractorName ? '1' : ''}</div>
        <div class="fld" style="left:24px;top:400px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:168px;top:400px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:720px;top:400px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:416px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:168px;top:416px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:432px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;">${data.contractorName ? 'X' : ''}</div>
        <div class="fld" style="left:48px;top:432px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.contractorName ? 'General Contractor' : ''}</div>
        <div class="fld" style="left:168px;top:432px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:441.33px;top:432px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:465.33px;top:432px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:605.33px;top:432px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:254.67px;top:448px;width:532px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.propertyAddress ? `${data.propertyAddress}, ${data.propertyCity}, ${data.propertyState} ${data.propertyZip}` : ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 5.2: ADDITIONAL INTEREST - ITEM 2 -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c2" style="z-index:333;transform:matrix(1,0,0,1,28.8,469.52)">INTEREST</div>
        <div class="t c2" style="z-index:341;transform:matrix(1,0,0,1,105.6,469.52)">RANK:</div>
        <div class="t c2" style="z-index:346;transform:matrix(1,0,0,1,168,469.52)">NAME AND ADDRESS</div>
        <div class="t c2" style="z-index:362;transform:matrix(1,0,0,1,268.8,469.52)">REFERENCE #:</div>
        <div class="t c2" style="z-index:374;transform:matrix(1,0,0,1,494.4,469.52)">CERTIFICATE REQUIRED</div>
        <div class="t c2" style="z-index:394;transform:matrix(1,0,0,1,642.96,469.52)">INTEREST IN ITEM NUMBER</div>
        <div class="t c2" style="z-index:1445;transform:matrix(1,0,0,1,48,483.44)">LENDER'S LOSS PAYABLE</div>
        <div class="t c2" style="z-index:437;transform:matrix(1,0,0,1,604.8,485.52)">LOCATION:</div>
        <div class="t c2" style="z-index:446;transform:matrix(1,0,0,1,700.8,485.52)">BUILDING:</div>
        <div class="t c2" style="z-index:417;transform:matrix(1,0,0,1,48,499.44)">LOSS PAYEE</div>
        <div class="t c2" style="z-index:455;transform:matrix(1,0,0,1,604.8,502.8)">SCHEDULED ITEM NUMBER:</div>
        <div class="t c2" style="z-index:427;transform:matrix(1,0,0,1,48,515.44)">LIENHOLDER</div>
        <div class="t c2" style="z-index:477;transform:matrix(1,0,0,1,604.8,515.44)">OTHER</div>
        <div class="t c2" style="z-index:316;transform:matrix(1,0,0,1,168,547.44)">ITEM DESCRIPTION:</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:134.67px;top:464px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:330.67px;top:464px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:470.67px;top:464px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:24px;top:480px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:480px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:653.33px;top:480px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:744px;top:480px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:496px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:496px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:720px;top:496px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:512px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:512px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:528px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:48px;top:528px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:168px;top:528px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:441.33px;top:528px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:465.33px;top:528px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:605.33px;top:528px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:249.33px;top:544px;width:537.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 5.3: ADDITIONAL INTEREST - ITEM 3 -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c2" style="z-index:149;transform:matrix(1,0,0,1,28.8,565.52)">INTEREST</div>
        <div class="t c2" style="z-index:157;transform:matrix(1,0,0,1,105.6,565.52)">RANK:</div>
        <div class="t c2" style="z-index:162;transform:matrix(1,0,0,1,168,565.52)">NAME AND ADDRESS</div>
        <div class="t c2" style="z-index:178;transform:matrix(1,0,0,1,268.8,565.52)">REFERENCE #:</div>
        <div class="t c2" style="z-index:190;transform:matrix(1,0,0,1,494.4,565.52)">CERTIFICATE REQUIRED</div>
        <div class="t c2" style="z-index:210;transform:matrix(1,0,0,1,642.96,565.52)">INTEREST IN ITEM NUMBER</div>
        <div class="t c2" style="z-index:1468;transform:matrix(1,0,0,1,48,579.44)">LENDER'S LOSS PAYABLE</div>
        <div class="t c2" style="z-index:253;transform:matrix(1,0,0,1,604.8,581.52)">LOCATION:</div>
        <div class="t c2" style="z-index:262;transform:matrix(1,0,0,1,700.8,581.52)">BUILDING:</div>
        <div class="t c2" style="z-index:233;transform:matrix(1,0,0,1,48,595.44)">LOSS PAYEE</div>
        <div class="t c2" style="z-index:271;transform:matrix(1,0,0,1,604.8,598.8)">SCHEDULED ITEM NUMBER:</div>
        <div class="t c2" style="z-index:243;transform:matrix(1,0,0,1,48,611.44)">LIENHOLDER</div>
        <div class="t c2" style="z-index:293;transform:matrix(1,0,0,1,604.8,611.44)">OTHER</div>
        <div class="t c2" style="z-index:132;transform:matrix(1,0,0,1,168,643.44)">ITEM DESCRIPTION:</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:134.67px;top:560px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:330.67px;top:560px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:470.67px;top:560px;width:18.67px;height:16px; font-size:11px; font-weight:bold; font-family:Arial, sans-serif; text-align:center; line-height:16px; color:#000000;"></div>
        <div class="fld" style="left:24px;top:576px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:576px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:653.33px;top:576px;width:37.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:744px;top:576px;width:42.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:592px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:592px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:720px;top:592px;width:66.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:608px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:168px;top:608px;width:360px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:24px;top:624px;width:18.67px;height:16px;"></div>
        <div class="fld" style="left:48px;top:624px;width:110.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:168px;top:624px;width:273.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:441.33px;top:624px;width:24px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:465.33px;top:624px;width:62.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:605.33px;top:624px;width:181.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:249.33px;top:640px;width:537.33px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 6: TRANSPORTATION & RIGGING OPERATIONS -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:1241;transform:matrix(1,0,0,1,28.8,659.14)">TRANSPORTATION</div>
        <div class="t c1" style="z-index:1179;transform:matrix(1,0,0,1,518.4,659.14)">RIGGING</div>
        <div class="t c2" style="z-index:1186;transform:matrix(1,0,0,1,518.4,674.16)">DESCRIBE ALL HOISTING OR OPERATIONS REQUIRING RIGGING.</div>
        <div class="t c2" style="z-index:1256;transform:matrix(1,0,0,1,28.8,677.52)">TOTAL VALUES TO BE SHIPPED TO THIS JOB SITE AT APPLICANT'S RISK.</div>
        <div class="t c2" style="z-index:1383;transform:matrix(1,0,0,1,137.84,697.52)">% FOR APPLICANT'S</div>
        <div class="t c2" style="z-index:1359;transform:matrix(1,0,0,1,267.2,697.52)">% BY COMMON/</div>
        <div class="t c2" style="z-index:1404;transform:matrix(1,0,0,1,41.36,701.52)">AMOUNT SHIPPED</div>
        <div class="t c2" style="z-index:1323;transform:matrix(1,0,0,1,395.76,701.52)">DISTANCE INVOLVED</div>
        <div class="t c2" style="z-index:1375;transform:matrix(1,0,0,1,157.92,705.52)">VEHICLES</div>
        <div class="t c2" style="z-index:1343;transform:matrix(1,0,0,1,256.96,705.52)">CONTRACT CARRIER</div>
        <div class="t c2" style="z-index:1403;transform:matrix(1,0,0,1,28.8,741.52)">$</div>
        <div class="t c2" style="z-index:1374;transform:matrix(1,0,0,1,216,741.52)">%</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:518.67px;top:688px;width:268px;height:72px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${data.involvesCranes ? (data.workDescription || 'Cranes and hoisting operations required.') : 'None'}</div>
        <div class="fld" style="left:38.67px;top:736px;width:86.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.coverages?.propertyInTransitLimit || ''}</div>
        <div class="fld" style="left:134.67px;top:736px;width:76px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:right; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:230.67px;top:736px;width:134.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:374.67px;top:736px;width:124px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000;text-align:center; line-height:16px; overflow:hidden; white-space:pre;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 7: REMARKS & PAGE 2 FOOTER -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c0" style="z-index:2;transform:matrix(1,0,0,1,28.8,771.46)">REMARKS  (ACORD 101, Additional Remarks Schedule, may be attached if more space is required)</div>
        <div class="t c1" style="z-index:714;transform:matrix(1,0,0,1,351.04,993.62)">Attach to ACORD 125</div>
        <div class="t c1" style="z-index:684;transform:matrix(1,0,0,1,28.8,1009.62)">ACORD 147 (2016/03)</div>
        <div class="t c1" style="z-index:703;transform:matrix(1,0,0,1,378.48,1009.62)">Page 2 of 3</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:29.33px;top:792px;width:757.33px;height:192px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:13px; font-size:10.67px; font-family:sans-serif; color:#000000; white-space:pre-wrap; overflow:hidden;">${p2Remarks}</div>
      </div>
    </div>`;
}
//Page 8 Acord 144 page 3 //
function generateApplicationPage8(data: BuildersRiskPacketData): string {
  const claims = data.claimsList || [];

  return `
    <div class="page page2-isc">
      <style>
        #p2 { width: 816px; height: 1056px; }
        #p2 .c8-j { width: 748px; text-align: justify; text-align-last: justify; display: block; }
        #p2 .c8-l { width: 748px; text-align: left; display: block; }
      </style>
      <div class="page" id="p2">

        <!-- ========================================================================= -->
        <!-- BACKGROUND GRAPHICS, BORDERS & SEPARATORS (SVG)                           -->
        <!-- ========================================================================= -->
        <svg class="vec" style="z-index:1;left:22.68px;top:902.68px;overflow:hidden" width="770.64" height="42.64" viewBox="22.68 902.68 770.64 42.64"><path d="M340.8 944H744" fill="none" stroke="#000000" stroke-width="0.64"/><path d="M24 904H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4323;left:22.68px;top:942.68px;overflow:hidden" width="770.64" height="2.64" viewBox="22.68 942.68 770.64 2.64"><path d="M24 944H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4348;left:656.28px;top:974.68px;overflow:hidden" width="2.64" height="34.64" viewBox="656.28 974.68 2.64 34.64"><path d="M657.6 976V1008" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4370;left:339.48px;top:942.68px;overflow:hidden" width="2.64" height="34.64" viewBox="339.48 942.68 2.64 34.64"><path d="M340.8 944V976" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4391;left:22.36px;top:974.36px;overflow:hidden" width="540.88" height="35.28" viewBox="22.36 974.36 540.88 35.28"><path d="M561.6 976V1008" fill="none" stroke="#000000" stroke-width="0.64"/><path d="M24 976V1008" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 1008H388.8" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:4419;left:22.68px;top:974.68px;overflow:hidden" width="770.64" height="34.64" viewBox="22.68 974.68 770.64 34.64"><path d="M657.6 976V1008" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M24 976H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4451;left:339.48px;top:942.68px;overflow:hidden" width="453.84" height="34.64" viewBox="339.48 942.68 453.84 34.64"><path d="M340.8 976H792" fill="none" stroke="#000000" stroke-width="0.32"/><path d="M657.6 944V976" fill="none" stroke="#000000" stroke-width="0.64"/></svg>
        <svg class="vec" style="z-index:4487;left:22.36px;top:54.36px;overflow:hidden" width="771.28" height="955.28" viewBox="22.36 54.36 771.28 955.28"><path d="M24 56H792" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M24 1008V56" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M792 1008V56" fill="none" stroke="#000000" stroke-width="1.28"/></svg>
        <svg class="vec" style="z-index:4501;left:22.36px;top:46.36px;overflow:hidden" width="771.28" height="963.28" viewBox="22.36 46.36 771.28 963.28"><path d="M24 1008H792" fill="none" stroke="#000000" stroke-width="1.28"/><path d="M552 48H792" fill="none" stroke="#000000" stroke-width="0.64"/></svg>

        <!-- ========================================================================= -->
        <!-- SECTION 1: HEADER & CUSTOMER IDENTIFIER -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c0" style="z-index:4503;transform:matrix(1,0,0,1,420.32,35.46)">AGENCY CUSTOMER ID:</div>
        <div class="t c1" style="z-index:4478;transform:matrix(1,0,0,1,28.8,42.98)">SIGNATURE</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:552px;top:32px;width:240px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.submissionNumber || data.applicationId || ''}</div>

        <!-- ========================================================================= -->
        <!-- SECTION 2: STATE FRAUD NOTICES & LEGAL DISCLOSURES (DIV)                  -->
        <!-- ========================================================================= -->

        <!-- --- Applicable in AL, AR, DC, LA, MD, NM, RI and WV --- -->
        <div class="t c0" style="z-index:4257;transform:matrix(1,0,0,1,33.6,73.86)">Applicable in AL, AR, DC, LA, MD, NM, RI and WV</div>
        <div class="t c8 c8-j" style="z-index:3284;transform:matrix(1,0,0,1,33.6,87.62)">Any person who knowingly (or willfully)* presents a false or fraudulent claim for payment of a loss or benefit or knowingly (or willfully)* presents false</div>
        <div class="t c8 c8-l" style="z-index:3438;transform:matrix(1,0,0,1,33.6,99.94)">information in an application for insurance is guilty of a crime and may be subject to fines and confinement in prison.  *Applies in MD Only.</div>

        <!-- --- Applicable in CO --- -->
        <div class="t c0" style="z-index:3268;transform:matrix(1,0,0,1,33.6,129.86)">Applicable in CO</div>
        <div class="t c8 c8-j" style="z-index:3579;transform:matrix(1,0,0,1,33.6,145.14)">It is unlawful to knowingly provide false, incomplete, or misleading facts or information to an insurance company for the purpose of defrauding or attempting to</div>
        <div class="t c8 c8-j" style="z-index:3739;transform:matrix(1,0,0,1,33.6,157.46)">defraud the company.  Penalties may include imprisonment, fines, denial of insurance and civil damages.  Any insurance company or agent of an insurance</div>
        <div class="t c8 c8-j" style="z-index:3890;transform:matrix(1,0,0,1,33.6,169.78)">company who knowingly provides false, incomplete, or misleading facts or information to a policyholder or claimant for the purpose of defrauding or</div>
        <div class="t c8 c8-j" style="z-index:4037;transform:matrix(1,0,0,1,33.6,182.1)">attempting to defraud the policyholder or claimant with regard to a settlement or award payable from insurance proceeds shall be reported to the Colorado</div>
        <div class="t c8 c8-l" style="z-index:4190;transform:matrix(1,0,0,1,33.6,194.42)">Division of Insurance within the Department of Regulatory Agencies.</div>

        <!-- --- Applicable in FL and OK --- -->
        <div class="t c0" style="z-index:2990;transform:matrix(1,0,0,1,33.6,225.86)">Applicable in FL and OK</div>
        <div class="t c8 c8-j" style="z-index:3013;transform:matrix(1,0,0,1,33.6,239.62)">Any person who knowingly and with intent to injure, defraud, or deceive any insurer files a statement of claim or an application containing any false,</div>
        <div class="t c8 c8-l" style="z-index:3163;transform:matrix(1,0,0,1,33.6,251.94)">incomplete, or misleading information is guilty of a felony (of the third degree)*.  *Applies in FL Only.</div>

        <!-- --- Applicable in KS --- -->
        <div class="t c0" style="z-index:2257;transform:matrix(1,0,0,1,33.6,281.86)">Applicable in KS</div>
        <div class="t c8 c8-j" style="z-index:2273;transform:matrix(1,0,0,1,33.6,301.14)">Any person who, knowingly and with intent to defraud, presents, causes to be presented or prepares with knowledge or belief that it will be presented to or by</div>
        <div class="t c8 c8-j" style="z-index:2431;transform:matrix(1,0,0,1,33.6,313.46)">an insurer, purported insurer, broker or any agent thereof, any written statement as part of, or in support of, an application for the issuance of, or the rating of</div>
        <div class="t c8 c8-j" style="z-index:2595;transform:matrix(1,0,0,1,33.6,325.78)">an insurance policy for personal or commercial insurance, or a claim for payment or other benefit pursuant to an insurance policy for commercial or personal</div>
        <div class="t c8 c8-j" style="z-index:2751;transform:matrix(1,0,0,1,33.6,338.1)">insurance which such person knows to contain materially false information concerning any fact material thereto; or conceals, for the purpose of misleading,</div>
        <div class="t c8 c8-l" style="z-index:2906;transform:matrix(1,0,0,1,33.6,350.42)">information concerning any fact material thereto commits a fraudulent insurance act.</div>

        <!-- --- Applicable in KY, NY, OH and PA --- -->
        <div class="t c0" style="z-index:1717;transform:matrix(1,0,0,1,33.6,377.86)">Applicable in KY, NY, OH and PA</div>
        <div class="t c8 c8-j" style="z-index:1748;transform:matrix(1,0,0,1,33.6,395.3)">Any person who knowingly and with intent to defraud any insurance company or other person files an application for insurance or statement of claim</div>
        <div class="t c8 c8-j" style="z-index:1894;transform:matrix(1,0,0,1,33.6,407.62)">containing any materially false information or conceals for the purpose of misleading, information concerning any fact material thereto commits a fraudulent</div>
        <div class="t c8 c8-j" style="z-index:2050;transform:matrix(1,0,0,1,33.6,419.94)">insurance act, which is a crime and subjects such person to criminal and civil penalties* (not to exceed five thousand dollars and the stated value of the claim</div>
        <div class="t c8 c8-l" style="z-index:2210;transform:matrix(1,0,0,1,33.6,432.26)">for each such violation)*. *Applies in NY Only.</div>

        <!-- --- Applicable in ME, TN, VA and WA --- -->
        <div class="t c0" style="z-index:1440;transform:matrix(1,0,0,1,33.6,457.86)">Applicable in ME, TN, VA and WA</div>
        <div class="t c8 c8-j" style="z-index:1471;transform:matrix(1,0,0,1,33.6,475.62)">It is a crime to knowingly provide false, incomplete or misleading information to an insurance company for the purpose of defrauding the company.  Penalties</div>
        <div class="t c8 c8-l" style="z-index:1627;transform:matrix(1,0,0,1,33.6,487.94)">(may)* include imprisonment, fines and denial of insurance benefits.  *Applies in ME Only.</div>

        <!-- --- Applicable in NJ --- -->
        <div class="t c0" style="z-index:275;transform:matrix(1,0,0,1,33.6,513.86)">Applicable in NJ</div>
        <div class="t c8 c8-l" style="z-index:291;transform:matrix(1,0,0,1,33.6,529.78)">Any person who includes any false or misleading information on an application for an insurance policy is subject to criminal and civil penalties.</div>

        <!-- --- Applicable in OR --- -->
        <div class="t c0" style="z-index:1222;transform:matrix(1,0,0,1,33.6,557.86)">Applicable in OR</div>
        <div class="t c8 c8-j" style="z-index:1238;transform:matrix(1,0,0,1,33.6,575.62)">Any person who knowingly and with intent to defraud or solicit another to defraud the insurer by submitting an application containing a false statement as to</div>
        <div class="t c8 c8-l" style="z-index:1395;transform:matrix(1,0,0,1,33.6,587.94)">any material fact may be violating state law.</div>

        <!-- --- Applicable in PR --- -->
        <div class="t c0" style="z-index:436;transform:matrix(1,0,0,1,33.6,613.86)">Applicable in PR</div>
        <div class="t c8 c8-j" style="z-index:452;transform:matrix(1,0,0,1,33.6,629.14)">Any person who knowingly and with the intention of defrauding presents false information in an insurance application, or presents, helps, or causes the</div>
        <div class="t c8 c8-j" style="z-index:603;transform:matrix(1,0,0,1,33.6,641.46)">presentation of a fraudulent claim for the payment of a loss or any other benefit, or presents more than one claim for the same damage or loss, shall incur a</div>
        <div class="t c8 c8-j" style="z-index:760;transform:matrix(1,0,0,1,33.6,653.78)">felony and, upon conviction, shall be sanctioned for each violation by a fine of not less than five thousand dollars ($5,000) and not more than ten thousand</div>
        <div class="t c8 c8-j" style="z-index:916;transform:matrix(1,0,0,1,33.6,666.1)">dollars ($10,000), or a fixed term of imprisonment for three (3) years, or both penalties.  Should aggravating circumstances [be] present, the penalty thus</div>
        <div class="t c8 c8-l" style="z-index:1071;transform:matrix(1,0,0,1,33.6,678.42)">established may be increased to a maximum of five (5) years, if extenuating circumstances are present, it may be reduced to a minimum of two (2) years.</div>

        <!-- ========================================================================= -->
        <!-- SECTION 3: PRODUCER & APPLICANT SIGNATURES, DATES & LICENSE NUMBERS -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c7" style="z-index:3;transform:matrix(1,0,0,1,33.6,907.71)">THE UNDERSIGNED IS AN AUTHORIZED REPRESENTATIVE OF THE APPLICANT AND REPRESENTS THAT REASONABLE INQUIRY HAS BEEN MADE TO OBTAIN THE</div>
        <div class="t c7" style="z-index:134;transform:matrix(1,0,0,1,33.6,918.59)">ANSWERS TO QUESTIONS ON THIS APPLICATION.  HE/SHE REPRESENTS THAT THE ANSWERS ARE TRUE, CORRECT AND COMPLETE TO THE BEST OF HIS/HER</div>
        <div class="t c7" style="z-index:265;transform:matrix(1,0,0,1,33.6,929.47)">KNOWLEDGE.</div>
        <div class="t c2" style="z-index:4453;transform:matrix(1,0,0,1,662.4,944.08)">STATE PRODUCER LICENSE NO</div>
        <div class="t c2" style="z-index:4371;transform:matrix(1,0,0,1,28.8,947.44)">PRODUCER'S SIGNATURE</div>
        <div class="t c2" style="z-index:4421;transform:matrix(1,0,0,1,345.6,947.92)">PRODUCER'S NAME (Please Print)</div>
        <div class="t c2" style="z-index:4349;transform:matrix(1,0,0,1,662.4,951.44)">(Required in Florida)</div>
        <div class="t c2" style="z-index:4398;transform:matrix(1,0,0,1,28.8,977.68)">APPLICANT'S SIGNATURE</div>
        <div class="t c2" style="z-index:4394;transform:matrix(1,0,0,1,566.4,977.68)">DATE</div>
        <div class="t c2" style="z-index:4324;transform:matrix(1,0,0,1,663.04,977.68)">NATIONAL PRODUCER NUMBER</div>

        <!-- --- Field Values (div) --- -->
        <div class="fld" style="left:29.33px;top:960px;width:306.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:345.33px;top:960px;width:308px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.agentName || data.agencyAgent || ''}</div>
        <div class="fld" style="left:662.67px;top:960px;width:124px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:29.33px;top:992px;width:528px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>
        <div class="fld" style="left:566.67px;top:992px;width:86.67px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;">${data.formDate || ''}</div>
        <div class="fld" style="left:662.67px;top:992px;width:124px;height:16px;font-size:10.67px;font-family:sans-serif;color:#000000; line-height:16px; overflow:hidden; white-space:pre;"></div>

        <!-- ========================================================================= -->
        <!-- SECTION 4: PAGE 3 FOOTER & FORM NUMBER -->
        <!-- ========================================================================= -->

        <!-- --- Labels & Headings (div) --- -->
        <div class="t c1" style="z-index:4304;transform:matrix(1,0,0,1,28.8,1009.62)">ACORD 147 (2016/03)</div>
        <div class="t c1" style="z-index:4490;transform:matrix(1,0,0,1,378.48,1009.62)">Page 3 of 3</div>
      </div>
        </div>`;
}
export function generateAcord125Page1(data: BuildersRiskPacketData): string {

  const effDate = data.proposedEffectiveDateFrom || data.requestedEffectiveDate || data.effectiveDate || data.currentEffectiveDate || '';
  const expDate = data.proposedEffectiveDateTo || data.requestedExpiryDate || data.expiryDate || data.currentExpiryDate || '';

  return `
  <div class="page page2-isc">
    <div id="page_0" class="pdf44_ pdf44_02">
      <div class="pdf44_03">
        <img src="data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" alt="" class="pdf44_04" />
      </div>
      <div class="pdf44_view">
        <div class="pdf44_05 pdf44_06">
          <div class="pdf44_01" style="left:13.296em;top:2.0938em;"><span class="pdf44_07 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">COMMERCIAL INSURANCE APPLICATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.434em;top:2.7186em;"><span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">DATE (MM/DD/YYYY) </span> <br> <div class="avee1">${data.formDate} </div> &nbsp;</span></div>
          <div class="pdf44_01" style="left:45.594em;top:4.5846em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0001em;">NAIC CODE &nbsp;</span></div>
          <div class="pdf44_01" style="left:17.268em;top:3.5086em;"><span class="pdf44_13 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">APPLICANT INFORMATION SECTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:4.6112em;"><span class="pdf44_14 pdf44_08 pdf44_12">CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:4.8366em;"><span> <span class="pdf44_10 pdf44_11 pdf44_12">AGENCY </span> <br> <div class="avee1">${data.agencyName} </div> <div class="avee2"><br> ${data.agencyAddress} , ${data.agencyCity}, ${data.agencyState} ${data.agencyZip} </div> &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.7942em;top:6.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">COMPANY POLICY OR PROGRAM NAME &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:8.7186em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:44.094em;top:6.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">PROGRAM CODE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:10.5486em;"><span class="pdf44_10 pdf44_11 pdf44_12">CONTACT &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:11.0044em;"><span> <span class="pdf44_10 pdf44_11 pdf44_12">NAME:</span> <span class= "avee22"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${data.agentName} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:11.5446em;"><span class="pdf44_10 pdf44_11 pdf44_09">PHONE &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:10.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09">UNDERWRITER &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:10.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0em;">UNDERWRITER OFFICE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:12.0067em;"><span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">(A/C, No, Ext):</span> <span class= "avee22"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${data.agencyPhone} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:12.5464em;"><span class="pdf44_10 pdf44_11 pdf44_09">FAX &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.994em;top:12.7306em;"><span class="pdf44_15 pdf44_08 pdf44_16">QUOTE &nbsp;</span></div>
          <div class="pdf44_01" style="left:39.594em;top:12.7306em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">ISSUE POLICY &nbsp;</span></div>
          <div class="pdf44_01" style="left:45.894em;top:12.7306em;"><span class="pdf44_15 pdf44_08 pdf44_12">RENEW &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:13.0086em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">(A/C, No): &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:13.5066em;"><span class="pdf44_10 pdf44_11 pdf44_09">E-MAIL &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:13.9687em;"><span> <span class="pdf44_10 pdf44_11 pdf44_12">ADDRESS: </span> <span class="avee22"> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${data.agencyEmail} <span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:13.4286em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">STATUS OF &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:14.0048em;"><span class="pdf44_10 pdf44_11 pdf44_09">TRANSACTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.994em;top:13.7026em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">BOUND (Give Date and/or Attach Copy): &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.1281em;top:14.5086em;"><span class="pdf44_10 pdf44_11 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.594em;top:14.5086em;"><span class="pdf44_10 pdf44_11 pdf44_16">TIME &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.994em;top:14.6986em;"><span class="pdf44_15 pdf44_08 pdf44_12">CHANGE &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.016em;top:14.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">AM &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.016em;top:15.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">PM &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:14.8744em;"><span class="pdf44_10 pdf44_11 pdf44_09">CODE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:13.7941em;top:14.8744em;"><span class="pdf44_10 pdf44_11 pdf44_12">SUBCODE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.994em;top:15.7006em;"><span class="pdf44_15 pdf44_08 pdf44_12">CANCEL &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:15.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">AGENCY CUSTOMER ID:</strong> ${data.submissionNumber} &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:16.7072em;"><span class="pdf44_14 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">SECTIONS ATTACHED &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:17.7126em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">INDICATE SECTIONS ATTACHED &nbsp;</span></div>
          <div class="pdf44_01" style="left:12.594em;top:17.7126em;"><span class="pdf44_10 pdf44_11 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.794em;top:17.7126em;"><span class="pdf44_10 pdf44_11 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:44.694em;top:17.7126em;"><span class="pdf44_10 pdf44_11 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:18.5206em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">ACCOUNTS RECEIVABLE / &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:18.9766em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">VALUABLE PAPERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:19.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">BOILER &amp; MACHINERY &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:18.5206em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.2779em;">TRANSPORTATION / &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:18.9766em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">MOTOR TRUCK CARGO &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:19.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">TRUCKERS / MOTOR CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:12.594em;top:18.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:19.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:20.7127em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:21.7147em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:22.7167em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:23.7129em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:12.594em;top:24.7149em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:19.194em;top:18.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">ELECTRONIC DATA PROC &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:19.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">EQUIPMENT FLOATER &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:20.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">GARAGE AND DEALERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">GLASS AND SIGN &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:18.7156em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:19.7171em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:20.7132em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:21.7152em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:22.7172em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:23.7134em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:28.7939em;top:24.7154em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:18.7161em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:19.7176em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:20.7137em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:21.7157em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:22.7177em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.6939em;top:23.7138em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.694em;top:24.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:2.994em;top:20.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">BUSINESS AUTO &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:20.6986em;"><span class="pdf44_15 pdf44_08 pdf44_12">UMBRELLA &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">BUSINESS OWNERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_12">YACHT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:22.7086em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">COMMERCIAL GENERAL LIABILITY &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:23.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">CRIME / MISCELLANEOUS CRIME &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:24.7006em;"><span class="pdf44_15 pdf44_08 pdf44_12">DEALERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:22.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">INSTALLATION / BUILDERS RISK &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:23.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">OPEN CARGO &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:24.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">PROPERTY &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:25.7072em;"><span class="pdf44_14 pdf44_08 pdf44_09">ATTACHMENTS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:26.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">ADDITIONAL INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:26.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">PREMIUM PAYMENT SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:27.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">ADDITIONAL PREMISES &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:27.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">PROFESSIONAL LIABILITY SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:28.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">RESTAURANT / TAVERN SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:29.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">STATEMENT / SCHEDULE OF VALUES &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:30.7006em;"><span class="pdf44_15 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">STATE SUPPLEMENT (If applicable) &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:31.6966em;"><span class="pdf44_15 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">VACANT BUILDING SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.194em;top:32.6986em;"><span class="pdf44_15 pdf44_08 pdf44_12" style="word-spacing:0.0003em;">VEHICLE SCHEDULE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:28.7822em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">APARTMENT BUILDING SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:29.6986em;"><span class="pdf44_15 pdf44_08 pdf44_12" style="word-spacing:0.0003em;">CONDO ASSN BYLAWS (for D&amp;O Coverage only) &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:30.7066em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">CONTRACTORS SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:31.6966em;"><span class="pdf44_15 pdf44_08 pdf44_12" style="word-spacing:0.0003em;">COVERAGES SCHEDULE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:32.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">DRIVER INFORMATION SCHEDULE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:33.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">INTERNATIONAL LIABILITY EXPOSURE SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:34.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">INTERNATIONAL PROPERTY EXPOSURE SUPPLEMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:35.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">LOSS SUMMARY &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:36.6851em;"><span class="pdf44_17 pdf44_08 pdf44_16" style="word-spacing:0.0001em;">POLICY INFORMATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.674em;top:37.7166em;"><span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">PROPOSED EFF DATE </span> <br> <span class="avee22">&nbsp;&nbsp;&nbsp;&nbsp;${effDate} </span></span> <span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.5562em;">&nbsp;</span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;"></span> <span class="avee22">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${expDate} &nbsp;</span></span></div>

          <div class="pdf44_01" style="left:1.674em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.5562em;">&nbsp;</span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">PROPOSED EXP DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:40.884em;top:37.5066em;"><span class="pdf44_10 pdf44_11 pdf44_09">MINIMUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:40.824em;top:37.9624em;"><span class="pdf44_10 pdf44_11 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:15.216em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">BILLING PLAN &nbsp;</span></div>
          <div class="pdf44_01" style="left:14.694em;top:39.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:3.2004em;">DIRECT AGENCY &nbsp;</span></div>
          <div class="pdf44_01" style="left:21.456em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">PAYMENT PLAN &nbsp;</span></div>
          <div class="pdf44_01" style="left:26.496em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">METHOD OF PAYMENT</span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:1.4545em;">&nbsp;</span><span class="pdf44_10 pdf44_11 pdf44_12">AUDIT &nbsp;</span></div>
          <div class="pdf44_01" style="left:36.114em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09">DEPOSIT &nbsp;</span></div>
          <div class="pdf44_01" style="left:44.7959em;top:37.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">POLICY PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.094em;top:38.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:39.894em;top:38.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:44.694em;top:38.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:1.794em;top:40.1651em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">APPLICANT INFORMATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7942em;top:41.2446em;"><span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">NAME (First Named Insured) AND MAILING ADDRESS (including ZIP+4) </span> <br> <div class="avee1"> ${data.companyName} </div> <br> <div class="avee2"> ${data.applicantAddress} </div> <br> <div class="avee3">${data.applicantCity}, ${data.applicantState} ${data.applicantZip}</div>&nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:41.2146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">GL CODE &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.794em;top:41.2146em;"><span class="pdf44_10 pdf44_11 pdf44_16">SIC &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:41.2146em;"><span class="pdf44_10 pdf44_11 pdf44_12">NAICS &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:48.2166em;"><span class="pdf44_10 pdf44_11 pdf44_12">NAICS &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:55.2126em;"><span class="pdf44_10 pdf44_11 pdf44_12">NAICS &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.794em;top:41.2146em;"><span class="pdf44_10 pdf44_11 pdf44_16" style="word-spacing:-0.0002em;">FEIN OR SOC SEC # &nbsp;</span> <span class="avee22"> ${data.fein} </span> </div>
          <div class="pdf44_01" style="left:43.794em;top:48.2166em;"><span class="pdf44_10 pdf44_11 pdf44_16" style="word-spacing:-0.0002em;">FEIN OR SOC SEC # &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.794em;top:55.2126em;"><span class="pdf44_10 pdf44_11 pdf44_16" style="word-spacing:-0.0002em;">FEIN OR SOC SEC # &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:43.2126em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0003em;">BUSINESS PHONE #: &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:44.2146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">WEBSITE ADDRESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:46.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09">CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:47.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09">INDIVIDUAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:46.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">JOINT VENTURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:46.9006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">NO. OF MEMBERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:47.3986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AND MANAGERS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:46.1986em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0001em;">NOT FOR PROFIT ORG &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:47.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09">PARTNERSHIP &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:46.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">SUBCHAPTER "S" CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:47.2006em;"><span class="pdf44_15 pdf44_08 pdf44_19">LLC &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:47.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09">TRUST &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:48.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">GL CODE &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.794em;top:48.2166em;"><span class="pdf44_10 pdf44_11 pdf44_16">SIC &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7942em;top:48.2466em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">NAME (Other Named Insured) AND MAILING ADDRESS (including ZIP+4) &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:50.2146em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0003em;">BUSINESS PHONE #: &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:51.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">WEBSITE ADDRESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:53.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09">CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:54.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09">INDIVIDUAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:53.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">JOINT VENTURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:53.8966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">NO. OF MEMBERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:54.4006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AND MANAGERS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:53.2006em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0001em;">NOT FOR PROFIT ORG &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:54.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09">PARTNERSHIP &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:53.2006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">SUBCHAPTER "S" CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:54.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09">TRUST &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:54.1966em;"><span class="pdf44_15 pdf44_08 pdf44_19">LLC &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:55.2126em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">GL CODE &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.794em;top:55.2126em;"><span class="pdf44_10 pdf44_11 pdf44_16">SIC &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7942em;top:55.2426em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">NAME (Other Named Insured) AND MAILING ADDRESS (including ZIP+4) &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:57.2166em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0003em;">BUSINESS PHONE #: &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:58.2126em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">WEBSITE ADDRESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:60.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09">CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:61.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09">INDIVIDUAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:60.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">JOINT VENTURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:60.8986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">NO. OF MEMBERS &nbsp;</span></div>
          <div class="pdf44_01" style="left:10.794em;top:61.3966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AND MANAGERS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:60.1966em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0001em;">NOT FOR PROFIT ORG &nbsp;</span></div>
          <div class="pdf44_01" style="left:20.094em;top:61.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09">PARTNERSHIP &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:60.1966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">SUBCHAPTER "S" CORPORATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.194em;top:61.1986em;"><span class="pdf44_15 pdf44_08 pdf44_09">TRUST &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.294em;top:61.1986em;"><span class="pdf44_15 pdf44_08 pdf44_19">LLC &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:62.1011em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0002em;">ACORD 125 (2009/08) &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.6466em;top:62.1017em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">Page 1 of 4 &nbsp;</span></div>
          <div class="pdf44_01" style="left:30.0068em;top:62.1017em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0002em;">© 1993-2009 ACORD CORPORATION.</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.2784em;">&nbsp;</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">All rights reserved. &nbsp;</span></div>
          <div class="pdf44_01" style="left:15.5763em;top:63.1034em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">The ACORD name and logo are registered marks of ACORD &nbsp;</span></div>
          <div class="pdf44_01 pdf44_20" style="left:45.2297em;top:64.4731em;"><span class="pdf44_21 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">Clear All &nbsp;</span></div>
        </div>
      </div>
    </div>
  </div>
`;

}
export function generateAcord125Page2(data: BuildersRiskPacketData): string {

  return ` 
  <div class="page page2-isc">
    <div id="page_1" class="pdf44_ pdf44_02">
      <div class="pdf44_03">
        <img src="data:image/png;base64,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AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==" alt="" class="pdf44_22" />
      </div>
      <div class="pdf44_view">
    
        <div class="pdf44_05 pdf44_06">
          <div class="pdf44_01" style="left:26.268em;top:2.2112em;"><span> <span class="pdf44_14 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AGENCY CUSTOMER ID: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> <span class="avee22"> ${data.submissionNumber} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">CONTACT TYPE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:2.6651em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">CONTACT INFORMATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">CONTACT TYPE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:4.9266em;"><span> <span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0005em;">CONTACT NAME:</span> <span class="avee22"> ${data.contactPerson}</span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:5.5086em;"><span class="pdf44_10 pdf44_11 pdf44_12">PRIMARY &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:5.9646em;"><span> <span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">PHONE # <br><br></span> <span class="avee22"> ${data.applicantPhone} </span> &nbsp;</span ></div>
          <div class="pdf44_01" style="left:25.794em;top:4.9266em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0005em;">CONTACT NAME: &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:5.5086em;"><span class="pdf44_10 pdf44_11 pdf44_12">PRIMARY &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:5.9646em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">PHONE # &nbsp;</span></div>
          <div class="pdf44_01" style="left:13.794em;top:5.5086em;"><span class="pdf44_10 pdf44_11 pdf44_12">SECONDARY &nbsp;</span></div>
          <div class="pdf44_01" style="left:13.794em;top:5.9643em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">PHONE # &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:5.5086em;"><span class="pdf44_10 pdf44_11 pdf44_12">SECONDARY &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:5.9643em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">PHONE # &nbsp;</span></div>
          <div class="pdf44_01" style="left:6.2326em;top:5.7168em;"><span class="pdf44_18 pdf44_08 pdf44_09">HOME &nbsp;</span></div>
          <div class="pdf44_01" style="left:18.2326em;top:5.7167em;"><span class="pdf44_18 pdf44_08 pdf44_09">HOME &nbsp;</span></div>
          <div class="pdf44_01" style="left:30.2326em;top:5.7167em;"><span class="pdf44_18 pdf44_08 pdf44_09">HOME &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.2326em;top:5.7167em;"><span class="pdf44_18 pdf44_08 pdf44_09">HOME &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.189em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_19">BUS &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.8136em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_09">CELL &nbsp;</span></div>
          <div class="pdf44_01" style="left:21.3756em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_19">BUS &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.9386em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_09">CELL &nbsp;</span></div>
          <div class="pdf44_01" style="left:33.1891em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_19">BUS &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.8136em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_09">CELL &nbsp;</span></div>
          <div class="pdf44_01" style="left:45.3756em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_19">BUS &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.9386em;top:5.7322em;"><span class="pdf44_18 pdf44_08 pdf44_09">CELL &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:7.9266em;"><span> <span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">PRIMARY E-MAIL ADDRESS:</span> <span class="avee22"> ${data.applicantEmail} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:8.9286em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">SECONDARY E-MAIL ADDRESS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:9.6851em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">PREMISES INFORMATION</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.278em;">&nbsp;</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">(Attach ACORD 823 for Additional Premises) &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:7.9266em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">PRIMARY E-MAIL ADDRESS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.794em;top:8.9286em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">SECONDARY E-MAIL ADDRESS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.956em;top:10.7176em;"><span class="pdf44_18 pdf44_08 pdf44_23" style="word-spacing:-0.0003em;">LOC #</span><span> <span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.2528em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09"> </span> <span class="avee22"> ${data.propertyNameAndAddress || "-"} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.194em;top:10.7176em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0em;">CITY LIMITS</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.6881em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.914em;top:10.7176em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0001em;"># FULL TIME EMPL </span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.1703em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">ANNUAL REVENUES:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="avee22"> ${data.estimatedTotalGrossReceipts} </span></span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.1893em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;"> &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.914em;top:10.7176em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0001em;"># FULL TIME EMPL <br> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="avee22">${data.numberOfFieldEmployees}</span> </span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.1703em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;"></span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.1893em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;"> &nbsp;</span></div>

      <div class="pdf44_01" style="left:37.194em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0001em;">OCCUPIED AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:11.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">INSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:11.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:12.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">TENANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:11.6986em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:12.7006em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:13.7026em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:12.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">OUTSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.968em;top:12.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0em;">BLD #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.285em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">CITY: ${data.applicantCity} &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:12.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">STATE: ${data.applicantState} &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:13.7176em;"><span class="pdf44_18 pdf44_08 pdf44_16">ZIP: ${data.applicantZip} &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.878em;top:12.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;"># PART TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.0753em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">OPEN TO PUBLIC AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:13.7176em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">TOTAL BUILDING AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.194em;top:13.7176em;"><span class="pdf44_18 pdf44_08 pdf44_09">COUNTY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:14.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">DESCRIPTION OF OPERATIONS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.956em;top:15.7156em;"><span class="pdf44_18 pdf44_08 pdf44_23" style="word-spacing:-0.0003em;">LOC #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.2528em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">STREET &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:14.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">ANY AREA LEASED TO OTHERS? Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.914em;top:15.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0001em;"># FULL TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.1703em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">ANNUAL REVENUES:</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.1893em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">$ &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.194em;top:15.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0em;">CITY LIMITS</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.6881em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:16.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09">INSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:16.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:17.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">TENANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:16.6966em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:17.6986em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:18.7006em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:16.7116em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0001em;">OCCUPIED AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.878em;top:17.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;"># PART TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.0753em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">OPEN TO PUBLIC AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:18.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">TOTAL BUILDING AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:17.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">OUTSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.968em;top:17.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0em;">BLD #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.285em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">CITY:  &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:17.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">STATE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:18.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16">ZIP: &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.194em;top:18.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">COUNTY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:19.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">DESCRIPTION OF OPERATIONS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.956em;top:20.7136em;"><span class="pdf44_18 pdf44_08 pdf44_23" style="word-spacing:-0.0003em;">LOC #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.2528em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">STREET &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:19.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">ANY AREA LEASED TO OTHERS? Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.194em;top:20.7136em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0em;">CITY LIMITS</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.6881em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.914em;top:20.7136em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0001em;"># FULL TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.1703em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">ANNUAL REVENUES:</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.1893em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">$ &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:21.7156em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0001em;">OCCUPIED AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">INSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:22.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09">TENANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:22.6966em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:23.6986em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:22.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09">OUTSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.968em;top:22.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0em;">BLD #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.285em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">CITY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:22.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">STATE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:23.7136em;"><span class="pdf44_18 pdf44_08 pdf44_16">ZIP: &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.878em;top:22.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;"># PART TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.0753em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">OPEN TO PUBLIC AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:23.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">TOTAL BUILDING AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.194em;top:23.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">COUNTY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:24.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">DESCRIPTION OF OPERATIONS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.956em;top:25.7116em;"><span class="pdf44_18 pdf44_08 pdf44_23" style="word-spacing:-0.0003em;">LOC #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.2528em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">STREET &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:24.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">ANY AREA LEASED TO OTHERS? Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.194em;top:25.7116em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0em;">CITY LIMITS</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.6881em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.914em;top:25.7116em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0001em;"># FULL TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.1703em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">ANNUAL REVENUES:</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.1893em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">$ &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:26.7136em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0001em;">OCCUPIED AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:26.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">INSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:26.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:27.294em;top:27.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">TENANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:26.6986em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:27.7006em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:47.718em;top:28.6966em;"><span class="pdf44_15 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">SQ FT &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.394em;top:27.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">OUTSIDE &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.968em;top:27.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0em;">BLD #</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.285em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09">CITY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:27.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">STATE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:16.794em;top:28.7116em;"><span class="pdf44_18 pdf44_08 pdf44_16">ZIP: &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.878em;top:27.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;"># PART TIME EMPL</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:1.0753em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">OPEN TO PUBLIC AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:28.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0004em;">TOTAL BUILDING AREA: &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.194em;top:28.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">COUNTY: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:29.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">DESCRIPTION OF OPERATIONS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.194em;top:29.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">ANY AREA LEASED TO OTHERS? Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:30.6911em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">NATURE OF BUSINESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:31.9006em;"><span class="pdf44_15 pdf44_08 pdf44_09">APARTMENTS &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.294em;top:31.5065em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">DATE BUSINESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.294em;top:32.0046em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0em;">STARTED (MM/DD/YYYY) &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.594em;top:31.9006em;"><span class="pdf44_15 pdf44_08 pdf44_09">CONTRACTOR &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.594em;top:32.8966em;"><span class="pdf44_15 pdf44_08 pdf44_16">INSTITUTIONAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:15.894em;top:31.9006em;"><span class="pdf44_15 pdf44_08 pdf44_09">MANUFACTURING &nbsp;</span></div>
          <div class="pdf44_01" style="left:15.894em;top:32.8966em;"><span class="pdf44_15 pdf44_08 pdf44_16">OFFICE &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.794em;top:31.9006em;"><span class="pdf44_15 pdf44_08 pdf44_12">RESTAURANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.794em;top:32.8966em;"><span class="pdf44_15 pdf44_08 pdf44_09">RETAIL &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.794em;top:31.9006em;"><span class="pdf44_15 pdf44_08 pdf44_09">SERVICE &nbsp;</span></div>
          <div class="pdf44_01" style="left:28.794em;top:32.8966em;"><span class="pdf44_15 pdf44_08 pdf44_09">WHOLESALE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:32.8966em;"><span class="pdf44_15 pdf44_08 pdf44_09">CONDOMINIUMS &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:33.7146em;width:47em;white-space:normal;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">DESCRIPTION OF PRIMARY OPERATIONS <br> <span class="avee22"> ${data.classCode} - ${data.descriptionOfOperations} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:19.794em;top:42.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">INSTALLATION, SERVICE OR REPAIR WORK &nbsp;</span></div>
          <div class="pdf44_01" style="left:26.166em;top:43.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">%</span></div>
          <div class="pdf44_01" style="left:33.8939em;top:42.7145em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">OFF PREMISES INSTALLATION, SERVICE OR REPAIR WORK &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.666em;top:43.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">%</span></div>
          <div class="pdf44_01" style="left:1.7941em;top:43.7166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">RETAIL STORES OR SERVICE OPERATIONS % OF TOTAL SALES: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:44.7127em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">DESCRIPTION OF OPERATIONS OF OTHER NAMED INSUREDS &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:53.1851em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">ADDITIONAL INTEREST (Not all fields apply to all scenarios - provide only the necessary data)</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.2782em;">&nbsp;</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">Attach ACORD 45 for more Additional Interests &nbsp;</span></div>
          <div class="pdf44_01" style="left:40.1579em;top:54.2639em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">INTEREST IN ITEM NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7937em;top:54.3239em;"><span class="pdf44_10 pdf44_11 pdf44_09">INTEREST &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.9938em;top:54.3239em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">NAME AND ADDRESS RANK: &nbsp;</span></div>
          <div class="pdf44_01" style="left:21.594em;top:54.3246em;"><span class="pdf44_10 pdf44_11 pdf44_09">EVIDENCE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:26.0938em;top:54.3239em;"><span class="pdf44_10 pdf44_11 pdf44_09">CERTIFICATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:31.1938em;top:54.3246em;"><span class="pdf44_10 pdf44_11 pdf44_16">POLICY &nbsp;</span></div>
          <div class="pdf44_01" style="left:34.794em;top:54.3246em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0em;">SEND BILL &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9938em;top:55.0019em;"><span class="pdf44_10 pdf44_11 pdf44_09">ADDITIONAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:55.5066em;"><span class="pdf44_10 pdf44_11 pdf44_12">INSURED &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:55.9927em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0002em;">BREACH OF &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:56.4967em;"><span class="pdf44_10 pdf44_11 pdf44_12">WARRANTY &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:57.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09">CO-OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:8.0939em;top:55.2119em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">LOSS PAYEE &nbsp;</span></div>
          <div class="pdf44_01" style="left:8.0939em;top:56.2139em;"><span class="pdf44_10 pdf44_11 pdf44_09">MORTGAGEE &nbsp;</span></div>
          <div class="pdf44_01" style="left:8.094em;top:57.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:55.2124em;"><span class="pdf44_10 pdf44_11 pdf44_09">LOCATION: &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.7938em;top:55.2124em;"><span class="pdf44_10 pdf44_11 pdf44_09">BUILDING: &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.7938em;top:56.2144em;"><span class="pdf44_10 pdf44_11 pdf44_09">BOAT: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:56.2144em;"><span class="pdf44_10 pdf44_11 pdf44_09">VEHICLE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.7941em;top:57.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09">AIRPORT: &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.7939em;top:57.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09">AIRCRAFT: &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.7939em;top:58.2122em;"><span class="pdf44_10 pdf44_11 pdf44_16">ITEM: &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9938em;top:57.9962em;"><span class="pdf44_10 pdf44_11 pdf44_16">EMPLOYEE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:58.4944em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">AS LESSOR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:58.9929em;"><span class="pdf44_10 pdf44_11 pdf44_12">LEASEBACK &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:59.4968em;"><span class="pdf44_10 pdf44_11 pdf44_09">OWNER &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.794em;top:58.0026em;"><span class="pdf44_10 pdf44_11 pdf44_16">ITEM &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.7941em;top:58.4644em;"><span class="pdf44_10 pdf44_11 pdf44_09">CLASS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:8.094em;top:58.2126em;"><span class="pdf44_10 pdf44_11 pdf44_09">REGISTRANT &nbsp;</span></div>
          <div class="pdf44_01" style="left:8.094em;top:59.2146em;"><span class="pdf44_10 pdf44_11 pdf44_09">TRUSTEE &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.7935em;top:59.214em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">ITEM DESCRIPTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:37.7939em;top:61.2126em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">FAX (A/C, No): &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9938em;top:60.2161em;"><span class="pdf44_10 pdf44_11 pdf44_09">LIENHOLDER &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.9938em;top:60.2161em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">REFERENCE / LOAN #: &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.9941em;top:61.2127em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0em;">LIEN AMOUNT: &nbsp;</span></div>
          <div class="pdf44_01" style="left:24.894em;top:60.2166em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">INTEREST END DATE: &nbsp;</span></div>
          <div class="pdf44_01" style="left:24.894em;top:61.2126em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">PHONE (A/C, No, Ext): &nbsp;</span></div>
          <div class="pdf44_01" style="left:24.8938em;top:62.2147em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">E-MAIL ADDRESS: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7938em;top:62.2147em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0em;">REASON FOR INTEREST: &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:63.1031em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0002em;">ACORD 125 (2009/08) &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.6459em;top:63.1028em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">Page 2 of 4 &nbsp;</span></div>
          <div class="pdf44_01 pdf44_24" style="left:45.2911em;top:64.3479em;"><span class="pdf44_21 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">Clear All &nbsp;</span></div>
        </div>
      </div>
    </div>
  </div>
`;

}
export function generateAcord125Page3(data: BuildersRiskPacketData): string {

  return `
  <div class="page page2-isc">
    <div id="page_2" class="pdf44_ pdf44_02">
      <div class="pdf44_03">
        <img src="data:image/png;base64,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BwAAgKQETED6AwAAQFICJiD9AQAAICkBE5D+AAAAkJSACUh/AAAASErABKQ/AAAAJCVgAtIfAAAAkhIwAekPAAAASQmYgPQHAACApARMQPoDAABAUlMBc3h42BwfHz9qmub6chs+GQwGAgYAAOjMpYDp9/tvnt4/GTYdefL4u1HA3Hhv4j3T3//THwAAAJK6FDBjdz+99f69k9sfLLv7X3xy8+TOrduff3TjtYn3TH//T38AAABIaipgCkh//09/AAAASErABKQ/AAAAJCVgAtIfAAAAkhIwAekPAAAASQmYgPQHAACApARMQPoDAABAUgImIP0BAAAgKQETkP4AAACQlIAJSH8AAABISsAEpD8AAAAkJWAC0h8AAACSEjAB6Q8AAABJCZiA9AcAAICkBExA+gMAAEBSAiYg/QEAACApAROQ/gAAAJCUgAlIfwAAAEhKwASkPwAAACQlYALSHwAAAJISMAHpDwAAAEkJmID0BwAAgKQETED6AwAAQFICJiD9AQAAICkBE5D+AAAAkJSACUh/AAAASErABKQ/AAAAJCVgAtIfAAAAkhIwAekPAAAASQmYgPQHAACApARMQPoDAABAUgImIP0BAAAgKQETkP4AAACQlIAJSH8AAABISsAEpD8AAAAkJWAC0h8AAACSEjAB6Q8AAABJCZiA9AcAAICkBExA+gMAAEBSAiYg/QEAACApAROQ/gAAAJCUgAlIfwAAAEhKwASkPwAAACQlYALSHwAAAJISMAHpDwAAAEkJmID0BwAAgKQETED6AwAAQFICJiD9AQAAICkBE5D+AAAAkJSACUh/AAAASErABKQ/AAAAJCVgAtIfAAAAkhIwAekPAAAASQmYgPQHAACApARMQPoDAABAUgImYHyA89FOzczMzMys6Mb38Kbwew57AsbMzMzMzAITMAHp/xMSAAAk5U/IAtIfAAAAkhIwAekPAAAASQmYgPQHAACApKYC5ujo6K1+v/92F7ty5crrM94z/f0//QEAACCpSwEzipc3Dg4OBnt7e82yu3b1avPgy3vNZx9/+O7Ee6a//6c/AAAAJDUZMO/s7u42W1tbw52dnW+W2dnZ2feDiwsBAwAAdGYqYPb395vt7e3Hy77wcDj8SsAAAABdEjAB6Q8AAABJCZiA9AcAAICkBExA+gMAAEBSAiYg/QEAACApAROQ/gAA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v/948+TIeffu9/u3/c8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA8NknEspnzuwIYd0AAAAASUVORK5CYIIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" alt="" class="pdf44_25" />
      </div>
      <div class="pdf44_view">
        <div class="pdf44_05 pdf44_06">
          <div style="position:absolute; left:48.2em; top:5.2em; font-weight:bold;">N</div>
          <div style="position:absolute; left:48.2em; top:8.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:11.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:14.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:17.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:21.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:24.9em;">N</div>
          <div style="position:absolute; left:48.2em; top:27.9em;">N</div>
          <div style="position:absolute; left:48.2em; top:33em;">N</div>
          <div style="position:absolute; left:48.2em; top:37.3em;">N</div>
          <div style="position:absolute; left:48.2em; top:41.8em;">N</div>
          <div style="position:absolute; left:48.2em; top:46.3em;">N</div>
          <div style="position:absolute; left:48.2em; top:49.2em;">N</div>
          <div style="position:absolute; left:48.2em; top:50.7em;">N</div>                          
          <div class="pdf44_01" style="left:26.268em;top:2.2112em;"><span> <span class="pdf44_14 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AGENCY CUSTOMER ID: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> <span class="avee22"> ${data.submissionNumber} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:2.6951em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">GENERAL INFORMATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:3.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">EXPLAIN ALL "YES" RESPONSES &nbsp;</span></div>
          <div class="pdf44_01" style="left:48.048em;top:3.7146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:4.6254em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">1a. IS THE APPLICANT A SUBSIDIARY OF ANOTHER ENTITY ? &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.294em;top:5.7136em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">PARENT COMPANY NAME &nbsp;</span></div>
          <div class="pdf44_01" style="left:30.294em;top:5.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">RELATIONSHIP DESCRIPTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.446em;top:5.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">% OWNED &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.446em;top:8.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">% OWNED &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:7.6434em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.3895em;">1b. DOES</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">THE APPLICANT HAVE ANY SUBSIDIARIES? &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.294em;top:8.7136em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0003em;">SUBSIDIARY COMPANY NAME &nbsp;</span></div>
          <div class="pdf44_01" style="left:30.294em;top:8.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">RELATIONSHIP DESCRIPTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7941em;top:10.6434em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.9453em;">2. IS</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0em;">A FORMAL SAFETY PROGRAM IN OPERATION? &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.494em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:0.0003em;">SAFETY MANUAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.494em;top:12.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0em;">SAFETY POSITION &nbsp;</span></div>
          <div class="pdf44_01" style="left:14.094em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">MONTHLY MEETINGS &nbsp;</span></div>
          <div class="pdf44_01" style="left:14.094em;top:12.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">OSHA &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7941em;top:13.6434em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.9455em;">3. ANY</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">EXPOSURE TO FLAMMABLES, EXPLOSIVES, CHEMICALS? &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:16.6364em;"><span class="pdf44_27 pdf44_08 pdf44_12" style="word-spacing:0.8885em;">4. ANY</span><span class="pdf44_27 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">&nbsp;</span><span class="pdf44_27 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">OTHER INSURANCE WITH THIS COMPANY?</span><span class="pdf44_27 pdf44_08 pdf44_09" style="word-spacing:0.278em;">&nbsp;</span><span class="pdf44_27 pdf44_08 pdf44_12" style="word-spacing:0.0005em;">(List policy numbers) &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.294em;top:17.9056em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">LINE OF BUSINESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.994em;top:17.9056em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:25.194em;top:17.9056em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">LINE OF BUSINESS &nbsp;</span></div>
          <div class="pdf44_01" style="left:34.794em;top:17.9056em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:20.5134em;"><span class="pdf44_26 pdf44_11 pdf44_19">5. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:20.556em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0305em;">ANY POLICY OR COVERAGE DECLINED, CANCELLED OR NON-RENEWED DURING THE PRIOR THREE (3) YEARS FOR ANY PREMISES OR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9945em;top:21.2263em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:-0.0081em;">OPERATIONS? </span><span class="pdf44_28 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">(Missouri Applicants - Do not answer this question) &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.494em;top:22.2136em;"><span class="pdf44_18 pdf44_08 pdf44_09">NON-PAYMENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.494em;top:23.2156em;"><span class="pdf44_18 pdf44_08 pdf44_12">NON-RENEWAL &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.094em;top:22.3146em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">AGENT NO LONGER REPRESENTS CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.094em;top:23.1836em;"><span class="pdf44_18 pdf44_08 pdf44_09">UNDERWRITING &nbsp;</span></div>
          <div class="pdf44_01" style="left:18.294em;top:23.2156em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0em;">CONDITION CORRECTED (Describe): &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:24.1434em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.9455em;">6. ANY</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">PAST LOSSES OR CLAIMS RELATING TO SEXUAL ABUSE OR MOLESTATION ALLEGATIONS, DISCRIMINATION OR NEGLIGENT HIRING? &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:27.1265em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0225em;">DURING THE LAST FIVE YEARS (TEN IN RI), HAS ANY APPLICANT BEEN INDICTED FOR OR CONVICTED OF ANY DEGREE OF THE CRIME OF FRAUD, &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9957em;top:27.7968em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">BRIBERY, ARSON OR ANY OTHER ARSON-RELATED CRIME IN CONNECTION WITH THIS OR ANY OTHER PROPERTY? &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9957em;top:28.4857em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.0202em;">(In RI, this question must be answered by any applicant for property insurance.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3184em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.0202em;">Failure to disclose the existence of an arson conviction is a misdemeanor punishable &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9963em;top:29.1559em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.0003em;">by a sentence of up to one year of imprisonment). &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:27.1434em;"><span class="pdf44_26 pdf44_11 pdf44_19">7. &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:32.0994em;"><span class="pdf44_26 pdf44_11 pdf44_19">8. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:32.1414em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">ANY UNCORRECTED FIRE AND/OR SAFETY CODE VIOLATIONS? &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.144em;top:33.1516em;"><span class="pdf44_18 pdf44_08 pdf44_12">OCCURRENCE &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.254em;top:33.7636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.456em;top:33.1516em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.404em;top:33.7636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:7.494em;top:33.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">EXPLANATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:29.394em;top:33.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:36.6234em;"><span class="pdf44_26 pdf44_11 pdf44_19">9. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:36.6414em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">HAS APPLICANT HAD A FORECLOSURE, REPOSSESSION, BANKRUPTCY OR FILED FOR BANKRUPTCY DURING THE LAST FIVE (5) YEARS? &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.144em;top:37.6516em;"><span class="pdf44_18 pdf44_08 pdf44_12">OCCURRENCE &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.254em;top:38.2636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.456em;top:37.6516em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.404em;top:38.2636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:7.494em;top:38.2156em;"><span class="pdf44_18 pdf44_08 pdf44_09">EXPLANATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:29.394em;top:38.2156em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:29.394em;top:42.7156em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:41.1414em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">HAS APPLICANT HAD A JUDGEMENT OR LIEN DURING THE LAST FIVE (5) YEARS? &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:41.1594em;"><span class="pdf44_26 pdf44_11 pdf44_19">10. &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.144em;top:42.1516em;"><span class="pdf44_18 pdf44_08 pdf44_12">OCCURRENCE &nbsp;</span></div>
          <div class="pdf44_01" style="left:4.254em;top:42.7636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:42.456em;top:42.1516em;"><span class="pdf44_18 pdf44_08 pdf44_16">RESOLUTION &nbsp;</span></div>
          <div class="pdf44_01" style="left:43.404em;top:42.7636em;"><span class="pdf44_18 pdf44_08 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:7.494em;top:42.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">EXPLANATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.836em;top:45.6534em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">11. HAS BUSINESS BEEN PLACED IN A TRUST? &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.294em;top:46.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.0003em;">NAME OF TRUST &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.836em;top:48.5634em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">12. ANY FOREIGN OPERATIONS, FOREIGN PRODUCTS DISTRIBUTED IN USA, OR US PRODUCTS SOLD/DISTRIBUTED IN FOREIGN COUNTRIES? &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.9939em;top:49.2296em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.0002em;">(If "YES", attach ACORD 815 for Liability Exposure and/or ACORD 816 for Property Exposure) &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7941em;top:50.1414em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.3895em;">13. DOES</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">APPLICANT HAVE OTHER BUSINESS VENTURES FOR WHICH COVERAGE IS NOT REQUESTED? &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:53.2112em;"><span class="pdf44_14 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">REMARKS / PROCESSING INSTRUCTIONS (Attach ACORD 101, Additional Remarks Schedule, if more space is required) &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:63.1031em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0002em;">ACORD 125 (2009/08) &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.646em;top:63.1031em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">Page 3 of 4 &nbsp;</span></div>
          <div class="pdf44_01 pdf44_20" style="left:45.3549em;top:64.4117em;"><span class="pdf44_21 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">Clear All &nbsp;</span></div>
        </div>
      </div>
    </div>
  </div>
`;

}
export function generateAcord125Page4(data: BuildersRiskPacketData): string {

  return `
  <div class="page page2-isc">
    <div id="page_3" class="pdf44_ pdf44_02">
      <div class="pdf44_03">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAzAAAAQgCAYAAAA5ebkOAAAACXBIWXMAAA7DAAAOwwHHb6hkAABGRElEQVR4nOzcQapl23Ye6F1QG2zSnRDugPvgFiQWaofB4C4Y1WSyB/laoGIqVcmCiwZFKXAhAgQhFQ5+952TZ3vH1QpMHDyXI2KN/z/z+2Bwa4c1Zqw15vifNrrdAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgF/kX7zWB6VUZf2/NwCAzQgwSvWWAAMAAAAAAAAAAAAAAAAAAAAAAACU+a+3+f9XbkoppZRSSqnr6g+3Yn98rafb7AF+eq2X1/o8/By7lvNXU/V8m58/ar/6cnvMvI8Bz6L2qfv79nJ7vH/Tz6LU/f79u1uxe4CZbuAvbo+P+i+Hn2NXzp8pCfOH/fyn22Pm/evpB2Erf357vHd/Nf0gcHsH929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf//eG3h6rQ+D9en2+Kg/Dz/HruX81VQ93+bnj9qvvtweM+9jwLOofer+vr3cHu/f9LModb9/BZgfLAu081d7lgCjJkqAURMlwKikehcBZroBP2Ga5fyZkjB/2I+fkDHBT8hIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDvy/Qn1/rg7q8Pjl/NVTPr/UU8Bxqr/pye8y8jwHPovap+/v2cnu8f9PPotT9/p3e/3+IAKMEGDVVAoyaKAFGTZQAo5JKgPkJ/IRplvNnSsL8YT9+QsYEPyEjSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkN/L5Af36tD+ry+uT81VA9v9ZTwHOoverL7THzPgY8i9qn7u/by+3x/k0/i1L3+3d6//8hAowSYNRUCTBqogQYNVECjEoqAeYn8BOmWc6fKQnzh/34CRkT/ISMJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY08PsC/fm1PqjL65PzV0P1/FpPAc+h9qovt8fM+xjwLGqfur9vL7fH+zf9LErd79/p/f+HCDBKgFFTJcCoiRJg1EQJMCqpBJifwE+YZjl/piTMH/bjJ2RM8BMyktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQwO8L9OfX+qAur0/OXw3V82s9BTyH2qu+3B4z72PAs6h96v6+vdwe79/0syh1v3+n9/8fIsAoAUZNlQCjJkqAURMlwKikEmB+Aj9hmuX8mZIwf9iPn5AxwU/ISFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT19++9geev/52q326Pj/pPw8+xazl/NVX39256/qj96j7r7u/ebwHPovYpd61Kqvu7KMD8YPmonb/aswQYNVECjJood61KqncRYKYb8BOmWc6fKQnzh/34CRkT/ISMJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY08PsC/fm1PqjL65PzV0P1/FpPAc+h9qovt8fM+xjwLGqfur9vL7fH+zf9LErd79/p/f+HCDBKgFFTJcCoiRJg1EQJMCqpBJifwE+YZjl/piTMH/bjJ2RM8BMyktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQwO8L9OfX+qAur0/OXw3V82s9BTyH2qu+3B4z72PAs6h96v6+vdwe79/0syh1v3+n9/8fIsAoAUZNlQCjJkqAURMlwKikEmB+Aj9hmuX8mZIwf9iPn5AxwU/ISFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CA78v0J9f64O6vD45fzVUz6/1FPAcaq/6cnvMvI8Bz6L2qfv79nJ7vH/Tz6LU/f6d3v9/iACjBBg1VQKMmigBRk2UAKOSSoD5CfyEaZbzZ0rC/GE/fkLGBD8hI0n9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDfy+QH9+rQ/q8vrk/NVQPb/WU8BzqL3qy+0x8z4GPIvap+7v28vt8f5NP4tS9/t3ev//IQKMEmDUVAkwaqIEGDVRAoxKKgHmJ/ATplnOnykJ84f9+AkZE/yEjCT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf//eG3j++t+p+u32+Kj/NPwcu5bzV1N1f++m54/ar+6z7v7u/RbwLGqfcteqpLq/iwLMD5aP2vmrPUuAURMlwKiJcteqpHoXAWa6AT9hmuX8mZIwf9iPn5AxwU/ISFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CA78v0J9f64O6vD45fzVUz6/1FPAcaq/6cnvMvI8Bz6L2qfv79nJ7vH/Tz6LU/f6d3v9/iACjBBg1VQKMmigBRk2UAKOSSoD5CfyEaZbzZ0rC/GE/fkLGBD8hI0n9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDfy+QH9+rQ/q8vrk/NVQPb/WU8BzqL3qy+0x8z4GPIvap+7v28vt8f5NP4tS9/t3ev//IQKMEmDUVAkwaqIEGDVRAoxKKgHmJ/ATplnOnykJ84f9+AkZE/yEjCT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNPD7Aq2UUkoppZT69TW9//+QpADz+bU+qMvrk/NXQ/X8Wk8Bz6H2qi+3x8z7GPAsap+6v28vt8f7N/0sSt3v3+n9/4ckBRg/YZrh/JmSMH/Yj5+QMcFPyEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgO/L9CfX+uDurw+OX81VM+v9RTwHGqv+nJ7zLyPAc+i9qn7+/Zye7x/08+i1P3+nd7/f4gAowQYNVUCjJooAUZNlACjkkqA+Qn8hGmW82dKwvxhP35CxgQ/ISNJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/9waev/53qn67PT7qPw0/x67l/NVU3d+76fmj9qv7rLu/e78FPIvap9y1Kqnu76IA84Plo3b+as8SYNRECTBqoty1KqneRYCZbsBPmGY5f6YkzB/24ydkTPATMpLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0MDvC7RSSimllFLq19f0/v9DkgLM59f6oC6vT85fDdXzaz0FPIfaq77cHjPvY8CzqH3q/r693B7v3/SzKHW/f6f3/x+SFGD8hGmG82dKwvxhP35CxgQ/ISNJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ38vkB/fq0P6vL65PzVUD2/1lPAc6i96svtMfM+BjyL2qfu79vL7fH+TT+LUvf7d3r//yECjBJg1FQJMGqiBBg1UQKMSioB5ifwE6ZZzp8pCfOH/fgJGRP8hIwk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjRggZ7l/JmSMH/YjwDDBAGGJPX3b0IDFuhZzp8pCfOH/QgwTBBgSFJ//yY0YIGe5fyZkjB/2I8AwwQBhiT1929CAxboWc6fKQnzh/0IMEwQYEhSf/8mNGCBnuX8mZIwf9iPAMMEAYYk9fdvQgMW6FnOnykJ84f9CDBMEGBIUn//JjTw+wL9+bU+qMvrk/NXQ/X8Wk8Bz6H2qi+3x8z7GPAsap+6v28vt8f7N/0sSt3v3+n9/4cIMEqAUVMlwKiJEmDURAkwKqkEmJ/AT5hmOX+mJMwf9uMnZEzwEzKS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9DA7wu0UkoppZRS6tfX9P7/Q5ICzOfX+qAur0/OXw3V82s9BTyH2qu+3B4z72PAs6h96v6+vdwe79/0syh1v3+n9/8fkhRg/IRphvNnSsL8YT9+QsYEPyEjSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfvwkNWKBnOX+mJMwf9iPAMEGAIUn9/ZvQgAV6lvNnSsL8YT8CDBMEGJLU378JDVigZzl/piTMH/YjwDBBgCFJ/f2b0IAFepbzZ0rC/GE/AgwTBBiS1N+/CQ1YoGc5f6YkzB/2I8AwQYAhSf39m9CABXqW82dKwvxhPwIMEwQYktTfv/cGnr/+d6p+uz0+6j8NP8eu9SPn//wLavo81HX14t9cDdR91t3fvd8CnkXtU3YdlVT3d7E6wPz9bf4QVW+93I4l9Efr97813ZNSSiml1Huup9f6ww02df8I/keCf3l5+Xev9Tcn66+/+Vt/e3v8L1MAAAC/xLcB5j+8nPdfvvlbAgwAAPBLCTAAAEANAQYAAKghwAAAADUEGAAAoIYAAwAA1BBgAACAGgIMAABQQ4ABAABqCDAAAEANAQYAAKghwAAAADW+DTD/9rX+88n6j9/8LQEGAID/pf/6Wh+U+t+s56/1x59Q97/zEtCTUkoppdR7rz/cit0Xx6fb/CGqzvrvt58TXr6t6Z6UUkqpe326Pf6Htc8Bz6LUz6z7/2j8P35B0+qffwIEAMA/+4vbI8D85fSDwE9Wv//XNwAA8AsIMLxX9ft/fQMAAL+AAMN7Vb//1zcAAPALCDC8V/X7f30DAAC/gADDe1W//9c3AADwCwgwvFf1+399AwAAv4AAw3tVv//XNwAA8AsIMLxX9ft/fQMAAL+AAMN7Vb//1zcAAPALCDC8V/X7f30DAAC/gADDe1W//9c3AADwCwgwvFf1+399AwAAv4AAw3tVv//XNwAA8AsIMLxX9ft/fQMAAL+AAMN7Vb//1zcAAPALCDC8V/X7f30DAAC/gADDe1W//9c3AADwCwgwvFf1+399Az/Z//NaH35h/cvrWgEAfoAAw3tVv//XN/CTCTAAwJ0Aw3tVv//XNwAA8AsIMLxX9ft/fQMAAL+AAMN7Vb//P7/W0+3X/mxKKaWUUqqtPt0eAeZzwLMo9TPrvv//w63Yy+3RxPRBttTHr2f2JeBZrq6nr71PP4dSarbu8+/l9piH08/SUuZnZwkwHZX6fSW/P/fn+qdbsfoGLvbnt8eZ/dX0gwz429f60/RDAOP+0+0xB//19IMUMT87+QlZh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/b++gYsJMMDuBJjzzM9OyQsoh9TvK/n9qd//6xu4mAAD7E6AOc/87JS8gHJI/b6S35/6/f/ewPNrfVBL9fHrmX0JeJar6+lr79PPoZSarfv8e7k95uH0s7SU+dlZn77+u30OeBb1dqV+X8nvz/25BJiNSoCZfw6l1GwJMOfL/Oys5AVUHZX6fSW/P/fd/x9uxe4HW53ALuYnZMDu/ITsPPOzU/JPgDikfl/J788fX+vvph/iRwgw5wgwwO4EmPPMz07JCyiH1O8r+f0RYDYjwAC7E2DOMz87JS+gHFK/r+T3R4DZjAAD7E6AOc/87JS8gHJI/b6S3x8BZjMCDLA7AeY887NT8gLKIfX7Sn5/BJjNCDDA7gSY88zPTskLKIfU7yv5/RFgNiPAALsTYM4zPzslL6AcUr+v5PdHgNmMAAPsToA5z/zslLyAckj9vpLfHwFmMwIMsDsB5jzzs1PyAsoh9ftKfn8EmM0IMMDuBJjzzM9OyQsoh9TvK/n9EWA2I8AAuxNgzjM/OyUvoBxSv6/k90eA2YwAA+xOgDnP/OyUvIBySP2+kt8fAWYzAgywOwHmPPOzU/ICyiH1+0p+fwSYzQgwwO4EmPPMz07JCyiH1O8r+f15FwHm+bU+qKX6+PXMvgQ8y9X19LX36edQSs3Wff693B7zcPpZWsr87KxPX//dPgc8i3q7Ur+v5PfnvvsLMBuVADP/HEqp2RJgzpf52VnJC6g6KvX7Sn5/3kWA8ROydX5CBuzOT8jOMz87Jf8EiEPq95X8/ryLn5AJMOsEGGB3Asx55men5AWUQ+r3lfz+CDCbEWCA3Qkw55mfnZIXUA6p31fy+yPAbEaAAXYnwJxnfnZKXkA5pH5fye+PALMZAQbYnQBznvnZKXkB5ZD6fSW/PwLMZgQYYHcCzHnmZ6fkBZRD6veV/P4IMJsRYIDdCTDnmZ+dkhdQDqnfV/L7I8BsRoABdifAnGd+dkpeQDmkfl/J748AsxkBBtidAHOe+dkpeQHlkPp9Jb8/AsxmBBhgdwLMeeZnp+QFlEPq95X8/ggwmxFggN0JMOeZn52SF1AOqd9X8vsjwGxGgAF2J8CcZ352Sl5AOaR+X8nvjwCzGQEG2J0Ac5752Sl5AeWQ+n0lvz8CzGYEGGB3Asx55men5AWUQ+r3lfz+1AeY59vjcJVSSimllFJ7VHWAuSewp9f6oJbq4+3xj/4l4FmurqevvU8/h1Jqtu7z7+X2mIfTz9JS5mdnffr67/Y54FnU25X6fSW/P/f/A0Z9gKlu4GJ+Qgbszk/IzjM/OyX/BIhD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+f2/g6bU+qKX6eHu8jF8CnuXqevra+/RzKKVm6z7/Xm6PeTj9LC1lfnbWp6//bp8DnkW9XanfV/L783wTYLYqAWb+OZRSsyXAnC/zs7OSF1B1VOr3lfz+vIsAU93AxfyEDNidn5CdZ352Sv4JEIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v3/3sDTa31QS/Xx9ngZvwQ8y9X19LX36edQSs3Wff693B7zcPpZWsr87KxPX//dPgc8i3q7Ur+v5Pfn+SbAbFUCzPxzKKVmS4A5X+ZnZyUvoOqo1O8r+f15FwGmuoGL+QkZsDs/ITvP/OyU/BMgDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+/+9gRellFJKKaXUNlUfYJ5e64Naqo+3xz/6l4BnubqevvY+/RxKqdm6z7+X22MeTj9LS5mfnfXp67/b54BnUW9X6veV/P48395BgKlu4GJ+Qgbszk/IzjM/OyX/BIhD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+f2/g6bU+qKX6eHu8jF8CnuXqevra+/RzKKVm6z7/Xm6PeTj9LC1lfnbWp6//bp8DnkW9XanfV/L783wTYLYqAWb+OZRSsyXAnC/zs7OSF1B1VOr3lfz+vIsAU93AxfyEDNidn5CdZ352Sv4JEIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v2/voGLCTDA7gSY88zPTskLKIfU7yv5/anf/+sbuJgAA+xOgDnP/OyUvIBySP2+kt+f+v3/3sDTa31QS/Xx9ngZvwQ8y9X19LX36edQSs3Wff693B7zcPpZWsr87KxPX//dPgc8i3q7Ur+v5Pfn+SbAbFUCzPxzKKVmS4A5X+ZnZyUvoOqo1O8r+f15FwGmuoGL+QkZsDs/ITvP/OyU/BMgDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+399AxcTYIDdCTDnmZ+dkhdQDqnfV/L7U7//1zdwMQEG2J0Ac5752Sl5AeWQ+n0lvz/1+/+9gRellFJKKaXUNlUfYJ5e64Naqo+3xz/6l4BnubqevvY+/RxKqdm6z7+X22MeTj9LS5mfnfXp67/b54BnUW9X6veV/P48395BgKlu4GJ+Qgbszk/IzjM/OyX/BIhD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+X9/AxQQYYHcCzHnmZ6fkBZRD6veV/P7U7//1DVxMgAF2J8CcZ352Sl5AOaR+X8nvT/3+f2/g+et/1f+6frs9XsY/BTzL1fX8tffp51BKzdZ9/t1nwW8Bz9JS5mdn7XznN1Xq95X8/tyfqzrA/P1t/hCVUkoppZRS19TTa/3hBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADAJv7+tf6olFJKKaWU2qKeXusPt2L3Jp5vP+cw7n/n5Sf9LaWUUkoppdTPr/u+/ne3YvcmflYDf/taf/pJfwsAAPj5fub+P+KfG3h5efl3r/U3J+uvv/lbAgwAAGR7VwHmP7yc91+++VsCDAAAZBNgvvlbAgwAAGQTYL75WwIMAABkE2C++VsCDAAAZBNgvvlbAgwAAGQTYL75WwIMAABkE2C++VsCDAAAZBNgvvlbAgwAAGQTYL75WwIMAABkE2C++VsCDAAAZBNgvvlbAgwAAGQTYL75WwIMAABkexcB5kUppZRSSim1TdUHmKfX+qCUUkoppZR69/V8ewcBproBAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv/+vNvB/vtbfKKXeRf3fNwBgV9sEmH//Wi9KqXdRn24AwK62CTAAAEC/+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/f/ewItSSimllFJqm/r/bsXuDTy/1gellFJKKaXUu6+X1/qnW7H6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9/l/fAAAAsKx+/69vAAAAWFa//9c3AAAALKvf/+sbAAAAltXv//UNAAAAy+r3//oGAACAZfX7f30DAADAsvr9v74BAABgWf3+X98AAACwrH7/r28AAABYVr//1zcAAAAsq9//6xsAAACW1e//9Q0AAADL6vf/+gYAAIBl9ft/fQMAAMCy+v2/vgEAAGBZ/f5f3wAAALCsfv+vbwAAAFhWv//XNwAAACyr3//rGwAAAJbV7//1DQAAAMvq9//6BgAAgGX1+399AwAAwLL6/b++AQAAYFn9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DAFTfQIGAABqmO677av61qvlbexHAwAAAAAAAAAAAAAAAAAAAAAAAAAAABTzA41MjPicEAabAAAAAElFTkSuQmCCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==" alt="" class="pdf44_29" />
      </div>
      <div class="pdf44_view">
        <div class="pdf44_05 pdf44_06">
          <div class="pdf44_01" style="left:26.268em;top:2.2112em;"><span class="pdf44_14 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">AGENCY CUSTOMER ID: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span> <span class="avee22"> ${data.submissionNumber} </span> &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.9879em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09">PROPERTY &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:2.6951em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">PRIOR CARRIER INFORMATION &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.848em;top:3.9076em;"><span class="pdf44_18 pdf44_08 pdf44_12" style="word-spacing:1.0361em;">YEAR </span><span class="pdf44_10 pdf44_11 pdf44_09">CATEGORY &nbsp;</span></div>
          <div class="pdf44_01" style="left:12.096em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">GENERAL LIABILITY &nbsp;</span></div>
          <div class="pdf44_01" style="left:22.7878em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09">AUTOMOBILE &nbsp;</span></div>
          <div class="pdf44_01" style="left:39.5939em;top:3.9246em;"><span class="pdf44_10 pdf44_11 pdf44_09">OTHER: &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:4.7026em;"><span class="pdf44_15 pdf44_08 pdf44_12">CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:5.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:6.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:9.894em;top:6.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:9.894em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:9.894em;top:16.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:9.894em;top:21.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:19.794em;top:6.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:19.794em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:19.794em;top:16.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:19.794em;top:21.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:29.694em;top:6.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:29.694em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:29.694em;top:16.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:29.694em;top:21.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:39.594em;top:6.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:3.894em;top:7.7026em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">EFFECTIVE DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:8.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">EXPIRATION DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:9.7006em;"><span class="pdf44_15 pdf44_08 pdf44_12">CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:10.7026em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:11.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:39.594em;top:11.7136em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:39.594em;top:16.7116em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:39.594em;top:21.7156em;"><span class="pdf44_18 pdf44_08 pdf44_09">$</span></div>
          <div class="pdf44_01" style="left:3.894em;top:12.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">EFFECTIVE DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:13.7026em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">EXPIRATION DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:14.6986em;"><span class="pdf44_15 pdf44_08 pdf44_12">CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:15.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:16.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:17.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">EFFECTIVE DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:18.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">EXPIRATION DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:19.6966em;"><span class="pdf44_15 pdf44_08 pdf44_12">CARRIER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:20.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0002em;">POLICY NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:21.7006em;"><span class="pdf44_15 pdf44_08 pdf44_09">PREMIUM &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:22.6966em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">EFFECTIVE DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:3.894em;top:23.6986em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:-0.0001em;">EXPIRATION DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:11.994em;top:24.6011em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">Check if none</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.8793em;">&nbsp;</span><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0.0001em;">(Attach Loss Summary for Additional Loss Information) &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:25.6554em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0.0305em;">ENTER ALL CLAIMS OR LOSSES (REGARDLESS OF FAULT AND WHETHER OR NOT INSURED) OR OCCURRENCES THAT MAY GIVE RISE TO CLAIMS &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:24.6851em;"><span class="pdf44_17 pdf44_08 pdf44_16" style="word-spacing:0.0001em;">LOSS HISTORY &nbsp;</span></div>
          <div class="pdf44_01" style="left:38.394em;top:26.2156em;"><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">TOTAL LOSSES:</span><span class="pdf44_18 pdf44_08 pdf44_09" style="word-spacing:0.2781em;">&nbsp;</span><span class="pdf44_18 pdf44_08 pdf44_16" style="word-spacing:0.0002em;">$ &nbsp;</span></div>
          <div class="pdf44_01" style="left:38.898em;top:27.9669em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">AMOUNT RESERVED &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.7965em;top:26.2299em;"><span class="pdf44_15 pdf44_08 pdf44_09" style="word-spacing:0em;">FOR THE LAST &nbsp;</span></div>
          <div class="pdf44_01" style="left:7.4655em;top:26.2299em;"><span class="pdf44_15 pdf44_08 pdf44_09">YEARS &nbsp;</span></div>
          <div class="pdf44_01" style="left:44.928em;top:27.1326em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:1.0379em;">SUBRO- CLAIM &nbsp;</span></div>
          <div class="pdf44_01" style="left:44.9339em;top:27.7147em;"><span class="pdf44_10 pdf44_11 pdf44_16" style="word-spacing:1.2515em;">GATION OPEN &nbsp;</span></div>
          <div class="pdf44_01" style="left:45.3479em;top:28.2968em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">Y / N</span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:2.3807em;">&nbsp;</span><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">Y / N &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.8138em;top:27.6729em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">DATE OF &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.124em;top:28.2551em;"><span class="pdf44_10 pdf44_11 pdf44_12">OCCURRENCE &nbsp;</span></div>
          <div class="pdf44_01" style="left:7.6861em;top:27.9666em;"><span class="pdf44_10 pdf44_11 pdf44_16">LINE &nbsp;</span></div>
          <div class="pdf44_01" style="left:26.8676em;top:27.9669em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">DATE OF CLAIM &nbsp;</span></div>
          <div class="pdf44_01" style="left:32.9038em;top:27.9669em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0004em;">AMOUNT PAID &nbsp;</span></div>
          <div class="pdf44_01" style="left:12.234em;top:28.0866em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">TYPE / DESCRIPTION OF OCCURRENCE OR CLAIM &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:38.1851em;"><span class="pdf44_17 pdf44_08 pdf44_09">SIGNATURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.994em;top:39.1806em;"><span class="pdf44_30 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">COPY OF THE NOTICE OF INFORMATION PRACTICES (PRIVACY) HAS BEEN GIVEN TO THE APPLICANT. (Not applicable in all states, consult your agent or broker for your state's requirements.) &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:40.2158em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3519em;">NOTICE OF INSURANCE INFORMATION PRACTICES - PERSONAL INFORMATION ABOUT YOU MAY BE COLLECTED FROM PERSONS OTHER THAN YOU IN &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:40.886em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2339em;">CONNECTION WITH THIS APPLICATION FOR INSURANCE AND SUBSEQUENT POLICY RENEWALS.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.7473em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2349em;">SUCH INFORMATION AS WELL AS OTHER PERSONAL AND &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:41.5563em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3333em;">PRIVILEGED INFORMATION COLLECTED BY US OR OUR AGENTS MAY IN CERTAIN CIRCUMSTANCES BE DISCLOSED TO THIRD PARTIES WITHOUT YOUR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:42.2265em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3902em;">AUTHORIZATION. YOU</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.059em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0584em;">HAVE THE RIGHT TO REVIEW YOUR PERSONAL INFORMATION IN OUR FILES AND CAN REQUEST CORRECTION OF ANY INACCURACIES.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3913em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0584em;">A &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:42.8968em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0378em;">MORE DETAILED DESCRIPTION OF YOUR RIGHTS AND OUR PRACTICES REGARDING SUCH INFORMATION IS AVAILABLE UPON REQUEST.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3553em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0387em;">CONTACT YOUR AGENT &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:43.567em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">OR BROKER FOR INSTRUCTIONS ON HOW TO SUBMIT A REQUEST TO US. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:44.888em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0979em;">ANY PERSON WHO KNOWINGLY AND WITH INTENT TO DEFRAUD ANY INSURANCE COMPANY OR ANOTHER PERSON FILES AN APPLICATION FOR INSURANCE OR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:45.5583em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0629em;">STATEMENT OF CLAIM CONTAINING ANY MATERIALLY FALSE INFORMATION, OR CONCEALS FOR THE PURPOSE OF MISLEADING INFORMATION CONCERNING ANY &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0934em;top:46.2285em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0166em;">FACT MATERIAL THERETO, COMMITS A FRAUDULENT INSURANCE ACT, WHICH IS A CRIME AND SUBJECTS THE PERSON TO CRIMINAL AND [NY: SUBSTANTIAL] CIVIL &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0923em;top:46.8988em;"><span class="pdf44_26 pdf44_11 pdf44_12" style="word-spacing:0.0004em;">PENALTIES. (Not applicable in CO, FL, HI, MA, NE, OH, OK, OR, VT or WA; in DC, LA, ME, TN and VA, insurance benefits may also be denied) &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:48.0574em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0304em;">IN THE DISTRICT OF COLUMBIA, WARNING:</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.3383em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0306em;">IT IS A CRIME TO PROVIDE FALSE OR MISLEADING INFORMATION TO AN INSURER FOR THE PURPOSE OF DEFRAUDING &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0957em;top:48.7277em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">THE INSURER OR ANY OTHER PERSON.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2784em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">PENALTIES INCLUDE IMPRISONMENT AND/OR FINES. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:49.8063em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2834em;">IN FLORIDA, ANY PERSON WHO KNOWINGLY AND WITH INTENT TO INJURE, DEFRAUD, OR DECEIVE ANY INSURER FILES A STATEMENT OF CLAIM OR AN &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0928em;top:50.4765em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">APPLICATION CONTAINING ANY FALSE, INCOMPLETE, OR MISLEADING INFORMATION IS GUILTY OF A FELONY OF THE THIRD DEGREE. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0928em;top:51.7581em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2323em;">IN MASSACHUSETTS, NEBRASKA, OREGON AND VERMONT, ANY PERSON WHO KNOWINGLY AND WITH INTENT TO DEFRAUD ANY INSURANCE COMPANY OR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0928em;top:52.4283em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0963em;">ANOTHER PERSON FILES AN APPLICATION FOR INSURANCE OR STATEMENT OF CLAIM CONTAINING ANY MATERIALLY FALSE INFORMATION, OR CONCEALS FOR &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0934em;top:53.0986em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0976em;">THE PURPOSE OF MISLEADING INFORMATION CONCERNING ANY FACT MATERIAL THERETO, COMMITS A FRAUDULENT INSURANCE ACT, WHICH IS A CRIME AND &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:53.7688em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0001em;">MAY SUBJECT THE PERSON TO CRIMINAL AND CIVIL PENALTIES. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:55.0563em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0005em;">IN WASHINGTON, IT IS A CRIME TO KNOWINGLY PROVIDE FALSE, INCOMPLETE, OR MISLEADING INFORMATION TO AN INSURANCE COMPANY FOR THE PURPOSE OF &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:55.7265em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">DEFRAUDING THE COMPANY.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.2784em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">PENALTIES INCLUDE IMPRISONMENT, FINES, AND DENIAL OF INSURANCE BENEFITS. &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:56.7222em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.0884em;">THE UNDERSIGNED IS AN AUTHORIZED REPRESENTATIVE OF THE APPLICANT AND REPRESENTS THAT REASONABLE ENQUIRY HAS BEEN MADE TO OBTAIN THE &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.0946em;top:57.3924em;"><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.1275em;">ANSWERS TO QUESTIONS ON THIS APPLICATION.</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.5313em;">&nbsp;</span><span class="pdf44_26 pdf44_11 pdf44_09" style="word-spacing:0.128em;">HE/SHE REPRESENTS THAT THE ANSWERS ARE TRUE, CORRECT AND COMPLETE TO THE BEST OF HIS/HER &nbsp;</span></div>
          <div class="pdf44_01" style="left:2.094em;top:58.0627em;"><span class="pdf44_26 pdf44_11 pdf44_09">KNOWLEDGE. &nbsp;</span></div>
          <div class="pdf44_01" style="left:41.394em;top:59.0046em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">STATE PRODUCER LICENSE NO &nbsp;</span></div>
          <div class="pdf44_01" style="left:41.394em;top:59.4666em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0003em;">(Required in Florida) &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:59.2146em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">PRODUCER'S SIGNATURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:21.594em;top:59.2446em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">PRODUCER'S NAME (Please Print) <br> ${data.agentName} &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:61.1046em;"><span class="pdf44_10 pdf44_11 pdf44_09" style="word-spacing:0.0002em;">APPLICANT'S SIGNATURE &nbsp;</span></div>
          <div class="pdf44_01" style="left:35.394em;top:61.1046em;"><span class="pdf44_10 pdf44_11 pdf44_12">DATE &nbsp;</span></div>
          <div class="pdf44_01" style="left:41.394em;top:61.1046em;"><span class="pdf44_10 pdf44_11 pdf44_12" style="word-spacing:0.0003em;">NATIONAL PRODUCER NUMBER &nbsp;</span></div>
          <div class="pdf44_01" style="left:1.794em;top:63.1031em;"><span class="pdf44_17 pdf44_08 pdf44_12" style="word-spacing:0.0002em;">ACORD 125 (2009/08) &nbsp;</span></div>
          <div class="pdf44_01" style="left:23.646em;top:63.1031em;"><span class="pdf44_17 pdf44_08 pdf44_09" style="word-spacing:0em;">Page 4 of 4 &nbsp;</span></div>
          <div class="pdf44_01 pdf44_31" style="left:45.0407em;top:64.5369em;"><span class="pdf44_21 pdf44_08 pdf44_12" style="word-spacing:0.0004em;">Clear All &nbsp;</span></div>
        </div>
      </div>
    </div>
  </div>
`;

}





// ─────────────────────────────────────────────────────────────────────────────
// CSS — exact copy of ManufacturersPacketPDF & ApartmentPacketPDF styles
// ─────────────────────────────────────────────────────────────────────────────
const cssContent = `
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; }

  body, html {
    margin: 0;
    padding: 0;
    font-family: 'Helvetica Neue', 'Arial', sans-serif;
    color: #000;
    line-height: 1.4;
    background: white;
  }

  .page {
    width: 8.5in;
    height: 11in;
    display: flex;
    position: relative;
    background: #fff;
    page-break-after: always;
    overflow: hidden;
    padding: 0;
  }

  .main-content {
    flex: 1;
    width: 100%;
    position: relative;
    z-index: 1;
  }

  .page2-isc .main-content-page2 {
    padding: 0.35in 0.20in;
    font-size: 9.5pt;
    line-height: 1.25;
    color: #1f2937;
    min-height: 9.2in;
    overflow: visible;
    display: flex;
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
  }

  /* ── PAGE 2-ISC HEADER: exact copy from ApartmentPacketPDF & ManufacturersPacketPDF ── */
  .page2-isc .header-top-page2 {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.2in;
    padding-bottom: 0.03in;
    flex-shrink: 0;
  }

  .page2-isc .agency-info-page2-left {
    font-size: 10pt;
    line-height: 1.5;
    color: #1f2937;
    text-align: left;
    flex: 1;
  }

  .page2-isc .logo-icon-page2-hands {
    width: 2in;
    height: auto;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;
  }

  .page2-isc .logo-icon-page2-hands svg,
  .page2-isc .logo-icon-page2-hands img {
    width: 100%;
    height: auto;
  }

  .page2-isc .agency-name-page2 {
    font-weight: 600;
    margin-bottom: 2px;
  }

  .page2-isc .app-id-quote-parallel-page2 {
    display: grid;
    grid-template-columns: 1fr 1.5fr 1.5fr;
    column-gap: 0.35in;
    margin-top: 0.05in;
    align-items: flex-start;
    margin-bottom: 0.05in;
    gap: 0.2in;
    flex-shrink: 0;
  }

  .page2-isc .application-id-large-page2 {
    margin: 0.15in 0 0.15in 0;
    font-size: 9.5pt;
    font-weight: 600;
    color: #1f2937;
    line-height: 1.25;
  }

  .page2-isc .section-title-page2 {
    font-size: 11pt;
    font-weight: 600;
    margin-bottom: 0.08in;
    color: #1f2937;
    line-height: 1.2;
  }

  .page2-isc .insured-detail-page2,
  .page2-isc .quote-detail-page2 {
    font-size: 9.5pt;
    line-height: 1.2;
    margin-bottom: 0.03in;
    color: #1f2937;
    text-align: left;
  }

  .page2-isc .date-section-page2 {
    font-size: 9.5pt;
    line-height: 1.2;
    color: #1f2937;
  }

  .invoice-field-page12 {
    font-size: 9.5pt;
    line-height: 1.2;
    margin-bottom: 0.03in;
    color: #1f2937;
  }

  /* ── BODY CONTENT: exact copy from ApartmentPacketPDF & ManufacturersPacketPDF ── */
  .section-container { margin-top: 0.1in; }
  .section-header { font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-top: 0; margin-bottom: 3px; color: #000; letter-spacing: 0.4px; }
  .section-divider { border: none; border-top: 1.5px solid #000; margin: 0 0 6px 0; padding: 0; width: 100%; }

  .flex-row { display: flex; width: 100%; margin-bottom: 6px; }
  .field-grid { display: flex; width: 100%; margin-bottom: 6px; }

  .field-item { margin-bottom: 4px; display: flex; align-items: baseline; }
  .field-label { font-weight: 600; color: #444; margin-right: 10px; font-size: 10pt; min-width: 2.8in; width: 2.8in; flex-shrink: 0; white-space: normal; line-height: 1.2; }
  .field-value { font-weight: bold; color: #000; font-size: 10.5pt; flex: 1; overflow-wrap: break-word; }

  .question-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; padding: 2px 0; }
  .question-text { flex: 1; font-weight: 500; font-size: 10pt; color: #111; padding-right: 20px; line-height: 1.4; }
  .yes-no-options { display: flex; gap: 12px; font-size: 10.5pt; min-width: 75px; justify-content: flex-end; padding-top: 2px; }
  .option { color: #aaa; }
  .option.selected { color: #000; font-weight: bold; text-decoration: underline; }
  .explanation-text { font-size: 9.5pt; color: #374151; margin-top: 2px; margin-bottom: 6px; padding-left: 12px; border-left: 2px solid #e5e7eb; line-height: 1.4; }

  .divider { border-top: 0.5px solid #e5e7eb; margin: 6px 0; }

  .sub-header-line { font-size: 9pt; font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #f3f4f6; margin-bottom: 6px; padding-bottom: 2px; margin-top: 8px; color: #6B7280; letter-spacing: 0.3px; }
  .question-block { width: 100%; }
  .sub-section { margin-left: 0.20in; border-left: 1.5px dashed #e5e7eb; padding-left: 0.15in; margin-top: 6px; margin-bottom: 8px; }
  .sub-section .field-label { min-width: calc(2.8in - 0.35in) !important; width: calc(2.8in - 0.35in) !important; }
  .sub-section .question-text { font-size: 9.5pt; color: #4B5563; }

  .signature-row { display: flex; align-items: baseline; width: 100%; height: 1.5em; }
  .signature-label { font-weight: 600; font-size: 10.5pt; color: #444; min-width: 160px; flex-shrink: 0; }
  .signature-underline { border-bottom: 1.5px solid #000; flex: 1; min-width: 100px; padding: 0 5px; font-weight: bold; font-size: 11pt; text-align: center; height: 1.3em; line-height: 1.3em; }

  .signature-grid-row { display: flex; gap: 40px; width: 100%; margin-top: 8px; margin-bottom: 20px; }
  .signature-grid-row-large { margin-top: 35px !important; margin-bottom: 40px !important; }

  .table-custom {
    width: 100%;
    border-collapse: collapse;
    margin-top: 6px;
    margin-bottom: 6px;
    font-size: 10pt;
  }
  .table-custom th {
    border: 1px solid #333;
    padding: 5px;
    background-color: #f2f2f2;
    font-weight: 600;
    text-align: center;
  }
  .table-custom td {
    border: 1px solid #333;
    padding: 5px;
    text-align: center;
  }
  
  /* pdf2html base stylesheet — fixed-layout, faithful page reproduction. */
  html, body { margin: 0; padding: 0; }
  body { background: #e8e8e8; }

  /* One page = a positioning context sized to the PDF page box (CSS px). isolation:isolate makes it a
    stacking context so each page's per-element paint-order z-indexes stay self-contained (and the fixed
    sidebars keep sitting above every page's content, form fields included). */
  .page {
    position: relative;
    isolation: isolate;
    margin: 8px auto;
    background: #fff;
    box-shadow: 0 1px 4px rgba(0, 0, 0, .3);
    overflow: hidden;
  }

  /* The text-suppressed background raster (vectors + images), behind the text. */
  .bg {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
  }

  /* Type3-only transparent overlay (Type3Mode.IMAGE): Type3 glyph shapes above the background, below text. */
  .t3o {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 0;
    user-select: none;
    -webkit-user-select: none;
    pointer-events: none;
    image-orientation: none;
  }

  /* A positioned text run. transform + font-size carry position/rotation/scale; the pooled style class
    carries font-family/size/color. Runs are emitted in logical reading order (tagged PDFs) but carry an
    inline z-index equal to their paint sequence, so visual stacking is unaffected by the DOM order. */
  .t {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    white-space: pre;
    line-height: 1;
    transform-origin: 0 0;
    display: inline-block;
  }

  /* An extracted image. Each element carries an inline z-index equal to its paint sequence (this class value
    is only a fallback), so images stack correctly over/under text and vectors no matter the DOM order. */
  .im {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    transform-origin: 0 0;
    display: block;
    /* PDF placement ignores EXIF Orientation; browsers honour it by default. Pass-through JPEGs may carry
      an Orientation tag, so pin it off to match the PDF (no-op for re-encoded images, which have no EXIF). */
    image-orientation: none;
  }

  /* An extracted vector layer (SVG). Carries an inline z-index equal to its group's paint sequence (this
    class value is only a fallback), so it layers correctly against text and images regardless of DOM order. */
  .vec {
    position: absolute;
    left: 0;
    top: 0;
    z-index: 1;
    overflow: visible;
    pointer-events: none;
  }

  /* Zero-size internal-link target anchor at a destination's exact Y; scroll lands here, not the page top. */
  .dst {
    position: absolute;
    left: 0;
    width: 0;
    height: 0;
    scroll-margin-top: 8px;
  }

  /* Zero-size holder for <clipPath> defs referenced by clipped vector paths; takes no layout space. */
  .cdefs {
    position: absolute;
    width: 0;
    height: 0;
    overflow: hidden;
  }

  /* A detected ruled table (opt-in): a real, copyable/accessible <table> sized to the grid, laid over the
    visual layer. Cells are transparent and border-less so the ruling lines and fills underneath show. */
  .tbl {
    position: absolute;
    z-index: 1000000000; /* above the paint-order content band (runs/images/vectors carry z-index = paint seq) */
    border-collapse: collapse;
    table-layout: fixed;
    margin: 0;
    color: #000;
    line-height: 1.1;
  }
  .tbl td {
    border: 0;
    padding: 1px 2px;
    overflow: hidden;
    vertical-align: middle;
    text-align: left;
    white-space: normal;
    word-break: break-word;
  }

  /* Interactive link boxes and form controls, above the text/image/table layer (which uses a paint-order
    z-index band). Kept below the fixed sidebars (z-index:10 in the root context; each .page isolates its
    own high z-indexes). */
  .lnk {
    position: absolute;
    z-index: 2000000000;
    display: block;
  }

  .fld {
    position: absolute;
    z-index: 2000000000;
    box-sizing: border-box;
    font-size: 12px;
    margin: 0;
  }

  /* Collapsible navigation sidebars (opt-in): outline (bookmarks) on the left, thumbnails on the right.
    Both are fixed, scroll independently, sit above the pages and are hidden when printing. */
  .toc, .thumbs {
    position: fixed;
    top: 0;
    bottom: 0;
    z-index: 10;
    background: rgba(250, 250, 250, .97);
    box-shadow: 0 0 6px rgba(0, 0, 0, .25);
    overflow: auto;
    font-family: sans-serif;
    font-size: 13px;
    -webkit-user-select: none;
    user-select: none;
  }
  .toc {
    left: 0;
    width: 250px;
  }
  .thumbs {
    right: 0;
    width: 172px;
  }
  .toc summary, .thumbs summary {
    cursor: pointer;
    padding: 8px 10px;
    font-weight: bold;
    position: sticky;
    top: 0;
    background: inherit;
    border-bottom: 1px solid #ddd;
  }
  .toc ul {
    list-style: none;
    margin: 0;
    padding-left: 12px;
  }
  .toc li {
    margin: 1px 0;
  }
  .toc a, .toc span {
    display: block;
    padding: 2px 6px;
    text-decoration: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .toc a {
    color: #06c;
  }
  .toc a:hover {
    text-decoration: underline;
    background: #eef4ff;
  }
  .toc span {
    color: #333;
  }
  .thumbs ol {
    list-style: none;
    margin: 0;
    padding: 8px;
  }
  .thumbs li {
    margin: 0 0 10px;
    text-align: center;
  }
  .thumbs a {
    text-decoration: none;
    color: #666;
    font-size: 11px;
  }
  .thumbs img {
    display: block;
    width: 140px;
    height: auto;
    margin: 0 auto 2px;
    border: 1px solid #bbb;
    background: #fff;
  }
  .thumbs a:hover img {
    border-color: #06c;
    box-shadow: 0 0 0 2px #cfe0ff;
  }

  /* Print / PDF round-trip: one source page per printed page, no chrome margins or shadow.
    The exact paper size is pinned by a generated @page rule when all pages share one size. */
  @media print {
    body { background: #fff; }
    .toc, .thumbs { display: none; }
    .page { margin: 0; box-shadow: none; break-after: page; }
    .page:last-child { break-after: auto; }
  }
  .c0{font-family:Arial, Helvetica, sans-serif;font-size:10.67px;font-weight:700;color:#000000}
  .c1{font-family:Arial, Helvetica, sans-serif;font-size:11.2px;font-weight:700;color:#000000}
  .c2{font-family:Arial, Helvetica, sans-serif;font-size:7.87px;font-weight:700;color:#000000}
  .c3{font-family:Arial, Helvetica, sans-serif;font-size:8px;font-weight:700;color:#000000}
  .c4{font-family:Arial, Helvetica, sans-serif;font-size:13.73px;font-weight:700;color:#000000}
  .c5{font-family:Arial, Helvetica, sans-serif;font-size:8px;color:#000000}
  .c6{font-family:Arial, Helvetica, sans-serif;font-size:18.67px;font-weight:700;color:#000000}
  .c7{font-family:Arial, Helvetica, sans-serif;font-size:9.33px;color:#000000}
  .c8{font-family:Arial, Helvetica, sans-serif;font-size:9.33px;color:#000000}
  @page{size:816px 1056px;margin:0}


  /* ACORD 125 CSS */
	.pdf44_ sup {
		vertical-align: baseline;
		position: relative;
		top: -0.4em;
	}
	.avee1{
		font-size: 12px;
		padding-top: 10px;
	}
	.avee2{
		font-size: 12px;
		font-weight: normal;
		padding-top: 15px;
	}
	.avee3{
		font-size: 12px;
		font-weight: normal;
		padding-top: 15px;
	}
	.avee22{
		font-size: 10.5px;
	}
	.aveen1{
		font-size: 8px;
		padding-top: 5px;
	}
	.aveen2{
		font-size: 9px;
		font-weight: normal;
		padding-top: 8px;
	}

	.pdf44_ sub {
		vertical-align: baseline;
		position: relative;
		top: 0.4em;
	}
	.pdf44_ a:link {text-decoration:none;}
	.pdf44_ a:visited {text-decoration:none;}
	@media screen and (min-device-pixel-ratio:0), (-webkit-min-device-pixel-ratio:0), (min--moz-device-pixel-ratio: 0) {.pdf44_view{ font-size:10em; transform:scale(0.1); -moz-transform:scale(0.1); -webkit-transform:scale(0.1); -moz-transform-origin:top left; -webkit-transform-origin:top left; } }
	.pdf44_layer { }.pdf44_ie { font-size: 1pt; }
	.pdf44_ie body { font-size: 12em; }
	@media print{.pdf44_view {font-size:1em; transform:scale(1);}}
	.pdf44_grlink { position:relative;width:100%;height:100%;z-index:1000000; }
	.pdf44_01 {
		position: absolute;
		white-space: nowrap;
	}
	.pdf44_02 {
		font-size: 1em;
		line-height: 0.0em;
		width: 51em;
		height: 66em;
		border-style: none;
		display: block;
		margin: 0em;
	}

	@supports(-ms-ime-align:auto) { .pdf44_02 {overflow: hidden;}}
	.pdf44_03 {
		position: relative;
	}
	.pdf44_04 {
		position: absolute;
		pointer-events: none;
		clip: rect(1.955282em,49.57467em,65.49125em,1.413333em);
		width: 100%;
	}
	.pdf44_05 {
		position: relative;
		width: 51em;
	}
	.pdf44_06 {
		height: 6.6em;
	}
	.pdf44_ie .pdf44_06 {
		height: 66em;
	}

	@font-face {
		font-family:"BCAVPQ+Arial Bold";
		src:url("data:application/octet-stream;base64,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") format("woff");
	}
	.pdf44_07 {
		font-size: 1.15em;
		font-family: "BCAVPQ+Arial Bold";
		color: #000000;
	}
	.pdf44_08 {
		line-height: 1.117188em;
	}
	.pdf44_09 {
		letter-spacing: 0em;
	}

	.pdf44_ie .pdf44_09 {
		letter-spacing: -0.0006px;
	}
	.pdf44_10 {
		font-size: 0.491667em;
		font-family: "BCAVPQ+Arial Bold";
		color: #000000;
	}
	.pdf44_11 {
		line-height: 1.117187em;
	}
	.pdf44_12 {
		letter-spacing: -0.0001em;
	}

	.pdf44_ie .pdf44_12 {
		letter-spacing: -0.0005px;
	}
	.pdf44_13 {
		font-size: 0.858333em;
		font-family: "BCAVPQ+Arial Bold";
		color: #000000;
	}
	.pdf44_14 {
		font-size: 0.666667em;
		font-family: "BCAVPQ+Arial Bold";
		color: #000000;
	}
	@font-face {
	font-family:"FFDNBT+Arial";
	src:url("data:application/octet-stream;base64,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") format("woff");
	}
	.pdf44_15 {
		font-size: 0.5em;
		font-family: "FFDNBT+Arial";
		color: #000000;
	}
	.pdf44_16 {
		letter-spacing: 0.0001em;
	}

	.pdf44_ie .pdf44_16 {
		letter-spacing: 0.0007px;
	}
.pdf44_17 {
	font-size: 0.7em;
	font-family: "BCAVPQ+Arial Bold";
	color: #000000;
}
.pdf44_18 {
	font-size: 0.5em;
	font-family: "BCAVPQ+Arial Bold";
	color: #000000;
}
.pdf44_19 {
	letter-spacing: -0.0002em;
}

.pdf44_ie .pdf44_19 {
	letter-spacing: -0.0012px;
}
.pdf44_20 {
	-o-transform: scale(1,0.9999992);
	-webkit-transform: scale(1,0.9999992);
	-moz-transform: scale(1,0.9999992);
	transform: scale(1,0.9999992);
	-o-transform-origin: top left;
	-webkit-transform-origin: top left;
	-moz-webkit-transform-origin: top left;
	-transform-origin: top left;
	-ms-transform: matrix(1,0,0,0.9999992,0,-0);
	-ms-transform-origin: top left;
}
@font-face {
	font-family:"MWDKFQ+Arial";
	src:url("data:application/octet-stream;base64,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") format("woff");
}
.pdf44_21 {
	font-size: 0.666667em;
	font-family: "MWDKFQ+Arial";
	color: #000000;
}
.pdf44_22 {
	position: absolute;
	pointer-events: none;
	clip: rect(2.940333em,49.57466em,65.36608em,1.413333em);
	width: 100%;
}
.pdf44_23 {
	letter-spacing: 0.0002em;
}

.pdf44_ie .pdf44_23 {
	letter-spacing: 0.0013px;
}
.pdf44_24 {
	-o-transform: scale(1,0.9999999);
	-webkit-transform: scale(1,0.9999999);
	-moz-transform: scale(1,0.9999999);
	transform: scale(1,0.9999999);
	-o-transform-origin: top left;
	-webkit-transform-origin: top left;
	-moz-webkit-transform-origin: top left;
	-transform-origin: top left;
	-ms-transform: matrix(1,0,0,0.9999999,0,-0);
	-ms-transform-origin: top left;
}
.pdf44_25 {
	position: absolute;
	pointer-events: none;
	clip: rect(2.940333em,49.57466em,65.42983em,1.413333em);
	width: 100%;
}
.pdf44_26 {
	font-size: 0.583333em;
	font-family: "FFDNBT+Arial";
	color: #000000;
}
.pdf44_27 {
	font-size: 0.6em;
	font-family: "FFDNBT+Arial";
	color: #000000;
}
.pdf44_28 {
	font-size: 0.583333em;
	font-family: "BCAVPQ+Arial Bold";
	color: #000000;
}
.pdf44_29 {
	position: absolute;
	pointer-events: none;
	clip: rect(2.940333em,49.57466em,65.55508em,1.413333em);
	width: 100%;
}
.pdf44_30 {
	font-size: 0.516667em;
	font-family: "FFDNBT+Arial";
	color: #000000;
}
.pdf44_31 {
	-o-transform: scale(1,1.000001);
	-webkit-transform: scale(1,1.000001);
	-moz-transform: scale(1,1.000001);
	transform: scale(1,1.000001);
	-o-transform-origin: top left;
	-webkit-transform-origin: top left;
	-moz-webkit-transform-origin: top left;
	-transform-origin: top left;
	-ms-transform: matrix(1,0,0,1.000001,0,-0);
	-ms-transform-origin: top left;
}

	/* ============================================
	   PAGE 12 - INVOICE STATEMENT (ISC FORMAT)
	   ============================================ */

	.page12-isc .invoice-section-page12 {
		margin-top: 0.06in;
		margin-bottom: 0.12in;
	}

	.page12-isc .main-content-page12 {
		padding: 0.45in 0.4in 0.35in 0.4in;
	}
	.page12-isc .extra-space {
	  margin-bottom: 0.3in;
	  margin-top: 0.5in;
	}

	/* Section Title */
	.page12-isc .invoice-section-title-page12 {
		font-size: 11pt;
		font-weight: 700;
		text-transform: uppercase;
		color: #1f2937;
		border-bottom: 1px solid #1f2937;
		padding-bottom: 0.04in;
		margin-bottom: 0.06in;
	}

	/* Rows */
	.page12-isc .invoice-row-page12 {
		display: flex;
		justify-content: space-between;
		padding: 0.025in 0;
		border-bottom: none;
	}

	.page12-isc .invoice-header-page12 {
	  margin-bottom: 0.2in;
	  font-size: 11pt;
	  display: flex;
	  justify-content: space-between;
	  align-items: flex-start;
	}

	/* Labels */
	.page12-isc .invoice-label-page12 {
		font-size: 10pt;
		color: #1f2937;
		font-weight: 400;
	}

	/* Values */
	.page12-isc .invoice-value-page12 {
		font-size: 10pt;
		font-weight: 400;
		text-align: right;
		min-width: 1.3in;
		color: #1f2937;
	}

	/* TOTAL ROW (Accounting Style) */
	.page12-isc .invoice-row-total-page12 {
		display: flex;
		justify-content: flex-end;
		gap: 0.7in;
		padding-top: 0.04in;
		margin-top: 0.06in;
	}

	.page12-isc .invoice-row-total-page12 .invoice-label-page12 {
		font-weight: 700;
		font-size: 10pt;
		text-transform: uppercase;
	}

	.page12-isc .invoice-row-total-page12 .invoice-value-page12 {
		font-weight: 800;
		font-size: 10pt;
		min-width: 1.3in;
		text-align: right;
	}

	/* Binding / Payment area */
	.page12-isc .binding-statement-page12 {
		margin-top: 0.04in;
		font-size: 9pt;
	}

	.page12-isc .signature-field-page12 {
	  margin-bottom: 0.2in;
	  margin-top: 0.5in;
	}

	.page12-isc .bottom-section {
	  margin-top: 1.5in;
	}

	/* Disclaimer */
	.page12-isc .invoice-disclaimer-page12 {
		margin-top: 0.1in;
		font-size: 8pt;
		font-style: italic;
	}

	.page12-isc .invoice-disclaimer-page12 p {
		margin: 0;
		color: #6b7280;
	}
`;

/**
 * Page: Invoice Statement - ISC Format (Page 12 style)
 */
function generateInvoicePage(data: BuildersRiskPacketData): string {
  return `
	<div class="page page12-isc" style="page-break-after: always;">
	  <div class="main-content main-content-page12">
		<div class="invoice-header-page12">
		  <div>
			<div class="invoice-field-page12">${data.companyName || data.namedInsured}</div>
			<div class="invoice-field-page12">${data.mailingAddress || ''}</div>
			<div class="invoice-field-page12">${data.mailingCity || ''}, ${data.mailingState || ''} ${data.mailingZip || ''}</div>
			<div class="invoice-field-page12">${data.applicantPhone || data.phone || ''}</div>
			<div class="invoice-field-page12">Email: ${data.applicantEmail || data.email || ''}</div>
			<div class="invoice-field-page12">${data.submissionNumber || data.applicationId}</div>
		  </div>
		  <div>
			<div class="invoice-field-page12" style="font-weight: bold; max-width: 300px;">${data.agencyName}</div>
			<div class="invoice-field-page12">${data.agencyAddress}</div>
			<div class="invoice-field-page12">${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
			<div class="invoice-field-page12">${data.agencyPhone}</div>
			<div class="invoice-field-page12">${data.agencyEmail}</div>
		  </div>
		</div>
		<div style="text-align: center;">
			<strong>Builders Risk - ${data.carrierName}</strong>
		</div>
		
		<div class="invoice-section-page12">
		  <div class="invoice-section-title-page12">TOTAL COST OF POLICY*</div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Premium</div>
			<div class="invoice-value-page12">${data.premium || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Carrier Policy Fee</div>
			<div class="invoice-value-page12">${data.carrierPolicyFee || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Sterling Insurance Services Fees</div>
			<div class="invoice-value-page12">${data.sterlingFees || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Surplus Lines Tax</div>
			<div class="invoice-value-page12">${data.surplusLinesTax || '$0.00'}</div>
		  </div>
		  ${data.stampingFee && parseFloat(data.stampingFee.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">Stamping Fee</div>
			  <div class="invoice-value-page12">${data.stampingFee}</div>
			</div>
		  ` : ''}
		  ${data.stampingFeePerFiling && parseFloat(data.stampingFeePerFiling.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">PA Flat Fee</div>
			  <div class="invoice-value-page12">${data.stampingFeePerFiling}</div>
			</div>
		  ` : ''}
		  ${data.slaServiceCharge && parseFloat(data.slaServiceCharge.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">SLSC</div>
			  <div class="invoice-value-page12">${data.slaServiceCharge}</div>
			</div>
		  ` : ''}

		  ${data.fireMarshalTax && parseFloat(data.fireMarshalTax.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">Fire Marshal Tax</div>
			  <div class="invoice-value-page12">${data.fireMarshalTax}</div>
			</div>
		  ` : ''}

		  <div class="invoice-row-total-page12">
			<div class="invoice-label-page12">TOTAL COST OF POLICY*</div>
			<div class="invoice-value-page12">${data.totalCostOfPolicy || '$0.00'}</div>
		  </div>
		</div>
		
		<div class="invoice-section-page12">
		  <div class="invoice-section-title-page12">TOTAL DEPOSIT*</div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Premium</div>
			<div class="invoice-value-page12">${data.depositPremium || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Carrier Policy Fee</div>
			<div class="invoice-value-page12">${data.depositAssociationDues || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Sterling Insurance Services Fees</div>
			<div class="invoice-value-page12">${data.depositInspectionFee || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">Surplus Lines Tax</div>
			<div class="invoice-value-page12">${data.depositStateTax || '$0.00'}</div>
		  </div>
		  ${data.depositPolicyFee && parseFloat(data.depositPolicyFee.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">Stamping Fee</div>
			  <div class="invoice-value-page12">${data.depositPolicyFee}</div>
			</div>`
      : ''}

		  ${data.depositFireMarshal && parseFloat(data.depositFireMarshal.replace(/[\$,]/g, "")) > 0 ? `
			<div class="invoice-row-page12">
			  <div class="invoice-label-page12">Fire Marshal Tax</div>
			  <div class="invoice-value-page12">${data.depositFireMarshal}</div>
			</div>`
      : ''}

		  <div class="invoice-row-total-page12">
			<div class="invoice-label-page12">TOTAL DEPOSIT*</div>
			<div class="invoice-value-page12">${data.totalDeposit || '$0.00'}</div>
		  </div>
		</div>
		
		<div class="invoice-section-page12">
		  <div class="invoice-section-title-page12">TOTAL TO RETAIN*</div>
		  <div class="invoice-row-page12">
			<div class="invoice-label-page12">10% Commission on Premium (${data.premium || '$0.00'})</div>
			<div class="invoice-value-page12">${data.totalToRetain || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-total-page12">
			<div class="invoice-label-page12">TOTAL TO RETAIN*</div>
			<div class="invoice-value-page12">${data.totalToRetain || '$0.00'}</div>
		  </div>
		</div>
		
		<div class="invoice-section-page12">
		  <div class="invoice-section-title-page12">TOTAL TO BE SENT</div>
		  <div class="invoice-row-total-page12">
			<div class="invoice-label-page12">MAKE CHECK PAYABLE FOR from agency</div>
			<div class="invoice-value-page12">${data.totalToBeSent || '$0.00'}</div>
		  </div>
		  <div class="invoice-row-total-page12">
			<div class="invoice-label-page12">MAKE CHECK PAYABLE FOR finance company</div>
			<div class="invoice-value-page12">${data.totalToFinanceCompany || '$0.00'}</div>
		  </div>
		</div>

		<div style="text-align: center; margin-top: 62px;">
			<strong style="font-size: 20px;">Sterling Insurance Services</strong>
			<p>5455 Wilshire Blvd. #1816,<br>Los Angeles, CA 90036</p>
			<p>(310) 492-2007</p>
			<p>info@SterlingInsurancePartners.com</p>
			<p>License Number: 6015632</p>
		</div>

	  </div>
	</div>
	`;
}

export function generateBuildersRiskInvoiceHTML(data: any): string {
  const packetData: BuildersRiskPacketData = (data && data.isMappedPacketData)
    ? data
    : mapBuildersRiskDataToPacketData(
      data?.payload || data,
      data?.submissionNumber || data?.applicationId || data?.submissionId || data?._id?.toString() || "Pending",
      data?.agency || {
        name: data?.agencyName,
        address: { street: data?.agencyAddress, city: data?.agencyCity, state: data?.agencyState, zip: data?.agencyZip },
        phone: data?.agencyPhone,
        email: data?.agencyEmail
      },
      data?.quote,
      data?.submission || data,
      data?.capitalCoLogoSVG
    );

  return `
		<!DOCTYPE html>
		<html>
		<head>
			<meta charset="UTF-8">
			<style>${cssContent}</style>
		</head>
		<body>
			${generateInvoicePage(packetData)}
		</body>
		</html>
	`;
}
