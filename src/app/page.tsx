"use client";

import { useState, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Sparkles,
  Layers,
  RefreshCw,
  Copy,
  Download,
  FileText,
  Printer,
  ArrowRight,
  Users,
  Star,
  LayoutGrid,
  Check,
  ChevronDown,
  Clock,
  Search,
  Heart,
  Eye,
  CopyPlus,
  Archive,
  Trash2,
  Plus,
  Pencil,
  X,
  Braces,
  Share2,
  Wand2,
  BarChart3,
  Palette,
  LayoutTemplate,
  Zap,
  Globe,
  Target,
  TrendingUp,
  Activity,
  Mail,
  Monitor,
} from "lucide-react";

import { useCampaignStore } from "@/stores/campaign-store";
import { useUIStore } from "@/stores/ui-store";
import { useCampaigns, useCreateCampaign, useDeleteCampaign, useToggleFavorite, useDuplicateCampaign } from "@/hooks/use-campaigns";
import { useTemplates, useCreateTemplate } from "@/hooks/use-templates";
import { useBrandKits, useCreateBrandKit, useDeleteBrandKit } from "@/hooks/use-brand-kits";
import { useAnalytics } from "@/hooks/use-analytics";
import { useDebounce } from "@/hooks/use-debounce";
import { TONE_MAP, TONE_PREVIEWS, LANGUAGE_MAP, PROVIDER_DESCRIPTIONS, TEMPLATE_PROMPTS } from "@/lib/prompt-templates";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

// ─── Constants ─────────────────────────────────────────────────

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "luxury", label: "Luxury" },
  { value: "casual", label: "Casual" },
  { value: "urgent", label: "Urgent" },
  { value: "humorous", label: "Humorous" },
  { value: "inspirational", label: "Inspirational" },
  { value: "playful", label: "Playful" },
  { value: "minimalist", label: "Minimalist" },
  { value: "bold", label: "Bold" },
  { value: "empathetic", label: "Empathetic" },
  { value: "technical", label: "Technical" },
  { value: "storytelling", label: "Storytelling" },
] as const;

const PLATFORMS = [
  { value: "instagram", label: "Instagram", icon: "📸" },
  { value: "facebook", label: "Facebook", icon: "👥" },
  { value: "twitter", label: "Twitter/X", icon: "🐦" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "tiktok", label: "TikTok", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "billboard", label: "Billboard", icon: "🏙️" },
  { value: "email", label: "Email", icon: "📧" },
  { value: "google-ads", label: "Google Ads", icon: "🔍" },
] as const;

const LANGUAGES = Object.entries(LANGUAGE_MAP).map(([code, name]) => ({ value: code, label: name }));

const PROVIDERS = [
  { value: "gemini", label: "Gemini" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "glm", label: "GLM" },
] as const;

const IDEAL_WORD_COUNTS: Record<string, number> = {
  headline: 12,
  tagline: 8,
  adCopy: 100,
  callToAction: 6,
  targetAudience: 60,
  keyBenefits: 60,
  platformVersions: 100,
};

const SECTION_CONFIG = [
  { key: "headline", label: "Headline", icon: Sparkles, full: true, accent: true },
  { key: "tagline", label: "Tagline", icon: Layers, full: false },
  { key: "adCopy", label: "Ad Copy", icon: FileText, full: false },
  { key: "callToAction", label: "Call to Action", icon: ArrowRight, full: false },
  { key: "targetAudience", label: "Target Audience", icon: Users, full: false },
  { key: "keyBenefits", label: "Key Benefits", icon: Star, full: false },
  { key: "platformVersions", label: "Platform Adaptations", icon: LayoutGrid, full: true },
] as const;

const AUDIENCE_PRESETS = [
  "Young professionals aged 25-35",
  "Parents of school-age children",
  "Tech-savvy millennials",
  "Health-conscious consumers",
  "Small business owners",
  "College students",
  "Luxury lifestyle enthusiasts",
  "Budget-conscious shoppers",
];

const TEMPLATE_CATEGORIES = [
  { value: "", label: "All Categories" },
  { value: "product", label: "Product" },
  { value: "service", label: "Service" },
  { value: "event", label: "Event" },
  { value: "saas", label: "SaaS" },
  { value: "ecommerce", label: "E-Commerce" },
];

type TabValue = "generate" | "campaigns" | "templates" | "brand-kits" | "analytics";

// ─── Helpers ───────────────────────────────────────────────────

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function getCountStatus(words: number, ideal: number) {
  if (words > ideal * 1.3) return { color: "bg-status-red", label: "Too long", textClass: "text-status-red" };
  if (words > ideal) return { color: "bg-status-orange", label: "Slightly over", textClass: "text-status-orange" };
  return { color: "bg-status-green", label: "Good", textClass: "text-status-green" };
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

// ─── Skeleton Card ─────────────────────────────────────────────

function SkeletonCard({ full = false, lines = 3 }: { full?: boolean; lines?: number }) {
  return (
    <div className={`bg-white border border-border rounded-lg overflow-hidden ${full ? "md:col-span-2" : ""}`}>
      <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
        <div className="skeleton-shimmer h-3 w-24 rounded-full" />
        <div className="skeleton-shimmer h-3 w-10 rounded-full" />
      </div>
      <div className="p-4 space-y-2.5">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton-shimmer h-3 rounded-full" style={{ width: `${70 - i * 15}%` }} />
        ))}
      </div>
    </div>
  );
}

// ─── Word Count Indicator ──────────────────────────────────────

