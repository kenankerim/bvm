import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = 
  process.env.NEXT_PUBLIC_GEMINI_API_KEY || 
  process.env.GEMINI_API_KEY || 
  process.env.VITE_GEMINI_API_KEY || 
  "";

const genAI = new GoogleGenerativeAI(apiKey);

export async function askGemini(prompt: string) {
  if (!apiKey) {
    return "AI asistent hələ konfiqurasiya olunmayıb. API açarı tapılmadı.";
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Üzr istəyirəm, xəta baş verdi. Zəhmət olmasa bir daha cəhd edin.";
  }
}
