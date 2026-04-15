/**
 * Apartment Buildings Application Packet PDF Generator (Professional Form Format)
 */

import { ApartmentPacketData } from './mappers/apartmentMapper';

/**
 * Format Yes/No with underlined text selections
 */
function renderYesNo(label: string, value: boolean | null | undefined, explanation?: string): string {
    const isYes = value === true;
    const isNo = value === false;
    const isNone = value === null || value === undefined;

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

/**
 * Format Standard Field (Label: Value)
 */
function renderField(label: string, value: string | number | undefined, width: string = '100%'): string {
    return `
        <div class="field-item" style="width: ${width};">
            <span class="field-label">${label}:</span>
            <span class="field-value">${value || '-'}</span>
        </div>
    `;
}

/**
 * Generate Capital & Co Logo HTML (with two hands)
 */
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
    // Fallback simple logo
	return `<svg viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:${size};height:${size};"><circle cx="50" cy="50" r="40" fill="#eee"/></svg>`;
}

const blueAngelLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 408"><text x="10" y="50" font-family="Arial" font-size="24">Blue Angel Insurance</text></svg>`;
const sjjLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1600"><text x="10" y="200" font-family="Arial" font-size="100">SJ Insurance Services</text></svg>`;
const patrickAriasLogoSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 612 408"><text x="10" y="50" font-family="Arial" font-size="24">Patrick Arias Insurance</text></svg>`;

/**
 * Page Header (Professional Form Format)
 * Used for Pages 2-7 to provide consistent context
 */
function generateHeader(pageTitle: string, data: ApartmentPacketData): string {
    return `
        <div class="header">
            <div class="header-left">
                <div class="form-id">STERLING APARTMENT FORM</div>
                <div class="program-subtitle">Apartment Buildings Program</div>
            </div>
            <div class="header-right">
                <div class="page-title">${pageTitle}</div>
                <div class="meta-row">App ID: <strong>${data.applicationId}</strong> | Date: <strong>${data.formDate}</strong></div>
            </div>
        </div>
    `;
}

/**
 * Page 1: General Application Info
 */
