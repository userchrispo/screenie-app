import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  titleId?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, titleId, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div className="page-header__copy">
        {eyebrow ? <p className="section-label page-header__eyebrow">{eyebrow}</p> : null}
        <h1 id={titleId} className="page-title">
          {title}
        </h1>
        <p className="text-muted">{subtitle}</p>
      </div>
      {actions ? <div className="page-header__actions">{actions}</div> : null}
    </header>
  );
}
