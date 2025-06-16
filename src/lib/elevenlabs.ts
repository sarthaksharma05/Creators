// ElevenLabs API integration for voice generation
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';
  private supabaseUrl: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY || '';
    this.supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice generation will use Supabase Edge Functions.');
    }
  }

  getConfigStatus() {
    return {
      configured: !!this.apiKey,
      hasApiKey: !!this.apiKey
    };
  }

  async getVoices() {
    try {
      // Always use the Supabase Edge Function to get voices
      const response = await fetch(`${this.supabaseUrl}/functions/v1/elevenlabs-voices`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get voices: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || this.getMockVoices();
    } catch (error) {
      console.warn('ElevenLabs API error:', error, 'Falling back to mock voices.');
      return this.getMockVoices();
    }
  }

  async generateVoice(text: string, voiceId: string): Promise<string> {
    try {
      // Get the auth token from localStorage
      const token = this.getAuthToken();
      
      if (!token) {
        console.warn('No authentication token found');
        throw new Error('Please sign in to generate voiceovers. Authentication is required for voice generation.');
      }

      // Use Supabase Edge Function to securely generate voice
      const response = await fetch(`${this.supabaseUrl}/functions/v1/generate-voiceover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          script: text,
          voiceId,
          title: `Voiceover - ${new Date().toLocaleDateString()}`
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Voice generation API error:', error);
        
        // Check if it's a usage limit error
        if (response.status === 403 && error.error === 'Usage limit reached') {
          throw new Error(`${error.message} Current usage: ${error.usage.toFixed(1)}/${error.limit} minutes`);
        }
        
        // Check if it's an API key configuration error
        if (error.error && error.error.includes('API key not configured')) {
          throw new Error('ElevenLabs API is not configured on the server. Please contact support to enable voice generation.');
        }
        
        throw new Error(error.details || error.error || 'Failed to generate voiceover');
      }

      const data = await response.json();
      console.log('Voice generation successful:', data);
      return data.audioUrl;
    } catch (error) {
      console.error('Voice generation error:', error);
      
      // Don't fall back to simulation - throw the actual error
      throw error;
    }
  }

  private getMockVoices() {
    return [
      { voice_id: 'rachel', name: 'Rachel', category: 'Female' },
      { voice_id: 'domi', name: 'Domi', category: 'Female' },
      { voice_id: 'bella', name: 'Bella', category: 'Female' },
      { voice_id: 'antoni', name: 'Antoni', category: 'Male' },
      { voice_id: 'elli', name: 'Elli', category: 'Female' },
      { voice_id: 'josh', name: 'Josh', category: 'Male' },
      { voice_id: 'arnold', name: 'Arnold', category: 'Male' },
      { voice_id: 'adam', name: 'Adam', category: 'Male' },
      { voice_id: 'sam', name: 'Sam', category: 'Male' },
    ];
  }

  private getAuthToken(): string | null {
    // Try to get the token from localStorage
    // First try the standard format
    const authToken = localStorage.getItem('sb-' + this.supabaseUrl.split('//')[1].split('.')[0] + '-auth-token');
    
    if (authToken) {
      try {
        const authData = JSON.parse(authToken);
        return authData.access_token;
      } catch (e) {
        console.warn('Failed to parse auth token');
      }
    }
    
    // Try alternative formats
    const keys = Object.keys(localStorage);
    const authKey = keys.find(key => key.includes('supabase.auth.token') || key.includes('-auth-token'));
    
    if (authKey) {
      try {
        const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
        return authData.access_token || authData.token;
      } catch (e) {
        console.warn('Failed to parse alternative auth token');
      }
    }
    
    return null;
  }
}

export const elevenLabsService = new ElevenLabsService();