function generatePage1(data: ApartmentPacketData): string {
    const email = data.agencyEmail?.toLowerCase() || "";
	let selectedLogo = data.capitalCoLogoSVG;

	if (email === "max@blueangelins.com") {
		selectedLogo = blueAngelLogoSVG;
	}
	if (email === "office@sjinsuranceservices.com") {
		selectedLogo = sjjLogoSVG;
	}
	if (email === "patrick@patrickariasinsurance.com") {
		selectedLogo = patrickAriasLogoSVG;
	}

	const logoSize = email === "patrick@patrickariasinsurance.com" ? "60%" : "100%";

    return `
        <div class="page">
            <!-- Top Agency + Logo -->
			<div class="header-top-page2">
				<div class="agency-info-page2-left">
					<div class="agency-name-page2">${data.agencyName}</div>
					<div>${data.agentName}</div>
					<div>${data.agencyAddress}</div>
					<div>${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
					<div>${data.agencyPhone}</div>
					<div>Email: ${data.agencyEmail}</div>
				</div>

				<div class="logo-icon-page2-hands">
					${generateCapitalCoLogoHTML(selectedLogo, logoSize)}
				</div>
			</div>

			<!-- Application ID -->
			<div class="application-id-large-page2">
				Apartment Program Application ID: ${data.submissionNumber}
			</div>

			<!-- 3 Column Layout -->
			<div class="app-id-quote-parallel-page2">
				<!-- Date -->
				<div>
					<div class="section-title-page2">Date</div>
					<div class="date-section-page2">${data.formDate}</div>
				</div>

				<!-- Insured Information -->
				<div>
					<div class="section-title-page2">Insured Information</div>
					<div class="insured-detail-page2"><strong>${data.companyName}</strong></div>
					<div class="insured-detail-page2">${data.dba}</div>
					<div class="insured-detail-page2">${data.contactPerson}</div>
					<div class="insured-detail-page2">${data.applicantAddress}</div>
					<div class="insured-detail-page2">
						${data.applicantCity}, ${data.applicantState} ${data.applicantZip}
					</div>
					<div class="insured-detail-page2">${data.applicantPhone}</div>
					<div class="insured-detail-page2">Email: ${data.applicantEmail}</div>
				</div>

				<!-- Quote Information -->
				<div>
					<div class="section-title-page2">Quote Information</div>
					<div class="quote-detail-page2">PROPERTY</div>
					<div class="quote-detail-page2">${data.carrierName}</div>
					<div class="quote-detail-page2">${data.coverageType}</div>
					<div class="quote-detail-page2">
						Desired Coverage Dates: ${data.desiredCoverageDates}
					</div>
				</div>
			</div>
            
            <div class="section-container" style="margin-top: 20px;">
                <div class="section-header">1. APARTMENT APPLICATION</div>
                <hr class="section-divider" />
                
                <div class="flex-row">
                    ${renderField("Applicant Name", data.applicantName, "50%")}
                    ${renderField("Agent Name", data.agentName, "50%")}
                </div>
                ${renderField("Applicant Mailing Address", data.applicantMailingAddress)}
                ${renderField("Property Name and Address", data.propertyNameAndAddress)}
                <div class="flex-row">
                    ${renderField("Proposed Effective Date From", data.proposedEffectiveDateFrom, "50%")}
                    ${renderField("Proposed Effective Date To", data.proposedEffectiveDateTo, "50%")}
                </div>
                
                <div class="question-block">
                    ${renderYesNo("Bankruptcy – Within the last 5 years, were there any pending or planned bankruptcies, or judgements for unpaid taxes against you, or your majority partner?", data.bankruptcyPending)}
                </div>
            </div>

            <div class="section-container">
                <div class="section-header">2. PROPERTIES & SYSTEMS</div>
                <hr class="section-divider" />

                <div class="question-row">
                    <div class="question-text">Interest in Property:</div>
                    <div class="yes-no-options">
                        <span class="option ${data.interestInPropertyRadio === 'Owner' ? 'selected' : ''}">Owner</span>
                        <span class="option ${data.interestInPropertyRadio === 'Manager' ? 'selected' : ''}">Manager</span>
                    </div>
                </div>
                
                ${data.interestInPropertyRadio === 'Owner' ? `
                    <div class="sub-section">
                        ${renderField("Name of Property Management Firm", data.propertyManagementFirmName)}
                        ${renderYesNo("Is the Property Management Firm required to maintain Commercial General Liability Insurance with minimum $1,000,000 limits and to include you as an Additional Insured?", data.isManagementFirmInsured)}
                    </div>
                ` : ''}
                ${renderField("Year you first owned or managed the property", data.yearFirstOwnedOrManaged)}
            </div>
            
            <div class="footer">Page 1 of 7</div>
        </div>
    `;
}


/**
 * Page 2: Property Details
 */
