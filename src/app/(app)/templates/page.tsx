'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { FileText, Sparkles, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tone: string;
  usageCount: number;
}

const defaultTemplates: Template[] = [
  { id: '1', name: 'Product Launch', description: 'For new product announcements', category: 'product', tone: 'professional', usageCount: 0 },
  { id: '2', name: 'Flash Sale', description: 'Urgent, time-limited promotions', category: 'product', tone: 'urgent', usageCount: 0 },
  { id: '3', name: 'Brand Awareness', description: 'Building brand recognition', category: 'brand', tone: 'inspirational', usageCount: 0 },
  { id: '4', name: 'Event Promotion', description: 'Webinars, conferences, launches', category: 'event', tone: 'professional', usageCount: 0 },
  { id: '5', name: 'SaaS Free Trial', description: 'Software trial signup campaigns', category: 'saas', tone: 'professional', usageCount: 0 },
  { id: '6', name: 'E-commerce Holiday', description: 'Seasonal/holiday sales', category: 'ecommerce', tone: 'playful', usageCount: 0 },
  { id: '7', name: 'App Download', description: 'Mobile app install campaigns', category: 'app', tone: 'bold', usageCount: 0 },
  { id: '8', name: 'Newsletter Signup', description: 'Email list building', category: 'content', tone: 'minimalist', usageCount: 0 },
  { id: '9', name: 'Re-targeting', description: 'Bringing back past visitors', category: 'ads', tone: 'urgent', usageCount: 0 },
  { id: '10', name: 'Partnership Announcement', description: 'Collaboration/collab posts', category: 'brand', tone: 'professional', usageCount: 0 },
];

export default function TemplatesPage() {
  const { data: session } = useSession();
  const [templates, setTemplates] = useState<Template[]>(defaultTemplates);

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>Templates</h1>
        <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Start with proven campaign templates</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {templates.map((template) => (
          <div key={template.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ width: 48, height: 48, background: 'var(--terracotta-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <span className="badge badge-primary" style={{ fontSize: 10 }}>{template.tone}</span>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{template.name}</h3>
            <p style={{ fontSize: 13, color: 'var(--ink-muted)', lineHeight: 1.5, marginBottom: 16 }}>{template.description}</p>
            <Link
              href={`/generate?template=${template.id}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}
            >
              Use Template <ArrowRight size={14} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}