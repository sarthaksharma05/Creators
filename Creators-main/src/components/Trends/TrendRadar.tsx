import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  ArrowUp, 
  Eye, 
  Calendar, 
  Bookmark,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { openaiService } from '../../lib/openai';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

interface Trend {
  id: string;
  title: string;
  description: string;
  category: string;
  growth: number;
  platforms: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export function TrendRadar() {
  const { profile } = useAuth();
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [niche, setNiche] = useState(profile?.niche || 'general');

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'content-format', label: 'Content Formats' },
    { value: 'topics', label: 'Trending Topics' },
    { value: 'hashtags', label: 'Hashtag Trends' },
    { value: 'platforms', label: 'Platform Features' },
  ];

  const niches = [
    'General', 'Fitness', 'Business', 'Lifestyle', 'Technology', 
    'Food', 'Travel', 'Fashion', 'Education', 'Entertainment'
  ];

  useEffect(() => {
    loadTrends();
  }, [niche]);

  const loadTrends = async () => {
    setLoading(true);
    try {
      const trendTopics = await openaiService.getTrendingTopics(niche);
      
      // Convert trending topics to trend objects (in a real app, this would come from a trends API)
      const mockTrends: Trend[] = trendTopics.map((topic, index) => ({
        id: `trend-${index}`,
        title: topic,
        description: `This trend is gaining momentum in the ${niche} space. Great opportunity for content creators to capitalize on.`,
        category: ['content-format', 'topics', 'hashtags', 'platforms'][index % 4],
        growth: Math.floor(Math.random() * 100) + 50,
        platforms: ['Instagram', 'TikTok', 'YouTube'].slice(0, Math.floor(Math.random() * 3) + 1),
        difficulty: ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)] as 'Easy' | 'Medium' | 'Hard',
      }));

      setTrends(mockTrends);
    } catch (error) {
      console.error('Error loading trends:', error);
      toast.error('Failed to load trends');
    } finally {
      setLoading(false);
    }
  };

  const filteredTrends = selectedCategory === 'all' 
    ? trends 
    : trends.filter(trend => trend.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-success-600 bg-success-100';
      case 'Medium': return 'text-accent-600 bg-accent-100';
      case 'Hard': return 'text-error-600 bg-error-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const saveTrend = (trendId: string) => {
    toast.success('Trend saved to your collection!');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-accent-500 to-orange-500 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">TrendRadar</h1>
            <p className="text-gray-600">Discover trending topics and content opportunities</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Niche
            </label>
            <select
              value={niche}
              onChange={(e) => setNiche(e.target.value.toLowerCase())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {niches.map((n) => (
                <option key={n.toLowerCase()} value={n.toLowerCase()}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={loadTrends}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-accent-500 to-orange-500 text-white rounded-lg hover:from-accent-600 hover:to-orange-600 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <RefreshCw className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Trends Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                <div className="h-6 w-12 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrends.map((trend) => (
            <div key={trend.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {trend.title}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    {trend.description}
                  </p>
                </div>
                <button
                  onClick={() => saveTrend(trend.id)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                >
                  <Bookmark className="h-5 w-5" />
                </button>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                {trend.platforms.map((platform) => (
                  <span
                    key={platform}
                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                  >
                    {platform}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center text-success-600">
                    <ArrowUp className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">+{trend.growth}%</span>
                  </div>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(trend.difficulty)}`}
                  >
                    {trend.difficulty}
                  </span>
                </div>
                
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center">
                  Explore
                  <ExternalLink className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredTrends.length === 0 && !loading && (
        <div className="text-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No trends found</h3>
          <p className="text-gray-600">Try adjusting your filters or refresh to see new trends.</p>
        </div>
      )}
    </div>
  );
}