import { LayoutTemplate } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { SetupCard } from '../../components/SetupCard';
import { SurfaceCard } from '../../components/SurfaceCard';
import { CAPTURE_TEMPLATES, type CaptureTemplate } from './templatesData';

interface TemplatesViewProps {
  onSelectTemplate: (template: CaptureTemplate) => void;
}

export function TemplatesView({ onSelectTemplate }: TemplatesViewProps) {
  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="templates-title"
        title="Templates"
        subtitle="Pick a template to pre-fill capture on your inbox."
      />

      <div className="setup-card-stack" role="list" aria-labelledby="templates-title">
        {CAPTURE_TEMPLATES.map((template) => (
          <SurfaceCard key={template.id} flatStack role="listitem">
            <SetupCard
              icon={<LayoutTemplate size={20} strokeWidth={1.5} />}
              title={template.name}
              caption={template.caption}
              action={
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => onSelectTemplate(template)}
                >
                  Use template
                </button>
              }
            />
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
