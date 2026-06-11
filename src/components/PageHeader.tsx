import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  titleId?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, titleId, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        <h1 id={titleId} className="page-title">
          {title}
        </h1>
        <p className="text-body text-muted">{subtitle}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
