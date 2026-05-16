'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { User, Key, CreditCard, Bell, Save } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  });

  const handleSaveProfile = async () => {
    toast.success('Profile updated');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'preferences', label: 'Preferences', icon: Key },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Settings</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Manage your account preferences</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 24 }}>
        <div className="card" style={{ padding: 8, height: 'fit-content' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderRadius: 6,
                border: 'none',
                background: activeTab === tab.id ? 'var(--terracotta-light)' : 'transparent',
                color: activeTab === tab.id ? 'var(--primary)' : 'var(--ink-soft)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card" style={{ padding: 24 }}>
          {activeTab === 'profile' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Profile Settings</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label className="label" style={{ marginBottom: 8, display: 'block' }}>Full Name</label>
                  <input
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    style={{ width: '100%', maxWidth: 400 }}
                  />
                </div>
                <div>
                  <label className="label" style={{ marginBottom: 8, display: 'block' }}>Email</label>
                  <input
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    style={{ width: '100%', maxWidth: 400 }}
                    disabled
                  />
                </div>
                <button onClick={handleSaveProfile} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8, width: 'fit-content' }}>
                  <Save size={16} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Preferences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="label" style={{ marginBottom: 8, display: 'block' }}>Default AI Provider</label>
                  <select style={{ width: '100%', maxWidth: 300 }}>
                    <option value="gemini">Gemini</option>
                    <option value="deepseek">DeepSeek</option>
                    <option value="glm">GLM</option>
                  </select>
                </div>
                <div>
                  <label className="label" style={{ marginBottom: 8, display: 'block' }}>Default Tone</label>
                  <select style={{ width: '100%', maxWidth: 300 }}>
                    <option value="professional">Professional</option>
                    <option value="luxury">Luxury</option>
                    <option value="casual">Casual</option>
                    <option value="urgent">Urgent</option>
                    <option value="humorous">Humorous</option>
                    <option value="inspirational">Inspirational</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'subscription' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Subscription</h2>
              <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 24, marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Free Plan</h3>
                    <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Perfect for testing</p>
                  </div>
                  <span className="badge badge-primary">Current</span>
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-soft)', marginBottom: 16 }}>
                  1 / 5 campaigns used this month
                </div>
                <div style={{ background: 'var(--border-soft)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: '20%', height: '100%', background: 'var(--primary)' }} />
                </div>
              </div>
              <button className="btn-primary">Upgrade to Pro</button>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 24 }}>Notifications</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>Email notifications for new campaigns</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>Weekly digest of usage stats</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ width: 18, height: 18 }} />
                  <span style={{ fontSize: 14 }}>Marketing and product updates</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}