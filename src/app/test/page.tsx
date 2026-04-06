"use client";

import { useState, useEffect } from "react";
import DynamicForm from "@/components/DynamicForm";

export default function TestPage() {
  const [industries, setIndustries] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [selectedSubtype, setSelectedSubtype] = useState("");
  const [template, setTemplate] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Fetch industries
  useEffect(() => {
    fetch("/api/industries")
      .then((res) => res.json())
      .then((data) => {
        console.log("Industries API response:", data);
        if (data.industries) {
          setIndustries(data.industries);
        } else if (data.error) {
          console.error("API Error:", data.error);
          setMessage(`Error: ${data.error}`);
        }
      })
      .catch((err) => {
        console.error("Error fetching industries:", err);
        setMessage(`Error: ${err.message}`);
      });
  }, []);

  // Fetch template when subtype is selected
  useEffect(() => {
    if (selectedIndustry && selectedSubtype) {
      setLoading(true);
      setTemplate(null);
      setMessage("");
      fetch(`/api/forms?industry=${selectedIndustry}&subtype=${selectedSubtype}`)
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          console.log("Forms API response:", data);
          if (data.templates && data.templates.length > 0) {
            setTemplate(data.templates[0]);
            setMessage("");
          } else {
            setMessage("No template found for this industry/subtype combination.");
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching template:", err);
          setMessage(`Error loading form: ${err.message}`);
          setLoading(false);
        });
    }
  }, [selectedIndustry, selectedSubtype]);

  const handleFormSubmit = (data: Record<string, any>, files: FileList | null) => {
    setMessage("Form submitted! (This is a test - data not saved)");
    console.log("Form data:", data);
    console.log("Files:", files);
  };

  const selectedIndustryData = industries.find((ind) => ind.name === selectedIndustry);

  return (
    <div className="min-h-screen bg-[#F5F5F5] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#4A4A4A] mb-8">Test Page - Forms & APIs</h1>

        {/* Test Industries API */}
        <div className="card-sterling p-6 mb-6">
          <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">1. Test Industries API</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                Select Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => {
                  setSelectedIndustry(e.target.value);
                  setSelectedSubtype("");
                  setTemplate(null);
                }}
                className="input-sterling focus-sterling"
              >
                <option value="">-- Select Industry --</option>
                {industries && industries.length > 0 ? (
                  industries.map((ind) => (
                    <option key={ind.name} value={ind.name}>
                      {ind.name}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>Loading industries...</option>
                )}
              </select>
              {industries.length > 0 && (
                <p className="text-xs text-[#6B6B6B] mt-1">
                  Found {industries.length} industries
                </p>
              )}
            </div>

            {selectedIndustryData && (
              <div>
                <label className="block text-sm font-semibold text-[#4A4A4A] mb-2">
                  Select Subtype
                </label>
                <select
                  value={selectedSubtype}
                  onChange={(e) => setSelectedSubtype(e.target.value)}
                  className="input-sterling focus-sterling"
                >
                  <option value="">-- Select Subtype --</option>
                  {selectedIndustryData.subtypes.map((subtype: any) => (
                    <option key={subtype.name} value={subtype.name}>
                      {subtype.name} {subtype.stateSpecific ? "(CA-Specific)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="text-sm text-[#6B6B6B] mt-4">
              <p className="font-semibold">Status:</p>
              <p>✅ Industries loaded: {industries.length}</p>
              {selectedIndustryData && (
                <p>✅ Subtypes found: {selectedIndustryData.subtypes.length}</p>
              )}
              {industries.length === 0 && (
                <p className="text-red-600">❌ No industries found. Check console for errors.</p>
              )}
              {industries.length > 0 && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  <p className="font-semibold">Debug - Industries in state:</p>
                  <pre className="overflow-auto max-h-32">
                    {JSON.stringify(industries, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test DynamicForm Component */}
        {loading && (
          <div className="card-sterling p-6 mb-6">
            <p className="text-[#6B6B6B]">Loading form template...</p>
          </div>
        )}

        {template && !loading && (
          <div className="card-sterling p-6 mb-6">
            <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">
              2. Test DynamicForm Component
            </h2>
            <p className="text-sm text-[#6B6B6B] mb-4">
              Template: {template.title} ({template.industry} → {template.subtype})
            </p>
            {template.fields && Array.isArray(template.fields) && template.fields.length > 0 ? (
              <DynamicForm
                fields={template.fields}
                onSubmit={handleFormSubmit}
                isLoading={false}
              />
            ) : (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800">Warning: Template has no fields</p>
                <pre className="text-xs mt-2 overflow-auto">
                  {JSON.stringify(template, null, 2)}
                </pre>
              </div>
            )}
            {message && (
              <div className={`mt-4 p-4 rounded ${
                message.includes("Error") 
                  ? "bg-red-100 border border-red-400 text-red-700"
                  : "bg-green-100 border border-green-400 text-green-700"
              }`}>
                {message}
              </div>
            )}
          </div>
        )}

        {/* API Test Results */}
        <div className="card-sterling p-6">
          <h2 className="text-xl font-bold text-[#4A4A4A] mb-4">3. API Test Results</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>GET /api/industries:</strong>{" "}
              {industries.length > 0 ? "✅ Working" : "⏳ Loading..."}
            </p>
            <p>
              <strong>GET /api/forms:</strong>{" "}
              {template ? "✅ Working" : "⏳ Select industry & subtype"}
            </p>
            <p>
              <strong>DynamicForm Component:</strong>{" "}
              {template ? "✅ Ready" : "⏳ Waiting for template"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

