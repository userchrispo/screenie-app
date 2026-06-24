import {
  Bookmark,
  ChevronDown,
  Folder,
  Inbox,
  LayoutTemplate,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Puzzle,
  Search,
  Settings,
  Sparkles,
  Star,
  Tags,
  Trash2,
  X,
  type LucideIcon
} from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Project, ScreenieView } from '../domain/savedItem';
import { SectionLabel } from './SectionLabel';
import { SurfaceCard } from './SurfaceCard';

export interface SidebarCounts {
  inbox: number;
  library: number;
  favorites: number;
  tags: number;
  trash: number;
  projects: number;
}

interface SidebarProps {
  activeView: ScreenieView;
  counts: SidebarCounts;
  projects: Project[];
  activeProjectId: string | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  onNavigate: (view: ScreenieView) => void;
  onSelectProject: (projectId: string) => void;
  onClearProject: () => void;
  onAddProject: (name: string) => void;
  onRenameProject: (projectId: string, name: string) => void;
  onRemoveProject: (projectId: string) => void;
}

interface NavItem {
  id: ScreenieView;
  label: string;
  icon: LucideIcon;
  count?: number;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

export function Sidebar({
  activeView,
  counts,
  projects,
  activeProjectId,
  collapsed = false,
  onToggleCollapse,
  onNavigate,
  onSelectProject,
  onClearProject,
  onAddProject,
  onRenameProject,
  onRemoveProject
}: SidebarProps) {
  const isFind = activeView === 'find';
  const [projectDialog, setProjectDialog] = useState<{ mode: 'create' } | { mode: 'rename'; project: Project } | null>(null);
  const [deleteProject, setDeleteProject] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [projectError, setProjectError] = useState('');
  const projectInputRef = useRef<HTMLInputElement>(null);

  const sections: NavSection[] = [
    {
      label: 'Main',
      items: [
        { id: 'inbox', label: 'Inbox', icon: Inbox, count: counts.inbox },
        { id: 'find', label: 'Find', icon: Search }
      ]
    },
    {
      label: 'Browse',
      items: [
        { id: 'library', label: 'Library', icon: Bookmark, count: counts.library },
        { id: 'favorites', label: 'Favorites', icon: Star, count: counts.favorites },
        { id: 'tags', label: 'Tags', icon: Tags, count: counts.tags },
        { id: 'trash', label: 'Trash', icon: Trash2, count: counts.trash }
      ]
    },
    {
      label: 'Workspace',
      items: [
        { id: 'integrations', label: 'Integrations', icon: Puzzle },
        { id: 'templates', label: 'Templates', icon: LayoutTemplate },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  useEffect(() => {
    if (projectDialog) {
      projectInputRef.current?.focus();
    }
  }, [projectDialog]);

  useEffect(() => {
    if (!projectDialog && !deleteProject) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeProjectDialog();
        setDeleteProject(null);
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [deleteProject, projectDialog]);

  function openProjectDialog() {
    setProjectName('');
    setProjectError('');
    setProjectDialog({ mode: 'create' });
  }

  function openRenameProjectDialog(project: Project) {
    setProjectName(project.name);
    setProjectError('');
    setProjectDialog({ mode: 'rename', project });
  }

  function closeProjectDialog() {
    setProjectDialog(null);
    setProjectError('');
  }

  function handleProjectSubmit(event: FormEvent<HTMLElement>) {
    event.preventDefault();
    const name = projectName.trim();
    if (!name) {
      setProjectError('Enter a project name.');
      return;
    }

    if (projectDialog?.mode === 'rename') {
      onRenameProject(projectDialog.project.id, name);
    } else {
      onAddProject(name);
    }
    closeProjectDialog();
  }

  function handleRemoveProject(project: Project) {
    onRemoveProject(project.id);
    if (activeProjectId === project.id) {
      onClearProject();
    }
    setDeleteProject(null);
  }

  return (
    <aside
      className={`sidebar${collapsed ? ' sidebar--collapsed' : ''}`}
      aria-label="Primary navigation"
    >
      <div className="sidebar-header">
        <button className="brand" type="button" onClick={() => onNavigate('inbox')}>
          <span className="brand-icon" aria-hidden="true">
            <span />
          </span>
          <span className="brand__label">Screenie</span>
        </button>
        {onToggleCollapse ? (
          <button
            type="button"
            className="icon-button sidebar-collapse-toggle"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <PanelLeftClose size={18} strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="workspace-pill"
        aria-label={`Local workspace settings. ${counts.library} saves, ${counts.projects} projects.`}
        onClick={() => onNavigate('settings')}
      >
        <span className="workspace-pill__avatar" aria-hidden="true">
          S
        </span>
        <span className="workspace-pill__copy">
          <strong>Local workspace</strong>
          <span>
            {counts.library} saves · {counts.projects} projects
          </span>
        </span>
        <ChevronDown size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>

      <div className="sidebar-scroll">
        {sections.map((section) => (
          <nav key={section.label} className="nav-section" aria-label={section.label}>
            <SectionLabel>{section.label}</SectionLabel>
            <div className="nav-group nav-rail">
              {section.items.map((item) => (
                <SidebarButton
                  key={item.id}
                  item={item}
                  collapsed={collapsed}
                  isActive={activeView === item.id}
                  onClick={() => onNavigate(item.id)}
                />
              ))}
            </div>
          </nav>
        ))}

        {isFind ? (
          <div key="find-context" className="sidebar-context">
            <section className="sidebar-projects" aria-labelledby="projects-title">
              <div className="sidebar-projects__title" id="projects-title">
                <span className="icon-slot">
                  <Folder size={18} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <span>Projects</span>
                <button type="button" aria-label="Add project" onClick={openProjectDialog}>
                  <Plus size={18} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </div>
              <ul>
                {activeProjectId ? (
                  <li>
                    <button type="button" className="sidebar-projects__clear" onClick={onClearProject}>
                      All projects
                    </button>
                  </li>
                ) : null}
                {projects.map((project) => (
                  <li key={project.id}>
                    <div className="sidebar-projects__row">
                      <button
                        type="button"
                        aria-current={activeProjectId === project.id ? 'true' : undefined}
                        className={activeProjectId === project.id ? 'is-active' : undefined}
                        onClick={() => onSelectProject(project.id)}
                      >
                        {project.name}
                      </button>
                      <span className="sidebar-projects__actions">
                        <button
                          type="button"
                          aria-label={`Rename ${project.name}`}
                          onClick={() => openRenameProjectDialog(project)}
                        >
                          <Pencil size={14} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Delete ${project.name}`}
                          onClick={() => setDeleteProject(project)}
                        >
                          <Trash2 size={14} strokeWidth={1.5} aria-hidden="true" />
                        </button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        ) : null}
      </div>

      <p className="sidebar-quick-save" aria-label="Quick save shortcut">
        <Sparkles size={16} strokeWidth={1.5} aria-hidden="true" />
        <span>
          Quick save <kbd>Ctrl + Shift + S</kbd>
        </span>
      </p>

      {projectDialog ? (
        <div className="app-overlay app-overlay--center" role="presentation" onClick={closeProjectDialog}>
          <SurfaceCard
            as="form"
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-dialog-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={handleProjectSubmit}
          >
            <div className="modal-panel__header">
              <h2 id="project-dialog-title">{projectDialog.mode === 'rename' ? 'Rename project' : 'New project'}</h2>
              <button type="button" className="icon-button" aria-label="Close project dialog" onClick={closeProjectDialog}>
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <label htmlFor="project-name-input">Project name</label>
            <input
              ref={projectInputRef}
              id="project-name-input"
              value={projectName}
              onChange={(event) => {
                setProjectName(event.target.value);
                setProjectError('');
              }}
              placeholder="Pricing research"
            />
            {projectError ? (
              <p className="modal-panel__error" role="alert">
                {projectError}
              </p>
            ) : null}
            <div className="modal-panel__actions">
              <button type="button" className="ghost-button" onClick={closeProjectDialog}>
                Cancel
              </button>
              <button type="submit" className="ghost-button ghost-button--primary">
                {projectDialog.mode === 'rename' ? 'Rename project' : 'Create project'}
              </button>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
      {deleteProject ? (
        <div className="app-overlay app-overlay--center" role="presentation" onClick={() => setDeleteProject(null)}>
          <SurfaceCard
            as="section"
            className="modal-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-project-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-panel__header">
              <h2 id="delete-project-title">Delete project</h2>
              <button type="button" className="icon-button" aria-label="Close delete project dialog" onClick={() => setDeleteProject(null)}>
                <X size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
            <p className="text-muted">
              Delete "{deleteProject.name}"? Saved items stay in Screenie and move back to Inbox.
            </p>
            <div className="modal-panel__actions">
              <button type="button" className="ghost-button" onClick={() => setDeleteProject(null)}>
                Cancel
              </button>
              <button type="button" className="ghost-button ghost-button--danger" onClick={() => handleRemoveProject(deleteProject)}>
                Delete project
              </button>
            </div>
          </SurfaceCard>
        </div>
      ) : null}
    </aside>
  );
}

function SidebarButton({
  item,
  collapsed,
  isActive,
  onClick
}: {
  item: NavItem;
  collapsed: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const ariaLabel =
    typeof item.count === 'number' ? `${item.label} (${item.count})` : item.label;

  return (
    <button
      className={`nav-item${isActive ? ' nav-item--active' : ''}`}
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
      aria-label={collapsed ? ariaLabel : undefined}
    >
      <span className="icon-slot">
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="nav-item__label">{item.label}</span>
      {typeof item.count === 'number' ? <span className="nav-count">{item.count}</span> : null}
    </button>
  );
}
