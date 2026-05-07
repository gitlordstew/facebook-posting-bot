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
