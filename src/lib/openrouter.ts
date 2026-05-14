import OpenAI from "openai";

export const openrouter = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const LLM_MODEL = "xiaomi/mimo-v2-flash";
export const EMBEDDING_MODEL = "openai/text-embedding-3-small";

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
): Promise<string> {
  const response = await openrouter.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.7,
  });

  return response.choices[0].message.content || "";
}
