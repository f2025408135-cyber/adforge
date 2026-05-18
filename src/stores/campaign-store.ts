/**
 * AdForge — Campaign Generation Store (Zustand)
 *
 * Manages all state related to the campaign generation form,
 * result data, and UI state for the generation workflow.
 */

import { create } from "zustand";

export interface CampaignResult {
  headline: string;
  tagline: string;
  adCopy: string;
  callToAction: string;
  targetAudience: string;
  keyBenefits: string;
  platformVersions: string;
}

interface CampaignStore {
  // ── Form state ──────────────────────────────────────────────
  provider: string;
  productName: string;
  productDesc: string;
  tone: string;
  audience: string;
  platforms: string[];
  brandVoice: string;
  selectedBrandKitId: string;
  language: string;
  creativity: number;
  templateId: string;
  additionalInstructions: string;

  // ── Result state ────────────────────────────────────────────
  result: CampaignResult | null;
  resultProductName: string;
  resultTone: string;
  resultProvider: string;
  resultPlatforms: string[];
  tokensUsed: number;
  generationTime: number;

  // ── UI state ────────────────────────────────────────────────
  loading: boolean;
  regenerating: string | null;
  error: string;
  showProgress: boolean;
  editingSection: string | null;
  activeVariant: "a" | "b";
  variantB: CampaignResult | null;

  // ── Form actions ────────────────────────────────────────────
  setProvider: (p: string) => void;
  setProductName: (n: string) => void;
  setProductDesc: (d: string) => void;
  setTone: (t: string) => void;
  setAudience: (a: string) => void;
  togglePlatform: (p: string) => void;
  setBrandVoice: (v: string) => void;
  setSelectedBrandKitId: (id: string) => void;
  setLanguage: (l: string) => void;
  setCreativity: (c: number) => void;
  setTemplateId: (id: string) => void;
  setAdditionalInstructions: (i: string) => void;

  // ── Result / UI actions ─────────────────────────────────────
  setResult: (r: CampaignResult | null) => void;
  setLoading: (l: boolean) => void;
  setRegenerating: (s: string | null) => void;
  setError: (e: string) => void;
  setShowProgress: (p: boolean) => void;
  setEditingSection: (s: string | null) => void;
  updateSection: (key: string, value: string) => void;
  setVariantB: (r: CampaignResult | null) => void;
  setActiveVariant: (v: "a" | "b") => void;
  resetForm: () => void;
}

const initialFormState = {
  provider: "deepseek",
  productName: "",
  productDesc: "",
  tone: "professional",
  audience: "",
  platforms: ["instagram", "facebook"],
  brandVoice: "",
  selectedBrandKitId: "",
  language: "en",
  creativity: 50,
  templateId: "",
  additionalInstructions: "",
};

const initialResultState = {
  result: null,
  resultProductName: "",
  resultTone: "",
  resultProvider: "",
  resultPlatforms: [],
  tokensUsed: 0,
  generationTime: 0,
};

const initialUIState = {
  loading: false,
  regenerating: null,
  error: "",
  showProgress: false,
  editingSection: null,
  activeVariant: "a" as const,
  variantB: null,
};

export const useCampaignStore = create<CampaignStore>((set) => ({
  ...initialFormState,
  ...initialResultState,
  ...initialUIState,

  // ── Form actions ──────────────────────────────────────────
  setProvider: (p) => set({ provider: p }),
  setProductName: (n) => set({ productName: n }),
  setProductDesc: (d) => set({ productDesc: d }),
  setTone: (t) => set({ tone: t }),
  setAudience: (a) => set({ audience: a }),
  togglePlatform: (p) =>
    set((state) => ({
      platforms: state.platforms.includes(p)
        ? state.platforms.filter((x) => x !== p)
        : [...state.platforms, p],
    })),
  setBrandVoice: (v) => set({ brandVoice: v }),
  setSelectedBrandKitId: (id) => set({ selectedBrandKitId: id }),
  setLanguage: (l) => set({ language: l }),
  setCreativity: (c) => set({ creativity: c }),
  setTemplateId: (id) => set({ templateId: id }),
  setAdditionalInstructions: (i) => set({ additionalInstructions: i }),

  // ── Result / UI actions ───────────────────────────────────
  setResult: (r) =>
    set((state) => ({
      result: r,
      // Capture snapshot of form values at generation time
      ...(r
        ? {
            resultProductName: state.productName,
            resultTone: state.tone,
            resultProvider: state.provider,
            resultPlatforms: [...state.platforms],
          }
        : {
            resultProductName: "",
            resultTone: "",
            resultProvider: "",
            resultPlatforms: [],
          }),
    })),

  setLoading: (l) => set({ loading: l }),
  setRegenerating: (s) => set({ regenerating: s }),
  setError: (e) => set({ error: e }),
  setShowProgress: (p) => set({ showProgress: p }),
  setEditingSection: (s) => set({ editingSection: s }),

  updateSection: (key, value) =>
    set((state) => {
      if (!state.result) return state;
      return {
        result: {
          ...state.result,
          [key]: value,
        },
      };
    }),

  setVariantB: (r) => set({ variantB: r }),
  setActiveVariant: (v) => set({ activeVariant: v }),

  resetForm: () =>
    set({
      ...initialFormState,
      ...initialResultState,
      ...initialUIState,
    }),
}));
