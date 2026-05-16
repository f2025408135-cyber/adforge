/**
 * AdForge — Template React Query Hooks
 *
 * Data-fetching and mutation hooks for the templates API.
 */

"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

// ── Types ────────────────────────────────────────────────────
export interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  tone: string;
  isPublic: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateListResponse {
  templates: Template[];
}

export interface TemplateDetailResponse {
  template: Template;
}

export interface TemplateCreateData {
  name: string;
  description: string;
  category: string;
  promptTemplate: string;
  tone?: string;
  isPublic?: boolean;
}

// ── Query key factory ────────────────────────────────────────
export const templateKeys = {
  all: ["templates"] as const,
  lists: () => [...templateKeys.all, "list"] as const,
  list: (params: { category?: string; tone?: string }) =>
    [...templateKeys.lists(), params] as const,
};

// ── Fetch helper ─────────────────────────────────────────────
async function fetchTemplates(params?: {
  category?: string;
  tone?: string;
}): Promise<TemplateListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.category) searchParams.set("category", params.category);
  if (params?.tone) searchParams.set("tone", params.tone);

  const res = await fetch(`/api/templates?${searchParams.toString()}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to fetch templates");
  }
  return res.json();
}

// ── Hooks ────────────────────────────────────────────────────

/** GET /api/templates — List public templates with optional filters */
export function useTemplates(
  params?: { category?: string; tone?: string },
  options?: Omit<
    UseQueryOptions<
      TemplateListResponse,
      Error,
      TemplateListResponse,
      ReturnType<typeof templateKeys.list>
    >,
    "queryKey" | "queryFn"
  >
) {
  return useQuery({
    queryKey: templateKeys.list(params ?? {}),
    queryFn: () => fetchTemplates(params),
    ...options,
  });
}

/** POST /api/templates — Create a new template */
export function useCreateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: TemplateCreateData) => {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to create template");
      }
      return res.json() as Promise<TemplateDetailResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
    },
  });
}
