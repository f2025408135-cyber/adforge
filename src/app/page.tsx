'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Sparkles, GitCompare, Palette, Users, Download, ArrowRight, Zap, FileText, Brain } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'Multi-AI Provider Support',
    description: 'Choose from Gemini, DeepSeek, or GLM for different copywriting styles.',
  },
  {
    icon: FileText,
    title: '7-Section Campaign Output',
    description: 'Get headline, tagline, ad copy, CTA, audience, benefits, and platform versions.',
  },
  {
    icon: GitCompare,
    title: 'A/B Variant Testing',
    description: 'Generate and compare multiple variants to find the best performing copy.',
  },
  {
    icon: Palette,
    title: 'Brand Kit Integration',
    description: 'Maintain consistent brand voice across all your campaigns.',
  },
  {
    icon: Users,
    title: 'Real-time Collaboration',
    description: 'Share campaigns with your team and collaborate in real-time.',
  },
  {
    icon: Download,
    title: 'Professional Export',
    description: 'Export to PDF, DOCX, Markdown, TXT, or JSON for any use case.',
  },
];

const steps = [
  {
    number: '01',
    title: 'Fill the Brief',
    description: 'Enter your product name, description, choose tone and target platforms.',
  },
  {
    number: '02',
    title: 'AI Generates Campaign',
    description: 'Our AI creates all 7 sections in seconds using proven copywriting frameworks.',
  },
  {
    number: '03',
    title: 'Refine & Export',
    description: 'Regenerate individual sections, compare variants, and export for publishing.',
  },
];

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for testing',
    features: ['5 campaigns/month', 'Basic tones', 'Email support'],
    cta: 'Get Started',
  },
  {
    name: 'Pro',
    price: '$19',
    description: 'For serious marketers',
    features: ['Unlimited campaigns', 'All tones & templates', 'Brand kits', 'Priority support'],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams',
    features: ['Everything in Pro', 'Custom templates', 'API access', 'Dedicated support'],
    cta: 'Contact Sales',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <header className="header" style={{ position: 'relative', background: 'transparent', borderBottom: '1px solid var(--border)' }}>
        <div className="sidebar-logo">
          <div style={{ width: 32, height: 32, background: 'var(--ink)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={18} color="#fff" />
          </div>
          <span>Ad<span style={{ color: 'var(--primary)' }}>Forge</span></span>
        </div>
        <div className="header-right">
          <Link href="/signin" className="btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            Sign In
          </Link>
          <Link href="/signup" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>
            Start Free
          </Link>
        </div>
      </header>

      <section style={{ background: 'var(--white)', borderBottom: '1px solid var(--border)', padding: '64px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 11, fontWeight: 600, letterSpacing: '1.2px', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 20 }}>
              <span style={{ display: 'block', width: 24, height: 2, background: 'var(--primary)', borderRadius: 2 }}></span>
              AI-Powered Platform
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 48, fontWeight: 700, lineHeight: 1.15, marginBottom: 20, color: 'var(--ink)' }}>
              Campaign copy that<br /><em style={{ fontStyle: 'italic', color: 'var(--primary)' }}>actually converts.</em>
            </h1>
            <p style={{ fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.7, marginBottom: 32 }}>
              Input your product, select your tone and platforms — AdForge generates complete, ready-to-publish advertisement campaigns in seconds.
            </p>
            <div style={{ display: 'flex', gap: 16, marginBottom: 48 }}>
              <Link href="/signup" className="btn-primary" style={{ padding: '14px 28px', fontSize: 15, display: 'flex', alignItems: 'center', gap: 8 }}>
                Start Creating <ArrowRight size={16} />
              </Link>
              <button className="btn-secondary" style={{ padding: '14px 28px', fontSize: 15 }} onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}>
                See How It Works
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
              {[
                { number: '5x', label: 'Faster' },
                { number: '7', label: 'Output Sections' },
                { number: '3', label: 'AI Models' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  style={{ background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, padding: 20, textAlign: 'center' }}
                >
                  <div style={{ fontFamily: 'var(--font-serif)', fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{stat.number}</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '0.6px', fontWeight: 500 }}>{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ display: 'flex', justifyContent: 'center' }}
          >
            <div style={{ width: '100%', maxWidth: 480, aspectRatio: '4/3', background: 'linear-gradient(135deg, var(--cream) 0%, var(--accent) 100%)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)', boxShadow: '0 24px 48px rgba(26,24,20,0.1)' }}>
              <div style={{ textAlign: 'center', padding: 32 }}>
                <Sparkles size={48} style={{ color: 'var(--primary)', marginBottom: 16 }} />
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>AI Campaign Generator</div>
                <div style={{ fontSize: 14, color: 'var(--ink-muted)', marginTop: 8 }}>Professional ads in seconds</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Everything You Need</h2>
          <p style={{ fontSize: 16, color: 'var(--ink-muted)', maxWidth: 500, margin: '0 auto' }}>Powerful features to create campaigns that convert</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 28, transition: 'box-shadow 0.2s' }}
              className="card"
            >
              <div style={{ width: 48, height: 48, background: 'var(--terracotta-light)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <feature.icon size={24} style={{ color: 'var(--primary)' }} />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>{feature.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section id="how-it-works" style={{ background: 'var(--cream)', padding: '80px 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>How It Works</h2>
            <p style={{ fontSize: 16, color: 'var(--ink-muted)' }}>Three simple steps to your perfect campaign</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 32 }}>
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                style={{ textAlign: 'center', position: 'relative' }}
              >
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: 64, fontWeight: 700, color: 'var(--border)', position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', zIndex: 0 }}>{step.number}</div>
                <div style={{ position: 'relative', zIndex: 1, paddingTop: 32 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>{step.title}</h3>
                  <p style={{ fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 48px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>Simple Pricing</h2>
          <p style={{ fontSize: 16, color: 'var(--ink-muted)' }}>Start free, upgrade when you&apos;re ready</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: 'var(--white)',
                border: plan.popular ? '2px solid var(--primary)' : '1px solid var(--border)',
                borderRadius: 16,
                padding: 32,
                position: 'relative',
              }}
            >
              {plan.popular && (
                <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--primary)', color: 'white', padding: '4px 16px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>Most Popular</div>
              )}
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{plan.name}</h3>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: 36, fontWeight: 700, color: 'var(--ink)', marginBottom: 4 }}>{plan.price}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-muted)' }}>/mo</span></div>
              <p style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 24 }}>{plan.description}</p>
              <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24 }}>
                {plan.features.map((feature, j) => (
                  <li key={j} style={{ fontSize: 14, color: 'var(--ink-soft)', padding: '8px 0', borderBottom: j < plan.features.length - 1 ? '1px solid var(--border)' : 'none' }}>
                    ✓ {feature}
                  </li>
                ))}
              </ul>
              <button className={plan.popular ? 'btn-primary' : 'btn-secondary'} style={{ width: '100%' }}>
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </section>

      <section style={{ background: 'var(--ink)', padding: '80px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 32, fontWeight: 600, color: 'white', marginBottom: 16 }}>Ready to create campaigns that convert?</h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>Join thousands of marketers using AdForge to create professional ad campaigns in seconds.</p>
        <Link href="/signup" className="btn-primary" style={{ padding: '16px 32px', fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Start Your Free Campaign <ArrowRight size={18} />
        </Link>
      </section>

      <footer style={{ borderTop: '1px solid var(--border)', padding: '24px 48px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>
          Ad<span style={{ color: 'var(--primary)' }}>Forge</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--ink-muted)' }}>
          © 2025 AdForge — AI Campaign Generator
        </div>
      </footer>
    </div>
  );
}