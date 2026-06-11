import type { ReactNode } from 'react';

interface ViewTransitionProps {
  viewKey: string;
  children: ReactNode;
}

export function ViewTransition({ viewKey, children }: ViewTransitionProps) {
  return (
    <div
      key={viewKey}
      className="view-transition"
      data-view={viewKey}
      role="region"
      aria-label={`${viewKey} view`}
    >
      {children}
    </div>
  );
}
