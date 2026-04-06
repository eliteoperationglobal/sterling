import * as fs from 'fs';

const css = `
    .acord-page {
      font-family: Arial, Helvetica, sans-serif;
      width: 8.5in;
      height: 11in;
      padding: 0.35in 0.35in 0.5in 0.35in;
      box-sizing: border-box;
      background-color: #fff;
      position: relative;
      color: #000;
      font-size: 8px;
    }
    .acord-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .acord-table td {
      border: 1px solid #000;
      padding: 1px 2px;
      vertical-align: top;
      box-sizing: border-box;
      overflow: hidden;
    }
    .acord-label {
      font-size: 5.5px;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .acord-value {
      font-size: 9px;
      min-height: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: bold;
      margin-top: 1px;
    }
    .acord-section-header {
      background-color: #e5e5e5;
      font-size: 8px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 2px 4px;
      border: 1px solid #000;
      border-bottom: none;
      margin-top: 4px;
    }
    .acord-checkbox {
      display: inline-block;
      width: 7px;
      height: 7px;
      border: 1px solid #000;
      margin-right: 2px;
      vertical-align: middle;
      background-color: #fff;
    }
    .b-none { border: none !important; }
    .b-top { border-top: 1px solid #000 !important; }
    .b-right { border-right: 1px solid #000 !important; }
    .b-bottom { border-bottom: 1px solid #000 !important; }
    .b-left { border-left: 1px solid #000 !important; }
    .p-0 { padding: 0 !important; }
    .align-center { text-align: center; }
`;

