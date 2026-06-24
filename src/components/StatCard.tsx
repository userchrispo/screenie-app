import type { ReactNode } from 'react';

export type StatTone = 'neutral' | 'blue' | 'violet' | 'teal' | 'green' | 'amber';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatTone;
  sub?: ReactNode;
}

const toneClass: Record<StatTone, string> = {
  neutral: '',
  blue: 'tile-blue',
  violet: 'tile-violet',
  teal: 'tile-teal',
  green: 'tile-green',
  amber: 'tile-amber'
};

export function StatCard({ label, value, icon, tone = 'neutral', sub }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card__head">
        {icon ? (
          <span className={`stat-card__icon ${toneClass[tone]}`.trim()} aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span>{label}</span>
      </div>
      <span className="stat-card__value">{value}</span>
      {sub ? <span className="stat-card__sub">{sub}</span> : null}
    </div>
  );
}
