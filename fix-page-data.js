const fs = require('fs');
const filepath = 'src/app/agency/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Fix Total Cost statically referencing quotes[0]
content = content.replace(
  '{quotes.length > 0\n                  ? `$${quotes[0].finalAmountUSD.toLocaleString()}`\n                  : "Not Quoted"}',
  '{currentQuote?.finalAmountUSD ? `$${currentQuote.finalAmountUSD.toLocaleString()}` : "Not Quoted"}'
);

// Note: If the format is slightly different, let's just do a regex replace for the Total Cost part.
const totalCostRegex = /<p className="text-gray-500 mb-1">Total Cost:<\/p>\s*<p className="font-semibold text-gray-900">\s*\{quotes\.length > 0\s*\?\s*`\$\$\{quotes\[0\]\.finalAmountUSD\.toLocaleString\(\)\}`\s*:\s*"Not Quoted"\}\s*<\/p>/g;
content = content.replace(totalCostRegex, `<p className="text-gray-500 mb-1">Total Cost:</p>
              <p className="font-semibold text-gray-900">
                {currentQuote?.finalAmountUSD ? \`$\${currentQuote.finalAmountUSD.toLocaleString()}\` : "Not Quoted"}
              </p>`);

// 2. Update PDF buttons to include quoteId
// We have window.open(`/api/agency/applications/${submissionId}/proposal`, "_blank")
// Change to window.open(`/api/agency/applications/${submissionId}/proposal?quoteId=${currentQuote?._id || ''}`, "_blank")
content = content.replace(/\/api\/agency\/applications\/\$\{submissionId\}\/proposal`/g, '/api/agency/applications/${submissionId}/proposal?quoteId=${currentQuote?._id || \'\'}`');
content = content.replace(/\/api\/agency\/applications\/\$\{submissionId\}\/invoice`/g, '/api/agency/applications/${submissionId}/invoice?quoteId=${currentQuote?._id || \'\'}`');
content = content.replace(/\/api\/agency\/applications\/\$\{submissionId\}\/pdf`/g, '/api/agency/applications/${submissionId}/pdf?quoteId=${currentQuote?._id || \'\'}`');

content = content.replace(/\/agency\/quote\/\$\{submission.programId\}\?mode=view&id=\$\{submission._id\}`/g, '/agency/quote/${submission.programId}?mode=view&id=${currentQuote?._id || submission._id}`');

fs.writeFileSync(filepath, content);
console.log('Fixed page parameters and data sources!');
