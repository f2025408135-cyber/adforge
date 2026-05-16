'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Palette, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface BrandKit {
  id: string;
  name: string;
  brandName: string;
  brandVoice: string;
  primaryColor: string | null;
  secondaryColor: string | null;
}

export default function BrandKitsPage() {
  const { data: session } = useSession();
  const [brandKits, setBrandKits] = useState<BrandKit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brandName: '',
    brandVoice: '',
    primaryColor: '',
    secondaryColor: '',
  });

  useEffect(() => {
    async function fetchBrandKits() {
      try {
        const res = await fetch('/api/brand-kits');
        const data = await res.json();
        setBrandKits(data.brandKits || []);
      } catch (error) {
        console.error('Failed to fetch brand kits:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchBrandKits();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/brand-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('Failed to create');
      const newKit = await res.json();
      setBrandKits([...brandKits, newKit]);
      setShowForm(false);
      setFormData({ name: '', brandName: '', brandVoice: '', primaryColor: '', secondaryColor: '' });
      toast.success('Brand kit created');
    } catch (error) {
      toast.error('Failed to create brand kit');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand kit?')) return;
    try {
      await fetch(`/api/brand-kits/${id}`, { method: 'DELETE' });
      setBrandKits(brandKits.filter(k => k.id !== id));
      toast.success('Brand kit deleted');
    } catch (error) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Brand Kits</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Maintain consistent brand voice across campaigns</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={16} /> New Brand Kit
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>Create Brand Kit</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Kit Name</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Nike Brand Voice"
                  style={{ width: '100%' }}
                  required
                />
              </div>
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Brand Name</label>
                <input
                  value={formData.brandName}
                  onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                  placeholder="e.g. Nike"
                  style={{ width: '100%' }}
                  required
                />
              </div>
            </div>
            <div>
              <label className="label" style={{ marginBottom: 8, display: 'block' }}>Brand Voice</label>
              <textarea
                value={formData.brandVoice}
                onChange={(e) => setFormData({ ...formData, brandVoice: e.target.value })}
                placeholder="Describe your brand voice and tone guidelines..."
                style={{ width: '100%', minHeight: 100 }}
                required
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Primary Color</label>
                <input
                  type="color"
                  value={formData.primaryColor || '#c8602a'}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  style={{ width: '100%', height: 40, padding: 4 }}
                />
              </div>
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Secondary Color</label>
                <input
                  type="color"
                  value={formData.secondaryColor || '#1a1814'}
                  onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                  style={{ width: '100%', height: 40, padding: 4 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn-primary">Create Brand Kit</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--ink-muted)' }}>Loading...</div>
      ) : brandKits.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Palette size={24} /></div>
          <h3>No brand kits yet</h3>
          <p>Create a brand kit to maintain consistent voice across campaigns.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
          {brandKits.map((kit) => (
            <div key={kit.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, background: kit.primaryColor || 'var(--terracotta-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Palette size={24} color={kit.primaryColor ? '#fff' : 'var(--primary)'} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{kit.name}</h3>
                    <p style={{ fontSize: 13, color: 'var(--ink-muted)' }}>{kit.brandName}</p>
                  </div>
                </div>
                <button onClick={() => handleDelete(kit.id)} style={{ background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: 'var(--destructive)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.6, marginBottom: 16 }}>{kit.brandVoice}</p>
              {kit.primaryColor && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 6, background: kit.primaryColor }} />
                  {kit.secondaryColor && <div style={{ width: 32, height: 32, borderRadius: 6, background: kit.secondaryColor }} />}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}