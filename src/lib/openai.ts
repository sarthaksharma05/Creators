// OpenAI API integration for content generation
export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Content generation will be simulated.');
    }
  }

  async generateContent(type: string, niche: string, platform: string, additionalContext?: string): Promise<string> {
    // Simulate content generation for demo purposes
    if (!this.apiKey) {
      return this.simulateContentGeneration(type, niche, platform, additionalContext);
    }

    const prompts = {
      script: `Create an engaging ${platform} script for a ${niche} content creator. Make it conversational, valuable, and hook viewers from the start. Include a strong opening, valuable content, and clear call-to-action. ${additionalContext || ''}`,
      caption: `Write a compelling ${platform} caption for ${niche} content. Include relevant emojis, engaging hooks, and encourage interaction. ${additionalContext || ''}`,
      hashtags: `Generate 15-20 trending hashtags for ${niche} content on ${platform}. Mix popular and niche-specific tags for maximum reach. ${additionalContext || ''}`,
      ideas: `Suggest 10 creative content ideas for a ${niche} creator on ${platform}. Make them current, engaging, and aligned with trending topics. ${additionalContext || ''}`
    };

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are CreatorCopilot, an AI assistant specialized in helping content creators generate high-quality, engaging content across social media platforms.'
            },
            {
              role: 'user',
              content: prompts[type as keyof typeof prompts] || prompts.ideas
            }
          ],
          max_tokens: 1000,
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'Unable to generate content';
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.simulateContentGeneration(type, niche, platform, additionalContext);
    }
  }

  async getTrendingTopics(niche: string): Promise<string[]> {
    if (!this.apiKey) {
      return this.getMockTrends(niche);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a trend analysis expert. Provide current trending topics and content formats.'
            },
            {
              role: 'user',
              content: `What are the top 10 trending topics and content formats in the ${niche} niche this week? Focus on actionable, current trends that content creators can capitalize on.`
            }
          ],
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      return content.split('\n').filter((line: string) => line.trim()).slice(0, 10);
    } catch (error) {
      console.error('Trend analysis error:', error);
      return this.getMockTrends(niche);
    }
  }

  private simulateContentGeneration(type: string, niche: string, platform: string, additionalContext?: string): string {
    const mockContent = {
      script: `🎬 Hook: "Did you know that 90% of ${niche} enthusiasts make this one crucial mistake?"

Hey everyone! Welcome back to my channel. If you're passionate about ${niche}, today's video is going to change everything for you.

[Main Content]
I'm going to share the top 3 strategies that have completely transformed my approach to ${niche}. These aren't just theories - I've tested them myself and seen incredible results.

Strategy #1: [Specific actionable tip]
Strategy #2: [Another valuable insight]  
Strategy #3: [Game-changing technique]

[Call to Action]
If this helped you, smash that like button and subscribe for more ${niche} content. Drop a comment below with your biggest ${niche} challenge - I read every single one!

See you in the next video! 🚀`,

      caption: `✨ The ${niche} game-changer you've been waiting for! 

Just discovered this incredible technique that's completely transformed my ${platform} strategy. Swipe to see the results! 👉

Here's what I learned:
🔥 Consistency beats perfection every time
💡 Authenticity is your secret weapon
🎯 Know your audience inside and out
📈 Track what works and double down

Who else is ready to level up their ${niche} content? Drop a 🙌 in the comments!

#${niche} #ContentCreator #${platform}Tips #CreatorLife #Motivation #Success #Growth #Inspiration #ContentStrategy #DigitalMarketing`,

      hashtags: `#${niche} #${platform} #ContentCreator #CreatorEconomy #InfluencerLife #SocialMediaTips #ContentStrategy #DigitalMarketing #OnlineSuccess #CreatorTips #Viral${platform} #${niche}Community #ContentCreation #SocialMediaGrowth #InfluencerMarketing #CreatorLife #${platform}Growth #TrendingNow #ContentMarketing #SocialMediaStrategy`,

      ideas: `🚀 10 Viral ${niche} Content Ideas for ${platform}:

1. "Day in the Life" - Show your ${niche} routine
2. Before & After transformation posts
3. Common ${niche} mistakes (and how to fix them)
4. Behind-the-scenes of your ${niche} process
5. Quick tips carousel posts
6. ${niche} myth-busting content
7. Tool/product reviews in your niche
8. Collaboration with other ${niche} creators
9. Q&A sessions about ${niche}
10. Trending audio + ${niche} content mashup

💡 Pro tip: Always add your unique perspective to trending formats!`
    };

    return mockContent[type as keyof typeof mockContent] || mockContent.ideas;
  }

  private getMockTrends(niche: string): string[] {
    const trendsByNiche: { [key: string]: string[] } = {
      fitness: [
        'Functional movement training',
        'Mobility and flexibility focus',
        'Home workout equipment reviews',
        'Nutrition timing strategies',
        'Recovery and sleep optimization'
      ],
      business: [
        'AI tools for productivity',
        'Remote work best practices',
        'Personal branding strategies',
        'Sustainable business growth',
        'Digital marketing automation'
      ],
      lifestyle: [
        'Minimalist living tips',
        'Sustainable lifestyle choices',
        'Work-life balance strategies',
        'Self-care routines',
        'Mindful living practices'
      ],
      default: [
        'Short-form educational content',
        'Behind-the-scenes content',
        'Day-in-the-life vlogs',
        'Quick tips and hacks',
        'User-generated content challenges'
      ]
    };

    return trendsByNiche[niche] || trendsByNiche.default;
  }
}

export const openaiService = new OpenAIService();