import { askOllama } from "@/lib/ollama";
import { specificationPrompt } from "@/lib/prompts/specificationPrompt";

export async function extractSpecification(text: string) {
  const response = await askOllama(specificationPrompt(text));

  console.log("===== REQUIREMENTS =====");
  console.log(response);

  const lines = response
  .split("\n")
  .map((line: string) => line.trim())
  .filter(
    (line: string) =>
      line.startsWith("-") ||
      /^\d+\./.test(line)
  );

const requirements = lines.map((line: string) => ({
  requirement: line
    .replace(/^-/, "")
    .replace(/^\d+\./, "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .trim(),
}));

  return {
    requirements,
  };
}