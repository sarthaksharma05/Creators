import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Mic, Play, Pause, Download, Save, Volume2, AudioWaveform as Waveform } from 'lucide-react';
import { elevenLabsService } from '../../lib/elevenlabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface VoiceoverForm {
  title: string;
  script: string;
  voiceId: string;
}

export function VoiceoverStudio() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  
  const { register, handleSubmit, watch, setValue } = useForm<VoiceoverForm>({
    defaultValues: {
      title: '',
      script: '',
      voiceId: '',
    }
  });

  useEffect(() => {
    loadVoices();
  }, []);

  const loadVoices = async () => {
    try {
      const voiceList = await elevenLabsService.getVoices();
      setVoices(voiceList);
      if (voiceList.length > 0) {
        setValue('voiceId', voiceList[0].voice_id);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
    }
  };

  const onSubmit = async (data: VoiceoverForm) => {
    if (!profile?.is_pro && !canGenerateVoice()) {
      toast.error('Upgrade to Pro for unlimited voiceover generations');
      return;
    }

    setLoading(true);
    try {
      const audioUrl = await elevenLabsService.generateVoice(data.script, data.voiceId);
      setAudioUrl(audioUrl);
      
      // Save to database
      if (profile) {
        const { error } = await supabase
          .from('voiceovers')
          .insert({
            user_id: profile.id,
            title: data.title,
            script: data.script,
            voice_id: data.voiceId,
            audio_url: audioUrl,
            status: 'completed',
          });

        if (error) throw error;
        toast.success('Voiceover generated successfully!');
      }
    } catch (error) {
      toast.error('Failed to generate voiceover');
    } finally {
      setLoading(false);
    }
  };

  const canGenerateVoice = () => {
    // Simple rate limiting for free users
    return profile?.is_pro || true; // For demo purposes
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (audioRef) {
      audioRef.pause();
    }

    const audio = new Audio(audioUrl);
    setAudioRef(audio);
    
    audio.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      toast.error('Unable to play audio');
    });

    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  const pauseAudio = () => {
    if (audioRef) {
      audioRef.pause();
      setIsPlaying(false);
    }
  };

  const downloadAudio = () => {
    if (!audioUrl) return;
    
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `voiceover-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-secondary-500 to-cyan-500 rounded-lg">
            <Mic className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voiceover Studio</h1>
            <p className="text-gray-600">Transform text into professional voiceovers</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voiceover Title
            </label>
            <input
              {...register('title', { required: 'Title is required' })}
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter a title for your voiceover..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Script
            </label>
            <textarea
              {...register('script', { required: 'Script is required' })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter the text you want to convert to speech..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Character count: {watch('script')?.length || 0}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Selection
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {voices.map((voice) => (
                <label key={voice.voice_id} className="relative">
                  <input
                    {...register('voiceId')}
                    type="radio"
                    value={voice.voice_id}
                    className="sr-only peer"
                  />
                  <div className="flex items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                    <Volume2 className="h-5 w-5 text-gray-400 peer-checked:text-primary-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900 peer-checked:text-primary-900">
                        {voice.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {voice.category}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-secondary-500 to-cyan-500 text-white py-3 px-4 rounded-lg font-medium hover:from-secondary-600 hover:to-cyan-600 focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating Voiceover...</span>
              </div>
            ) : (
              'Generate Voiceover'
            )}
          </button>
        </form>
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Generated Voiceover</h3>
            <div className="flex space-x-2">
              <button
                onClick={downloadAudio}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download audio"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-secondary-50 to-cyan-50 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="p-3 bg-gradient-to-r from-secondary-500 to-cyan-500 text-white rounded-full hover:from-secondary-600 hover:to-cyan-600 transition-all"
              >
                {isPlaying ? (
                  <Pause className="h-6 w-6" />
                ) : (
                  <Play className="h-6 w-6" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Waveform className="h-5 w-5 text-secondary-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {watch('title') || 'Untitled Voiceover'}
                  </span>
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-secondary-500 to-cyan-500 h-2 rounded-full w-1/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}