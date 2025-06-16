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
  Loader
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
  videoUrl?: string;
  thumbnailUrl?: string;
  createdAt: string;
  settings: any;
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
  
  const { register, handleSubmit, watch, setValue } = useForm<VideoForm>({
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
  }, []);

  const loadReplicas = async () => {
    try {
      // Mock replicas for demo - in production, these would come from Tavus API
      const mockReplicas = [
        { 
          id: 'professional-male', 
          name: 'Professional Male', 
          description: 'Business professional, clear speech',
          preview: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
        },
        { 
          id: 'friendly-female', 
          name: 'Friendly Female', 
          description: 'Warm, approachable presenter',
          preview: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
        },
        { 
          id: 'energetic-male', 
          name: 'Energetic Male', 
          description: 'Dynamic, enthusiastic delivery',
          preview: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
        },
        { 
          id: 'professional-female', 
          name: 'Professional Female', 
          description: 'Authoritative, confident speaker',
          preview: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
        },
      ];
      
      setReplicas(mockReplicas);
      if (mockReplicas.length > 0) {
        setValue('replicaId', mockReplicas[0].id);
      }
    } catch (error) {
      console.error('Error loading replicas:', error);
    }
  };

  const loadVideoProjects = async () => {
    try {
      // Mock video projects for demo
      const mockProjects: VideoProject[] = [
        {
          id: 'project-1',
          title: 'Product Launch Video',
          script: 'Welcome to our exciting new product launch! Today, we\'re introducing a revolutionary solution...',
          status: 'completed',
          videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
          thumbnailUrl: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=200&fit=crop',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          settings: { background: 'office', subtitles: true }
        },
        {
          id: 'project-2',
          title: 'Tutorial Introduction',
          script: 'Hi everyone! In today\'s tutorial, we\'ll be covering the essential steps to get started...',
          status: 'generating',
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          settings: { background: 'studio', subtitles: true }
        },
      ];
      
      setVideoProjects(mockProjects);
    } catch (error) {
      console.error('Error loading video projects:', error);
    }
  };

  const onSubmit = async (data: VideoForm) => {
    if (!profile?.is_pro && !canGenerateVideo()) {
      toast.error('Upgrade to Pro for unlimited video generations');
      return;
    }

    setLoading(true);
    try {
      // Create video with Tavus
      const result = await tavusService.createVideo(data.script, data.replicaId);
      
      const newProject: VideoProject = {
        id: result.videoId,
        title: data.title,
        script: data.script,
        status: 'generating',
        createdAt: new Date().toISOString(),
        settings: {
          background: data.background,
          subtitles: data.subtitles,
          subtitleStyle: data.subtitleStyle,
          voiceSettings: data.voiceSettings,
        }
      };

      setVideoProjects([newProject, ...videoProjects]);
      setCurrentVideo(newProject);
      
      // Start polling for video status
      pollVideoStatus(result.videoId);
      
      toast.success('Video generation started! This may take a few minutes.');
      setActiveTab('projects');
    } catch (error) {
      toast.error('Failed to generate video');
    } finally {
      setLoading(false);
    }
  };

  const pollVideoStatus = async (videoId: string) => {
    const maxAttempts = 30; // 5 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await tavusService.getVideoStatus(videoId);
        
        if (status.status === 'completed') {
          setVideoProjects(prev => 
            prev.map(project => 
              project.id === videoId 
                ? { 
                    ...project, 
                    status: 'completed', 
                    videoUrl: status.download_url,
                    thumbnailUrl: status.thumbnail_url 
                  }
                : project
            )
          );
          toast.success('Video generation completed!');
          return;
        } else if (status.status === 'failed') {
          setVideoProjects(prev => 
            prev.map(project => 
              project.id === videoId 
                ? { ...project, status: 'failed' }
                : project
            )
          );
          toast.error('Video generation failed');
          return;
        }

        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 10000); // Poll every 10 seconds
        }
      } catch (error) {
        console.error('Error polling video status:', error);
      }
    };

    poll();
  };

  const canGenerateVideo = () => {
    return profile?.is_pro || true; // For demo purposes
  };

  const playVideo = (project: VideoProject) => {
    if (!project.videoUrl) return;
    setCurrentVideo(project);
    setIsPlaying(true);
  };

  const downloadVideo = (project: VideoProject) => {
    if (!project.videoUrl) return;
    
    const link = document.createElement('a');
    link.href = project.videoUrl;
    link.download = `${project.title.replace(/\s+/g, '-').toLowerCase()}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <p className="text-gray-600">Create professional videos with AI avatars and scripts</p>
          </div>
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
                  Video Title
                </label>
                <input
                  {...register('title', { required: 'Title is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Enter a title for your video..."
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
                  placeholder="Enter your video script here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Character count: {watch('script')?.length || 0} (recommended: 150-500 characters)
                </p>
              </div>

              {/* AI Avatar Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  AI Avatar
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {replicas.map((replica) => (
                    <label key={replica.id} className="relative">
                      <input
                        {...register('replicaId')}
                        type="radio"
                        value={replica.id}
                        className="sr-only peer"
                      />
                      <div className="flex items-center p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                        <img
                          src={replica.preview}
                          alt={replica.name}
                          className="w-12 h-12 rounded-full mr-3"
                        />
                        <div>
                          <div className="font-medium text-gray-900">{replica.name}</div>
                          <div className="text-sm text-gray-500">{replica.description}</div>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
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
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Generating Video...</span>
                  </div>
                ) : (
                  'Generate AI Video'
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
                  <Type className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold text-purple-900">Pro Features</h3>
                </div>
                <ul className="space-y-2 text-sm text-purple-700">
                  <li>• Custom AI avatar training</li>
                  <li>• Advanced subtitle animations</li>
                  <li>• 4K video resolution</li>
                  <li>• Unlimited video generations</li>
                  <li>• Priority processing</li>
                </ul>
                <button className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all">
                  Upgrade to Pro
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="space-y-6">
          {/* Current Video Player */}
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
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          )}

          {/* Video Projects Grid */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">My Video Projects</h3>
            
            {videoProjects.length === 0 ? (
              <div className="text-center py-12">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No videos yet</h3>
                <p className="text-gray-600">Create your first AI video to get started!</p>
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
                            <Loader className="h-8 w-8 text-gray-400 animate-spin" />
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

                      {/* Play Button */}
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
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {new Date(project.createdAt).toLocaleDateString()}
                        </span>
                        
                        {project.status === 'completed' && (
                          <div className="flex space-x-2">
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
                          </div>
                        )}
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