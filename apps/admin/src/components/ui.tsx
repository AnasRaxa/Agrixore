import type { ButtonHTMLAttributes, ReactNode } from 'react';

export const inputClass =
  'w-full rounded-xl border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted/70 disabled:bg-paper disabled:text-muted';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';
const variants: Record<Variant, string> = {
  primary: 'bg-leaf text-white hover:bg-canopy disabled:bg-leaf/50',
  secondary: 'border border-line bg-surface text-canopy hover:bg-tint disabled:text-muted',
  danger: 'border border-clay/40 bg-surface text-clay hover:bg-clay-tint',
  ghost: 'text-canopy hover:bg-tint',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-semibold transition-colors disabled:cursor-not-allowed ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-2xl border border-line bg-surface p-4 sm:p-6 ${className}`}>{children}</section>;
}

type Tone = 'info' | 'warn' | 'error' | 'success';
const tones: Record<Tone, string> = {
  info: 'bg-tint text-canopy',
  warn: 'bg-grain-tint text-grain',
  error: 'bg-clay-tint text-clay',
  success: 'bg-tint text-canopy',
};
export function Notice({ tone = 'info', children, live }: { tone?: Tone; children: ReactNode; live?: boolean }) {
  return (
    <div role={live ? (tone === 'error' ? 'alert' : 'status') : undefined} className={`rounded-xl px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return <p role="status" className="py-8 text-center text-muted">{label}…</p>;
}
