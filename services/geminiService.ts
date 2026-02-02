
import { GoogleGenAI } from "@google/genai";
import { Transaction, UserSettings } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[], settings: UserSettings) => {
  // Try to find the API key in multiple common locations
  const apiKey = (window as any).process?.env?.API_KEY || "";
  
  if (!apiKey) {
    console.warn("API_KEY not found in environment variables.");
    return "Netlify sozlamalarida API_KEY topilmadi. Iltimos kalitni o'rnating. 🔑";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Siz moliya maslahatchisisiz.
    Oylik daromad: ${settings.salary} ${settings.currency}
    Xarajatlar: ${JSON.stringify(transactions.slice(0, 15))}

    Tahlil qiling:
    1. Holat (qisqa).
    2. Kredit/Qarzlarni yopish rejasi.
    3. 2 ta tejash yo'li.
    
    Javob o'zbek tilida, do'stona va 400 belgidan oshmasin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "AI hozirda band yoki API kalitda xatolik bor. 🌐";
  }
};
