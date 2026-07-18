import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY not set in .env.local");
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateWithGemini(
  prompt: string,
  systemInstruction?: string
): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemInstruction,
    });

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

export async function generateWithGeminiContext(
  prompt: string,
  context: string,
  systemInstruction?: string
): Promise<string> {
  const fullPrompt = `CONTEXT FROM TEXTBOOK:\n${context}\n\nSTUDENT QUESTION:\n${prompt}`;
  return generateWithGemini(fullPrompt, systemInstruction);
}
