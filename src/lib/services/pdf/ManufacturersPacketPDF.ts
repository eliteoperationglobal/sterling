import { ManufacturersPacketData, computeDesiredCoverageDates, formatDateToUS } from "./mappers/manufacturersMapper";
import { blueAngelLogoSVG, sjjLogoSVG, patrickAriasLogoSVG, titanLogoSVG, texasLogoSVG } from "./ApartmentPacketPDF";
import {
	ApplicationPacketData,
	generateAcord125Page1,
	generateAcord125Page2,
	generateAcord125Page3,
	generateAcord125Page4,
	generateAcord126Page1,
	generateAcord126Page2,
	generateAcord126Page3,
	generateAcord126Page4,
} from "./ApplicationPacketPDF";
import { acord125And126CSS } from "./acord125And126CSS";

/**
 * Manufacturers/Distributors Supplemental Application PDF Generator
 * Styled to exactly match ApartmentPacketPDF professional format
 */

function mapManufacturersToAcordData(data: ManufacturersPacketData): ApplicationPacketData {
	const contactPerson = data.auditContact || [data.firstName, data.lastName].filter(Boolean).join(" ") || "";

	// Split desiredCoverageDates "MM/DD/YYYY - MM/DD/YYYY" if available
	let effectiveDate = data.effectiveDate || "";
	let expirationDate = "";
	if (data.desiredCoverageDates && data.desiredCoverageDates.includes(" - ")) {
		const parts = data.desiredCoverageDates.split(" - ");
		if (!effectiveDate) effectiveDate = parts[0]?.trim() || "";
		expirationDate = parts[1]?.trim() || "";
	}

	return {
		// Metadata & Tracking
		applicationId: data.applicationId || "",
		submissionNumber: data.submissionNumber || "",
		formDate: data.formDate || "",

		// Agency Information (prints on ACORD 125 Page 1 & ACORD 126 Page 1)
		agencyName: data.agencyName || "",
		agentName: data.agentName || "",
		agencyAddress: data.agencyAddress || "",
		agencyCity: data.agencyCity || "",
		agencyState: data.agencyState || "",
		agencyZip: data.agencyZip || "",
		agencyPhone: data.agencyPhone || "",
		agencyEmail: data.agencyEmail || "",

		// Applicant Information (prints on ACORD 125 Pages 1 & 2)
		companyName: data.namedInsured || "",
		applicantAddress: data.mailingAddress || "",
		applicantCity: data.mailingCity || "",
		applicantState: data.mailingState || "",
		applicantZip: data.mailingZip || "",
		applicantPhone: data.applicantPhone || data.auditPhone || "",
		applicantEmail: data.applicantEmail || data.auditEmail || "",
		contactPerson: contactPerson,

		// Coverage Dates (prints on ACORD 125 Page 1)
		effectiveDate: effectiveDate,
		expirationDate: expirationDate,
		desiredCoverageDates: data.desiredCoverageDates || computeDesiredCoverageDates(data.effectiveDate) || "",

		// Sales / Receipts (prints on ACORD 125 Page 2)
		estimatedTotalGrossReceipts: data.salesUpcoming || data.salesLast12 || "",
	} as unknown as ApplicationPacketData;
}

export function generateManufacturersPacketHTML(data: ManufacturersPacketData): string {
  const acordData = mapManufacturersToAcordData(data);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Manufacturers/Distributors Supplemental Application</title>
  <style>
${cssContent}
${acord125And126CSS}
  </style>
</head>
<body>
  ${generateApplicationPage1(data)}
  ${generateApplicationPage2(data)}
  ${generateApplicationPage3(data)}
  ${generateAcord125Page1(acordData)}
  ${generateAcord125Page2(acordData)}
  ${generateAcord125Page3(acordData)}
  ${generateAcord125Page4(acordData)}
  ${generateAcord126Page1(acordData)}
  ${generateAcord126Page2(acordData)}
  ${generateAcord126Page3(acordData)}
  ${generateAcord126Page4(acordData)}
</body>
</html>`;
}

// ── Exact same renderYesNo as ApartmentPacketPDF ─────────────────────────────
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
		${explanation && explanation !== '-' ? `<div class="explanation-text"><strong>Details:</strong> ${explanation}</div>` : ''}
	`;
}

