'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { formatDate, getInitials } from '@/lib/utils';
import { Star, Trash2, Copy, Archive, MoreHorizontal, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Campaign {
  id: string;
  productName: string;
  tone: string;
  provider: string;
  status: string;
  isFavorite: boolean;
  rating: number | null;
  createdAt: string;
}

export default function CampaignsPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      try {
        const res = await fetch(`/api/campaigns?page=${page}&limit=10&search=${search}`);
        const data = await res.json();
        setCampaigns(data.campaigns || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (error) {
        console.error('Failed to fetch campaigns:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCampaigns();
  }, [page, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      const res = await fetch(`/api/campaigns/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setCampaigns(campaigns.filter(c => c.id !== id));
      toast.success('Campaign deleted');
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleDuplicate = async (campaign: Campaign) => {
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/duplicate`, { method: 'POST' });
      if (!res.ok) throw new Error('Duplicate failed');
      const newCampaign = await res.json();
      setCampaigns([newCampaign, ...campaigns]);
      toast.success('Campaign duplicated');
    } catch (error) {
      toast.error('Duplicate failed');
    }
  };

  const handleFavorite = async (id: string) => {
    try {
      const res = await fetch(`/api/campaigns/${id}/favorite`, { method: 'PUT' });
      if (!res.ok) throw new Error('Failed');
      const updated = await res.json();
      setCampaigns(campaigns.map(c => c.id === id ? { ...c, isFavorite: updated.isFavorite } : c));
    } catch (error) {
      toast.error('Failed to update');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)' }}>Campaigns</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 4 }}>Manage your ad campaigns</p>
        </div>
        <Link href="/generate" className="btn-primary">
          New Campaign
        </Link>
      </div>

      <div className="card">
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-muted)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search campaigns..."
              style={{ width: '100%', paddingLeft: 36 }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--ink-muted)' }}>Loading...</div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state" style={{ padding: 40 }}>
            <h3>No campaigns yet</h3>
            <p>Create your first campaign to get started.</p>
            <Link href="/generate" className="btn-primary" style={{ marginTop: 16 }}>
              Create Campaign
            </Link>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Product</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Tone</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Provider</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Rating</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Date</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 11, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '16px' }}>
                    <Link href={`/campaigns/${campaign.id}`} style={{ fontWeight: 500, color: 'var(--ink)' }}>
                      {campaign.productName}
                    </Link>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="badge badge-primary" style={{ fontSize: 10 }}>{campaign.tone}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-soft)', textTransform: 'capitalize' }}>{campaign.provider}</span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={14}
                          fill={star <= (campaign.rating || 0) ? 'var(--status-orange)' : 'transparent'}
                          color={star <= (campaign.rating || 0) ? 'var(--status-orange)' : 'var(--border)'}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: 13, color: 'var(--ink-muted)' }}>
                    {formatDate(campaign.createdAt)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
                      <button onClick={() => handleFavorite(campaign.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: campaign.isFavorite ? 'var(--status-orange)' : 'var(--ink-muted)' }}>
                        <Star size={16} fill={campaign.isFavorite ? 'var(--status-orange)' : 'transparent'} />
                      </button>
                      <button onClick={() => handleDuplicate(campaign)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-muted)' }}>
                        <Copy size={16} />
                      </button>
                      <button onClick={() => handleDelete(campaign.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--destructive)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPages > 1 && (
          <div style={{ padding: 16, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px' }}>Previous</button>
            <span style={{ fontSize: 13, color: 'var(--ink-muted)' }}>Page {page} of {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary" style={{ padding: '6px 12px' }}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}