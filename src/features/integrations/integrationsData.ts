import type { StatusBadgeVariant } from '../../components/StatusBadge';

export interface IntegrationItem {
  id: string;
  name: string;
  detail: string;
  status: 'active' | 'coming';
  statusLabel: string;
  statusVariant: StatusBadgeVariant;
}

export const INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'local-storage',
    name: 'Local storage',
    detail: 'IndexedDB on this device',
    status: 'active',
    statusLabel: 'Active',
    statusVariant: 'active'
  },
  {
    id: 'browser-extension',
    name: 'Browser extension',
    detail: 'Quick capture from any tab',
    status: 'coming',
    statusLabel: 'Coming soon',
    statusVariant: 'coming'
  },
  {
    id: 'cloud-sync',
    name: 'Cloud sync',
    detail: 'Sync saves across devices',
    status: 'coming',
    statusLabel: 'Coming soon',
    statusVariant: 'coming'
  }
];
