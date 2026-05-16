'use client';

import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Sparkles, LayoutDashboard, Wand2, Layers, LayoutGrid, Palette, BarChart3, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/generate', icon: Wand2, label: 'Generate' },
  { href: '/campaigns', icon: Layers, label: 'Campaigns' },
  { href: '/templates', icon: LayoutGrid, label: 'Templates' },
  { href: '/brand-kits', icon: Palette, label: 'Brand Kits' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (status === 'unauthenticated') {
    redirect('/signin');
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <aside style={{ width: 240, background: 'var(--white)', borderRight: '1px solid var(--border)', position: 'fixed', height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: 20, borderBottom: '1px solid var(--border)' }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 32, height: 32, background: 'var(--ink)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={18} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
              Ad<span style={{ color: 'var(--primary)' }}>Forge</span>
            </span>
          </Link>
        </div>

        <nav style={{ flex: 1, padding: 16, display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'nav-item',
                  isActive && 'active'
                )}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 14px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: 500,
                  color: isActive ? 'var(--primary)' : 'var(--ink-soft)',
                  background: isActive ? 'var(--terracotta-light)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <item.icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 12, color: 'var(--ink-muted)', marginBottom: 8 }}>Free Plan</div>
          <div style={{ background: 'var(--border-soft)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
            <div style={{ width: '20%', height: '100%', background: 'var(--primary)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-muted)', marginTop: 4 }}>1 / 5 campaigns this month</div>
        </div>
      </aside>

      <main style={{ flex: 1, marginLeft: 240, display: 'flex', flexDirection: 'column' }}>
        <header style={{ height: 64, background: 'var(--white)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', position: 'sticky', top: 0, zIndex: 50 }}>
          <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
            {navItems.find((item) => pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))?.label || 'Dashboard'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {session?.user?.name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 6, cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--terracotta-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', fontWeight: 600, fontSize: 14 }}>
                  {session.user.name.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{session.user.name}</span>
              </div>
            )}
          </div>
        </header>

        <div style={{ flex: 1, padding: 24 }}>
          {children}
        </div>
      </main>
    </div>
  );
}