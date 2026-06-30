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
  }
};

// Helper function to build system prompt
function buildSystemPrompt(personality, context) {
  const { userName, previousTopics = [], messageCount = 1 } = context || {};
  
  let prompt = `You are ${personality.name}, an AI assistant that is ${personality.trait}.`;
  
  if (userName) {
    prompt += ` You are speaking with ${userName}.`;
  }
  
  if (previousTopics.length > 0) {
    prompt += ` Recent conversation topics: ${previousTopics.join(', ')}.`;
  }
  
  prompt += ` This is message ${messageCount} in the conversation.`;
  
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
      userName 
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

    // Build system prompt
    const systemPrompt = buildSystemPrompt(aiPersonality, {
      userName,
      previousTopics: conversationTopics,
      messageCount: conversationHistory.length + 1
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