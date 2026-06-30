export type PersonalityType = 
  | 'claude' 
  | 'gpt4' 
  | 'gemini'
  | 'llama';

export interface AIPersonality {
  name: string;
  botName: string; // Poe bot name
  description: string;
  features: string[];
}

export interface PoeMessage {
  role: 'user' | 'bot' | 'system';
  content: string;
}

export interface ChatRequest {
  message: string;
  personality?: PersonalityType;
  conversationHistory?: PoeMessage[];
  userName?: string;
}

export interface ChatResponse {
  success: boolean;
  response: string;
  personality: string;
  aiName: string;
  timestamp: string;
}

export interface PoeQueryRequest {
  version: string;
  type: string;
  query: Array<{
    role: string;
    content: string;
    content_type: string;
    timestamp?: number;
  }>;
  user_id?: string;
  conversation_id?: string;
  message_id?: string;
}