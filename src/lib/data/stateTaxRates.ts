/**
 * Insurance Premium Tax Rates by State
 * 
 * These are general insurance premium tax rates for property and casualty insurance.
 * Rates may vary by insurance type and can change annually.
 * 
 * Source: Research based on state insurance department regulations
 * Last Updated: 2024
 * 
 * Note: These are standard rates. Some states have different rates for:
 * - Different insurance types (life, health, P&C)
 * - Different premium amounts
 * - Surplus lines vs admitted carriers
 * 
 * For production use, verify rates with state insurance departments.
 */

export interface StateTaxRate {
  state: string;
  stateName: string;
  taxRate: number; // Percentage (e.g., 2.35 = 2.35%)
  notes?: string;
  stampingFee?: number;
  fireMarshalRate?: number;     // percentage (e.g. 0.30)
  fireMarshalFlatFee?: number;  // flat dollar amount (e.g. 20)
  stampingFeePerFiling?: number; // stamping fee per filing
  slaServiceCharge?: number; // sla service charge
  slasTransactionFee?: number; // Oklahoma SLAS Transaction Fee (percentage, e.g. 0.175)
}

export const STATE_TAX_RATES: Record<string, StateTaxRate> = {
  // Alabama
  AL: { state: "AL", stateName: "Alabama", taxRate: 6 },

  // Alaska
  AK: { state: "AK", stateName: "Alaska", taxRate: 2.7 },

  // Arizona
  AZ: { state: "AZ", stateName: "Arizona", taxRate: 3 },

  // Arkansas
  AR: { state: "AR", stateName: "Arkansas", taxRate: 4 },

  // California
  CA: { state: "CA", stateName: "California", taxRate: 3, stampingFee: 0.18 },

  // Colorado
  CO: { state: "CO", stateName: "Colorado", taxRate: 3, stampingFee: 0 },

  // Connecticut
  CT: { state: "CT", stateName: "Connecticut", taxRate: 4 },

  // Delaware
  DE: { state: "DE", stateName: "Delaware", taxRate: 3 },

  // District of Columbia
  DC: { state: "DC", stateName: "District of Columbia", taxRate: 2 },

  // Florida
  FL: { state: "FL", stateName: "Florida", taxRate: 4.94, stampingFee: 0.03 },

  // Georgia
  GA: { state: "GA", stateName: "Georgia", taxRate: 4, stampingFee: 0.06 },

  // Hawaii
  HI: { state: "HI", stateName: "Hawaii", taxRate: 4.68 },

  // Idaho
  ID: { state: "ID", stateName: "Idaho", taxRate: 1.50 },

  // Illinois
  IL: { state: "IL", stateName: "Illinois", taxRate: 3.5 },

  // Indiana
  IN: { state: "IN", stateName: "Indiana", taxRate: 2.5 },

  // Iowa
  IA: { state: "IA", stateName: "Iowa", taxRate: 0.975 },

  // Kansas
  KS: { state: "KS", stateName: "Kansas", taxRate: 3 },

  // Kentucky
  KY: { state: "KY", stateName: "Kentucky", taxRate: 3 },

  // Louisiana
  LA: { state: "LA", stateName: "Louisiana", taxRate: 4.85 },

  // Maine
  ME: { state: "ME", stateName: "Maine", taxRate: 3 },

  // Maryland
  MD: { state: "MD", stateName: "Maryland", taxRate: 3 },

  // Massachusetts
  MA: { state: "MA", stateName: "Massachusetts", taxRate: 4 },

  // Michigan
  MI: { state: "MI", stateName: "Michigan", taxRate: 2 },

  // Minnesota
  MN: { state: "MN", stateName: "Minnesota", taxRate: 3 },

  // Mississippi
  MS: { state: "MS", stateName: "Mississippi", taxRate: 4 },

  // Missouri
  MO: { state: "MO", stateName: "Missouri", taxRate: 5 },

  // Montana
  MT: { state: "MT", stateName: "Montana", taxRate: 2.75 },

  // Nebraska
  NE: { state: "NE", stateName: "Nebraska", taxRate: 3 },

  // Nevada
  NV: { state: "NV", stateName: "Nevada", taxRate: 3.5, stampingFee: 0.40 },

  // New Hampshire
  NH: { state: "NH", stateName: "New Hampshire", taxRate: 3 },

  // New Jersey
  NJ: { state: "NJ", stateName: "New Jersey", taxRate: 5 },

  // New Mexico
  NM: { state: "NM", stateName: "New Mexico", taxRate: 3.003 },

  // New York
  NY: { state: "NY", stateName: "New York", taxRate: 3.6, stampingFee: 0.15 },

  // North Carolina
  NC: { state: "NC", stateName: "North Carolina", taxRate: 5, stampingFee: 0.3 },

  // North Dakota
  ND: { state: "ND", stateName: "North Dakota", taxRate: 1.75 },

  // Ohio
  OH: { state: "OH", stateName: "Ohio", taxRate: 5 },

  // Oklahoma
  OK: { state: "OK", stateName: "Oklahoma", taxRate: 6, slasTransactionFee: 0.175 },

  // Oregon
  OR: { state: "OR", stateName: "Oregon", taxRate: 2, stampingFee: 0, fireMarshalRate: 0.30, slaServiceCharge: 10, },

  // Pennsylvania
  PA: { state: "PA", stateName: "Pennsylvania", taxRate: 3, stampingFee: 0, stampingFeePerFiling: 20, },

  // Puerto Rico
  PR: { state: "PR", stateName: "Puerto Rico", taxRate: 9 },

  // Rhode Island
  RI: { state: "RI", stateName: "Rhode Island", taxRate: 4 },

  // South Carolina
  SC: { state: "SC", stateName: "South Carolina", taxRate: 6 },

  // South Dakota
  SD: { state: "SD", stateName: "South Dakota", taxRate: 2.5 },

  // Tennessee
  TN: { state: "TN", stateName: "Tennessee", taxRate: 5 },

  // Texas
  TX: { state: "TX", stateName: "Texas", taxRate: 4.85, stampingFee: 0.04 },

  // U.S. Virgin Islands
  VI: { state: "VI", stateName: "U.S. Virgin Islands", taxRate: 5 },

  // Utah
  UT: { state: "UT", stateName: "Utah", taxRate: 4.25 },

  // Vermont
  VT: { state: "VT", stateName: "Vermont", taxRate: 3 },

  // Virginia
  VA: { state: "VA", stateName: "Virginia", taxRate: 2.25 },

  // Washington
  WA: { state: "WA", stateName: "Washington", taxRate: 2, fireMarshalRate: 0.30, fireMarshalFlatFee: 10 },

  // West Virginia
  WV: { state: "WV", stateName: "West Virginia", taxRate: 4.55 },

  // Wisconsin
  WI: { state: "WI", stateName: "Wisconsin", taxRate: 3 },

  // Wyoming
  WY: { state: "WY", stateName: "Wyoming", taxRate: 3 },
};

