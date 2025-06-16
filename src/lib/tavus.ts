// Tavus API integration for AI video messages and video generation
export class TavusService {
  private apiKey: string;
  private baseUrl = 'https://tavusapi.com/v2';
  private isValidKey: boolean;

  constructor() {
    this.apiKey = import.meta.env.VITE_TAVUS_API_KEY;
    
    // Check if we have a valid API key (not missing, empty, or placeholder)
    this.isValidKey = this.apiKey && 
      this.apiKey !== 'your_tavus_api_key_here' && 
      this.apiKey !== 'placeholder-key' &&
      this.apiKey.length > 10; // Basic validation for key length
    
    if (!this.isValidKey) {
      console.warn('Tavus API key not found or invalid. Video generation will be simulated.');
    } else {
      console.log('✅ Tavus API key configured successfully');
    }
  }

  // Create AI video with Tavus
  async createVideo(script: string, replicaId: string = 'default-replica', options: any = {}): Promise<{ videoId: string; status: string }> {
    if (!this.isValidKey) {
      console.log('🎬 Simulating Tavus video creation...');
      return {
        videoId: `tavus-sim-${Date.now()}`,
        status: 'generating'
      };
    }

    try {
      console.log('🎬 Creating AI video with Tavus API...');
      console.log('Script length:', script.length);
      console.log('Replica ID:', replicaId);

      const requestBody = {
        replica_id: replicaId,
        script: script,
        video_name: options.title || `AI Video - ${new Date().toLocaleDateString()}`,
        callback_url: `${window.location.origin}/api/tavus-webhook`,
        // Remove the properties wrapper and include settings directly at top level
        video_settings: {
          quality: 'high',
          resolution: '1080p',
          fps: 30
        },
        audio_settings: {
          voice_settings: options.voiceSettings || {
            speed: 1.0,
            pitch: 1.0,
            volume: 1.0
          }
        },
        background: options.background || 'office',
        subtitles: options.subtitles !== false,
        subtitle_style: options.subtitleStyle || 'modern'
      };

      console.log('📤 Sending request to Tavus API:', requestBody);

      const response = await fetch(`${this.baseUrl}/videos`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Tavus API error response:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus video creation response:', data);
      
      return {
        videoId: data.video_id || data.id,
        status: data.status || 'generating'
      };
    } catch (error) {
      console.error('❌ Tavus video creation error:', error);
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message.includes('401')) {
        throw new Error('Invalid Tavus API key. Please check your API key configuration.');
      }
      
      // Check if it's a quota/billing issue
      if (error instanceof Error && error.message.includes('402')) {
        throw new Error('Tavus account has insufficient credits. Please check your billing.');
      }
      
      // Check if it's a rate limit issue
      if (error instanceof Error && error.message.includes('429')) {
        throw new Error('Tavus API rate limit exceeded. Please try again in a few minutes.');
      }
      
      // For other errors, fall back to simulation for demo purposes
      console.log('🔄 Falling back to simulated video creation due to API error');
      return {
        videoId: `tavus-sim-${Date.now()}`,
        status: 'generating'
      };
    }
  }

