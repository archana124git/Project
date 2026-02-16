export function extractFieldsFromSummary(summary) {
  const diagnosisMatch =
    summary.match(/Primary Clinical Impression:\s*(.*)/i) ||
    summary.match(/Assessment.*?:\s*(.*)/i) ||
    summary.match(/Diagnosis:\s*(.*)/i);
  
 
  const findingsMatch =
    summary.match(/FINDINGS:\s*([\s\S]*?)(?:\n\n|$)/i);



    const findings = findingsMatch
        ? findingsMatch[1]
            .split("\n")
            .map(f => f.replace(/[-•]/g, "").trim())
            .filter(Boolean)
        : [];

    let severity = "Mild";
    if (findings.length === 2) severity = "Moderate";
    if (findings.length > 2) severity = "Severe";


  return {
    diagnosis: diagnosisMatch?.[1] 
    ?.replace(/[^\w\s]/g, "")   
    ?.trim()
    ?.toLowerCase() || "",
    findings,
    severity
  };
}

