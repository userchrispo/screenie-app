import { Link as LinkIcon, Pencil, Plus, Quote, Trash2, Type, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { SurfaceCard } from '../../components/SurfaceCard';
import { Button } from '../../components/Button';
import { Field, Input, Select, Textarea } from '../../components/Field';
import { EmptyState } from '../../components/EmptyState';
import { tagColorClass } from '../../lib/tagColor';
import {
  TEMPLATE_CATEGORY_LABELS,
  createCaptureTemplate,
  parseTemplateTags,
  type CaptureTemplate,
  type TemplateCategory,
  type TemplateMode,
  type TemplateTone
} from '../../domain/captureTemplate';
import { CAPTURE_TEMPLATES } from './templatesData';
import { useTemplates } from '../screenie/useTemplates';

interface TemplatesViewProps {
  onSelectTemplate: (template: CaptureTemplate) => void;
}

type CategoryFilter = TemplateCategory | 'all';

const CATEGORY_FILTERS: { value: CategoryFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'notes', label: 'Notes' },
  { value: 'dev', label: 'Development' },
  { value: 'research', label: 'Research' },
  { value: 'personal', label: 'Personal' }
];

const TONE_OPTIONS: TemplateTone[] = ['blue', 'violet', 'teal', 'green', 'amber'];

