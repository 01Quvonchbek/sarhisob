
import { GoogleGenAI } from "@google/genai";
import { Transaction, UserSettings } from "../types";

export const getFinancialAdvice = async (transactions: Transaction[], settings: UserSettings) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  const prompt = `
    Siz "Sarhisob" ilovasining professional moliya maslahatchisisiz.
    Foydalanuvchi ma'lumotlari:
    - Oylik daromad: ${settings.salary} ${settings.currency}
    - Tranzaktsiyalar: ${JSON.stringify(transactions.slice(0, 20))}

    Vazifangiz:
    1. Moliyaviy holatni qisqa tahlil qiling.
    2. Kredit va qarzlarni yopish bo'yicha maslahat bering.
    3. Xarajatlarni tejash uchun 2 ta aniq yo'l ko'rsating.
    
    Javob o'zbek tilida, motivator ohangda va emoji-lar bilan bo'lsin. 500 belgidan oshmasin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("AI Error:", error);
    return "Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring. 🌐";
  }
};
