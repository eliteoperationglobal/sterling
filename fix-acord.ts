import * as fs from 'fs';

let content = fs.readFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', 'utf8');

// Find the start and end of generateAcord125FullForm
const startIdx = content.indexOf('export function generateAcord125FullForm');
const endIdx = content.indexOf('export async function generateApplicationPacketHTML');

if (startIdx !== -1 && endIdx !== -1) {
    const newFunc = `export function generateAcord125FullForm(data: ApplicationPacketData): string {
  const css = \`
    .acord125-page {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 8px;
      line-height: 1.1;
      color: #000;
      width: 8.5in;
      height: 11in;
      padding: 0.15in 0.25in 0.2in 0.25in;
      margin: 0 auto;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      background-color: #fff;
    }
    .acord125-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
      margin-bottom: 2px;
    }
    .acord125-table td, .acord125-table th {
      border: 1px solid #000;
      padding: 0px 2px;
      vertical-align: top;
      overflow: hidden;
    }
    .acord125-label {
      font-size: 6px;
      font-weight: bold;
      text-transform: uppercase;
      padding-bottom: 0px;
    }
    .acord125-value {
      font-size: 8px;
      min-height: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: bold;
      margin-top: 1px;
    }
    .acord125-section-title {
      background-color: #000;
      color: #fff;
      font-weight: bold;
      font-size: 8px;
      padding: 2px 4px;
      margin-top: 3px;
      text-transform: uppercase;
      border: 1px solid #000;
    }
    .acord125-checkbox {
      display: inline-block;
      width: 6px;
      height: 6px;
      border: 1px solid #000;
      margin-right: 2px;
      vertical-align: middle;
      background-color: #fff;
    }
    .acord125-header-container {
      display: table;
      width: 100%;
      margin-bottom: 3px;
    }
    .acord125-header-left, .acord125-header-center, .acord125-header-right {
      display: table-cell;
      vertical-align: top;
    }
    .acord125-header-left { width: 25%; font-family: 'Arial Black', Impact, sans-serif; font-size: 19px; font-weight: 900; font-style: italic; letter-spacing:-0.5px; }
    .acord125-header-center { width: 50%; text-align: center; font-size: 15px; font-weight: bold; padding-top:2px; line-height:1.2; }
    .acord125-header-right { width: 25%; text-align: right; }
    .acord125-header-right-box {
      border: 1px solid #000;
      display: inline-block;
      text-align: left;
      width: 110px;
      float: right;
      padding: 1px 3px;
    }
    .inner-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
    .inner-table td { border: none; padding: 0 2px; }
    .b-right { border-right: 1px solid #000 !important; }
    .b-bottom { border-bottom: 1px solid #000 !important; }
    .b-top { border-top: 1px solid #000 !important; }
    .b-left { border-left: 1px solid #000 !important; }
    .flex-col { display: flex; flex-direction: column; height: 100%; }
    .flex-row { display: flex; flex-direction: row; }
    .flex-1 { flex: 1; }
  \`;

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
    <style>\${css}</style>
    <!-- PAGE 1 -->
    <div class="page acord125-page" style="page-break-after: always; position:relative;">
      
      <!-- HEADER -->
      <div class="acord125-header-container">
        <div class="acord125-header-left">ACORD<sup style="font-size:10px;">&reg;</sup></div>
        <div class="acord125-header-center">COMMERCIAL INSURANCE APPLICATION<br/><span style="font-size:11px;">APPLICANT INFORMATION SECTION</span></div>
        <div class="acord125-header-right">
          <div class="acord125-header-right-box">
             <div class="acord125-label" style="border-bottom:1px solid #000; padding-bottom:1px;">DATE (MM/DD/YYYY)</div>
             <div class="acord125-value"></div>
          </div>
        </div>
      </div>

      <!-- TOP SECTION (Split 50/50) -->
      <table class="acord125-table" style="border: 2px solid #000;">
        <tr>
          <td style="width:50%; padding:0; border-right:2px solid #000;">
            <table class="inner-table" style="height: 100%;">
              <tr>
                <td class="b-bottom" style="height: 48px;">
                  <div class="acord125-label">AGENCY</div>
                  <div class="acord125-value" style="font-size:9px;">\${data.agencyName || ''}</div>
                </td>
              </tr>
              <tr>
                <td class="b-bottom" style="height: 18px;">
                  <div class="acord125-label" style="display:inline-block; width:60px;">CONTACT NAME:</div>
                  <span class="acord125-value" style="font-size:9px;">\${data.contactName || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-bottom" style="height: 18px;">
                  <div class="acord125-label" style="display:inline-block; width:90px;">PHONE (A/C, No, Ext):</div>
                  <span class="acord125-value">\${data.phone || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-bottom" style="height: 18px;">
                  <div class="acord125-label" style="display:inline-block; width:90px;">FAX (A/C, No, Ext):</div>
                  <span class="acord125-value"></span>
                </td>
              </tr>
              <tr>
                <td class="b-bottom" style="height: 18px;">
                  <div class="acord125-label" style="display:inline-block; width:90px;">E-MAIL ADDRESS:</div>
                  <span class="acord125-value">\${data.email || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="b-bottom" style="padding:0;">
                  <table class="inner-table">
                    <tr>
                      <td style="width:50%;" class="b-right"><div class="acord125-label">CODE:</div></td>
                      <td style="width:50%;"><div class="acord125-label">SUBCODE:</div></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="height: 18px;">
                  <div class="acord125-label" style="display:inline-block;">AGENCY CUSTOMER ID:</div>
                </td>
              </tr>
            </table>
          </td>
          
          <td style="width:50%; padding:0;">
            <table class="inner-table" style="height: 100%;">
              <tr>
                <td style="width:70%; height:24px;" class="b-bottom b-right">
                  <div class="acord125-label">CARRIER</div>
                  <div class="acord125-value">\${data.carrier || ''}</div>
                </td>
                <td style="width:30%; height:24px;" class="b-bottom">
                  <div class="acord125-label">NAIC CODE</div>
                  <div class="acord125-value"></div>
                </td>
              </tr>
              <tr>
                <td style="height:24px;" class="b-bottom b-right">
                  <div class="acord125-label">COMPANY POLICY OR PROGRAM NAME</div>
                  <div class="acord125-value"></div>
                </td>
                <td style="height:24px;" class="b-bottom">
                  <div class="acord125-label">PROGRAM CODE</div>
                  <div class="acord125-value"></div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="height:24px;" class="b-bottom">
                  <div class="acord125-label">POLICY NUMBER</div>
                  <div class="acord125-value">\${data.policyNumber || ''}</div>
                </td>
              </tr>
              <tr>
                <td style="height:24px;" class="b-bottom b-right">
                  <div class="acord125-label">UNDERWRITER</div>
                </td>
                <td style="height:24px;" class="b-bottom">
                  <div class="acord125-label">UNDERWRITER OFFICE</div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding:0;">
                  <table class="inner-table" style="height:100%;">
                    <tr>
                      <td style="width:30%; vertical-align:top;" class="b-right">
                        <div class="acord125-label">STATUS OF TRANSACTION</div>
                      </td>
                      <td style="width:70%; padding:0;">
                        <table class="inner-table">
                          <tr>
                            <td class="b-bottom" style="padding:2px;"><div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">QUOTE</span> &nbsp;&nbsp;&nbsp;&nbsp; <div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">ISSUE POLICY</span> &nbsp;&nbsp;&nbsp;&nbsp; <div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">RENEW</span></td>
                          </tr>
                          <tr>
                            <td class="b-bottom" style="padding:2px;"><div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">BOUND (Give Date and/or Attach Copy):</span><br/>
                              &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:6px;font-weight:bold;">DATE</span> &nbsp;&nbsp;&nbsp;&nbsp; <span style="font-size:6px;font-weight:bold;">TIME</span> &nbsp;&nbsp;&nbsp;&nbsp; <div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">AM</span> &nbsp; <div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">PM</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:2px;"><div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">CHANGE</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <div class="acord125-checkbox"></div> <span style="font-size:6px;font-weight:bold;">CANCEL</span></td>
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
      <div class="acord125-section-title">SECTIONS ATTACHED</div>
      <table class="acord125-table">
        <tr>
          <td style="width:3%; background:#fff; border-bottom:1px solid #000;"></td>
          <td style="width:23%; background:#fff; border-bottom:1px solid #000; border-right:1px solid #000;"><div class="acord125-label">INDICATE SECTIONS ATTACHED</div></td>
          <td style="width:7%; background:#fff; border-bottom:1px solid #000; border-right:1px solid #000;"><div class="acord125-label">PREMIUM</div></td>
          <td style="width:3%; background:#fff; border-bottom:1px solid #000;"></td>
          <td style="width:23%; background:#fff; border-bottom:1px solid #000; border-right:1px solid #000;"></td>
          <td style="width:7%; background:#fff; border-bottom:1px solid #000; border-right:1px solid #000;"><div class="acord125-label">PREMIUM</div></td>
          <td style="width:3%; background:#fff; border-bottom:1px solid #000;"></td>
          <td style="width:23%; background:#fff; border-bottom:1px solid #000; border-right:1px solid #000;"></td>
          <td style="width:7%; background:#fff; border-bottom:1px solid #000;"><div class="acord125-label">PREMIUM</div></td>
        </tr>
        \${sectionsAttachedData[0].map((item, i) => \`
          <tr>
             <td style="border-right:1px solid #000; border-bottom:1px solid #000; text-align:center; padding:1px;"><div class="acord125-checkbox"></div></td>
             <td style="font-size:6.5px; border-right:1px solid #000; border-bottom:1px solid #000;">\${item}</td>
             <td style="border-right:1px solid #000; border-bottom:1px solid #000; font-size:6px;">$</td>
             <td style="border-right:1px solid #000; border-bottom:1px solid #000; text-align:center; padding:1px;"><div class="acord125-checkbox" style="\${!sectionsAttachedData[1][i] ? 'display:none;' : ''}"></div></td>
             <td style="font-size:6.5px; border-right:1px solid #000; border-bottom:1px solid #000;">\${sectionsAttachedData[1][i]}</td>
             <td style="border-right:1px solid #000; border-bottom:1px solid #000; font-size:6px;">\${sectionsAttachedData[1][i] ? '$' : ''}</td>
             <td style="border-right:1px solid #000; border-bottom:1px solid #000; text-align:center; padding:1px;"><div class="acord125-checkbox" style="\${!sectionsAttachedData[2][i] ? 'display:none;' : ''}"></div></td>
             <td style="font-size:6.5px; border-right:1px solid #000; border-bottom:1px solid #000;">\${sectionsAttachedData[2][i]}</td>
             <td style="border-bottom:1px solid #000; font-size:6px;">\${sectionsAttachedData[2][i] ? '$' : ''}</td>
          </tr>
        \`).join('')}
      </table>
      
      <!-- ATTACHMENTS -->
      <div class="acord125-section-title">ATTACHMENTS</div>
      <table class="acord125-table">
        \${attachmentsData[0].map((item, i) => \`
          <tr>
             <td style="width:3%; border-right:1px solid #000; border-bottom:1px solid #000; text-align:center; padding:1px;"><div class="acord125-checkbox"></div></td>
             <td style="width:40%; font-size:6.5px; border-right:1px solid #000; border-bottom:1px solid #000;">\${item}</td>
             <td style="width:7%; border-right:1px solid #000; border-bottom:1px solid #000;"></td>
             <td style="width:3%; border-right:1px solid #000; border-bottom:1px solid #000; text-align:center; padding:1px;"><div class="acord125-checkbox" style="\${!attachmentsData[1][i] ? 'display:none;' : ''}"></div></td>
             <td style="width:40%; font-size:6.5px; border-right:1px solid #000; border-bottom:1px solid #000;">\${attachmentsData[1][i]}</td>
             <td style="width:7%; border-bottom:1px solid #000;"></td>
          </tr>
        \`).join('')}
      </table>

      <!-- POLICY INFORMATION -->
      <div class="acord125-section-title">POLICY INFORMATION</div>
      <table class="acord125-table">
        <tr>
          <td style="width: 10%;"><div class="acord125-label">PROPOSED EFF DATE</div><div class="acord125-value">\${data.effectiveDate || ''}</div></td>
          <td style="width: 10%;"><div class="acord125-label">PROPOSED EXP DATE</div><div class="acord125-value">\${data.expirationDate || ''}</div></td>
          <td style="width: 16%; padding:0;">
             <table class="inner-table" style="height:100%;">
                <tr><td colspan="2" class="b-bottom" style="text-align:center;"><div class="acord125-label">BILLING PLAN</div></td></tr>
                <tr>
                  <td style="text-align:center;" class="b-right"><div class="acord125-checkbox"></div><span style="font-size:6px;font-weight:bold;">DIRECT</span></td>
                  <td style="text-align:center;"><div class="acord125-checkbox"></div><span style="font-size:6px;font-weight:bold;">AGENCY</span></td>
                </tr>
             </table>
          </td>
          <td style="width: 14%;"><div class="acord125-label">PAYMENT PLAN</div></td>
          <td style="width: 14%;"><div class="acord125-label">METHOD OF PAYMENT</div></td>
          <td style="width: 8%;"><div class="acord125-label">AUDIT</div></td>
          <td style="width: 9%;"><div class="acord125-label">DEPOSIT</div><div style="font-size:6px;">$</div></td>
          <td style="width: 9%;"><div class="acord125-label">MINIMUM<br/>PREMIUM</div><div style="font-size:6px;">$</div></td>
          <td style="width: 10%;"><div class="acord125-label">POLICY PREMIUM</div><div style="font-size:6px;">$</div></td>
        </tr>
      </table>

      <!-- APPLICANT INFORMATION -->
      <div class="acord125-section-title">APPLICANT INFORMATION</div>
      
      <div class="flex-col flex-1">
        <!-- APPLICANT BLOCK 1 -->
        <table class="acord125-table flex-1" style="height:100%;">
          <tr>
            <td style="width:50%; padding:0; border-right:2px solid #000;">
               <table class="inner-table" style="height:100%;">
                  <tr><td style="vertical-align:top; border-bottom:1px solid #000; height:60%;">
                     <div class="acord125-label">NAME (First Named Insured) AND MAILING ADDRESS (Including ZIP+4)</div>
                     <div class="acord125-value"></div>
                  </td></tr>
               </table>
            </td>
            <td style="width:50%; padding:0;">
               <table class="inner-table" style="height:100%;">
                  <tr>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">GL CODE</div></td>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">SIC</div></td>
                     <td style="width:25%;" class="b-bottom b-right"><div class="acord125-label">NAICS</div><div class="acord125-value" style="font-size:7px;">\${data.naics || ''}</div></td>
                     <td style="width:35%;" class="b-bottom"><div class="acord125-label">FEIN OR SOC SEC #</div><div class="acord125-value" style="font-size:7px;">\${data.fein || ''}</div></td>
                  </tr>
                  <tr>
                     <td colspan="4" class="b-bottom" style="height:33%;">
                        <div class="acord125-label">BUSINESS PHONE #:</div>
                     </td>
                  </tr>
                  <tr>
                     <td colspan="4" style="height:33%;">
                        <div class="acord125-label">WEBSITE ADDRESS</div>
                     </td>
                  </tr>
               </table>
            </td>
          </tr>
        </table>
        <table class="acord125-table" style="margin-top:-2px; border-top:none; margin-bottom:0;">
          <tr>
             <td style="width:20%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">CORPORATION</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">JOINT VENTURE</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">NOT FOR PROFIT ORG</span></td>
             <td style="width:30%; border-top:none;" colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">SUBCHAPTER "S" CORPORATION</span></td>
          </tr>
          <tr>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">INDIVIDUAL</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">LLC</span> &nbsp; <span style="font-size:5px; line-height:1;">NO. OF MEMBERS<br/>AND MANAGERS: ____</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">PARTNERSHIP</span></td>
             <td colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">TRUST</span></td>
          </tr>
        </table>

        <!-- APPLICANT BLOCK 2 -->
        <table class="acord125-table flex-1" style="height:100%; margin-top:-1px;">
          <tr>
            <td style="width:50%; padding:0; border-right:2px solid #000;">
               <table class="inner-table" style="height:100%;">
                  <tr><td style="vertical-align:top; border-bottom:1px solid #000; height:60%;">
                     <div class="acord125-label">NAME (Other Named Insured) AND MAILING ADDRESS (Including ZIP+4)</div>
                     <div class="acord125-value"></div>
                  </td></tr>
               </table>
            </td>
            <td style="width:50%; padding:0;">
               <table class="inner-table" style="height:100%;">
                  <tr>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">GL CODE</div></td>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">SIC</div></td>
                     <td style="width:25%;" class="b-bottom b-right"><div class="acord125-label">NAICS</div></td>
                     <td style="width:35%;" class="b-bottom"><div class="acord125-label">FEIN OR SOC SEC #</div></td>
                  </tr>
                  <tr>
                     <td colspan="4" class="b-bottom" style="height:33%;">
                        <div class="acord125-label">BUSINESS PHONE #:</div>
                     </td>
                  </tr>
                  <tr>
                     <td colspan="4" style="height:33%;">
                        <div class="acord125-label">WEBSITE ADDRESS</div>
                     </td>
                  </tr>
               </table>
            </td>
          </tr>
        </table>
        <table class="acord125-table" style="margin-top:-2px; border-top:none; margin-bottom:0;">
          <tr>
             <td style="width:20%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">CORPORATION</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">JOINT VENTURE</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">NOT FOR PROFIT ORG</span></td>
             <td style="width:30%; border-top:none;" colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">SUBCHAPTER "S" CORPORATION</span></td>
          </tr>
          <tr>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">INDIVIDUAL</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">LLC</span> &nbsp; <span style="font-size:5px; line-height:1;">NO. OF MEMBERS<br/>AND MANAGERS: ____</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">PARTNERSHIP</span></td>
             <td colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">TRUST</span></td>
          </tr>
        </table>

         <!-- APPLICANT BLOCK 3 -->
        <table class="acord125-table flex-1" style="height:100%; margin-top:-1px;">
          <tr>
            <td style="width:50%; padding:0; border-right:2px solid #000;">
               <table class="inner-table" style="height:100%;">
                  <tr><td style="vertical-align:top; border-bottom:1px solid #000; height:60%;">
                     <div class="acord125-label">NAME (Other Named Insured) AND MAILING ADDRESS (Including ZIP+4)</div>
                     <div class="acord125-value"></div>
                  </td></tr>
               </table>
            </td>
            <td style="width:50%; padding:0;">
               <table class="inner-table" style="height:100%;">
                  <tr>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">GL CODE</div></td>
                     <td style="width:20%;" class="b-bottom b-right"><div class="acord125-label">SIC</div></td>
                     <td style="width:25%;" class="b-bottom b-right"><div class="acord125-label">NAICS</div></td>
                     <td style="width:35%;" class="b-bottom"><div class="acord125-label">FEIN OR SOC SEC #</div></td>
                  </tr>
                  <tr>
                     <td colspan="4" class="b-bottom" style="height:33%;">
                        <div class="acord125-label">BUSINESS PHONE #:</div>
                     </td>
                  </tr>
                  <tr>
                     <td colspan="4" style="height:33%;">
                        <div class="acord125-label">WEBSITE ADDRESS</div>
                     </td>
                  </tr>
               </table>
            </td>
          </tr>
        </table>
        <table class="acord125-table" style="margin-top:-2px; border-top:none; margin-bottom:0;">
          <tr>
             <td style="width:20%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">CORPORATION</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">JOINT VENTURE</span></td>
             <td style="width:25%; border-top:none;"><div class="acord125-checkbox"></div> <span style="font-size:6px;">NOT FOR PROFIT ORG</span></td>
             <td style="width:30%; border-top:none;" colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">SUBCHAPTER "S" CORPORATION</span></td>
          </tr>
          <tr>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">INDIVIDUAL</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">LLC</span> &nbsp; <span style="font-size:5px; line-height:1;">NO. OF MEMBERS<br/>AND MANAGERS: ____</span></td>
             <td><div class="acord125-checkbox"></div> <span style="font-size:6px;">PARTNERSHIP</span></td>
             <td colspan="2"><div class="acord125-checkbox"></div> <span style="font-size:6px;">TRUST</span></td>
          </tr>
        </table>
      </div>
      
      <!-- FOOTER -->
      <div style="position:absolute; bottom:-10px; left:0; right:0; font-size:7px; font-weight:bold;">
         <div style="float:left;">ACORD 125 (2009/08)</div>
         <div style="float:right;">&copy; 1993-2009 ACORD CORPORATION. All rights reserved.</div>
         <div style="text-align:center; font-size:8px;">Page 1 of 4</div>
         <div style="text-align:center; font-size:7px; margin-top:2px;">The ACORD name and logo are registered marks of ACORD</div>
      </div>
    </div>
  \`;
}
`;
    content = content.substring(0, startIdx) + newFunc + content.substring(endIdx);
    fs.writeFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', content);
    console.log("Updated function successfully");
} else {
    console.error("Could not find start/end marks");
}
