'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Star, Copy } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  productName: string;
  productDesc: string;
  tone: string;
  provider: string;
  headline: string | null;
  tagline: string | null;
  adCopy: string | null;
  callToAction: string | null;
  targetAudience: string | null;
  keyBenefits: string | null;
  platformVersions: string | null;
  status: string;
  isFavorite: boolean;
  rating: number | null;
  tags: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function CampaignDetailPage() {
  const params = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch(`/api/campaigns/${params.id}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        setCampaign(data);
      } catch (error) {
        console.error('Failed to fetch campaign:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaign();
  }, [params.id]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div className="spinner" style={{ margin: '0 auto' }} />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <h2>Campaign not found</h2>
        <Link href="/campaigns" style={{ color: 'var(--primary)', marginTop: 16, display: 'inline-block' }}>
          Back to campaigns
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Link href="/campaigns" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--ink-muted)', fontSize: 14, marginBottom: 16 }}>
          <ArrowLeft size={16} /> Back to campaigns
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>{campaign.productName}</h1>
            <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 }}>Created {formatDate(campaign.createdAt)}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer' }}>
                <Star size={20} fill={star <= (campaign.rating || 0) ? 'var(--status-orange)' : 'transparent'} color={star <= (campaign.rating || 0) ? 'var(--status-orange)' : 'var(--border)'} />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div>
          {campaign.headline && (
            <div className="card" style={{ padding: 20, marginBottom: 16, borderLeft: '3px solid var(--primary)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Headline</div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)', marginBottom: 8 }}>{campaign.headline}</div>
              <button onClick={() => handleCopy(campaign.headline)} style={{ background: 'none', border: 'none', color: 'var(--ink-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                <Copy size={12} /> Copy
              </button>
            </div>
          )}

          {campaign.tagline && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>Tagline</div>
              <div style={{ fontStyle: 'italic', fontSize: 16, color: 'var(--ink-soft)' }}>{campaign.tagline}</div>
            </div>
          )}

          {campaign.adCopy && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Ad Copy</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>{campaign.adCopy}</div>
            </div>
          )}

          {campaign.callToAction && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 8 }}>Call to Action</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--primary)' }}>{campaign.callToAction}</div>
            </div>
          )}

          {campaign.targetAudience && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Target Audience</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>{campaign.targetAudience}</div>
            </div>
          )}

          {campaign.keyBenefits && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Key Benefits</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>{campaign.keyBenefits}</div>
            </div>
          )}

          {campaign.platformVersions && (
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 12 }}>Platform Adaptations</div>
              <div style={{ fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>{campaign.platformVersions}</div>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ padding: 20, marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 16 }}>Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>Tone</div>
                <span className="badge badge-primary">{campaign.tone}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>Provider</div>
                <span style={{ fontSize: 13, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{campaign.provider}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginBottom: 4 }}>Status</div>
                <span style={{ fontSize: 13, color: campaign.status === 'completed' ? 'var(--status-green)' : 'var(--ink-soft)', textTransform: 'capitalize' }}>{campaign.status}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Link href={`/generate?edit=${campaign.id}`} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Edit size={14} /> Edit Campaign
            </Link>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Download size={14} /> Export
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}