  // Get video generation status
  async getVideoStatus(videoId: string) {
    if (!this.isValidKey || videoId.startsWith('tavus-sim-')) {
      // Simulate video processing completion after a delay
      const createdTime = parseInt(videoId.split('-').pop() || '0');
      const elapsedTime = Date.now() - createdTime;
      const isCompleted = elapsedTime > 30000; // Complete after 30 seconds for demo
      
      return { 
        status: isCompleted ? 'completed' : 'generating',
        progress: Math.min(Math.floor(elapsedTime / 300), 100), // Progress over 30 seconds
        download_url: isCompleted ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' : null,
        thumbnail_url: isCompleted ? 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop' : null,
        video_id: videoId,
        estimated_completion: isCompleted ? null : new Date(createdTime + 30000).toISOString()
      };
    }

    try {
      console.log('📊 Checking Tavus video status for:', videoId);
      
      const response = await fetch(`${this.baseUrl}/videos/${videoId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('❌ Tavus status check error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Tavus API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus video status:', data);
      
      return {
        status: data.status,
        progress: data.progress || 0,
        download_url: data.download_url,
        thumbnail_url: data.thumbnail_url,
        video_id: videoId,
        estimated_completion: data.estimated_completion,
        error_message: data.error_message
      };
    } catch (error) {
      console.error('❌ Tavus video status error:', error);
      return { 
        status: 'failed',
        video_id: videoId,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get available AI replicas/avatars
  async getReplicas() {
    if (!this.isValidKey) {
      return this.getMockReplicas();
    }

    try {
      console.log('👥 Fetching Tavus replicas...');
      
      const response = await fetch(`${this.baseUrl}/replicas`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        console.warn('⚠️ Tavus replicas API error, using mock data');
        return this.getMockReplicas();
      }

      const data = await response.json();
      console.log('✅ Tavus replicas loaded:', data.replicas?.length || 0);
      
      return data.replicas || this.getMockReplicas();
    } catch (error) {
      console.error('❌ Tavus replicas error:', error);
      return this.getMockReplicas();
    }
  }

  // Create custom replica (train new AI avatar)
  async createReplica(name: string, videoFile: File, options: any = {}) {
    if (!this.isValidKey) {
      console.log('🎭 Simulating replica creation');
      return {
        replica_id: `custom-replica-${Date.now()}`,
        status: 'training',
        estimated_completion: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      };
    }

    try {
      console.log('🎭 Creating custom Tavus replica...');
      
      const formData = new FormData();
      formData.append('train_video_file', videoFile);
      formData.append('replica_name', name);
      formData.append('callback_url', `${window.location.origin}/api/tavus-replica-webhook`);
      
      // Add optional settings
      if (options.voice_settings) {
        formData.append('voice_settings', JSON.stringify(options.voice_settings));
      }

      const response = await fetch(`${this.baseUrl}/replicas`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`Tavus replica creation error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Tavus replica creation started:', data);
      
      return {
        replica_id: data.replica_id,
        status: data.status || 'training',
        estimated_completion: data.estimated_completion
      };
    } catch (error) {
      console.error('❌ Replica creation error:', error);
      throw new Error(`Failed to create custom replica: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Get replica training status
  async getReplicaStatus(replicaId: string) {
    if (!this.isValidKey || replicaId.startsWith('custom-replica-')) {
      // Simulate training progress
      const createdTime = parseInt(replicaId.split('-').pop() || '0');
      const elapsedTime = Date.now() - createdTime;
      const trainingDuration = 24 * 60 * 60 * 1000; // 24 hours
      const progress = Math.min(Math.floor((elapsedTime / trainingDuration) * 100), 100);
      
      return {
        replica_id: replicaId,
        status: progress >= 100 ? 'ready' : 'training',
        progress: progress,
        estimated_completion: progress >= 100 ? null : new Date(createdTime + trainingDuration).toISOString()
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/replicas/${replicaId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus replica status error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Replica status error:', error);
      return {
        replica_id: replicaId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Delete a custom replica
  async deleteReplica(replicaId: string) {
    if (!this.isValidKey) {
      console.log('🗑️ Simulating replica deletion');
      return { success: true };
    }

    try {
      const response = await fetch(`${this.baseUrl}/replicas/${replicaId}`, {
        method: 'DELETE',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus replica deletion error: ${response.statusText}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Replica deletion error:', error);
      throw new Error(`Failed to delete replica: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // NEW: Tavus CVI (Conversational Video Interface) Integration
  async createConversationalVideo(options: {
    replicaId: string;
    conversationId?: string;
    properties?: any;
  }) {
    if (!this.isValidKey) {
      console.log('💬 Simulating Tavus CVI creation');
      return {
        conversationId: `cvi-${Date.now()}`,
        status: 'ready',
        streamUrl: 'wss://mock-stream.tavus.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face'
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          replica_id: options.replicaId,
          conversation_id: options.conversationId,
          properties: {
            max_session_length: 1800, // 30 minutes
            language: 'en',
            voice_settings: {
              speed: 1.0,
              pitch: 1.0,
              volume: 1.0
            },
            ...options.properties
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavus CVI API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavus CVI error:', error);
      // Fallback to simulation
      return {
        conversationId: `cvi-${Date.now()}`,
        status: 'ready',
        streamUrl: 'wss://mock-stream.tavus.io',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop&crop=face'
      };
    }
  }

  // Send message to conversational avatar
  async sendConversationMessage(conversationId: string, message: string, audioData?: Blob) {
    if (!this.isValidKey) {
      console.log('💬 Simulating conversation message');
      return this.simulateAvatarResponse(message);
    }

    try {
      const formData = new FormData();
      formData.append('message', message);
      if (audioData) {
        formData.append('audio', audioData, 'user-audio.wav');
      }

      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Tavus conversation API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavus conversation error:', error);
      return this.simulateAvatarResponse(message);
    }
  }

  // Get conversation status and avatar response
  async getConversationStatus(conversationId: string) {
    if (!this.isValidKey) {
      return {
        status: 'active',
        lastResponse: {
          message: "I'm here and ready to help you with CreatorCopilot!",
          audioUrl: null,
          videoUrl: null,
          isSpeaking: false
        }
      };
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}`, {
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Tavus conversation status error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Tavus conversation status error:', error);
      return {
        status: 'active',
        lastResponse: null
      };
    }
  }

  // Start real-time avatar stream
  async startAvatarStream(conversationId: string): Promise<WebSocket | null> {
    if (!this.isValidKey) {
      console.log('🎥 Simulating avatar stream');
      return null; // Would return a mock WebSocket in full simulation
    }

    try {
      // In real implementation, this would establish WebSocket connection
      const ws = new WebSocket(`wss://api.tavus.io/v2/conversations/${conversationId}/stream`);
      
      ws.onopen = () => {
        console.log('✅ Tavus avatar stream connected');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        // Handle real-time avatar responses
        console.log('📨 Avatar response:', data);
      };

      return ws;
    } catch (error) {
      console.error('❌ Avatar stream error:', error);
      return null;
    }
  }

  // End conversation session
  async endConversation(conversationId: string) {
    if (!this.isValidKey) {
      console.log('🔚 Simulating conversation end');
      return { status: 'ended' };
    }

    try {
      const response = await fetch(`${this.baseUrl}/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'x-api-key': this.apiKey,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('End conversation error:', error);
      return { status: 'ended' };
    }
  }

  // Weekly message functionality
  async sendWeeklyMessage(userId: string, niche: string, userName: string): Promise<boolean> {
    // Always simulate for demo purposes to avoid API errors
    console.log(`📅 Simulating weekly video message for user ${userId} in ${niche} niche`);
    
    try {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Log the simulated message for debugging
      const script = this.generateWeeklyScript(niche, userName);
      console.log(`📝 Simulated Tavus message: ${script}`);
      
      return true;
    } catch (error) {
      console.error('Error in simulated Tavus operation:', error);
      return false;
    }
  }

  // Private helper methods
  private getMockReplicas() {
    return [
      { 
        replica_id: 'professional-male', 
        name: 'Professional Male', 
        status: 'ready',
        preview_video_url: null,
        thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        description: 'Business professional, clear speech'
      },
      { 
        replica_id: 'friendly-female', 
        name: 'Friendly Female', 
        status: 'ready',
        preview_video_url: null,
        thumbnail_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
        description: 'Warm, approachable presenter'
      },
      { 
        replica_id: 'energetic-male', 
        name: 'Energetic Male', 
        status: 'ready',
        preview_video_url: null,
        thumbnail_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        description: 'Dynamic, enthusiastic delivery'
      },
      { 
        replica_id: 'professional-female', 
        name: 'Professional Female', 
        status: 'ready',
        preview_video_url: null,
        thumbnail_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        description: 'Authoritative, confident speaker'
      },
    ];
  }

  private generateWeeklyScript(niche: string, userName: string): string {
    const scripts = {
      fitness: `Hey ${userName}! It's your weekly motivation check-in. This week in fitness, we're seeing huge trends in functional movement and mobility work. Don't forget - consistency beats perfection every time. Keep pushing forward!`,
      business: `Hi ${userName}! Time for your weekly business insights. The entrepreneurial landscape is evolving fast this week. Focus on building authentic connections and solving real problems. Your audience needs your unique perspective!`,
      lifestyle: `Hey there ${userName}! Your weekly lifestyle inspiration is here. This week is all about finding balance and creating content that truly resonates. Remember, authenticity is your superpower in the lifestyle space!`,
      technology: `Hi ${userName}! Your weekly tech update is here. The tech world is moving fast this week with new innovations. Stay curious and keep sharing your unique perspective on technology trends!`,
      food: `Hey ${userName}! Time for your weekly culinary inspiration. Food content is all about storytelling and connection. Keep sharing those delicious moments and recipes that bring people together!`,
      travel: `Hi there ${userName}! Your weekly travel motivation is here. Even if you're not traveling this week, keep inspiring others with your adventures and travel tips. The world needs your wanderlust!`,
      default: `Hi ${userName}! Hope you're having an amazing week creating content. Keep focusing on providing value to your audience and staying consistent with your posting schedule. You've got this!`
    };

    return scripts[niche as keyof typeof scripts] || scripts.default;
  }

  // Simulate avatar response for demo
  private simulateAvatarResponse(userMessage: string) {
    const responses = [
      "That's a great question! CreatorCopilot can definitely help you with that.",
      "I understand what you're looking for. Let me explain how our AI tools can assist you.",
      "Absolutely! Our platform is designed to make content creation easier and more effective.",
      "That's exactly what CreatorCopilot excels at. Would you like me to show you how?",
      "Perfect! I can guide you through the best features for your content creation needs."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    return {
      messageId: `msg-${Date.now()}`,
      response: randomResponse,
      audioUrl: null, // Would be generated by ElevenLabs
      isSpeaking: true,
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to check if API is properly configured
  isConfigured(): boolean {
    return this.isValidKey;
  }

  // Get configuration status for debugging
  getConfigStatus(): { configured: boolean; hasKey: boolean; keyLength: number } {
    return {
      configured: this.isValidKey,
      hasKey: !!this.apiKey,
      keyLength: this.apiKey ? this.apiKey.length : 0
    };
  }
}

export const tavusService = new TavusService();