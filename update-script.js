const fs = require('fs');
let content = fs.readFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', 'utf8');

const newFunc = `export function generateAcord125Page1(data: any): string {
  const sectionsAttachedData = [
    ['ACCOUNTS RECEIVABLE / VALUABLE PAPERS', 'BOILER & MACHINERY', 'BUSINESS AUTO', 'BUSINESS OWNERS', 'COMMERCIAL GENERAL LIABILITY', 'CRIME / MISCELLANEOUS CRIME', 'DEALERS'],
    ['ELECTRONIC DATA PROC', 'EQUIPMENT FLOATER', 'GARAGE AND DEALERS', 'GLASS AND SIGN', 'INSTALLATION / BUILDERS RISK', 'OPEN CARGO', 'PROPERTY'],
    ['TRANSPORTATION / MOTOR TRUCK CARGO', 'TRUCKERS / MOTOR CARRIER', 'UMBRELLA', 'YACHT', '', '', '']
  ];

  const attachmentsData = [
    ['ADDITIONAL INTEREST', 'ADDITIONAL PREMISES', 'APARTMENT BUILDING SUPPLEMENT', 'CONDO ASSN BYLAWS (for D&O Coverage only)', 'CONTRACTORS SUPPLEMENT', 'COVERAGES SCHEDULE', 'DRIVER INFORMATION SCHEDULE', 'INTERNATIONAL LIABILITY EXPOSURE SUPPLEMENT', 'INTERNATIONAL PROPERTY EXPOSURE SUPPLEMENT', 'LOSS SUMMARY'],
    ['PREMIUM PAYMENT SUPPLEMENT', 'PROFESSIONAL LIABILITY SUPPLEMENT', 'RESTAURANT / TAVERN SUPPLEMENT', 'STATEMENT / SCHEDULE OF VALUES', 'STATE SUPPLEMENT (If applicable)', 'VACANT BUILDING SUPPLEMENT', 'VEHICLE SCHEDULE', '', '', '']
  ];

  const css = \`
    .acord125pg1 {
      font-family: Arial, Helvetica, sans-serif;
      width: 8.5in;
      height: 11in;
      padding: 0.25in 0.3in 0.3in 0.3in;
      box-sizing: border-box;
      background-color: #fff;
      color: #000;
      font-size: 8px;
    }
    .ac125-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }
    .ac125-table td {
      border: 1px solid #000;
      vertical-align: top;
      padding: 0px 2px;
      overflow: hidden;
    }
    .ac125-lbl {
      font-size: 5.5px;
      font-weight: bold;
      text-transform: uppercase;
      line-height: 1.1;
    }
    .ac125-val {
      font-size: 8px;
      min-height: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: bold;
      margin-top: 1px;
    }
    .ac125-sh {
      background-color: #e5e5e5;
      font-size: 8px;
      font-weight: bold;
      text-transform: uppercase;
      padding: 2px 4px;
      border: 1px solid #000;
      border-bottom: none;
      margin-top: 3px;
    }
    .ac125-chk {
      display: inline-block;
      width: 6px;
      height: 6px;
      border: 1px solid #000;
      margin-right: 2px;
      vertical-align: middle;
      background-color: #fff;
    }
    .ac125-bn { border: none !important; }
    .ac125-bt { border-top: 1px solid #000 !important; }
    .ac125-br { border-right: 1px solid #000 !important; }
    .ac125-bb { border-bottom: 1px solid #000 !important; }
    .ac125-bl { border-left: 1px solid #000 !important; }
    .ac125-p0 { padding: 0 !important; }
    .ac125-tc { text-align: center; }
  \`;

  return \`
    <style>\${css}</style>
    <div class="page acord125pg1" style="page-break-after: always; position:relative;">
      
      <!-- HEADER ROW -->
      <table class="ac125-table ac125-bn" style="margin-bottom: 2px;">
        <tr>
          <td class="ac125-bn" style="width: 25%; vertical-align: bottom;">
            <div style="font-family: 'Arial Black', Impact, sans-serif; font-size: 24px; font-weight: 900; font-style: italic; letter-spacing: -0.5px; line-height: 0.8;">ACORD<sup style="font-size:10px; font-weight:bold; font-style:normal;">&reg;</sup></div>
          </td>
          <td class="ac125-bn ac125-tc" style="width: 50%; vertical-align: bottom;">
            <div style="font-size: 14px; font-weight: bold; line-height: 1.1;">COMMERCIAL INSURANCE APPLICATION</div>
            <div style="font-size: 10px; font-weight: bold; margin-top:1px;">APPLICANT INFORMATION SECTION</div>
          </td>
          <td class="ac125-bn" style="width: 25%; vertical-align: top;">
            <table class="ac125-table" style="width: 120px; float: right; border: 2px solid #000;">
              <tr>
                <td style="padding: 1px 3px; border:none;">
                  <div class="ac125-lbl" style="border-bottom: 1px solid #000; padding-bottom: 1px;">DATE (MM/DD/YYYY)</div>
                  <div class="ac125-val">\${data.effectiveDate || ''}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

      <!-- SPLIT BLOCK: AGENCY / CARRIER -->
      <table class="ac125-table" style="border: 2px solid #000;">
        <tr>
          <!-- LEFT SIDE (AGENCY) -->
          <td style="width: 50%; padding: 0; border-right: 2px solid #000;">
            <table class="ac125-table ac125-bn" style="height: 100%;">
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 48px;">
                  <div class="ac125-lbl">AGENCY</div>
                  <div class="ac125-val">\${data.agencyName || ''}</div>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 18px;">
                  <span class="ac125-lbl" style="display:inline-block; width:65px;">CONTACT<br/>NAME:</span>
                  <span class="ac125-val">\${data.contactName || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 18px;">
                  <span class="ac125-lbl" style="display:inline-block; width:65px;">PHONE<br/>(A/C, No, Ext):</span>
                  <span class="ac125-val">\${data.phone || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 18px;">
                  <span class="ac125-lbl" style="display:inline-block; width:65px;">FAX<br/>(A/C, No):</span>
                  <span class="ac125-val"></span>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 18px;">
                  <span class="ac125-lbl" style="display:inline-block; width:65px;">E-MAIL<br/>ADDRESS:</span>
                  <span class="ac125-val">\${data.email || ''}</span>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb ac125-p0">
                  <table class="ac125-table ac125-bn">
                    <tr>
                      <td class="ac125-bn ac125-br" style="width:50%; height:18px;"><div class="ac125-lbl">CODE:</div></td>
                      <td class="ac125-bn" style="width:50%;"><div class="ac125-lbl">SUBCODE:</div></td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn" style="height: 18px;">
                  <div class="ac125-lbl">AGENCY CUSTOMER ID:</div>
                </td>
              </tr>
            </table>
          </td>
          
          <!-- RIGHT SIDE (CARRIER) -->
          <td style="width: 50%; padding: 0;">
            <table class="ac125-table ac125-bn" style="height: 100%;">
              <tr>
                <td class="ac125-bn ac125-bb ac125-p0" style="height: 24px;">
                  <table class="ac125-table ac125-bn">
                    <tr>
                      <td class="ac125-bn ac125-br" style="width:70%;">
                        <div class="ac125-lbl">CARRIER</div>
                        <div class="ac125-val">\${data.carrier || ''}</div>
                      </td>
                      <td class="ac125-bn" style="width:30%;">
                        <div class="ac125-lbl">NAIC CODE</div>
                        <div class="ac125-val"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb ac125-p0" style="height: 24px;">
                  <table class="ac125-table ac125-bn">
                    <tr>
                      <td class="ac125-bn ac125-br" style="width:70%;">
                        <div class="ac125-lbl">COMPANY POLICY OR PROGRAM NAME</div>
                        <div class="ac125-val"></div>
                      </td>
                      <td class="ac125-bn" style="width:30%;">
                        <div class="ac125-lbl">PROGRAM CODE</div>
                        <div class="ac125-val"></div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb" style="height: 24px;">
                  <div class="ac125-lbl">POLICY NUMBER</div>
                  <div class="ac125-val">\${data.policyNumber || ''}</div>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-bb ac125-p0" style="height: 24px;">
                  <table class="ac125-table ac125-bn">
                    <tr>
                      <td class="ac125-bn ac125-br" style="width:60%;">
                        <div class="ac125-lbl">UNDERWRITER</div>
                      </td>
                      <td class="ac125-bn" style="width:40%;">
                        <div class="ac125-lbl">UNDERWRITER OFFICE</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td class="ac125-bn ac125-p0">
                  <table class="ac125-table ac125-bn" style="height: 100%;">
                    <tr>
                      <td class="ac125-bn ac125-br" style="width:25%;">
                        <div class="ac125-lbl">STATUS OF<br/>TRANSACTION</div>
                      </td>
                      <td class="ac125-bn ac125-p0" style="width:75%;">
                        <table class="ac125-table ac125-bn" style="height: 100%;">
                          <tr>
                            <td class="ac125-bn ac125-bb" style="padding: 2px;">
                              <div class="ac125-chk"></div> <span style="font-size:6.5px; font-weight:bold;">QUOTE</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <div class="ac125-chk"></div> <span style="font-size:6.5px; font-weight:bold;">ISSUE POLICY</span> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                              <div class="ac125-chk"></div> <span style="font-size:6.5px; font-weight:bold;">RENEW</span>
                            </td>
                          </tr>
                          <tr>
                            <td class="ac125-bn ac125-bb" style="padding: 2px;">
                              <div class="ac125-chk"></div> <span style="font-size:6.5px; font-weight:bold;">BOUND (Give Date and/or Attach Copy):</span><br/>
                              <table style="width:100%; font-size:6.5px; font-weight:bold; margin-top:2px;">
                                <tr>
                                  <td style="width:20%;">CHANGE</td>
                                  <td style="width:40%; text-align:center;">DATE</td>
                                  <td style="width:40%; text-align:right;">TIME &nbsp;&nbsp;&nbsp; <div class="ac125-chk"></div> AM &nbsp; <div class="ac125-chk"></div> PM</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td class="ac125-bn" style="padding: 2px;">
                              <div class="ac125-chk"></div> <span style="font-size:6.5px; font-weight:bold;">CANCEL</span>
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
      <div class="ac125-sh">SECTIONS ATTACHED</div>
      <table class="ac125-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <!-- COLUMN 1 -->
          <td style="width:33.33%; padding:0;" class="ac125-br">
             <table class="ac125-table ac125-bn">
                <tr>
                   <td style="width:10%;" class="ac125-bn ac125-br ac125-bb"></td>
                   <td style="width:75%;" class="ac125-bn ac125-br ac125-bb"><div class="ac125-lbl">INDICATE SECTIONS ATTACHED</div></td>
                   <td style="width:15%;" class="ac125-bn ac125-bb"><div class="ac125-lbl">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[0].map((item: string, i: number) => \`
                <tr>
                   <td class="ac125-bn ac125-br ac125-bb ac125-tc" style="padding: 1px;"><div class="ac125-chk"></div></td>
                   <td class="ac125-bn ac125-br ac125-bb" style="font-size:6.5px; font-weight:bold;">\${item}</td>
                   <td class="ac125-bn ac125-bb" style="font-size:6.5px; font-weight:bold;">$</td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <!-- COLUMN 2 -->
          <td style="width:33.33%; padding:0;" class="ac125-br">
             <table class="ac125-table ac125-bn">
                <tr>
                   <td style="width:10%;" class="ac125-bn ac125-br ac125-bb"></td>
                   <td style="width:75%;" class="ac125-bn ac125-br ac125-bb"></td>
                   <td style="width:15%;" class="ac125-bn ac125-bb"><div class="ac125-lbl">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[1].map((item: string, i: number) => \`
                <tr>
                   <td class="ac125-bn ac125-br ac125-bb ac125-tc" style="padding: 1px;"><div class="ac125-chk" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td class="ac125-bn ac125-br ac125-bb" style="font-size:6.5px; font-weight:bold;">\${item}</td>
                   <td class="ac125-bn ac125-bb" style="font-size:6.5px; font-weight:bold;">\${item ? '$' : ''}</td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <!-- COLUMN 3 -->
          <td style="width:33.33%; padding:0;">
             <table class="ac125-table ac125-bn">
                <tr>
                   <td style="width:10%;" class="ac125-bn ac125-br ac125-bb"></td>
                   <td style="width:75%;" class="ac125-bn ac125-br ac125-bb"></td>
                   <td style="width:15%;" class="ac125-bn ac125-bb"><div class="ac125-lbl">PREMIUM</div></td>
                </tr>
                \${sectionsAttachedData[2].map((item: string, i: number) => \`
                <tr>
                   <td class="ac125-bn ac125-br ac125-bb ac125-tc" style="padding: 1px;"><div class="ac125-chk" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td class="ac125-bn ac125-br ac125-bb" style="font-size:6.5px; font-weight:bold;">\${item}</td>
                   <td class="ac125-bn ac125-bb" style="font-size:6.5px; font-weight:bold;">\${item ? '$' : ''}</td>
                </tr>
                \`).join('')}
             </table>
          </td>
        </tr>
      </table>

      <!-- ATTACHMENTS -->
      <div class="ac125-sh">ATTACHMENTS</div>
      <table class="ac125-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <!-- COLUMN 1 -->
          <td style="width:50%; padding:0;" class="ac125-br">
             <table class="ac125-table ac125-bn">
                \${attachmentsData[0].map((item: string, i: number) => \`
                <tr>
                   <td style="width:5%; padding: 1px;" class="ac125-bn ac125-br ac125-bb ac125-tc"><div class="ac125-chk" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td style="width:85%; font-size:6.5px; font-weight:bold;" class="ac125-bn ac125-br ac125-bb">\${item}</td>
                   <td style="width:10%;" class="ac125-bn ac125-bb"></td>
                </tr>
                \`).join('')}
             </table>
          </td>
          <!-- COLUMN 2 -->
          <td style="width:50%; padding:0;">
             <table class="ac125-table ac125-bn">
                \${attachmentsData[1].map((item: string, i: number) => \`
                <tr>
                   <td style="width:5%; padding: 1px;" class="ac125-bn ac125-br ac125-bb ac125-tc"><div class="ac125-chk" style="\${!item ? 'display:none;' : ''}"></div></td>
                   <td style="width:85%; font-size:6.5px; font-weight:bold;" class="ac125-bn ac125-br ac125-bb">\${item}</td>
                   <td style="width:10%;" class="ac125-bn ac125-bb"></td>
                </tr>
                \`).join('')}
             </table>
          </td>
        </tr>
      </table>

      <!-- POLICY INFORMATION -->
      <div class="ac125-sh">POLICY INFORMATION</div>
      <table class="ac125-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        <tr>
          <td style="width: 10%;"><div class="ac125-lbl">PROPOSED EFF DATE</div><div class="ac125-val">\${data.effectiveDate || ''}</div></td>
          <td style="width: 10%;"><div class="ac125-lbl">PROPOSED EXP DATE</div><div class="ac125-val">\${data.expirationDate || ''}</div></td>
          <td style="width: 16%; padding:0;">
             <table class="ac125-table ac125-bn" style="height:100%;">
                <tr><td colspan="2" class="ac125-bn ac125-bb ac125-tc"><div class="ac125-lbl">BILLING PLAN</div></td></tr>
                <tr>
                  <td class="ac125-bn ac125-br ac125-tc" style="height:18px;"><div class="ac125-chk"></div><span style="font-size:6px;font-weight:bold;">DIRECT</span></td>
                  <td class="ac125-bn ac125-tc" style="height:18px;"><div class="ac125-chk"></div><span style="font-size:6px;font-weight:bold;">AGENCY</span></td>
                </tr>
             </table>
          </td>
          <td style="width: 14%;"><div class="ac125-lbl">PAYMENT PLAN</div></td>
          <td style="width: 14%;"><div class="ac125-lbl">METHOD OF PAYMENT</div></td>
          <td style="width: 8%;"><div class="ac125-lbl">AUDIT</div></td>
          <td style="width: 9%;"><div class="ac125-lbl">DEPOSIT</div><div class="ac125-val" style="font-size:7px;">$</div></td>
          <td style="width: 9%;"><div class="ac125-lbl">MINIMUM PREMIUM</div><div class="ac125-val" style="font-size:7px;">$</div></td>
          <td style="width: 10%;"><div class="ac125-lbl">POLICY PREMIUM</div><div class="ac125-val" style="font-size:7px;">$</div></td>
        </tr>
      </table>

      <!-- APPLICANT INFORMATION -->
      <div class="ac125-sh">APPLICANT INFORMATION</div>
      
      <!-- APPLICANT BLOCKS COMBINED -->
      <table class="ac125-table" style="border: 2px solid #000; border-top: 1px solid #000;">
        \${[1,2,3].map((num: number) => \`
        <tr>
            <td class="ac125-p0" style="\${num < 3 ? 'border-bottom: 2px solid #000 !important;' : ''}">
                <table class="ac125-table ac125-bn">
                    <tr>
                        <td style="width:50%; padding:0;" class="ac125-bn ac125-br">
                            <table class="ac125-table ac125-bn" style="height:100%;">
                                <tr>
                                    <td class="ac125-bn ac125-bb" style="height:48px; vertical-align:top; border-bottom: 1px solid #000 !important;">
                                        <div class="ac125-lbl">NAME (\${num === 1 ? 'First' : 'Other'} Named Insured) AND MAILING ADDRESS (Including ZIP+4)</div>
                                        <div class="ac125-val">\${num === 1 ? data.applicantName || '' : ''}</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td class="ac125-bn ac125-p0">
                                        <table class="ac125-table ac125-bn" style="height:100%;">
                                            <tr>
                                                <td class="ac125-bn ac125-br ac125-bb" style="width:25%; padding: 2px 4px;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">CORPORATION</span></td>
                                                <td class="ac125-bn ac125-br ac125-bb" style="width:30%; padding: 2px 4px;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">JOINT VENTURE</span></td>
                                                <td class="ac125-bn ac125-bb" style="width:45%; padding: 2px 4px;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">NOT FOR PROFIT ORG</span></td>
                                            </tr>
                                            <tr>
                                                <td class="ac125-bn ac125-br" style="padding: 2px 4px;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">INDIVIDUAL</span></td>
                                                <td class="ac125-bn ac125-br" style="padding: 2px 4px;">
                                                    <div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">LLC</span> &nbsp;
                                                    <span style="font-size:4.5px; line-height:1; display:inline-block; vertical-align:middle;">NO. OF MEMBERS<br/>AND MANAGERS: ____</span>
                                                </td>
                                                <td class="ac125-bn" style="padding: 2px 4px;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">PARTNERSHIP</span></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                        <td style="width:50%; padding:0;" class="ac125-bn">
                            <table class="ac125-table ac125-bn" style="height:100%;">
                                <tr>
                                    <td class="ac125-bn ac125-br ac125-bb" style="width:20%;"><div class="ac125-lbl">GL CODE</div></td>
                                    <td class="ac125-bn ac125-br ac125-bb" style="width:15%;"><div class="ac125-lbl">SIC</div></td>
                                    <td class="ac125-bn ac125-br ac125-bb" style="width:25%;"><div class="ac125-lbl">NAICS</div><div class="ac125-val" style="font-size:7px;">\${num === 1 ? data.naics || '' : ''}</div></td>
                                    <td class="ac125-bn ac125-bb" style="width:40%;"><div class="ac125-lbl">FEIN OR SOC SEC #</div><div class="ac125-val" style="font-size:7px;">\${num === 1 ? data.fein || '' : ''}</div></td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="ac125-bn ac125-bb" style="height:18px;">
                                        <div class="ac125-lbl">BUSINESS PHONE #:</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="ac125-bn ac125-bb" style="height:18px;">
                                        <div class="ac125-lbl">WEBSITE ADDRESS</div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colspan="4" class="ac125-bn ac125-p0">
                                        <table class="ac125-table ac125-bn" style="height: 100%;">
                                            <tr>
                                                <td class="ac125-bn ac125-bb ac125-br" style="padding: 2px 4px; width:65%;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">SUBCHAPTER "S" CORPORATION</span></td>
                                                <td class="ac125-bn ac125-bb" style="padding: 2px 4px;"></td>
                                            </tr>
                                            <tr>
                                                <td class="ac125-bn ac125-br" style="padding: 2px 4px; width:65%;"><div class="ac125-chk"></div> <span style="font-size:6px; font-weight:bold;">TRUST</span></td>
                                                <td class="ac125-bn" style="padding: 2px 4px;"></td>
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
         <div style="text-align:center; font-size:6px; margin-top:2px;">The ACORD name and logo are registered marks of ACORD</div>
      </div>
    </div>
  \`;
}
`;

const startStr = "export function generateAcord125FullForm";
const endStr = "export async function generateApplicationPacketHTML";

const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    const newContent = content.substring(0, startIdx) + newFunc + "\n\n" + content.substring(endIdx).replace('generateAcord125FullForm(dataWithQR)', 'generateAcord125Page1(dataWithQR)');
    fs.writeFileSync('src/lib/services/pdf/ApplicationPacketPDF.ts', newContent);
    console.log("SUCCESS");
} else {
    console.log("Not found boundaries");
}
