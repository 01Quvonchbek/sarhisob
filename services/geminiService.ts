
import { GoogleGenAI } from "@google/genai";
import { Transaction, UserSettings } from "../types.ts";

export const getFinancialAdvice = async (transactions: Transaction[], settings: UserSettings) => {
  // Try multiple ways to get the API Key (Netlify uses process.env)
  const apiKey = (window as any).process?.env?.API_KEY || "";
  
  if (!apiKey || apiKey === "") {
    console.error("API_KEY is missing in the environment.");
    return "Xatolik: API kaliti topilmadi. Netlify sozlamalarida API_KEY o'zgaruvchisini yarating. 🔑";
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    Siz o'zbek moliya ekspertisiz.
    Foydalanuvchi ma'lumotlari:
    - Oylik maosh: ${settings.salary} ${settings.currency}
    - Oxirgi tranzaktsiyalar: ${JSON.stringify(transactions.slice(0, 15))}

    Tahlil qilib bering:
    1. Hozirgi holatga baho (juda qisqa).
    2. Kredit yoki qarzlar bo'lsa, ularni yopish uchun birinchi qadam.
    3. Xarajatlarni tejash uchun 2 ta hayotiy tavsiya.
    
    Javob faqat o'zbek tilida, do'stona va 400 belgidan oshmasin.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ parts: [{ text: prompt }] }],
    });
    return response.text;
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "AI hozirda xizmat ko'rsata olmaydi. Iltimos, keyinroq urinib ko'ring yoki API kalitni tekshiring. 🌐";
  }
};
