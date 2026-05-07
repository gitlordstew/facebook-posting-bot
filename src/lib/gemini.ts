import { GoogleGenAI } from "@google/genai";
import { AIUpdate, GeneratedPost } from "../types";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const DEFAULT_MODEL = "gemini-3-flash-preview";
const DEFAULT_IMAGE_MODEL = "gemini-2.5-flash-image";

export async function fetchLatestAINews(): Promise<AIUpdate[]> {
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Search for and summarize the top 5 most significant REAL breakthroughs in Artificial Intelligence released today, ${today}, or in the last 24 hours. 
      CRITICAL: You MUST provide EXACT, FUNCTIONAL source URLs for each item discovered via search. DO NOT hallucinate URLs. 
      Return them as a JSON list.`,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: "array" as any,
          items: {
            type: "object" as any,
            properties: {
              title: { type: "string" as any },
              summary: { type: "string" as any, description: "A highly detailed factual summary discovered from search results." },
              importance: { type: "string" as any, enum: ["low", "medium", "high"] },
              tags: { type: "array" as any, items: { type: "string" as any } },
              date: { type: "string" as any, description: "The specific release date found in the search results." },
              url: { type: "string" as any, description: "The EXACT direct source URL found in search results." }
            },
            required: ["title", "summary", "importance", "tags", "date", "url"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
}

export async function generateAIImage(prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: DEFAULT_IMAGE_MODEL,
    contents: {
      parts: [
        {
          text: `Professional, high-quality, digital art for social media about AI: ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9"
      }
    }
  });

  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image data returned from Gemini");
}

export async function generateFacebookPost(
  topic: string,
  tone: 'professional' | 'enthusiastic' | 'informative' | 'minimalist' | 'visionary' | 'analytical',
  sourceUrl?: string,
  context?: string
): Promise<GeneratedPost> {
  const toneGuide = {
    professional: "Authoritative, industry-focused, polished language, and insightful.",
    enthusiastic: "High energy, full of emojis, use of exclamations, focus on 'game-changing' aspects.",
    informative: "Clear, structured, bullet points, educational, focus on facts.",
    minimalist: "Short, punchy, one or two sentences, high impact.",
    visionary: "Futuristic, philosophical, focusing on long-term impact and the evolution of humanity.",
    analytical: "Critical, data-driven, examining limitations, and practical use-cases."
  };

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: `Topic: ${topic}
    ${context ? `Context/Ground Truth: ${context}` : ""}
    Tone: ${toneGuide[tone]}
    
    Generate a compelling Facebook post summarizing this AI development. 
    ${sourceUrl ? `CRITICAL: You MUST include the text "See more: ${sourceUrl}" as the ABSOLUTE FINAL LINE of the post. Nothing should follow this link.` : "Do not include any hashtags at the end of the post."}
    
    CRITICAL: Use ONLY the provided context and facts. Do not hallucinate data.
    Ensure the content is engaging and includes appropriate line breaks.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "object" as any,
        properties: {
          content: { type: "string" as any, description: "The main body of the post. Conclude strictly with 'See more: [URL]' if provided." },
          suggestedImagePrompt: { type: "string" as any, description: "A high-quality image generation prompt." }
        },
        required: ["content", "suggestedImagePrompt"]
      }
    }
  });

  return JSON.parse(response.text);
}
