export const specificationPrompt = (text: string) => `
You are a Senior Electrical Engineer.

Read the specification below.

Extract ONLY engineering requirements.

Return them as a bullet list.

Example:

- Fire alarm system shall operate at 24V DC.
- Switchboards shall be NEMA 4X.
- Grounding conductor shall be #6 AWG copper.
- Installation shall comply with BS7671.
- Equipment shall be UL1741 certified.

Do not summarize.

Do not explain.

Only return the bullet list.

Specification:

${text}
`;