function generatePage2(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("PROPERTY DETAILS", data)}
            
            <div class="section-container">
                <div class="section-header">3. PROPERTY DETAILS</div>
                <hr class="section-divider" />

                <div class="field-grid">
                    ${renderField("Age of Building(s)", data.buildingAge, "33%")}
                    ${renderField("Age of Roof", data.roofAge, "33%")}
                    ${renderField("Number of Units", data.numberOfUnits, "33%")}
                </div>
                <div class="field-grid">
                    ${renderField("Number of Stories", data.numberOfStories, "33%")}
                    ${renderField("Construction Type", data.constructionType, "33%")}
                    ${renderField("Protection Class", data.protectionClass, "33%")}
                </div>
                
                <div class="field-grid" style="margin-top: 10px;">
                    ${renderField("% Occupied", data.percentageOccupied, "33%")}
                    ${renderField("% Students", data.percentageStudents, "33%")}
                    ${renderField("% Subsidized", data.percentageSubsidized, "33%")}
                </div>
                <div class="field-grid">
                    ${renderField("% Elderly", data.percentageElderly, "33%")}
                    ${renderField("% Sprinklered", data.percentageSprinklered, "33%")}
                    <div style="width: 33%;"></div>
                </div>

                <div class="sub-header-line">Types of Systems</div>
                
                <div class="system-item">
                    <div class="system-label">HEATING:</div>
                    <div class="flex-row">
                        ${renderField("Type", data.heatingType, "40%")}
                        ${renderField("Last Inspection", data.heatingLastInspection, "30%")}
                        ${renderField("Records on File", data.heatingRecordsOnFile === true ? 'Yes' : (data.heatingRecordsOnFile === false ? 'No' : '-'), "30%")}
                    </div>
                </div>

                <div class="system-item">
                    <div class="system-label">AIR CONDITIONING:</div>
                    <div class="flex-row">
                        ${renderField("Type", data.airConditioningType, "40%")}
                        ${renderField("Last Inspection", data.airConditioningLastInspection, "30%")}
                        ${renderField("Records on File", data.airConditioningRecordsOnFile === true ? 'Yes' : (data.airConditioningRecordsOnFile === false ? 'No' : '-'), "30%")}
                    </div>
                </div>

                <div class="system-item">
                    <div class="system-label">WATER HEATER:</div>
                    <div class="flex-row">
                        ${renderField("Type", data.waterHeaterType, "40%")}
                        ${renderField("Last Inspection", data.waterHeaterLastInspection, "30%")}
                        ${renderField("Records on File", data.waterHeaterRecordsOnFile === true ? 'Yes' : (data.waterHeaterRecordsOnFile === false ? 'No' : '-'), "30%")}
                    </div>
                </div>
            </div>
            <div class="footer">Page 2 of 7</div>
        </div>
    `;
}

/**
 * Page 3: Property Details (Cont) & Operations
 */
function generatePage3(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("SYSTEMS & SAFETY", data)}
            
            <div class="section-container">
                <div class="system-item">
                    <div class="system-label">BOILER:</div>
                    <div class="flex-row">
                        ${renderField("Type", data.boilerType, "40%")}
                        ${renderField("Last Inspection", data.boilerLastInspection, "30%")}
                        ${renderField("Records on File", data.boilerRecordsOnFile === true ? 'Yes' : (data.boilerRecordsOnFile === false ? 'No' : '-'), "30%")}
                    </div>
                </div>

                <div class="sub-header-line">Building Wiring</div>
                <div class="question-row">
                    <div class="question-text">Wiring Type:</div>
                    <div class="yes-no-options">
                        <span class="option ${data.buildingWiring === 'Copper' ? 'selected' : ''}">Copper</span>
                        <span class="option ${data.buildingWiring === 'Aluminum' ? 'selected' : ''}">Aluminum</span>
                    </div>
                </div>
                ${data.buildingWiring === 'Aluminum' ? renderYesNo("Is wiring pigtailed or COALR?", data.aluminumWiringPigtailedOrCOALR) : ''}
            </div>

            <div class="section-container">
                <div class="section-header">4. SAFETY, SECURITY & OPERATIONS</div>
                <hr class="section-divider" />

                <div class="sub-header-line">Smoke Alarms</div>
                <div class="question-row">
                    <div class="question-text">Smoke Alarms:</div>
                    <div class="yes-no-options">
                        <span class="option ${data.smokeAlarms === 'Hardwire' ? 'selected' : ''}">Hardwire</span>
                        <span class="option ${data.smokeAlarms === 'Battery' ? 'selected' : ''}">Battery</span>
                    </div>
                </div>
                ${data.smokeAlarms === 'Hardwire' ? renderYesNo("Are the alarms tied to a central station?", data.hardwiredCentralStation) : ''}
                ${data.smokeAlarms === 'Battery' ? renderYesNo("Is there a written procedure for routine inspection and replacement?", data.batteryRoutineInspection) : ''}
                ${renderField("Smoke Alarm Details", data.smokeAlarmsDetails)}
                
                <div class="sub-header-line" style="margin-top: 15px;">Fire Safety</div>
                ${renderField("Other Fire Safety Systems (if any)", data.otherFireSafetySystems)}
            </div>
            <div class="footer">Page 3 of 7</div>
        </div>
    `;
}

/**
 * Page 4: Security & Protocols
 */
