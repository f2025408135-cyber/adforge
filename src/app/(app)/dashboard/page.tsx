'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Sparkles, TrendingUp, Star, Zap } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface Campaign {
  id: string;
  productName: string;
  tone: string;
  provider: string;
  createdAt: string;
  isFavorite: boolean;
  rating: number | null;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaigns() {
      try {
        const res = await fetch('/api/campaigns?limit=5&sortBy=createdAt&sortOrder=desc');
        const data = await res.json();
        setCampaigns(data.campaigns || []);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, []);

  const totalCampaigns = campaigns.length;
  const favoritesCount = campaigns.filter((c) => c.isFavorite).length;
  const avgRating = campaigns.filter((c) => c.rating).length > 0
    ? (campaigns.reduce((sum, c) => sum + (c.rating || 0), 0) / campaigns.filter((c) => c.rating).length).toFixed(1)
    : 'N/A';

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
          Welcome back, {session?.user?.name || 'User'}
        </h1>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {[
          { icon: Sparkles, label: 'Total Campaigns', value: totalCampaigns, color: 'var(--primary)' },
          { icon: TrendingUp, label: 'This Month', value: totalCampaigns, color: 'var(--status-green)' },
          { icon: Star, label: 'Favorites', value: favoritesCount, color: 'var(--status-orange)' },
          { icon: Zap, label: 'Avg Rating', value: avgRating, color: '#8b5cf6' },
        ].map((stat, i) => (
          <div key={i} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, background: `${stat.color}15`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={20} style={{ color: stat.color }} />
              </div>
              <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{stat.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 700, color: 'var(--ink)' }}>
              {loading ? '...' : stat.value}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Quick Generate</h2>
            <Link href="/generate" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
              New Campaign
            </Link>
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>
            Create a new ad campaign in seconds. Choose your AI provider, enter your product details, and get professional copy tailored to your brand.
          </p>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)' }}>Recent Campaigns</h2>
            <Link href="/campaigns" style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 500 }}>
              View All
            </Link>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-muted)' }}>Loading...</div>
          ) : campaigns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--ink-muted)' }}>
              <p>No campaigns yet.</p>
              <Link href="/generate" style={{ fontSize: 13, color: 'var(--primary)', marginTop: 8, display: 'inline-block' }}>
                Create your first campaign
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {campaigns.map((campaign) => (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: 'var(--background)', borderRadius: 8, textDecoration: 'none' }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{campaign.productName}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginTop: 2 }}>{formatDate(campaign.createdAt)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-primary" style={{ fontSize: 10 }}>{campaign.tone}</span>
                    {campaign.isFavorite && <Star size={14} fill="var(--status-orange)" color="var(--status-orange)" />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}