const fs = require('fs');
const filepath = 'src/app/admin/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Rename state variables
content = content.split('selectedQuoteId').join('globalSelectedQuoteId');
content = content.split('setSelectedQuoteId').join('setGlobalSelectedQuoteId');

// 2. Remove the old header dropdown
const oldHeaderDropdownRegex = /\{\/\* Global Carrier Selector \*\/\}[\s\S]*?\{policyQuotes\.length > 0 && \([\s\S]*?<div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">[\s\S]*?<\/div>[\s\S]*?\)\}/g;
content = content.replace(oldHeaderDropdownRegex, '');

// Clean up the header flex gap if needed (optional)
content = content.replace('<div className="flex items-center gap-6 pr-8">', '<div className="flex items-center gap-4 pr-8">');

// 3. Insert the new styled dropdown
// User wants it to look like:
// {policyQuotes.length > 1 && (
//   <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shadow-sm rounded-md mb-2">
//     <span className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">Select Carrier:</span>
//     ...
//   </div>
// )}

const insertAfterHeader = '</div>\n        </div>'; // End of the header div
const newDropdown = `\n\n        {/* Global Carrier Selector */}
        {policyQuotes.length > 1 && (
          <div className="bg-white px-8 py-4 border-t border-gray-100 flex items-center justify-end gap-3 shadow-sm rounded-md mb-2">
            <span className="text-[14px] font-bold text-gray-500 uppercase tracking-wider">Select Carrier:</span>
            <select
              value={globalSelectedQuoteId || ""}
              onChange={(e) => setGlobalSelectedQuoteId(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-gray-900 text-[14px] rounded-lg focus:ring-black focus:border-black block p-2 font-semibold outline-none"
            >
              {policyQuotes.map((quote: any) => (
                <option key={quote._id} value={quote._id}>
                  {quote.carrierId?.name || "Unknown Carrier"}
                </option>
              ))}
            </select>
          </div>
        )}`;

// We find the FIRST occurrence of the header end and insert after it.
const headerEndIndex = content.indexOf('<div className="bg-white px-6 pt-5 pb-4 shadow-sm">');
if (headerEndIndex !== -1) {
    const nextClosingDiv = content.indexOf('</div>\n        </div>', headerEndIndex);
    if (nextClosingDiv !== -1) {
        const insertionPoint = nextClosingDiv + '</div>\n        </div>'.length;
        content = content.slice(0, insertionPoint) + newDropdown + content.slice(insertionPoint);
    }
}

fs.writeFileSync(filepath, content);
console.log('Admin state renamed and UI Restyled!');
