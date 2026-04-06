const fs = require('fs');

let content = fs.readFileSync('src/app/agency/submissions/[id]/page.tsx', 'utf8');

const importRegex = /(import {.*?useState.*?}[^;]*;)/;
const chatRefImport = "\nimport { useRef, useEffect } from 'react';\n";

// Add importing useRef if not exist
if (!content.includes('useRef')) {
   content = content.replace(importRegex, "$1" + chatRefImport);
}

// 1. Add handleAddNote 
const handleAddNoteFunc = `
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (activeTab === "Notes") {
      scrollToBottom();
    }
  }, [activityLogs, activeTab]);

  const handleAddNote = async () => {
    if (!noteText.trim() || !submissionId) return;
    
    try {
      const res = await fetch(\`/api/agency/submissions/\${submissionId}/notes\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: noteText, notifyList: noteFilters })
      });
      
      if (!res.ok) throw new Error("Failed to add note");
      
      const data = await res.json();
      
      if (data.note) {
         setActivityLogs(prev => [data.note, ...prev]);
         setNoteText("");
         setTimeout(scrollToBottom, 100);
      }
    } catch(err: any) {
      toast.error(err.message || "Failed to add note");
    }
  };
`;
// Insert before useEffect(() => { if (status === "authenticated"
content = content.replace("useEffect(() => {\n    if (status === \"authenticated\"", handleAddNoteFunc + "\n  useEffect(() => {\n    if (status === \"authenticated\"");

// 2. Change Add Note button
content = content.replace(/<button\s+className="inline-flex items-center gap-2 px-5 py-2\.5 bg-\[#9A8B7A\][^>]*>\s*<span[^>]*>\+<\/span>\s*Add Note\s*<\/button>/g, `<button onClick={handleAddNote} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#9A8B7A] hover:bg-[#7A6F64] text-white rounded-md text-[14px] font-semibold transition-all duration-200 shadow-sm hover:shadow-md"><span className="text-base">+</span>Add Note</button>`);

// 3. Replace Notes Thread UI
const threadStart = "              {/* RIGHT – NOTES THREAD */}";
const threadEnd = "            </div>\n          )}\n          {activeTab === \"Status History\"";

const newThread = `              {/* RIGHT – NOTES THREAD */}
              <div className="flex flex-col h-[500px]">
                <div className="flex items-center justify-between mb-4 flex-shrink-0">
                  <h3 className="text-[15px] font-semibold text-gray-900">
                    Notes Thread
                  </h3>
                </div>

                {/* Chat Container */}
                <div className="border rounded-xl bg-gray-50 flex-1 overflow-y-auto p-4 flex flex-col gap-4 shadow-inner relative">
                  
                  {activityLogs.filter(log => log.activityType === "ADMIN_NOTE_ADDED").length === 0 ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <div className="w-16 h-12 bg-gray-200 rounded-lg mb-4 opacity-70" />
                      <p className="font-medium text-gray-500 mb-1">No notes added yet</p>
                      <p className="text-[13px] text-gray-400">Drop in questions or comments to help us assist you.</p>
                    </div>
                  ) : (
                    activityLogs
                      .filter(log => log.activityType === "ADMIN_NOTE_ADDED")
                      .sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                      .map((note) => {
                        const isMe = note.performedBy?.userId === (session?.user as any)?.id;
                        return (
                          <div key={note._id} className={\`flex \${isMe ? "justify-end" : "justify-start"} w-full\`}>
                            <div className={\`flex flex-col max-w-[75%] \${isMe ? "items-end" : "items-start"}\`}>
                              
                              <div className={\`px-4 py-2.5 rounded-2xl shadow-sm text-[14px] leading-relaxed relative \${
                                isMe 
                                ? "bg-[#9A8B7A] text-white rounded-tr-sm" 
                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                              }\`}>
                                {!isMe && (
                                  <div className="text-[11px] font-bold text-gray-400 mb-1 tracking-tight">
                                    {note.performedBy?.userName || "Admin"}
                                  </div>
                                )}
                                <span className="whitespace-pre-wrap break-words">{note.description}</span>
                              </div>
                              
                              <div className="text-[10px] text-gray-400 mt-1.5 px-1 font-medium select-none">
                                {new Date(note.createdAt).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })}
                                {' • '}
                                {new Date(note.createdAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                              </div>

                            </div>
                          </div>
                        );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </div>
`;

const sIdx = content.indexOf(threadStart);
const eIdx = content.indexOf(threadEnd, sIdx);

if (sIdx !== -1 && eIdx !== -1) {
   content = content.substring(0, sIdx) + newThread + content.substring(eIdx);
   fs.writeFileSync('src/app/agency/submissions/[id]/page.tsx', content);
   console.log("SUCCESS");
} else {
   console.log("BOUNDARIES NOT FOUND");
}
