'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signUpSchema } from '@/lib/validations';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch('password', '');

  const getPasswordStrength = (pwd: string): { label: string; color: string } => {
    if (pwd.length === 0) return { label: '', color: '' };
    if (pwd.length < 6) return { label: 'Weak', color: 'var(--status-red)' };
    if (pwd.length < 8) return { label: 'Fair', color: 'var(--status-orange)' };
    if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Strong', color: 'var(--status-green)' };
    return { label: 'Fair', color: 'var(--status-orange)' };
  };

  const strength = getPasswordStrength(password);

  const onSubmit = async (data: { name: string; email: string; password: string }) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        toast.error(error.error || 'Registration failed');
        return;
      }

      toast.success('Account created! Please sign in.');
      router.push('/signin');
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--cream)', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: 400, background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 4px 24px rgba(26,24,20,0.08)', padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, background: 'var(--ink)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color="#fff" />
            </div>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: 22, fontWeight: 700, color: 'var(--ink)' }}>
              Ad<span style={{ color: 'var(--primary)' }}>Forge</span>
            </span>
          </Link>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 24, fontWeight: 600, color: 'var(--ink)', marginTop: 24, marginBottom: 8 }}>Create your account</h1>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>Start creating professional ad campaigns</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Name</label>
            <input
              {...register('name')}
              type="text"
              placeholder="John Doe"
              style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
            />
            {errors.name && <p style={{ fontSize: 12, color: 'var(--destructive)', marginTop: 4 }}>{String(errors.name.message)}</p>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Email</label>
            <input
              {...register('email')}
              type="email"
              placeholder="you@example.com"
              style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
            />
            {errors.email && <p style={{ fontSize: 12, color: 'var(--destructive)', marginTop: 4 }}>{String(errors.email.message)}</p>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Password</label>
            <input
              {...register('password')}
              type="password"
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
            />
            {password && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.label === 'Strong' ? '100%' : strength.label === 'Fair' ? '60%' : '30%', background: strength.color, transition: 'all 0.2s' }} />
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: strength.color }}>{strength.label}</span>
              </div>
            )}
            {errors.password && <p style={{ fontSize: 12, color: 'var(--destructive)', marginTop: 4 }}>{String(errors.password.message)}</p>}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase', color: 'var(--ink-soft)', marginBottom: 8, display: 'block' }}>Confirm Password</label>
            <input
              {...register('confirmPassword')}
              type="password"
              placeholder="••••••••"
              style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
            />
            {errors.confirmPassword && <p style={{ fontSize: 12, color: 'var(--destructive)', marginTop: 4 }}>{String(errors.confirmPassword.message)}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary"
            style={{ width: '100%', padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8 }}
          >
            {isLoading ? <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.7s linear infinite' }} /> : null}
            {isLoading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <p style={{ fontSize: 14, color: 'var(--ink-muted)' }}>
            Already have an account?{' '}
            <Link href="/signin" style={{ color: 'var(--primary)', fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}