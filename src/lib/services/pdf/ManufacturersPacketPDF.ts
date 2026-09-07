/**
 * Manufacturers Supplemental Application PDF HTML Generator
 * Matches the layout and labels of MANUFACTURERS/DISTRIBUTORS SUPPLEMENTAL APPLICATION
 */

export function generateManufacturersPacketHTML(data: any): string {
  const payload = data?.payload || data || {};
  const namedInsured = payload.namedInsured || payload.companyName || '';
  const brokerage = payload.brokerage || payload.broker || '';
  const agencyAgent = payload.agencyAgent || payload.agentName || '';
  const isRenewal = payload.isRenewal;
  const policyNumber = payload.policyNumber || '';
  const effectiveDate = payload.effectiveDate || '';
  const website = payload.website || '';

  // Carrier Info
  const carrier = payload.carrier || '';
  const limitOfInsurance = payload.limitOfInsurance || '';
  const deductible = payload.deductible || '';
  const premium = payload.premium || '';
  const offeringRenewal = payload.offeringRenewal;
  const claimsMade = payload.claimsMade;
  const retroactiveDate = payload.retroactiveDate || '';

  // Addresses
  const mailingAddress = payload.mailingAddress || payload.streetAddress || '';
  const mailingCity = payload.mailingCity || payload.city || '';
  const mailingState = payload.mailingState || payload.state || '';
  const mailingZip = payload.mailingZip || payload.zip || '';

  const premiseAddress = payload.sameAsMailing ? mailingAddress : (payload.premiseAddress || '');
  const premiseCity = payload.sameAsMailing ? mailingCity : (payload.premiseCity || '');
  const premiseState = payload.sameAsMailing ? mailingState : (payload.premiseState || '');
  const premiseZip = payload.sameAsMailing ? mailingZip : (payload.premiseZip || '');

  // Sales
  const salesUpcoming = payload.salesUpcoming || '';
  const salesLast12 = payload.salesLast12 || '';
  const salesOneYearPrior = payload.salesOneYearPrior || '';
  const salesTwoYearsPrior = payload.salesTwoYearsPrior || '';
  const salesThreeYearsPrior = payload.salesThreeYearsPrior || '';

  // Audit / Inspection
  const auditContact = payload.auditContact || '';
  const auditPhone = payload.auditPhone || payload.phone || '';
  const auditEmail = payload.auditEmail || payload.email || '';

  // Page 2 & 3 fields
  const industries: string[] = payload.industries || [];
  const excludedProducts = payload.excludedProducts || '';
  const coveredElsewhere = payload.coveredElsewhere;
  const newProducts = payload.newProducts;
  const newProductsDetails = payload.newProductsDetails || '';
  const identifiedCompetitors = payload.identifiedCompetitors;
  const identifiedHow = payload.identifiedHow || '';
  const importProducts = payload.importProducts;
  const aiVendorStatus = payload.aiVendorStatus;
  const domesticCarrier = payload.domesticCarrier;
  const offPremiseOps = payload.offPremiseOps;
  const offPremiseClarify = payload.offPremiseClarify || '';
  const hireSubcontractors = payload.hireSubcontractors;
  const collectCoi = payload.collectCoi;
  const condoTownhouseWork = payload.condoTownhouseWork;
  const discontinuedProducts = payload.discontinuedProducts;
  const discontinuedReason = payload.discontinuedReason || '';
  const rentEquipment = payload.rentEquipment;
  const withoutOperator = payload.withoutOperator;
  const holdHarmlessAgreement = payload.holdHarmlessAgreement;
  const tracingRecordsMaintained = payload.tracingRecordsMaintained;
  const recordsMaintainedHowLong = payload.recordsMaintainedHowLong || '';

  const recallPlan = payload.recallPlan;
  const recallInsurance = payload.recallInsurance;
  const recallMeansDisposal = payload.recallMeansDisposal || '';
  const recallEvent = payload.recallEvent;
  const recallDate = payload.recallDate || '';
  const recallType = payload.recallType || '';
  const recallAgency = payload.recallAgency || '';
  const recallProductsInvolved = payload.recallProductsInvolved || '';
  const recallReasonDiscovery = payload.recallReasonDiscovery || '';
  const recallRemedy = payload.recallRemedy || '';
  const recallPercentReturned = payload.recallPercentReturned || '';
  const presentSituationsRecall = payload.presentSituationsRecall;
  const presentSituationsDetails = payload.presentSituationsDetails || '';
  const citedByAgency = payload.citedByAgency;
  const citedAgencyDetails = payload.citedAgencyDetails || '';
  const productLiabilityClaims = payload.productLiabilityClaims;
  const productLiabilityExplanation = payload.productLiabilityExplanation || '';
  const canceledNonRenewed = payload.canceledNonRenewed;
  const canceledNonRenewedDetails = payload.canceledNonRenewedDetails || '';
  const awareOfOccurrences = payload.awareOfOccurrences;
  const awareOfOccurrencesDetails = payload.awareOfOccurrencesDetails || '';

  const renderYN = (val: boolean | null | undefined) => `
    Yes <span class="check-box">${val === true ? '✓' : '&nbsp;'}</span>
    No <span class="check-box">${val === false ? '✓' : '&nbsp;'}</span>
  `;

  const INDUSTRY_OPTIONS = [
    "Pharmaceutical/Nutraceutical",
    "Medical Devices",
    "Tobacco/Smoking Pipes",
    "Marijuana Cannabis",
    "CBD/Hemp Cannabis",
    "Electronic Cigarettes",
    "Aviation/Aerospace (inc'l UAS)",
    "Firearms, Ammunition, Ballistics",
    "Machine Shops",
    "Equipment Rental",
    "Amusement Devices/Inflatables",
    "Energy Sector/Offshore",
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Manufacturers/Distributors Supplemental Application</title>
  <style>
    @page {
      size: letter portrait;
      margin: 15mm 12mm;
    }
    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      line-height: 1.35;
      font-size: 10pt;
      margin: 0;
      padding: 0;
      background: #fff;
    }
    .header-title {
      text-align: center;
      font-weight: 800;
      font-size: 13pt;
      letter-spacing: 0.5px;
      margin-bottom: 3px;
      text-transform: uppercase;
    }
    .header-subtitle {
      text-align: center;
      font-weight: 700;
      font-size: 8.5pt;
      margin-bottom: 2px;
      text-transform: uppercase;
    }
    .header-instruction {
      text-align: center;
      font-weight: 700;
      font-size: 8pt;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .section-banner {
      background-color: #7A6F64;
      color: #ffffff;
      font-weight: 700;
      font-size: 9.5pt;
      padding: 5px 10px;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }
    .q-title {
      font-weight: bold;
      font-size: 9.5pt;
      margin-bottom: 4px;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      font-size: 9pt;
    }
    .info-table td, .info-table th {
      border: 1px solid #111;
      padding: 4px 6px;
      vertical-align: middle;
    }
    .table-cell-val {
      font-weight: 600;
      color: #000;
      margin-left: 4px;
    }
    .sales-table th {
      background-color: #f2f2f2;
      font-size: 8pt;
      text-align: center;
      padding: 5px 3px;
      font-weight: bold;
    }
    .sales-table td {
      height: 24px;
      text-align: center;
      font-weight: 600;
    }
    .italic-note {
      font-style: italic;
      font-size: 8pt;
      color: #333;
      margin-top: 4px;
      margin-bottom: 10px;
      line-height: 1.35;
    }
    .line-row {
      margin-bottom: 8px;
      font-size: 9pt;
    }
    .underlined-field {
      display: inline-block;
      border-bottom: 1px solid #111;
      min-width: 120px;
      padding: 0 4px;
      font-weight: 600;
    }
    .check-box {
      display: inline-block;
      width: 12px;
      height: 12px;
      border: 1px solid #111;
      text-align: center;
      line-height: 11px;
      font-size: 9px;
      font-weight: bold;
      margin-left: 3px;
      margin-right: 6px;
      vertical-align: middle;
    }
    .text-box {
      border: 1px solid #777;
      padding: 5px;
      min-height: 38px;
      background: #fafafa;
      font-size: 8.5pt;
      margin-top: 3px;
      margin-bottom: 6px;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>

  <!-- PAGE 1 -->
  <div class="header-title">MANUFACTURERS/DISTRIBUTORS SUPPLEMENTAL APPLICATION</div>
  <div class="header-subtitle">ATTACH ADDITIONAL SHEETS AS NECESSARY.</div>
  <div class="header-instruction">ANSWER ALL QUESTIONS. If not applicable, indicate N/A.</div>

  <div class="section-banner">GENERAL INFORMATION</div>

  <!-- 1) General Information Table -->
  <div style="margin-bottom: 3px; font-weight: bold; font-size: 9.5pt;">1)</div>
  <table class="info-table">
    <tr>
      <td colspan="2">
        Named Insured: <span class="table-cell-val">${namedInsured || '&nbsp;'}</span>
      </td>
    </tr>
    <tr>
      <td style="width: 50%;">
        Brokerage/Broker: <span class="table-cell-val">${brokerage || '&nbsp;'}</span>
      </td>
      <td style="width: 50%;">
        Agency/Agent: <span class="table-cell-val">${agencyAgent || '&nbsp;'}</span>
      </td>
    </tr>
    <tr>
      <td>
        Renewal? 
        Yes <span class="check-box">${isRenewal === true ? '✓' : '&nbsp;'}</span>
        No <span class="check-box">${isRenewal === false ? '✓' : '&nbsp;'}</span>
      </td>
      <td>
        Policy Number: <span class="table-cell-val">${policyNumber || '&nbsp;'}</span>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        Effective Date: <span class="table-cell-val">${effectiveDate || '&nbsp;'}</span>
      </td>
    </tr>
    <tr>
      <td colspan="2">
        Website: <span class="table-cell-val">${website || '&nbsp;'}</span>
      </td>
    </tr>
  </table>

  <!-- 2) Current Carrier Information -->
  <div class="q-title">2) Current Carrier Information:</div>
  <table class="info-table">
    <tr>
      <td colspan="3">Carrier: <span class="table-cell-val">${carrier || '&nbsp;'}</span></td>
    </tr>
    <tr>
      <td colspan="3">Limit of Insurance: <span class="table-cell-val">${limitOfInsurance || '&nbsp;'}</span></td>
    </tr>
    <tr>
      <td colspan="3">Deductible: <span class="table-cell-val">${deductible || '&nbsp;'}</span></td>
    </tr>
    <tr>
      <td colspan="3">Premium: <span class="table-cell-val">${premium || '&nbsp;'}</span></td>
    </tr>
    <tr>
      <td style="width: 33%;">
        Offering renewal? 
        Yes <span class="check-box">${offeringRenewal === true ? '✓' : '&nbsp;'}</span>
        No <span class="check-box">${offeringRenewal === false ? '✓' : '&nbsp;'}</span>
      </td>
      <td style="width: 33%;">
        Claims made? 
        Yes <span class="check-box">${claimsMade === true ? '✓' : '&nbsp;'}</span>
        No <span class="check-box">${claimsMade === false ? '✓' : '&nbsp;'}</span>
      </td>
      <td style="width: 34%;">
        Retroactive date: <span class="table-cell-val">${retroactiveDate || '&nbsp;'}</span>
      </td>
    </tr>
  </table>

  <div class="italic-note">
    <em>Please attach copies of the following:</em><br />
    a) Currently valued five year loss runs, including claim detail for all losses open or exceeding $15,000<br />
    b) Applicant's product brochure, catalog, or marketing materials if a website is not available
  </div>

  <!-- 3) Mailing Address -->
  <div class="line-row">
    <strong>3) Mailing Address:</strong> <span class="underlined-field" style="width: 78%;">${mailingAddress || '&nbsp;'}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    City: <span class="underlined-field" style="width: 30%;">${mailingCity || '&nbsp;'}</span>
    &nbsp;&nbsp;State: <span class="underlined-field" style="width: 20%;">${mailingState || '&nbsp;'}</span>
    &nbsp;&nbsp;Zip Code: <span class="underlined-field" style="width: 20%;">${mailingZip || '&nbsp;'}</span>
  </div>

  <!-- 4) Premise Address -->
  <div class="line-row" style="margin-top: 10px;">
    <strong>4) Premise Address (if different from above):</strong> <span class="underlined-field" style="width: 60%;">${premiseAddress || '&nbsp;'}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    City: <span class="underlined-field" style="width: 30%;">${premiseCity || '&nbsp;'}</span>
    &nbsp;&nbsp;State: <span class="underlined-field" style="width: 20%;">${premiseState || '&nbsp;'}</span>
    &nbsp;&nbsp;Zip Code: <span class="underlined-field" style="width: 20%;">${premiseZip || '&nbsp;'}</span>
  </div>

  <!-- 5) Sales Table -->
  <div class="line-row" style="margin-top: 10px;">
    <strong>5) Please complete the below table regarding your sales:</strong>
  </div>
  <table class="info-table sales-table">
    <thead>
      <tr>
        <th style="width: 20%;">Upcoming Year (est.):</th>
        <th style="width: 20%;">Last 12 Months:</th>
        <th style="width: 20%;">One Year Prior:</th>
        <th style="width: 20%;">Two Years Prior:</th>
        <th style="width: 20%;">Three Years Prior:</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>${salesUpcoming || '&nbsp;'}</td>
        <td>${salesLast12 || '&nbsp;'}</td>
        <td>${salesOneYearPrior || '&nbsp;'}</td>
        <td>${salesTwoYearsPrior || '&nbsp;'}</td>
        <td>${salesThreeYearsPrior || '&nbsp;'}</td>
      </tr>
    </tbody>
  </table>

  <!-- 6) Audit/Inspection contact -->
  <div class="line-row" style="margin-top: 10px;">
    <strong>6) Audit/Inspection contact:</strong> <span class="underlined-field" style="width: 72%;">${auditContact || '&nbsp;'}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    a. Phone number: <span class="underlined-field" style="width: 70%;">${auditPhone || '&nbsp;'}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    b. Email: <span class="underlined-field" style="width: 75%;">${auditEmail || '&nbsp;'}</span>
  </div>

  <!-- PAGE 2 -->
  <div class="page-break"></div>

  <!-- 7) Industries Checklist -->
  <div class="line-row" style="margin-top: 10px;">
    <strong>7) Are any of your products used in any of the following industries?</strong>
  </div>
  <table style="width: 100%; font-size: 8.5pt; margin-bottom: 6px;">
    <tr>
      ${INDUSTRY_OPTIONS.slice(0, 3).map(o => `
        <td style="width: 33%; padding: 2px 0;">
          <span class="check-box">${industries.includes(o) ? '✓' : '&nbsp;'}</span> ${o}
        </td>
      `).join('')}
    </tr>
    <tr>
      ${INDUSTRY_OPTIONS.slice(3, 6).map(o => `
        <td style="width: 33%; padding: 2px 0;">
          <span class="check-box">${industries.includes(o) ? '✓' : '&nbsp;'}</span> ${o}
        </td>
      `).join('')}
    </tr>
    <tr>
      ${INDUSTRY_OPTIONS.slice(6, 9).map(o => `
        <td style="width: 33%; padding: 2px 0;">
          <span class="check-box">${industries.includes(o) ? '✓' : '&nbsp;'}</span> ${o}
        </td>
      `).join('')}
    </tr>
    <tr>
      ${INDUSTRY_OPTIONS.slice(9, 12).map(o => `
        <td style="width: 33%; padding: 2px 0;">
          <span class="check-box">${industries.includes(o) ? '✓' : '&nbsp;'}</span> ${o}
        </td>
      `).join('')}
    </tr>
  </table>
  <div class="italic-note">
    <em>If any of the above are indicated, please complete the specialty Kinsale Supplemental Application for the indicated class instead of this application</em>
  </div>

  <!-- 8) -->
  <div class="line-row">
    <strong>8) If any subsidiary, product or product group is to be specifically excluded from coverage, please indicate:</strong>
    <span class="underlined-field" style="width: 95%; display: block; margin-top: 4px;">${excludedProducts || '&nbsp;'}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>a. Are these products covered elsewhere?</span>
    <span>${renderYN(coveredElsewhere)}</span>
  </div>

  <!-- 9) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>9) Are any new products to be introduced during the next year?</strong>
    <span>${renderYN(newProducts)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">a. If Yes, please provide details:</span>
    <div class="text-box">${newProductsDetails || '&nbsp;'}</div>
  </div>

  <!-- 10) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>10) Can your products be identified from those of your competitors?</strong>
    <span>${renderYN(identifiedCompetitors)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    a. If Yes, how? <span class="underlined-field" style="width: 75%;">${identifiedHow || '&nbsp;'}</span>
  </div>

  <!-- 11) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>11) Do you import any products or components?</strong>
    <span>${renderYN(importProducts)}</span>
  </div>

  <!-- 12) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>12) Does any manufacturer grant you AI Vendor status for products that you distribute?</strong>
    <span>${renderYN(aiVendorStatus)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>a. If Yes, is the manufacturer's policy from a domestic/ US based carrier?</span>
    <span>${renderYN(domesticCarrier)}</span>
  </div>

  <!-- 13) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>13) Do you have any installation, service, or repair operations that occur off of your premise(s)?</strong>
    <span>${renderYN(offPremiseOps)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">a. If yes, please clarify:</span>
    <div class="text-box">${offPremiseClarify || '&nbsp;'}</div>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>b. Do you hire subcontractors to perform any work on your behalf?</span>
    <span>${renderYN(hireSubcontractors)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>c. Do you collect certificates of insurance from all subcontractors prior to the beginning of work?</span>
    <span>${renderYN(collectCoi)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>d. Do you have any work performed in condominiums, apartment to condo, conversions, townhouses, or tract housing?</span>
    <span>${renderYN(condoTownhouseWork)}</span>
  </div>

  <!-- 14) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>14) Do you have any discontinued products?</strong>
    <span>${renderYN(discontinuedProducts)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">If Yes, please explain the reasons for discontinuing:</span>
    <div class="text-box">${discontinuedReason || '&nbsp;'}</div>
  </div>

  <!-- 15) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>15) Do you rent any equipment?</strong>
    <span>${renderYN(rentEquipment)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>a. If Yes, are all rentals without operator?</span>
    <span>${renderYN(withoutOperator)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>b. Do you have a rental agreement with hold harmless wording in your favor?</span>
    <span>${renderYN(holdHarmlessAgreement)}</span>
  </div>

  <!-- 16) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>16) Are batch or product records, serial numbers or copies of guarantee/warranty cards maintained that would facilitate tracing whereabouts of products?</strong>
    <span>${renderYN(tracingRecordsMaintained)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px;">
    If Yes, confirm how long these records are maintained: <span class="underlined-field" style="width: 50%;">${recordsMaintainedHowLong || '&nbsp;'}</span>
  </div>

  <!-- PAGE 3 -->
  <div class="page-break"></div>

  <!-- 17) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 10px;">
    <strong>17) In the event that it becomes necessary to recall a product, do you have a recall plan in place?</strong>
    <span>${renderYN(recallPlan)}</span>
  </div>
  <div class="line-row" style="margin-left: 20px; display: flex; justify-content: space-between;">
    <span>a. Do you have Product Recall insurance?</span>
    <span>${renderYN(recallInsurance)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">b. What means would be used to secure the return and disposal of the product?</span>
    <div class="text-box">${recallMeansDisposal || '&nbsp;'}</div>
  </div>

  <!-- 18) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>18) Have you ever had a product recall event?</strong>
    <span>${renderYN(recallEvent)}</span>
  </div>
  <div style="margin-left: 20px;">
    <div class="line-row">
      a. If yes, supply the following details: Date of recall(s): <span class="underlined-field" style="width: 40%;">${recallDate || '&nbsp;'}</span>
    </div>
    <div class="line-row">
      b. Voluntary? <span class="check-box">${recallType === 'Voluntary' ? '✓' : '&nbsp;'}</span>
      Ordered? <span class="check-box">${recallType === 'Ordered' ? '✓' : '&nbsp;'}</span>
      &nbsp;&nbsp;By what agency? <span class="underlined-field" style="width: 45%;">${recallAgency || '&nbsp;'}</span>
    </div>
    <div style="font-size: 8.5pt;">c. Product(s) involved:</div>
    <div class="text-box">${recallProductsInvolved || '&nbsp;'}</div>
    <div class="line-row">
      d. Reason for recall and how discovered: <span class="underlined-field" style="width: 60%;">${recallReasonDiscovery || '&nbsp;'}</span>
    </div>
    <div class="line-row">
      e. What was the remedy of the problem? <span class="underlined-field" style="width: 65%;">${recallRemedy || '&nbsp;'}</span>
    </div>
    <div class="line-row">
      f. What percentage of recalled goods were returned/repaired? <span class="underlined-field" style="width: 45%;">${recallPercentReturned || '&nbsp;'}</span>
    </div>
  </div>

  <!-- 19) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>19) Are there any present situations that might give rise to an incident causing a product recall?</strong>
    <span>${renderYN(presentSituationsRecall)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">If Yes, please provide details:</span>
    <div class="text-box">${presentSituationsDetails || '&nbsp;'}</div>
  </div>

  <!-- 20) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>20) Have you been cited by any regulatory agency for violations arising out of business activity involving your product?</strong>
    <span>${renderYN(citedByAgency)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">a. If yes, please provide details:</span>
    <div class="text-box">${citedAgencyDetails || '&nbsp;'}</div>
  </div>

  <!-- 21) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong>21) Have you had any Product Liability claims that were or were not covered by insurance?</strong>
    <span>${renderYN(productLiabilityClaims)}</span>
  </div>
  <div style="margin-left: 20px;">
    <span style="font-size: 8.5pt;">If yes, please attach an explanation:</span>
    <div class="text-box">${productLiabilityExplanation || '&nbsp;'}</div>
  </div>

  <!-- 22) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong style="width: 80%; display: inline-block;">
      22) During the past five years, has any insurer ever canceled or non-renewed similar insurance to any applicant or has your insurance been canceled for nonpayment of premium by any insurance or finance company? If yes, please attach details.
    </strong>
    <span>${renderYN(canceledNonRenewed)}</span>
  </div>
  <div style="margin-left: 20px;">
    <div class="text-box">${canceledNonRenewedDetails || '&nbsp;'}</div>
  </div>

  <!-- 23) -->
  <div class="line-row" style="display: flex; justify-content: space-between; margin-top: 8px;">
    <strong style="width: 80%; display: inline-block;">
      23) Is your company aware of any occurrences, facts, circumstances, incidents, situations, damages or accidents (including but not limited to allegations of faulty or defective products, product failure, product dispute bodily injury or property damage) arising out of or related to your products that a reasonably prudent person might expect to give rise to a claim or lawsuit whether valid or not which might directly or indirectly involve the company? If yes, please attach details.
    </strong>
    <span>${renderYN(awareOfOccurrences)}</span>
  </div>
  <div style="margin-left: 20px;">
    <div class="text-box">${awareOfOccurrencesDetails || '&nbsp;'}</div>
  </div>

</body>
</html>`;
}