/**
 * Get tax rate for a state
 * @param state - Two-letter state code (e.g., "CA", "TX")
 * @returns Tax rate percentage, or default 2.0% if state not found
 */
export function getStateTaxRate(state: string): number {
  const stateCode = state.toUpperCase();
  const stateData = STATE_TAX_RATES[stateCode];

  if (stateData) {
    return stateData.taxRate;
  }

  // Default to 2.0% if state not found
  console.warn(`Tax rate not found for state: ${state}, using default 2.0%`);
  return 2.0;
}

/**
 * Get full state tax data
 * @param state - Two-letter state code
 * @returns StateTaxRate object or null
 */
export function getStateTaxData(state: string): StateTaxRate | null {
  const stateCode = state.toUpperCase();
  return STATE_TAX_RATES[stateCode] || null;
}

/**
 * Calculate tax amount for a premium
 * @param premium - Premium amount in USD
 * @param state - Two-letter state code
 * @returns Object with taxRate and taxAmount
 */
export function calculatePremiumTax(premium: number, state: string): {
  taxRate: number;
  taxAmount: number;
  stateName: string;
} {
  const taxRate = getStateTaxRate(state);
  const taxAmount = (premium * taxRate) / 100;
  const stateData = getStateTaxData(state);

  return {
    taxRate,
    taxAmount: parseFloat(taxAmount.toFixed(2)),
    stateName: stateData?.stateName || state,
  };
}

