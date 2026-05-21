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
  
  return name;
}