function getPage1Html() {
  return `export function generateAcord125FullForm(data: ApplicationPacketData): string {
  const sectionsAttachedData = [
    ['ACCOUNTS RECEIVABLE / VALUABLE PAPERS', 'BOILER & MACHINERY', 'BUSINESS AUTO', 'BUSINESS OWNERS', 'COMMERCIAL GENERAL LIABILITY', 'CRIME / MISCELLANEOUS CRIME', 'DEALERS'],
    ['ELECTRONIC DATA PROC', 'EQUIPMENT FLOATER', 'GARAGE AND DEALERS', 'GLASS AND SIGN', 'INSTALLATION / BUILDERS RISK', 'OPEN CARGO', 'PROPERTY'],
    ['TRANSPORTATION / MOTOR TRUCK CARGO', 'TRUCKERS / MOTOR CARRIER', 'UMBRELLA', 'YACHT', '', '', '']
  ];

  const attachmentsData = [
    ['ADDITIONAL INTEREST', 'ADDITIONAL PREMISES', 'APARTMENT BUILDING SUPPLEMENT', 'CONDO ASSN BYLAWS (for D&O Coverage only)', 'CONTRACTORS SUPPLEMENT', 'COVERAGES SCHEDULE', 'DRIVER INFORMATION SCHEDULE', 'INTERNATIONAL LIABILITY EXPOSURE SUPPLEMENT', 'INTERNATIONAL PROPERTY EXPOSURE SUPPLEMENT', 'LOSS SUMMARY'],
    ['PREMIUM PAYMENT SUPPLEMENT', 'PROFESSIONAL LIABILITY SUPPLEMENT', 'RESTAURANT / TAVERN SUPPLEMENT', 'STATEMENT / SCHEDULE OF VALUES', 'STATE SUPPLEMENT (If applicable)', 'VACANT BUILDING SUPPLEMENT', 'VEHICLE SCHEDULE', '', '', '']
  ];

  return \`
    <style>\${ \`${css}\` }</style>
    <div class="page acord-page" style="page-break-after: always;">
      
      <!-- HEADER -->
      <table class="acord-table b-none" style="margin-bottom: 2px;">
        <tr>
          <td class="b-none" style="width: 25%; vertical-align: bottom;">
            <div style="font-family: 'Arial Black', Impact, sans-serif; font-size: 20px; font-weight: 900; font-style: italic; letter-spacing: -0.5px; line-height: 1;">ACORD<sup style="font-size:10px; font-weight:bold; font-style:normal;">&reg;</sup></div>
          </td>
          <td class="b-none align-center" style="width: 50%; vertical-align: bottom;">
            <div style="font-size: 15px; font-weight: bold; line-height: 1.1;">COMMERCIAL INSURANCE APPLICATION</div>
            <div style="font-size: 11px; font-weight: bold;">APPLICANT INFORMATION SECTION</div>
          </td>
          <td class="b-none" style="width: 25%; vertical-align: top; text-align: right;">
            <table class="acord-table" style="width: 120px; float: right;">
              <tr>
                <td style="border: 2px solid #000; padding: 1px 3px;">
                  <div class="acord-label" style="border-bottom: 1px solid #000; padding-bottom: 1px;">DATE (MM/DD/YYYY)</div>
                  <div class="acord-value" style="text-align: left;">\${data.effectiveDate || ''}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- TOP SECTION 50/50 -->
      <table class="acord-table" style="border: 2px solid #000;">
        <tr>
          <td style="width: 50%; padding: 0; border-right: 2px solid #000;">
            <table class="acord-table b-none" style="height: 100%;">
              <tr>
                <td class="b-none b-bottom" style="height: 48px;">
                  <div class="acord-label">AGENCY</div>
                  <div class="acord-value">\${data.agencyName || ''}</div>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom" style="height: 18px;">
                  <span class="acord-label" style="display:inline-block; width:65px;">CONTACT<br/>NAME:</span>
                  <span class="acord-value">\${data.contactName || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom" style="height: 18px;">
                  <span class="acord-label" style="display:inline-block; width:65px;">PHONE<br/>(A/C, No, Ext):</span>
                  <span class="acord-value">\${data.phone || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom" style="height: 18px;">
                  <span class="acord-label" style="display:inline-block; width:65px;">FAX<br/>(A/C, No):</span>
                  <span class="acord-value"></span>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom" style="height: 18px;">
                  <span class="acord-label" style="display:inline-block; width:65px;">E-MAIL<br/>ADDRESS:</span>
                  <span class="acord-value">\${data.email || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom p-0">
                  <table class="acord-table b-none">
                    <tr>
                      <td class="b-none b-right" style="width:50%; height:18px;"><div class="acord-label">CODE:</div></td>
                      <td class="b-none" style="width:50%;"><div class="acord-label">SUBCODE:</div></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="b-none" style="height: 18px;">
                  <div class="acord-label">AGENCY CUSTOMER ID:</div>
                </td>
              </tr>
            </table>
          </td>
          
          <td style="width: 50%; padding: 0;">
            <table class="acord-table b-none" style="height: 100%;">
              <tr>
                <td class="b-none b-bottom p-0">
                  <table class="acord-table b-none">
                    <tr>
                      <td class="b-none b-right" style="width:70%; height:24px;">
                        <div class="acord-label">CARRIER</div>
                        <div class="acord-value">\${data.carrier || ''}</div>
                      </td>
                      <td class="b-none" style="width:30%;">
                        <div class="acord-label">NAIC CODE</div>
                        <div class="acord-value"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom p-0">
                  <table class="acord-table b-none">
                    <tr>
                      <td class="b-none b-right" style="width:70%; height:24px;">
                        <div class="acord-label">COMPANY POLICY OR PROGRAM NAME</div>
                        <div class="acord-value"></div>
                      </td>
                      <td class="b-none" style="width:30%;">
                        <div class="acord-label">PROGRAM CODE</div>
                        <div class="acord-value"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom" style="height:24px;">
                  <div class="acord-label">POLICY NUMBER</div>
                  <div class="acord-value">\${data.policyNumber || ''}</div>
                </td>
              </tr>
              <tr>
                <td class="b-none b-bottom p-0">
                  <table class="acord-table b-none">
                    <tr>
                      <td class="b-none b-right" style="width:60%; height:24px;">
                        <div class="acord-label">UNDERWRITER</div>
                      </td>
                      <td class="b-none" style="width:40%;">
                        <div class="acord-label">UNDERWRITER OFFICE</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="b-none p-0">
                  <table class="acord-table b-none" style="height:100%;">
                    <tr>
                      <td class="b-none b-right" style="width:25%;">
                        <div class="acord-label">STATUS OF<br/>TRANSACTION</div>
                      </td>
                      <td class="b-none p-0" style="width:75%;">
                        <table class="acord-table b-none" style="height:100%;">
                          <tr>
                            <td class="b-none b-bottom" style="padding: 2px 4px;">
                              <div class="acord-checkbox"></div> <span style="font-size:6px; font-weight:bold;">QUOTE</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <div class="acord-checkbox"></div> <span style="font-size:6px; font-weight:bold;">ISSUE POLICY</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <div class="acord-checkbox"></div> <span style="font-size:6px; font-weight:bold;">RENEW</span>
                            </td>
                          </tr>
                          <tr>
                            <td class="b-none b-bottom" style="padding: 2px 4px;">
                              <div class="acord-checkbox"></div> <span style="font-size:6px; font-weight:bold;">BOUND (Give Date and/or Attach Copy):</span><br/>
                              <div style="margin-top:2px;">
                                <table style="width:100%; font-size:6px; font-weight:bold;">
                                  <tr>
                                    <td style="width:25%;">CHANGE</td>
                                    <td style="width:40%; text-align:center;">DATE</td>
                                    <td style="width:35%; text-align:right;">TIME &nbsp;&nbsp;&nbsp; <div class="acord-checkbox"></div> AM &nbsp; <div class="acord-checkbox"></div> PM</td>
                                  </tr>
                                </table>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td class="b-none" style="padding: 2px 4px;">
                              <div class="acord-checkbox"></div> <span style="font-size:6px; font-weight:bold;">CANCEL</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- SECTIONS ATTACHED -->
      <div class="acord-section-header" style="margin-top:2px;">SECTIONS ATTACHED</div>
      <table class="acord-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <td style="width:40%; padding:0;" class="b-right">
             <table class="acord-table b-none">
                <tr>
                   <td style="width:10%;" class="b-none b-right b-bottom"></td>
                   <td style="width:75%;" class="b-none b-right b-bottom"><div class="acord-label">INDICATE SECTIONS ATTACHED</div></td>
                   <td style="width:15%;" class="b-none b-bottom"><div class="acord-label">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[0].map((item, i) => \`
                <tr>
                   <td class="b-none b-right b-bottom align-center" style="padding: 1px;"><div class="acord-checkbox"></div></td>
                   <td class="b-none b-right b-bottom" style="font-size:6.5px;">\${item}</td>
                   <td class="b-none b-bottom" style="font-size:6.5px;">$</td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <td style="width:30%; padding:0;" class="b-right">
             <table class="acord-table b-none">
                <tr>
                   <td style="width:13%;" class="b-none b-right b-bottom"></td>
                   <td style="width:67%;" class="b-none b-right b-bottom"></td>
                   <td style="width:20%;" class="b-none b-bottom"><div class="acord-label">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[1].map((item, i) => \`
                <tr>
                   <td class="b-none b-right b-bottom align-center" style="padding: 1px;"><div class="acord-checkbox" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td class="b-none b-right b-bottom" style="font-size:6.5px;">\${item}</td>
                   <td class="b-none b-bottom" style="font-size:6.5px;">\${item ? '$' : ''}</td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <td style="width:30%; padding:0;">
             <table class="acord-table b-none">
                <tr>
                   <td style="width:13%;" class="b-none b-right b-bottom"></td>
                   <td style="width:67%;" class="b-none b-right b-bottom"></td>
                   <td style="width:20%;" class="b-none b-bottom"><div class="acord-label">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[2].map((item, i) => \`
                <tr>
                   <td class="b-none b-right b-bottom align-center" style="padding: 1px;"><div class="acord-checkbox" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td class="b-none b-right b-bottom" style="font-size:6.5px;">\${item}</td>
                   <td class="b-none b-bottom" style="font-size:6.5px;">\${item ? '$' : ''}</td>
                </tr>
                \`).join('')}
             </table>
          </td>
        </tr>
      </table>

      <!-- ATTACHMENTS -->
      <div class="acord-section-header" style="margin-top:2px;">ATTACHMENTS</div>
      <table class="acord-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <td style="width:50%; padding:0;" class="b-right">
             <table class="acord-table b-none">
                \${attachmentsData[0].map((item, i) => \`
                <tr>
                   <td style="width:7.5%; padding: 1px;" class="b-none b-right b-bottom align-center"><div class="acord-checkbox" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td style="width:80%; font-size:6.5px;" class="b-none b-right b-bottom">\${item}</td>
                   <td style="width:12.5%;" class="b-none b-bottom"></td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <td style="width:50%; padding:0;">
             <table class="acord-table b-none">
                \${attachmentsData[1].map((item, i) => \`
                <tr>
                   <td style="width:7.5%; padding: 1px;" class="b-none b-right b-bottom align-center"><div class="acord-checkbox" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td style="width:80%; font-size:6.5px;" class="b-none b-right b-bottom">\${item}</td>
                   <td style="width:12.5%;" class="b-none b-bottom"></td>
                </tr>
                \`).join('')}
             </table>
          </td>
        </tr>
      </table>

      <!-- POLICY INFORMATION -->
      <div class="acord-section-header" style="margin-top:2px;">POLICY INFORMATION</div>
      <table class="acord-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <td style="width: 10%;"><div class="acord-label">PROPOSED EFF DATE</div><div class="acord-value">\${data.effectiveDate || ''}</div></td>
          <td style="width: 10%;"><div class="acord-label">PROPOSED EXP DATE</div><div class="acord-value">\${data.expirationDate || ''}</div></td>
          <td style="width: 16%; padding:0;">
             <table class="acord-table b-none" style="height:100%;">
                <tr><td colspan="2" class="b-none b-bottom align-center"><div class="acord-label">BILLING PLAN</div></td></tr>
                <tr>
                  <td class="b-none b-right align-center"><div class="acord-checkbox"></div><span style="font-size:6px;font-weight:bold;">DIRECT</span></td>
                  <td class="b-none align-center"><div class="acord-checkbox"></div><span style="font-size:6px;font-weight:bold;">AGENCY</span></td>
                </tr>
             </table>
          </td>
          <td style="width: 14%;"><div class="acord-label">PAYMENT PLAN</div></td>
          <td style="width: 14%;"><div class="acord-label">METHOD OF PAYMENT</div></td>
          <td style="width: 8%;"><div class="acord-label">AUDIT</div></td>
          <td style="width: 9%;"><div class="acord-label">DEPOSIT</div><div class="acord-value" style="font-size:7px;">$</div></td>
          <td style="width: 9%;"><div class="acord-label">MINIMUM PREMIUM</div><div class="acord-value" style="font-size:7px;">$</div></td>
          <td style="width: 10%;"><div class="acord-label">POLICY PREMIUM</div><div class="acord-value" style="font-size:7px;">$</div></td>
        </tr>
      </table>

      <!-- APPLICANT INFORMATION -->
      <div class="acord-section-header" style="margin-top:2px;">APPLICANT INFORMATION</div>
      
      <!-- APPLICANT BLOCKS CONBINED -->
      <table class="acord-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        \${[1,2,3].map((num) => \`
        <tr>
            <td class="p-0 \${num < 3 ? 'b-bottom' : ''}" style="\${num < 3 ? 'border-bottom: 2px solid #000 !important;' : ''}">
                <table class="acord-table b-none">
                    <tr>
                        <td style="width:50%; padding:0;" class="b-none b-right">
                            <table class="acord-table b-none" style="height:100%;">
                                <tr>
                                    <td class="b-none" style="height:60px; vertical-align:top; border-bottom: 1px solid #000 !important;">
                                        <div class="acord-label">NAME (\${num === 1 ? 'First' : 'Other'} Named Insured) AND MAILING ADDRESS (Including ZIP+4)</div>
                                        <div class="acord-value">\${num === 1 ? data.applicantName || '' : ''}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="b-none p-0">
                                        <table class="acord-table b-none" style="height:100%;">
                                            <tr>
                                                <td class="b-none b-right b-bottom" style="width:25%; padding: 2px 4px;"><div class="acord-checkbox"></div> <span style="font-size:6px;">CORPORATION</span></td>
                                                <td class="b-none b-right b-bottom" style="width:30%; padding: 2px 4px;"><div class="acord-checkbox"></div> <span style="font-size:6px;">JOINT VENTURE</span></td>
                                                <td class="b-none b-bottom" style="width:45%; padding: 2px 4px;"><div class="acord-checkbox"></div> <span style="font-size:6px;">NOT FOR PROFIT ORG</span></td>
                                            </tr>
                                            <tr>
                                                <td class="b-none b-right" style="padding: 2px 4px;"><div class="acord-checkbox"></div> <span style="font-size:6px;">INDIVIDUAL</span></td>
                                                <td class="b-none b-right" style="padding: 2px 4px;">
                                                    <div class="acord-checkbox"></div> <span style="font-size:6px;">LLC</span> 
                                                    <span style="font-size:4.5px; line-height:1; display:inline-block; vertical-align:middle; margin-left:2px;">NO. OF MEMBERS<br/>AND MANAGERS: ____</span>
                                                </td>
                                                <td class="b-none" style="padding: 2px 4px;"><div class="acord-checkbox"></div> <span style="font-size:6px;">PARTNERSHIP</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="width:50%; padding:0;" class="b-none">
                            <table class="acord-table b-none" style="height:100%;">
                                <tr>
                                    <td class="b-none b-right b-bottom" style="width:20%;"><div class="acord-label">GL CODE</div></td>
                                    <td class="b-none b-right b-bottom" style="width:15%;"><div class="acord-label">SIC</div></td>
                                    <td class="b-none b-right b-bottom" style="width:25%;"><div class="acord-label">NAICS</div><div class="acord-value" style="font-size:7px;">\${num === 1 ? data.naics || '' : ''}</div></td>
                                    <td class="b-none b-bottom" style="width:40%;"><div class="acord-label">FEIN OR SOC SEC #</div><div class="acord-value" style="font-size:7px;">\${num === 1 ? data.fein || '' : ''}</div></td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="b-none b-bottom" style="height:22px;">
                                        <div class="acord-label">BUSINESS PHONE #:</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="b-none b-bottom" style="height:22px;">
                                        <div class="acord-label">WEBSITE ADDRESS</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="b-none p-0">
                                        <table class="acord-table b-none" style="height: 100%;">
                                            <tr>
                                                <td class="b-none b-bottom" style="padding: 2px 4px; width:70%; border-right: 1px solid #000 !important;"><div class="acord-checkbox"></div> <span style="font-size:6px;">SUBCHAPTER "S" CORPORATION</span></td>
                                                <td class="b-none b-bottom" style="padding: 2px 4px; border-left: 1px solid #000 !important;"></td>
                                            </tr>
                                            <tr>
                                                <td class="b-none" style="padding: 2px 4px; width:70%; border-right: 1px solid #000 !important;"><div class="acord-checkbox"></div> <span style="font-size:6px;">TRUST</span></td>
                                                <td class="b-none" style="padding: 2px 4px; border-left: 1px solid #000 !important;"></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        \`).join('')}
      </table>
      
      <!-- FOOTER -->
      <div style="position:absolute; bottom: 0.25in; left: 0.35in; right: 0.35in; font-size:7px; font-weight:bold;">
         <div style="float:left;">ACORD 125 (2009/08)</div>
         <div style="float:right;">&copy; 1993-2009 ACORD CORPORATION. All rights reserved.</div>
         <div style="text-align:center; font-size:8px;">Page 1 of 4</div>
         <div style="text-align:center; font-size:7px; margin-top:2px;">The ACORD name and logo are registered marks of ACORD</div>
      </div>
    </div>
  \`;
}
`;
}

let content = fs.readFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', 'utf8');

const startIdx = content.indexOf('export function generateAcord125FullForm');
const endIdx = content.indexOf('export async function generateApplicationPacketHTML');

if (startIdx !== -1 && endIdx !== -1) {
    content = content.substring(0, startIdx) + getPage1Html() + content.substring(endIdx);
    fs.writeFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', content);
    console.log("Updated function successfully");
} else {
    console.error("Could not find start/end marks");
}