function generatePage4(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("SECURITY & OPERATIONS", data)}
            
            <div class="section-container">
                <div class="question-list">
                    ${renderYesNo("Is the complex in compliance with all applicable state and local statutes governing safety devices?", data.complianceWithSafetyLaws)}
                    <div class="divider"></div>
                    ${renderYesNo("Is the complex demastered?", data.complexDemastered, data.proceduresForMasterKey)}
                    <div class="divider"></div>
                    ${renderYesNo("Are keys coded and adequately protected?", data.keysCodedAndProtected)}
                    <div class="divider"></div>
                    ${renderYesNo("Are all units re-keyed prior to leasing to new tenants?", data.unitsRekeyed)}
                    <div class="divider"></div>
                    ${renderYesNo("Are individual unit doors secured by double locks and peep holes?", data.doorDoubleLocksPeepHoles)}
                    <div class="divider"></div>
                    ${renderYesNo("Does the complex have limited access perimeter fencing?", data.perimeterFencing)}
                    <div class="divider"></div>
                    ${renderYesNo("Are all areas of the complex covered by security lighting?", data.securityLighting)}
                    <div class="divider"></div>
                    ${renderYesNo("Do you contract with a security guard service for onsite security?", data.securityGuardOnsite)}
                    <div class="divider"></div>
                    ${renderYesNo("Do you perform police background checks on all employees?", data.policeBackgroundChecks, data.backgroundCheckCriteria)}
                </div>
            </div>
            <div class="footer">Page 4 of 7</div>
        </div>
    `;
}

/**
 * Page 5: Operations & Complaints
 */
function generatePage5(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("PROTOCOLS & STAFF", data)}
            
            <div class="section-container">
                <div class="question-block">
                    ${renderYesNo("Do you have written procedures for notifying tenants of any known or suspected criminal activity in the complex or in the vicinity of the complex with record retained for at least two years?", data.proceduresNotifyingTenantsCriminal, data.proceduresNotifyingTenantsCriminalDescription)}
                    <div class="divider" style="margin: 15px 0;"></div>
                    ${renderYesNo("Do you have a written procedure for responding to tenant complaints concerning safety-related issues with records retained for at least two years?", data.proceduresTenantSafetyComplaints, data.proceduresTenantSafetyComplaintsDescription)}
                    <div class="divider" style="margin: 15px 0;"></div>
                    ${renderYesNo("Do you have a full time maintenance staff?", data.fullTimeMaintenanceStaff)}
                    ${data.fullTimeMaintenanceStaff === true ? renderYesNo("Do you have written procedures for inspecting and maintaining building systems and for maintaining written records of such work?", data.proceduresInspectingSystems) : ''}
                </div>
                
                <div class="section-header" style="margin-top: 30px;">5. CONTRACTORS, POOLS & ADDITIONS</div>
                <hr class="section-divider" />

                <div class="question-block">
                    ${renderYesNo("Do you hire contractors to perform building and/or site maintenance such as systems inspection and repair, snow and ice removal, landscaping, etc.?", data.hireContractorsMaintenance, data.hireContractorsMaintenanceDetails)}
                    ${data.hireContractorsMaintenance === true ? `
                        <div class="sub-section">
                            ${renderYesNo("Are contractors required to maintain CGL insurance with a minimum of $1,000,000 limits and to include you as an Additional Insured?", data.contractorsRequiredCGL, data.contractorsRequiredCGLExplanation)}
                        </div>
                    ` : ''}
                    <div class="divider" style="margin: 15px 0;"></div>
                    ${renderYesNo("Do you have written procedures for responding to tenant complaints concerning building, property or systems-related issues with records retained for two years?", data.proceduresTenantComplaintsBuilding, data.proceduresTenantComplaintsBuildingDescription)}
                </div>
            </div>
            <div class="footer">Page 5 of 7</div>
        </div>
    `;
}

/**
 * Page 6: Swimming Pools & Hazards
 */
