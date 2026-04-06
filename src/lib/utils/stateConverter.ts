/**
 * State Name to State Code Converter
 * 
 * Converts full state names to 2-letter state codes
 * Used for tax calculator API which expects state codes
 */

const STATE_NAME_TO_CODE: Record<string, string> = {
  // Alabama
  "alabama": "AL",
  // Alaska
  "alaska": "AK",
  // Arizona
  "arizona": "AZ",
  // Arkansas
  "arkansas": "AR",
  // California
  "california": "CA",
  // Colorado
  "colorado": "CO",
  // Connecticut
  "connecticut": "CT",
  // Delaware
  "delaware": "DE",
  // Florida
  "florida": "FL",
  // Georgia
  "georgia": "GA",
  // Hawaii
  "hawaii": "HI",
  // Idaho
  "idaho": "ID",
  // Illinois
  "illinois": "IL",
  // Indiana
  "indiana": "IN",
  // Iowa
  "iowa": "IA",
  // Kansas
  "kansas": "KS",
  // Kentucky
  "kentucky": "KY",
  // Louisiana
  "louisiana": "LA",
  // Maine
  "maine": "ME",
  // Maryland
  "maryland": "MD",
  // Massachusetts
  "massachusetts": "MA",
  // Michigan
  "michigan": "MI",
  // Minnesota
  "minnesota": "MN",
  // Mississippi
  "mississippi": "MS",
  // Missouri
  "missouri": "MO",
  // Montana
  "montana": "MT",
  // Nebraska
  "nebraska": "NE",
  // Nevada
  "nevada": "NV",
  // New Hampshire
  "new hampshire": "NH",
  // New Jersey
  "new jersey": "NJ",
  // New Mexico
  "new mexico": "NM",
  // New York
  "new york": "NY",
  // North Carolina
  "north carolina": "NC",
  // North Dakota
  "north dakota": "ND",
  // Ohio
  "ohio": "OH",
  // Oklahoma
  "oklahoma": "OK",
  // Oregon
  "oregon": "OR",
  // Pennsylvania
  "pennsylvania": "PA",
  // Rhode Island
  "rhode island": "RI",
  // South Carolina
  "south carolina": "SC",
  // South Dakota
  "south dakota": "SD",
  // Tennessee
  "tennessee": "TN",
  // Texas
  "texas": "TX",
  // Utah
  "utah": "UT",
  // Vermont
  "vermont": "VT",
  // Virginia
  "virginia": "VA",
  // Washington
  "washington": "WA",
  // West Virginia
  "west virginia": "WV",
  // Wisconsin
  "wisconsin": "WI",
  // Wyoming
  "wyoming": "WY",
  // District of Columbia
  "district of columbia": "DC",
  "washington dc": "DC",
  "washington d.c.": "DC",
  "d.c.": "DC",
};

/**
 * Convert state name or code to state code
 * @param state - State name (e.g., "California") or state code (e.g., "CA")
 * @returns 2-letter state code (e.g., "CA"), or original value if not found
 */
export function getStateCode(state: string | null | undefined): string {
  if (!state) {
    return "CA"; // Default to California
  }

  // If already a 2-letter code, return as-is (uppercase)
  const upperState = state.toUpperCase().trim();
  if (upperState.length === 2 && /^[A-Z]{2}$/.test(upperState)) {
    return upperState;
  }

  // Try to find state code from name
  const stateKey = state.toLowerCase().trim();
  const stateCode = STATE_NAME_TO_CODE[stateKey];

  if (stateCode) {
    return stateCode;
  }

  // If not found, try partial match (e.g., "New York" → "new york")
  const partialMatch = Object.keys(STATE_NAME_TO_CODE).find((key) =>
    stateKey.includes(key) || key.includes(stateKey)
  );

  if (partialMatch) {
    return STATE_NAME_TO_CODE[partialMatch];
  }

  // If still not found, return original (will use default 2.0% in tax calculator)
  console.warn(`State name not found: "${state}", using as-is`);
  return upperState;
}






