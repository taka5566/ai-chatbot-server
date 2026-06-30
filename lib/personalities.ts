import type { AIPersonality } from './types';

export const AI_PERSONALITIES: Record<string, AIPersonality> = {
  claude: {
    name: "Claude",
    botName: "Claude-3.5-Sonnet",
    description: "Anthropic's Claude 3.5 Sonnet - Professional and thoughtful AI",
    features: [
      "Long context understanding",
      "Nuanced reasoning",
      "Code generation",
      "Professional communication"
    ]
  },
  
  gpt4: {
    name: "GPT-4",
    botName: "GPT-4o",
    description: "OpenAI's GPT-4o - Versatile and powerful AI",
    features: [
      "Creative writing",
      "Problem solving",
      "Code generation",
      "General knowledge"
    ]
  },
  
  gemini: {
    name: "Gemini",
    botName: "Gemini-Pro",
    description: "Google's Gemini Pro - Fast and efficient AI",
    features: [
      "Quick responses",
      "Multimodal understanding",
      "Technical expertise",
      "Research assistance"
    ]
  },
  
  llama: {
    name: "Llama",
    botName: "Llama-3.1-405B",
    description: "Meta's Llama 3.1 - Open and powerful AI",
    features: [
      "Open source model",
      "High performance",
      "Multilingual support",
      "Technical tasks"
    ]
  }
};