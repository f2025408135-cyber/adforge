/**
 * AdForge — Campaign React Query Hooks
 *
 * Data-fetching and mutation hooks for the campaigns API.
 * All mutations invalidate the relevant query caches on success.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────
export interface Campaign {
  id: string;
  userId: string;
  productName: string;
  productDesc: string;
  tone: string;
  audience: string | null;
  platforms: string;
  provider: string;
  headline: string | null;
  tagline: string | null;
  adCopy: string | null;
  callToAction: string | null;
  targetAudience: string | null;
  keyBenefits: string | null;
  platformVersions: string | null;
  status: string;
  isFavorite: boolean;
  variants: string | null;
  tags: string | null;
  rating: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  versions?: CampaignVersion[];
  _count?: { versions: number };
}

export interface CampaignVersion {
  id: string;
  campaignId: string;
  version: number;
  headline: string | null;
  tagline: string | null;
  adCopy: string | null;
  callToAction: string | null;
  targetAudience: string | null;
  keyBenefits: string | null;
  platformVersions: string | null;
  changeSummary: string | null;
  createdAt: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CampaignDetailResponse {
  campaign: Campaign;
}

export interface CampaignVersionsResponse {
  versions: CampaignVersion[];
}

export interface CampaignListParams {
  page?: number;
  limit?: number;
  search?: string;
  tone?: string;
  provider?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  favorite?: string;
}

export interface CampaignCreateData {
  productName: string;
  productDesc: string;
  tone?: string;
  audience?: string;
  platforms?: string[];
  provider?: string;
  headline?: string;
  tagline?: string;
  adCopy?: string;
  callToAction?: string;
  targetAudience?: string;
  keyBenefits?: string;
  platformVersions?: string;
  status?: "draft" | "completed" | "archived";
  tags?: string;
  rating?: number;
  notes?: string;
}

export interface CampaignUpdateData {
  productName?: string;
  productDesc?: string;
  tone?: string;
  audience?: string;
  platforms?: string[];
  provider?: string;
  headline?: string;
  tagline?: string;
  adCopy?: string;
  callToAction?: string;
  targetAudience?: string;
  keyBenefits?: string;
  platformVersions?: string;
  status?: string;
  isFavorite?: boolean;
  tags?: string;
  rating?: number;
  notes?: string;
}

// ── Query key factory ────────────────────────────────────────
export const campaignKeys = {
  all: ["campaigns"] as const,
  lists: () => [...campaignKeys.all, "list"] as const,
  list: (params: CampaignListParams) =>
    [...campaignKeys.lists(), params] as const,
  details: () => [...campaignKeys.all, "detail"] as const,
  detail: (id: string) => [...campaignKeys.details(), id] as const,
  versions: (id: string) =>
    [...campaignKeys.detail(id), "versions"] as const,
};

// ── Fetch helpers ────────────────────────────────────────────
async function fetchCampaigns(
  params: CampaignListParams
): Promise<CampaignListResponse> {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.search) searchParams.set("search", params.search);
  if (params.tone) searchParams.set("tone", params.tone);
  if (params.provider) searchParams.set("provider", params.provider);
  if (params.status) searchParams.set("status", params.status);
  if (params.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params.favorite) searchParams.set("favorite", params.favorite);

  const res = await fetch(`/api/campaigns?${searchParams.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch campaigns");
  }
  return res.json();
}

async function fetchCampaign(id: string): Promise<CampaignDetailResponse> {
  const res = await fetch(`/api/campaigns/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch campaign");
  }
  return res.json();
}

async function fetchCampaignVersions(
  id: string
): Promise<CampaignVersionsResponse> {
  const res = await fetch(`/api/campaigns/${id}/versions`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch campaign versions");
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────

/** GET /api/campaigns — List campaigns with optional filters */
export function useCampaigns(
  params: CampaignListParams = {},
  options?: Omit<
    UseQueryOptions<
      CampaignListResponse,
      Error,
      CampaignListResponse,
      ReturnType<typeof campaignKeys.list>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: campaignKeys.list(params),
    queryFn: () => fetchCampaigns(params),
    ...options,
  });
}

/** GET /api/campaigns/{id} — Fetch a single campaign */
export function useCampaign(
  id: string,
  options?: Omit<
    UseQueryOptions<
      CampaignDetailResponse,
      Error,
      CampaignDetailResponse,
      ReturnType<typeof campaignKeys.detail>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: campaignKeys.detail(id),
    queryFn: () => fetchCampaign(id),
    enabled: !!id,
    ...options,
  });
}

/** GET /api/campaigns/{id}/versions — Fetch campaign version history */
export function useCampaignVersions(
  id: string,
  options?: Omit<
    UseQueryOptions<
      CampaignVersionsResponse,
      Error,
      CampaignVersionsResponse,
      ReturnType<typeof campaignKeys.versions>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: campaignKeys.versions(id),
    queryFn: () => fetchCampaignVersions(id),
    enabled: !!id,
    ...options,
  });
}

/** POST /api/campaigns — Create a new campaign */
export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CampaignCreateData) => {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create campaign");
      }
      return res.json() as Promise<CampaignDetailResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** PUT /api/campaigns/{id} — Update a campaign */
export function useUpdateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CampaignUpdateData }) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update campaign");
      }
      return res.json() as Promise<CampaignDetailResponse>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: campaignKeys.versions(variables.id),
      });
    },
  });
}

/** DELETE /api/campaigns/{id} — Delete a campaign */
export function useDeleteCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete campaign");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** PUT /api/campaigns/{id}/favorite — Toggle favorite on a campaign */
export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}/favorite`, {
        method: "PUT",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to toggle favorite");
      }
      return res.json() as Promise<{ isFavorite: boolean; campaign: Campaign }>;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** PUT /api/campaigns/{id}/rate — Rate a campaign (1-5) */
export function useRateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, rating }: { id: string; rating: number }) => {
      const res = await fetch(`/api/campaigns/${id}/rate`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to rate campaign");
      }
      return res.json() as Promise<{ rating: number; campaign: Campaign }>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: campaignKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** POST /api/campaigns/{id}/duplicate — Duplicate a campaign */
export function useDuplicateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/campaigns/${id}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to duplicate campaign");
      }
      return res.json() as Promise<CampaignDetailResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
