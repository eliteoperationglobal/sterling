import { ContractorsPacketData, EquipmentItem, AI } from './mappers/contractorsMapper';

/**
 * Format Yes/No with underlined text selections - Standard Horizontal
 */
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
        ${explanation && explanation.trim() && explanation !== '-' ? `<div class="explanation-text"><strong>Details:</strong> ${explanation}</div>` : ''}
    `;
}

/**
 * Format Standard Field (Label: Value) - Standard Horizontal
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
 * Format Signature Row with Underline
 */
function renderSignatureRow(label: string, value: string, width: string = '100%', className: string = ''): string {
    return `
        <div class="signature-row ${className}">
            <span class="signature-label">${label}</span>
            <span class="signature-underline">${value || '&nbsp;'}</span>
        </div>
    `;
}

/**
 * Generate Capital & Co Logo HTML
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
    // Fallback logo
    return `<div style="width:${size}; height:auto; color: #1e3a8a; font-weight: 800; font-size: 14pt;">CAPITAL & CO</div>`;
}

function generatePage1(data: ContractorsPacketData): string {
    return `
        <div class="page page2-isc">
            <div class="main-content main-content-page2">
                <!-- Top Header: Agency & Logo -->
                <div class="header-top-page2">
                    <div class="agency-info-page2-left">
                        <div class="agency-name-page2">${data.agencyName}</div>
                        <div>${data.agencyAddress}</div>
                        <div>${data.agencyCity}, ${data.agencyState} ${data.agencyZip}</div>
                        <div>${data.agencyPhone}</div>
                        <div>${data.agencyEmail?.toLowerCase() || ""}</div>
                    </div>
                    <div class="logo-icon-page2-hands">
                        ${generateCapitalCoLogoHTML(data.capitalCoLogoSVG, "1.5in")}
                    </div>
                </div>

                <!-- Application ID -->
                <div class="application-id-large-page2">
                    APPLICATION ID: ${data.submissionNumber || data.applicationId || "PENDING"}
                </div>

                <!-- Parallel Quote Info Grid -->
                <div class="app-id-quote-parallel-page2">
                    <!-- Column 1: Date -->
                    <div class="date-section-page2">
                        <div class="section-title-page2">DATE</div>
                        <div class="quote-detail-page2">${data.formDate || new Date().toLocaleDateString()}</div>
                    </div>
                    
                    <!-- Column 2: Insured Information -->
                    <div class="insured-section-page2">
                        <div class="section-title-page2">INSURED INFORMATION</div>
                        <div class="insured-detail-page2" style="font-weight: bold;">${data.applicantName}</div>
                        <div class="insured-detail-page2">${data.companyName}</div>
                        <div class="insured-detail-page2">${data.physAddress} ${data.physApt || ""}</div>
                        <div class="insured-detail-page2">${data.physCity}, ${data.physState} ${data.physZip}</div>
                    </div>

                    <!-- Column 3: Quotation Information -->
                    <div class="quote-section-page2">
                        <div class="section-title-page2">QUOTATION INFORMATION</div>
                        <div class="quote-detail-page2">Program: Contractors Equipment</div>
                        <div class="quote-detail-page2">Effective Date: ${data.effectiveDate || "Pending"}</div>
                        <div class="quote-detail-page2">Entity: ${data.entityType}</div>
                        <div class="quote-detail-page2">License #: ${data.licenseNum}</div>
                    </div>
                </div>

                <div class="section-container">
                    <div class="section-header">APPLICANT DETAILS</div>
                    <hr class="section-divider" />
                    <div class="field-grid">
                        ${renderField("DBA", data.dba, "50%")}
                        ${renderField("FEIN / SSN", data.ssn, "50%")}
                    </div>
                    <div class="field-grid">
                        ${renderField("Years in Business", data.yearsInBusiness, "50%")}
                        ${renderField("License Class", data.licenseClass, "50%")}
                    </div>
                </div>

                <div class="section-container">
                    <div class="section-header">OPERATIONS DESCRIPTION</div>
                    <hr class="section-divider" />
                    <div style="font-size: 10pt; line-height: 1.4; color: #000; padding: 5px 0;">
                        ${data.opsDescription || "No description provided."}
                    </div>
                </div>

                <div class="section-container">
                    <div class="section-header">MAILING ADDRESS</div>
                    <hr class="section-divider" />
                    ${data.sameAsMailing ? 
                        `<div style="font-style: italic; color: #666; font-size: 10pt;">Same as Physical Address</div>` : 
                        `
                        <div class="field-grid">
                            ${renderField("Address", `${data.mailAddress} ${data.mailApt || ""}`, "60%")}
                            ${renderField("City/State/Zip", `${data.mailCity}, ${data.mailState} ${data.mailZip}`, "40%")}
                        </div>
                        `
                    }
                </div>

                <div class="footer">Page 1 - General Information | Contractors Equipment Program</div>
            </div>
        </div>
    `;
}

function generatePage2(data: ContractorsPacketData): string {
    return `
        <div class="page page2-isc">
            <div class="main-content main-content-page2">
                <div class="section-container">
                    <div class="section-header">UNDERWRITING & BUSINESS ELIGIBILITY</div>
                    <hr class="section-divider" />
                    <div class="question-block">
                        ${renderYesNo("Have you had any insurance cancelled or non-renewed in last 3 years?", data.cancelled, data.cancelledExplain)}
                        ${renderYesNo("Any bankruptcy filed in the last 7 years?", data.bankruptcy, data.bankruptcyExplain)}
                        ${renderYesNo("More than one loss in the last 3 years?", data.moreThanOneLoss, data.lossExplain)}
                        ${renderYesNo("Any crane or asphalt/paving work?", data.asphaltCranes, data.asphaltExplain)}
                        ${renderYesNo("Any tandem lifting operations?", data.tandemLifting, data.tandemExplain)}
                        ${renderYesNo("Any operations over water or on bridges?", data.overWater, data.waterExplain)}
                        ${renderYesNo("Any oilfield or refinery work?", data.oilfield, data.oilfieldExplain)}
                        ${renderYesNo("Any demolition work?", data.demolition, data.demolitionExplain)}
                        ${renderYesNo("Is equipment garaged/parked in a fenced, lighted, or secure area?", data.garaged)}
                        ${renderYesNo("Any stump grinder operations?", data.stumpGrinder, data.stumpExplain)}
                        ${renderYesNo("Do you rent equipment to others?", data.rentToOthers, data.rentExplain)}
                    </div>
                </div>

                <div class="section-container" style="margin-top: 0.3in;">
                    <div class="section-header">SPECIALIZED TRADE SUBCONTRACTING</div>
                    <hr class="section-divider" />
                    <div class="question-block">
                        ${renderYesNo("Hazardous waste or asbestos abatement?", data.subcontractHazardous, data.hazardousExplain)}
                        ${renderYesNo("Agricultural or forestry operations?", data.subcontractAgri, data.agriExplain)}
                        ${renderYesNo("Bridge or tunnel construction?", data.subcontractBridges, data.bridgesExplain)}
                        ${renderYesNo("Drone or aircraft related operations?", data.subcontractDrones, data.dronesExplain)}
                        ${renderYesNo("Trailer or chassis manufacturing/repair?", data.subcontractTrailers, data.trailersExplain)}
                    </div>
                </div>

                <div class="footer">Page 2 - Underwriting Eligibility | Contractors Equipment Program</div>
            </div>
        </div>
    `;
}

function generatePage3(data: ContractorsPacketData): string {
    const renderTable = (items: EquipmentItem[]) => {
        if (!items || items.length === 0) return '<p style="color:#666; font-style:italic; padding: 10px; font-size: 10pt;">No items scheduled.</p>';
        return `
            <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 5px;">
                <thead>
                    <tr style="border-bottom: 2px solid #000; text-align: left;">
                        <th style="padding: 5px 2px;">Type</th>
                        <th style="padding: 5px 2px; width: 60px;">Year</th>
                        <th style="padding: 5px 2px;">Make / Model</th>
                        <th style="padding: 5px 2px;">Serial / VIN</th>
                        <th style="text-align: right; padding: 5px 2px;">Valuation</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(it => `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 6px 2px;">${it.type}</td>
                            <td style="padding: 6px 2px;">${it.year}</td>
                            <td style="padding: 6px 2px;">${it.make} ${it.model}</td>
                            <td style="padding: 6px 2px;">${it.serialNumber}</td>
                            <td style="text-align: right; padding: 6px 2px; font-weight: bold;">${it.valuation}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    };

    return `
        <div class="page page2-isc">
            <div class="main-content main-content-page2">
                <div class="section-container">
                    <div class="section-header">SCHEDULED EQUIPMENT (LIGHT / MEDIUM)</div>
                    <hr class="section-divider" />
                    ${renderTable(data.lightMedItems)}
                </div>

                <div class="section-container" style="margin-top: 0.4in;">
                    <div class="section-header">SCHEDULED EQUIPMENT (HEAVY)</div>
                    <hr class="section-divider" />
                    ${renderTable(data.heavyItems)}
                </div>

                <div class="footer">Page 3 - Equipment Schedule | Contractors Equipment Program</div>
            </div>
        </div>
    `;
}

function generatePage4(data: ContractorsPacketData): string {
    return `
        <div class="page page2-isc">
            <div class="main-content main-content-page2">
                <div class="section-container">
                    <div class="section-header">COVERAGE LIMITS & FLOATING ITEMS</div>
                    <hr class="section-divider" />
                    <div class="field-grid">
                        ${renderField("Miscellaneous Tools Limit", data.miscToolsLimit, "50%")}
                        ${renderField("Light/Medium Equip Limit", data.lightMedLimit, "50%")}
                    </div>
                    <div class="field-grid">
                        ${renderField("Heavy Equipment Limit", data.heavyLimit, "50%")}
                        ${renderField("Rented/Leased Equip Limit", data.rentedEquipLimit, "50%")}
                    </div>
                    <div class="field-grid">
                        ${renderField("Installation Floater Limit", data.installFloaterLimit, "50%")}
                        ${renderField("Office Contents Limit", data.officeContentsLimit, "50%")}
                    </div>
                    <div class="field-grid">
                        ${renderField("Computer / Data / Media", data.computerDataMediaLimit, "50%")}
                    </div>
                </div>

                <div class="section-container" style="margin-top: 0.2in;">
                    <div class="section-header">ADDITIONAL INTERESTS / LIENHOLDERS</div>
                    <hr class="section-divider" />
                    ${renderYesNo("Are there any lienholders or additional interests?", data.hasLienholder, data.lienholderExplain)}
                    ${data.interests?.length > 0 ? `
                        <table style="width: 100%; border-collapse: collapse; font-size: 9.5pt; margin-top: 10px;">
                            <thead>
                                <tr style="border-bottom: 2px solid #000; text-align: left;">
                                    <th style="padding: 4px;">Name</th>
                                    <th style="padding: 4px;">Contract #</th>
                                    <th style="padding: 4px;">Address</th>
                                    <th style="padding: 4px;">City/State/Zip</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.interests.map(ai => `
                                    <tr style="border-bottom: 1px solid #eee;">
                                        <td style="padding: 5px;">${ai.name}</td>
                                        <td style="padding: 5px;">${ai.contractNumber}</td>
                                        <td style="padding: 5px;">${ai.address} ${ai.aptSuite || ""}</td>
                                        <td style="padding: 5px;">${ai.city}, ${ai.state} ${ai.zip}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : ''}
                </div>

                <div class="section-container" style="margin-top: 0.2in;">
                    <div class="section-header">PAYMENT & TERRORISM</div>
                    <hr class="section-divider" />
                    <div class="field-grid">
                        ${renderField("Payment Option", data.paymentOption, "50%")}
                        ${renderField("Broker Fee", data.brokerFee, "50%")}
                    </div>
                    ${renderYesNo("Terrorism Coverage Selected?", data.terrorism)}
                </div>

                <div class="section-container" style="margin-top: 0.4in; background: #f9fafb; padding: 15px; border-radius: 4px; border: 1px solid #e5e7eb;">
                    <div class="section-header" style="font-size: 10pt;">APPLICATION AGREEMENT</div>
                    <div style="font-size: 8.5pt; line-height: 1.5; color: #4b5563; text-align: justify; margin-top: 5px;">
                        The undersigned represents that the information provided is true and complete to the best of their knowledge. 
                        It is understood that this application shall be the basis of the contract for insurance should a policy be issued. 
                        Any person who knowingly and with intent to defraud any insurance company or other person files an application 
                        for insurance containing any materially false information or conceals for the purpose of misleading information 
                        concerning any fact material thereto commits a fraudulent insurance act.
                    </div>
                </div>

                <div class="signature-grid-row-large" style="margin-top: 0.6in;">
                    <div class="signature-col">
                        ${renderSignatureRow("Applicant Signature:", "", "100%")}
                    </div>
                    <div class="signature-col" style="max-width: 1.5in;">
                        ${renderSignatureRow("Date:", "", "100%")}
                    </div>
                </div>

                <div class="signature-grid-row" style="margin-top: 0.4in;">
                    <div class="signature-col">
                        ${renderSignatureRow("Producer Signature:", "", "100%")}
                    </div>
                    <div class="signature-col" style="max-width: 1.5in;">
                        ${renderSignatureRow("Date:", "", "100%")}
                    </div>
                </div>

                <div class="footer">Page 4 - Final Statements & Signatures | Contractors Equipment Program</div>
            </div>
        </div>
    `;
}

const cssContent = `
    @page { margin: 0; }
    body { font-family: 'Inter', system-ui, -apple-system, sans-serif; margin: 0; padding: 0; -webkit-print-color-adjust: exact; }
    .page { width: 8.5in; height: 11in; position: relative; overflow: hidden; page-break-after: always; background: white; }
    
    .main-content {
      flex: 1;
      width: 100%;
      position: relative;
      z-index: 1;
    }

    /* ============================================
       PAGE 2 SPECIFIC STYLES - ISC APPLICATION FORMAT
       ============================================ */
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

    /* General Layout Helpers */
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
    .footer { position: absolute; bottom: 0.4in; left: 0.6in; right: 0.6in; border-top: 1px solid #eee; padding-top: 5px; font-size: 8.5pt; color: #999; text-align: center; }
    
    .signature-row { display: flex; align-items: baseline; width: 100%; height: 1.5em; }
    .signature-label { font-weight: 600; font-size: 10.5pt; color: #444; min-width: 110px; flex-shrink: 0; }
    .signature-underline { border-bottom: 1.5px solid #000; flex: 1; min-width: 100px; padding: 0 5px; font-weight: bold; font-size: 11pt; text-align: center; height: 1.3em; line-height: 1.3em; }
    
    .signature-grid-row { display: flex; gap: 40px; width: 100%; margin-top: 8px; margin-bottom: 20px; }
    .signature-grid-row-large { margin-top: 35px !important; margin-bottom: 40px !important; }
    .signature-col { flex: 1; min-width: 0; }
`;

export function generateContractorsPacketHTML(data: ContractorsPacketData): string {
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
        </body>
        </html>
    `;
}
