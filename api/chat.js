const AI_PERSONALITIES = {
  claude: { 
    name: 'Claude', 
    botName: 'Claude-Sonnet-4.6',
    trait: 'helpful and thoughtful' 
  },
  friendly: { 
    name: 'Buddy', 
    botName: 'GPT-5.4',
    trait: 'warm and encouraging' 
  },
  professional: { 
    name: 'Assistant', 
    botName: 'Claude-Opus-4.7',
    trait: 'formal and precise' 
  },
  creative: { 
    name: 'Spark', 
    botName: 'Gemini-3.1-Pro',
    trait: 'imaginative and playful' 
  },
  jackson: { 
    name: 'Jackson',
    botName: 'Claude-Sonnet-4.6',
    trait: 'professional yet approachable',
    background: {
      name: 'Jackson',
      role: 'Analyst Programmer',
      experience: 'Developed several internal applications in previous company',
      skills: ['Full-stack development', 'System analysis', 'Internal application development'],
      portfolio: true
    },
    rules: {
      allowedTopics: [
        'professional background and experience',
        'technical skills and technologies',
        'past projects and achievements',
        'programming languages and frameworks',
        'work methodology and approach',
        'career goals and interests',
        'contact information for professional inquiries'
      ],
      blockedTopics: [
        'personal life and family matters',
        'political opinions or affiliations',
        'religious beliefs',
        'financial or investment advice',
        'medical or health advice',
        'legal advice',
        'controversial social topics',
        'salary or compensation details',
        'private company information',
        'gossip about colleagues or other people'
      ],
      responseGuidelines: [
        'Keep responses concise and professional',
        'Focus on Jackson\'s professional capabilities',
        'Redirect off-topic questions politely',
        'Do not discuss personal life unrelated to career',
        'Do not provide opinions on controversial topics',
        'Do not engage in debates or arguments',
        'If you don\'t know something, say so honestly'
      ],
      maxResponseLength: 'Keep responses under 200 words unless explaining technical concepts'
    }
  }
};

const LANGUAGE_NAMES = {
  en: 'English',
  zh: 'Chinese (中文)',
  es: 'Spanish (Español)',
  fr: 'French (Français)',
  de: 'German (Deutsch)',
  ja: 'Japanese (日本語)',
  ko: 'Korean (한국어)'
};

