import { createSavedItem, createProject } from './savedItem';
import { createWorkspaceSnapshot, parseWorkspaceSnapshot } from './workspaceSnapshot';

describe('workspace snapshots', () => {
  it('creates a versioned export payload with items and projects', () => {
    const project = createProject({ name: 'Pricing', now: '2026-06-10T12:00:00.000Z' });
    const item = createSavedItem({
      type: 'snippet',
      title: 'Pricing note',
      projectId: project.id,
      now: '2026-06-10T12:00:00.000Z'
    });

    const snapshot = createWorkspaceSnapshot([item], [project], '2026-06-10T13:00:00.000Z');

    expect(snapshot).toMatchObject({
      version: 1,
      exportedAt: '2026-06-10T13:00:00.000Z',
      items: [item],
      projects: [project]
    });
  });

  it('parses valid imported JSON and normalizes missing beta metadata', () => {
    const parsed = parseWorkspaceSnapshot(
      JSON.stringify({
        version: 1,
        exportedAt: '2026-06-10T13:00:00.000Z',
        items: [
          {
            id: 'legacy-item',
            type: 'image',
            title: 'Legacy image',
            tags: ['legacy'],
            isFavorite: false,
            status: 'active',
            createdAt: '2026-06-10T12:00:00.000Z',
            updatedAt: '2026-06-10T12:00:00.000Z'
          }
        ],
        projects: []
      })
    );

    expect(parsed.items[0]).toMatchObject({
      id: 'legacy-item',
      source: 'manual',
      ocrStatus: 'not_applicable'
    });
  });

  it('rejects unsupported or malformed imports with a useful message', () => {
    expect(() => parseWorkspaceSnapshot('not-json')).toThrow('Import file must be valid JSON.');
    expect(() => parseWorkspaceSnapshot(JSON.stringify({ version: 99, items: [], projects: [] }))).toThrow(
      'Unsupported Screenie export version.'
    );
    expect(() => parseWorkspaceSnapshot(JSON.stringify({ version: 1, items: 'nope', projects: [] }))).toThrow(
      'Import file is missing items or projects.'
    );
  });
});
