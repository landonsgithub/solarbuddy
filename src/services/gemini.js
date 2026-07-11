import { GoogleGenAI } from '@google/genai';

// Initialize the AI client using your Vite environment variable
const ai = new GoogleGenAI({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY
});

// Test the connection
export async function establishGeminiConnection(prompt) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    return "Sorry, my brain is offline right now!";
  }
}

//To Import: import { estblishGeminiConnection } from './gemini.js';