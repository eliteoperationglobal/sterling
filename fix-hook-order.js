const fs = require('fs');
const filepath = 'src/app/agency/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

const hookBlock = `  const policyQuotes = data?.quotes?.filter((q: any) =>
    q.policyType === currentPolicyType ||
    (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
  ) ?? [];

  useEffect(() => {
    if (policyQuotes.length > 0) {
      if (!globalSelectedQuoteId || !policyQuotes.find(q => q._id === globalSelectedQuoteId)) {
        setGlobalSelectedQuoteId(policyQuotes[0]._id);
      }
    } else {
      setGlobalSelectedQuoteId(null);
    }
  }, [currentPolicyType, policyQuotes.length]); // Intentionally omitting full deps to avoid cycles`;

// Remove it from its current position
content = content.replace(hookBlock, '');

// Insert it right before the first early return
const searchStr = `  if (status === "loading" || loading) {`;
content = content.replace(searchStr, hookBlock + '\n\n' + searchStr);

fs.writeFileSync(filepath, content);
console.log('Hook order fixed!');
