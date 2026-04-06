/**
 * Finance Service
 * Handles EMI calculations and amortization schedules
 */

export interface AmortizationScheduleEntry {
  month: number;
  principal: number;
  interest: number;
  totalPayment: number;
  remainingBalance: number;
}

export interface EMIResult {
  monthlyEMI: number;
  totalPayable: number;
  totalInterest: number;
  schedule: AmortizationScheduleEntry[];
}

/**
 * Calculate EMI (Equated Monthly Installment) using the standard formula:
 * EMI = [P × R × (1+R)^N] / [(1+R)^N - 1]
 * Where:
 * P = Principal amount (loan amount)
 * R = Monthly interest rate (annual rate / 12 / 100)
 * N = Number of months
 */
export function calculateEMI(
  principalUSD: number,
  annualInterestPercent: number,
  months: number
): EMIResult {
  if (principalUSD <= 0 || months <= 0) {
    throw new Error("Principal and months must be greater than 0");
  }

  if (annualInterestPercent < 0 || annualInterestPercent > 100) {
    throw new Error("Interest rate must be between 0 and 100");
  }

  // Monthly interest rate (as decimal)
  const monthlyRate = annualInterestPercent / 12 / 100;

  // Calculate EMI using standard formula
  let monthlyEMI: number;
  if (monthlyRate === 0) {
    // If no interest, EMI is simply principal divided by months
    monthlyEMI = principalUSD / months;
  } else {
    const numerator = principalUSD * monthlyRate * Math.pow(1 + monthlyRate, months);
    const denominator = Math.pow(1 + monthlyRate, months) - 1;
    monthlyEMI = numerator / denominator;
  }

  // Round to 2 decimal places
  monthlyEMI = Math.round(monthlyEMI * 100) / 100;

  // Calculate total payable
  const totalPayable = monthlyEMI * months;
  const totalInterest = totalPayable - principalUSD;

  // Generate amortization schedule
  const schedule: AmortizationScheduleEntry[] = [];
  let remainingBalance = principalUSD;

  for (let month = 1; month <= months; month++) {
    // Interest for this month
    const interest = remainingBalance * monthlyRate;
    // Principal payment for this month
    const principal = monthlyEMI - interest;
    // Update remaining balance
    remainingBalance = remainingBalance - principal;

    // For the last month, adjust for rounding
    if (month === months) {
      remainingBalance = 0;
    }

    schedule.push({
      month,
      principal: Math.round(principal * 100) / 100,
      interest: Math.round(interest * 100) / 100,
      totalPayment: monthlyEMI,
      remainingBalance: Math.round(Math.max(0, remainingBalance) * 100) / 100,
    });
  }

  return {
    monthlyEMI,
    totalPayable: Math.round(totalPayable * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    schedule,
  };
}

/**
 * Calculate finance plan with down payment
 */
export function calculateFinancePlan(
  totalAmountUSD: number,
  downPaymentPercent: number,
  tenureMonths: number,
  annualInterestPercent: number
): {
  downPaymentUSD: number;
  principalUSD: number;
  emiResult: EMIResult;
} {
  if (downPaymentPercent < 0 || downPaymentPercent > 100) {
    throw new Error("Down payment percent must be between 0 and 100");
  }

  const downPaymentUSD = (totalAmountUSD * downPaymentPercent) / 100;
  const principalUSD = totalAmountUSD - downPaymentUSD;

  const emiResult = calculateEMI(principalUSD, annualInterestPercent, tenureMonths);

  return {
    downPaymentUSD: Math.round(downPaymentUSD * 100) / 100,
    principalUSD: Math.round(principalUSD * 100) / 100,
    emiResult,
  };
}




