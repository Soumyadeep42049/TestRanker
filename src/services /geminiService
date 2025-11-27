import { GoogleGenAI, Type } from "@google/genai";
import { Question, Language, Difficulty } from "../types";

// Initialize Gemini Client
// IMPORTANT: The API key must be available in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateQuestions = async (
  subject: string,
  language: Language,
  difficulty: Difficulty,
  count: number = 5
): Promise<Question[]> => {
  const modelId = "gemini-2.5-flash"; // Fast and efficient for text tasks

  let promptSubject = subject;
  let distributionInstruction = "";

  if (subject === 'all_subjects') {
    promptSubject = "General Competitive Exams (Mixed: General Science, GK, Current Affairs, English, Mathematics, Reasoning, History, Geography)";
    distributionInstruction = "Ensure the questions are a diverse mix covering the different topics mentioned (Science, Math, History, etc.) in a random order, not grouped by subject.";
  }

  const prompt = `
    Generate ${count} multiple-choice questions (MCQs) for the subject "${promptSubject}".
    The questions should be suitable for competitive exams (like SSC, UPSC, Railways) in India.
    The language of the content MUST be "${language}".
    The difficulty level of the questions MUST be "${difficulty}".
    
    Ensure the following:
    1. The question text is clear and concise.
    2. Provide 4 distinct options.
    3. Clearly indicate the correct answer index (0-3).
    4. Provide a detailed explanation for the correct answer.
    5. Provide a concise summary of the explanation (max 2 sentences).
    6. The difficulty field in the response should match "${difficulty}".
    ${distributionInstruction}
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              questionText: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              correctAnswerIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
              explanationSummary: { type: Type.STRING },
              difficulty: { type: Type.STRING },
            },
            required: ["questionText", "options", "correctAnswerIndex", "explanation", "explanationSummary", "difficulty"],
          },
        },
      },
    });

    if (response.text) {
      const rawData = JSON.parse(response.text);
      // Map to add unique IDs and subject info
      return rawData.map((q: any, index: number) => ({
        id: `${subject}-${Date.now()}-${index}`,
        subject: subject,
        ...q,
      }));
    }
    return [];
  } catch (error) {
    console.error("Error generating questions:", error);
    throw new Error("Failed to generate questions. Please try again.");
  }
};
