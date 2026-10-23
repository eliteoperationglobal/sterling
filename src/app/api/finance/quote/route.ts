import { NextResponse } from "next/server";
import { getStateCode } from "@/lib/utils/stateConverter";

// Using credentials securely from the environment variables
const AIS_BASE_URL = process.env.AIS_BASE_URL || "https://api.epitomeais.com";
const AIS_TRANSACTION_URL = process.env.AIS_TRANSACTION_URL || "https://api.epitomeais.com/apiprod/1.0.0/services";
const AIS_BASIC_AUTH = process.env.AIS_BASIC_AUTH || "Basic ZDdlM3dIU3V6QldWNnVJbkRmdDE1TlphTDY4YTpqbm9oU0JJcHhYZm1iS2hRYndMbTU1V2lDakFh";

// Helper function to get the access token
async function getAISToken() {
  const tokenUrl = `${AIS_BASE_URL}/token?grant_type=client_credentials`;
  
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Authorization": AIS_BASIC_AUTH,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: 'no-store' 
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AIS Access Token Error:", errorText);
    throw new Error(`Failed to fetch AIS access token: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

// Helper function to get the session token
async function getAISSessionToken(accessToken: string) {
  const loginUrl = `${AIS_BASE_URL}/apiauth/1.0.0/services/auth/login`;
  
  // Requires your real userId and the Base64 encoded "Security Key:User Password" string
  const userId = process.env.AIS_USER_ID; 
  const password = process.env.AIS_ENCODED_PASSWORD; 

  if (!userId || !password) {
    throw new Error("Missing AIS_USER_ID or AIS_ENCODED_PASSWORD in environment variables");
  }

  const response = await fetch(loginUrl, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      userId: userId,
      password: password
    }),
    cache: 'no-store'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("AIS Session Token Error:", errorText);
    throw new Error(`Failed to fetch AIS session token: ${response.status}`);
  }

  const data = await response.json();
  console.log("[AIS API] Session Token Raw Response:", JSON.stringify(data));
  
  // We assume the response returns a session token property
  const token = data.results || data.sessionToken || data.SessionToken || data.token || data.sessionId || data.session_token;
  
  if (!token) {
    console.error("[AIS API] Could not extract session token from response!", data);
    throw new Error(`Invalid Session Token Response: ${JSON.stringify(data)}`);
  }
  
  return token;
}

// Helper to resolve official AIS Carrier Company Codes from PFC 205 Directory
function resolveCarrierCode(carrierNameOrCode?: string): string {
  if (!carrierNameOrCode) return process.env.AIS_COMPANY_CODE || "7X31";
  
  const clean = carrierNameOrCode.trim();
  // If already an AIS 4-character code (e.g. 7X28, 7X31, 8302, 5J85)
  if (/^[A-Za-z0-9]{4}$/.test(clean)) return clean.toUpperCase();

  const upper = clean.toUpperCase();
  if (upper.includes("RICHMOND")) return "7X28";
  if (upper.includes("KINSALE")) return "7X27";
  if (upper.includes("ACCREDITED")) return "7X31";
  if (upper.includes("BURLINGTON")) return "8302";
  if (upper.includes("CLEAR BLUE")) return "7X30";
  if (upper.includes("EVANSTON")) return "7X35";
  if (upper.includes("LLOYD")) return "5J85";
  if (upper.includes("SCOTTSDALE")) return "7X41";
  if (upper.includes("WESTCHESTER")) return "7X45";
  if (upper.includes("NAUTILUS")) return "7X36";
  if (upper.includes("MOUNT HAWLEY")) return "0207";
  if (upper.includes("ATLANTIC CASUALTY")) return "1250";
  if (upper.includes("CENTURY SURETY")) return "8452";
  if (upper.includes("CRUM") || upper.includes("FORSTER")) return "P497";
  if (upper.includes("PENN-STAR") || upper.includes("PENN STAR")) return "8598";
  if (upper.includes("SENECA")) return "8231";
  if (upper.includes("NORTHFIELD")) return "7X29";
  if (upper.includes("CLEAR SPRING")) return "5766";
  if (upper.includes("AM SPECIALTY")) return "7X43";
  if (upper.includes("HADRON")) return "7X42";
  if (upper.includes("HAMILTON")) return "7X37";
  if (upper.includes("HOUSTON")) return "8381";
  if (upper.includes("OBSIDIAN")) return "7X44";
  if (upper.includes("PALOMAR")) return "8438";

  return process.env.AIS_COMPANY_CODE || "7X31";
}

// Format date strictly as MMDDYYYY required by AIS
function formatToMMDDYYYY(dateInput?: string | Date): string {
  if (!dateInput) {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${mm}${dd}${d.getFullYear()}`;
  }
  const cleanStr = String(dateInput).trim();
  if (/^\d{8}$/.test(cleanStr)) return cleanStr;
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStr)) {
    const [yyyy, mm, dd] = cleanStr.split('-');
    return `${mm}${dd}${yyyy}`;
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${mm}${dd}${now.getFullYear()}`;
  }
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${mm}${dd}${d.getFullYear()}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      premiumAmount, 
      taxesAmount, 
      feesAmount, 
      insuredName, 
      address,
      city,
      state = "CA",
      zip = "90210",
      phone,
      email,
      policyType = "GENERAL_LIABILITY",
      policies: rawPolicies,
      brokerFeeAmount = 0
    } = body;

    // Official AIS Coverage Codes from PFC 205 Dictionary (e.g. 19 = GEN LIAB)
    const AIS_COVERAGE_CODES: Record<string, string> = {
      GENERAL_LIABILITY: "19",       // 19: GEN LIAB (G/L)
      PROPERTY: "37",                // 37: PROPERTY (PROP)
      EXCESS_LIABILITY: "17",        // 17: EXCESS LIAB (EXLIA)
      PROFESSIONAL_LIABILITY: "29",  // 29: PROF LIAB (PROFL)
      POLLUTION_LIABILITY: "68",     // 68: POLLUTION (POLL)
      UMBRELLA: "12",                // 12: UMBRELLA (UMB)
      COMMERCIAL_PACKAGE: "18",      // 18: PACKAGE (PKG)
      CYBER: "67",                   // 67: CYBER LIABILITY (CYLIA)
      INLAND_MARINE: "16",           // 16: INLAND MARINE (INMAR)
      COMMERCIAL_AUTO: "34",         // 34: BUSINESS AUTO (ATCOM)
      WORKERS_COMP: "07",            // 07: WORKERS COMP (W/C)
    };

    // Support multiple policies combined into one finance agreement
    const incomingPolicies: any[] = Array.isArray(rawPolicies) && rawPolicies.length > 0
      ? rawPolicies
      : [
          {
            policyType,
            policyNumber: "TBD",
            premiumAmount,
            taxesAmount,
            feesAmount,
          }
        ];

    // Filter to policies with positive premium
    const activePolicies = incomingPolicies.filter(p => (Number(p.premiumAmount) || 0) > 0);
    const policiesToFinance = activePolicies.length > 0 ? activePolicies : incomingPolicies;

    const parsedBrokerFee = Math.max(0, Number(brokerFeeAmount) || 0);

    let totalPolicyPremiumsAndFees = 0;
    const formattedPolicies = policiesToFinance.map((p: any, idx: number) => {
      const pPrem = Number(p.premiumAmount) || 0;
      const pTax = Number(p.taxesAmount) || 0;
      // 101% Safety: Broker fee is financed on the primary policy line (idx === 0)
      const brokerFeeForThisPolicy = idx === 0 ? parsedBrokerFee : 0;
      const pFee = (Number(p.feesAmount) || 0) + brokerFeeForThisPolicy;
      totalPolicyPremiumsAndFees += (pPrem + pTax + pFee);

      const covCode = AIS_COVERAGE_CODES[p.policyType] || "19";
      const coNumber = resolveCarrierCode(p.carrierCode || p.carrierName);

      return {
        policySequenceNumber: idx + 1,
        policyNumber: (p.policyNumber && String(p.policyNumber).trim() !== "") ? String(p.policyNumber).trim().slice(0, 20) : "TBD",
        policyInsuranceCompanyNumber: coNumber,
        policyCoverageTypeCode: covCode,
        policyInceptionDate: formatToMMDDYYYY(p.policyInceptionDate || p.effectiveDate),
        policyTerm: String(p.policyTerm || "12"),
        policyPremiumAmount: pPrem.toFixed(2),
        policyFee1Type: "T",
        policyFee1Description: "TAXES",
        policyFee1Amount: pTax.toFixed(2),
        policyFee2Type: "F",
        policyFee2Description: "FEES",
        policyFee2Amount: pFee.toFixed(2),
      };
    });

    console.log(
      `[AIS API] Financing ${formattedPolicies.length} policy/policies. Total Financed (including Broker Fee of $${parsedBrokerFee.toFixed(2)}): $${totalPolicyPremiumsAndFees.toFixed(2)}`
    );

    // 1. Get the Access Token securely
    const accessToken = await getAISToken();

    // 2. Get the Session Token securely
    const sessionToken = await getAISSessionToken(accessToken);

    // 3. Strict Field Sanitization for AIS constraints
    const cleanState = (getStateCode(state) || (state ? state.trim().slice(0, 2).toUpperCase() : "CA")).slice(0, 2);
    
    const rawZip = (zip || "").toString().replace(/\D/g, "");
    const cleanZip = rawZip.length >= 5 ? rawZip.slice(0, 5) : "90210";

    const rawPhone = (phone || "").toString().replace(/\D/g, "");
    const cleanPhone = rawPhone.length >= 10 ? rawPhone.slice(-10) : "5555555555";

    const cleanName = (insuredName || "CLIENT")
      .toString()
      .replace(/&/g, "AND")
      .replace(/[^a-zA-Z0-9\s.,'-]/g, "")
      .trim()
      .slice(0, 30) || "CLIENT";

    const cleanAddress = (address || "123 Main St")
      .toString()
      .replace(/&/g, "AND")
      .replace(/#/g, " ")
      .replace(/[^a-zA-Z0-9\s.,'-]/g, "")
      .trim()
      .slice(0, 30) || "123 Main St";

    const cleanCity = (city || "City")
      .toString()
      .replace(/[^a-zA-Z\s.-]/g, "")
      .trim()
      .slice(0, 20) || "City";

    const cleanEmail = (email && typeof email === "string" && email.includes("@"))
      ? email.trim().slice(0, 50)
      : "client@example.com";

    // 4. Build the exact payload required by AIS
    const quotePayload = {
      consumerReferenceNumber: `QUOTE-${Date.now()}`,
      insured: {
        insuredId: " ",
        insuredName1: cleanName,
        insuredName2: "",
        insuredAddress1: cleanAddress,
        insuredAddress2: "",
        insuredCity: cleanCity,
        insuredState: cleanState,
        insuredZip: cleanZip,
        insuredZipExt: "",
        sameAsBillingAddressFlag: "Y",
        insuredPhoneNumber: cleanPhone,
        insuredEmail: cleanEmail
      },
      agent: {
        agentCodeCrossReference: " ",
        agentCode: process.env.AIS_AGENT_CODE || "040000",
        agentName: process.env.AIS_AGENT_NAME || " "
      },
      account: {
        accountType: "C",
        calculateQuoteFlag: "Y",
        totalPremiumAmount: totalPolicyPremiumsAndFees.toFixed(2),
      },
      policies: formattedPolicies
    };

    // 5. Request the quote from AIS
    const quoteUrl = `${AIS_TRANSACTION_URL}/premfin/quote/pfa/inquiry`;
    
    const quoteResponse = await fetch(quoteUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "SessionToken": sessionToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(quotePayload)
    });

    if (!quoteResponse.ok) {
      const errorText = await quoteResponse.text();
      console.error("[AIS API] Quote Error:", errorText);
      throw new Error(`AIS Quote Failed: ${quoteResponse.status} - ${errorText.substring(0, 200)}`);
    }

    const quoteData = await quoteResponse.json();
    const result = quoteData.results || quoteData;

    // Check if AIS rejected the inquiry
    if (result.processingStatus === "REJECTED" || result.status === "REJECTED") {
      const reason = 
        result.returnMessage || 
        result.errorMessage || 
        (Array.isArray(result.errors) ? result.errors.join(", ") : "") || 
        "Financing application could not be approved with current terms.";
      console.warn("[AIS API] Processing Status REJECTED:", reason);
      return NextResponse.json(
        { success: false, error: `AIS Finance Notice: ${reason}`, data: result },
        { status: 422 }
      );
    }
    
    // 6. Return the safe calculation back to the caller
    return NextResponse.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error("[AIS API] Error fetching finance quote:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Financing currently unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
