import { CheckCircle2, Clock } from 'lucide-react';
import { PageHeader } from '../../components/PageHeader';
import { SetupCard } from '../../components/SetupCard';
import { SurfaceCard } from '../../components/SurfaceCard';
import { INTEGRATIONS } from './integrationsData';

export function IntegrationsView() {
  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="integrations-title"
        title="Integrations"
        subtitle="Connect Screenie to your tools and storage."
      />

      <div className="setup-card-stack" role="list" aria-labelledby="integrations-title">
        {INTEGRATIONS.map((integration) => (
          <SurfaceCard key={integration.id} flatStack role="listitem">
            <SetupCard
              icon={
                integration.status === 'active' ? (
                  <CheckCircle2 size={20} strokeWidth={1.5} />
                ) : (
                  <Clock size={20} strokeWidth={1.5} />
                )
              }
              title={integration.name}
              caption={integration.detail}
              status={{ variant: integration.statusVariant, label: integration.statusLabel }}
            />
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