function WordCountIndicator({ text, sectionKey }: { text: string; sectionKey: string }) {
  const ideal = IDEAL_WORD_COUNTS[sectionKey] || 50;
  const wc = countWords(text);
  const status = getCountStatus(wc, ideal);
  return (
    <div className="flex items-center gap-2 text-xs text-ink-muted">
      <div className={`w-2 h-2 rounded-full ${status.color}`} />
      <span className={`font-medium ${status.textClass}`}>{wc} words</span>
      <span className="opacity-60">(ideal: under {ideal})</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────

export default function Home() {
  // ── Stores ──
  const store = useCampaignStore();
  const uiStore = useUIStore();

  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState<TabValue>("generate");

  // ── Campaigns tab state ──
  const [campaignSearch, setCampaignSearch] = useState("");
  const [campaignToneFilter, setCampaignToneFilter] = useState("");
  const [campaignProviderFilter, setCampaignProviderFilter] = useState("");
  const [campaignStatusFilter, setCampaignStatusFilter] = useState("");
  const [campaignPage, setCampaignPage] = useState(1);
  const debouncedSearch = useDebounce(campaignSearch, 400);

  // ── Templates tab state ──
  const [templateCategory, setTemplateCategory] = useState("");
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDesc, setNewTemplateDesc] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("product");
  const [newTemplatePrompt, setNewTemplatePrompt] = useState("");
  const [newTemplateTone, setNewTemplateTone] = useState("professional");

  // ── Brand Kits tab state ──
  const [brandKitDialogOpen, setBrandKitDialogOpen] = useState(false);
  const [newBKName, setNewBKName] = useState("");
  const [newBKBrandName, setNewBKBrandName] = useState("");
  const [newBKBrandVoice, setNewBKBrandVoice] = useState("");
  const [newBKPrimaryColor, setNewBKPrimaryColor] = useState("#c8602a");
  const [newBKSecondaryColor, setNewBKSecondaryColor] = useState("#1a1814");
  const [newBKGuidelines, setNewBKGuidelines] = useState("");

  // ── Enhance description ──
  const [enhancingDesc, setEnhancingDesc] = useState(false);

  // ── Refs ──
  const outputRef = useRef<HTMLDivElement>(null);

  // ── Data Hooks ──
  const { data: campaignsData, isLoading: campaignsLoading } = useCampaigns({
    page: campaignPage,
    limit: 9,
    search: debouncedSearch || undefined,
    tone: campaignToneFilter || undefined,
    provider: campaignProviderFilter || undefined,
    status: campaignStatusFilter || undefined,
  });

  const { data: templatesData, isLoading: templatesLoading } = useTemplates(
    templateCategory ? { category: templateCategory } : undefined
  );

  const { data: brandKitsData, isLoading: brandKitsLoading } = useBrandKits();
  const { data: analyticsData, isLoading: analyticsLoading } = useAnalytics();

  // ── Mutations ──
  const createCampaign = useCreateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const toggleFavorite = useToggleFavorite();
  const duplicateCampaign = useDuplicateCampaign();
  const createTemplate = useCreateTemplate();
  const createBrandKit = useCreateBrandKit();
  const deleteBrandKit = useDeleteBrandKit();

  // ── Campaign list ──
  const campaigns = campaignsData?.campaigns || [];
  const campaignPagination = campaignsData?.pagination;
  const templates = templatesData?.templates || [];
  const brandKits = brandKitsData?.brandKits || [];

  // ── Generate Campaign ──
  const generateCampaign = useCallback(async () => {
    if (!store.productName.trim() || !store.productDesc.trim()) {
      toast.error("Please fill in both product name and description.");
      return;
    }
    if (store.platforms.length === 0) {
      toast.error("Select at least one target platform.");
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
          productName: store.productName.trim(),
          productDesc: store.productDesc.trim(),
          tone: store.tone,
          audience: store.audience.trim(),
          platforms: store.platforms,
          brandVoice: store.brandVoice.trim(),
          language: store.language,
          creativity: store.creativity,
          templateId: store.templateId || undefined,
          additionalInstructions: store.additionalInstructions.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      store.setResult(data.result);
      toast.success("Campaign generated successfully!");

      setTimeout(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      store.setError(msg);
      toast.error(msg);
    } finally {
      store.setLoading(false);
      store.setShowProgress(false);
    }
  }, [store]);

  // ── Regenerate Section ──
  const regenerateSection = useCallback(
    async (sectionKey: string) => {
      if (!store.result || !store.productName.trim() || !store.productDesc.trim()) return;
      store.setRegenerating(sectionKey);
      try {
        const res = await fetch("/api/regenerate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: store.provider,
            sectionKey,
            productName: store.productName.trim(),
            productDesc: store.productDesc.trim(),
            tone: store.tone,
            platforms: store.platforms,
            language: store.language,
            creativity: store.creativity,
            brandVoice: store.brandVoice.trim(),
            additionalInstructions: store.additionalInstructions.trim(),
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Regeneration failed");

        store.updateSection(sectionKey, data.text);
        toast.success(`${sectionKey.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())} regenerated!`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Regeneration failed.";
        toast.error(msg);
      } finally {
        store.setRegenerating(null);
      }
    },
    [store]
  );

  // ── AI Enhance Description ──
  const enhanceDescription = useCallback(async () => {
    if (!store.productName.trim() || !store.productDesc.trim()) {
      toast.error("Enter product name and description first.");
      return;
    }
    setEnhancingDesc(true);
    try {
      const res = await fetch("/api/enhance-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: store.provider,
          productName: store.productName.trim(),
          productDesc: store.productDesc.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Enhancement failed");
      store.setProductDesc(data.enhancedDesc);
      toast.success("Description enhanced!");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Enhancement failed.");
    } finally {
      setEnhancingDesc(false);
    }
  }, [store]);

  // ── Copy helpers ──
  const copyText = useCallback((text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(label ? `${label} copied!` : "Copied to clipboard!");
    });
  }, []);

  const copyAll = useCallback(() => {
    if (!store.result) return;
    const full = `HEADLINE\n${store.result.headline}\n\nTAGLINE\n${store.result.tagline}\n\nAD COPY\n${store.result.adCopy}\n\nCALL TO ACTION\n${store.result.callToAction}\n\nTARGET AUDIENCE\n${store.result.targetAudience}\n\nKEY BENEFITS\n${store.result.keyBenefits}\n\nPLATFORM ADAPTATIONS\n${store.result.platformVersions}`;
    copyText(full, "All content");
  }, [store.result, copyText]);

  // ── Export helpers ──
  const exportMarkdown = useCallback(() => {
    if (!store.result) return;
    const md = `# ${store.resultProductName} Campaign\n\n## Headline\n\n${store.result.headline}\n\n## Tagline\n\n${store.result.tagline}\n\n## Ad Copy\n\n${store.result.adCopy}\n\n## Call to Action\n\n${store.result.callToAction}\n\n## Target Audience\n\n${store.result.targetAudience}\n\n## Key Benefits\n\n${store.result.keyBenefits}\n\n## Platform Adaptations\n\n${store.result.platformVersions}\n`;
    copyText(md, "Markdown");
  }, [store.result, store.resultProductName, copyText]);

  const exportTXT = useCallback(() => {
    if (!store.result) return;
    const txt = `${store.resultProductName} Campaign\n${"=".repeat(40)}\n\nHEADLINE:\n${store.result.headline}\n\nTAGLINE:\n${store.result.tagline}\n\nAD COPY:\n${store.result.adCopy}\n\nCALL TO ACTION:\n${store.result.callToAction}\n\nTARGET AUDIENCE:\n${store.result.targetAudience}\n\nKEY BENEFITS:\n${store.result.keyBenefits}\n\nPLATFORM ADAPTATIONS:\n${store.result.platformVersions}\n`;
    const blob = new Blob([txt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${store.resultProductName.replace(/[^a-zA-Z0-9]/g, "_")}_campaign.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("TXT file downloaded!");
  }, [store.result, store.resultProductName]);

  const exportJSON = useCallback(() => {
    if (!store.result) return;
    const json = JSON.stringify(
      {
        productName: store.resultProductName,
        tone: store.resultTone,
        provider: store.resultProvider,
        platforms: store.resultPlatforms,
        ...store.result,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${store.resultProductName.replace(/[^a-zA-Z0-9]/g, "_")}_campaign.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("JSON file downloaded!");
  }, [store.result, store.resultProductName, store.resultTone, store.resultProvider, store.resultPlatforms]);

  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  const shareResult = useCallback(() => {
    if (!store.result) return;
    const shareText = `${store.result.headline}\n\n${store.result.tagline}\n\n${store.result.adCopy}\n\n${store.result.callToAction}`;
    if (navigator.share) {
      navigator.share({ title: `${store.resultProductName} Campaign`, text: shareText }).catch(() => {});
    } else {
      copyText(shareText, "Campaign content");
    }
  }, [store.result, store.resultProductName, copyText]);

  // ── Save to Dashboard ──
  const saveToDashboard = useCallback(async () => {
    if (!store.result) return;
    try {
      await createCampaign.mutateAsync({
        productName: store.resultProductName,
        productDesc: store.productDesc,
        tone: store.resultTone,
        audience: store.audience,
        platforms: store.resultPlatforms,
        provider: store.resultProvider,
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
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save campaign.");
    }
  }, [store.result, store.resultProductName, store.productDesc, store.resultTone, store.audience, store.resultPlatforms, store.resultProvider, createCampaign]);

  // ── Apply template ──
  const applyTemplate = useCallback(
    (templateId: string) => {
      store.setTemplateId(templateId);
      setActiveTab("generate");
      toast.success("Template applied! Fill in the brief to generate.");
    },
    [store]
  );

  // ── Apply brand kit ──
  const applyBrandKit = useCallback(
    (kit: { id: string; brandVoice: string; brandName: string }) => {
      store.setSelectedBrandKitId(kit.id);
      store.setBrandVoice(kit.brandVoice);
      setActiveTab("generate");
      toast.success(`${kit.brandName} brand kit applied!`);
    },
    [store]
  );

  // ── Create template handler ──
  const handleCreateTemplate = useCallback(async () => {
    if (!newTemplateName.trim() || !newTemplateDesc.trim() || !newTemplatePrompt.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createTemplate.mutateAsync({
        name: newTemplateName.trim(),
        description: newTemplateDesc.trim(),
        category: newTemplateCategory,
        promptTemplate: newTemplatePrompt.trim(),
        tone: newTemplateTone,
        isPublic: true,
      });
      toast.success("Template created!");
      setTemplateDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateDesc("");
      setNewTemplatePrompt("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create template.");
    }
  }, [newTemplateName, newTemplateDesc, newTemplatePrompt, newTemplateCategory, newTemplateTone, createTemplate]);

  // ── Create brand kit handler ──
  const handleCreateBrandKit = useCallback(async () => {
    if (!newBKName.trim() || !newBKBrandName.trim() || !newBKBrandVoice.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    try {
      await createBrandKit.mutateAsync({
        name: newBKName.trim(),
        brandName: newBKBrandName.trim(),
        brandVoice: newBKBrandVoice.trim(),
        primaryColor: newBKPrimaryColor,
        secondaryColor: newBKSecondaryColor,
        guidelines: newBKGuidelines.trim() || undefined,
      });
      toast.success("Brand kit created!");
      setBrandKitDialogOpen(false);
      setNewBKName("");
      setNewBKBrandName("");
      setNewBKBrandVoice("");
      setNewBKPrimaryColor("#c8602a");
      setNewBKSecondaryColor("#1a1814");
      setNewBKGuidelines("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create brand kit.");
    }
  }, [newBKName, newBKBrandName, newBKBrandVoice, newBKPrimaryColor, newBKSecondaryColor, newBKGuidelines, createBrandKit]);

  // ── Delete campaign handler ──
  const handleDeleteCampaign = useCallback(
    (id: string) => {
      deleteCampaign.mutate(id, {
        onSuccess: () => toast.success("Campaign deleted."),
        onError: (err) => toast.error(err.message),
      });
    },
    [deleteCampaign]
  );

  // ── Delete brand kit handler ──
  const handleDeleteBrandKit = useCallback(
    (id: string) => {
      deleteBrandKit.mutate(id, {
        onSuccess: () => toast.success("Brand kit deleted."),
        onError: (err) => toast.error(err.message),
      });
    },
    [deleteBrandKit]
  );

  // ── Analytics helpers ──
  const analytics = analyticsData;
  const maxProviderCount = useMemo(() => Math.max(...(analytics?.providerDistribution.map((p) => p.count) || [1]), 1), [analytics]);
  const maxToneCount = useMemo(() => Math.max(...(analytics?.toneDistribution.map((t) => t.count) || [1]), 1), [analytics]);

  // ────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      {/* Sonner Toaster */}
      <Toaster theme="light" position="top-right" richColors closeButton />

      {/* Progress Bar */}
      <div className="progress-bar-container">
        <div className={`progress-bar-fill ${store.showProgress ? "indeterminate" : ""}`} />
      </div>

      {/* Header */}
      <header className="app-header sticky top-0 z-50 bg-white border-b border-border shadow-sm">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-ink rounded-md flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="font-serif text-xl font-bold text-ink">
              Ad<span className="text-terracotta">Forge</span>
            </span>
          </div>

          {/* Nav Tabs (desktop) */}
          <nav className="hidden md:flex items-center gap-1">
            {([
              { value: "generate", label: "Generate", icon: Sparkles },
              { value: "campaigns", label: "Campaigns", icon: Archive },
              { value: "templates", label: "Templates", icon: LayoutTemplate },
              { value: "brand-kits", label: "Brand Kits", icon: Palette },
              { value: "analytics", label: "Analytics", icon: BarChart3 },
            ] as const).map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value as TabValue)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all ${
                  activeTab === tab.value
                    ? "bg-terracotta text-white"
                    : "text-ink-soft hover:bg-border-soft hover:text-ink"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Mobile nav dropdown */}
            <div className="md:hidden">
              <Select value={activeTab} onValueChange={(v) => setActiveTab(v as TabValue)}>
                <SelectTrigger className="h-8 w-[130px] text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate">Generate</SelectItem>
                  <SelectItem value="campaigns">Campaigns</SelectItem>
                  <SelectItem value="templates">Templates</SelectItem>
                  <SelectItem value="brand-kits">Brand Kits</SelectItem>
                  <SelectItem value="analytics">Analytics</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <span className="hidden sm:inline-flex text-[11px] font-semibold uppercase tracking-widest text-ink-muted bg-border-soft border border-border px-2.5 py-1 rounded-full">
              AI Studio
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 1: GENERATE */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "generate" && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 md:py-10"
            >
              <div className="grid lg:grid-cols-[440px_1fr] gap-6 lg:gap-8 items-start">
                {/* ── LEFT: Campaign Brief Form ── */}
                <aside className="form-panel-wrapper lg:sticky lg:top-[80px]">
                  <div className="bg-white border border-border rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-5 bg-ink">
                      <h2 className="font-serif text-lg font-semibold text-white mb-1">Campaign Brief</h2>
                      <p className="text-sm text-white/50 font-light">Fill in the details to generate your campaign</p>
                    </div>

                    <ScrollArea className="max-h-[calc(100vh-180px)]">
                      <div className="p-6 space-y-5">
                        {/* 1. AI Provider */}
                        <div className="bg-cream border border-border rounded-lg p-4 space-y-2.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-terracotta">
                            <Zap className="w-3 h-3" />
                            AI Provider
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {PROVIDERS.map((p) => (
                              <button
                                key={p.value}
                                onClick={() => store.setProvider(p.value)}
                                className={`px-3 py-2 rounded text-xs font-semibold transition-all border ${
                                  store.provider === p.value
                                    ? "border-ink bg-ink text-white"
                                    : "border-border bg-white text-ink-soft hover:border-ink-soft"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                          <p className="text-[11px] text-ink-muted leading-relaxed">
                            {PROVIDER_DESCRIPTIONS[store.provider] || "Select an AI provider"}
                          </p>
                        </div>

                        {/* 2. Template Selector */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Template
                          </Label>
                          <Select value={store.templateId} onValueChange={store.setTemplateId}>
                            <SelectTrigger className="w-full text-sm border-border bg-cream">
                              <SelectValue placeholder="No template (free-form)" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No template (free-form)</SelectItem>
                              {Object.entries(TEMPLATE_PROMPTS).map(([key]) => (
                                <SelectItem key={key} value={key}>
                                  {key.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                </SelectItem>
                              ))}
                              {templates.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 3. Brand Kit Selector */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Brand Kit
                          </Label>
                          <Select value={store.selectedBrandKitId} onValueChange={(id) => {
                            store.setSelectedBrandKitId(id);
                            const kit = brandKits.find((bk) => bk.id === id);
                            if (kit) store.setBrandVoice(kit.brandVoice);
                          }}>
                            <SelectTrigger className="w-full text-sm border-border bg-cream">
                              <SelectValue placeholder="No brand kit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No brand kit</SelectItem>
                              {brandKits.map((bk) => (
                                <SelectItem key={bk.id} value={bk.id}>
                                  {bk.brandName} — {bk.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 4. Product Name */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Product Name <span className="text-terracotta">*</span>
                          </Label>
                          <Input
                            value={store.productName}
                            onChange={(e) => store.setProductName(e.target.value)}
                            placeholder="e.g. Nike Air Max 2025"
                            className="bg-cream border-border focus:border-ink"
                          />
                        </div>

                        {/* 5. Product Description */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                              Product Description <span className="text-terracotta">*</span>
                            </Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={enhanceDescription}
                              disabled={enhancingDesc || !store.productDesc.trim()}
                              className="h-6 px-2 text-[11px] text-terracotta hover:text-terracotta-dark"
                            >
                              {enhancingDesc ? (
                                <div className="w-3 h-3 border-2 border-terracotta/30 border-t-terracotta rounded-full animate-spin mr-1" />
                              ) : (
                                <Wand2 className="w-3 h-3 mr-1" />
                              )}
                              AI Enhance
                            </Button>
                          </div>
                          <Textarea
                            value={store.productDesc}
                            onChange={(e) => store.setProductDesc(e.target.value)}
                            placeholder="Describe your product — what it does, who it's for, what makes it special..."
                            rows={4}
                            className="bg-cream border-border focus:border-ink resize-y min-h-[96px]"
                          />
                        </div>

                        {/* 6. Tone Selector — visual cards */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Campaign Tone
                          </Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {TONES.map((t) => (
                              <button
                                key={t.value}
                                onClick={() => store.setTone(t.value)}
                                className={`px-2 py-2 rounded text-[11px] font-semibold transition-all border text-center ${
                                  store.tone === t.value
                                    ? "border-terracotta bg-terracotta-light text-terracotta-dark"
                                    : "border-border bg-cream text-ink-soft hover:border-ink-soft"
                                }`}
                              >
                                {t.label}
                              </button>
                            ))}
                          </div>
                          {store.tone && TONE_PREVIEWS[store.tone] && (
                            <div className="text-[12px] italic text-ink-muted bg-terracotta-light rounded px-3 py-2 border-l-[3px] border-terracotta leading-relaxed">
                              &ldquo;{TONE_PREVIEWS[store.tone]}&rdquo;
                            </div>
                          )}
                        </div>

                        {/* 7. Target Platforms */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Target Platforms
                          </Label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {PLATFORMS.map((p) => (
                              <button
                                key={p.value}
                                onClick={() => store.togglePlatform(p.value)}
                                className={`flex items-center gap-1 px-2 py-2 border-[1.5px] rounded text-[11px] font-medium transition-all ${
                                  store.platforms.includes(p.value)
                                    ? "border-ink bg-ink text-white"
                                    : "border-border bg-cream text-ink-soft hover:border-ink-soft"
                                }`}
                              >
                                <span className="text-sm leading-none">{p.icon}</span>
                                <span className="truncate">{p.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 8. Target Audience */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Target Audience
                          </Label>
                          <Input
                            value={store.audience}
                            onChange={(e) => store.setAudience(e.target.value)}
                            placeholder="e.g. Young professionals aged 25-35"
                            className="bg-cream border-border focus:border-ink"
                          />
                          <div className="flex flex-wrap gap-1">
                            {AUDIENCE_PRESETS.slice(0, 4).map((preset) => (
                              <button
                                key={preset}
                                onClick={() => store.setAudience(preset)}
                                className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-border-soft text-ink-muted hover:bg-border hover:text-ink-soft transition-colors"
                              >
                                {preset.length > 25 ? preset.slice(0, 25) + "..." : preset}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* 9. Language */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                            <Globe className="w-3 h-3" />
                            Language
                          </Label>
                          <Select value={store.language} onValueChange={store.setLanguage}>
                            <SelectTrigger className="w-full text-sm border-border bg-cream">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {LANGUAGES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>
                                  {l.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* 10. Creativity Level */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft flex items-center gap-1.5">
                              <Target className="w-3 h-3" />
                              Creativity Level
                            </Label>
                            <span className="text-xs font-semibold text-ink">{store.creativity}%</span>
                          </div>
                          <Slider
                            value={[store.creativity]}
                            onValueChange={([v]) => store.setCreativity(v)}
                            max={100}
                            step={1}
                            className="py-1"
                          />
                          <div className="flex justify-between text-[10px] text-ink-muted">
                            <span>Precise</span>
                            <span>Balanced</span>
                            <span>Creative</span>
                          </div>
                        </div>

                        {/* 11. Additional Instructions */}
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider text-ink-soft">
                            Additional Instructions
                          </Label>
                          <Textarea
                            value={store.additionalInstructions}
                            onChange={(e) => store.setAdditionalInstructions(e.target.value)}
                            placeholder="Any special requests or constraints..."
                            rows={2}
                            className="bg-cream border-border focus:border-ink resize-y"
                          />
                        </div>

                        <Separator />

                        {/* Error */}
                        {store.error && (
                          <div className="bg-red-50 border border-red-200 rounded px-4 py-3 text-[13px] text-red-700">
                            {store.error}
                          </div>
                        )}

                        {/* 12. Generate Button */}
                        <Button
                          onClick={generateCampaign}
                          disabled={store.loading}
                          className={`w-full py-6 text-sm font-semibold tracking-wide ${
                            store.loading
                              ? "bg-terracotta/60 text-white/80 cursor-not-allowed"
                              : "bg-terracotta text-white hover:bg-terracotta-dark hover:shadow-[0_4px_12px_rgba(200,96,42,0.35)] active:translate-y-px pulse-glow"
                          }`}
                        >
                          {store.loading ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Campaign
                            </>
                          )}
                        </Button>
                      </div>
                    </ScrollArea>
                  </div>
                </aside>

                {/* ── RIGHT: Results ── */}
                <div ref={outputRef} className="space-y-4">
                  {/* Empty State */}
                  {!store.result && !store.loading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white border-[1.5px] border-dashed border-border rounded-lg py-20 px-10 text-center flex flex-col items-center gap-4"
                    >
                      <div className="w-14 h-14 bg-border-soft rounded-full flex items-center justify-center">
                        <Sparkles className="w-6 h-6 text-ink-muted" />
                      </div>
                      <h3 className="font-serif text-xl text-ink">Your campaign awaits</h3>
                      <p className="text-sm text-ink-muted max-w-[280px] leading-relaxed">
                        Fill in the brief on the left and click Generate Campaign to get started.
                      </p>
                    </motion.div>
                  )}

                  {/* Skeleton Loading */}
                  {store.loading && (
                    <div className="space-y-4">
                      <div className="bg-white border border-border rounded-lg px-5 py-4 flex items-center justify-between">
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
                  <AnimatePresence>
                    {store.result && !store.loading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        {/* Result Header */}
                        <div className="result-actions-bar bg-white border border-border rounded-lg px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 bg-status-green rounded-full animate-pulse" />
                            <div>
                              <div className="font-serif text-base font-semibold text-ink">
                                {store.resultProductName} Campaign
                              </div>
                              <div className="flex items-center gap-2 text-xs text-ink-muted">
                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                  {store.resultTone}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                                  {PROVIDERS.find((p) => p.value === store.resultProvider)?.label || store.resultProvider}
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={copyAll} className="h-7 text-[11px] gap-1">
                                    <Copy className="w-3 h-3" /> Copy All
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy all sections</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <Button variant="outline" size="sm" onClick={exportMarkdown} className="h-7 text-[11px] gap-1">
                              <FileText className="w-3 h-3" /> Markdown
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportTXT} className="h-7 text-[11px] gap-1">
                              <Download className="w-3 h-3" /> TXT
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportPDF} className="h-7 text-[11px] gap-1">
                              <Printer className="w-3 h-3" /> PDF
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportJSON} className="h-7 text-[11px] gap-1">
                              <Braces className="w-3 h-3" /> JSON
                            </Button>
                            <Button variant="outline" size="sm" onClick={shareResult} className="h-7 text-[11px] gap-1">
                              <Share2 className="w-3 h-3" /> Share
                            </Button>
                          </div>
                        </div>

                        {/* Campaign Section Cards */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {SECTION_CONFIG.map((section, idx) => {
                            const Icon = section.icon;
                            const text = store.result?.[section.key as keyof typeof store.result] || "";
                            const isHeadline = section.key === "headline";

                            return (
                              <motion.div
                                key={section.key}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.06, duration: 0.35 }}
                                className={`bg-white border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow ${
                                  section.full ? "md:col-span-2" : ""
                                } ${'accent' in section && section.accent ? "border-l-[3px] border-l-terracotta" : ""}`}
                              >
                                {/* Header */}
                                <div className="flex items-center justify-between px-4 py-3 bg-cream border-b border-border-soft">
                                  <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                                    <Icon className="w-3.5 h-3.5" />
                                    {section.label}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => regenerateSection(section.key)}
                                            disabled={store.regenerating === section.key}
                                            className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                                          >
                                            {store.regenerating === section.key ? (
                                              <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                                            ) : (
                                              <RefreshCw className="w-3.5 h-3.5" />
                                            )}
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Regenerate</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => copyText(text, section.label)}
                                            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                                          >
                                            <Copy className="w-3.5 h-3.5" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Copy</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <button
                                            onClick={() => store.setEditingSection(store.editingSection === section.key ? null : section.key)}
                                            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                                          >
                                            <Pencil className="w-3 h-3" />
                                          </button>
                                        </TooltipTrigger>
                                        <TooltipContent>Edit</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                </div>

                                {/* Content */}
                                <div className="px-4 py-4">
                                  {store.editingSection === section.key ? (
                                    <Textarea
                                      value={text}
                                      onChange={(e) => store.updateSection(section.key, e.target.value)}
                                      rows={isHeadline ? 2 : 4}
                                      className="resize-y bg-cream border-border focus:border-ink"
                                      autoFocus
                                    />
                                  ) : (
                                    <div
                                      className={`whitespace-pre-wrap leading-relaxed ${
                                        isHeadline
                                          ? "font-serif text-[20px] font-bold text-ink leading-snug"
                                          : section.key === "callToAction"
                                          ? "text-base font-semibold text-terracotta"
                                          : section.key === "tagline"
                                          ? "italic text-base text-ink-soft"
                                          : "text-sm text-ink"
                                      }`}
                                    >
                                      {text}
                                    </div>
                                  )}
                                </div>

                                {/* Word count */}
                                <div className="px-4 pb-3">
                                  <WordCountIndicator text={text} sectionKey={section.key} />
                                </div>

                                {/* Tagline row inside Headline card */}
                                {isHeadline && (
                                  <>
                                    <div className="flex items-center justify-between px-4 py-2.5 bg-cream border-t border-border-soft">
                                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-ink-muted">
                                        <Layers className="w-3.5 h-3.5" />
                                        Tagline
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => regenerateSection("tagline")}
                                          disabled={store.regenerating === "tagline"}
                                          className="p-1 rounded text-ink-muted hover:text-terracotta hover:bg-terracotta-light transition-colors disabled:opacity-50"
                                        >
                                          {store.regenerating === "tagline" ? (
                                            <div className="w-3.5 h-3.5 border-2 border-terracotta/20 border-t-terracotta rounded-full animate-spin" />
                                          ) : (
                                            <RefreshCw className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                        <button
                                          onClick={() => copyText(store.result?.tagline || "", "Tagline")}
                                          className="p-1 rounded text-ink-muted hover:text-ink hover:bg-border transition-colors"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                    <div className="px-4 py-3">
                                      <div className="italic text-base text-ink-soft">
                                        {store.result?.tagline}
                                      </div>
                                    </div>
                                    <div className="px-4 pb-3">
                                      <WordCountIndicator text={store.result?.tagline || ""} sectionKey="tagline" />
                                    </div>

                                    {/* Platform Tags */}
                                    {store.resultPlatforms.length > 0 && (
                                      <div className="flex gap-2 flex-wrap px-4 py-3 border-t border-border-soft bg-cream">
                                        {store.resultPlatforms.map((p) => (
                                          <span
                                            key={p}
                                            className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-border text-ink-soft"
                                          >
                                            {p.charAt(0).toUpperCase() + p.slice(1)}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>

                        {/* Save to Dashboard */}
                        <div className="flex justify-center pt-2">
                          <Button
                            onClick={saveToDashboard}
                            disabled={createCampaign.isPending}
                            className="bg-ink text-white hover:bg-ink/90 px-8 py-5"
                          >
                            {createCampaign.isPending ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                            ) : (
                              <Archive className="w-4 h-4 mr-2" />
                            )}
                            Save to Dashboard
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 2: CAMPAIGNS */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "campaigns" && (
            <motion.div
              key="campaigns"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 md:py-10"
            >
              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
                  <Input
                    value={campaignSearch}
                    onChange={(e) => { setCampaignSearch(e.target.value); setCampaignPage(1); }}
                    placeholder="Search campaigns..."
                    className="pl-9 bg-white border-border"
                  />
                </div>
                <Select value={campaignToneFilter} onValueChange={(v) => { setCampaignToneFilter(v === "all" ? "" : v); setCampaignPage(1); }}>
                  <SelectTrigger className="w-[140px] bg-white border-border text-sm">
                    <SelectValue placeholder="All Tones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Tones</SelectItem>
                    {TONES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={campaignProviderFilter} onValueChange={(v) => { setCampaignProviderFilter(v === "all" ? "" : v); setCampaignPage(1); }}>
                  <SelectTrigger className="w-[140px] bg-white border-border text-sm">
                    <SelectValue placeholder="All Providers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Providers</SelectItem>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={campaignStatusFilter} onValueChange={(v) => { setCampaignStatusFilter(v === "all" ? "" : v); setCampaignPage(1); }}>
                  <SelectTrigger className="w-[140px] bg-white border-border text-sm">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Loading */}
              {campaignsLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!campaignsLoading && campaigns.length === 0 && (
                <div className="bg-white border-[1.5px] border-dashed border-border rounded-lg py-16 px-8 text-center">
                  <Archive className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-ink mb-2">No campaigns yet</h3>
                  <p className="text-sm text-ink-muted mb-4">Generate your first campaign to see it here.</p>
                  <Button onClick={() => setActiveTab("generate")} className="bg-terracotta text-white hover:bg-terracotta-dark">
                    <Sparkles className="w-4 h-4 mr-2" /> Start Generating
                  </Button>
                </div>
              )}

              {/* Campaign Cards Grid */}
              {!campaignsLoading && campaigns.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {campaigns.map((campaign, idx) => (
                    <motion.div
                      key={campaign.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                    >
                      <Card className="border-border hover:shadow-md transition-shadow group">
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-serif font-semibold text-ink text-base truncate">
                                {campaign.productName}
                              </h4>
                              <p className="text-[11px] text-ink-muted mt-0.5">
                                {formatDate(campaign.createdAt)}
                              </p>
                            </div>
                            <button
                              onClick={() => toggleFavorite.mutate(campaign.id)}
                              className="p-1 rounded hover:bg-border-soft transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 transition-colors ${
                                  campaign.isFavorite ? "text-terracotta fill-terracotta" : "text-ink-muted"
                                }`}
                              />
                            </button>
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1.5">
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                              {campaign.tone}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                              {campaign.provider}
                            </Badge>
                            <Badge
                              className={`text-[10px] h-5 px-1.5 ${
                                campaign.status === "completed"
                                  ? "bg-status-green/10 text-status-green border-status-green/20"
                                  : campaign.status === "draft"
                                  ? "bg-status-orange/10 text-status-orange border-status-orange/20"
                                  : "bg-ink-muted/10 text-ink-muted border-ink-muted/20"
                              }`}
                            >
                              {campaign.status}
                            </Badge>
                          </div>

                          {/* Preview */}
                          {campaign.headline && (
                            <p className="text-xs text-ink-soft leading-relaxed line-clamp-2">
                              {campaign.headline}
                            </p>
                          )}

                          {/* Rating */}
                          {campaign.rating && (
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < campaign.rating!
                                      ? "text-status-orange fill-status-orange"
                                      : "text-border"
                                  }`}
                                />
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-1 border-t border-border-soft">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-ink-muted hover:text-ink"
                                    onClick={() => {
                                      if (campaign.headline) {
                                        store.setResult({
                                          headline: campaign.headline || "",
                                          tagline: campaign.tagline || "",
                                          adCopy: campaign.adCopy || "",
                                          callToAction: campaign.callToAction || "",
                                          targetAudience: campaign.targetAudience || "",
                                          keyBenefits: campaign.keyBenefits || "",
                                          platformVersions: campaign.platformVersions || "",
                                        });
                                        store.setProductName(campaign.productName);
                                        store.setProductDesc(campaign.productDesc);
                                        store.setTone(campaign.tone);
                                        store.setProvider(campaign.provider);
                                        setActiveTab("generate");
                                      }
                                    }}
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>View</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-ink-muted hover:text-ink"
                                    onClick={() => duplicateCampaign.mutate(campaign.id)}
                                  >
                                    <CopyPlus className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Duplicate</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-ink-muted hover:text-ink"
                                    onClick={() => handleDeleteCampaign(campaign.id)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Delete</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {campaignPagination && campaignPagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={campaignPage <= 1}
                    onClick={() => setCampaignPage((p) => p - 1)}
                    className="text-xs"
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-ink-muted px-3">
                    Page {campaignPage} of {campaignPagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={campaignPage >= campaignPagination.totalPages}
                    onClick={() => setCampaignPage((p) => p + 1)}
                    className="text-xs"
                  >
                    Next
                  </Button>
                </div>
              )}
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 3: TEMPLATES */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "templates" && (
            <motion.div
              key="templates"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 md:py-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-ink">Templates</h2>
                  <p className="text-sm text-ink-muted mt-1">Pre-built campaign frameworks to get you started faster</p>
                </div>
                <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-terracotta text-white hover:bg-terracotta-dark">
                      <Plus className="w-4 h-4 mr-2" /> Create Template
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Create Template</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Name</Label>
                        <Input value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} placeholder="e.g. Product Launch" className="bg-cream border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Description</Label>
                        <Input value={newTemplateDesc} onChange={(e) => setNewTemplateDesc(e.target.value)} placeholder="What this template is for..." className="bg-cream border-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider">Category</Label>
                          <Select value={newTemplateCategory} onValueChange={setNewTemplateCategory}>
                            <SelectTrigger className="bg-cream border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="product">Product</SelectItem>
                              <SelectItem value="service">Service</SelectItem>
                              <SelectItem value="event">Event</SelectItem>
                              <SelectItem value="saas">SaaS</SelectItem>
                              <SelectItem value="ecommerce">E-Commerce</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider">Default Tone</Label>
                          <Select value={newTemplateTone} onValueChange={setNewTemplateTone}>
                            <SelectTrigger className="bg-cream border-border"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {TONES.map((t) => (
                                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Prompt Instructions</Label>
                        <Textarea value={newTemplatePrompt} onChange={(e) => setNewTemplatePrompt(e.target.value)} placeholder="Additional instructions for the AI..." rows={4} className="bg-cream border-border" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleCreateTemplate} disabled={createTemplate.isPending} className="bg-terracotta text-white hover:bg-terracotta-dark">
                        {createTemplate.isPending ? "Creating..." : "Create Template"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Category filters */}
              <div className="flex flex-wrap gap-2 mb-6">
                {TEMPLATE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setTemplateCategory(cat.value)}
                    className={`px-3 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all border ${
                      templateCategory === cat.value
                        ? "border-ink bg-ink text-white"
                        : "border-border bg-white text-ink-soft hover:border-ink-soft"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Loading */}
              {templatesLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Template Cards */}
              {!templatesLoading && templates.length === 0 && (
                <div className="bg-white border-[1.5px] border-dashed border-border rounded-lg py-16 px-8 text-center">
                  <LayoutTemplate className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-ink mb-2">No templates found</h3>
                  <p className="text-sm text-ink-muted">Create a template to get started.</p>
                </div>
              )}

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template, idx) => (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="border-border hover:shadow-md transition-shadow h-full flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col space-y-3">
                        <div className="flex items-start justify-between">
                          <h4 className="font-serif font-semibold text-ink text-base">{template.name}</h4>
                          <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0">
                            {template.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-ink-soft leading-relaxed line-clamp-2 flex-1">
                          {template.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {template.tone}
                          </Badge>
                          <span className="text-[10px] text-ink-muted flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {template.usageCount} uses
                          </span>
                        </div>
                        <Button
                          onClick={() => applyTemplate(template.id)}
                          className="w-full bg-terracotta text-white hover:bg-terracotta-dark mt-auto"
                          size="sm"
                        >
                          <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 4: BRAND KITS */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "brand-kits" && (
            <motion.div
              key="brand-kits"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 md:py-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-ink">Brand Kits</h2>
                  <p className="text-sm text-ink-muted mt-1">Define your brand voice, colors, and guidelines for consistent campaigns</p>
                </div>
                <Dialog open={brandKitDialogOpen} onOpenChange={setBrandKitDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-terracotta text-white hover:bg-terracotta-dark">
                      <Plus className="w-4 h-4 mr-2" /> Create Brand Kit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle className="font-serif">Create Brand Kit</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Kit Name</Label>
                        <Input value={newBKName} onChange={(e) => setNewBKName(e.target.value)} placeholder="e.g. Corporate Identity" className="bg-cream border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Brand Name <span className="text-terracotta">*</span></Label>
                        <Input value={newBKBrandName} onChange={(e) => setNewBKBrandName(e.target.value)} placeholder="e.g. Acme Corp" className="bg-cream border-border" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Brand Voice <span className="text-terracotta">*</span></Label>
                        <Textarea value={newBKBrandVoice} onChange={(e) => setNewBKBrandVoice(e.target.value)} placeholder="Describe the brand's voice and personality..." rows={3} className="bg-cream border-border" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider">Primary Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newBKPrimaryColor}
                              onChange={(e) => setNewBKPrimaryColor(e.target.value)}
                              className="w-8 h-8 rounded border border-border cursor-pointer"
                            />
                            <Input value={newBKPrimaryColor} onChange={(e) => setNewBKPrimaryColor(e.target.value)} className="bg-cream border-border text-xs" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[11px] font-bold uppercase tracking-wider">Secondary Color</Label>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={newBKSecondaryColor}
                              onChange={(e) => setNewBKSecondaryColor(e.target.value)}
                              className="w-8 h-8 rounded border border-border cursor-pointer"
                            />
                            <Input value={newBKSecondaryColor} onChange={(e) => setNewBKSecondaryColor(e.target.value)} className="bg-cream border-border text-xs" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[11px] font-bold uppercase tracking-wider">Guidelines (optional)</Label>
                        <Textarea value={newBKGuidelines} onChange={(e) => setNewBKGuidelines(e.target.value)} placeholder="Additional brand guidelines..." rows={2} className="bg-cream border-border" />
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleCreateBrandKit} disabled={createBrandKit.isPending} className="bg-terracotta text-white hover:bg-terracotta-dark">
                        {createBrandKit.isPending ? "Creating..." : "Create Brand Kit"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Loading */}
              {brandKitsLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Empty state */}
              {!brandKitsLoading && brandKits.length === 0 && (
                <div className="bg-white border-[1.5px] border-dashed border-border rounded-lg py-16 px-8 text-center">
                  <Palette className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                  <h3 className="font-serif text-lg text-ink mb-2">No brand kits yet</h3>
                  <p className="text-sm text-ink-muted">Create a brand kit to maintain consistent voice across campaigns.</p>
                </div>
              )}

              {/* Brand Kit Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {brandKits.map((kit, idx) => (
                  <motion.div
                    key={kit.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                  >
                    <Card className="border-border hover:shadow-md transition-shadow h-full flex flex-col">
                      <CardContent className="p-4 flex-1 flex flex-col space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-serif font-semibold text-ink text-base">{kit.name}</h4>
                            <p className="text-[11px] text-ink-muted">{kit.brandName}</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-ink-muted hover:text-destructive"
                            onClick={() => handleDeleteBrandKit(kit.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Voice Summary */}
                        <p className="text-xs text-ink-soft leading-relaxed line-clamp-3 flex-1">
                          {kit.brandVoice}
                        </p>

                        {/* Color Swatches */}
                        <div className="flex items-center gap-2">
                          {kit.primaryColor && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: kit.primaryColor }} />
                              <span className="text-[10px] text-ink-muted font-mono">{kit.primaryColor}</span>
                            </div>
                          )}
                          {kit.secondaryColor && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: kit.secondaryColor }} />
                              <span className="text-[10px] text-ink-muted font-mono">{kit.secondaryColor}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <Button
                          onClick={() => applyBrandKit(kit)}
                          className="w-full bg-terracotta text-white hover:bg-terracotta-dark mt-auto"
                          size="sm"
                        >
                          <Palette className="w-3.5 h-3.5 mr-1.5" /> Use in Campaign
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* TAB 5: ANALYTICS */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {activeTab === "analytics" && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 md:py-10"
            >
              <div className="mb-6">
                <h2 className="font-serif text-2xl font-bold text-ink">Analytics</h2>
                <p className="text-sm text-ink-muted mt-1">Track your campaign generation activity and usage patterns</p>
              </div>

              {/* Loading */}
              {analyticsLoading && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i} className="border-border">
                      <CardContent className="p-4">
                        <Skeleton className="h-3 w-20 mb-2" />
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Stats Cards */}
              {!analyticsLoading && analytics && (
                <>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    {[
                      { label: "Total Campaigns", value: analytics.overview.totalCampaigns, icon: Archive, color: "text-ink" },
                      { label: "This Month", value: analytics.overview.completedCount, icon: TrendingUp, color: "text-status-green" },
                      { label: "Total Tokens", value: analytics.overview.totalTokensUsed.toLocaleString(), icon: Zap, color: "text-terracotta" },
                      {
                        label: "Most Used Provider",
                        value: analytics.providerDistribution.length > 0
                          ? analytics.providerDistribution.reduce((a, b) => (a.count > b.count ? a : b)).provider
                          : "N/A",
                        icon: Monitor,
                        color: "text-ink-soft",
                      },
                    ].map((stat) => (
                      <Card key={stat.label} className="border-border">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2 mb-1">
                            <stat.icon className={`w-4 h-4 ${stat.color}`} />
                            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">{stat.label}</span>
                          </div>
                          <div className="font-serif text-2xl font-bold text-ink">{stat.value}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Charts Row */}
                  <div className="grid lg:grid-cols-2 gap-6 mb-8">
                    {/* Provider Distribution */}
                    <Card className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-serif text-base">Provider Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analytics.providerDistribution.length === 0 && (
                          <p className="text-xs text-ink-muted text-center py-4">No data yet. Generate a campaign to see stats.</p>
                        )}
                        {analytics.providerDistribution.map((item) => (
                          <div key={item.provider} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-ink capitalize">{item.provider}</span>
                              <span className="text-ink-muted">{item.count} campaigns</span>
                            </div>
                            <div className="h-2.5 bg-border-soft rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / maxProviderCount) * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="h-full bg-terracotta rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>

                    {/* Tone Distribution */}
                    <Card className="border-border">
                      <CardHeader className="pb-3">
                        <CardTitle className="font-serif text-base">Tone Distribution</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {analytics.toneDistribution.length === 0 && (
                          <p className="text-xs text-ink-muted text-center py-4">No data yet. Generate a campaign to see stats.</p>
                        )}
                        {analytics.toneDistribution.map((item) => (
                          <div key={item.tone} className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-ink capitalize">{item.tone}</span>
                              <span className="text-ink-muted">{item.count} campaigns</span>
                            </div>
                            <div className="h-2.5 bg-border-soft rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(item.count / maxToneCount) * 100}%` }}
                                transition={{ duration: 0.6, ease: "easeOut" }}
                                className="h-full bg-ink rounded-full"
                              />
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Activity */}
                  <Card className="border-border">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-serif text-base">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {analytics.recentUsage.length === 0 ? (
                        <p className="text-xs text-ink-muted text-center py-6">No recent activity. Generate a campaign to get started.</p>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                          {analytics.recentUsage.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 px-3 rounded bg-cream">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-terracotta rounded-full" />
                                <span className="text-xs font-medium text-ink">{formatDate(item.date)}</span>
                              </div>
                              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                                {item.count} campaign{item.count !== 1 ? "s" : ""}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Additional Stats */}
                  <div className="grid sm:grid-cols-3 gap-4 mt-6">
                    <Card className="border-border">
                      <CardContent className="p-4 text-center">
                        <Heart className="w-5 h-5 text-terracotta mx-auto mb-1" />
                        <div className="font-serif text-xl font-bold text-ink">{analytics.overview.favoriteCount}</div>
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Favorites</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardContent className="p-4 text-center">
                        <Star className="w-5 h-5 text-status-orange mx-auto mb-1" />
                        <div className="font-serif text-xl font-bold text-ink">{analytics.overview.averageRating.toFixed(1)}</div>
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Avg Rating</div>
                      </CardContent>
                    </Card>
                    <Card className="border-border">
                      <CardContent className="p-4 text-center">
                        <Palette className="w-5 h-5 text-ink-soft mx-auto mb-1" />
                        <div className="font-serif text-xl font-bold text-ink">{analytics.overview.brandKitCount}</div>
                        <div className="text-[10px] text-ink-muted uppercase tracking-wider font-semibold">Brand Kits</div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-white py-4">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-ink-muted">
          <span className="font-serif font-semibold text-ink">
            Ad<span className="text-terracotta">Forge</span>
          </span>
          <span>AI-Powered Campaign Generator</span>
        </div>
      </footer>
    </div>
  );
}
