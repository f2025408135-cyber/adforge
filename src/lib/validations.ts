import { z } from "zod";

export const generateSchema = z.object({
  provider: z.enum(["gemini", "deepseek", "glm"]).default("gemini"),
  productName: z.string().min(1, "Product name is required"),
  productDesc: z.string().min(10, "Description must be at least 10 characters"),
  tone: z.string().default("professional"),
  audience: z.string().optional(),
  platforms: z.array(z.string()).min(1, "Select at least one platform").default(["instagram", "facebook"]),
  brandVoice: z.string().optional(),
  language: z.string().default("en"),
  creativity: z.number().min(0).max(100).default(50),
  templateId: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

export const regenerateSchema = z.object({
  provider: z.enum(["gemini", "deepseek", "glm"]).default("gemini"),
  sectionKey: z.enum([
    "headline", "tagline", "adCopy", "callToAction",
    "targetAudience", "keyBenefits", "platformVersions",
  ]),
  productName: z.string().min(1),
  productDesc: z.string().min(10),
  tone: z.string().default("professional"),
  platforms: z.array(z.string()).default(["instagram", "facebook"]),
  language: z.string().default("en"),
  creativity: z.number().min(0).max(100).default(50),
  brandVoice: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

export const enhanceDescSchema = z.object({
  provider: z.enum(["gemini", "deepseek", "glm"]).default("gemini"),
  productName: z.string().min(1),
  productDesc: z.string().min(10),
});

export const campaignCreateSchema = z.object({
  productName: z.string().min(1),
  productDesc: z.string().min(10),
  tone: z.string().default("professional"),
  audience: z.string().optional(),
  platforms: z.array(z.string()).default(["instagram", "facebook"]),
  provider: z.string().default("gemini"),
  headline: z.string().optional(),
  tagline: z.string().optional(),
  adCopy: z.string().optional(),
  callToAction: z.string().optional(),
  targetAudience: z.string().optional(),
  keyBenefits: z.string().optional(),
  platformVersions: z.string().optional(),
  status: z.enum(["draft", "completed", "archived"]).default("completed"),
  tags: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export const brandKitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  brandName: z.string().min(1, "Brand name is required"),
  brandVoice: z.string().min(1, "Brand voice is required"),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logo: z.string().optional(),
  guidelines: z.string().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  promptTemplate: z.string().min(1),
  tone: z.string().default("professional"),
  isPublic: z.boolean().default(true),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type RegenerateInput = z.infer<typeof regenerateSchema>;
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;
export type BrandKitInput = z.infer<typeof brandKitSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
