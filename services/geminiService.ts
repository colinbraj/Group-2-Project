import OpenAI from 'openai';
import { GeneratedContent, ChatMessage } from '../types';

// Initialize OpenAI Client
// In a production environment, you should proxy requests through a backend to keep the key secure.
// For this client-side demo, we rely on 'process.env.OPENAI_API_KEY' being defined in vite config.
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  if (!apiKey) {
    console.warn("OPENAI_API_KEY is missing. Using mock/fallback responses.");
    return null;
  }
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
};

/**
 * Generates repurposed content for social media platforms.
 */
export const generateRepurposedContent = async (
  transcript: string,
  audience: string,
  tone: string
): Promise<GeneratedContent> => {
  const openai = getOpenAIClient();

  if (!openai) {
    // Mock response if no key
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          linkedin: `🚀 **Leadership & Composure**\n\nBased on transcript... (Mock for ${audience})\n\n#Leadership`,
          twitter: `1/5 Leadership is 90% composure.\n\n(Mock for ${audience})\n\n👇`,
          newsletter: `Subject: Why Calmness is a Superpower\n\nHi there,\n\n(Mock content...)`,
          whatsapp: `Hey! Just posted a new video. Check it out!`,
        });
      }, 1500);
    });
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are an expert content strategist. Repurpose content for LinkedIn, Twitter, Newsletter, and WhatsApp. Target Audience: ${audience}. Tone: ${tone}. Return ONLY a JSON object with keys: linkedin, twitter, newsletter, whatsapp.`
        },
        { role: "user", content: transcript }
      ],
      model: "gpt-4o",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    return JSON.parse(content) as GeneratedContent;

  } catch (error) {
    console.error("OpenAI API Error:", error);
    throw error;
  }
};

/**
 * Generates a smart reply for a lead - ready to send, no placeholders.
 */
export const generateSmartReply = async (
  leadName: string,
  lastMessage: string,
  history: ChatMessage[]
): Promise<string> => {
  const openai = getOpenAIClient();

  if (!openai) {
    return `Hi ${leadName}! Thanks for your message. How can I help you today? 😊`;
  }

  try {
    const historyText = history.map(m => `${m.sender === 'user' ? 'You' : leadName}: ${m.content}`).join('\n');

    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are replying to Instagram DMs for a business. Generate a SHORT, READY-TO-SEND reply.

RULES:
- Keep it under 2-3 sentences max
- Be friendly and conversational (like texting)
- NO placeholders like [Your Name] or [Company Name]
- NO formal signatures or contact info
- Use emojis sparingly (1-2 max)
- Answer their question directly if they asked one
- If they're interested in services, offer to share more details or schedule a call
- Sound human, not robotic`
        },
        {
          role: "user",
          content: `Customer Name: ${leadName}

Recent conversation:
${historyText}

Their last message: "${lastMessage}"

Write a short, friendly reply:`
        }
      ],
      model: "gpt-4o-mini",
    });

    return completion.choices[0].message.content?.trim() || "Thanks for your message! How can I help? 😊";
  } catch (error) {
    console.error("OpenAI Smart Reply Error:", error);
    return "Thanks for reaching out! How can I help you today?";
  }
};

/**
 * Generates a microsite content structure using AI based on lead context.
 */
export interface MicrositeContent {
  headline: string;
  subheadline: string;
  description: string;
  features: string[];
  ctaText: string;
}

export const generateMicrositeContent = async (lead: {
  name: string;
  company: string;
  chatHistory?: ChatMessage[];
}): Promise<MicrositeContent> => {
  const openai = getOpenAIClient();

  // Build context from chat history
  const chatContext = lead.chatHistory
    ? lead.chatHistory.map(m => `${m.sender}: ${m.content}`).join('\n')
    : 'No conversation history yet.';

  if (!openai) {
    // Mock response
    return {
      headline: `Exclusive Offer for ${lead.company}`,
      subheadline: `Personalized solutions designed with ${lead.name} in mind`,
      description: `We've crafted a custom approach based on your specific needs. Our team is ready to help ${lead.company} achieve its goals through proven strategies and dedicated support.`,
      features: [
        'Tailored consultation process',
        'Industry-specific expertise',
        'Dedicated account manager',
        '24/7 premium support'
      ],
      ctaText: 'Schedule Your Free Consultation'
    };
  }

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a landing page copywriter. Create compelling microsite content for a potential client.
          
Based on the conversation history, generate personalized copy that addresses their specific needs.

Return a JSON object with these exact fields:
- headline: Attention-grabbing headline (max 10 words)
- subheadline: Supporting statement (max 20 words)
- description: Brief value proposition (2-3 sentences)
- features: Array of 4 key benefits/features (short phrases)
- ctaText: Call-to-action button text (3-5 words)

Make it feel personalized and relevant to their conversation.`
        },
        {
          role: "user",
          content: `Create microsite content for:
Company: ${lead.company}
Contact: ${lead.name}

Conversation History:
${chatContext}`
        }
      ],
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }
    });

    const content = completion.choices[0].message.content;
    if (!content) throw new Error("No content generated");

    const parsed = JSON.parse(content);
    return {
      headline: parsed.headline || `Welcome, ${lead.company}`,
      subheadline: parsed.subheadline || 'Your success is our priority',
      description: parsed.description || 'We provide tailored solutions for your business needs.',
      features: parsed.features || ['Custom solutions', 'Expert support', 'Fast implementation', 'Proven results'],
      ctaText: parsed.ctaText || 'Get Started Today'
    };

  } catch (error) {
    console.error("Microsite generation error:", error);
    // Fallback
    return {
      headline: `Exclusive Offer for ${lead.company}`,
      subheadline: `Personalized solutions designed with ${lead.name} in mind`,
      description: `We've crafted a custom approach based on your specific needs.`,
      features: [
        'Tailored consultation',
        'Industry expertise',
        'Dedicated support',
        'Proven results'
      ],
      ctaText: 'Book a Call'
    };
  }
};

