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
        console.warn(`ElevenLabs API error: ${response.statusText}. Falling back to mock voices.`);
        return this.getMockVoices();
      }

      const data = await response.json();
      return data.voices || [];
    } catch (error) {
      console.warn('ElevenLabs API error:', error, 'Falling back to mock voices.');
      return this.getMockVoices();
    }
  }

  async generateVoice(text: string, voiceId: string): Promise<string> {
    if (!this.apiKey) {
      console.log('No ElevenLabs API key found. Using simulated voice generation.');
      return this.simulateVoiceGeneration(text);
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
        console.warn(`ElevenLabs API error: ${response.statusText}. Using simulated voice generation.`);
        return this.simulateVoiceGeneration(text);
      }

      const audioBlob = await response.blob();
      return URL.createObjectURL(audioBlob);
    } catch (error) {
      console.warn('Voice generation error:', error, 'Using simulated voice generation.');
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

  private createMinimalAudioDataUrl(): string {
    // Create a minimal WAV file data URL as fallback
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
    
    const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }
}

export const elevenLabsService = new ElevenLabsService();