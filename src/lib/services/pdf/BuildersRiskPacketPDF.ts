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
            <div class="insured-detail-page2">${data.phone || ""}</div>
            <div class="insured-detail-page2">Email: ${data.email?.toLowerCase() || ""}</div>
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

          ${renderField("Named Insured", data.namedInsured)}
          ${renderField("Brokerage / Broker", data.brokerage)}
          ${renderField("Agency / Agent", data.agencyAgent)}

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
          ${renderField("Premium", data.premium)}
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
`;