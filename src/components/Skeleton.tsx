import type { CSSProperties } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  radius?: string | number;
}

export function Skeleton({ className = '', width, height, radius }: SkeletonProps) {
  const style: CSSProperties = {
    width,
    height,
    borderRadius: radius
  };

  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

interface SkeletonListProps {
  count?: number;
  label?: string;
}

export function SkeletonList({ count = 3, label = 'Loading' }: SkeletonListProps) {
  return (
    <div className="skeleton-list" role="status" aria-busy="true" aria-label={label}>
      {Array.from({ length: count }).map((_, index) => (
        <Skeleton key={index} className="skeleton-card" />
      ))}
      <span className="sr-only">{label}…</span>
    </div>
  );
}
