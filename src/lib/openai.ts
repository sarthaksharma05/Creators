// OpenAI API integration for content generation
export class OpenAIService {
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';
  private supabaseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_OPENAI_API_KEY || '';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    
    if (!this.apiKey) {
      console.warn('OpenAI API key not found. Content generation will use Supabase Edge Functions.');
    }
  }

  async generateContent(type: string, niche: string, platform: string, additionalContext?: string): Promise<string> {
    try {
      // Use Supabase Edge Function to securely call OpenAI
      const response = await fetch(`${this.supabaseUrl}/functions/v1/generate-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          type,
          niche,
          platform,
          additionalContext,
          title: `${type.charAt(0).toUpperCase() + type.slice(1)} for ${niche} on ${platform}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Check if it's a usage limit error
        if (response.status === 403 && error.error === 'Usage limit reached') {
          throw new Error(`${error.message} Current usage: ${error.usage}/${error.limit}`);
        }
        
        throw new Error(error.error || 'Failed to generate content');
      }

      const data = await response.json();
      return data.content;
    } catch (error) {
      console.error('Content generation error:', error);
      
      // Fall back to simulation if the API call fails
      return this.simulateContentGeneration(type, niche, platform, additionalContext);
    }
  }

  async getTrendingTopics(niche: string): Promise<string[]> {
    try {
      // Use Supabase Edge Function to securely call OpenAI
      const response = await fetch(`${this.supabaseUrl}/functions/v1/trending-topics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({ niche })
      });

      if (!response.ok) {
        throw new Error(`Failed to get trending topics: ${response.statusText}`);
      }

      const data = await response.json();
      return data.topics;
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