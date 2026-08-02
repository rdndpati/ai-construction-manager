export const compliancePrompt = (
  requirements: string,
  submittal: string
) => `
You are a Senior Electrical Engineer.

Compare the project specification requirements with the equipment submittal.

Project Requirements:

${requirements}

Equipment Submittal:

${submittal}

Return your answer as a markdown table.

| Requirement | Status | Comments |

Status must be one of:

PASS
FAIL
MISSING

After the table write:

Overall Recommendation:

Approved

or

Revise and Resubmit

Do not explain anything else.
`;