// Helper function to build system prompt
function buildSystemPrompt(personality, context) {
  const { userName, previousTopics = [], messageCount = 1, language = 'en' } = context || {};
  
  // Check if this is the Jackson portfolio persona
  if (personality.background && personality.background.portfolio) {
    const { background, rules } = personality;
    
    let prompt = `You are an AI assistant representing ${background.name}, an ${background.role}.

Background:
- Professional role: ${background.role}
- Experience: ${background.experience}
- Key skills: ${background.skills.join(', ')}

Your purpose is to help visitors learn about ${background.name}'s professional background, skills, and projects. Answer questions as if you are knowledgeable about ${background.name}'s work and experience.

Be ${personality.trait} in your responses.`;

    // Add scope limitations if rules exist
    if (rules) {
      prompt += `\n\n=== SCOPE AND LIMITATIONS ===`;
      
      if (rules.allowedTopics) {
        prompt += `\n\nYou should ONLY answer questions about:
${rules.allowedTopics.map(topic => `- ${topic}`).join('\n')}`;
      }
      
      // Add blocked topics
      if (rules.blockedTopics) {
        prompt += `\n\nYou must NOT answer questions about:
${rules.blockedTopics.map(topic => `- ${topic}`).join('\n')}

If asked about these topics, politely decline and redirect to professional topics.`;
      }
      
      if (rules.responseGuidelines) {
        prompt += `\n\nResponse Guidelines:
${rules.responseGuidelines.map(rule => `- ${rule}`).join('\n')}`;
      }
      
      if (rules.maxResponseLength) {
        prompt += `\n\nLength: ${rules.maxResponseLength}`;
      }
      
      prompt += `\n\nFor questions outside the allowed scope or about blocked topics, use these example responses:
- "I'm here to discuss ${background.name}'s professional experience. I'd be happy to tell you about [relevant professional topic]. What would you like to know?"
- "That's outside my area. I can help you learn about ${background.name}'s technical skills, projects, or work experience instead."
- "I focus on ${background.name}'s professional background. Let me know if you have questions about the work experience or skills!"`;
    }

    // Add language instruction
    if (language && language !== 'en') {
      prompt += `\n\n=== LANGUAGE ===
IMPORTANT: You MUST respond in ${LANGUAGE_NAMES[language]}. All of your responses should be written entirely in ${LANGUAGE_NAMES[language]}, including greetings, explanations, and technical terms where appropriate.`;
    }

    if (messageCount === 1) {
      prompt += `\n\nThis is the first message. Briefly introduce yourself and what you can help with.`;
    }
    
    return prompt;
  }
  
  // Original system prompt for other personalities
  let prompt = `You are ${personality.name}, an AI assistant that is ${personality.trait}.`;
  
  if (userName) {
    prompt += ` You are speaking with ${userName}.`;
  }
  
  if (previousTopics.length > 0) {
    prompt += ` Recent conversation topics: ${previousTopics.join(', ')}.`;
  }
  
  prompt += ` This is message ${messageCount} in the conversation.`;
  
  // Add language instruction for non-Jackson personalities
  if (language && language !== 'en') {
    prompt += `\n\nIMPORTANT: You MUST respond in ${LANGUAGE_NAMES[language]}. Write all responses entirely in ${LANGUAGE_NAMES[language]}.`;
  }
  
  return prompt;
}

const POE_API_KEY = process.env.POE_API_KEY;

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      message, 
      personality = 'claude',
      conversationHistory = [],
      userName,
      language = 'en'  // Get language from request
    } = req.body;

    // Validate
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Message is required and must be a string' 
      });
    }

    if (!POE_API_KEY) {
      return res.status(500).json({ 
        error: 'POE API key not configured' 
      });
    }

    // Get personality
    const aiPersonality = AI_PERSONALITIES[personality];

    if (!aiPersonality) {
      return res.status(400).json({ 
        error: `Personality '${personality}' not found` 
      });
    }

    // Extract topics for memory
    const conversationTopics = conversationHistory
      .filter(msg => msg.role === 'user')
      .map(msg => msg.content)
      .filter(Boolean)
      .slice(-3);

    // Build system prompt with language
    const systemPrompt = buildSystemPrompt(aiPersonality, {
      userName,
      previousTopics: conversationTopics,
      messageCount: conversationHistory.length + 1,
      language  // Pass language to system prompt
    });

    // Build messages array for POE API
    const messages = [];

    // Add system message
    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call POE API using OpenAI-compatible endpoint
    const response = await fetch('https://api.poe.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: aiPersonality.botName,
        messages: messages,
        stream: false
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('POE API error:', errorText);
      
      // Handle common errors
      if (response.status === 401) {
        return res.status(401).json({
          error: 'Invalid API key. Please check your POE_API_KEY.'
        });
      }
      
      if (response.status === 403) {
        return res.status(403).json({
          error: 'Access denied. Please check your Poe subscription.'
        });
      }
      
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please wait and try again.'
        });
      }
      
      return res.status(response.status).json({
        error: `POE API error: ${errorText}`
      });
    }

    // Parse JSON response
    const data = await response.json();
    
    // Extract AI response
    const aiResponse = data.choices[0].message.content;

    if (!aiResponse) {
      return res.status(500).json({
        error: 'No response from AI'
      });
    }

    // Success response
    const result = {
      success: true,
      response: aiResponse.trim(),
      personality: personality,
      aiName: aiPersonality.name,
      model: aiPersonality.botName,
      language: language,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json(result);

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      error: error.message || 'Internal server error'
    });
  }
};