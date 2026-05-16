# Task: Create Zustand Stores and React Query Hooks

## Summary
Created all 7 required files for the AdForge project's state management and data-fetching layer, plus a QueryClient provider integrated into the layout.

## Files Created

### Zustand Stores
1. **`/home/z/my-project/src/stores/campaign-store.ts`** — Full campaign generation state management with form fields, result state, UI state, and all actions including `updateSection` for inline editing and `resetForm` for cleanup.
2. **`/home/z/my-project/src/stores/ui-store.ts`** — Global UI state (sidebar, search) with simple toggle and setter actions.

### React Query Hooks
3. **`/home/z/my-project/src/hooks/use-campaigns.ts`** — 8 hooks:
   - `useCampaigns(params)` — paginated list with filters
   - `useCampaign(id)` — single campaign detail
   - `useCampaignVersions(id)` — version history
   - `useCreateCampaign()` — POST mutation
   - `useUpdateCampaign()` — PUT mutation
   - `useDeleteCampaign()` — DELETE mutation
   - `useToggleFavorite()` — PUT favorite toggle
   - `useRateCampaign()` — PUT rating (1-5)
   - `useDuplicateCampaign()` — POST duplicate
4. **`/home/z/my-project/src/hooks/use-templates.ts`** — `useTemplates(category?, tone?)` and `useCreateTemplate()`
5. **`/home/z/my-project/src/hooks/use-brand-kits.ts`** — `useBrandKits()`, `useBrandKit(id)`, `useCreateBrandKit()`, `useUpdateBrandKit()`, `useDeleteBrandKit()`
6. **`/home/z/my-project/src/hooks/use-analytics.ts`** — `useAnalytics()` with full type definitions for overview, distributions, and usage data

### Utility Hooks
7. **`/home/z/my-project/src/hooks/use-debounce.ts`** — Generic `useDebounce<T>(value, delay)` hook

### Infrastructure
8. **`/home/z/my-project/src/lib/providers.tsx`** — QueryClientProvider wrapper with sensible defaults (1min staleTime, 1 retry, no refetchOnWindowFocus)
9. **Updated `/home/z/my-project/src/app/layout.tsx`** — Wrapped children with `<Providers>`

## Key Design Decisions
- Query key factories for structured cache invalidation (`campaignKeys`, `templateKeys`, `brandKitKeys`, `analyticsKeys`)
- All mutations invalidate related list and detail caches on success
- Campaign mutations also invalidate the analytics cache since campaign changes affect dashboard stats
- `useCampaign` and `useBrandKit` use `enabled: !!id` to prevent fetching with empty IDs
- All hook types are exported for reuse in components
- Full TypeScript strict typing with `UseQueryOptions` generic parameters for option overrides
- Lint passes with zero errors
