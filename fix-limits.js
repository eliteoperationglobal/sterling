const fs = require('fs');

const filesToFix = [
  'src/app/api/admin/submissions/[id]/proposal/route.ts',
  'src/app/api/agency/applications/[id]/proposal/route.ts'
];

for (const filepath of filesToFix) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Find where `extractLimits` needs to be inserted or fixed.
  // It should be right before `const proposalData: ProposalData = {`
  content = content.replace(/(const proposalData:\s*ProposalData\s*=\s*\{)/g, 
    'const [occurrence, aggregate, products] = extractLimits(limits?.generalLiability || formData?.coverageLimits);\n    $1');

  // Replace occurrenceLimit mapping
  content = content.replace(
    /occurrenceLimit:\s*formatToUSD\(limits\?\.generalLiability \|\| formData\.coverageLimits\?\.split\("\/"\)\[0\]\),/,
    'occurrenceLimit: occurrence,'
  );

  content = content.replace(
    /aggregateLimit:\s*formatToUSD\(limits\?\.aggregateLimit \|\| formData\.coverageLimits\?\.split\("\/"\)\[1\]\),/,
    'aggregateLimit: aggregate,'
  );

  content = content.replace(
    /productsCompletedOpsLimit:\s*formatToUSD\(limits\?\.aggregateLimit \|\| formData\.coverageLimits\?\.split\("\/"\)\[2\]\),/,
    'productsCompletedOpsLimit: products,'
  );

  content = content.replace(
    /personalAdvertisingInjuryLimit:\s*formatToUSD\(limits\?\.generalLiability \|\| formData\.coverageLimits\?\.split\("\/"\)\[0\]\),/,
    'personalAdvertisingInjuryLimit: occurrence,'
  );

  const extractLimitsFunc = `function extractLimits(value: string) {
  if (!value) return ["", "", ""];

  const parts = value.split("/").map(v => v.trim());

  return parts.map((v: string) => {
    // Check if it's already a full dollar amount
    if (v.includes("$") || v.length > 5) return v;
    const num = parseFloat(v) * 1000000;
    if (isNaN(num)) return v;
    return "$" + num.toLocaleString();
  });
}`;

  // Let's make sure extractLimits is there. If it's already there, replace it. 
  // If not, we will just use the existing one.
  const regex = /function extractLimits[\s\S]*?\}\n/m;
  if (!regex.test(content) && content.includes('getPolicyDateRange')) {
    content = content.replace(/function formatToUSD/, extractLimitsFunc + '\nfunction formatToUSD');
  } else if (regex.test(content)) {
    content = content.replace(regex, extractLimitsFunc + '\n');
  }

  // Also make sure `medPay` is properly checking medicalExpenseLimit or formatToUSD(limits?.medicalExpenseLimit)
  content = content.replace(
    /medPayLimit:\s*formatToUSD\(limits\?\.medicalExpenseLimit \|\| formData\.medicalExpenseLimit\),/g,
    'medPayLimit: limits?.medicalExpenseLimit && limits.medicalExpenseLimit !== "Not Applicable" ? formatToUSD(limits.medicalExpenseLimit) : "Not Applicable",'
  );

  // Fire legal logic
  content = content.replace(
    /fireLegalLimit:\s*formatToUSD\(limits\?\.fireLegalLimit \|\| formData\.fireLegalLimit\),/g,
    'fireLegalLimit: formatToUSD(limits?.fireLegalLimit || formData?.fireLegalLimit),'
  );
  
  // Deductible and retention
  content = content.replace(
    /deductible:\s*formatToUSD\(limits\?\.deductible \|\| formData\.deductible\),/g,
    'deductible: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),'
  );
  content = content.replace(
    /selfInsuredRetention:\s*formatToUSD\(limits\?\.deductible \|\| formData\.deductible\),/g,
    'selfInsuredRetention: formatToUSD(limits?.deductible || formData?.deductible || "Not Applicable"),'
  );

  fs.writeFileSync(filepath, content);
}
console.log('done!');
