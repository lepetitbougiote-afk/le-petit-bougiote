import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  const toneClass = {
    neutral: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-rose-100 text-rose-800',
  }[tone];

  return (
    <span className={cn('inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold', toneClass)}>
      {children}
    </span>
  );
}
