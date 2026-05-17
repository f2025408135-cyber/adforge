'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, RefreshCw, Loader2, Wand2, Moon, Sun, Menu, X, History, Trash2, Download, FileText, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from 'sonner';

const API_CONFIGS = {
  gemini: {
    name: 'Gemini',
    description: 'Fast and creative',
    url: (key: string) => `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    buildBody: (prompt: string) => ({ contents: [{ parts: [{ text: prompt }] }] }),
    parseResponse: (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
  },
  deepseek: {
    name: 'DeepSeek',
    description: 'Thoughtful and detailed',
    url: () => 'https://api.deepseek.com/chat/completions',
    buildBody: (prompt: string) => ({ model: 'deepseek-chat', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || '',
  },
  glm: {
    name: 'GLM',
    description: 'Versatile and precise',
    url: () => 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    buildBody: (prompt: string) => ({ model: 'glm-4', messages: [{ role: 'user', content: prompt }], max_tokens: 2048 }),
    parseResponse: (data: any) => data.choices?.[0]?.message?.content || '',
  },
};

const TONE_PREVIEWS: Record<string, string> = {
  professional: '"Trust the expertise that drives industry-leading results."',
  luxury: '"Because you deserve nothing less than extraordinary."',
  casual: '"Hey there, we thought you might love this!"',
  urgent: '"Limited time only — act now before it\'s gone!"',
  humorous: '"Finally, something that actually works. No, seriously."',
  inspirational: '"Dream bigger. Start today. Transform tomorrow."',
  playful: '"Let\'s make something awesome together!"',
  minimalist: '"Less is more. Here\'s what matters."',
  bold: '"We don\'t do things halfway. Neither should you."',
  empathetic: '"We understand what you\'re going through."',
  technical: '"Precision engineering meets creative excellence."',
  storytelling: '"Every great journey begins with a single step."',
};

const TONE_MAP: Record<string, string> = {
  professional: 'professional and authoritative',
  luxury: 'luxurious and premium, evoking exclusivity',
  casual: 'casual, warm, and conversational',
  urgent: 'urgent and action-driven with strong CTAs',
  humorous: 'witty, clever, and gently humorous',
  inspirational: 'inspirational, emotional, and aspirational',
  playful: 'playful, fun, and enthusiastic',
  minimalist: 'minimalist, clean, and focused',
  bold: 'bold, confident, and daring',
  empathetic: 'empathetic, understanding, and caring',
  technical: 'technical, precise, and data-driven',
  storytelling: 'narrative-driven, engaging, and memorable',
};

const PLATFORM_INFO: Record<string, { icon: string }> = {
  instagram: { icon: '📸' }, facebook: { icon: '👥' }, twitter: { icon: '🐦' },
  linkedin: { icon: '💼' }, tiktok: { icon: '🎵' }, youtube: { icon: '▶️' },
  billboard: { icon: '🏙️' }, email: { icon: '📧' }, googleads: { icon: '🔍' },
  pinterest: { icon: '📌' }, snapchat: { icon: '👻' },
};

interface Campaign {
  id: string;
  productName: string;
  result: any;
  tone: string;
  provider: string;
  platforms: string[];
  createdAt: string;
  isFavorite: boolean;
}

export default function HomePage() {
  const [provider, setProvider] = useState<'gemini' | 'deepseek' | 'glm'>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [productName, setProductName] = useState('');
  const [productDesc, setProductDesc] = useState('');
  const [tone, setTone] = useState('professional');
  const [audience, setAudience] = useState('');
  const [platforms, setPlatforms] = useState<string[]>(['instagram', 'facebook']);
  const [creativity, setCreativity] = useState(50);
  const [additionalInstructions, setAdditionalInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentView, setCurrentView] = useState<'generate' | 'campaigns'>('generate');

  useEffect(() => {
    const savedKey = localStorage.getItem(`adforge_key_${provider}`);
    if (savedKey) setApiKey(savedKey);
    const savedCampaigns = localStorage.getItem('adforge_campaigns');
    if (savedCampaigns) setCampaigns(JSON.parse(savedCampaigns));
  }, [provider]);

  useEffect(() => {
    if (apiKey) localStorage.setItem(`adforge_key_${provider}`, apiKey);
  }, [apiKey, provider]);

  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('adforge_campaigns', JSON.stringify(newCampaigns));
  };

  const togglePlatform = (p: string) => {
    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  const buildPrompt = () => {
    return `You are a senior advertising strategist and master copywriter. Generate a complete advertisement campaign.

PRODUCT: ${productName}
DESCRIPTION: ${productDesc}
TONE: ${TONE_MAP[tone]}
PLATFORMS: ${platforms.join(', ')}
TARGET AUDIENCE: ${audience || 'Identify the most suitable target audience.'}
${additionalInstructions ? `ADDITIONAL INSTRUCTIONS: ${additionalInstructions}` : ''}

Return ONLY a valid JSON object with these keys (no markdown, no code blocks):
{
  "headline": "Powerful headline, max 12 words",
  "tagline": "Concise tagline, max 8 words",
  "adCopy": "Full ad copy, 3-5 sentences, 50-100 words",
  "callToAction": "Strong CTA, max 6 words, use action verbs",
  "targetAudience": "Detailed audience profile, 2-3 sentences",
  "keyBenefits": "3 key benefits as bullet points",
  "platformVersions": "Adapted copy for each platform, 1-2 sentences each"
}`;
  };

  const handleGenerate = async () => {
    if (!productName.trim() || !productDesc.trim()) {
      toast.error('Please fill in product name and description');
      return;
    }
    if (!apiKey.trim()) {
      toast.error('Please enter your API key');
      return;
    }

    setLoading(true);
    try {
      const config = API_CONFIGS[provider];
      const prompt = buildPrompt();
      const body = config.buildBody(prompt);

      const response = await fetch(config.url(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      let raw = config.parseResponse(data);
      raw = raw.replace(/```json|```/g, '').trim();

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch {
        throw new Error('Failed to parse AI response');
      }

      setResult(parsed);
      toast.success('Campaign generated!');

      const newCampaign: Campaign = {
        id: Date.now().toString(),
        productName,
        result: parsed,
        tone,
        provider,
        platforms,
        createdAt: new Date().toISOString(),
        isFavorite: false,
      };
      saveCampaigns([newCampaign, ...campaigns]);
    } catch (error: any) {
      toast.error(error.message || 'Generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async (sectionKey: string) => {
    if (!productName.trim() || !productDesc.trim() || !apiKey.trim()) return;

    setRegenerating(sectionKey);
    try {
      const config = API_CONFIGS[provider];
      const prompt = `Generate ONE ${sectionKey} for "${productName}" (${productDesc}). Tone: ${TONE_MAP[tone]}. Return ONLY the text, nothing else.`;
      const body = config.buildBody(prompt);

      const response = await fetch(config.url(apiKey), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Regeneration failed');

      const data = await response.json();
      let text = config.parseResponse(data);
      text = text.replace(/```json|```/g, '').trim();

      setResult((prev: any) => ({ ...prev, [sectionKey]: text }));
      toast.success(`${sectionKey} regenerated`);
    } catch {
      toast.error('Regeneration failed');
    } finally {
      setRegenerating(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const handleCopyAll = () => {
    if (!result) return;
    const text = `HEADLINE\n${result.headline}\n\nTAGLINE\n${result.tagline}\n\nAD COPY\n${result.adCopy}\n\nCALL TO ACTION\n${result.callToAction}\n\nTARGET AUDIENCE\n${result.targetAudience}\n\nKEY BENEFITS\n${result.keyBenefits}\n\nPLATFORM ADAPTATIONS\n${result.platformVersions}`;
    navigator.clipboard.writeText(text);
    toast.success('Campaign copied!');
  };

  const handleExportTXT = () => {
    if (!result) return;
    const text = `${productName} Campaign\n${'='.repeat(40)}\n\nHEADLINE:\n${result.headline}\n\nTAGLINE:\n${result.tagline}\n\nAD COPY:\n${result.adCopy}\n\nCALL TO ACTION:\n${result.callToAction}\n\nTARGET AUDIENCE:\n${result.targetAudience}\n\nKEY BENEFITS:\n${result.keyBenefits}\n\nPLATFORM ADAPTATIONS:\n${result.platformVersions}`;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_campaign.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportMarkdown = () => {
    if (!result) return;
    const md = `# ${productName} Campaign\n\n## Headline\n\n${result.headline}\n\n## Tagline\n\n${result.tagline}\n\n## Ad Copy\n\n${result.adCopy}\n\n## Call to Action\n\n${result.callToAction}\n\n## Target Audience\n\n${result.targetAudience}\n\n## Key Benefits\n\n${result.keyBenefits}\n\n## Platform Adaptations\n\n${result.platformVersions}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${productName.replace(/[^a-zA-Z0-9]/g, '_')}_campaign.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadCampaign = (c: Campaign) => {
    setResult(c.result);
    setProductName(c.productName);
    setTone(c.tone);
    setPlatforms(c.platforms);
    setShowHistory(false);
    setCurrentView('generate');
  };

  const deleteCampaign = (id: string) => {
    saveCampaigns(campaigns.filter(c => c.id !== id));
    toast.success('Campaign deleted');
  };

  const toggleFavorite = (id: string) => {
    saveCampaigns(campaigns.map(c => c.id === id ? { ...c, isFavorite: !c.isFavorite } : c));
  };

  const sections = [
    { key: 'headline', label: 'Headline', isHeadline: true },
    { key: 'tagline', label: 'Tagline' },
    { key: 'adCopy', label: 'Ad Copy' },
    { key: 'callToAction', label: 'Call to Action' },
    { key: 'targetAudience', label: 'Target Audience' },
    { key: 'keyBenefits', label: 'Key Benefits' },
    { key: 'platformVersions', label: 'Platform Adaptations', isHeadline: true },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', color: 'var(--ink)' }}>
      <Toaster position="bottom-right" />

      {/* Header */}
      <header style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: 'var(--ink)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span style={{ fontFamily: 'var(--font-serif)', fontSize: 20, fontWeight: 700 }}>Ad<span style={{ color: 'var(--primary)' }}>Forge</span></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setCurrentView('generate')} style={{ background: currentView === 'generate' ? 'var(--terracotta-light)' : 'transparent', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: currentView === 'generate' ? 'var(--primary)' : 'var(--ink-soft)', cursor: 'pointer' }}>Generate</button>
          <button onClick={() => setCurrentView('campaigns')} style={{ background: currentView === 'campaigns' ? 'var(--terracotta-light)' : 'transparent', border: 'none', padding: '8px 16px', borderRadius: 6, fontSize: 14, fontWeight: 500, color: currentView === 'campaigns' ? 'var(--primary)' : 'var(--ink-soft)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={14} /> History ({campaigns.length})
          </button>
        </div>
      </header>

      {/* Main Content */}
      {currentView === 'generate' ? (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32, display: 'grid', gridTemplateColumns: '420px 1fr', gap: 32, alignItems: 'start' }}>
          {/* Form Panel */}
          <div className="card" style={{ position: 'sticky', top: 88, overflow: 'hidden' }}>
            <div style={{ padding: 20, background: 'var(--ink)', borderBottom: '1px solid var(--border)' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 600, color: 'white' }}>Campaign Brief</h2>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Fill in the details to generate your campaign</p>
            </div>

            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* API Key */}
              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>AI Provider</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['gemini', 'deepseek', 'glm'] as const).map((p) => (
                    <button key={p} onClick={() => setProvider(p)} style={{ flex: 1, padding: 10, borderRadius: 6, border: provider === p ? '2px solid var(--primary)' : '1px solid var(--border)', background: provider === p ? 'var(--terracotta-light)' : 'var(--background)', color: provider === p ? 'var(--primary)' : 'var(--ink-soft)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                      {API_CONFIGS[p].name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type={showKey ? 'text' : 'password'} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Enter your API key" style={{ flex: 1 }} />
                  <button onClick={() => setShowKey(!showKey)} style={{ width: 40, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--white)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showKey ? '👁️' : '🔒'}
                  </button>
                </div>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Product Name <span style={{ color: 'var(--primary)' }}>*</span></label>
                <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. Nike Air Max 2025" style={{ width: '100%' }} />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Product Description <span style={{ color: 'var(--primary)' }}>*</span></label>
                <textarea value={productDesc} onChange={(e) => setProductDesc(e.target.value)} placeholder="Describe your product..." style={{ width: '100%', minHeight: 80 }} />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Campaign Tone</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {Object.keys(TONE_PREVIEWS).map((t) => (
                    <button key={t} onClick={() => setTone(t)} style={{ padding: '8px 10px', borderRadius: 6, border: tone === t ? '1.5px solid var(--primary)' : '1px solid var(--border)', background: tone === t ? 'var(--terracotta-light)' : 'var(--background)', color: tone === t ? 'var(--primary)' : 'var(--ink-soft)', fontSize: 12, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
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
                  {Object.keys(PLATFORM_INFO).map((p) => (
                    <button key={p} onClick={() => togglePlatform(p)} style={{ padding: '6px 12px', borderRadius: 20, border: platforms.includes(p) ? '1.5px solid var(--ink)' : '1px solid var(--border)', background: platforms.includes(p) ? 'var(--ink)' : 'var(--background)', color: platforms.includes(p) ? 'white' : 'var(--ink-soft)', fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>{PLATFORM_INFO[p].icon}</span>
                      <span style={{ textTransform: 'capitalize' }}>{p}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Target Audience</label>
                <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g. Young professionals aged 25-35" style={{ width: '100%' }} />
              </div>

              <div>
                <label className="label" style={{ marginBottom: 8, display: 'block' }}>Additional Instructions</label>
                <textarea value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)} placeholder="e.g. Mention the 30-day guarantee" style={{ width: '100%', minHeight: 60 }} />
              </div>

              <button onClick={handleGenerate} disabled={loading || !productName.trim() || !productDesc.trim() || !apiKey.trim()} className="btn-primary" style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {loading ? <Loader2 size={18} style={{ animation: 'spin 0.7s linear infinite' }} /> : <Wand2 size={18} />}
                {loading ? 'Generating...' : 'Generate Campaign'}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div>
            {!result && !loading && (
              <div className="empty-state">
                <div className="empty-state-icon"><Sparkles size={24} /></div>
                <h3>Your campaign awaits</h3>
                <p>Fill in the brief and click Generate to get started.</p>
              </div>
            )}

            {loading && (
              <div>
                <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', animation: 'pulse 2s infinite' }} />
                  <span style={{ fontSize: 14 }}>Generating with {API_CONFIGS[provider].name}...</span>
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
                      <div style={{ fontSize: 15, fontWeight: 600 }}>{productName} Campaign</div>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{tone} tone • {API_CONFIGS[provider].name}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={handleCopyAll} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Copy size={14} /> Copy All</button>
                    <button onClick={handleExportTXT} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><FileText size={14} /> TXT</button>
                    <button onClick={handleExportMarkdown} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><Download size={14} /> MD</button>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  {sections.map((section) => {
                    const text = result[section.key] || '';
                    return (
                      <motion.div key={section.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ overflow: 'hidden', borderLeft: section.isHeadline ? '3px solid var(--primary)' : undefined }}>
                        <div style={{ padding: 12, background: 'var(--cream)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{section.label}</span>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleRegenerate(section.key)} disabled={regenerating === section.key} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-muted)' }}>
                              {regenerating === section.key ? <Loader2 size={14} style={{ animation: 'spin 0.7s linear infinite' }} /> : <RefreshCw size={14} />}
                            </button>
                            <button onClick={() => handleCopy(text)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--ink-muted)' }}><Copy size={14} /></button>
                          </div>
                        </div>
                        <div style={{ padding: 16, fontSize: section.key === 'headline' ? 20 : 14, color: 'var(--ink)', lineHeight: 1.7, fontFamily: section.isHeadline && section.key === 'headline' ? 'var(--font-serif)' : undefined, fontWeight: section.key === 'headline' ? 700 : undefined }}>
                          {text}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 600, marginBottom: 24 }}>Campaign History</h1>
          {campaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><History size={24} /></div>
              <h3>No campaigns yet</h3>
              <p>Generate your first campaign to see it here.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {campaigns.map((c) => (
                <div key={c.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{c.productName}</h3>
                      <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>{new Date(c.createdAt).toLocaleDateString()} • {c.tone} • {API_CONFIGS[c.provider as keyof typeof API_CONFIGS]?.name}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => toggleFavorite(c.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: c.isFavorite ? 'var(--status-orange)' : 'var(--ink-muted)' }}>
                        <Star size={16} fill={c.isFavorite ? 'var(--status-orange)' : 'transparent'} />
                      </button>
                      <button onClick={() => deleteCampaign(c.id)} style={{ background: 'none', border: 'none', padding: 4, cursor: 'pointer', color: 'var(--destructive)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginBottom: 12 }}>{c.result?.headline}</p>
                  <button onClick={() => loadCampaign(c)} className="btn-secondary" style={{ padding: '8px 16px', fontSize: 13 }}>View Campaign</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 32px', textAlign: 'center', fontSize: 12, color: 'var(--ink-muted)', marginTop: 64 }}>
        AdForge — AI Campaign Generator • Multi-Model Support • {new Date().getFullYear()}
      </footer>
    </div>
  );
}