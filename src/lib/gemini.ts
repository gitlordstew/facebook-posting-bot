import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

export interface AIUpdate {
  title: string;
  summary: string;
  importance: 'low' | 'medium' | 'high';
  tags: string[];
}

export interface GeneratedPost {
  content: string;
  hashtags: string[];
  suggestedImagePrompt: string;
}

export async function fetchLatestAINews(): Promise<AIUpdate[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Summarize the top 5 most significant developments in Artificial Intelligence from the last 7 days. Focus on breakthroughs, major tech company announcements, and research papers. Return them as a JSON list.",
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string" },
              importance: { type: "string", enum: ["low", "medium", "high"] },
              tags: { type: "array", items: { type: "string" } }
            },
            required: ["title", "summary", "importance", "tags"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
}

export async function generateFacebookPost(
  topic: string, 
  tone: 'professional' | 'enthusiastic' | 'informative' | 'minimalist'
): Promise<GeneratedPost> {
  const toneGuide = {
    professional: "Authoritative, industry-focused, polished language, and insightful.",
    enthusiastic: "High energy, full of emojis, use of exclamations, focus on 'game-changing' aspects.",
    informative: "Clear, structured, bullet points, educational, focus on facts.",
    minimalist: "Short, punchy, one or two sentences, high impact, very few hashtags."
  };

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Topic: ${topic}\nTone: ${toneGuide[tone]}\n\nGenerate a Facebook post summarizing this development. Include line breaks for readability.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          content: { type: "string", description: "The main body of the post." },
          hashtags: { type: "array", items: { type: "string" } },
          suggestedImagePrompt: { type: "string", description: "A prompt to use with an AI image generator to accompany this post." }
        },
        required: ["content", "hashtags", "suggestedImagePrompt"]
      }
    }
  });

  return JSON.parse(response.text);
}