// ── Exact same renderField as ApartmentPacketPDF ──────────────────────────────
function renderField(label: string, value: string | number | undefined, width: string = '100%'): string {
	return `
		<div class="field-item" style="width: ${width};">
			<span class="field-label">${label}:</span>
			<span class="field-value">${value || '-'}</span>
		</div>
	`;
}

// ── Signature Row (same as ApartmentPacketPDF) ────────────────────────────────
function renderSignatureRow(label: string, value: string = "", width: string = '100%'): string {
	return `
		<div class="signature-grid-row" style="width: ${width};">
			<div style="flex: 1;">
				<div class="signature-row">
					<span class="signature-label">${label}</span>
					<span class="signature-underline">${value || '&nbsp;'}</span>
				</div>
			</div>
		</div>
	`;
}

// ── Checkbox (solid square for checked) ──────────────────────────────────────
function renderCheck(checked: boolean): string {
	return `<span style="display:inline-block; width:10px; height:10px; border:1.5px solid #1f2937; background-color:${checked ? '#1f2937' : 'transparent'}; margin-right:2px; vertical-align:middle; position:relative; top:-1px;"></span>`;
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
// Toggle to comment out or re-enable "1. General Information" (set to true to re-enable)
const SHOW_GENERAL_INFO = false;

// Helper to keep complete consecutive numbering across all sections and questions
const qNum = (withGeneralInfoNum: number) => SHOW_GENERAL_INFO ? withGeneralInfoNum : withGeneralInfoNum - 1;

function generateApplicationPage1(data: ManufacturersPacketData): string {
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
					Manufacturers/Distributors Application ID: ${data.submissionNumber || data.applicationId || "Pending"}
				</div>

				<!-- 3 Column Layout -->
				<div class="app-id-quote-parallel-page2">
					<div>
						<div class="section-title-page2">Date</div>
						<div class="date-section-page2">${data.formDate && data.formDate !== '-' ? data.formDate : formatDateToUS(new Date())}</div>
					</div>
					<div>
						<div class="section-title-page2">Insured Information</div>
						<div class="insured-detail-page2"><strong>${data.namedInsured || [data.firstName, data.lastName].filter(Boolean).join(' ') || ""}</strong></div>
						${data.dba ? `<div class="insured-detail-page2">DBA: ${data.dba}</div>` : ''}
						<div class="invoice-field-page12">${data.mailingAddress ? data.mailingAddress.split(',')[0].trim() : ''}</div>
						<div class="insured-detail-page2">${data.mailingCity || ""}, ${data.mailingState || ""} ${data.mailingZip || ""}</div>
						<div class="insured-detail-page2">${data.applicantPhone || data.auditPhone || ""}</div>
						<div class="insured-detail-page2">Email: ${(data.applicantEmail || data.auditEmail || "").toLowerCase()}</div>
					</div>
					<div>
						<div class="section-title-page2">Quote Information</div>
						<div class="quote-detail-page2">Manufacturers / Distributors</div>
						<div class="quote-detail-page2">Manufacturer</div>
						<div class="quote-detail-page2">Desired Coverage Dates: ${data.desiredCoverageDates || computeDesiredCoverageDates(data.effectiveDate)}</div>
					</div>
				</div>

				<!-- 1. GENERAL INFORMATION (Commented out for now; uncomment/set SHOW_GENERAL_INFO=true later) -->
				${SHOW_GENERAL_INFO ? `
				<div class="section-container" style="margin-top: 0.1in;">
					<div class="section-header">1. General Information</div>
					<hr class="section-divider" />

					${renderField("Agency / Agent", data.agencyAgent)}
					${data.firstName || data.lastName ? `
						${renderField("First Name", data.firstName)}
						${renderField("Last Name", data.lastName)}
					` : `
						${renderField("Named Insured", data.namedInsured)}
					`}
					${data.dba ? renderField("DBA", data.dba) : ''}
					${renderField("Applicant Phone", data.applicantPhone || data.auditPhone)}
					${renderField("Applicant Email", data.applicantEmail || data.auditEmail)}

					${renderField("Effective Date", data.effectiveDate)}
				</div>
				` : ''}

				<!-- ADDRESSES -->
				<div class="section-container" ${!SHOW_GENERAL_INFO ? 'style="margin-top: 0.1in;"' : ''}>
					<div class="section-header">${SHOW_GENERAL_INFO ? '2.' : '1.'} Mailing Address</div>
					<hr class="section-divider" />
					${renderField("Street Address", data.mailingAddress)}
					${renderField("City", data.mailingCity)}
					${renderField("State", data.mailingState)}
					${renderField("Zip Code", data.mailingZip)}
				</div>

				<div class="section-container">
					<div class="section-header">${SHOW_GENERAL_INFO ? '3.' : '2.'} Premise Address (if different)</div>
					<hr class="section-divider" />
					${(data.sameAsMailing || !data.premiseAddress || (data.premiseAddress.trim().toLowerCase() === data.mailingAddress.trim().toLowerCase() && data.premiseZip.trim() === data.mailingZip.trim())) ? `
						<div class="field-item">
							<span class="field-value" style="font-weight: 500; font-style: italic; color: #444;">Same as Mailing Address</span>
						</div>
					` : `
						${renderField("Street Address", data.premiseAddress || "-")}
						${renderField("City", data.premiseCity)}
						${renderField("State", data.premiseState)}
						${renderField("Zip Code", data.premiseZip)}
					`}
				</div>

				<!-- SALES TABLE -->
				<div class="section-container">
					<div class="section-header">${SHOW_GENERAL_INFO ? '4.' : '3.'} Sales Information</div>
					<hr class="section-divider" />
					<table style="width: 100%; border-collapse: collapse; margin-top: 6px; font-size: 10pt;">
						<thead>
							<tr style="background-color: #f2f2f2; text-align: center; font-weight: 600;">
								<th style="border: 1px solid #333; padding: 5px;">Upcoming Year (est.)</th>
								<th style="border: 1px solid #333; padding: 5px;">Last 12 Months</th>
								<th style="border: 1px solid #333; padding: 5px;">One Year Prior</th>
								<th style="border: 1px solid #333; padding: 5px;">Two Years Prior</th>
								<th style="border: 1px solid #333; padding: 5px;">Three Years Prior</th>
							</tr>
						</thead>
						<tbody>
							<tr style="text-align: center;">
								<td style="border: 1px solid #333; padding: 5px; font-weight: bold;">${data.salesUpcoming || '&nbsp;'}</td>
								<td style="border: 1px solid #333; padding: 5px; font-weight: bold;">${data.salesLast12 || '&nbsp;'}</td>
								<td style="border: 1px solid #333; padding: 5px; font-weight: bold;">${data.salesOneYearPrior || '&nbsp;'}</td>
								<td style="border: 1px solid #333; padding: 5px; font-weight: bold;">${data.salesTwoYearsPrior || '&nbsp;'}</td>
								<td style="border: 1px solid #333; padding: 5px; font-weight: bold;">${data.salesThreeYearsPrior || '&nbsp;'}</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- AUDIT CONTACT -->
				<div class="section-container">
					<div class="section-header">${SHOW_GENERAL_INFO ? '5.' : '4.'} Audit / Inspection Contact</div>
					<hr class="section-divider" />
					${renderField("Contact Name", data.auditContact)}
					${renderField("Phone Number", data.auditPhone)}
					${renderField("Email", data.auditEmail)}
				</div>
			</div>
		</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 2 — Industry Questions
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage2(data: ManufacturersPacketData): string {
	const INDUSTRY_OPTIONS = [
		"Machinery / Industrial Equipment",
		"Machine Shops / Fabricated Metal Products",
		"Construction Tools & Equipment",
		"Agricultural Equipment / Parts",
		"Consumer Appliances",
		"Electronics / Electrical Products",
		"Imported Consumer Goods",
		"Furniture / Home Furnishings",
		"Clothing / Apparel / Accessories",
		"Toys / Games / Children’s Products",
		"Infant / Juvenile Products",
		"Sporting Goods / Recreational Equipment",
		"Exercise / Fitness Equipment",
		"Playground Equipment",
		"Helmets / Protective Equipment",
		"Motorcycles / Scooters / E-Bikes",
		"Food Products / Food Processing",
		"Beverage Products",
		"Nutraceuticals / Dietary Supplements",
		"Cosmetics / Beauty / Personal Care Products",
		"Class I Medical Devices",
		"Class II Medical Devices",
		"Veterinary Products / Animal Health Products",
		"Pet Food / Pet Products",
		"Chemicals / Chemical Products",
		"Paints / Coatings / Solvents / Adhesives",
		"Cannabis / Marijuana Products",
		"CBD / Hemp Products",
		"Tobacco / Smoking Products",
		"Electronic Cigarettes / Vaping Products",
		"Firearms / Ammunition",
		"Body Armor / Ballistic Products",
		"Other Consumer Products",
		"Other Commercial / Industrial Products"
	];

	const selectedIndustries = data.industries || [];
	let industriesHTML = "";
	
	if (selectedIndustries.length === 0) {
		industriesHTML = `<div style="font-size: 10pt; color: #555; font-style: italic; margin-top: 4px; margin-bottom: 8px;">None selected</div>`;
	} else {
		industriesHTML = `<ul style="margin: 6px 0 8px 0; padding-left: 24px; font-size: 10pt; line-height: 1.6; color: #111;">
			${selectedIndustries.map(ind => `<li><strong>${ind}</strong></li>`).join('')}
		</ul>`;
	}

	return `
	<div class="page page2-isc">
		<div class="main-content main-content-page2">

			<div class="section-container" style="margin-top: 0.1in;">
				<div class="section-header">${qNum(6)}. MANUFACTURING / PRODUCT TYPE</div>
				<hr class="section-divider" />
				<div style="font-size: 10pt; color: #444;">What type of products does your company manufacture, import, distribute, or sell?</div>
				${industriesHTML}
				<div style="font-style: italic; font-size: 9pt; color: #555; margin-top: 4px;">
					If any of the above are indicated, please complete the specialty Kinsale Supplemental Application for the indicated class instead of this application.
				</div>
			</div>

			<div class="section-container">
				<div class="section-header">${qNum(7)}. Excluded Products</div>
				<hr class="section-divider" />
				${renderField("Excluded subsidiary / product group", data.excludedProducts)}
				<div class="sub-section">
					<div class="question-block">
						${renderYesNo("a. Are these products covered elsewhere?", data.coveredElsewhere)}
					</div>
				</div>
			</div>

			<div class="section-container">
				<div class="section-header">Product Questions</div>
				<hr class="section-divider" />
				<div class="question-block">
					${renderYesNo(`${qNum(8)}) Are any new products to be introduced during the next year?`, data.newProducts, data.newProductsDetails)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(9)}) Can your products be identified from those of your competitors?`, data.identifiedCompetitors, data.identifiedHow)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(10)}) Do you import any products or components?`, data.importProducts)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(11)}) Does any manufacturer grant you AI Vendor status for products that you distribute?`, data.aiVendorStatus)}
				</div>
				${data.aiVendorStatus ? `
				<div class="sub-section">
					<div class="question-block">
						${renderYesNo("a. If Yes, is the manufacturer's policy from a domestic / US based carrier?", data.domesticCarrier)}
					</div>
				</div>
				` : ''}
			</div>

			<div class="section-container">
				<div class="section-header">${qNum(12)}. Installation & Service Operations</div>
				<hr class="section-divider" />
				<div class="question-block">
					${renderYesNo("Do you have any installation, service, or repair operations that occur off of your premise(s)?", data.offPremiseOps)}
				</div>
				${data.offPremiseOps ? `
				<div class="sub-section">
					${data.offPremiseClarify ? renderField("a. If yes, please clarify", data.offPremiseClarify) : ''}
					<div class="question-block">
						${renderYesNo("b. Do you hire subcontractors to perform any work on your behalf?", data.hireSubcontractors)}
					</div>
					<div class="question-block">
						${renderYesNo("c. Do you collect certificates of insurance from all subcontractors prior to the beginning of work?", data.collectCoi)}
					</div>
					<div class="question-block">
						${renderYesNo("d. Do you have any work performed in condominiums, apartment to condo conversions, townhouses, or tract housing?", data.condoTownhouseWork)}
					</div>
				</div>
				` : ''}
			</div>

			<div class="section-container">
				<div class="section-header">Additional Product Questions</div>
				<hr class="section-divider" />
				<div class="question-block">
					${renderYesNo(`${qNum(13)}) Do you have any discontinued products?`, data.discontinuedProducts, data.discontinuedReason)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(14)}) Do you rent any equipment?`, data.rentEquipment)}
				</div>
				${data.rentEquipment ? `
				<div class="sub-section">
					<div class="question-block">
						${renderYesNo("a. If Yes, are all rentals without operator?", data.withoutOperator)}
					</div>
					<div class="question-block">
						${renderYesNo("b. Do you have a rental agreement with hold harmless wording in your favor?", data.holdHarmlessAgreement)}
					</div>
				</div>
				` : ''}
				<div class="question-block">
					${renderYesNo(`${qNum(15)}) Are batch or product records, serial numbers or copies of guarantee/warranty cards maintained that would facilitate tracing whereabouts of products?`, data.tracingRecordsMaintained, data.recordsMaintainedHowLong ? 'Duration maintained: ' + data.recordsMaintainedHowLong : undefined)}
				</div>
			</div>

		</div>
	</div>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE 3 — Recall Questions + Declaration
// ─────────────────────────────────────────────────────────────────────────────
function generateApplicationPage3(data: ManufacturersPacketData): string {
	return `
	<div class="page page2-isc">
		<div class="main-content main-content-page2">

			<div class="section-container" style="margin-top: 0.1in;">
				<div class="section-header">Recall Information</div>
				<hr class="section-divider" />
				<div class="question-block">
					${renderYesNo(`${qNum(16)}) In the event that it becomes necessary to recall a product, do you have a recall plan in place?`, data.recallPlan)}
				</div>
				<div class="sub-section">
					<div class="question-block">
						${renderYesNo("a. Do you have Product Recall insurance?", data.recallInsurance)}
					</div>
					${data.recallMeansDisposal ? renderField("b. Means used for return and disposal", data.recallMeansDisposal) : ''}
				</div>

				<div class="question-block">
					${renderYesNo(`${qNum(17)}) Have you ever had a product recall event?`, data.recallEvent)}
				</div>
				${data.recallEvent ? `
				<div class="sub-section">
					${renderField("a. Date of recall(s)", data.recallDate)}

					<div class="field-item">
						<span class="field-label">b. Type:</span>
						<span class="field-value yes-no-options" style="justify-content: flex-start; gap: 15px;">
							<span class="option ${data.recallType === 'Voluntary' ? 'selected' : ''}">Voluntary</span>
							<span class="option ${data.recallType === 'Ordered' ? 'selected' : ''}">Ordered</span>
						</span>
					</div>

					${renderField("By what agency?", data.recallAgency)}

					<div class="field-item" style="align-items: flex-start;">
						<span class="field-label">c. Product(s) involved:</span>
						<span class="field-value">${data.recallProductsInvolved || '-'}</span>
					</div>

					${renderField("d. Reason for recall and how discovered", data.recallReasonDiscovery)}
					${renderField("e. What was the remedy of the problem?", data.recallRemedy)}
					${renderField("f. What percentage of recalled goods were returned/repaired?", data.recallPercentReturned)}
				</div>
				` : ''}
			</div>

			<div class="section-container">
				<div class="section-header">Claims & Compliance</div>
				<hr class="section-divider" />
				<div class="question-block">
					${renderYesNo(`${qNum(18)}) Are there any present situations that might give rise to an incident causing a product recall?`, data.presentSituationsRecall, data.presentSituationsDetails)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(19)}) Have you been cited by any regulatory agency for violations arising out of business activity involving your product?`, data.citedByAgency, data.citedAgencyDetails)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(20)}) Have you had any Product Liability claims that were or were not covered by insurance?`, data.productLiabilityClaims, data.productLiabilityExplanation)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(21)}) During the past five years, has any insurer ever canceled or non-renewed similar insurance to any applicant or has your insurance been canceled for nonpayment of premium by any insurance or finance company?`, data.canceledNonRenewed, data.canceledNonRenewedDetails)}
				</div>
				<div class="question-block">
					${renderYesNo(`${qNum(22)}) Is your company aware of any occurrences, facts, circumstances, incidents, situations, damages or accidents arising out of or related to your products that a reasonably prudent person might expect to give rise to a claim or lawsuit whether valid or not which might directly or indirectly involve the company?`, data.awareOfOccurrences, data.awareOfOccurrencesDetails)}
				</div>
			</div>

			<!-- Declaration & Signature -->
			<div class="section-container" style="margin-top: 0.25in;">
				<div class="section-header">Declaration and Signature</div>
				<hr class="section-divider" />
				<p style="font-size: 10pt; text-align: justify; margin-bottom: 0.25in; color: #333; line-height: 1.5;">
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

// ─────────────────────────────────────────────────────────────────────────────
// CSS — exact copy of ApartmentPacketPDF styles
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

	/* ── PAGE 2-ISC HEADER: exact copy from ApartmentPacketPDF ── */
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

	/* ── BODY CONTENT: exact copy from ApartmentPacketPDF ── */
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
`;
