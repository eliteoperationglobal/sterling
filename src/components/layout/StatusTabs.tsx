"use client";

const tabs = [
  "In Progress",
  "Requires Review",
  "Approval Requested",
  "Quote Conditionally Approved",
  "Approved Quote",
  "Pending Bind",
  "Incomplete Bind",
  "Ready to Bind",
  "Newly Bound"
];

export default function StatusTabs() {
  return (
    <div className="bg-white border-b px-6 py-2 flex gap-5 overflow-x-auto text-sm">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          className={`pb-2 whitespace-nowrap border-b-2 transition ${
            i === 0
              ? "border-cyan-600 text-cyan-600 font-medium"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
