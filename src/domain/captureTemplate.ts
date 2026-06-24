export type TemplateMode = 'snippet' | 'link';
export type TemplateCategory = 'notes' | 'dev' | 'research' | 'personal';
export type TemplateTone = 'blue' | 'violet' | 'teal' | 'green' | 'amber';

export interface CaptureTemplate {
  id: string;
  name: string;
  mode: TemplateMode;
  body: string;
  caption: string;
  category: TemplateCategory;
  description?: string;
  tags?: string[];
  tone?: TemplateTone;
  isCustom?: boolean;
  createdAt?: string;
}

export interface CaptureTemplateInput {
  name: string;
  mode: TemplateMode;
  body: string;
  caption?: string;
  category: TemplateCategory;
  description?: string;
  tags?: string[];
  tone?: TemplateTone;
  now?: string;
}

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  notes: 'Notes',
  dev: 'Development',
  research: 'Research',
  personal: 'Personal'
};

export function createCaptureTemplate(input: CaptureTemplateInput): CaptureTemplate {
  const now = input.now ?? new Date().toISOString();

  return {
    id: `template-${createId()}`,
    name: input.name.trim() || 'Untitled template',
    mode: input.mode,
    body: input.body,
    caption: (input.caption ?? input.description ?? '').trim(),
    category: input.category,
    description: input.description?.trim() || undefined,
    tags: normalizeTemplateTags(input.tags),
    tone: input.tone,
    isCustom: true,
    createdAt: now
  };
}

export function normalizeTemplateTags(tags: string[] | undefined): string[] {
  if (!tags) {
    return [];
  }

  const normalized = tags
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean);

  return Array.from(new Set(normalized));
}

export function parseTemplateTags(value: string): string[] {
  return normalizeTemplateTags(value.split(','));
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
