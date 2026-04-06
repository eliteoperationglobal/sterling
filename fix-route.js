const fs = require('fs');
const path = 'src/app/api/agency/applications/[id]/proposal/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  'import Quote from "@/models/Quote";',
  ''
);

content = content.replace(
  'import { generateProposalHTML } from "@/lib/services/pdf/ProposalPDFHTML";',
  'import Quote from "@/models/Quote";\nimport { generateProposalHTML } from "@/lib/services/pdf/ProposalPDFHTML";'
);

content = content.replace(
  '  medicalExpenseLimit?: string;',
  '  medPayLimit?: string;'
);

const oldLogic = `    // Check if an admin has entered a quote for this submission
    let quote;
    try {
      // Assuming Quote model exists and we can find by submissionId
      // We'll just use the mock quote logic you might have, or actual DB logic
      const QuoteModule = await import('@/models/Quote');
      const QuoteModel = QuoteModule.default;
      quote = await QuoteModel.findOne({ submissionId: submission._id });
    } catch (e) {
      // Ignore if Quote model isn't available or query fails
    }

    if (quote) {
      console.log("?????? [PDF Download] Found admin quote, using admin data");
      limits = quote.limits || {};
      endorsements = quote.endorsements || [];
      specialNotes = quote.specialNotes || "";
    } else {
      limits = {}; // Fallback to empty object if no quote
    }

    const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability);`;

const newLogic = `    // Check if an admin has entered a quote for this submission
    let quote;
    try {
      const QuoteModule = await import('@/models/Quote');
      const QuoteModel = QuoteModule.default;
      quote = await QuoteModel.findOne({ submissionId: submission._id }).populate("carrierId");
    } catch (e) {}

    if (quote) {
      console.log("???? Found Quote data for Agency Proposal:", quote._id);
      carrierName = quote.carrierId?.name || formData.carrierName || "TBD";
      programName = String(submission.programName?.toString() || "Advantage Contractor GL");

      effectiveDate = quote.effectiveDate || formData.effectiveDate || new Date();
      expirationDate = quote.expirationDate ? new Date(quote.expirationDate).toLocaleDateString() : new Date(new Date(effectiveDate).setFullYear(new Date(effectiveDate).getFullYear() + 1)).toLocaleDateString();

      carrierQuoteUSD = quote.carrierQuoteUSD || carrierQuoteUSD;
      premiumTaxPercent = quote.premiumTaxPercent || premiumTaxPercent;
      premiumTaxAmountUSD = quote.premiumTaxAmountUSD || premiumTaxAmountUSD;
      policyFeeUSD = quote.policyFeeUSD || policyFeeUSD;
      brokerFeeAmountUSD = quote.brokerFeeAmountUSD || brokerFeeAmountUSD;
      
      finalAmountUSD = quote.finalAmountUSD || finalAmountUSD;

      limits = quote.limits || formData.limits || {};
      endorsements = quote.endorsements || formData.endorsements || [];
      specialNotes = quote.specialNotes || formData.specialNotes || "";
    } else {
      limits = formData.limits || {};
    }`;

content = content.replace(oldLogic, newLogic);

const oldLimits = `      occurrenceLimit: occurrence,

      aggregateLimit: aggregate,

      productsCompletedOpsLimit: products,

      personalAdvertisingInjuryLimit: occurrence,


      fireLegalLimit: formatToUSD(limits?.fireLegalLimit),

      medicalExpenseLimit: formatToUSD(limits?.medPay),

      deductible: formatToUSD(limits?.deductible),

      selfInsuredRetention: formatToUSD(limits?.deductible),`;

const newLimits = `      occurrenceLimit: formatToUSD(limits?.generalLiability || formData.coverageLimits?.split("/")[0]),
      aggregateLimit: formatToUSD(limits?.aggregateLimit || formData.coverageLimits?.split("/")[1]),
      productsCompletedOpsLimit: formatToUSD(limits?.aggregateLimit || formData.coverageLimits?.split("/")[2]),
      personalAdvertisingInjuryLimit: formatToUSD(limits?.generalLiability || formData.coverageLimits?.split("/")[0]),
      fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData.fireLegalLimit),
      medPayLimit: formatToUSD(limits?.medicalExpenseLimit || formData.medicalExpenseLimit),
      deductible: formatToUSD(limits?.deductible || formData.deductible),
      selfInsuredRetention: formatToUSD(limits?.deductible || formData.deductible),`;

content = content.replace(oldLimits, newLimits);

fs.writeFileSync(path, content);
console.log('Done replacing logic.');
