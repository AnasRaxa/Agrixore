import type { ButtonHTMLAttributes } from 'react';
import { cn } from '../lib/cn';

export function Chip({ selected, className, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-base font-medium transition-colors',
        selected ? 'border-leaf bg-leaf text-white' : 'border-line bg-surface text-ink hover:border-leaf',
        className,
      )}
      {...props}
    />
  );
}
