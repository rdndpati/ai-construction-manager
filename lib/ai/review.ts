import { askOllama } from "@/lib/ollama";
import { reviewPrompt } from "@/lib/prompts/reviewPrompt";

export async function reviewSubmittal(text: string) {
  const response = await askOllama(reviewPrompt(text));

  console.log("========== OLLAMA RESPONSE ==========");
  console.log(response);
  console.log("====================================");

  try {
    const cleaned = response
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse AI JSON:", error);

    return {
      manufacturer: "",
      product: "",
      model: "",
      specifications: [],
      risks: [],
      missingInformation: [],
      reviewChecklist: [],
      rawResponse: response,
    };
  }
}