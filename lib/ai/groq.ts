import Groq from "groq-sdk";

const GROQ_API_KEY = process.env.GROQ_API_KEY!;

if (!GROQ_API_KEY) {
  throw new Error("GROQ_API_KEY not set in .env.local");
}

const groq = new Groq({ apiKey: GROQ_API_KEY });

export async function generateWithGroq(
  prompt: string,
  systemInstruction?: string,
  model: string = "llama-3.3-70b-versatile"
): Promise<string> {
  try {
    const messages: { role: "system" | "user"; content: string }[] = [];

    if (systemInstruction) {
      messages.push({ role: "system", content: systemInstruction });
    }
    messages.push({ role: "user", content: prompt });

    const completion = await groq.chat.completions.create({
      messages,
      model,
      temperature: 0.7,
      max_tokens: 2048,
    });

    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("Groq API error:", error);
    throw error;
  }
}

export async function generateWithGroqContext(
  prompt: string,
  context: string,
  systemInstruction?: string,
  model?: string
): Promise<string> {
  const fullPrompt = `CONTEXT FROM TEXTBOOK:\n${context}\n\nSTUDENT QUESTION:\n${prompt}`;
  return generateWithGroq(fullPrompt, systemInstruction, model);
}
