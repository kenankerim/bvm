export async function askGemini(prompt: string): Promise<string> {
  const apiKey =
    import.meta.env.VITE_GEMINI_API_KEY ||
    import.meta.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    import.meta.env.GEMINI_API_KEY ||
    "";

  if (!apiKey) {
    return "AI asistent hələ konfiqurasiya olunmayıb. API key tapılmadı.";
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      return data.candidates[0].content.parts[0].text;
    } else {
      console.error("Gemini Response Error:", data);
      return "Üzr istəyirəm, cavab hazırlana bilmədi. Zəhmət olmasa yenidən yazın.";
    }
  } catch (error) {
    console.error("Gemini Network Error:", error);
    return "Xəta baş verdi, xahiş edirik yenidən cəhd edin.";
  }
}
