import { createMemoryScreenieRepository } from './memoryScreenieRepository';
import { seedItems, seedProjects } from './seedData';

describe('createMemoryScreenieRepository', () => {
  it('lists items newest first and seeds deterministically', async () => {
    const repository = createMemoryScreenieRepository();

    await repository.seed(seedItems, seedProjects);
    const items = await repository.list();

    expect(items[0].id).toBe('seed-pricing-screenshot');
    expect(items).toHaveLength(seedItems.length);
    expect(await repository.listProjects()).toHaveLength(seedProjects.length);
  });

  it('creates and removes projects', async () => {
    const repository = createMemoryScreenieRepository(seedItems, seedProjects);
    const created = await repository.createProject({ name: 'New project', now: '2026-06-10T12:00:00.000Z' });

    expect(created.name).toBe('New project');
    expect((await repository.listProjects()).length).toBe(seedProjects.length + 1);

    const item = await repository.create({
      type: 'snippet',
      title: 'Assigned',
      text: 'text',
      projectId: created.id,
      now: '2026-06-10T12:00:00.000Z'
    });
    expect(item.projectId).toBe(created.id);

    await repository.removeProject(created.id);
    const updated = await repository.get(item.id);
    expect(updated?.projectId).toBeUndefined();
  });

  it('creates, updates, trashes, restores, and favorites items', async () => {
    const repository = createMemoryScreenieRepository();
    const created = await repository.create({
      type: 'link',
      title: ' Screenie Pricing ',
      url: ' https://screenie.app/pricing ',
      tags: [' Pricing ', 'pricing'],
      now: '2026-06-10T12:00:00.000Z'
    });

    expect(created).toMatchObject({
      title: 'Screenie Pricing',
      tags: ['pricing'],
      status: 'active',
      isFavorite: false
    });

    const updated = await repository.update(created.id, {
      title: ' Updated Pricing ',
      tags: ['pro plan', ' Pricing ']
    });
    expect(updated).toMatchObject({ title: 'Updated Pricing', tags: ['pro plan', 'pricing'] });

    const favorite = await repository.toggleFavorite(created.id);
    expect(favorite.isFavorite).toBe(true);

    const trashed = await repository.trash(created.id);
    expect(trashed.status).toBe('trash');

    const restored = await repository.restore(created.id);
    expect(restored.status).toBe('active');
  });

  it('clears and removes items', async () => {
    const repository = createMemoryScreenieRepository(seedItems);

    await repository.remove('seed-pricing-link');
    expect(await repository.get('seed-pricing-link')).toBeUndefined();

    await repository.clear();
    expect(await repository.list()).toEqual([]);
  });
});