function generatePage6(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("POOLS & HAZARDS", data)}
            
            <div class="section-container">
                <div class="sub-header-line">Swimming Pools</div>
                <div class="field-grid">
                    ${renderField("Number of Pools", data.poolNumber, "25%")}
                    ${renderField("Diving Boards Height", data.heightOfDivingBoards, "25%")}
                    ${renderField("Slides Length/Height", data.lengthHeightOfSlides, "25%")}
                    ${renderField("Fence Height", data.fenceHeight, "25%")}
                </div>
                <div class="question-list" style="margin-top: 15px;">
                    <div class="flex-row">
                        <div style="flex: 1;">${renderYesNo("Pool Fenced?", data.poolFenced)}</div>
                        <div style="flex: 1;">${renderYesNo("Gates Self-Latching?", data.gatesSelfLatching)}</div>
                    </div>
                    <div class="flex-row">
                        <div style="flex: 1;">${renderYesNo("Lifeguard on Duty?", data.lifeguardOnDuty)}</div>
                        <div style="flex: 1;">${renderYesNo("Depth Markers Visible?", data.depthMarkersVisible)}</div>
                    </div>
                    ${renderField("Frequency of Pool Inspection", data.poolInspectionFrequency)}
                    ${renderField("Pool Hours", data.poolHours)}
                </div>

                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Is a nursery or day care facility located in the building or complex?", data.nurseryDayCareFacility)}
                
                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Do you have written procedures prohibiting your employees from keeping dogs on or around the property?", data.proceduresProhibitingEmployeesDogs)}
                ${renderYesNo("Does your lease agreement prohibit your tenants from keeping dogs on or around the property?", data.leaseProhibitsTenantsDogs)}
                ${(data.leaseProhibitsTenantsDogs === false || data.proceduresProhibitingEmployeesDogs === false) ? renderField("Maximum weight limit allowed for dogs", data.dogWeightLimit) : ''}
                
                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Do you directly or indirectly provide medical, food or transportation services to tenants?", data.provideMedicalFoodTransport)}
            </div>
            <div class="footer">Page 6 of 7</div>
        </div>
    `;
}

/**
 * Page 7: Final Hazards & Completion
 */
function generatePage7(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("FINAL DECLARATIONS", data)}
            
            <div class="section-container">
                <div class="section-header">ADDITIONAL INFORMATION</div>
                <hr class="section-divider" />
                
                <div class="field-item">
                    <div class="field-label">Other buildings, facilities or unusual hazards:</div>
                    <div class="field-value" style="margin-top: 5px;">${data.describeOtherBuildingsHazards || 'None'}</div>
                </div>
                
                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Do you own or control parking facilities?", data.ownControlParkingFacilities, data.parkingDescription)}
                ${data.ownControlParkingFacilities === true ? renderYesNo("Is parking access controlled?", data.parkingAccessControlled) : ''}
                
                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Do you have written procedures for regular inspections of your premises to identify potential liability hazards and to assure all necessary corrections and repairs are made and are records of such inspections retained for at least two years?", data.proceduresRegularInspectionsHazards, data.proceduresRegularInspectionsHazardsDescription)}
                
                <div class="divider" style="margin: 20px 0;"></div>
                ${renderYesNo("Has your insurance agent completed a physical inspection of the property within the last year?", data.insuranceAgentCompletedInspection)}
            </div>

            <div class="footer">Page 7 of 7</div>
        </div>
    `;
}

