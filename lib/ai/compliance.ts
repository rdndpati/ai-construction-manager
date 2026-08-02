import { askOllama } from "@/lib/ollama";
import { compliancePrompt } from "@/lib/prompts/compliancePrompt";

export async function compareCompliance(
  requirements: string,
  submittal: string
) {
  return await askOllama(
    compliancePrompt(requirements, submittal)
  );
}