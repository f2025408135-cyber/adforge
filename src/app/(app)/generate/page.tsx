'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Copy, RefreshCw, Download, FileText, File, Check, Loader2, Wand2 } from 'lucide-react';
import { toast } from 'sonner';
import { countWords, getWordCountStatus, escapeHtml } from '@/lib/utils';
import { API_CONFIGS, TONE_PREVIEWS, PLATFORM_INFO, creativityToTemperature } from '@/lib/ai-providers';

type Result = {
  headline: string;
  tagline: string;
  adCopy: string;
  callToAction: string;
  targetAudience: string;
  keyBenefits: string;
  platformVersions: string;
};

const toneOptions = [
  'professional', 'luxury', 'casual', 'urgent', 'humorous', 'inspirational',
  'playful', 'minimalist', 'bold', 'empathetic', 'technical', 'storytelling'
];

const platformOptions = [
  'instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube',
  'billboard', 'email', 'googleads', 'pinterest', 'snapchat'
];

export default function GeneratePage() {
  const { data: session } = useSession();
  const [provider, setProvider] = useState<'gemini' | 'deepseek' | 'glm'>('gemini');
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [language, setLanguage] = useState('en');
  const [creativity, setCreativity] = useState(50);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !productDesc.trim()) {
      toast.error('Please fill in product name and description');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          productName,
          productDesc,
          tone,
          audience,
          platforms,
          language,
          creativity,
          additionalInstructions,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setResult(data.result);
      toast.success('Campaign generated successfully!');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (sectionKey: keyof Result) => {
    if (!productName.trim() || !productDesc.trim()) return;

    setRegenerating(sectionKey);
    try {
      const res = await fetch('/api/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          sectionKey,
          productName,
          productDesc,
          tone,
          platforms,
          currentResult: result,
        }),
      });

      if (!res.ok) throw new Error('Regeneration failed');

      const data = await res.json();
      setResult(prev => prev ? { ...prev, [sectionKey]: data.text } : null);
      toast.success(`${sectionKey} regenerated`);
    } catch (error) {
      toast.error('Regeneration failed');
    } finally {
      setRegenerating(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text = `HEADLINE\n${result.headline}\n\nTAGLINE\n${result.tagline}\n\nAD COPY\n${result.adCopy}\n\nCALL TO ACTION\n${result.callToAction}\n\nTARGET AUDIENCE\n${result.targetAudience}\n\nKEY BENEFITS\n${result.keyBenefits}\n\nPLATFORM ADAPTATIONS\n${result.platformVersions}`;
    navigator.clipboard.writeText(text);
    toast.success('Campaign copied to clipboard');
  };

  const sections: { key: keyof Result; label: string; isHeadline?: boolean }[] = [
    { key: 'headline', label: 'Headline', isHeadline: true },
    { key: 'tagline', label: 'Tagline' },
    { key: 'adCopy', label: 'Ad Copy' },
    { key: 'callToAction', label: 'Call to Action' },
    { key: 'targetAudience', label: 'Target Audience' },
    { key: 'keyBenefits', label: 'Key Benefits' },
    { key: 'platformVersions', label: 'Platform Adaptations', isHeadline: true },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '420px 1fr', gap: 24, alignItems: 'start' }}>
      <div className="card" style={{ position: 'sticky', top: 88, overflow: 'hidden' }}>
        <div style={{ padding: 20, background: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'white' }}>Campaign Brief</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Fill in the details to generate your campaign</p>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>AI Provider</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['gemini', 'deepseek', 'glm'] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setProvider(p)}
                  style={{
                    flex: 1,
                    padding: 10,
                    borderRadius: 6,
                    border: provider === p ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: provider === p ? 'var(--terracotta-light)' : 'var(--background)',
                    color: provider === p ? 'var(--primary)' : 'var(--ink-soft)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  {API_CONFIGS[p].name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Product Name <span style={{ color: 'var(--primary)' }}>*</span></label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. Nike Air Max 2025"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Product Description <span style={{ color: 'var(--primary)' }}>*</span></label>
            <textarea
              value={productDesc}
              onChange={(e) => setProductDesc(e.target.value)}
              placeholder="Describe your product — what it does, who it's for..."
              style={{ width: '100%', minHeight: 80 }}
            />
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Campaign Tone</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {toneOptions.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 6,
                    border: tone === t ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    background: tone === t ? 'var(--terracotta-light)' : 'var(--background)',
                    color: tone === t ? 'var(--primary)' : 'var(--ink-soft)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
            {TONE_PREVIEWS[tone] && (
              <div style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--ink-muted)', marginTop: 10, padding: 10, background: 'var(--terracotta-light)', borderRadius: 6, borderLeft: '3px solid var(--primary)' }}>
                {TONE_PREVIEWS[tone]}
              </div>
            )}
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Target Platforms</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {platformOptions.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 20,
                    border: platforms.includes(p) ? '1.5px solid var(--ink)' : '1px solid var(--border)',
                    background: platforms.includes(p) ? 'var(--ink)' : 'var(--background)',
                    color: platforms.includes(p) ? 'white' : 'var(--ink-soft)',
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span>{PLATFORM_INFO[p]?.icon}</span>
                  <span style={{ textTransform: 'capitalize' }}>{p}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Target Audience</label>
            <input
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              placeholder="e.g. Young professionals aged 25-35"
              style={{ width: '100%' }}
            />
          </div>

          <div>
            <label className="label" style={{ marginBottom: 8, display: 'block' }}>Creativity Level: {creativity}</label>
            <input
              type="range"
              min="0"
              max="100"
              value={creativity}
              onChange={(e) => setCreativity(parseInt(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>
              <span>Conservative</span>
              <span>Creative</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !productName.trim() || !productDesc.trim()}
            className="btn-primary"
            style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
          >
            {loading ? (
              <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} />
            ) : (
              <Wand2 size={18} />
            )}
            {loading ? 'Generating...' : 'Generate Campaign'}
          </button>
        </div>
      </div>

      <div>
        {!result && !loading && (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Sparkles size={24} />
            </div>
            <h3>Your campaign awaits</h3>
            <p>Fill in the brief on the left and click Generate Campaign to get started.</p>
          </div>
        )}

        {loading && (
          <div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 14 }}>Generating campaign with {API_CONFIGS[provider].name}...</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', animation: 'skeletonFade 0.6s ease both' }}>
                  <div style={{ padding: 12, background: 'var(--cream)', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between' }}>
                    <div className="skeleton skeleton-line" style={{ width: '40%', height: 12 }} />
                    <div className="skeleton skeleton-line" style={{ width: '20%', height: 12 }} />
                  </div>
                  <div style={{ padding: 16 }}>
                    <div className="skeleton skeleton-line" style={{ width: '80%', height: 14, marginBottom: 8 }} />
                    <div className="skeleton skeleton-line" style={{ width: '60%', height: 14 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {result && (
          <div>
            <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--status-green)' }} />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{productName} Campaign</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
                    Generated • {tone} tone • {language.toUpperCase()}
                  </div>
                </div>
              </div>
              <button onClick={handleCopyAll} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Copy size={14} /> Copy All
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {sections.map((section) => {
                const text = result[section.key];
                const wordCount = countWords(text);
                const status = getWordCountStatus(wordCount, section.key === 'headline' ? 12 : section.key === 'adCopy' ? 100 : 30);

                return (
                  <motion.div
                    key={section.key}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card"
                    style={{
                      overflow: 'hidden',
                      borderLeft: section.isHeadline ? '3px solid var(--primary)' : undefined,
                    }}
                  >
                    <div style={{ padding: 12, background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                        {section.label}
                      </span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleRegenerate(section.key)}
                          disabled={regenerating === section.key}
                          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-muted)' }}
                        >
                          {regenerating === section.key ? (
                            <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} />
                          ) : (
                            <RefreshCw size={14} />
                          )}
                        </button>
                        <button
                          onClick={() => handleCopy(text)}
                          style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-muted)' }}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                    </div>
                    <div style={{
                      padding: 16,
                      fontSize: section.key === 'headline' ? 20 : 14,
                      color: 'var(--ink)',
                      lineHeight: 1.7,
                      fontFamily: section.isHeadline && section.key === 'headline' ? 'var(--font-serif)' : undefined,
                      fontWeight: section.key === 'headline' ? 700 : undefined,
                    }}>
                      {escapeHtml(text)}
                    </div>
                    <div style={{ padding: '8px 16px 12px', fontSize: 12, color: 'var(--ink-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: `var(--status-${status === 'green' ? 'green' : status === 'orange' ? 'orange' : 'red'})` }} />
                      {wordCount} words
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}