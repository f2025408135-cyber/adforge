"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Sparkles,
  Search,
  Star,
  Copy,
  Download,
  RefreshCw,
  Trash2,
  Eye,
  EyeOff,
  CopyPlus,
  Plus,
  Layers,
  BarChart3,
  FileText,
  Palette,
  Wand2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Check,
  LayoutTemplate,
  FolderOpen,
  Heart,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
} from "lucide-react";

import { useCampaignStore } from "@/stores/campaign-store";
import {
  useCampaigns,
  useCreateCampaign,
  useDeleteCampaign,
  useToggleFavorite,
  useDuplicateCampaign,
  useRateCampaign,
} from "@/hooks/use-campaigns";
import {
  useTemplates,
  useCreateTemplate,
} from "@/hooks/use-templates";
import {
  useBrandKits,
  useCreateBrandKit,
  useDeleteBrandKit,
} from "@/hooks/use-brand-kits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDebounce } from "@/hooks/use-debounce";
import {
  TONE_MAP,
  TONE_PREVIEWS,
  LANGUAGE_MAP,
  PROVIDER_DESCRIPTIONS,
  TEMPLATE_PROMPTS,
} from "@/lib/prompt-templates";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// ─── Constants ────────────────────────────────────────────────────────

const TONES = [
  "professional", "luxury", "casual", "urgent", "humorous", "inspirational",
  "playful", "minimalist", "bold", "empathetic", "technical", "storytelling",
];

const PLATFORMS = [
  { id: "instagram", label: "Instagram", emoji: "\uD83D\uDCF8" },
  { id: "facebook", label: "Facebook", emoji: "\uD83D\uDC65" },
  { id: "twitter", label: "Twitter/X", emoji: "\uD83D\uDC26" },
  { id: "linkedin", label: "LinkedIn", emoji: "\uD83D\uDCBC" },
  { id: "tiktok", label: "TikTok", emoji: "\uD83C\uDFB5" },
  { id: "youtube", label: "YouTube", emoji: "\u25B6\uFE0F" },
  { id: "billboard", label: "Billboard", emoji: "\uD83C\uDFD9\uFE0F" },
  { id: "email", label: "Email", emoji: "\uD83D\uDCE7" },
  { id: "google-ads", label: "Google Ads", emoji: "\uD83D\uDD0D" },
];

const AUDIENCE_PRESETS = [
  "Millennials 25-40",
  "Gen Z 18-24",
  "Professionals 30-50",
  "Parents 30-45",
  "Small Business Owners",
  "Tech Enthusiasts",
  "Health & Fitness",
  "Luxury Shoppers",
];

const TEMPLATE_CATEGORIES = ["All", "Product", "Service", "Event", "SaaS", "E-Commerce"];

const TEMPLATE_CATEGORY_MAP: Record<string, string> = {
  "product-launch": "Product",
  "flash-sale": "E-Commerce",
  "brand-awareness": "Service",
  "event-promotion": "Event",
  "saas-trial": "SaaS",
  "ecommerce-holiday": "E-Commerce",
  "app-download": "Product",
  "newsletter-signup": "Service",
  "retargeting": "E-Commerce",
  "partnership": "Service",
};

const WORD_COUNT_IDEALS: Record<string, number> = {
  headline: 12,
  tagline: 8,
  adCopy: 100,
  callToAction: 6,
  targetAudience: 60,
  keyBenefits: 60,
  platformVersions: 100,
};

const SECTION_LABELS: Record<string, string> = {
  headline: "Headline",
  tagline: "Tagline",
  adCopy: "Ad Copy",
  callToAction: "Call to Action",
  targetAudience: "Target Audience",
  keyBenefits: "Key Benefits",
  platformVersions: "Platform Adaptations",
};

const SECTION_ICONS: Record<string, React.ReactNode> = {
  headline: <Sparkles className="w-3.5 h-3.5" />,
  tagline: <FileText className="w-3.5 h-3.5" />,
  adCopy: <FileText className="w-3.5 h-3.5" />,
  callToAction: <ArrowRight className="w-3.5 h-3.5" />,
  targetAudience: <Users className="w-3.5 h-3.5" />,
  keyBenefits: <Star className="w-3.5 h-3.5" />,
  platformVersions: <Layers className="w-3.5 h-3.5" />,
};

const ALL_PROVIDERS = [
  { id: "deepseek", label: "DeepSeek", model: "V4 Flash" },
  { id: "gemini", label: "Gemini", model: "2.0 Flash" },
  { id: "glm", label: "GLM", model: "4 Flash" },
];

type TabId = "generate" | "campaigns" | "templates" | "brand-kits" | "analytics";

const TAB_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "generate", label: "Generate", icon: <Sparkles className="w-4 h-4" /> },
  { id: "campaigns", label: "Campaigns", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "templates", label: "Templates", icon: <LayoutTemplate className="w-4 h-4" /> },
  { id: "brand-kits", label: "Brand Kits", icon: <Palette className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
];

// ─── Helpers ──────────────────────────────────────────────────────────

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function wordCountStatus(count: number, ideal: number): { color: string; bg: string; label: string } {
  const ratio = count / ideal;
  if (ratio <= 1.3) return { color: "text-status-green", bg: "bg-status-green", label: "ideal" };
  if (ratio <= 1.8) return { color: "text-status-orange", bg: "bg-status-orange", label: "long" };
  return { color: "text-status-red", bg: "bg-status-red", label: "too long" };
}

