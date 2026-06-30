import type { AIPersonality } from './types';

export interface ConversationContext {
  userName?: string;
  previousTopics?: string[];
  messageCount?: number;
}

export function buildSystemPrompt(
  personality: AIPersonality,
  context?: ConversationContext
): string {
  let prompt = `You are ${personality.name}, ${personality.description}.

Your key features:
${personality.features.map(f => `- ${f}`).join('\n')}
`;

  if (context) {
    if (context.userName) {
      prompt += `\n\nYou are talking to ${context.userName}.`;
    }
    
    if (context.previousTopics && context.previousTopics.length > 0) {
      prompt += `\n\nPrevious topics in this conversation: ${context.previousTopics.join(', ')}`;
    }
    
    if (context.messageCount) {
      prompt += `\n\nThis is message #${context.messageCount} in the conversation.`;
    }
  }

  prompt += `\n\nProvide helpful, accurate, and engaging responses. Stay true to your capabilities and personality.`;

  return prompt;
}