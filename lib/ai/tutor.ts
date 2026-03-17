import { GoogleGenerativeAI } from '@google/generative-ai';

const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;

if (!geminiApiKey) {
    throw new Error('Missing GOOGLE_GEMINI_API_KEY environment variable!');
}

const genAI = new GoogleGenerativeAI(geminiApiKey);

const SYSTEM_INSTRUCTION = "You are 'Dojo Sensei', an expert Japanese language tutor. You are encouraging, concise, and specialize in providing mnemonics for Kanji. Always keep answers under 3 sentences unless specifically asked for a deep dive.";

export async function askTutor(userMessage: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: SYSTEM_INSTRUCTION
        });

        const result = await model.generateContent(userMessage);
        const response = result.response;
        return response.text();
    } catch (error) {
        console.error('[Gemini API Error]:', error);
        return 'Gomen nasai! (Sorry!) My brain is temporarily foggy. Please try asking again later.';
    }
}