export function TemplatesView({ onSelectTemplate }: TemplatesViewProps) {
  const { customTemplates, saveTemplate, deleteTemplate } = useTemplates();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<CaptureTemplate | null>(null);
  const [pendingDelete, setPendingDelete] = useState<CaptureTemplate | null>(null);

  const visibleCurated = useMemo(
    () => CAPTURE_TEMPLATES.filter((template) => category === 'all' || template.category === category),
    [category]
  );
  const visibleCustom = useMemo(
    () => customTemplates.filter((template) => category === 'all' || template.category === category),
    [customTemplates, category]
  );

  function openCreate() {
    setEditing(null);
    setEditorOpen(true);
  }

  function openEdit(template: CaptureTemplate) {
    setEditing(template);
    setEditorOpen(true);
  }

  async function handleSave(template: CaptureTemplate) {
    await saveTemplate(template);
    setEditorOpen(false);
    setEditing(null);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    await deleteTemplate(pendingDelete.id);
    setPendingDelete(null);
  }

  return (
    <div className="page-stack workspace-page">
      <PageHeader
        titleId="templates-title"
        eyebrow="Workspace"
        title="Templates"
        subtitle="Start a capture from a reusable structure, or build your own."
        actions={
          <Button
            variant="accent"
            size="sm"
            icon={<Plus size={16} strokeWidth={1.75} aria-hidden="true" />}
            onClick={openCreate}
          >
            New template
          </Button>
        }
      />

      <div className="template-filter" role="group" aria-label="Filter templates by category">
        {CATEGORY_FILTERS.map((filter) => {
          const active = category === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              className={`chip-toggle${active ? ' chip-toggle--active' : ''}`}
              aria-pressed={active}
              onClick={() => setCategory(filter.value)}
            >
              {filter.label}
            </button>
          );
        })}
      </div>

      <SurfaceCard as="section" className="content-section" aria-labelledby="curated-templates-title">
        <div className="section-header">
          <div>
            <h2 id="curated-templates-title">Curated templates</h2>
            <p>Ready-made structures for common capture jobs.</p>
          </div>
        </div>
        {visibleCurated.length > 0 ? (
          <div className="template-grid">
            {visibleCurated.map((template) => (
              <TemplateCard key={template.id} template={template} onUse={() => onSelectTemplate(template)} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Type size={22} strokeWidth={1.5} />}
            title="Nothing in this category."
            description="Switch categories or create a custom template."
          />
        )}
      </SurfaceCard>

      <SurfaceCard as="section" className="content-section" aria-labelledby="custom-templates-title">
        <div className="section-header">
          <div>
            <h2 id="custom-templates-title">Your templates</h2>
            <p>Custom templates are stored locally on this device.</p>
          </div>
        </div>
        {visibleCustom.length > 0 ? (
          <div className="template-grid">
            {visibleCustom.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onUse={() => onSelectTemplate(template)}
                onEdit={() => openEdit(template)}
                onDelete={() => setPendingDelete(template)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Plus size={22} strokeWidth={1.5} />}
            title="No custom templates yet."
            description="Create a template to reuse your own capture structures."
            action={
              <Button variant="secondary" size="sm" onClick={openCreate}>
                New template
              </Button>
            }
          />
        )}
      </SurfaceCard>

      {editorOpen ? (
        <TemplateEditor template={editing} onClose={() => setEditorOpen(false)} onSave={handleSave} />
      ) : null}

      {pendingDelete ? (
        <ConfirmDeleteDialog
          name={pendingDelete.name}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => void handleConfirmDelete()}
        />
      ) : null}
    </div>
  );
}

function TemplateCard({
  template,
  onUse,
  onEdit,
  onDelete
}: {
  template: CaptureTemplate;
  onUse: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const tone = template.tone ?? 'blue';

  return (
    <article className="template-card">
      <div className="template-card__head">
        <span className={`template-card__icon tile-vivid tile-vivid--${tone}`} aria-hidden="true">
          {template.mode === 'link' ? (
            <LinkIcon size={18} strokeWidth={1.75} />
          ) : (
            <Type size={18} strokeWidth={1.75} />
          )}
        </span>
        <div className="template-card__title">
          <strong>{template.name}</strong>
          <span className="template-card__meta">
            {template.mode === 'link' ? 'Link' : 'Text'} · {TEMPLATE_CATEGORY_LABELS[template.category]}
          </span>
        </div>
      </div>

      {template.caption ? <p className="template-card__caption">{template.caption}</p> : null}

      {template.mode === 'snippet' ? (
        <div className="note-preview template-card__preview">
          <span className="note-preview__mark" aria-hidden="true">
            <Quote size={16} strokeWidth={1.75} />
          </span>
          <p className="note-preview__text">{template.body}</p>
        </div>
      ) : (
        <div className="template-card__link" aria-hidden="true">
          <LinkIcon size={14} strokeWidth={1.75} />
          <span>{template.body || 'https://'}</span>
        </div>
      )}

      {template.tags && template.tags.length > 0 ? (
        <div className="tag-cloud template-card__tags">
          {template.tags.map((tag) => (
            <span key={tag} className={`tag-chip ${tagColorClass(tag)}`}>
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="template-card__actions">
        <Button variant="accent" size="sm" onClick={onUse}>
          Use template
        </Button>
        {onEdit ? (
          <button type="button" className="icon-button" aria-label={`Edit ${template.name}`} onClick={onEdit}>
            <Pencil size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
        {onDelete ? (
          <button type="button" className="icon-button" aria-label={`Delete ${template.name}`} onClick={onDelete}>
            <Trash2 size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </article>
  );
}

function TemplateEditor({
  template,
  onClose,
  onSave
}: {
  template: CaptureTemplate | null;
  onClose: () => void;
  onSave: (template: CaptureTemplate) => Promise<void> | void;
}) {
  const [name, setName] = useState(template?.name ?? '');
  const [mode, setMode] = useState<TemplateMode>(template?.mode ?? 'snippet');
  const [templateCategory, setTemplateCategory] = useState<TemplateCategory>(template?.category ?? 'notes');
  const [tone, setTone] = useState<TemplateTone>(template?.tone ?? 'violet');
  const [tags, setTags] = useState((template?.tags ?? []).join(', '));
  const [caption, setCaption] = useState(template?.caption ?? '');
  const [body, setBody] = useState(template?.body ?? '');
  const [error, setError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  function handleSubmit() {
    if (!name.trim()) {
      setError('Give your template a name.');
      return;
    }
    if (!body.trim()) {
      setError('Add some template content.');
      return;
    }

    const parsedTags = parseTemplateTags(tags);

    if (template) {
      void onSave({
        ...template,
        name: name.trim(),
        mode,
        category: templateCategory,
        tone,
        tags: parsedTags,
        caption: caption.trim(),
        body
      });
      return;
    }

    void onSave(
      createCaptureTemplate({
        name,
        mode,
        category: templateCategory,
        tone,
        tags: parsedTags,
        caption,
        body
      })
    );
  }

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onClose}>
      <SurfaceCard
        as="section"
        className="modal-panel modal-panel--wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-editor-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onClose();
          }
        }}
      >
        <div className="modal-panel__header">
          <h2 id="template-editor-title">{template ? 'Edit template' : 'New template'}</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label="Close template editor"
            onClick={onClose}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="template-editor">
          <div className="template-editor__form">
            <Field label="Name" htmlFor="template-name">
              <Input
                id="template-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="e.g. Weekly review"
              />
            </Field>
            <div className="settings-grid">
              <Field label="Type" htmlFor="template-mode">
                <Select id="template-mode" value={mode} onChange={(event) => setMode(event.target.value as TemplateMode)}>
                  <option value="snippet">Text</option>
                  <option value="link">Link</option>
                </Select>
              </Field>
              <Field label="Category" htmlFor="template-category">
                <Select
                  id="template-category"
                  value={templateCategory}
                  onChange={(event) => setTemplateCategory(event.target.value as TemplateCategory)}
                >
                  {Object.entries(TEMPLATE_CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Accent" htmlFor="template-tone">
                <Select id="template-tone" value={tone} onChange={(event) => setTone(event.target.value as TemplateTone)}>
                  {TONE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Description" htmlFor="template-caption" hint="Shown under the template name">
              <Input
                id="template-caption"
                value={caption}
                onChange={(event) => setCaption(event.target.value)}
                placeholder="Short summary"
              />
            </Field>
            <Field label="Tags" htmlFor="template-tags" hint="Comma separated; applied when used">
              <Input
                id="template-tags"
                value={tags}
                onChange={(event) => setTags(event.target.value)}
                placeholder="review, weekly"
              />
            </Field>
            <Field label="Content" htmlFor="template-body" hint={mode === 'link' ? 'Default URL' : 'Template body'}>
              <Textarea
                id="template-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
                rows={mode === 'link' ? 2 : 8}
                placeholder={mode === 'link' ? 'https://' : 'Write your template…'}
              />
            </Field>
            {error ? (
              <p className="modal-panel__error" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          <div className="template-editor__preview" aria-label="Template preview">
            <span className="settings-field-label">Preview</span>
            {mode === 'snippet' ? (
              <div className="note-preview note-preview--lg">
                <span className="note-preview__mark" aria-hidden="true">
                  <Quote size={18} strokeWidth={1.75} />
                </span>
                <p className="note-preview__text">{body || 'Your template will appear here.'}</p>
              </div>
            ) : (
              <div className="template-card__link">
                <LinkIcon size={14} strokeWidth={1.75} />
                <span>{body || 'https://'}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-panel__actions">
          <button type="button" className="ghost-button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="ghost-button ghost-button--primary" onClick={handleSubmit}>
            {template ? 'Save changes' : 'Create template'}
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}

function ConfirmDeleteDialog({
  name,
  onCancel,
  onConfirm
}: {
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  return (
    <div className="app-overlay app-overlay--center" role="presentation" onClick={onCancel}>
      <SurfaceCard
        as="section"
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="template-delete-title"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            onCancel();
          }
        }}
      >
        <div className="modal-panel__header">
          <h2 id="template-delete-title">Delete template</h2>
          <button
            ref={closeButtonRef}
            type="button"
            className="icon-button"
            aria-label="Close dialog"
            onClick={onCancel}
          >
            <X size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>
        <p className="text-muted">Delete &ldquo;{name}&rdquo;? This cannot be undone.</p>
        <div className="modal-panel__actions">
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="ghost-button ghost-button--danger" onClick={onConfirm}>
            Delete template
          </button>
        </div>
      </SurfaceCard>
    </div>
  );
}
