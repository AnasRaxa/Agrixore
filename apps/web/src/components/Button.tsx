import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

type Variant = 'primary' | 'soft' | 'light' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-leaf text-white',
  soft: 'bg-tint text-canopy',
  light: 'bg-white text-canopy',
  ghost: 'text-leaf',
  danger: 'bg-clay-tint text-clay',
};

/** Class names for anything that should look like a button (also used on router links). */
export function buttonClass(variant: Variant = 'primary', className?: string): string {
  return cn(
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-transform active:scale-[0.98] disabled:opacity-50',
    VARIANTS[variant],
    className,
  );
}

export function Button({ variant = 'primary', className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type={type} className={buttonClass(variant, className)} {...props} />;
}
