/**
 * AdForge — Brand Kit React Query Hooks
 *
 * Data-fetching and mutation hooks for the brand-kits API.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────
export interface BrandKit {
  id: string;
  userId: string;
  name: string;
  brandName: string;
  brandVoice: string;
  primaryColor: string | null;
  secondaryColor: string | null;
  logo: string | null;
  guidelines: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BrandKitListResponse {
  brandKits: BrandKit[];
}

export interface BrandKitDetailResponse {
  brandKit: BrandKit;
}

export interface BrandKitCreateData {
  name: string;
  brandName: string;
  brandVoice: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  guidelines?: string;
}

export interface BrandKitUpdateData {
  name?: string;
  brandName?: string;
  brandVoice?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logo?: string;
  guidelines?: string;
}

// ── Query key factory ────────────────────────────────────────
export const brandKitKeys = {
  all: ["brand-kits"] as const,
  lists: () => [...brandKitKeys.all, "list"] as const,
  list: () => [...brandKitKeys.lists()] as const,
  details: () => [...brandKitKeys.all, "detail"] as const,
  detail: (id: string) => [...brandKitKeys.details(), id] as const,
};

// ── Fetch helpers ────────────────────────────────────────────
async function fetchBrandKits(): Promise<BrandKitListResponse> {
  const res = await fetch("/api/brand-kits");
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch brand kits");
  }
  return res.json();
}

async function fetchBrandKit(id: string): Promise<BrandKitDetailResponse> {
  const res = await fetch(`/api/brand-kits/${id}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch brand kit");
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────

/** GET /api/brand-kits — List all brand kits */
export function useBrandKits(
  options?: Omit<
    UseQueryOptions<
      BrandKitListResponse,
      Error,
      BrandKitListResponse,
      ReturnType<typeof brandKitKeys.list>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: brandKitKeys.list(),
    queryFn: fetchBrandKits,
    ...options,
  });
}

/** GET /api/brand-kits/{id} — Fetch a single brand kit */
export function useBrandKit(
  id: string,
  options?: Omit<
    UseQueryOptions<
      BrandKitDetailResponse,
      Error,
      BrandKitDetailResponse,
      ReturnType<typeof brandKitKeys.detail>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: brandKitKeys.detail(id),
    queryFn: () => fetchBrandKit(id),
    enabled: !!id,
    ...options,
  });
}

/** POST /api/brand-kits — Create a new brand kit */
export function useCreateBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: BrandKitCreateData) => {
      const res = await fetch("/api/brand-kits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create brand kit");
      }
      return res.json() as Promise<BrandKitDetailResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}

/** PUT /api/brand-kits/{id} — Update a brand kit */
export function useUpdateBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: BrandKitUpdateData }) => {
      const res = await fetch(`/api/brand-kits/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update brand kit");
      }
      return res.json() as Promise<BrandKitDetailResponse>;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKitKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: brandKitKeys.detail(variables.id),
      });
    },
  });
}

/** DELETE /api/brand-kits/{id} — Delete a brand kit */
export function useDeleteBrandKit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/brand-kits/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to delete brand kit");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKitKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
