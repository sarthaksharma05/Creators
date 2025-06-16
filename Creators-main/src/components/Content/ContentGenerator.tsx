import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  Lightbulb, 
  MessageSquare, 
  Hash, 
  FileText, 
  Wand2,
  Copy,
  Save,
  Download
} from 'lucide-react';
import { openaiService } from '../../lib/openai';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface ContentForm {
  type: string;
  niche: string;
  platform: string;
  additionalContext: string;
}

export function ContentGenerator() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  
  const { register, handleSubmit, watch } = useForm<ContentForm>({
    defaultValues: {
      type: 'ideas',
      niche: profile?.niche || '',
      platform: 'instagram',
      additionalContext: '',
    }
  });

  const contentTypes = [
    { value: 'ideas', label: 'Content Ideas', icon: Lightbulb },
    { value: 'script', label: 'Video Script', icon: FileText },
    { value: 'caption', label: 'Social Caption', icon: MessageSquare },
    { value: 'hashtags', label: 'Hashtags', icon: Hash },
  ];

  const platforms = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
  ];

  const niches = [
    'Fitness', 'Business', 'Lifestyle', 'Technology', 'Food', 
    'Travel', 'Fashion', 'Education', 'Entertainment', 'Health'
  ];

  const onSubmit = async (data: ContentForm) => {
    if (!profile?.is_pro && !canGenerate()) {
      toast.error('Upgrade to Pro for unlimited generations');
      return;
    }

    setLoading(true);
    try {
      const content = await openaiService.generateContent(
        data.type,
        data.niche,
        data.platform,
        data.additionalContext
      );
      
      setGeneratedContent(content);
      setContentTitle(`${data.type.charAt(0).toUpperCase() + data.type.slice(1)} for ${data.niche} on ${data.platform}`);
      
    } catch (error) {
      toast.error('Failed to generate content');
    } finally {
      setLoading(false);
    }
  };

  const canGenerate = () => {
    // Simple rate limiting for free users (in production, this would be more sophisticated)
    return profile?.is_pro || true; // For demo purposes
  };

  const saveContent = async () => {
    if (!profile || !generatedContent) return;

    try {
      const { error } = await supabase
        .from('generated_content')
        .insert({
          user_id: profile.id,
          type: watch('type'),
          title: contentTitle,
          content: generatedContent,
          niche: watch('niche'),
          platform: watch('platform'),
        });

      if (error) throw error;
      toast.success('Content saved successfully!');
    } catch (error) {
      toast.error('Failed to save content');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedContent);
    toast.success('Content copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg">
            <Wand2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Content Generator</h1>
            <p className="text-gray-600">Create engaging content with AI assistance</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Content Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Content Type
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {contentTypes.map((type) => (
                <label key={type.value} className="relative">
                  <input
                    {...register('type')}
                    type="radio"
                    value={type.value}
                    className="sr-only peer"
                  />
                  <div className="flex flex-col items-center p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all">
                    <type.icon className="h-6 w-6 text-gray-400 peer-checked:text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-700 peer-checked:text-primary-700">
                      {type.label}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Niche Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niche
              </label>
              <select
                {...register('niche')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="">Select a niche</option>
                {niches.map((niche) => (
                  <option key={niche.toLowerCase()} value={niche.toLowerCase()}>
                    {niche}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <select
                {...register('platform')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {platforms.map((platform) => (
                  <option key={platform.value} value={platform.value}>
                    {platform.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Additional Context */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Context (Optional)
            </label>
            <textarea
              {...register('additionalContext')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Add any specific requirements, tone, or context..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 px-4 rounded-lg font-medium hover:from-primary-600 hover:to-secondary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Generating...</span>
              </div>
            ) : (
              'Generate Content'
            )}
          </button>
        </form>
      </div>

      {/* Generated Content */}
      {generatedContent && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{contentTitle}</h3>
            <div className="flex space-x-2">
              <button
                onClick={copyToClipboard}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                <Copy className="h-5 w-5" />
              </button>
              <button
                onClick={saveContent}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Save content"
              >
                <Save className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans">
              {generatedContent}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}