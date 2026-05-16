"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  RefreshCw,
  Copy,
  Download,
  FileText,
  Clock,
  Trash2,
  X,
  ChevronDown,
  Sparkles,
  Layers,
  Cpu,
  Eye,
  EyeOff,
  Check,
  Printer,
  ArrowRight,
  Target,
  Users,
  Star,
  LayoutGrid,
} from "lucide-react";

// ── Types ──
interface CampaignResult {
  headline: string;
  tagline: string;
  adCopy: string;
  callToAction: string;
  targetAudience: string;
  keyBenefits: string;
  platformVersions: string;
}

interface HistoryEntry {
  id: number;
  productName: string;
  platforms: string[];
  tone: string;
  provider: string;
  result: CampaignResult;
  timestamp: string;
}

// ── Constants ──
const TONE_MAP: Record<string, string> = {
  professional: "professional and authoritative",
  luxury: "luxurious and premium, evoking exclusivity",
  casual: "casual, warm, and conversational",
  urgent: "urgent and action-driven with strong CTAs",
  humorous: "witty, clever, and gently humorous",
  inspirational: "inspirational, emotional, and aspirational",
};

const TONE_LABELS: Record<string, string> = {
  professional: "Professional",
  luxury: "Luxury",
  casual: "Casual",
  urgent: "Urgent",
  humorous: "Humorous",
  inspirational: "Inspirational",
};

const TONE_PREVIEWS: Record<string, string> = {
  professional: "Trust the expertise that drives industry-leading results.",
  luxury: "Because you deserve nothing less than extraordinary.",
  casual: "Hey there, we thought you might love this!",
  urgent: "Limited time only — act now before it's gone!",
  humorous: "Finally, something that actually works. No, seriously.",
  inspirational: "Dream bigger. Start today. Transform tomorrow.",
};

const PROVIDERS = [
  { value: "gemini", label: "Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "glm", label: "GLM" },
];

const TONES = [
  { value: "professional", label: "Professional & Authoritative" },
  { value: "luxury", label: "Luxury & Premium" },
  { value: "casual", label: "Casual & Friendly" },
  { value: "urgent", label: "Urgent & Action-Driven" },
  { value: "humorous", label: "Witty & Humorous" },
  { value: "inspirational", label: "Inspirational & Emotional" },
];

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👥" },
  { value: "twitter", label: "Twitter / X", icon: "🐦" },
  { value: "billboard", label: "Billboard", icon: "🏙️" },
];

const CARD_SECTIONS = [
  { key: "headline", label: "Headline", icon: Sparkles, full: true, accent: true, style: "headline" as const },
  { key: "tagline", label: "Tagline", icon: Layers, style: "tagline" as const, nested: true },
  { key: "adCopy", label: "Ad Copy", icon: FileText, style: "body" as const },
  { key: "callToAction", label: "Call to Action", icon: ArrowRight, style: "cta" as const },
  { key: "targetAudience", label: "Target Audience", icon: Users, style: "body" as const },
  { key: "keyBenefits", label: "Key Benefits", icon: Star, style: "body" as const },
  { key: "platformVersions", label: "Platform Adaptations", icon: LayoutGrid, full: true, style: "body" as const },
];

// ── Helpers ──
function countWords(str: string): number {
  return str.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function getCountStatus(words: number, ideal: number) {
  if (words > ideal * 1.3) return { color: "bg-status-red", label: "Too long", textClass: "text-status-red" };
  if (words > ideal) return { color: "bg-status-orange", label: "Slightly over", textClass: "text-status-orange" };
  return { color: "bg-status-green", label: "Good", textClass: "text-status-green" };
}

function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem("adforge_history") || "[]");
  } catch {
    return [];
  }
}

function saveHistory(entry: HistoryEntry) {
  const history = getHistory();
  history.unshift(entry);
  if (history.length > 5) history.length = 5;
  localStorage.setItem("adforge_history", JSON.stringify(history));
}

function deleteHistory(id: number) {
  const history = getHistory().filter((h) => h.id !== id);
  localStorage.setItem("adforge_history", JSON.stringify(history));
}

