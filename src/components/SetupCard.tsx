import type { ReactNode } from 'react';
import { StatusBadge, type StatusBadgeVariant } from './StatusBadge';

interface SetupCardProps {
  icon: ReactNode;
  title: string;
  caption: string;
  status?: { variant: StatusBadgeVariant; label: string };
  action?: ReactNode;
}

export function SetupCard({ icon, title, caption, status, action }: SetupCardProps) {
  return (
    <div className="setup-card">
      <span className="setup-card__icon" aria-hidden="true">
        {icon}
      </span>
      <div className="setup-card__copy">
        <strong>{title}</strong>
        <span>{caption}</span>
      </div>
      {status ? <StatusBadge variant={status.variant}>{status.label}</StatusBadge> : null}
      {action ? <div className="setup-card__action">{action}</div> : null}
    </div>
  );
}
