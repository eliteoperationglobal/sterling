export function getDisplayProgramName(programName?: string | null, templateIndustry?: string | null): string {
  if (!programName) {
    return templateIndustry || "Construction";
  }

  const name = programName.trim();
  
  if (name === "Equipment" || name === "Construction Equipment" || name === "Contractors Equipment") {
    return "Contractors Equipment";
  }
  
  if (name === "Apartment Building" || name === "Commercial Property") {
    return "Commercial Property";
  }
  
  if (name.toLowerCase() === "advantage contractor gl") {
    return templateIndustry || "Construction";
  }
  
  if (name === "Builders Risk" || name.toLowerCase() === "builders-risk") {
    return "Builders Risk";
  }

  if (name === "Manufacturers / Distributors" || name.toLowerCase().includes("manufacturer")) {
    return "Manufacturers";
  }

  return name;
}

export function getClientDisplayName(data?: any): string {
  if (!data) return "N/A";
  const p = data.payload || data;
  const name =
    p.companyName?.trim() ||
    p.applicantName?.trim() ||
    p.namedInsured?.trim() ||
    p.business_name?.trim() ||
    data.clientName?.trim() ||
    data.clientContact?.name?.trim() ||
    data.name?.trim();
  return name || "N/A";
}