import { createMemoryScreenieRepository } from '../lib/storage/memoryScreenieRepository';

describe('Product Beta project data contract', () => {
  it('creates, renames, and deletes projects without deleting assigned items', async () => {
    const repository = createMemoryScreenieRepository();

    const project = await repository.createProject({
      name: 'Beta QA',
      now: '2026-06-16T12:00:00.000Z'
    });
    const assignedItem = await repository.create({
      type: 'snippet',
      title: 'Assigned beta note',
      text: 'Project lifecycle regression fixture.',
      projectId: project.id,
      now: '2026-06-16T12:05:00.000Z'
    });

    expect(project.name).toBe('Beta QA');
    expect((await repository.listProjects()).map((item) => item.name)).toEqual(['Beta QA']);
    expect(assignedItem.projectId).toBe(project.id);

    const renamed = await repository.renameProject(project.id, '  Beta Launch QA  ');
    expect(renamed.name).toBe('Beta Launch QA');

    await repository.removeProject(project.id);

    expect(await repository.listProjects()).toEqual([]);
    expect((await repository.get(assignedItem.id))?.projectId).toBeUndefined();
  });
});
