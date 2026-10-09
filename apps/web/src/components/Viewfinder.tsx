import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Camera-frame corners: the one recurring motif of the app (scan button, photo, result). Symmetric, so safe in RTL. */
export function Viewfinder({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('grid place-items-center', !className?.includes('absolute') && 'relative', className)}>
      <svg aria-hidden="true" viewBox="0 0 100 100" className="absolute inset-0 size-full" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path vectorEffect="non-scaling-stroke" d="M4 28V12a8 8 0 0 1 8-8h16" />
        <path vectorEffect="non-scaling-stroke" d="M72 4h16a8 8 0 0 1 8 8v16" />
        <path vectorEffect="non-scaling-stroke" d="M96 72v16a8 8 0 0 1-8 8H72" />
        <path vectorEffect="non-scaling-stroke" d="M28 96H12a8 8 0 0 1-8-8V72" />
      </svg>
      {children}
    </div>
  );
}
