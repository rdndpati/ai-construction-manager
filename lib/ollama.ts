export async function askOllama(prompt: string) {
  const response = await fetch("http://127.0.0.1:11434/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama3.2:latest",
      prompt,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to connect to Ollama");
  }

  const data = await response.json();

  return data.response;
}