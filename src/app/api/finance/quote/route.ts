import { NextResponse } from "next/server";

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      premiumAmount, 
      taxesAmount, 
      feesAmount, 
      insuredName, 
      state = "CA",
      zip = "90210" 
    } = body;

    console.log("[AIS API] Fetching quote for premium:", premiumAmount);

    // 1. Get the Access Token securely
    const accessToken = await getAISToken();

    // 2. Get the Session Token securely
    const sessionToken = await getAISSessionToken(accessToken);

    // Format date as MMDDYYYY which AIS expects
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const yyyy = d.getFullYear();
    const policyInceptionDate = `${mm}${dd}${yyyy}`;

    // Clean agent name to prevent invalid character rejections (like '&')
    const rawAgentName = "Sterling Agent"; // User can override in env if needed

    // 3. Build the exact payload required by AIS
    const quotePayload = {
      consumerReferenceNumber: `QUOTE-${Date.now()}`,
      insured: {
        insuredId: " ", // Blank per example
        insuredName1: insuredName || "CLIENT",
        insuredName2: "",
        insuredAddress1: "123 Main St", // Placeholder until mapped
        insuredAddress2: "",
        insuredCity: "City",
        insuredState: state,
        insuredZip: zip,
        insuredZipExt: "",
        sameAsBillingAddressFlag: "Y",
        insuredPhoneNumber: "5555555555",
        insuredEmail: "client@example.com"
      },
      agent: {
        agentCodeCrossReference: " ",
        agentCode: process.env.AIS_AGENT_CODE || "040000",
        agentName: rawAgentName.replace(/[^a-zA-Z0-9 ]/g, "")
      },
      account: {
        accountType: "C",
        calculateQuoteFlag: "Y",
        totalPremiumAmount: (Number(premiumAmount) + Number(taxesAmount) + Number(feesAmount)).toFixed(2),
      },
      policies: [
        {
          policyNumber: "TBD",
          policyInsuranceCompanyNumber: "9999", // Required by AIS (Max length 4)
          policyCoverageTypeCode: "99", // Required by AIS (99 = Other/Generic)
          policyInceptionDate: policyInceptionDate,
          policyTerm: "12",
          policyPremiumAmount: Number(premiumAmount).toFixed(2),
          policyFee1Type: "T", 
          policyFee1Description: "TAXES",
          policyFee1Amount: Number(taxesAmount).toFixed(2),
          policyFee2Type: "F", 
          policyFee2Description: "FEES",
          policyFee2Amount: Number(feesAmount).toFixed(2)
        }
      ]
    };

    // 4. Request the quote
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
    
    // 5. Return the safe math back to the frontend
    return NextResponse.json({
      success: true,
      data: quoteData.results || quoteData
    });

  } catch (error: any) {
    console.error("[AIS API] Error fetching finance quote:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Financing currently unavailable. Please try again later." },
      { status: 500 }
    );
  }
}