/**
 * Calculate stamping fee for a premium
 */
export function calculateStampingFee(
  premium: number,
  state: string
): {
  taxRate: number;
  taxAmount: number;
  stateName: string;
} {
  const stateData = getStateTaxData(state);

  const stampingRate = stateData?.stampingFee || 0;
  const stampingAmount = (premium * stampingRate) / 100;

  return {
    taxRate: stampingRate,
    taxAmount: parseFloat(stampingAmount.toFixed(2)),
    stateName: stateData?.stateName || state,
  };
}


/**
 * Calculate Fire Marshal Tax
 */
// export function calculateFireMarshalTax(
//   premium: number,
//   state: string
// ): {
//   taxRate: number;
//   taxAmount: number;
//   stateName: string;
// } {
//   const stateData = getStateTaxData(state);

//   if (!stateData) {
//     return {
//       taxRate: 0,
//       taxAmount: 0,
//       stateName: state,
//     };
//   }

//   // If flat fee exists (PA)
//   if (stateData.fireMarshalFlatFee) {
//     return {
//       taxRate: 0,
//       taxAmount: stateData.fireMarshalFlatFee,
//       stateName: stateData.stateName,
//     };
//   }

//   // If percentage exists (OR)
//   const rate = stateData.fireMarshalRate || 0;
//   const amount = (premium * rate) / 100;

//   return {
//     taxRate: rate,
//     taxAmount: parseFloat(amount.toFixed(2)),
//     stateName: stateData.stateName,
//   };
// }
export function calculateFireMarshalTax(
  premium: number,
  state: string
) {
  const stateData = getStateTaxData(state);

  if (!stateData) {
    return { taxRate: 0, taxAmount: 0, flatFee: 0, stateName: state };
  }

  const rate = stateData.fireMarshalRate || 0;
  const percentageAmount = (premium * rate) / 100;
  const flatFee = stateData.fireMarshalFlatFee || 0;
  const totalAmount = percentageAmount + flatFee;

  return {
    taxRate: rate,
    taxAmount: parseFloat(percentageAmount.toFixed(2)), // Only percentage part
    flatFee: parseFloat(flatFee.toFixed(2)), // Flat fee part
    totalAmount: parseFloat(totalAmount.toFixed(2)), // Total for backward compatibility
    stateName: stateData.stateName,
  };
}

export function getStampingFeePerFiling(state: string): number {
  const stateData = getStateTaxData(state);
  return stateData?.stampingFeePerFiling || 0;
}

export function getSLAServiceCharge(state: string): number {
  const stateData = getStateTaxData(state);
  return stateData?.slaServiceCharge || 0;
}

export function getSlasTransactionFee(state: string): number {
  const stateData = getStateTaxData(state);
  return stateData?.slasTransactionFee || 0;
}

export function calculateSlasTransactionFee(
  premium: number,
  state: string
): {
  taxRate: number;
  taxAmount: number;
  stateName: string;
} {
  const stateData = getStateTaxData(state);
  const feeRate = stateData?.slasTransactionFee || 0;
  const feeAmount = (premium * feeRate) / 100;

  return {
    taxRate: feeRate,
    taxAmount: parseFloat(feeAmount.toFixed(2)),
    stateName: stateData?.stateName || state,
  };
}