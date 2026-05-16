import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create demo user
  const user = await prisma.user.upsert({
    where: { email: "demo@adforge.app" },
    update: {},
    create: {
      id: "demo-user",
      email: "demo@adforge.app",
      name: "Demo User",
      provider: "credentials",
      role: "user",
      plan: "free",
    },
  });

  console.log("Created demo user:", user.email);

  // Seed templates
  const templates = [
    {
      name: "Product Launch",
      description: "Perfect for announcing new products with buzz and excitement",
      category: "product",
      promptTemplate: "Focus on novelty and innovation. Highlight what's new and why it matters. Build anticipation and excitement.",
      tone: "professional",
    },
    {
      name: "Flash Sale",
      description: "Urgent, time-limited promotions that drive immediate action",
      category: "ecommerce",
      promptTemplate: "Include a sense of urgency. Mention limited time/quantity. Use countdown-style language. Make the offer irresistible.",
      tone: "urgent",
    },
    {
      name: "Brand Awareness",
      description: "Build brand recognition and emotional connection with your audience",
      category: "service",
      promptTemplate: "Focus on brand story and values. Build emotional connection. Prioritize memorability over conversion. Make the brand the hero.",
      tone: "inspirational",
    },
    {
      name: "Event Promotion",
      description: "Drive attendance for webinars, conferences, and launches",
      category: "event",
      promptTemplate: "Emphasize the experience and exclusivity. Include date/time details. Create FOMO. Make it sound unmissable.",
      tone: "bold",
    },
    {
      name: "SaaS Free Trial",
      description: "Convert visitors to trial users with compelling value propositions",
      category: "saas",
      promptTemplate: "Highlight the value proposition and ease of onboarding. Emphasize 'free' and 'no commitment'. Address common objections.",
      tone: "professional",
    },
    {
      name: "E-commerce Holiday",
      description: "Seasonal and holiday sales campaigns that tap into gift-giving spirit",
      category: "ecommerce",
      promptTemplate: "Tap into seasonal emotions. Create gift-giving scenarios. Use holiday-themed language. Emphasize savings and limited availability.",
      tone: "casual",
    },
    {
      name: "App Download",
      description: "Drive mobile app installs with instant gratification messaging",
      category: "product",
      promptTemplate: "Focus on instant gratification. Highlight ease of use. Emphasize mobile-first experience. Include social proof.",
      tone: "playful",
    },
    {
      name: "Newsletter Signup",
      description: "Build your email list with exclusive content and insider access",
      category: "service",
      promptTemplate: "Emphasize exclusive content and insider access. Highlight the value of subscribing. Make it feel like joining a community.",
      tone: "casual",
    },
    {
      name: "Retargeting Campaign",
      description: "Bring back past visitors with personalized, warm messaging",
      category: "ecommerce",
      promptTemplate: "Acknowledge past interest. Create a sense of 'we saved this for you'. Offer an incentive to return. Use warm, familiar language.",
      tone: "empathetic",
    },
    {
      name: "Partnership Announcement",
      description: "Announce collaborations and joint ventures with impact",
      category: "product",
      promptTemplate: "Emphasize the collaboration's unique value. Highlight what each party brings. Create excitement about the combined offering.",
      tone: "professional",
    },
  ];

  for (const t of templates) {
    await prisma.template.upsert({
      where: { id: t.name.toLowerCase().replace(/\s+/g, "-") },
      update: {},
      create: {
        id: t.name.toLowerCase().replace(/\s+/g, "-"),
        ...t,
        isPublic: true,
        usageCount: Math.floor(Math.random() * 50),
      },
    });
  }

  console.log(`Seeded ${templates.length} templates`);

  // Seed sample brand kits
  const brandKits = [
    {
      id: "brand-nike",
      userId: "demo-user",
      name: "Nike Brand Voice",
      brandName: "Nike",
      brandVoice: "Bold, motivational, and action-oriented. We inspire athletes at every level. Short, punchy sentences. Use active voice.",
      primaryColor: "#111111",
      secondaryColor: "#FA5400",
    },
    {
      id: "brand-apple",
      userId: "demo-user",
      name: "Apple Minimalist",
      brandName: "Apple",
      brandVoice: "Clean, minimal, and premium. Every word matters. Simple sentences that convey sophistication and innovation.",
      primaryColor: "#000000",
      secondaryColor: "#A2AAAD",
    },
  ];

  for (const bk of brandKits) {
    await prisma.brandKit.upsert({
      where: { id: bk.id },
      update: {},
      create: bk,
    });
  }

  console.log(`Seeded ${brandKits.length} brand kits`);

  // Seed sample campaigns
  const campaigns = [
    {
      id: "campaign-1",
      userId: "demo-user",
      productName: "Nike Air Max 2025",
      productDesc: "The next generation of Air Max with revolutionary cushioning technology, sustainable materials, and bold design for runners and sneaker enthusiasts.",
      tone: "bold",
      audience: "Young athletes and sneakerheads aged 18-30",
      platforms: "instagram,tiktok,twitter",
      provider: "gemini",
      headline: "Redefine What's Possible — Air Max 2025",
      tagline: "Air Evolved. You Elevated.",
      adCopy: "Meet the Nike Air Max 2025. Engineered with next-gen Air cushioning that adapts to every step, wrapped in sustainable materials that prove performance and planet can coexist. This isn't just an upgrade — it's a revolution under your feet. From morning runs to all-day style, the Air Max 2025 delivers unmatched comfort that turns heads and breaks limits.",
      callToAction: "Step Into the Future Now",
      targetAudience: "Ambitious young adults aged 18-30 who live at the intersection of sport and culture. They value innovation, sustainability, and bold self-expression. They're early adopters who influence their peers' purchasing decisions through social media.",
      keyBenefits: "• Revolutionized cushioning that adapts to your stride in real-time\n• 100% sustainable upper made from recycled ocean plastics\n• Iconic design that transitions from performance to street seamlessly",
      platformVersions: "Instagram: Lead with the visual story — carousel showing the shoe's sustainable journey from ocean plastic to iconic design. Use Reels for on-foot styling.\n\nTikTok: Create a 'Day in the Air Max 2025' trend — show the shoe from morning run to night out. Use trending audio and fast cuts.\n\nTwitter/X: Share bold stats (miles of ocean plastic recycled, cushioning tech specs) with punchy takes. Engage sneaker community with polls.",
      status: "completed",
      isFavorite: true,
      rating: 5,
      tags: "sneakers,launch,sustainable",
    },
    {
      id: "campaign-2",
      userId: "demo-user",
      productName: "Calma — Meditation App",
      productDesc: "A beautifully designed meditation and mindfulness app with personalized sessions, sleep stories, and stress-relief exercises for busy professionals.",
      tone: "empathetic",
      audience: "Stressed professionals aged 25-45",
      platforms: "instagram,facebook,linkedin",
      provider: "deepseek",
      headline: "Your Mind Deserves a Moment of Calm",
      tagline: "Breathe. Restore. Thrive.",
      adCopy: "In a world that never stops demanding your attention, Calma gives you permission to pause. Our personalized meditation sessions adapt to your schedule — even 5 minutes can transform your day. With expertly crafted sleep stories, guided breathing exercises, and a stress tracker that actually helps, Calma isn't just another wellness app. It's your daily reset button. Because you can't pour from an empty cup.",
      callToAction: "Start Your Free Calm Today",
      targetAudience: "Busy professionals aged 25-45 who feel overwhelmed by work-life demands. They've tried meditation apps before but struggled with consistency. They value evidence-based approaches and need something that fits their packed schedules.",
      keyBenefits: "• Personalized sessions that adapt to your schedule (5-30 minutes)\n• Science-backed sleep stories that help 87% of users fall asleep faster\n• Smart stress tracker with actionable insights, not just data",
      platformVersions: "Instagram: Share calming visuals with short meditation tips. Use Stories for '2-minute calm breaks' that demonstrate the app in real-time.\n\nFacebook: Longer-form content about workplace burnout and how Calma helps. Target parents and professionals with testimonial-driven ads.\n\nLinkedIn: Position Calma as a professional wellness tool. Share productivity + mindfulness stats. Target HR managers for team subscriptions.",
      status: "completed",
      isFavorite: true,
      rating: 4,
      tags: "meditation,wellness,app",
    },
    {
      id: "campaign-3",
      userId: "demo-user",
      productName: "BoltCharge Pro — EV Charger",
      productDesc: "Ultra-fast home EV charger that charges any electric vehicle to 80% in under 30 minutes. Smart scheduling, solar integration, and sleek design.",
      tone: "professional",
      audience: "EV owners and tech-savvy homeowners",
      platforms: "facebook,linkedin,google-ads",
      provider: "glm",
      headline: "80% Charge in Under 30 Minutes — At Home",
      tagline: "Power Without the Wait",
      adCopy: "Stop planning your life around charging stops. The BoltCharge Pro delivers ultra-fast Level 3 charging to your garage, getting any EV to 80% in under 30 minutes. Smart scheduling automatically charges during off-peak hours to save you money, while seamless solar integration means you can power your commute with sunshine. Installation is professional, fast, and hassle-free. Your EV deserves better than a standard wall outlet.",
      callToAction: "Upgrade Your Home Charging",
      targetAudience: "Tech-forward EV owners aged 30-55 who value efficiency and sustainability. They're homeowners with garages who currently rely on slow Level 1 chargers or public charging stations. They appreciate smart home integration and long-term cost savings.",
      keyBenefits: "• Ultra-fast charging: 80% in under 30 minutes for any EV\n• Smart scheduling saves an average of $420/year on electricity\n• Seamless solar panel integration for zero-emission charging",
      platformVersions: "Facebook: Target EV owner groups and sustainability communities. Show before/after of garage installations. Use video of the actual charging speed.\n\nLinkedIn: Position as a smart home investment. Target professionals in tech, engineering, and sustainability sectors. Share ROI calculations.\n\nGoogle Ads: Capture high-intent searches for 'fast home EV charger', 'Level 3 home charger', 'EV charger installation'. Lead with the 30-minute stat.",
      status: "completed",
      isFavorite: false,
      rating: 4,
      tags: "ev,technology,sustainable",
    },
  ];

  for (const c of campaigns) {
    await prisma.campaign.upsert({
      where: { id: c.id },
      update: {},
      create: c,
    });
  }

  console.log(`Seeded ${campaigns.length} campaigns`);

  // Seed API usage
  const usageData = [
    { userId: "demo-user", provider: "gemini", endpoint: "generate", tokensUsed: 1250, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    { userId: "demo-user", provider: "deepseek", endpoint: "generate", tokensUsed: 980, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
    { userId: "demo-user", provider: "glm", endpoint: "generate", tokensUsed: 1100, createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
    { userId: "demo-user", provider: "gemini", endpoint: "regenerate", tokensUsed: 320, createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    { userId: "demo-user", provider: "deepseek", endpoint: "generate", tokensUsed: 1450, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
  ];

  for (const u of usageData) {
    await prisma.apiUsage.create({ data: u });
  }

  console.log(`Seeded ${usageData.length} API usage records`);
  console.log("\nDatabase seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
