import {
  createSavedItem,
  updateSavedItem,
  type CreateSavedItemInput,
  type SavedItem,
  type ScreenieRepository,
  type UpdateSavedItemInput
} from '../../domain/savedItem';

export function createMemoryScreenieRepository(initialItems: SavedItem[] = []): ScreenieRepository {
  const items = new Map(initialItems.map((item) => [item.id, item]));

  return {
    async list() {
      return sortNewest(Array.from(items.values()));
    },

    async get(id: string) {
      return items.get(id);
    },

    async create(input: CreateSavedItemInput) {
      const item = createSavedItem(input);
      items.set(item.id, item);
      return item;
    },

    async update(id: string, input: UpdateSavedItemInput) {
      const existing = items.get(id);
      if (!existing) {
        throw new Error(`Saved item not found: ${id}`);
      }
      const updated = updateSavedItem(existing, input);
      items.set(id, updated);
      return updated;
    },

    async trash(id: string) {
      return this.update(id, { status: 'trash' });
    },

    async restore(id: string) {
      return this.update(id, { status: 'active' });
    },

    async toggleFavorite(id: string) {
      const existing = items.get(id);
      if (!existing) {
        throw new Error(`Saved item not found: ${id}`);
      }
      return this.update(id, { isFavorite: !existing.isFavorite });
    },

    async remove(id: string) {
      items.delete(id);
    },

    async seed(seedItems: SavedItem[]) {
      for (const item of seedItems) {
        items.set(item.id, item);
      }
    },

    async clear() {
      items.clear();
    }
  };
}

function sortNewest(items: SavedItem[]): SavedItem[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
