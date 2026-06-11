import type { ReactNode } from 'react';
import { SectionLabel } from './SectionLabel';

interface SettingsSectionProps {
  title: string;
  children: ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <section className="settings-section" aria-labelledby={`settings-${slugify(title)}`}>
      <SectionLabel id={`settings-${slugify(title)}`}>{title}</SectionLabel>
      <div className="settings-section__body">{children}</div>
    </section>
  );
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}
