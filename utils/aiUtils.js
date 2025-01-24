import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);

export const geminiCodeSummary = async (code, language) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log("gemini request here")
    const prompt = `Provide a concise, professional code explanation for this ${language} code. 
    Explain its purpose, key functionality, and any notable algorithmic approaches in 150-200 words.
    
    Code:
    ${code}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Validate the response
    if (!text || text.trim() === '') {
      throw new Error('Empty summary generated');
    }
    
    return text;
  } catch (error) {
    console.error("Error generating code summary:", error);
    throw new Error('Failed to generate code summary. Please try again.');
  }
};