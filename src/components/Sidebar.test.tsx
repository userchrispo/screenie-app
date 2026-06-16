import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Sidebar, type SidebarCounts } from './Sidebar';

const counts: SidebarCounts = {
  inbox: 2,
  library: 5,
  favorites: 1,
  tags: 3,
  trash: 0,
  projects: 1
};

describe('Sidebar project dialog', () => {
  it('creates a project through the app dialog', async () => {
    const user = userEvent.setup();
    const onAddProject = vi.fn();

    render(
      <Sidebar
        activeView="find"
        counts={counts}
        projects={[]}
        activeProjectId={null}
        onNavigate={vi.fn()}
        onSelectProject={vi.fn()}
        onClearProject={vi.fn()}
        onAddProject={onAddProject}
        onRenameProject={vi.fn()}
        onRemoveProject={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Add project' }));

    const dialog = screen.getByRole('dialog', { name: 'New project' });
    await user.click(within(dialog).getByRole('button', { name: 'Create project' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a project name.');

    await user.type(screen.getByLabelText('Project name'), 'Pricing research');
    await user.click(within(dialog).getByRole('button', { name: 'Create project' }));

    expect(onAddProject).toHaveBeenCalledWith('Pricing research');
  });
});