const cssContent = `
    body { font-family: 'Helvetica', 'Arial', sans-serif; font-size: 9.5pt; color: #1a1a1a; margin: 0; padding: 0; line-height: 1.4; }
    .page { width: 8.5in; min-height: 11in; padding: 0.6in; margin: 0 auto; background: white; position: relative; box-sizing: border-box; page-break-after: always; }
    
    .header-top-page2 { display: flex; justify-content: space-between; margin-bottom: 20px; }
    .agency-info-page2-left { font-size: 9pt; color: #444; line-height: 1.3; }
    .agency-name-page2 { font-weight: bold; font-size: 11pt; color: #000; margin-bottom: 2px; text-transform: uppercase; }
    .logo-icon-page2-hands { width: 1.8in; height: 1.2in; display: flex; align-items: center; justify-content: flex-end; }
    
    .application-id-large-page2 { font-size: 14pt; font-weight: bold; margin: 15px 0; border-top: 1px solid #000; padding-top: 10px; }
    
    .app-id-quote-parallel-page2 { display: grid; grid-template-columns: 1.2in 1fr 1fr; gap: 30px; margin-bottom: 25px; }
    .section-title-page2 { font-weight: bold; text-transform: uppercase; font-size: 8.5pt; color: #666; margin-bottom: 6px; border-bottom: 1px solid #ddd; padding-bottom: 2px; }
    .insured-detail-page2, .quote-detail-page2 { font-size: 9pt; margin-bottom: 2px; }
    .date-section-page2 { font-weight: bold; font-size: 10pt; }

    .header { display: flex; justify-content: space-between; border-bottom: 2.5px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .header-left .form-id { font-weight: bold; font-size: 15pt; letter-spacing: -0.5px; }
    .header-left .program-subtitle { font-size: 10pt; color: #555; margin-top: 1px; }
    .header-right { text-align: right; }
    .header-right .page-title { font-weight: bold; font-size: 11pt; text-transform: uppercase; color: #000; }
    .header-right .meta-row { font-size: 9pt; margin-top: 4px; color: #333; }
    
    .agency-bar { background: #f8f8f8; padding: 6px 12px; font-size: 9pt; margin-bottom: 25px; border: 0.5px solid #ddd; border-radius: 2px; }
    
    .section-container { margin-bottom: 30px; }
    .section-header { font-weight: bold; font-size: 11pt; text-transform: uppercase; margin-top: 15px; margin-bottom: 4px; color: #000; letter-spacing: 0.5px; }
    .section-divider { border: none; border-top: 2px solid #000; margin: 0 0 15px 0; padding: 0; width: 100%; }
    
    .flex-row { display: flex; width: 100%; margin-bottom: 8px; }
    .field-grid { display: flex; width: 100%; margin-bottom: 8px; }
    
    .field-item { margin-bottom: 6px; }
    .field-label { font-weight: 600; color: #333; margin-right: 4px; }
    .field-value { font-weight: bold; color: #000; }
    
    .question-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 5px; padding: 2px 0; }
    .question-text { flex: 1; font-weight: 500; font-size: 9.5pt; color: #1a1a1a; padding-right: 20px; }
    .yes-no-options { display: flex; gap: 12px; font-size: 10pt; min-width: 80px; justify-content: flex-end; }
    .option { color: #999; }
    .option.selected { color: #000; font-weight: bold; text-decoration: underline; text-underline-offset: 3px; }
    
    .explanation-text { margin: -2px 0 12px 20px; font-size: 9pt; color: #444; font-style: italic; background: #fafafa; padding: 6px 10px; border-left: 2px solid #ddd; }
    
    .sub-section { border-left: 3px solid #eee; padding-left: 15px; margin: 10px 0 15px 5px; }
    .sub-header-line { font-weight: bold; font-size: 9.5pt; text-transform: uppercase; margin: 15px 0 8px 0; color: #333; border-bottom: 0.5px solid #ccc; padding-bottom: 2px; }
    
    .system-item { margin-bottom: 12px; padding: 8px 0; }
    .system-label { font-weight: bold; font-size: 9.5pt; color: #000; margin-bottom: 5px; text-decoration: underline; }
    
    .divider { border-top: 0.5px solid #ccc; margin: 15px 0; }
    .footer { position: absolute; bottom: 0.5in; left: 0.6in; right: 0.6in; border-top: 1px solid #eee; padding-top: 5px; font-size: 8.5pt; color: #999; text-align: center; }
`;


/**
 * Page: Proposal Cover & Financials
 */
