import type { Project, SavedItem } from '../../domain/savedItem';
import {
  removeItemFromState,
  removeProjectFromState,
  sortItemsNewestFirst,
  sortProjectsByName,
  upsertItemInState,
  upsertProjectInState,
  upsertProjectlessItemsInState
} from './savedItemsState';

function item(input: Partial<SavedItem> & Pick<SavedItem, 'id' | 'createdAt'>): SavedItem {
  return {
    id: input.id,
    type: input.type ?? 'snippet',
    title: input.title ?? input.id,
    text: input.text,
    tags: input.tags ?? [],
    projectId: input.projectId,
    isFavorite: input.isFavorite ?? false,
    status: input.status ?? 'active',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt ?? input.createdAt
  };
}

function project(input: Pick<Project, 'id' | 'name'>): Project {
  return {
    ...input,
    createdAt: '2026-06-10T12:00:00.000Z'
  };
}

describe('saved item state reconciliation', () => {
  it('sorts and inserts saved items newest first', () => {
    const older = item({ id: 'older', createdAt: '2026-06-10T10:00:00.000Z' });
    const newer = item({ id: 'newer', createdAt: '2026-06-10T12:00:00.000Z' });
    const middle = item({ id: 'middle', createdAt: '2026-06-10T11:00:00.000Z' });

    expect(sortItemsNewestFirst([older, newer, middle]).map((current) => current.id)).toEqual([
      'newer',
      'middle',
      'older'
    ]);
    expect(upsertItemInState([older, newer], middle).map((current) => current.id)).toEqual([
      'newer',
      'middle',
      'older'
    ]);
  });

  it('replaces existing saved items without duplicating them', () => {
    const original = item({ id: 'item-1', title: 'Original', createdAt: '2026-06-10T12:00:00.000Z' });
    const updated = { ...original, title: 'Updated' };

    expect(upsertItemInState([original], updated)).toEqual([updated]);
  });

  it('removes saved items by id', () => {
    const first = item({ id: 'first', createdAt: '2026-06-10T12:00:00.000Z' });
    const second = item({ id: 'second', createdAt: '2026-06-10T11:00:00.000Z' });

    expect(removeItemFromState([first, second], first.id)).toEqual([second]);
  });

  it('sorts and upserts projects by name', () => {
    const beta = project({ id: 'project-beta', name: 'Beta' });
    const alpha = project({ id: 'project-alpha', name: 'Alpha' });
    const renamed = project({ id: 'project-beta', name: 'Aardvark' });

    expect(sortProjectsByName([beta, alpha]).map((current) => current.name)).toEqual(['Alpha', 'Beta']);
    expect(upsertProjectInState([beta, alpha], renamed).map((current) => current.name)).toEqual([
      'Aardvark',
      'Alpha'
    ]);
  });

  it('removes projects and reconciles projectless items after project deletion', () => {
    const assigned = item({
      id: 'assigned',
      projectId: 'project-alpha',
      createdAt: '2026-06-10T12:00:00.000Z'
    });
    const unaffected = item({
      id: 'unaffected',
      projectId: 'project-beta',
      createdAt: '2026-06-10T11:00:00.000Z'
    });
    const cleared = { ...assigned, projectId: undefined };

    expect(removeProjectFromState([project({ id: 'project-alpha', name: 'Alpha' })], 'project-alpha')).toEqual([]);
    expect(upsertProjectlessItemsInState([assigned, unaffected], [cleared])).toEqual([cleared, unaffected]);
  });
});
