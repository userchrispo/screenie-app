import {
  Bookmark,
  ChevronDown,
  Folder,
  Inbox,
  LayoutTemplate,
  Plus,
  Puzzle,
  Search,
  Settings,
  Sparkles,
  Star,
  Tags,
  Trash2,
  type LucideIcon
} from 'lucide-react';
import type { Project, ScreenieView } from '../domain/savedItem';
import { SectionLabel } from './SectionLabel';

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
  onNavigate: (view: ScreenieView) => void;
  onSelectProject: (projectId: string) => void;
  onClearProject: () => void;
  onAddProject: (name: string) => void;
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
  onNavigate,
  onSelectProject,
  onClearProject,
  onAddProject
}: SidebarProps) {
  const isFind = activeView === 'find';

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

  function handleAddProject() {
    const name = window.prompt('Project name');
    if (name?.trim()) {
      onAddProject(name.trim());
    }
  }

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <button className="brand" type="button" onClick={() => onNavigate('inbox')}>
        <span className="brand-icon" aria-hidden="true">
          <span />
        </span>
        <span>Screenie</span>
      </button>

      <button
        type="button"
        className="workspace-pill"
        aria-label="Local workspace settings"
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
                <button type="button" aria-label="Add project" onClick={handleAddProject}>
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
                    <button
                      type="button"
                      aria-current={activeProjectId === project.id ? 'true' : undefined}
                      className={activeProjectId === project.id ? 'is-active' : undefined}
                      onClick={() => onSelectProject(project.id)}
                    >
                      {project.name}
                    </button>
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
    </aside>
  );
}

function SidebarButton({
  item,
  isActive,
  onClick
}: {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;

  return (
    <button
      className={`nav-item${isActive ? ' nav-item--active' : ''}`}
      type="button"
      onClick={onClick}
      aria-current={isActive ? 'page' : undefined}
    >
      <span className="icon-slot">
        <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="nav-item__label">{item.label}</span>
      {typeof item.count === 'number' ? <span className="nav-count">{item.count}</span> : null}
    </button>
  );
}
