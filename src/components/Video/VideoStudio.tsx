import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Video, 
  Play, 
  Pause, 
  Download, 
  Save, 
  Upload,
  Settings,
  Eye,
  Palette,
  Type,
  Clock,
  User,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader,
  Wand2,
  Sparkles,
  Crown,
  ExternalLink
} from 'lucide-react';
import { tavusService } from '../../lib/tavus';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

interface VideoForm {
  title: string;
  script: string;
  replicaId: string;
  background: string;
  subtitles: boolean;
  subtitleStyle: string;
  voiceSettings: {
    speed: number;
    pitch: number;
    volume: number;
  };
}

interface VideoProject {
  id: string;
  title: string;
  script: string;
  status: 'generating' | 'completed' | 'failed';
  progress?: number;
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  settings: any;
  estimatedCompletion?: string;
  errorMessage?: string;
}

export function VideoStudio() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [replicas, setReplicas] = useState<any[]>([]);
  const [videoProjects, setVideoProjects] = useState<VideoProject[]>([]);
  const [currentVideo, setCurrentVideo] = useState<VideoProject | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [activeTab, setActiveTab] = useState('create');
  const [pollingIntervals, setPollingIntervals] = useState<Map<string, NodeJS.Timeout>>(new Map());
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<VideoForm>({
    defaultValues: {
      title: '',
      script: '',
      replicaId: '',
      background: 'office',
      subtitles: true,
      subtitleStyle: 'modern',
      voiceSettings: {
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
      },
    }
  });

  const backgrounds = [
    { id: 'office', name: 'Modern Office', preview: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&h=200&fit=crop' },
    { id: 'studio', name: 'Professional Studio', preview: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=200&fit=crop' },
    { id: 'home', name: 'Home Office', preview: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=200&fit=crop' },
    { id: 'outdoor', name: 'Outdoor Setting', preview: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&h=200&fit=crop' },
    { id: 'green', name: 'Green Screen', preview: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=300&h=200&fit=crop' },
  ];

  const subtitleStyles = [
    { id: 'modern', name: 'Modern', description: 'Clean, minimal style' },
    { id: 'bold', name: 'Bold', description: 'High contrast, bold text' },
    { id: 'elegant', name: 'Elegant', description: 'Sophisticated typography' },
    { id: 'casual', name: 'Casual', description: 'Friendly, approachable style' },
  ];

  useEffect(() => {
    loadReplicas();
    loadVideoProjects();
    
    // Cleanup polling intervals on unmount
    return () => {
      pollingIntervals.forEach(interval => clearInterval(interval));
    };
  }, []);

  const loadReplicas = async () => {
    try {
      console.log('🎭 Loading Tavus replicas...');
      const replicaList = await tavusService.getReplicas();
      console.log('✅ Replicas loaded:', replicaList.length);
      setReplicas(replicaList);
      
      if (replicaList.length > 0) {
        setValue('replicaId', replicaList[0].replica_id);
        console.log('✅ Default replica set to:', replicaList[0].name);
      }
    } catch (error) {
      console.error('❌ Error loading replicas:', error);
      toast.error('Failed to load AI avatars');
    }
  };

  const loadVideoProjects = async () => {
    try {
      // Load from localStorage for demo (in production, this would come from database)
      const savedProjects = localStorage.getItem('videoProjects');
      if (savedProjects) {
        const projects = JSON.parse(savedProjects);
        setVideoProjects(projects);
        
        // Resume polling for any generating videos
        projects.forEach((project: VideoProject) => {
          if (project.status === 'generating') {
            startPollingVideoStatus(project.id);
          }
        });
      }
    } catch (error) {
      console.error('❌ Error loading video projects:', error);
    }
  };

  const saveVideoProjects = (projects: VideoProject[]) => {
    localStorage.setItem('videoProjects', JSON.stringify(projects));
    setVideoProjects(projects);
  };

  const onSubmit = async (data: VideoForm) => {
    if (!profile?.is_pro && !canGenerateVideo()) {
      toast.error('Upgrade to Pro for unlimited video generations');
      return;
    }

    if (!data.script.trim()) {
      toast.error('Please enter a script for your video');
      return;
    }

    if (!data.title.trim()) {
      toast.error('Please enter a title for your video');
      return;
    }

    if (!data.replicaId) {
      toast.error('Please select an AI avatar');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🎬 Starting AI video generation with Tavus...');
      console.log('📝 Script:', data.script.substring(0, 100) + '...');
      console.log('🎭 Avatar:', data.replicaId);
      console.log('🎨 Background:', data.background);
      
      // Show immediate feedback
      toast.loading('Initializing AI video generation...', { id: 'video-generation' });
      
      // Create video with Tavus
      const result = await tavusService.createVideo(data.script, data.replicaId, {
        title: data.title,
        background: data.background,
        subtitles: data.subtitles,
        subtitleStyle: data.subtitleStyle,
        voiceSettings: data.voiceSettings,
      });
      
      const newProject: VideoProject = {
        id: result.videoId,
        title: data.title,
        script: data.script,
        status: 'generating',
        progress: 0,
        createdAt: new Date().toISOString(),
        settings: {
          replicaId: data.replicaId,
          background: data.background,
          subtitles: data.subtitles,
          subtitleStyle: data.subtitleStyle,
          voiceSettings: data.voiceSettings,
        }
      };

      const updatedProjects = [newProject, ...videoProjects];
      saveVideoProjects(updatedProjects);
      setCurrentVideo(newProject);
      
      // Start polling for video status
      startPollingVideoStatus(result.videoId);
      
      toast.success('🎬 AI video generation started! This may take a few minutes.', { id: 'video-generation' });
      setActiveTab('projects');
      
      // Clear form
      setValue('title', '');
      setValue('script', '');
      
    } catch (error: any) {
      console.error('❌ Video generation error:', error);
      toast.error(error.message || 'Failed to generate video. Please try again.', { id: 'video-generation' });
    } finally {
      setLoading(false);
    }
  };

  const startPollingVideoStatus = (videoId: string) => {
    // Clear existing interval if any
    const existingInterval = pollingIntervals.get(videoId);
    if (existingInterval) {
      clearInterval(existingInterval);
    }

    const maxAttempts = 60; // 10 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        console.log(`📊 Polling status for video ${videoId} (attempt ${attempts + 1}/${maxAttempts})`);
        
        const status = await tavusService.getVideoStatus(videoId);
        console.log('📊 Video status:', status);
        
        // Update project status
        setVideoProjects(prev => {
          const updated = prev.map(project => 
            project.id === videoId 
              ? { 
                  ...project, 
                  status: status.status,
                  progress: status.progress || project.progress,
                  videoUrl: status.download_url || project.videoUrl,
                  thumbnailUrl: status.thumbnail_url || project.thumbnailUrl,
                  estimatedCompletion: status.estimated_completion,
                  errorMessage: status.error_message
                }
              : project
          );
          saveVideoProjects(updated);
          return updated;
        });

        if (status.status === 'completed') {
          console.log('✅ Video generation completed!');
          toast.success('🎉 Your AI video is ready!');
          
          // Clear polling interval
          const interval = pollingIntervals.get(videoId);
          if (interval) {
            clearInterval(interval);
            pollingIntervals.delete(videoId);
          }
          return;
        } else if (status.status === 'failed') {
          console.log('❌ Video generation failed');
          toast.error(`Video generation failed: ${status.error_message || 'Unknown error'}`);
          
          // Clear polling interval
          const interval = pollingIntervals.get(videoId);
          if (interval) {
            clearInterval(interval);
            pollingIntervals.delete(videoId);
          }
          return;
        }

        attempts++;
        if (attempts >= maxAttempts) {
          console.log('⏰ Polling timeout reached');
          toast.warning('Video generation is taking longer than expected. Please check back later.');
          
          // Clear polling interval
          const interval = pollingIntervals.get(videoId);
          if (interval) {
            clearInterval(interval);
            pollingIntervals.delete(videoId);
          }
        }
      } catch (error) {
        console.error('❌ Error polling video status:', error);
        attempts++;
        
        if (attempts >= maxAttempts) {
          const interval = pollingIntervals.get(videoId);
          if (interval) {
            clearInterval(interval);
            pollingIntervals.delete(videoId);
          }
        }
      }
    };

    // Start polling immediately, then every 10 seconds
    poll();
    const interval = setInterval(poll, 10000);
    pollingIntervals.set(videoId, interval);
  };

  const canGenerateVideo = () => {
    return profile?.is_pro || true; // For demo purposes
  };

  const playVideo = (project: VideoProject) => {
    if (!project.videoUrl) {
      toast.error('Video not available yet');
      return;
    }
    setCurrentVideo(project);
    setIsPlaying(true);
  };

  const downloadVideo = (project: VideoProject) => {
    if (!project.videoUrl) {
      toast.error('Video not available for download yet');
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = project.videoUrl;
      link.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}.mp4`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('📥 Video download started!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download video');
    }
  };

  const retryVideoGeneration = async (project: VideoProject) => {
    try {
      toast.loading('Retrying video generation...', { id: 'retry-video' });
      
      const result = await tavusService.createVideo(
        project.script, 
        project.settings.replicaId,
        {
          title: project.title,
          ...project.settings
        }
      );
      
      // Update project with new video ID and reset status
      setVideoProjects(prev => {
        const updated = prev.map(p => 
          p.id === project.id 
            ? { 
                ...p, 
                id: result.videoId,
                status: 'generating' as const,
                progress: 0,
                videoUrl: undefined,
                thumbnailUrl: undefined,
                errorMessage: undefined
              }
            : p
        );
        saveVideoProjects(updated);
        return updated;
      });
      
      // Start polling for the new video
      startPollingVideoStatus(result.videoId);
      
      toast.success('Video generation restarted!', { id: 'retry-video' });
    } catch (error: any) {
      toast.error(error.message || 'Failed to retry video generation', { id: 'retry-video' });
    }
  };

  const deleteProject = (projectId: string) => {
    // Clear any polling for this project
    const interval = pollingIntervals.get(projectId);
    if (interval) {
      clearInterval(interval);
      pollingIntervals.delete(projectId);
    }
    
    // Remove from projects
    const updatedProjects = videoProjects.filter(p => p.id !== projectId);
    saveVideoProjects(updatedProjects);
    
    if (currentVideo?.id === projectId) {
      setCurrentVideo(null);
    }
    
    toast.success('Project deleted');
  };

  const tabs = [
    { id: 'create', label: 'Create Video', icon: Video },
    { id: 'projects', label: 'My Videos', icon: Eye },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <motion.div 
            className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg"
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.5 }}
          >
            <Video className="h-6 w-6 text-white" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Video Studio</h1>
            <p className="text-gray-600">Create professional videos with AI avatars powered by Tavus</p>
          </div>
        </div>

        {/* API Status */}
        <div className="mb-6">
          {tavusService.isConfigured() ? (
            <div className="flex items-center space-x-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg border border-green-200">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Tavus API Connected</span>
              <span className="text-xs text-green-500">Ready to generate AI videos</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Demo Mode</span>
              <span className="text-xs text-amber-500">Add your Tavus API key for real AI video generation</span>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Creation Form */}
          <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title *
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter a title for your video..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Script *
                </label>
                <textarea
                  {...register('script', { 
                    required: 'Script is required',
                    minLength: { value: 10, message: 'Script must be at least 10 characters' },
                    maxLength: { value: 2000, message: 'Script must be less than 2000 characters' }
                  })}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter your video script here..."
                />
                <div className="flex justify-between mt-1">
                  {errors.script && (
                    <p className="text-sm text-red-600">{errors.script.message}</p>
                  )}
                  <p className="text-xs text-gray-500 ml-auto">
                    Character count: {watch('script')?.length || 0} / 2000
                  </p>
                </div>
              </div>

              {/* AI Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Avatar *
                </label>
                {replicas.length === 0 ? (
                  <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <Loader className="h-8 w-8 text-gray-400 mx-auto mb-2 animate-spin" />
                      <p className="text-gray-500">Loading AI avatars...</p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {replicas.map((replica) => (
                      <label key={replica.replica_id} className="relative">
                        <input
                          {...register('replicaId', { required: 'Please select an AI avatar' })}
                          type="radio"
                          value={replica.replica_id}
                          className="sr-only peer"
                        />
                        <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                          <img
                            src={replica.thumbnail_url}
                            alt={replica.name}
                            className="w-12 h-12 rounded-full mr-3 object-cover"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{replica.name}</div>
                            <div className="text-sm text-gray-500">{replica.description}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
                {errors.replicaId && (
                  <p className="mt-1 text-sm text-red-600">{errors.replicaId.message}</p>
                )}
              </div>

              {/* Background Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Background
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {backgrounds.map((bg) => (
                    <label key={bg.id} className="relative">
                      <input
                        {...register('background')}
                        type="radio"
                        value={bg.id}
                        className="sr-only peer"
                      />
                      <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 transition-all">
                        <img
                          src={bg.preview}
                          alt={bg.name}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">{bg.name}</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || replicas.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating AI Video...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5" />
                    <span>Generate AI Video</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Settings Panel */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Video Settings
              </h3>

              <div className="space-y-4">
                {/* Subtitles */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Subtitles</p>
                    <p className="text-sm text-gray-600">Add captions to your video</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      {...register('subtitles')}
                      type="checkbox"
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                  </label>
                </div>

                {/* Subtitle Style */}
                {watch('subtitles') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtitle Style
                    </label>
                    <select
                      {...register('subtitleStyle')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      {subtitleStyles.map((style) => (
                        <option key={style.id} value={style.id}>
                          {style.name} - {style.description}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Voice Settings */}
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Voice Settings</h4>
                  
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Speed: {watch('voiceSettings.speed')}x
                    </label>
                    <input
                      {...register('voiceSettings.speed')}
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Pitch: {watch('voiceSettings.pitch')}x
                    </label>
                    <input
                      {...register('voiceSettings.pitch')}
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pro Features */}
            {!profile?.is_pro && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <Crown className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Pro Features</h3>
                </div>
                <ul className="space-y-2 text-sm text-purple-700 mb-4">
                  <li>• Custom AI avatar training</li>
                  <li>• Advanced subtitle animations</li>
                  <li>• 4K video resolution</li>
                  <li>• Unlimited video generations</li>
                  <li>• Priority processing</li>
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

            {/* Tavus Info */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles className="h-5 w-5 text-orange-600" />
                <h3 className="font-semibold text-orange-900">Powered by Tavus</h3>
              </div>
              <p className="text-sm text-orange-700 mb-4">
                Our AI video generation is powered by Tavus, the leading platform for creating realistic AI avatars and videos.
              </p>
              <a 
                href="https://tavus.io" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 text-orange-600 hover:text-orange-700 font-medium text-sm"
              >
                <span>Learn more about Tavus</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Current Video Player - Only render if video has a valid URL */}
          {currentVideo && currentVideo.videoUrl && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{currentVideo.title}</h3>
              <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden">
                <video
                  ref={setVideoRef}
                  src={currentVideo.videoUrl}
                  controls
                  className="w-full h-full"
                  poster={currentVideo.thumbnailUrl}
                  onError={(e) => {
                    console.error('Video loading error:', e);
                    toast.error('Failed to load video');
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Video Projects Grid */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My AI Video Projects</h3>
            
            {videoProjects.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-600 mb-4">Create your first AI video to get started!</p>
                <button
                  onClick={() => setActiveTab('create')}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Create Your First Video
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoProjects.map((project) => (
                  <motion.div
                    key={project.id}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    whileHover={{ y: -2 }}
                  >
                    <div className="aspect-video bg-gray-100 relative">
                      {project.thumbnailUrl ? (
                        <img
                          src={project.thumbnailUrl}
                          alt={project.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {project.status === 'generating' ? (
                            <div className="text-center">
                              <Loader className="h-8 w-8 text-gray-400 animate-spin mx-auto mb-2" />
                              {project.progress !== undefined && (
                                <div className="w-32 bg-gray-200 rounded-full h-2 mx-auto mb-2">
                                  <div 
                                    className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${project.progress}%` }}
                                  ></div>
                                </div>
                              )}
                              <p className="text-xs text-gray-500">
                                {project.progress !== undefined ? `${project.progress}%` : 'Processing...'}
                              </p>
                            </div>
                          ) : project.status === 'failed' ? (
                            <div className="text-center">
                              <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
                              <p className="text-xs text-red-500">Generation failed</p>
                            </div>
                          ) : (
                            <Video className="h-8 w-8 text-gray-400" />
                          )}
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        {project.status === 'completed' && (
                          <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ready
                          </div>
                        )}
                        {project.status === 'generating' && (
                          <div className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            Processing
                          </div>
                        )}
                        {project.status === 'failed' && (
                          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs flex items-center">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Failed
                          </div>
                        )}
                      </div>

                      {/* Play Button - Only show if video URL exists */}
                      {project.videoUrl && (
                        <button
                          onClick={() => playVideo(project)}
                          className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity"
                        >
                          <Play className="h-12 w-12 text-white" />
                        </button>
                      )}
                    </div>

                    <div className="p-4">
                      <h4 className="font-medium text-gray-900 mb-2">{project.title}</h4>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{project.script}</p>
                      
                      {project.status === 'failed' && project.errorMessage && (
                        <p className="text-xs text-red-600 mb-3">{project.errorMessage}</p>
                      )}
                      
                      {project.estimatedCompletion && project.status === 'generating' && (
                        <p className="text-xs text-blue-600 mb-3">
                          ETA: {new Date(project.estimatedCompletion).toLocaleTimeString()}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        
                        <div className="flex space-x-2">
                          {project.status === 'completed' && project.videoUrl && (
                            <>
                              <button
                                onClick={() => playVideo(project)}
                                className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                                title="Play video"
                              >
                                <Play className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => downloadVideo(project)}
                                className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                                title="Download video"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          
                          {project.status === 'failed' && (
                            <button
                              onClick={() => retryVideoGeneration(project)}
                              className="p-1 text-gray-500 hover:text-primary-600 transition-colors"
                              title="Retry generation"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                            title="Delete project"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}