// ── Skeleton Card ──
function SkeletonCard({ full = false, lines = 3 }: { full?: boolean; lines?: number }) {
  return (
    <div className={`bg-white border border-border rounded-lg overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 ${full ? "col-span-1 md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
        <div className="skeleton-shimmer h-3 w-24 rounded-full" />
        <div className="skeleton-shimmer h-3 w-10 rounded-full" />
      </div>
      <div className="p-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="skeleton-shimmer h-3 rounded-full"
            style={{ width: `${70 - i * 15}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main Component ──
export default function Home() {
  // Form state
  const [productName, setProductName] = useState("");
  const [productDesc, setProductDesc] = useState("");
  const [tone, setTone] = useState("professional");
  const [audience, setAudience] = useState("");
  const [provider, setProvider] = useState("gemini");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["instagram", "facebook"]);

  // Output state
  const [result, setResult] = useState<CampaignResult | null>(null);
  const [resultProductName, setResultProductName] = useState("");
  const [resultTone, setResultTone] = useState("professional");
  const [resultProvider, setResultProvider] = useState("gemini");
  const [resultPlatforms, setResultPlatforms] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [regenerating, setRegenerating] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const outputRef = useRef<HTMLDivElement>(null);

  // Load history on mount
  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const togglePlatform = useCallback((p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  }, []);

  // ── Generate Campaign ──
  const generateCampaign = useCallback(async () => {
    if (!productName.trim() || !productDesc.trim()) {
      setError("Please fill in both product name and description.");
      return;
    }
    setError("");
    setLoading(true);
    setShowProgress(true);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          productName: productName.trim(),
          productDesc: productDesc.trim(),
          tone,
          audience: audience.trim(),
          platforms: selectedPlatforms,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      const entry: HistoryEntry = {
        id: Date.now(),
        productName: productName.trim(),
        platforms: selectedPlatforms,
        tone,
        provider,
        result: data.result,
        timestamp: new Date().toISOString(),
      };

      setResult(data.result);
      setResultProductName(productName.trim());
      setResultTone(tone);
      setResultProvider(provider);
      setResultPlatforms(selectedPlatforms);

      saveHistory(entry);
      setHistory(getHistory());

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setShowProgress(false);
    }
  }, [productName, productDesc, tone, audience, provider, selectedPlatforms]);

  // ── Regenerate Section ──
  const regenerateSection = useCallback(
    async (sectionKey: string) => {
      if (!result || !productName.trim() || !productDesc.trim()) return;

      setRegenerating(sectionKey);
      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            sectionKey,
            productName: productName.trim(),
            productDesc: productDesc.trim(),
            tone,
            platforms: selectedPlatforms,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Regeneration failed");

        const updated = { ...result, [sectionKey]: data.text };
        setResult(updated);

        // Update history
        const h = getHistory();
        if (h.length > 0) {
          h[0].result = updated;
          localStorage.setItem("adforge_history", JSON.stringify(h));
          setHistory(h);
        }
      } catch (err: any) {
        console.error("Regeneration error:", err);
      } finally {
        setRegenerating(null);
      }
    },
    [result, productName, productDesc, tone, provider, selectedPlatforms]
  );

  // ── Load from History ──
  const loadHistory = useCallback((entry: HistoryEntry) => {
    setProductName(entry.productName);
    setTone(entry.tone);
    setProvider(entry.provider);
    setSelectedPlatforms(entry.platforms);
    setResult(entry.result);
    setResultProductName(entry.productName);
    setResultTone(entry.tone);
    setResultProvider(entry.provider);
    setResultPlatforms(entry.platforms);
    setHistoryOpen(false);
    setTimeout(() => {
      outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 200);
  }, []);

  const deleteHistoryEntry = useCallback((id: number) => {
    deleteHistory(id);
    setHistory(getHistory());
  }, []);

  // ── Export ──
  const exportPDF = useCallback(() => window.print(), []);

  const exportMarkdown = useCallback(() => {
    if (!result) return;
    const md = `# ${resultProductName} Campaign\n\n## Headline\n\n${result.headline}\n\n## Tagline\n\n${result.tagline}\n\n## Ad Copy\n\n${result.adCopy}\n\n## Call to Action\n\n${result.callToAction}\n\n## Target Audience\n\n${result.targetAudience}\n\n## Key Benefits\n\n${result.keyBenefits}\n\n## Platform Adaptations\n\n${result.platformVersions}\n`;
    navigator.clipboard.writeText(md);
  }, [result, resultProductName]);

  const exportTXT = useCallback(() => {
    if (!result) return;
    const txt = `${resultProductName} Campaign\n${"=".repeat(40)}\n\nHEADLINE:\n${result.headline}\n\nTAGLINE:\n${result.tagline}\n\nAD COPY:\n${result.adCopy}\n\nCALL TO ACTION:\n${result.callToAction}\n\nTARGET AUDIENCE:\n${result.targetAudience}\n\nKEY BENEFITS:\n${result.keyBenefits}\n\nPLATFORM ADAPTATIONS:\n${result.platformVersions}\n`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${resultProductName.replace(/[^a-zA-Z0-9]/g, "_")}_campaign.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result, resultProductName]);

  const copyAll = useCallback(() => {
    if (!result) return;
    const full = `HEADLINE\n${result.headline}\n\nTAGLINE\n${result.tagline}\n\nAD COPY\n${result.adCopy}\n\nCALL TO ACTION\n${result.callToAction}\n\nTARGET AUDIENCE\n${result.targetAudience}\n\nKEY BENEFITS\n${result.keyBenefits}\n\nPLATFORM ADAPTATIONS\n${result.platformVersions}`;
    navigator.clipboard.writeText(full).then(() => {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 1500);
    });
  }, [result]);

  const copyText = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
  }, []);

  // ── Render ──
  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className={`progress-bar-fill ${showProgress ? "indeterminate" : ""}`} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-ink">
              Ad<span className="text-terracotta">Forge</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setHistory(getHistory());
                setHistoryOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              History
              {history.length > 0 && (
                <span className="bg-terracotta text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {history.length}
                </span>
              )}
            </button>
            <span className="text-[11px] font-semibold uppercase tracking-widest text-ink-muted bg-border-soft border border-border px-2.5 py-1 rounded-full">
              AI Campaign Studio
            </span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-white border-b border-border">
        <div className="max-w-[1280px] mx-auto px-6 py-12 md:py-16 grid md:grid-template-columns:1fr_1fr gap-12 md:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[1.2px] text-terracotta mb-5">
              <span className="w-6 h-0.5 bg-terracotta rounded" />
              AI-Powered Platform
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-[1.15] tracking-tight text-ink mb-5">
              Campaign copy that<br />
              <em className="text-terracotta">actually converts.</em>
            </h1>
            <p className="text-base text-ink-soft leading-relaxed font-light">
              Input your product, select your tone and platforms — AdForge generates complete,
              ready-to-publish advertisement campaigns in seconds.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="bg-cream border border-border rounded-lg p-5 text-center">
              <div className="font-serif text-3xl font-bold text-ink leading-none mb-1">5x</div>
              <div className="text-xs text-ink-muted uppercase tracking-wider font-medium">Faster</div>
            </div>
            <div className="bg-cream border border-border rounded-lg p-5 text-center">
              <div className="font-serif text-3xl font-bold text-ink leading-none mb-1">6</div>
              <div className="text-xs text-ink-muted uppercase tracking-wider font-medium">Ad Formats</div>
            </div>
            <div className="bg-cream border border-border rounded-lg p-5 text-center">
              <div className="font-serif text-3xl font-bold text-ink leading-none mb-1">3</div>
              <div className="text-xs text-ink-muted uppercase tracking-wider font-medium">AI Models</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1280px] mx-auto px-6 py-10 md:py-12 grid lg:grid-cols-[420px_1fr] gap-8 items-start">
        {/* Form Panel */}
        <aside className="form-panel-wrapper lg:sticky lg:top-[88px]">
          <div className="bg-white border border-border rounded-lg shadow-md overflow-hidden">
            <div className="px-7 py-6 bg-ink border-b border-ink">
              <h2 className="font-serif text-lg font-semibold text-white mb-1">Campaign Brief</h2>
              <p className="text-sm text-white/50 font-light">Fill in the details below to generate your campaign</p>
            </div>
            <div className="p-7 space-y-5">
              {/* Provider Select */}
              <div className="bg-cream border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-terracotta">
                  <span className="w-1.5 h-1.5 bg-terracotta rounded-full" />
                  AI Provider
                </div>
                <div className="relative">
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full text-sm text-ink bg-cream border-[1.5px] border-border rounded px-3 py-2.5 pr-8 appearance-none cursor-pointer focus:border-ink focus:bg-white focus:ring-[3px] focus:ring-ink/5 outline-none transition-all"
                  >
                    {PROVIDERS.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
                </div>
                <p className="text-[11px] text-ink-muted">API key is handled securely on the server</p>
              </div>

              {/* Product Name */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Product Name <span className="text-terracotta">*</span>
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Nike Air Max 2025"
                  className="w-full text-sm text-ink bg-cream border-[1.5px] border-border rounded px-3.5 py-2.5 focus:border-ink focus:bg-white focus:ring-[3px] focus:ring-ink/5 outline-none transition-all"
                />
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Product Description <span className="text-terracotta">*</span>
                </label>
                <textarea
                  value={productDesc}
                  onChange={(e) => setProductDesc(e.target.value)}
                  placeholder="Describe your product — what it does, who it's for, what makes it special..."
                  rows={4}
                  className="w-full text-sm text-ink bg-cream border-[1.5px] border-border rounded px-3.5 py-2.5 resize-y min-h-[96px] leading-relaxed focus:border-ink focus:bg-white focus:ring-[3px] focus:ring-ink/5 outline-none transition-all"
                />
              </div>

              {/* Tone */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Campaign Tone
                </label>
                <div className="relative">
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full text-sm text-ink bg-cream border-[1.5px] border-border rounded px-3 py-2.5 pr-8 appearance-none cursor-pointer focus:border-ink focus:bg-white focus:ring-[3px] focus:ring-ink/5 outline-none transition-all"
                  >
                    {TONES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted pointer-events-none" />
                </div>
                <div className="text-[13px] italic text-ink-muted bg-terracotta-light rounded px-3 py-2 border-l-[3px] border-terracotta leading-relaxed transition-all">
                  &ldquo;{TONE_PREVIEWS[tone]}&rdquo;
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Target Platforms
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => togglePlatform(p.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 border-[1.5px] rounded text-[13px] font-medium transition-all ${
                        selectedPlatforms.includes(p.value)
                          ? "border-ink bg-ink text-white"
                          : "border-border bg-cream text-ink-soft hover:border-ink-soft hover:text-ink"
                      }`}
                    >
                      <span className="text-base leading-none">{p.icon}</span>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audience */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g. Young professionals aged 25-35"
                  className="w-full text-sm text-ink bg-cream border-[1.5px] border-border rounded px-3.5 py-2.5 focus:border-ink focus:bg-white focus:ring-[3px] focus:ring-ink/5 outline-none transition-all"
                />
              </div>

              {/* Divider */}
              <div className="h-px bg-border" />

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-[13px] text-red-700">
                  {error}
                </div>
              )}

              {/* Generate Button */}
              <button
                onClick={generateCampaign}
                disabled={loading}
                className={`w-full py-3.5 rounded font-semibold text-sm tracking-wide flex items-center justify-center gap-2 transition-all ${
                  loading
                    ? "bg-terracotta/60 text-white/80 cursor-not-allowed"
                    : "bg-terracotta text-white hover:bg-terracotta-dark hover:shadow-[0_4px_12px_rgba(200,96,42,0.35)] active:translate-y-px"
                }`}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </aside>

        {/* Output Panel */}
        <main ref={outputRef} className="space-y-5">
          {!result && !loading && (
            <div className="bg-white border-[1.5px] border-dashed border-border rounded-lg py-20 px-10 text-center flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-border-soft rounded-full flex items-center justify-center text-2xl">
                <Sparkles className="w-6 h-6 text-ink-muted" />
              </div>
              <h3 className="font-serif text-xl text-ink">Your campaign awaits</h3>
              <p className="text-sm text-ink-muted max-w-[280px] leading-relaxed">
                Fill in the brief on the left and click Generate Campaign to get started.
              </p>
            </div>
          )}

          {/* Skeleton Loading */}
          {loading && (
            <div className="space-y-5">
              <div className="bg-white border border-border rounded-lg px-6 py-4 flex items-center justify-between animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-terracotta rounded-full" />
                  <div>
                    <div className="skeleton-shimmer h-4 w-40 rounded mb-1" />
                    <div className="skeleton-shimmer h-3 w-28 rounded" />
                  </div>
                </div>
                <div className="skeleton-shimmer h-8 w-20 rounded" />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <SkeletonCard full lines={2} />
                <SkeletonCard lines={3} />
                <SkeletonCard lines={1} />
                <SkeletonCard lines={3} />
                <SkeletonCard lines={2} />
                <SkeletonCard full lines={4} />
              </div>
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <div className="space-y-4">
              {/* Result Header */}
              <div className="result-actions-bar bg-white border border-border rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-status-green rounded-full animate-pulse" />
                  <div>
                    <div className="font-serif text-base font-semibold text-ink">
                      {resultProductName} Campaign
                    </div>
                    <div className="text-xs text-ink-muted">
                      Generated · {TONE_LABELS[resultTone]} tone ·{" "}
                      {PROVIDERS.find((p) => p.value === resultProvider)?.label}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={copyAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink transition-colors"
                  >
                    {copiedAll ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAll ? "Copied!" : "Copy All"}
                  </button>
                  <button
                    onClick={exportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Markdown
                  </button>
                  <button
                    onClick={exportTXT}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    TXT
                  </button>
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold uppercase tracking-wider text-ink-soft hover:border-ink hover:text-ink transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>

              {/* Campaign Cards */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Headline + Tagline combined card */}
                <div className="md:col-span-2 bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 border-l-[3px] border-l-terracotta">
                  {/* Headline */}
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <Sparkles className="w-3.5 h-3.5" />
                      Headline
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("headline")}
                        disabled={regenerating === "headline"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate headline"
                      >
                        {regenerating === "headline" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.headline)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 font-serif text-[22px] font-bold leading-snug text-ink">
                    {result.headline}
                  </div>
                  {/* Word count for headline */}
                  {(() => {
                    const wc = countWords(result.headline);
                    const status = getCountStatus(wc, 12);
                    return (
                      <div className="flex items-center gap-2 px-4 pb-3 text-xs text-ink-muted">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className={`font-medium ${status.textClass}`}>{wc} words</span>
                        <span className="opacity-60">(ideal: under 12 words)</span>
                      </div>
                    );
                  })()}

                  {/* Tagline */}
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-t border-y-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <Layers className="w-3.5 h-3.5" />
                      Tagline
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("tagline")}
                        disabled={regenerating === "tagline"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate tagline"
                      >
                        {regenerating === "tagline" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.tagline)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-3 italic text-base text-ink-soft">
                    {result.tagline}
                  </div>

                  {/* Platform Tags */}
                  {resultPlatforms.length > 0 && (
                    <div className="flex gap-2 flex-wrap px-4 py-3 border-t border-border-soft bg-cream">
                      {resultPlatforms.map((p) => (
                        <span
                          key={p}
                          className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-border text-ink-soft"
                        >
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Ad Copy */}
                <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75">
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <FileText className="w-3.5 h-3.5" />
                      Ad Copy
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("adCopy")}
                        disabled={regenerating === "adCopy"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        {regenerating === "adCopy" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.adCopy)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {result.adCopy}
                  </div>
                  {(() => {
                    const wc = countWords(result.adCopy);
                    const status = getCountStatus(wc, 100);
                    return (
                      <div className="flex items-center gap-2 px-4 pb-3 text-xs text-ink-muted">
                        <div className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className={`font-medium ${status.textClass}`}>{wc} words</span>
                        <span className="opacity-60">(ideal: under 100 words)</span>
                      </div>
                    );
                  })()}
                </div>

                {/* Call to Action */}
                <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 delay-100">
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <ArrowRight className="w-3.5 h-3.5" />
                      Call to Action
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("callToAction")}
                        disabled={regenerating === "callToAction"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        {regenerating === "callToAction" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.callToAction)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-base font-semibold text-terracotta">
                    {result.callToAction}
                  </div>
                </div>

                {/* Target Audience */}
                <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 delay-150">
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <Users className="w-3.5 h-3.5" />
                      Target Audience
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("targetAudience")}
                        disabled={regenerating === "targetAudience"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        {regenerating === "targetAudience" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.targetAudience)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {result.targetAudience}
                  </div>
                </div>

                {/* Key Benefits */}
                <div className="bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 delay-200">
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <Star className="w-3.5 h-3.5" />
                      Key Benefits
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("keyBenefits")}
                        disabled={regenerating === "keyBenefits"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        {regenerating === "keyBenefits" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.keyBenefits)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {result.keyBenefits}
                  </div>
                </div>

                {/* Platform Adaptations */}
                <div className="md:col-span-2 bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-in fade-in slide-in-from-bottom-3 duration-500 delay-250">
                  <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                      <LayoutGrid className="w-3.5 h-3.5" />
                      Platform Adaptations
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => regenerateSection("platformVersions")}
                        disabled={regenerating === "platformVersions"}
                        className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                        title="Regenerate"
                      >
                        {regenerating === "platformVersions" ? (
                          <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(result.platformVersions)}
                        className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                        title="Copy"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 py-4 text-sm text-ink leading-relaxed whitespace-pre-wrap">
                    {result.platformVersions}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white">
        <div className="max-w-[1280px] mx-auto px-6 py-6 flex flex-wrap items-center justify-between gap-4">
          <span className="font-serif text-sm font-bold text-ink">
            Ad<span className="text-terracotta">Forge</span>
          </span>
          <p className="text-xs text-ink-muted">
            AI Campaign Generator · Multi-Model Support · Group Project
          </p>
          <p className="text-xs text-ink-muted">&copy; 2025 AdForge</p>
        </div>
      </footer>

      {/* History Sidebar */}
      {historyOpen && (
        <>
          <div
            className="fixed inset-0 bg-ink/30 z-[200] transition-opacity"
            onClick={() => setHistoryOpen(false)}
          />
          <div className="fixed top-0 right-0 w-[380px] max-w-[90vw] h-screen bg-white border-l border-border shadow-xl z-[201] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-5 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-serif text-lg font-semibold text-ink">Campaign History</h2>
              <button
                onClick={() => setHistoryOpen(false)}
                className="w-8 h-8 border border-border rounded flex items-center justify-center text-ink-muted hover:border-ink hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
              {history.length === 0 && (
                <div className="text-center py-12 text-ink-muted text-sm">
                  <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p>No campaigns yet.</p>
                  <p className="text-xs mt-1">Generate your first campaign to see it here.</p>
                </div>
              )}
              {history.map((entry) => {
                const date = new Date(entry.timestamp);
                const timeStr =
                  date.toLocaleDateString() +
                  " " +
                  date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={entry.id}
                    onClick={() => loadHistory(entry)}
                    className="border border-border rounded-lg p-4 cursor-pointer hover:border-terracotta hover:shadow-sm transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="font-semibold text-sm text-ink leading-snug">
                        {entry.productName}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryEntry(entry.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-ink-muted hover:text-status-red hover:bg-red-50 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mb-2">
                      <span>{TONE_LABELS[entry.tone]}</span>
                      <span>·</span>
                      <span>{timeStr}</span>
                    </div>
                    <div className="text-[13px] text-ink-soft leading-relaxed line-clamp-2">
                      {entry.result.headline}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
