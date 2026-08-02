import { askOllama } from "@/lib/ollama";
import { documentClassifierPrompt } from "@/lib/prompts/documentClassifierPrompt";

export async function classifyDocument(text: string) {
  const response = await askOllama(documentClassifierPrompt(text));

  const cleaned = response
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(cleaned);
}