function formatTemplateKey(key: string): string {
  return key
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

function capitalizeFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// ─── Word Count Indicator Component ──────────────────────────────────

function WordCountIndicator({ text, ideal }: { text: string; ideal: number }) {
  const count = wordCount(text);
  const status = wordCountStatus(count, ideal);
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${status.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status.bg}`} />
      {count} words
      <span className="text-ink-muted">(ideal: under {ideal})</span>
    </span>
  );
}

// ─── Copy to clipboard ───────────────────────────────────────────────

async function copyToClipboard(text: string, label: string = "Content") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  } catch {
    toast.error("Failed to copy");
  }
}

// ─══════════════════════════════════════════════════════════════════════
// TAB 1: GENERATE TAB
// ═══════════════════════════════════════════════════════════════════════

function GenerateTab() {
  const store = useCampaignStore();
  const [enhancing, setEnhancing] = useState(false);
  const createCampaign = useCreateCampaign();

  const templatesQuery = useTemplates();
  const brandKitsQuery = useBrandKits();

  const dbTemplates = templatesQuery.data?.templates ?? [];
  const brandKits = brandKitsQuery.data?.brandKits ?? [];

  // ── Fetch available providers from backend ──────────────────
  const [availableProviders, setAvailableProviders] = useState<{ id: string; label: string; available: boolean; model: string }[]>([]);
  const [providersLoaded, setProvidersLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/providers")
      .then((r) => r.json())
      .then((data) => {
        const providers = data.providers || [];
        const defaultProvider = data.defaultProvider || "deepseek";
        setAvailableProviders(providers);
        setProvidersLoaded(true);
        // Auto-select first available provider or default
        const currentAvailable = providers.find((p: any) => p.id === store.provider && p.available);
        if (!currentAvailable && providers.length > 0) {
          const defaultAvail = providers.find((p: any) => p.id === defaultProvider && p.available);
          const firstAvailable = defaultAvail || providers.find((p: any) => p.available);
          if (firstAvailable) store.setProvider(firstAvailable.id);
        }
      })
      .catch(() => setProvidersLoaded(true));
  }, []);

  // ── AI Enhance Description ────────────────────────────────────
  const handleEnhance = useCallback(async () => {
    if (!store.productName || !store.productDesc) {
      toast.error("Please enter product name and description first");
      return;
    }
    setEnhancing(true);
    try {
      const res = await fetch("/api/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: store.provider,
          productName: store.productName,
          productDesc: store.productDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhancement failed");
      store.setProductDesc(data.enhancedDesc);
      toast.success("Description enhanced!");
    } catch (err: any) {
      toast.error(err.message || "Failed to enhance description");
    } finally {
      setEnhancing(false);
    }
  }, [store.productName, store.productDesc, store.provider]);

  // ── Generate Campaign ─────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    if (!store.productName.trim()) {
      toast.error("Product name is required");
      return;
    }
    if (!store.productDesc.trim() || store.productDesc.trim().length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }
    if (store.platforms.length === 0) {
      toast.error("Select at least one platform");
      return;
    }

    store.setError("");
    store.setLoading(true);
    store.setShowProgress(true);
    store.setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: store.provider,
          productName: store.productName,
          productDesc: store.productDesc,
          tone: store.tone,
          audience: store.audience || undefined,
          platforms: store.platforms,
          brandVoice: store.brandVoice || undefined,
          language: store.language,
          creativity: store.creativity,
          templateId: store.templateId || undefined,
          additionalInstructions: store.additionalInstructions || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      store.setResult(data.result);
      toast.success("Campaign generated successfully!");
    } catch (err: any) {
      store.setError(err.message || "Something went wrong");
      toast.error(err.message || "Generation failed");
    } finally {
      store.setLoading(false);
      store.setShowProgress(false);
    }
  }, [store]);

  // ── Regenerate Section ────────────────────────────────────────
  const handleRegenerate = useCallback(
    async (sectionKey: string) => {
      if (!store.result) return;
      store.setRegenerating(sectionKey);
      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: store.provider,
            sectionKey,
            productName: store.productName,
            productDesc: store.productDesc,
            tone: store.tone,
            platforms: store.platforms,
            language: store.language,
            creativity: store.creativity,
            brandVoice: store.brandVoice || undefined,
            additionalInstructions: store.additionalInstructions || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Regeneration failed");
        store.updateSection(sectionKey, data.text);
        toast.success(`${SECTION_LABELS[sectionKey]} regenerated!`);
      } catch (err: any) {
        toast.error(err.message || "Failed to regenerate");
      } finally {
        store.setRegenerating(null);
      }
    },
    [store]
  );

  // ── Save to Dashboard ────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!store.result) return;
    try {
      await createCampaign.mutateAsync({
        productName: store.resultProductName,
        productDesc: store.productDesc,
        tone: store.resultTone,
        provider: store.resultProvider,
        platforms: store.resultPlatforms,
        headline: store.result.headline,
        tagline: store.result.tagline,
        adCopy: store.result.adCopy,
        callToAction: store.result.callToAction,
        targetAudience: store.result.targetAudience,
        keyBenefits: store.result.keyBenefits,
        platformVersions: store.result.platformVersions,
        status: "completed",
      });
      toast.success("Campaign saved to dashboard!");
    } catch (err: any) {
      toast.error(err.message || "Failed to save campaign");
    }
  }, [store.result, store.resultProductName, store.resultTone, store.resultProvider, store.resultPlatforms, store.productDesc, createCampaign]);

  // ── Export functions ──────────────────────────────────────────
  const handleExport = useCallback(
    (format: string) => {
      if (!store.result) return;
      const r = store.result;
      let content = "";
      const name = store.resultProductName;

      if (format === "markdown") {
        content = `# ${name} — Ad Campaign\n\n## Headline\n${r.headline}\n\n## Tagline\n${r.tagline}\n\n## Ad Copy\n${r.adCopy}\n\n## Call to Action\n${r.callToAction}\n\n## Target Audience\n${r.targetAudience}\n\n## Key Benefits\n${r.keyBenefits}\n\n## Platform Adaptations\n${r.platformVersions}\n`;
      } else if (format === "txt") {
        content = `${name} — Ad Campaign\n${"=".repeat(40)}\n\nHeadline: ${r.headline}\nTagline: ${r.tagline}\nAd Copy: ${r.adCopy}\nCall to Action: ${r.callToAction}\nTarget Audience: ${r.targetAudience}\nKey Benefits: ${r.keyBenefits}\nPlatform Adaptations: ${r.platformVersions}\n`;
      } else if (format === "json") {
        content = JSON.stringify(r, null, 2);
      } else if (format === "pdf") {
        // For PDF, we create a printable HTML and trigger print
        const printWindow = window.open("", "_blank");
        if (printWindow) {
          printWindow.document.write(`<html><head><title>${name} — Ad Campaign</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:0 20px;color:#1a1814}h1{color:#c8602a;border-bottom:2px solid #c8602a;padding-bottom:8px}h2{color:#4a4640;margin-top:24px}p,.copy{line-height:1.6;white-space:pre-wrap}</style></head><body>`);
          printWindow.document.write(`<h1>${name}</h1>`);
          printWindow.document.write(`<h2>Headline</h2><p>${r.headline}</p>`);
          printWindow.document.write(`<h2>Tagline</h2><p><em>${r.tagline}</em></p>`);
          printWindow.document.write(`<h2>Ad Copy</h2><p>${r.adCopy}</p>`);
          printWindow.document.write(`<h2>Call to Action</h2><p style="color:#c8602a;font-weight:600">${r.callToAction}</p>`);
          printWindow.document.write(`<h2>Target Audience</h2><p>${r.targetAudience}</p>`);
          printWindow.document.write(`<h2>Key Benefits</h2><p>${r.keyBenefits}</p>`);
          printWindow.document.write(`<h2>Platform Adaptations</h2><p>${r.platformVersions}</p>`);
          printWindow.document.write(`</body></html>`);
          printWindow.document.close();
          printWindow.print();
        }
        return;
      }

      if (content) {
        const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name.replace(/\s+/g, "-").toLowerCase()}-campaign.${format === "markdown" ? "md" : format}`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    },
    [store.result, store.resultProductName]
  );

  // ── Copy All ──────────────────────────────────────────────────
  const handleCopyAll = useCallback(() => {
    if (!store.result) return;
    const r = store.result;
    const text = `Headline: ${r.headline}\nTagline: ${r.tagline}\nAd Copy: ${r.adCopy}\nCall to Action: ${r.callToAction}\nTarget Audience: ${r.targetAudience}\nKey Benefits: ${r.keyBenefits}\nPlatform Adaptations: ${r.platformVersions}`;
    copyToClipboard(text, "Campaign");
  }, [store.result]);

  // ── Creativity label ──────────────────────────────────────────
  const creativityLabel = useMemo(() => {
    if (store.creativity <= 33) return "Conservative";
    if (store.creativity <= 66) return "Balanced";
    return "Creative";
  }, [store.creativity]);

  // ── Template options ──────────────────────────────────────────
  const templateOptions = useMemo(() => {
    const builtIn = Object.keys(TEMPLATE_PROMPTS).map((key) => ({
      id: key,
      name: formatTemplateKey(key),
      isBuiltIn: true,
    }));
    const custom = dbTemplates.map((t) => ({
      id: t.id,
      name: t.name,
      isBuiltIn: false,
    }));
    return [...builtIn, ...custom];
  }, [dbTemplates]);

  return (
    <div className="lg:grid lg:grid-cols-[440px_1fr] lg:gap-6">
      {/* ── LEFT PANEL: Campaign Brief ── */}
      <div className="lg:sticky lg:top-[57px] lg:self-start lg:max-h-[calc(100vh-57px)] lg:overflow-y-auto custom-scrollbar pb-6 lg:pb-0">
        <Card className="border-0 rounded-lg overflow-hidden">
          {/* Dark header */}
          <div className="bg-ink text-white px-5 py-3.5">
            <h2 className="font-serif text-lg font-semibold tracking-tight">Campaign Brief</h2>
            <p className="text-white/60 text-xs mt-0.5">Define your campaign parameters</p>
          </div>

          <div className="p-5 space-y-5">
            {/* 1. AI Provider */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                AI Provider
                <span className="ml-1.5 text-[9px] font-normal text-ink-muted">(Pre-configured on server — always ready)</span>
              </Label>
              <div className="flex gap-2">
                {ALL_PROVIDERS.map((p) => {
                  const serverInfo = availableProviders.find((ap) => ap.id === p.id);
                  const isAvailable = serverInfo?.available ?? false;
                  const modelName = serverInfo?.model || p.model;
                  return (
                    <button
                      key={p.id}
                      onClick={() => isAvailable && store.setProvider(p.id)}
                      disabled={!isAvailable}
                      className={`relative flex-1 px-3 py-2.5 rounded-md text-sm font-medium transition-all border ${
                        store.provider === p.id
                          ? "bg-ink text-white border-ink shadow-sm"
                          : isAvailable
                          ? "bg-white text-ink-soft border-border hover:border-ink/30 hover:shadow-sm"
                          : "bg-white/50 text-ink-muted/40 border-border/50 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? "bg-status-green" : "bg-ink-muted/30"}`} />
                        {p.label}
                      </span>
                      <span className={`block text-[10px] mt-0.5 ${store.provider === p.id ? "text-white/60" : "text-ink-muted"}`}>
                        {modelName}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-muted mt-2 leading-relaxed">
                {PROVIDER_DESCRIPTIONS[store.provider]}
              </p>
              {!providersLoaded && (
                <p className="text-[10px] text-ink-muted mt-1">Checking provider availability...</p>
              )}
            </div>

            <Separator />

            {/* 2. Template */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Template
              </Label>
              <Select value={store.templateId} onValueChange={(v) => store.setTemplateId(v === "__none__" ? "" : v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a template..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No template</SelectItem>
                  {templateOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name} {t.isBuiltIn ? "(Built-in)" : "(Custom)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 3. Brand Kit */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Brand Kit
              </Label>
              <Select
                value={store.selectedBrandKitId}
                onValueChange={(v) => {
                  store.setSelectedBrandKitId(v === "__none__" ? "" : v);
                  if (v !== "__none__") {
                    const kit = brandKits.find((k) => k.id === v);
                    if (kit) store.setBrandVoice(kit.brandVoice);
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a brand kit..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">No brand kit</SelectItem>
                  {brandKits.map((kit) => (
                    <SelectItem key={kit.id} value={kit.id}>
                      {kit.name} — {kit.brandName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* 4. Product Name */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Product Name <span className="text-status-red">*</span>
              </Label>
              <Input
                placeholder="e.g. AdForge Pro"
                value={store.productName}
                onChange={(e) => store.setProductName(e.target.value)}
              />
            </div>

            {/* 5. Product Description */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Product Description <span className="text-status-red">*</span>
              </Label>
              <div className="relative">
                <Textarea
                  placeholder="Describe your product or service in detail..."
                  value={store.productDesc}
                  onChange={(e) => store.setProductDesc(e.target.value)}
                  rows={4}
                  className="pr-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleEnhance}
                  disabled={enhancing || !store.productName || !store.productDesc}
                  className="absolute top-2 right-2 text-terracotta hover:text-terracotta-dark text-xs h-7 px-2"
                >
                  {enhancing ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <Wand2 className="w-3 h-3 mr-1" />
                  )}
                  Enhance
                </Button>
              </div>
            </div>

            <Separator />

            {/* 6. Campaign Tone */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Campaign Tone
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => store.setTone(t)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      store.tone === t
                        ? "border-terracotta bg-terracotta-light text-terracotta-dark"
                        : "border-border bg-white text-ink-soft hover:border-ink/20"
                    }`}
                  >
                    {capitalizeFirst(t)}
                  </button>
                ))}
              </div>
              {TONE_PREVIEWS[store.tone] && (
                <div className="mt-2.5 p-3 border border-border rounded-md bg-cream/50">
                  <p className="text-xs italic text-ink-muted leading-relaxed">
                    &ldquo;{TONE_PREVIEWS[store.tone]}&rdquo;
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* 7. Target Platforms */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Target Platforms
              </Label>
              <div className="grid grid-cols-3 gap-1.5">
                {PLATFORMS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => store.togglePlatform(p.id)}
                    className={`px-2 py-1.5 rounded-md text-xs font-medium transition-all border ${
                      store.platforms.includes(p.id)
                        ? "bg-ink text-white border-ink"
                        : "border-border bg-white text-ink-soft hover:border-ink/20"
                    }`}
                  >
                    {p.emoji} {p.label}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* 8. Target Audience */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Target Audience
              </Label>
              <Input
                placeholder="e.g. Young professionals aged 25-40"
                value={store.audience}
                onChange={(e) => store.setAudience(e.target.value)}
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AUDIENCE_PRESETS.slice(0, 4).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => store.setAudience(preset)}
                    className="px-2.5 py-1 text-[10px] font-medium rounded-full border border-border bg-white text-ink-soft hover:border-terracotta hover:text-terracotta transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            {/* 9. Language */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Language
              </Label>
              <Select value={store.language} onValueChange={(v) => store.setLanguage(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(LANGUAGE_MAP).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 10. Creativity Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                  Creativity Level
                </Label>
                <Badge variant="secondary" className="text-[10px] font-bold">
                  {store.creativity} — {creativityLabel}
                </Badge>
              </div>
              <Slider
                value={[store.creativity]}
                onValueChange={([v]) => store.setCreativity(v)}
                min={0}
                max={100}
                step={1}
                className="w-full"
              />
            </div>

            {/* 11. Additional Instructions */}
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-2 block">
                Additional Instructions
              </Label>
              <Textarea
                placeholder="Any specific requirements or preferences..."
                value={store.additionalInstructions}
                onChange={(e) => store.setAdditionalInstructions(e.target.value)}
                rows={2}
              />
            </div>

            {/* Error */}
            {store.error && (
              <div className="p-3 bg-red-50 border border-status-red/20 rounded-md text-status-red text-sm">
                {store.error}
              </div>
            )}

            {/* 12. Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={store.loading}
              className="w-full bg-terracotta hover:bg-terracotta-dark text-white font-semibold py-3 pulse-glow"
              size="lg"
            >
              {store.loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating with {capitalizeFirst(store.provider)}...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Campaign
                </>
              )}
            </Button>
          </div>
        </Card>
      </div>

      {/* ── RIGHT PANEL: Results ── */}
      <div className="min-w-0">
        {/* Empty State */}
        {!store.result && !store.loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center border-2 border-dashed border-terracotta/20 rounded-xl p-12 max-w-md bg-white/50"
            >
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="inline-block mb-4"
              >
                <Sparkles className="w-12 h-12 text-terracotta/60" />
              </motion.div>
              <h3 className="font-serif text-xl font-semibold text-ink mb-2">Your campaign awaits</h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-4">
                Fill in the campaign brief on the left and hit <strong className="text-terracotta">Generate</strong> to create your AI-powered ad campaign.
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Headline", "Tagline", "Ad Copy", "CTA", "Audience", "Benefits", "Platforms"].map((label, i) => (
                  <motion.span
                    key={label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * i, duration: 0.3 }}
                    className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-terracotta-light text-terracotta-dark border border-terracotta/10"
                  >
                    {label}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {store.loading && !store.result && (
          <div className="space-y-4">
            {/* Animated loading header */}
            <div className="flex items-center gap-3 p-4 bg-white border border-border rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-terracotta" />
              <span className="font-serif font-semibold text-ink">Generating with {capitalizeFirst(store.provider)}...</span>
              <Badge variant="outline" className="text-[10px] border-terracotta text-terracotta ml-auto animate-pulse">
                AI Working
              </Badge>
            </div>
            {/* Skeleton cards with staggered shimmer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * i }}
                  className={i === 0 || i === 6 ? "lg:col-span-2" : ""}
                >
                  <Card className="p-5">
                    <Skeleton className="h-4 w-24 mb-3" />
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-full skeleton-shimmer" />
                      <Skeleton className="h-5 w-3/4 skeleton-shimmer" />
                      {i === 0 && <Skeleton className="h-5 w-1/2 skeleton-shimmer" />}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Result State */}
        {store.result && (
          <div className="space-y-4">
            {/* Result Header Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 p-4 bg-white border border-border rounded-lg flex-wrap"
            >
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-2.5 h-2.5 rounded-full bg-status-green"
              />
              <span className="font-serif font-semibold text-ink">{store.resultProductName}</span>
              <span className="text-ink-muted text-sm">Generated</span>
              <Badge variant="outline" className="text-xs border-terracotta text-terracotta">
                {capitalizeFirst(store.resultTone)}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {capitalizeFirst(store.resultProvider)}
              </Badge>
              <div className="ml-auto flex items-center gap-1.5">
                <Button variant="ghost" size="sm" onClick={handleCopyAll} className="text-xs h-7 px-2">
                  <Copy className="w-3 h-3 mr-1" /> Copy All
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExport("markdown")} className="text-xs h-7 px-2">
                  Markdown
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExport("txt")} className="text-xs h-7 px-2">
                  TXT
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExport("pdf")} className="text-xs h-7 px-2">
                  PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleExport("json")} className="text-xs h-7 px-2">
                  JSON
                </Button>
              </div>
            </motion.div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* HEADLINE + TAGLINE combined card */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="lg:col-span-2"
              >
                <Card className="border-l-4 border-l-terracotta hover:shadow-md transition-shadow">
                  <div className="p-5">
                    {/* Headline */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {SECTION_ICONS.headline}
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">Headline</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <WordCountIndicator text={store.result.headline} ideal={WORD_COUNT_IDEALS.headline} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate("headline")}
                          disabled={store.regenerating === "headline"}
                          className="h-6 w-6 p-0"
                        >
                          {store.regenerating === "headline" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.result!.headline, "Headline")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="font-serif text-[22px] leading-snug text-ink">{store.result.headline}</p>

                    <Separator className="my-4" />

                    {/* Tagline */}
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {SECTION_ICONS.tagline}
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">Tagline</Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <WordCountIndicator text={store.result.tagline} ideal={WORD_COUNT_IDEALS.tagline} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate("tagline")}
                          disabled={store.regenerating === "tagline"}
                          className="h-6 w-6 p-0"
                        >
                          {store.regenerating === "tagline" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.result!.tagline, "Tagline")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="italic text-ink-soft leading-relaxed">{store.result.tagline}</p>

                    {/* Platform tags */}
                    <div className="flex flex-wrap gap-1.5 mt-4">
                      {store.resultPlatforms.map((pId) => {
                        const platform = PLATFORMS.find((p) => p.id === pId);
                        return platform ? (
                          <Badge key={pId} variant="secondary" className="text-[10px]">
                            {platform.emoji} {platform.label}
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* AD COPY */}
              <ResultCard
                sectionKey="adCopy"
                result={store.result}
                regenerating={store.regenerating}
                onRegenerate={handleRegenerate}
                delay={0.1}
              />

              {/* CALL TO ACTION */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                <Card className="hover:shadow-md transition-shadow h-full">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {SECTION_ICONS.callToAction}
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                          Call to Action
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <WordCountIndicator text={store.result.callToAction} ideal={WORD_COUNT_IDEALS.callToAction} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate("callToAction")}
                          disabled={store.regenerating === "callToAction"}
                          className="h-6 w-6 p-0"
                        >
                          {store.regenerating === "callToAction" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.result!.callToAction, "CTA")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-terracotta font-semibold text-lg">{store.result.callToAction}</p>
                  </div>
                </Card>
              </motion.div>

              {/* TARGET AUDIENCE */}
              <ResultCard
                sectionKey="targetAudience"
                result={store.result}
                regenerating={store.regenerating}
                onRegenerate={handleRegenerate}
                delay={0.2}
              />

              {/* KEY BENEFITS */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
              >
                <Card className="hover:shadow-md transition-shadow h-full">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {SECTION_ICONS.keyBenefits}
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                          Key Benefits
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <WordCountIndicator text={store.result.keyBenefits} ideal={WORD_COUNT_IDEALS.keyBenefits} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate("keyBenefits")}
                          disabled={store.regenerating === "keyBenefits"}
                          className="h-6 w-6 p-0"
                        >
                          {store.regenerating === "keyBenefits" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.result!.keyBenefits, "Key Benefits")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-ink-soft leading-relaxed">
                      {store.result.keyBenefits.split("\n").map((line, i) => (
                        <div key={i} className="flex items-start gap-2 py-0.5">
                          {line.trim().startsWith("\u2022") ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-terracotta mt-0.5 shrink-0" />
                              <span>{line.replace(/^\s*\u2022\s*/, "")}</span>
                            </>
                          ) : (
                            <span>{line}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* PLATFORM ADAPTATIONS — full width */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="lg:col-span-2"
              >
                <Card className="hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        {SECTION_ICONS.platformVersions}
                        <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                          Platform Adaptations
                        </Label>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <WordCountIndicator
                          text={store.result.platformVersions}
                          ideal={WORD_COUNT_IDEALS.platformVersions}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRegenerate("platformVersions")}
                          disabled={store.regenerating === "platformVersions"}
                          className="h-6 w-6 p-0"
                        >
                          {store.regenerating === "platformVersions" ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3 h-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(store.result!.platformVersions, "Platform Adaptations")}
                          className="h-6 w-6 p-0"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-ink-soft leading-relaxed whitespace-pre-wrap">
                      {store.result.platformVersions}
                    </p>
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Save to Dashboard */}
            <div className="flex justify-center pt-2">
              <Button
                onClick={handleSave}
                disabled={createCampaign.isPending}
                className="bg-ink hover:bg-ink-soft text-white px-8"
                size="lg"
              >
                {createCampaign.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Download className="w-4 h-4 mr-2" />
                )}
                Save to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Result Card (reusable for simple sections) ──────────────────────

function ResultCard({
  sectionKey,
  result,
  regenerating,
  onRegenerate,
  delay = 0,
}: {
  sectionKey: string;
  result: Record<string, string>;
  regenerating: string | null;
  onRegenerate: (key: string) => void;
  delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="hover:shadow-md transition-shadow h-full">
        <div className="p-5">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              {SECTION_ICONS[sectionKey]}
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft">
                {SECTION_LABELS[sectionKey]}
              </Label>
            </div>
            <div className="flex items-center gap-1.5">
              <WordCountIndicator text={result[sectionKey]} ideal={WORD_COUNT_IDEALS[sectionKey]} />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRegenerate(sectionKey)}
                disabled={regenerating === sectionKey}
                className="h-6 w-6 p-0"
              >
                {regenerating === sectionKey ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(result[sectionKey], SECTION_LABELS[sectionKey])}
                className="h-6 w-6 p-0"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <p className="text-sm text-ink-soft leading-relaxed">{result[sectionKey]}</p>
        </div>
      </Card>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 2: CAMPAIGNS TAB
// ═══════════════════════════════════════════════════════════════════════

function CampaignsTab() {
  const [search, setSearch] = useState("");
  const [toneFilter, setToneFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);
  const deleteCampaign = useDeleteCampaign();
  const toggleFavorite = useToggleFavorite();
  const duplicateCampaign = useDuplicateCampaign();
  const rateCampaign = useRateCampaign();

  const { data, isLoading } = useCampaigns({
    page,
    limit: 9,
    search: debouncedSearch || undefined,
    tone: toneFilter || undefined,
    provider: providerFilter || undefined,
    status: statusFilter || undefined,
  });

  const campaigns = data?.campaigns ?? [];
  const pagination = data?.pagination;

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <Input
            placeholder="Search campaigns..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <Select value={toneFilter} onValueChange={(v) => { setToneFilter(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Tones" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Tones</SelectItem>
            {TONES.map((t) => (
              <SelectItem key={t} value={t}>{capitalizeFirst(t)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={providerFilter} onValueChange={(v) => { setProviderFilter(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Providers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Providers</SelectItem>
            {ALL_PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === "__all__" ? "" : v); setPage(1); }}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All Status</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaign Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <FolderOpen className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <h3 className="font-serif text-lg font-semibold text-ink">No campaigns yet</h3>
          <p className="text-sm text-ink-muted mt-1">Generate your first campaign!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-serif font-semibold text-ink line-clamp-1">{c.productName}</h3>
                  <button
                    onClick={() => toggleFavorite.mutate(c.id)}
                    className="shrink-0 ml-2 text-ink-muted hover:text-terracotta transition-colors"
                  >
                    {c.isFavorite ? (
                      <Star className="w-4 h-4 fill-terracotta text-terracotta" />
                    ) : (
                      <Star className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <Badge variant="outline" className="text-[10px] border-terracotta text-terracotta">
                    {capitalizeFirst(c.tone)}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {capitalizeFirst(c.provider)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${
                      c.status === "completed"
                        ? "border-status-green text-status-green"
                        : c.status === "draft"
                        ? "border-status-orange text-status-orange"
                        : "border-ink-muted text-ink-muted"
                    }`}
                  >
                    {capitalizeFirst(c.status)}
                  </Badge>
                </div>
                <p className="text-xs text-ink-muted mb-3">{formatDate(c.createdAt)}</p>

                {/* Rating stars */}
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => rateCampaign.mutate({ id: c.id, rating: star })}
                      className="text-ink-muted hover:text-terracotta transition-colors"
                    >
                      <Star
                        className={`w-3.5 h-3.5 ${
                          c.rating && star <= c.rating ? "fill-terracotta text-terracotta" : ""
                        }`}
                      />
                    </button>
                  ))}
                </div>

                {/* Expanded content */}
                {expandedId === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mb-3 space-y-2 border-t border-border pt-3"
                  >
                    {c.headline && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted">Headline</span>
                        <p className="text-sm font-serif text-ink">{c.headline}</p>
                      </div>
                    )}
                    {c.tagline && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted">Tagline</span>
                        <p className="text-sm italic text-ink-soft">{c.tagline}</p>
                      </div>
                    )}
                    {c.callToAction && (
                      <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-ink-muted">CTA</span>
                        <p className="text-sm text-terracotta font-semibold">{c.callToAction}</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                    className="text-xs h-7 px-2"
                  >
                    {expandedId === c.id ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {expandedId === c.id ? "Hide" : "View"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateCampaign.mutate(c.id)}
                    disabled={duplicateCampaign.isPending}
                    className="text-xs h-7 px-2"
                  >
                    <CopyPlus className="w-3 h-3 mr-1" /> Duplicate
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteCampaign.mutate(c.id, {
                        onSuccess: () => toast.success("Campaign deleted"),
                      });
                    }}
                    className="text-xs h-7 px-2 text-status-red hover:text-status-red"
                  >
                    <Trash2 className="w-3 h-3 mr-1" /> Delete
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </Button>
          <span className="text-sm text-ink-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 3: TEMPLATES TAB
// ═══════════════════════════════════════════════════════════════════════

function TemplatesTab({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState("Product");
  const [newPrompt, setNewPrompt] = useState("");
  const [newTone, setNewTone] = useState("professional");

  const createTemplate = useCreateTemplate();
  const store = useCampaignStore();
  const { data, isLoading } = useTemplates();

  const dbTemplates = data?.templates ?? [];

  // Merge built-in and custom templates
  const allTemplates = useMemo(() => {
    const builtIn = Object.entries(TEMPLATE_PROMPTS).map(([key, prompt]) => ({
      id: key,
      name: formatTemplateKey(key),
      description: prompt.slice(0, 100) + "...",
      category: TEMPLATE_CATEGORY_MAP[key] || "Product",
      promptTemplate: prompt,
      tone: "professional",
      isPublic: true,
      usageCount: 0,
      createdAt: "",
      updatedAt: "",
      isBuiltIn: true as const,
    }));
    const custom = dbTemplates.map((t) => ({ ...t, isBuiltIn: false as const }));
    return [...builtIn, ...custom];
  }, [dbTemplates]);

  const filtered = useMemo(() => {
    if (categoryFilter === "All") return allTemplates;
    return allTemplates.filter((t) => t.category === categoryFilter);
  }, [allTemplates, categoryFilter]);

  const handleUseTemplate = useCallback(
    (t: (typeof allTemplates)[number]) => {
      store.setTemplateId(t.id);
      if (t.tone) store.setTone(t.tone);
      toast.success(`Template "${t.name}" applied`);
      onSwitchTab("generate");
    },
    [store, onSwitchTab]
  );

  const handleCreate = useCallback(async () => {
    if (!newName || !newDesc || !newPrompt) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: newName,
        description: newDesc,
        category: newCategory,
        promptTemplate: newPrompt,
        tone: newTone,
        isPublic: true,
      });
      toast.success("Template created!");
      setCreateOpen(false);
      setNewName("");
      setNewDesc("");
      setNewCategory("Product");
      setNewPrompt("");
      setNewTone("professional");
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    }
  }, [newName, newDesc, newCategory, newPrompt, newTone, createTemplate]);

  return (
    <div className="space-y-4">
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                categoryFilter === cat
                  ? "bg-terracotta text-white border-terracotta"
                  : "bg-white text-ink-soft border-border hover:border-terracotta/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-ink hover:bg-ink-soft text-white">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Template
        </Button>
      </div>

      {/* Template Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <LayoutTemplate className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <h3 className="font-serif text-lg font-semibold text-ink">No templates found</h3>
          <p className="text-sm text-ink-muted mt-1">Try a different category or create your own template.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 hover:shadow-md transition-shadow flex flex-col">
                <h3 className="font-serif font-semibold text-ink mb-1.5">{t.name}</h3>
                <p className="text-sm text-ink-soft leading-relaxed mb-3 line-clamp-2 flex-1">{t.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="outline" className="text-[10px]">
                    {t.category}
                  </Badge>
                  <Badge variant="outline" className="text-[10px] border-terracotta text-terracotta">
                    {capitalizeFirst(t.tone)}
                  </Badge>
                  {!t.isBuiltIn && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t.usageCount} uses
                    </Badge>
                  )}
                </div>
                <Button
                  onClick={() => handleUseTemplate(t)}
                  variant="outline"
                  size="sm"
                  className="w-full border-terracotta text-terracotta hover:bg-terracotta hover:text-white"
                >
                  Use Template
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Template Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Create Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Template name" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Description</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Brief description" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Category</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATE_CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Prompt Template</Label>
              <Textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Enter the prompt instructions for this template..."
                rows={4}
              />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Default Tone</Label>
              <Select value={newTone} onValueChange={setNewTone}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONES.map((t) => (
                    <SelectItem key={t} value={t}>{capitalizeFirst(t)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createTemplate.isPending}
              className="bg-terracotta hover:bg-terracotta-dark text-white"
            >
              {createTemplate.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 4: BRAND KITS TAB
// ═══════════════════════════════════════════════════════════════════════

function BrandKitsTab({ onSwitchTab }: { onSwitchTab: (tab: TabId) => void }) {
  const [createOpen, setCreateOpen] = useState(false);

  // Form state
  const [newName, setNewName] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandVoice, setNewBrandVoice] = useState("");
  const [newPrimaryColor, setNewPrimaryColor] = useState("#c8602a");
  const [newSecondaryColor, setNewSecondaryColor] = useState("#1a1814");
  const [newGuidelines, setNewGuidelines] = useState("");

  const createBrandKit = useCreateBrandKit();
  const deleteBrandKit = useDeleteBrandKit();
  const store = useCampaignStore();
  const { data, isLoading } = useBrandKits();

  const brandKits = data?.brandKits ?? [];

  const handleUseInCampaign = useCallback(
    (kit: (typeof brandKits)[number]) => {
      store.setSelectedBrandKitId(kit.id);
      store.setBrandVoice(kit.brandVoice);
      toast.success(`Brand kit "${kit.name}" applied`);
      onSwitchTab("generate");
    },
    [store, onSwitchTab]
  );

  const handleCreate = useCallback(async () => {
    if (!newName || !newBrandName || !newBrandVoice) {
      toast.error("Please fill in all required fields");
      return;
    }
    try {
      await createBrandKit.mutateAsync({
        name: newName,
        brandName: newBrandName,
        brandVoice: newBrandVoice,
        primaryColor: newPrimaryColor,
        secondaryColor: newSecondaryColor,
        guidelines: newGuidelines || undefined,
      });
      toast.success("Brand kit created!");
      setCreateOpen(false);
      setNewName("");
      setNewBrandName("");
      setNewBrandVoice("");
      setNewPrimaryColor("#c8602a");
      setNewSecondaryColor("#1a1814");
      setNewGuidelines("");
    } catch (err: any) {
      toast.error(err.message || "Failed to create brand kit");
    }
  }, [newName, newBrandName, newBrandVoice, newPrimaryColor, newSecondaryColor, newGuidelines, createBrandKit]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl font-semibold text-ink">Brand Kits</h2>
        <Button onClick={() => setCreateOpen(true)} size="sm" className="bg-ink hover:bg-ink-soft text-white">
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Brand Kit
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-5 w-3/4 mb-3" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-4 w-full" />
            </Card>
          ))}
        </div>
      ) : brandKits.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
          <Palette className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <h3 className="font-serif text-lg font-semibold text-ink">No brand kits yet</h3>
          <p className="text-sm text-ink-muted mt-1">Create your first brand kit to maintain consistent brand voice.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brandKits.map((kit) => (
            <motion.div
              key={kit.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="p-5 hover:shadow-md transition-shadow">
                <h3 className="font-serif font-semibold text-ink mb-0.5">{kit.name}</h3>
                <p className="text-xs text-terracotta font-medium mb-2">{kit.brandName}</p>
                <p className="text-sm text-ink-soft line-clamp-2 leading-relaxed mb-3">
                  {kit.brandVoice}
                </p>
                <div className="flex items-center gap-2 mb-3">
                  {kit.primaryColor && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: kit.primaryColor }}
                      />
                      <span className="text-[10px] text-ink-muted">{kit.primaryColor}</span>
                    </div>
                  )}
                  {kit.secondaryColor && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded-full border border-border"
                        style={{ backgroundColor: kit.secondaryColor }}
                      />
                      <span className="text-[10px] text-ink-muted">{kit.secondaryColor}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleUseInCampaign(kit)}
                    variant="outline"
                    size="sm"
                    className="flex-1 border-terracotta text-terracotta hover:bg-terracotta hover:text-white text-xs"
                  >
                    Use in Campaign
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      deleteBrandKit.mutate(kit.id, {
                        onSuccess: () => toast.success("Brand kit deleted"),
                      });
                    }}
                    className="text-status-red hover:text-status-red h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Brand Kit Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Create Brand Kit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Kit Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Main Brand Kit" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Brand Name</Label>
              <Input value={newBrandName} onChange={(e) => setNewBrandName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Brand Voice</Label>
              <Textarea
                value={newBrandVoice}
                onChange={(e) => setNewBrandVoice(e.target.value)}
                placeholder="Describe the brand voice and tone..."
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newPrimaryColor}
                    onChange={(e) => setNewPrimaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input value={newPrimaryColor} onChange={(e) => setNewPrimaryColor(e.target.value)} className="flex-1" />
                </div>
              </div>
              <div>
                <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={newSecondaryColor}
                    onChange={(e) => setNewSecondaryColor(e.target.value)}
                    className="w-8 h-8 rounded border border-border cursor-pointer"
                  />
                  <Input value={newSecondaryColor} onChange={(e) => setNewSecondaryColor(e.target.value)} className="flex-1" />
                </div>
              </div>
            </div>
            <div>
              <Label className="text-[11px] uppercase tracking-wider font-bold text-ink-soft mb-1.5 block">Guidelines</Label>
              <Textarea
                value={newGuidelines}
                onChange={(e) => setNewGuidelines(e.target.value)}
                placeholder="Brand guidelines, do's and don'ts..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={createBrandKit.isPending}
              className="bg-terracotta hover:bg-terracotta-dark text-white"
            >
              {createBrandKit.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// TAB 5: ANALYTICS TAB
// ═══════════════════════════════════════════════════════════════════════

function AnalyticsTab() {
  const { data, isLoading } = useAnalytics();
  const campaignsQuery = useCampaigns({ limit: 5, sortBy: "createdAt", sortOrder: "desc" });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-5">
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-8 w-16" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const overview = data?.overview;
  const providerDist = data?.providerDistribution ?? [];
  const toneDist = data?.toneDistribution ?? [];
  const recentCampaigns = campaignsQuery.data?.campaigns ?? [];

  if (!overview || overview.totalCampaigns === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-border rounded-xl">
        <BarChart3 className="w-10 h-10 text-ink-muted mx-auto mb-3" />
        <h3 className="font-serif text-lg font-semibold text-ink">No data yet</h3>
        <p className="text-sm text-ink-muted mt-1">Generate your first campaign to see analytics!</p>
      </div>
    );
  }

  // Compute max for bar chart scaling
  const maxProviderCount = Math.max(...providerDist.map((p) => p.count), 1);
  const maxToneCount = Math.max(...toneDist.map((t) => t.count), 1);

  const providerColors: Record<string, string> = {
    gemini: "bg-terracotta",
    deepseek: "bg-ink",
    glm: "bg-status-green",
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <TrendingUp className="w-4 h-4 text-ink-muted" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">Total Campaigns</span>
          </div>
          <p className="font-serif text-3xl font-bold text-ink">{overview.totalCampaigns}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Calendar className="w-4 h-4 text-ink-muted" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">This Month</span>
          </div>
          <p className="font-serif text-3xl font-bold text-ink">{overview.completedCount}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Heart className="w-4 h-4 text-ink-muted" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">Favorites</span>
          </div>
          <p className="font-serif text-3xl font-bold text-ink">{overview.favoriteCount}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <Star className="w-4 h-4 text-ink-muted" />
            <span className="text-[11px] uppercase tracking-wider font-bold text-ink-muted">Avg Rating</span>
          </div>
          <p className="font-serif text-3xl font-bold text-ink">
            {overview.averageRating > 0 ? overview.averageRating.toFixed(1) : "—"}
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provider Distribution */}
        <Card className="p-5">
          <h3 className="font-serif font-semibold text-ink mb-4">Provider Distribution</h3>
          {providerDist.length === 0 ? (
            <p className="text-sm text-ink-muted">No data yet</p>
          ) : (
            <div className="space-y-3">
              {providerDist.map((item) => (
                <div key={item.provider}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-soft">{capitalizeFirst(item.provider)}</span>
                    <span className="text-sm font-bold text-ink">{item.count}</span>
                  </div>
                  <div className="w-full bg-border-soft rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full ${providerColors[item.provider] || "bg-terracotta"}`}
                      style={{ width: `${(item.count / maxProviderCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Tone Distribution */}
        <Card className="p-5">
          <h3 className="font-serif font-semibold text-ink mb-4">Tone Distribution</h3>
          {toneDist.length === 0 ? (
            <p className="text-sm text-ink-muted">No data yet</p>
          ) : (
            <div className="space-y-3">
              {toneDist.map((item) => (
                <div key={item.tone}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-ink-soft">{capitalizeFirst(item.tone)}</span>
                    <span className="text-sm font-bold text-ink">{item.count}</span>
                  </div>
                  <div className="w-full bg-border-soft rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-terracotta"
                      style={{ width: `${(item.count / maxToneCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-5">
        <h3 className="font-serif font-semibold text-ink mb-4">Recent Activity</h3>
        {recentCampaigns.length === 0 ? (
          <p className="text-sm text-ink-muted">No recent campaigns</p>
        ) : (
          <div className="space-y-3">
            {recentCampaigns.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-ink-muted w-20">{formatDate(c.createdAt)}</span>
                  <span className="text-sm font-medium text-ink">{c.productName}</span>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {capitalizeFirst(c.provider)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ═══════════════════════════════════════════════════════════════════════

export default function AdForgePage() {
  const [activeTab, setActiveTab] = useState<TabId>("generate");
  const showProgress = useCampaignStore((s) => s.showProgress);

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col bg-cream">
        {/* Progress bar */}
        <div className="progress-bar-container">
          {showProgress && <div className="progress-bar-fill indeterminate" />}
        </div>

        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center">
                <Layers className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight">
                <span className="text-ink">Ad</span>
                <span className="text-terracotta">Forge</span>
              </span>
            </div>

            {/* Desktop Tab Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {TAB_ITEMS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-terracotta text-white"
                      : "text-ink-soft hover:bg-border-soft"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right side: mobile select + badge */}
            <div className="flex items-center gap-3">
              <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabId)}>
                <SelectTrigger className="md:hidden w-[140px] h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAB_ITEMS.map((tab) => (
                    <SelectItem key={tab.id} value={tab.id}>
                      {tab.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider">
                AI Studio
              </Badge>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "generate" && <GenerateTab />}
              {activeTab === "campaigns" && <CampaignsTab />}
              {activeTab === "templates" && <TemplatesTab onSwitchTab={setActiveTab} />}
              {activeTab === "brand-kits" && <BrandKitsTab onSwitchTab={setActiveTab} />}
              {activeTab === "analytics" && <AnalyticsTab />}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Toaster */}
        <Toaster theme="light" position="bottom-right" richColors />
      </div>
    </TooltipProvider>
  );
}
