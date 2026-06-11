import type { ReactNode } from 'react';

export type StatusBadgeVariant = 'active' | 'coming' | 'warning' | 'progress';

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  children: ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  return <span className={`status-badge status-badge--${variant}`}>{children}</span>;
}
