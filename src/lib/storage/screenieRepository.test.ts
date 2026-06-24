import { createMemoryScreenieRepository } from './memoryScreenieRepository';
import {
  deleteScreenieDatabaseForTests,
  resetScreenieRepositoryForTests,
  screenieRepository
} from './screenieRepository';
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

    const renamed = await repository.renameProject(created.id, ' Renamed project ');
    expect(renamed.name).toBe('Renamed project');

    const item = await repository.create({
      type: 'snippet',
      title: 'Assigned',
      text: 'text',
      projectId: created.id,
      now: '2026-06-10T12:00:00.000Z'
    });
    expect(item.projectId).toBe(created.id);

    const affectedItems = await repository.removeProject(created.id);
    const updated = await repository.get(item.id);
    expect(affectedItems).toHaveLength(1);
    expect(affectedItems[0].id).toBe(item.id);
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

  it('keeps item actions callable when repository methods are destructured', async () => {
    const repository = createMemoryScreenieRepository();
    const created = await repository.create({
      type: 'snippet',
      title: 'Detached actions',
      text: 'Contract check',
      now: '2026-06-10T12:00:00.000Z'
    });
    const { trash, restore, toggleFavorite } = repository;

    expect((await trash(created.id)).status).toBe('trash');
    expect((await restore(created.id)).status).toBe('active');
    expect((await toggleFavorite(created.id)).isFavorite).toBe(true);
  });

  it('uses starter projects when seed is called without explicit projects', async () => {
    const repository = createMemoryScreenieRepository();

    await repository.seed([seedItems[0]]);

    expect(await repository.list()).toHaveLength(1);
    expect(await repository.listProjects()).toHaveLength(seedProjects.length);
  });

  it('clears and removes items', async () => {
    const repository = createMemoryScreenieRepository(seedItems);

    await repository.remove('seed-pricing-link');
    expect(await repository.get('seed-pricing-link')).toBeUndefined();

    await repository.clear();
    expect(await repository.list()).toEqual([]);
  });

  it('exports, imports, and resets a local workspace', async () => {
    const repository = createMemoryScreenieRepository(seedItems, seedProjects);
    const snapshot = await repository.exportWorkspace('2026-06-10T15:00:00.000Z');

    expect(snapshot).toMatchObject({
      version: 1,
      exportedAt: '2026-06-10T15:00:00.000Z'
    });
    expect(snapshot.items).toHaveLength(seedItems.length);
    expect(snapshot.projects).toHaveLength(seedProjects.length);

    await repository.clear();
    expect(await repository.list()).toEqual([]);

    await repository.importWorkspace(snapshot);
    expect(await repository.list()).toHaveLength(seedItems.length);
    expect(await repository.listProjects()).toHaveLength(seedProjects.length);

    await repository.clear();
    await repository.resetDemo();
    expect(await repository.list()).toHaveLength(seedItems.length);
    expect(await repository.listProjects()).toHaveLength(seedProjects.length);
  });
});

describe('screenieRepository IndexedDB migrations', () => {
  beforeEach(async () => {
    await deleteScreenieDatabaseForTests();
  });

  afterEach(async () => {
    await deleteScreenieDatabaseForTests();
  });

  it('adds beta OCR/source defaults to existing saved items', async () => {
    const legacyDb = await indexedDB.open('screenie-local', 2);

    await new Promise<void>((resolve, reject) => {
      legacyDb.onupgradeneeded = () => {
        const db = legacyDb.result;
        const items = db.createObjectStore('items', { keyPath: 'id' });
        items.createIndex('by-created', 'createdAt');
        items.createIndex('by-status', 'status');
        items.createIndex('by-type', 'type');
        const projects = db.createObjectStore('projects', { keyPath: 'id' });
        projects.createIndex('by-created', 'createdAt');
        db.createObjectStore('meta', { keyPath: 'key' });
      };
      legacyDb.onerror = () => reject(legacyDb.error);
      legacyDb.onsuccess = () => resolve();
    });

    const db = legacyDb.result;
    const transaction = db.transaction(['items', 'meta'], 'readwrite');
    transaction.objectStore('items').put({
      id: 'legacy-image',
      type: 'image',
      title: 'Legacy image',
      extractedText: 'OCR text from the old shape',
      tags: ['legacy'],
      isFavorite: false,
      status: 'active',
      createdAt: '2026-06-10T12:00:00.000Z',
      updatedAt: '2026-06-10T12:30:00.000Z'
    });
    transaction.objectStore('meta').put({ key: 'seeded', value: 'true' });

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();
    await resetScreenieRepositoryForTests();

    const items = await screenieRepository.list();

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      id: 'legacy-image',
      source: 'manual',
      ocrStatus: 'ready',
      ocrUpdatedAt: '2026-06-10T12:30:00.000Z'
    });
  });

  it('exports and imports workspace snapshots through IndexedDB', async () => {
    await screenieRepository.clear();
    await screenieRepository.seed([seedItems[0]], [seedProjects[0]]);

    const snapshot = await screenieRepository.exportWorkspace('2026-06-10T15:00:00.000Z');

    expect(snapshot).toMatchObject({
      version: 1,
      exportedAt: '2026-06-10T15:00:00.000Z',
      items: [{ id: seedItems[0].id }],
      projects: [{ id: seedProjects[0].id }]
    });

    await screenieRepository.clear();
    await screenieRepository.importWorkspace(snapshot);

    expect(await screenieRepository.list()).toHaveLength(1);
    expect(await screenieRepository.listProjects()).toHaveLength(1);
  });

  it('keeps IndexedDB item actions callable when repository methods are destructured', async () => {
    await screenieRepository.clear();
    const created = await screenieRepository.create({
      type: 'snippet',
      title: 'IndexedDB detached actions',
      text: 'Contract check',
      now: '2026-06-10T12:00:00.000Z'
    });
    const { trash, restore, toggleFavorite, resetDemo } = screenieRepository;

    expect((await trash(created.id)).status).toBe('trash');
    expect((await restore(created.id)).status).toBe('active');
    expect((await toggleFavorite(created.id)).isFavorite).toBe(true);

    await resetDemo();
    expect(await screenieRepository.list()).toHaveLength(seedItems.length);
    expect(await screenieRepository.listProjects()).toHaveLength(seedProjects.length);
  });

  it('returns items affected by IndexedDB project deletion', async () => {
    await screenieRepository.clear();
    const project = await screenieRepository.createProject({
      name: 'Temporary project',
      now: '2026-06-10T12:00:00.000Z'
    });
    const assignedItem = await screenieRepository.create({
      type: 'snippet',
      title: 'Assigned note',
      text: 'Project will be removed.',
      projectId: project.id,
      now: '2026-06-10T12:30:00.000Z'
    });

    const affectedItems = await screenieRepository.removeProject(project.id);

    expect(affectedItems).toHaveLength(1);
    expect(affectedItems[0]).toMatchObject({
      id: assignedItem.id,
      projectId: undefined
    });
    expect(await screenieRepository.get(assignedItem.id)).toMatchObject({
      id: assignedItem.id,
      projectId: undefined
    });
  });
});
