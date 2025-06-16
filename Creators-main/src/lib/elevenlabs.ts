// ElevenLabs API integration for voice generation
export class ElevenLabsService {
  private apiKey: string;
  private baseUrl = 'https://api.elevenlabs.io/v1';

  constructor() {
    this.apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    if (!this.apiKey) {
      console.warn('ElevenLabs API key not found. Voice generation will be simulated.');
    }
  }

  async getVoices() {
    if (!this.apiKey) {
      return this.getMockVoices();
    }

    try {
      const response = await fetch(`${this.baseUrl}/voices`, {
        headers: {
          'xi-api-key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.error('ElevenLabs API error:', error);
      return this.getMockVoices();
    }
  }

  async generateVoice(text: string, voiceId: string): Promise<string> {
    if (!this.apiKey) {
      return this.simulateVoiceGeneration();
    }

    try {
      const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.apiKey,
        },
        body: JSON.stringify({
          text,
          model_id: 'eleven_monolingual_v1',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.statusText}`);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.error('Voice generation error:', error);
      return this.simulateVoiceGeneration();
    }
  }

  private getMockVoices() {
    return [
      { voice_id: 'rachel', name: 'Rachel', category: 'Generated' },
      { voice_id: 'domi', name: 'Domi', category: 'Generated' },
      { voice_id: 'bella', name: 'Bella', category: 'Generated' },
      { voice_id: 'antoni', name: 'Antoni', category: 'Generated' },
      { voice_id: 'elli', name: 'Elli', category: 'Generated' },
    ];
  }

  private simulateVoiceGeneration(): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Return a placeholder audio URL (this would be a real audio file in production)
        resolve('data:audio/mpeg;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAAIAAAOJAAzMzMzMzMzMzMzMzMzMzMzMzMzZmZmZmZmZmZmZmZmZmZmZmZmmZmZmZmZmZmZmZmZmZmZmZmZzMzMzMzMzMzMzMzMzMzMzMzM//8zMzMzMzMzMzMzMzMzMzMzM/8AAAA8ZGVlcAAAAABkZWVwAAAADhpKEUtPRU9PT09PT09PT08=');
      }, 2000);
    });
  }
}

export const elevenLabsService = new ElevenLabsService();