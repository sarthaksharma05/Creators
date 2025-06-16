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
        console.warn('No authentication token found, using simulated voice generation');
        return this.simulateVoiceGeneration(text);
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
          throw new Error('ElevenLabs API key is not configured. Please contact support or configure your API key in the Supabase dashboard.');
        }
        
        throw new Error(error.details || error.error || 'Failed to generate voiceover');
      }

      const data = await response.json();
      console.log('Voice generation successful:', data);
      return data.audioUrl;
    } catch (error) {
      console.error('Voice generation error:', error);
      
      // If the error is about API configuration, don't fall back to simulation
      if (error.message && (error.message.includes('API key') || error.message.includes('authentication'))) {
        throw error;
      }
      
      // Fall back to simulation for other errors
      console.log('Falling back to simulated voice generation');
      return this.simulateVoiceGeneration(text);
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

  private async simulateVoiceGeneration(text: string): Promise<string> {
    console.log('Simulating voice generation for text:', text.substring(0, 50) + '...');
    
    // Simulate realistic generation time based on text length
    const delay = Math.min(Math.max(text.length * 50, 1000), 5000);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Create a simple audio context with a tone for demo purposes
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const duration = Math.min(Math.max(text.length * 0.1, 2), 10); // 2-10 seconds based on text length
      const sampleRate = audioContext.sampleRate;
      const frameCount = sampleRate * duration;
      
      const audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
      const channelData = audioBuffer.getChannelData(0);
      
      // Generate a simple tone sequence to simulate speech
      for (let i = 0; i < frameCount; i++) {
        const t = i / sampleRate;
        // Create a varying tone that simulates speech patterns
        const frequency = 200 + Math.sin(t * 2) * 100 + Math.sin(t * 5) * 50;
        const amplitude = 0.1 * Math.sin(t * 10) * Math.exp(-t * 0.5);
        channelData[i] = amplitude * Math.sin(2 * Math.PI * frequency * t);
      }
      
      // Convert to WAV blob
      const wavBlob = this.audioBufferToWav(audioBuffer);
      const audioUrl = URL.createObjectURL(wavBlob);
      
      console.log('Generated simulated audio URL:', audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('Error creating simulated audio:', error);
      // Fallback to a data URL with minimal audio
      return this.createMinimalAudioDataUrl();
    }
  }

  private audioBufferToWav(buffer: AudioBuffer): Blob {
    // Check if the buffer has zero length and return minimal audio if so
    if (!buffer || buffer.length === 0) {
      console.warn('AudioBuffer has zero length, creating minimal audio instead');
      // Create a minimal WAV file blob as fallback
      return this.createMinimalAudioBlob();
    }

    const length = buffer.length;
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = sampleRate * blockAlign;
    const dataSize = length * blockAlign;
    const fileSize = 36 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    
    // Helper function to write strings
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize, true); // File size - 8
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // Audio format (1 = PCM)
    view.setUint16(22, numChannels, true); // Number of channels
    view.setUint32(24, sampleRate, true); // Sample rate
    view.setUint32(28, byteRate, true); // Byte rate
    view.setUint16(32, blockAlign, true); // Block align
    view.setUint16(34, bitsPerSample, true); // Bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true); // Data size
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    const channelData = buffer.getChannelData(0);
    
    for (let i = 0; i < length; i++) {
      // Clamp sample to [-1, 1] range and convert to 16-bit signed integer
      const sample = Math.max(-1, Math.min(1, channelData[i]));
      const intSample = Math.round(sample * 32767);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private createMinimalAudioBlob(): Blob {
    // Create a minimal WAV file blob as fallback
    const sampleRate = 22050;
    const duration = 2; // 2 seconds
    const frameCount = sampleRate * duration;
    const dataSize = frameCount * 2; // 16-bit samples
    const fileSize = 36 + dataSize;
    
    const arrayBuffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(arrayBuffer);
    
    // Helper function to write strings
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    // RIFF header
    writeString(0, 'RIFF');
    view.setUint32(4, fileSize, true);
    writeString(8, 'WAVE');
    
    // fmt chunk
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // PCM
    view.setUint16(22, 1, true); // Mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    
    // data chunk
    writeString(36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Generate simple tone
    let offset = 44;
    for (let i = 0; i < frameCount; i++) {
      const t = i / sampleRate;
      const sample = 0.1 * Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t);
      const intSample = Math.round(sample * 32767);
      view.setInt16(offset, intSample, true);
      offset += 2;
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private createMinimalAudioDataUrl(): string {
    const blob = this.createMinimalAudioBlob();
    return URL.createObjectURL(blob);
  }
}

export const elevenLabsService = new ElevenLabsService();