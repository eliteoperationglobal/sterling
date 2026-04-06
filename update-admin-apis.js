const fs = require('fs');

const files = [
  'src/app/api/admin/submissions/[id]/proposal/route.ts',
  'src/app/api/admin/submissions/[id]/invoice/route.ts',
  'src/app/api/admin/submissions/[id]/pdf/route.ts'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Insert quoteId parsing if not already present
  if (!content.includes('const url = new URL(req.url);')) {
    content = content.replace(
      'const user = session.user as any;',
      'const user = session.user as any;\n    const url = new URL(req.url);\n    const quoteId = url.searchParams.get("quoteId");'
    );
  }

  // Update Quote.findOne to check quoteId
  // Match: await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name")
  // OR: await Quote.findOne({ submissionId: submission._id }).populate(...)
  const findOneRegex = /await Quote\.findOne\(\{\s*submissionId:\s*submission\._id\s*\}\)\.populate\("carrierId",\s*"name"\)/g;
  const replacement = `quoteId ? await Quote.findById(quoteId).populate("carrierId", "name") : await Quote.findOne({ submissionId: submission._id }).populate("carrierId", "name")`;
  
  if (findOneRegex.test(content)) {
    content = content.replace(findOneRegex, replacement);
  } else {
    // Try a more generic match if the exact string doesn't match
    const genericRegex = /await Quote\.findOne\(\{\s*submissionId:\s*submission\._id\s*\}\)\.populate\([^)]+\)/g;
    content = content.replace(genericRegex, (match) => {
        return `quoteId ? await Quote.findById(quoteId).populate("carrierId", "name") : ` + match;
    });
  }

  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
});
