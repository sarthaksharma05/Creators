import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Mic, Play, Pause, Download, Save, Volume2, AudioWaveform as Waveform, RefreshCw } from 'lucide-react';
import { elevenLabsService } from '../../lib/elevenlabs';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface VoiceoverForm {
  title: string;
  script: string;
  voiceId: string;
}

interface GeneratedVoiceover {
  id: string;
  title: string;
  script: string;
  audioUrl: string;
  voiceId: string;
  createdAt: string;
}

export function VoiceoverStudio() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [voices, setVoices] = useState<any[]>([]);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [savedVoiceovers, setSavedVoiceovers] = useState<GeneratedVoiceover[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const { register, handleSubmit, watch, setValue, reset } = useForm<VoiceoverForm>({
    defaultValues: {
      title: '',
      script: '',
      voiceId: '',
    }
  });

  useEffect(() => {
    loadVoices();
    loadSavedVoiceovers();
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
      }
    };
  }, [currentAudio]);

  const loadVoices = async () => {
    try {
      const voiceList = await elevenLabsService.getVoices();
      setVoices(voiceList);
      if (voiceList.length > 0) {
        setValue('voiceId', voiceList[0].voice_id);
      }
    } catch (error) {
      console.error('Error loading voices:', error);
      toast.error('Failed to load voices');
    }
  };

  const loadSavedVoiceovers = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('voiceovers')
        .select('*')
        .eq('user_id', profile.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      // Convert to our interface format
      const voiceovers: GeneratedVoiceover[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        script: item.script,
        audioUrl: item.audio_url || '',
        voiceId: item.voice_id,
        createdAt: item.created_at
      }));
      
      setSavedVoiceovers(voiceovers);
    } catch (error) {
      console.error('Error loading saved voiceovers:', error);
    }
  };

  const onSubmit = async (data: VoiceoverForm) => {
    if (!profile?.is_pro && !canGenerateVoice()) {
      toast.error('Upgrade to Pro for unlimited voiceover generations');
      return;
    }

    if (!data.script.trim()) {
      toast.error('Please enter a script to generate voiceover');
      return;
    }

    if (!data.title.trim()) {
      toast.error('Please enter a title for your voiceover');
      return;
    }

    setLoading(true);
    setAudioUrl(''); // Clear previous audio
    setCurrentTitle(data.title);

    try {
      console.log('Generating voiceover with:', { script: data.script, voiceId: data.voiceId });
      
      const generatedAudioUrl = await elevenLabsService.generateVoice(data.script, data.voiceId);
      
      if (!generatedAudioUrl) {
        throw new Error('No audio URL returned from voice generation');
      }

      console.log('Generated audio URL:', generatedAudioUrl);
      setAudioUrl(generatedAudioUrl);
      
      // Save to database
      if (profile) {
        const { data: savedVoiceover, error } = await supabase
          .from('voiceovers')
          .insert({
            user_id: profile.id,
            title: data.title,
            script: data.script,
            voice_id: data.voiceId,
            audio_url: generatedAudioUrl,
            status: 'completed',
          })
          .select()
          .single();

        if (error) {
          console.error('Database save error:', error);
          // Don't throw here, as the audio was generated successfully
          toast.warning('Voiceover generated but failed to save to history');
        } else {
          console.log('Voiceover saved to database:', savedVoiceover);
          // Reload saved voiceovers
          loadSavedVoiceovers();
        }
      }
      
      toast.success('Voiceover generated successfully!');
    } catch (error: any) {
      console.error('Voiceover generation error:', error);
      toast.error(error.message || 'Failed to generate voiceover');
    } finally {
      setLoading(false);
    }
  };

  const canGenerateVoice = () => {
    // Simple rate limiting for free users
    return profile?.is_pro || true; // For demo purposes
  };

  const playAudio = async (url: string, title?: string) => {
    try {
      console.log('Attempting to play audio:', url);
      
      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        setIsPlaying(false);
      }

      // Create new audio instance
      const audio = new Audio();
      
      // Set up event listeners before setting src
      audio.addEventListener('loadstart', () => {
        console.log('Audio loading started');
      });

      audio.addEventListener('canplay', () => {
        console.log('Audio can start playing');
      });

      audio.addEventListener('loadeddata', () => {
        console.log('Audio data loaded');
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio error:', e);
        toast.error('Failed to load audio. Please try generating again.');
        setIsPlaying(false);
      });

      audio.addEventListener('ended', () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
      });

      audio.addEventListener('pause', () => {
        console.log('Audio paused');
        setIsPlaying(false);
      });

      audio.addEventListener('play', () => {
        console.log('Audio started playing');
        setIsPlaying(true);
      });

      // Set the audio source
      audio.src = url;
      audio.preload = 'auto';
      
      // Store reference
      setCurrentAudio(audio);
      audioRef.current = audio;

      // Attempt to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Audio playback started successfully');
            setIsPlaying(true);
            if (title) {
              toast.success(`Playing: ${title}`);
            }
          })
          .catch((error) => {
            console.error('Audio play failed:', error);
            toast.error('Failed to play audio. Please check your browser settings.');
            setIsPlaying(false);
          });
      }
    } catch (error) {
      console.error('Play audio error:', error);
      toast.error('Unable to play audio');
      setIsPlaying(false);
    }
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
    }
  };

  const downloadAudio = (url: string, title: string) => {
    if (!url) {
      toast.error('No audio to download');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_voiceover.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download audio');
    }
  };

  const saveCurrentVoiceover = async () => {
    if (!audioUrl || !currentTitle || !profile) {
      toast.error('No voiceover to save');
      return;
    }

    try {
      const { error } = await supabase
        .from('voiceovers')
        .insert({
          user_id: profile.id,
          title: currentTitle,
          script: watch('script'),
          voice_id: watch('voiceId'),
          audio_url: audioUrl,
          status: 'completed',
        });

      if (error) throw error;
      
      toast.success('Voiceover saved successfully!');
      loadSavedVoiceovers();
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save voiceover');
    }
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
              Voiceover Title *
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
              Script *
            </label>
            <textarea
              {...register('script', { required: 'Script is required' })}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter the text you want to convert to speech..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Character count: {watch('script')?.length || 0} (recommended: 50-500 characters)
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
                        {voice.category || 'AI Voice'}
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

      {/* Current Generated Audio Player */}
      {audioUrl && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentTitle || 'Generated Voiceover'}
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadAudio(audioUrl, currentTitle || 'voiceover')}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download audio"
              >
                <Download className="h-5 w-5" />
              </button>
              <button
                onClick={saveCurrentVoiceover}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Save to library"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-secondary-50 to-cyan-50 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? pauseAudio : () => playAudio(audioUrl, currentTitle)}
                className="p-3 bg-gradient-to-r from-secondary-500 to-cyan-500 text-white rounded-full hover:from-secondary-600 hover:to-cyan-600 transition-all shadow-lg"
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
                    {currentTitle || 'Generated Voiceover'}
                  </span>
                  {isPlaying && (
                    <span className="text-xs text-green-600 font-medium">Playing...</span>
                  )}
                </div>
                
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={`bg-gradient-to-r from-secondary-500 to-cyan-500 h-2 rounded-full transition-all duration-300 ${
                    isPlaying ? 'w-1/3' : 'w-0'
                  }`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Voiceovers Library */}
      {savedVoiceovers.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Voiceover Library</h3>
          <div className="space-y-3">
            {savedVoiceovers.map((voiceover) => (
              <div key={voiceover.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{voiceover.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-2">{voiceover.script}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {new Date(voiceover.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => playAudio(voiceover.audioUrl, voiceover.title)}
                    className="p-2 text-secondary-600 hover:text-secondary-700 hover:bg-secondary-100 rounded-lg transition-colors"
                    title="Play voiceover"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => downloadAudio(voiceover.audioUrl, voiceover.title)}
                    className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Download voiceover"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pro Features Upsell */}
      {!profile?.is_pro && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <Mic className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Pro Features</h3>
          </div>
          <ul className="space-y-2 text-sm text-purple-700 mb-4">
            <li>• Unlimited voiceover generations</li>
            <li>• Premium voice library (100+ voices)</li>
            <li>• Custom voice training</li>
            <li>• High-quality audio downloads</li>
            <li>• Batch processing</li>
            <li>• Commercial usage rights</li>
          </ul>
          <button 
            onClick={() => window.location.href = '/app/upgrade'}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Upgrade to Pro
          </button>
        </div>
      )}
    </div>
  );
}