import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

/** Collapsible block built on native <details>, so it is keyboard and screen-reader friendly. */
export function Section({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="group rounded-2xl border border-line bg-surface">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 font-semibold">
        {title}
        <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-3 border-t border-line px-4 py-4">{children}</div>
    </details>
  );
}
