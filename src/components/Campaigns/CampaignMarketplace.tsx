import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  DollarSign, 
  Users, 
  Calendar, 
  MapPin,
  Filter,
  Search,
  Star,
  Send
} from 'lucide-react';
import { supabase, Campaign } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

export function CampaignMarketplace() {
  const { profile } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNiche, setSelectedNiche] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [applications, setApplications] = useState<string[]>([]);

  const niches = [
    'All', 'Fitness', 'Business', 'Lifestyle', 'Technology', 
    'Food', 'Travel', 'Fashion', 'Education', 'Entertainment'
  ];

  useEffect(() => {
    loadCampaigns();
    loadUserApplications();
  }, []);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          brand:profiles(full_name, avatar_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Mock data for demo since we don't have actual campaigns
      const mockCampaigns: Campaign[] = [
        {
          id: '1',
          brand_id: '1',
          title: 'Fitness Equipment Launch',
          description: 'Looking for fitness influencers to promote our new home gym equipment line. Must have engaged audience in fitness niche.',
          budget: 2500,
          niche: 'fitness',
          requirements: ['10K+ followers', 'Fitness content focus', 'High engagement rate'],
          status: 'active',
          applications_count: 12,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand: {
            id: '1',
            email: 'brand@example.com',
            full_name: 'FitGear Pro',
            is_pro: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        },
        {
          id: '2',
          brand_id: '2',
          title: 'Tech Startup Promotion',
          description: 'Seeking tech reviewers and business content creators to review our productivity app.',
          budget: 1800,
          niche: 'technology',
          requirements: ['Tech-focused content', '5K+ followers', 'Previous brand partnerships'],
          status: 'active',
          applications_count: 8,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand: {
            id: '2',
            email: 'brand2@example.com',
            full_name: 'TechFlow Solutions',
            is_pro: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        },
        {
          id: '3',
          brand_id: '3',
          title: 'Lifestyle Brand Collaboration',
          description: 'Fashion and lifestyle brand looking for creators to showcase our sustainable clothing line.',
          budget: 3200,
          niche: 'lifestyle',
          requirements: ['Lifestyle content', '15K+ followers', 'Sustainability focus'],
          status: 'active',
          applications_count: 25,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          brand: {
            id: '3',
            email: 'brand3@example.com',
            full_name: 'EcoStyle Co.',
            is_pro: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }
        }
      ];

      setCampaigns(data?.length ? data : mockCampaigns);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserApplications = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('campaign_applications')
        .select('campaign_id')
        .eq('creator_id', profile.id);

      if (error) throw error;
      setApplications(data?.map(app => app.campaign_id) || []);
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  };

  const applyToCampaign = async (campaignId: string) => {
    if (!profile) {
      toast.error('Please complete your profile first');
      return;
    }

    try {
      const { error } = await supabase
        .from('campaign_applications')
        .insert({
          campaign_id: campaignId,
          creator_id: profile.id,
          proposal: 'I am interested in collaborating on this campaign. I believe my content aligns well with your brand values.',
          status: 'pending',
        });

      if (error) throw error;
      
      setApplications([...applications, campaignId]);
      toast.success('Application submitted successfully!');
    } catch (error: any) {
      if (error.code === '23505') {
        toast.error('You have already applied to this campaign');
      } else {
        toast.error('Failed to submit application');
      }
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         campaign.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNiche = selectedNiche === 'all' || campaign.niche === selectedNiche.toLowerCase();
    const matchesBudget = !minBudget || campaign.budget >= parseInt(minBudget);
    
    return matchesSearch && matchesNiche && matchesBudget;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-success-500 to-emerald-500 rounded-lg">
            <Briefcase className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Campaign Marketplace</h1>
            <p className="text-gray-600">Find brand partnerships and collaboration opportunities</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <select
            value={selectedNiche}
            onChange={(e) => setSelectedNiche(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {niches.map((niche) => (
              <option key={niche.toLowerCase()} value={niche.toLowerCase()}>
                {niche}
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Min budget"
            value={minBudget}
            onChange={(e) => setMinBudget(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Campaigns Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded mb-4"></div>
              <div className="flex justify-between">
                <div className="h-8 w-24 bg-gray-200 rounded"></div>
                <div className="h-8 w-20 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredCampaigns.map((campaign) => (
            <div key={campaign.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {campaign.title}
                    </h3>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                      {campaign.niche}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4">{campaign.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center text-success-600">
                    <DollarSign className="h-5 w-5 mr-1" />
                    <span className="font-semibold">${campaign.budget.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center text-gray-500">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">{campaign.applications_count} applications</span>
                  </div>
                </div>

                <div className="flex items-center text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    Posted {new Date(campaign.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center text-gray-500">
                  <Star className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">{campaign.brand.full_name}</span>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Requirements:</h4>
                <div className="flex flex-wrap gap-1">
                  {campaign.requirements.map((req, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {req}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                {applications.includes(campaign.id) ? (
                  <button
                    disabled
                    className="flex-1 bg-gray-100 text-gray-500 py-2 px-4 rounded-lg font-medium cursor-not-allowed"
                  >
                    Applied
                  </button>
                ) : (
                  <button
                    onClick={() => applyToCampaign(campaign.id)}
                    className="flex-1 bg-gradient-to-r from-success-500 to-emerald-500 text-white py-2 px-4 rounded-lg font-medium hover:from-success-600 hover:to-emerald-600 focus:ring-2 focus:ring-success-500 focus:ring-offset-2 transition-all flex items-center justify-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Apply Now
                  </button>
                )}
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredCampaigns.length === 0 && !loading && (
        <div className="text-center py-12">
          <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-600">Try adjusting your filters to see more opportunities.</p>
        </div>
      )}
    </div>
  );
}