import { z } from 'zod';

export const generateSchema = z.object({
  provider: z.enum(['gemini', 'deepseek', 'glm']),
  productName: z.string().min(1, 'Product name is required'),
  productDesc: z.string().min(20, 'Description must be at least 20 characters'),
  tone: z.string().default('professional'),
  audience: z.string().optional(),
  platforms: z.array(z.string()).default(['instagram', 'facebook']),
  brandVoice: z.string().optional(),
  language: z.string().default('en'),
  creativity: z.number().min(0).max(100).default(50),
  templateId: z.string().optional(),
  additionalInstructions: z.string().optional(),
});

export const regenerateSchema = z.object({
  provider: z.enum(['gemini', 'deepseek', 'glm']),
  sectionKey: z.enum(['headline', 'tagline', 'adCopy', 'callToAction', 'targetAudience', 'keyBenefits', 'platformVersions']),
  productName: z.string().min(1),
  productDesc: z.string().min(1),
  tone: z.string(),
  platforms: z.array(z.string()),
  currentResult: z.object({
    headline: z.string().optional(),
    tagline: z.string().optional(),
    adCopy: z.string().optional(),
    callToAction: z.string().optional(),
    targetAudience: z.string().optional(),
    keyBenefits: z.string().optional(),
    platformVersions: z.string().optional(),
  }).optional(),
});

export const campaignSchema = z.object({
  productName: z.string().min(1),
  productDesc: z.string(),
  tone: z.string().default('professional'),
  audience: z.string().optional(),
  platforms: z.string().default('instagram,facebook'),
  provider: z.string().default('gemini'),
  headline: z.string().optional(),
  tagline: z.string().optional(),
  adCopy: z.string().optional(),
  callToAction: z.string().optional(),
  targetAudience: z.string().optional(),
  keyBenefits: z.string().optional(),
  platformVersions: z.string().optional(),
  status: z.string().default('completed'),
  isFavorite: z.boolean().default(false),
  variants: z.any().optional(),
  tags: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
});

export const brandKitSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  brandName: z.string().min(1, 'Brand name is required'),
  brandVoice: z.string().min(1, 'Brand voice is required'),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  logo: z.string().optional(),
  guidelines: z.string().optional(),
});

export const templateSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string(),
  promptTemplate: z.string().min(1),
  tone: z.string().default('professional'),
  isPublic: z.boolean().default(true),
});

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const exportSchema = z.object({
  campaignId: z.string(),
  format: z.enum(['pdf', 'docx', 'markdown', 'txt', 'json']),
});

export type GenerateInput = z.infer<typeof generateSchema>;
export type RegenerateInput = z.infer<typeof regenerateSchema>;
export type CampaignInput = z.infer<typeof campaignSchema>;
export type BrandKitInput = z.infer<typeof brandKitSchema>;
export type TemplateInput = z.infer<typeof templateSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type ExportInput = z.infer<typeof exportSchema>;