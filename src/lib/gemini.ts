import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || '' 
});

const CACHE_KEY = 'ai_news_cache';
const CACHE_TTL = 4 * 60 * 60 * 1000; // 4 hours for free tier stability

// Global serial queue to prevent concurrent requests on free tier
let isRequesting = false;
const requestQueue: (() => void)[] = [];

async function acquireLock() {
  if (isRequesting) {
    await new Promise<void>(resolve => requestQueue.push(resolve));
  }
  isRequesting = true;
}

function releaseLock() {
  isRequesting = false;
  const next = requestQueue.shift();
  if (next) next();
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 3000): Promise<T> {
  await acquireLock();
  try {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        lastError = error;
        const errorMsg = String(error?.message || error).toLowerCase();
        const isRateLimit = errorMsg.includes('429') || error?.status === 429 || errorMsg.includes('resource_exhausted');
        
        if (!isRateLimit || i === maxRetries - 1) throw error;
        
        const jitter = Math.random() * 1500;
        const delay = (initialDelay * Math.pow(2, i)) + jitter;
        
        console.warn(`[Gemini Free Tier] Rate limited. Retrying in ${Math.round(delay)}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw lastError;
  } finally {
    // Cooldown between requests
    await new Promise(resolve => setTimeout(resolve, 1500));
    releaseLock();
  }
}

export interface AIUpdate {
  title: string;
  summary: string;
  importance: 'low' | 'medium' | 'high';
  tags: string[];
  date: string;
  url: string;
}

export interface GeneratedPost {
  content: string;
  suggestedImagePrompt: string;
  imageUrl?: string;
}

export async function fetchLatestAINews(): Promise<AIUpdate[]> {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log("Returning cached AI news");
        return data;
      }
    } catch (e) {
      console.error("Cache parse error", e);
    }
  }

  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  
  const tryFetch = async (useSearch: boolean) => {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Search for and summarize the top 5 most significant REAL breakthroughs in Artificial Intelligence released today, ${today}, or in the last 24 hours. 
      CRITICAL: You MUST provide EXACT, FUNCTIONAL source URLs for each item discovered via search. DO NOT hallucinate URLs. 
      Return them as a JSON list.`,
      config: {
        tools: useSearch ? [{ googleSearch: {} }] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              summary: { type: "string", description: "A highly detailed factual summary discovered from search results." },
              importance: { type: "string", enum: ["low", "medium", "high"] },
              tags: { type: "array", items: { type: "string" } },
              date: { type: "string", description: "The specific release date found in the search results." },
              url: { type: "string", description: "The EXACT direct source URL found in search results." }
            },
            required: ["title", "summary", "importance", "tags", "date", "url"]
          }
        }
      }
    });

    const data = JSON.parse(response.text);
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
    return data;
  };

  try {
    return await withRetry(() => tryFetch(true));
  } catch (error: any) {
    console.error("Error fetching news with search:", error);
    // If search tool fails (common on free tier), try without it
    try {
      console.log("Attempting fallback without search tool...");
      return await withRetry(() => tryFetch(false));
    } catch (fallbackError) {
      // If we have stale cache, return it as fallback on error
      if (cached) {
        try {
          const { data } = JSON.parse(cached);
          return data;
        } catch (e) {
          return [];
        }
      }
      throw fallbackError;
    }
  }
}

export async function generateAIImage(prompt: string): Promise<string> {
  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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
  });
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

  return await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
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
          type: "object",
          properties: {
            content: { type: "string", description: "The main body of the post. Conclude strictly with 'See more: [URL]' if provided." },
            suggestedImagePrompt: { type: "string", description: "A high-quality image generation prompt." }
          },
          required: ["content", "suggestedImagePrompt"]
        }
      }
    });

    return JSON.parse(response.text);
  });
}
