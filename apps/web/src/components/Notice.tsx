import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

type Tone = 'info' | 'warn' | 'danger';
const TONES: Record<Tone, string> = {
  info: 'bg-tint text-canopy',
  warn: 'bg-grain-tint text-grain',
  danger: 'bg-clay-tint text-clay',
};

export function Notice({ tone = 'info', icon, title, children, className }: { tone?: Tone; icon?: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div role={tone === 'info' ? 'status' : 'alert'} className={cn('flex gap-3 rounded-2xl p-4', TONES[tone], className)}>
      {icon && <span className="mt-0.5 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={cn('text-[0.95rem]', title && 'mt-0.5')}>{children}</div>}
      </div>
    </div>
  );
}
