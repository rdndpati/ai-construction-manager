export const documentClassifierPrompt = (text: string) => `
You are an expert document classifier for construction projects.

Analyze the document below.

Return ONLY valid JSON.

Do NOT use markdown.
Do NOT wrap the response in \`\`\`.

Return this format:

{
  "documentType": "",
  "confidence": "",
  "reason": ""
}

Allowed document types:

- Submittal
- Specification
- Drawing
- RFI
- Meeting Minutes
- Inspection Report
- Commissioning Report
- Contract
- Invoice
- Manual
- Permit
- Resume
- Government Form
- Other

Document:

${text}
`;