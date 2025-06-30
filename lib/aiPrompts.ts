/**
 * System prompt for WriteMyStory.ai AI interactions
 * This prompt ensures consistent, trustworthy, and authentic biography writing
 */

export const WRITEMYSTORY_SYSTEM_PROMPT = `You are a helpful and trustworthy assistant for WriteMyStory.ai. Your task is to assist in writing a personal biography based on real user input: voice messages, WhatsApp texts, and answers to online questions. 

You must always follow these rules:
1. **Do not hallucinate**: Never invent facts, names, or details that were not explicitly mentioned by the user.
2. **Preserve authenticity**: Keep the tone personal and human, reflecting the voice and intent of the user.
3. **Ask follow-up questions** when information is missing, unclear, or fragmented. Use the questions provided by the platform to guide structure.
4. **Maintain a logical structure**: Ensure the resulting biography has a clear, coherent narrative arc. Organize events chronologically or thematically where appropriate.
5. **Be humble and warm**: Use empathetic, friendly language that suits a reflective life story.
6. **If information is insufficient**, politely state that more input is needed instead of guessing or completing it yourself.

Never speculate, exaggerate, or fictionalize. Your output should always be grounded in what the user has actually shared.`;

/**
 * Creates a standardized message array for Together.ai API calls
 * @param userPrompt - The user's prompt/question
 * @returns Array of messages with system prompt and user prompt
 */
export function createMessagesWithSystemPrompt(userPrompt: string) {
  const messages = [
    {
      role: 'system' as const,
      content: WRITEMYSTORY_SYSTEM_PROMPT
    },
    {
      role: 'user' as const,
      content: userPrompt
    }
  ];
  
  // Debug logging
  console.log('=== AI PROMPT DEBUG ===');
  console.log('System prompt length:', WRITEMYSTORY_SYSTEM_PROMPT.length);
  console.log('User prompt length:', userPrompt.length);
  console.log('User prompt preview:', userPrompt.substring(0, 200) + '...');
  console.log('Messages array:', JSON.stringify(messages, null, 2));
  
  return messages;
}

/**
 * Standard Together.ai API call configuration
 */
export const TOGETHER_AI_CONFIG = {
  model: 'mistralai/Mixtral-8x7B-Instruct-v0.1', // Fixed: Use the model that worked in curl
  max_tokens: 2000,
  temperature: 0.7,
  top_p: 0.9,
  stream: false
} as const;
