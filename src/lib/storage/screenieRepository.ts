import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import {
  createSavedItem,
  type CreateSavedItemInput,
  type SavedItem,
  type ScreenieRepository,
  type UpdateSavedItemInput
} from '../../domain/savedItem';
import { seedItems } from './seedData';

interface ScreenieDb extends DBSchema {
  items: {
    key: string;
    value: SavedItem;
    indexes: {
      'by-created': string;
      'by-status': string;
      'by-type': string;
    };
  };
  meta: {
    key: string;
    value: { key: string; value: string };
  };
}

const DB_NAME = 'screenie-local';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ScreenieDb>> | undefined;

export const screenieRepository: ScreenieRepository = {
  async list() {
    await ensureSeeded();
    const db = await getDb();
    return (await db.getAllFromIndex('items', 'by-created')).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  },

  async get(id) {
    const db = await getDb();
    return db.get('items', id);
  },

  async create(input: CreateSavedItemInput) {
    const db = await getDb();
    const item = createSavedItem(input);
    await db.put('items', item);
    return item;
  },

  async update(id: string, input: UpdateSavedItemInput) {
    const db = await getDb();
    const existing = await db.get('items', id);

    if (!existing) {
      throw new Error(`Saved item not found: ${id}`);
    }

    const updated: SavedItem = {
      ...existing,
      ...input,
      tags: input.tags ?? existing.tags,
      updatedAt: new Date().toISOString()
    };
    await db.put('items', updated);
    return updated;
  },

  async remove(id: string) {
    const db = await getDb();
    await db.delete('items', id);
  },

  async seed(items: SavedItem[]) {
    const db = await getDb();
    const transaction = db.transaction(['items', 'meta'], 'readwrite');
    await Promise.all(items.map((item) => transaction.objectStore('items').put(item)));
    await transaction.objectStore('meta').put({ key: 'seeded', value: 'true' });
    await transaction.done;
  }
};

export async function ensureSeeded() {
  const db = await getDb();
  const seeded = await db.get('meta', 'seeded');

  if (seeded?.value === 'true') {
    return;
  }

  await screenieRepository.seed(seedItems);
}

function getDb() {
  dbPromise ??= openDB<ScreenieDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('items')) {
        const items = db.createObjectStore('items', { keyPath: 'id' });
        items.createIndex('by-created', 'createdAt');
        items.createIndex('by-status', 'status');
        items.createIndex('by-type', 'type');
      }

      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    }
  });

  return dbPromise;
}
