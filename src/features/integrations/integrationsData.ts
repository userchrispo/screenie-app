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
    id: 'local-ocr',
    name: 'Local OCR',
    detail: 'Browser-side text recognition for images and screenshots',
    status: 'active',
    statusLabel: 'Active',
    statusVariant: 'active'
  },
  {
    id: 'browser-extension',
    name: 'Browser extension',
    detail: 'App-side bridge ready for reviewed captures',
    status: 'active',
    statusLabel: 'Bridge ready',
    statusVariant: 'progress'
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
