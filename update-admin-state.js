const fs = require('fs');
const filepath = 'src/app/admin/submissions/[id]/page.tsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add currentPolicyType state
content = content.replace(
  'const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);',
  'const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);\n  const [currentPolicyType, setCurrentPolicyType] = useState<"GENERAL_LIABILITY" | "EXCESS_LIABILITY">("GENERAL_LIABILITY");'
);

// 2. Add currentQuote computation logic (above early returns)
const insertPoint = 'if (status === "loading" || loading) {';
const currentQuoteLogic = `  const policyQuotes = data?.quotes?.filter((q: any) =>
    q.policyType === currentPolicyType ||
    (!q.policyType && currentPolicyType === "GENERAL_LIABILITY")
  ) ?? [];

  useEffect(() => {
    if (policyQuotes.length > 0) {
      if (!selectedQuoteId || !policyQuotes.find(q => q._id === selectedQuoteId)) {
        setSelectedQuoteId(policyQuotes[0]._id);
      }
    } else {
      setSelectedQuoteId(null);
    }
  }, [currentPolicyType, policyQuotes.length, data]);

  const currentQuote = policyQuotes.find((q: any) => q._id === selectedQuoteId) || policyQuotes[0] || null;\n\n  `;

content = content.replace(insertPoint, currentQuoteLogic + insertPoint);

fs.writeFileSync(filepath, content);
console.log('Admin state updated!');