function generateProposalPage(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("INSURANCE PROPOSAL", data)}
            
            <div class="section-container">
                <div class="section-header">QUOTATION SUMMARY</div>
                <hr class="section-divider" />
                
                <div class="field-grid">
                    ${renderField("Carrier", data.carrierName, "50%")}
                    ${renderField("Quote Type", data.quoteType, "50%")}
                </div>
                <div class="field-grid">
                    ${renderField("Coverage Type", data.coverageType, "50%")}
                    ${renderField("Coverage Dates", data.desiredCoverageDates, "50%")}
                </div>
            </div>

            <div class="section-container">
                <div class="section-header">LIMITS OF LIABILITY</div>
                <hr class="section-divider" />
                <div class="question-list">
                    <div class="question-row">
                        <div class="question-text">Each Occurrence Limit</div>
                        <div class="field-value">${data.occurrenceLimit || "$1,000,000"}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">General Aggregate Limit</div>
                        <div class="field-value">${data.aggregateLimit || "$2,000,000"}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Products/Completed Operations Aggregate</div>
                        <div class="field-value">${data.productsCompletedOpsLimit || "$2,000,000"}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Personal & Advertising Injury</div>
                        <div class="field-value">${data.personalAdvertisingInjuryLimit || "$1,000,000"}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Damage to Premises Rented to You (Fire Legal)</div>
                        <div class="field-value">${data.fireLegalLimit || "$100,000"}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Medical Expense Limit</div>
                        <div class="field-value">${data.medPayLimit || "$5,000"}</div>
                    </div>
                </div>
            </div>

            <div class="section-container">
                <div class="section-header">PREMIUM & FEES BREAKDOWN</div>
                <hr class="section-divider" />
                <div class="question-list">
                    <div class="question-row">
                        <div class="question-text">Base Premium</div>
                        <div class="field-value">${data.premium}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Wholesale Fee</div>
                        <div class="field-value">${data.carrierPolicyFee}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Broker Fee</div>
                        <div class="field-value">${data.sterlingFees}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Surplus Lines Tax</div>
                        <div class="field-value">${data.surplusLinesTax}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Stamping Fee</div>
                        <div class="field-value">${data.stampingFee}</div>
                    </div>
                    ${data.fireMarshalTax && data.fireMarshalTax !== "$0.00" ? `
                        <div class="question-row">
                            <div class="question-text">Fire Marshal Tax</div>
                            <div class="field-value">${data.fireMarshalTax}</div>
                        </div>
                    ` : ''}
                    <div class="divider"></div>
                    <div class="question-row" style="font-size: 12pt;">
                        <div class="question-text" style="font-weight: bold;">TOTAL COST</div>
                        <div class="field-value" style="font-weight: bold;">${data.totalCostOfPolicy}</div>
                    </div>
                </div>
            </div>

            <div class="footer">Proposal Page</div>
        </div>
    `;
}

/**
 * Page: Invoice Statement
 */
function generateInvoicePage(data: ApartmentPacketData): string {
    return `
        <div class="page">
            ${generateHeader("INVOICE STATEMENT", data)}
            
            <div class="agency-bar">
                <div><strong>REMIT PAYMENT TO:</strong></div>
                <div>${data.agencyName}</div>
                <div>${data.agencyAddress}, ${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
            </div>

            <div class="section-container">
                <div class="section-header">BILLING SUMMARY</div>
                <hr class="section-divider" />
                <div class="field-grid">
                    ${renderField("Insured", data.companyName, "60%")}
                    ${renderField("Submission #", data.submissionNumber, "40%")}
                </div>
                <div class="field-grid">
                    ${renderField("Policy Period", data.desiredCoverageDates, "100%")}
                </div>
            </div>

            <div class="section-container">
                <div class="section-header">AMOUNT DUE</div>
                <hr class="section-divider" />
                <div class="question-list">
                    <div class="question-row">
                        <div class="question-text">Total Policy Premium & Taxes</div>
                        <div class="field-value">${data.totalCostOfPolicy}</div>
                    </div>
                    <div class="question-row">
                        <div class="question-text">Minimum Deposit Required</div>
                        <div class="field-value">${data.totalDeposit}</div>
                    </div>
                    <div class="divider"></div>
                    <div class="question-row" style="font-size: 12pt;">
                        <div class="question-text" style="font-weight: bold;">TOTAL AMOUNT PAYABLE</div>
                        <div class="field-value" style="font-weight: bold;">${data.totalToBeSent}</div>
                    </div>
                </div>
                
                <div style="margin-top: 40px; font-size: 9pt; color: #666; line-height: 1.5;">
                    <p><strong>Notice:</strong> Please make checks payable to <strong>${data.agencyName}</strong>. Standard processing time for binding is 24-48 hours after receipt of all signed documents and payment.</p>
                </div>
            </div>

            <div class="footer">Invoice Statement</div>
        </div>
    `;
}

export function generateApartmentPacketHTML(data: ApartmentPacketData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${cssContent}</style>
        </head>
        <body>
            ${generatePage1(data)}
            ${generatePage2(data)}
            ${generatePage3(data)}
            ${generatePage4(data)}
            ${generatePage5(data)}
            ${generatePage6(data)}
            ${generatePage7(data)}
        </body>
        </html>
    `;
}

export function generateApartmentProposalHTML(data: ApartmentPacketData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${cssContent}</style>
        </head>
        <body>
            ${generateProposalPage(data)}
        </body>
        </html>
    `;
}

export function generateApartmentInvoiceHTML(data: ApartmentPacketData): string {
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>${cssContent}</style>
        </head>
        <body>
            ${generateInvoicePage(data)}
        </body>
        </html>
    `;
}


