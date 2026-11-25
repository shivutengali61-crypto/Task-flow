import assert from 'node:assert/strict';
import test from 'node:test';
import { createSeedData } from '../data/seedData';
import {
  loadPersistedState,
  parseImportedBackup,
  savePersistedState,
  STORAGE_KEY,
  StorageAdapter,
} from './storage';

function createMemoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, v);
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

test('falls back to seed data when storage is empty', () => {
  const storage = createMemoryStorage();
  const state = loadPersistedState(storage);
  assert.equal(state.schemaVersion, 1);
  assert.equal(state.theme, 'dark');
  assert.ok(state.tasks.length > 0);
});

test('persists and reloads state cleanly', () => {
  const storage = createMemoryStorage();
  const seed = createSeedData();
  seed.theme = 'light';
  seed.tasks[0].title = 'Custom Persisted Task';

  const ok = savePersistedState(seed, storage);
  assert.equal(ok, true);

  const reloaded = loadPersistedState(storage);
  assert.equal(reloaded.theme, 'light');
  assert.equal(reloaded.tasks[0].title, 'Custom Persisted Task');
});

test('gracefully recovers from corrupted or outdated schema payloads', () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, '{broken json');
  const recovered1 = loadPersistedState(storage);
  assert.equal(recovered1.schemaVersion, 1);
  assert.ok(recovered1.tasks.length > 0);

  storage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 99, tasks: [] }));
  const recovered2 = loadPersistedState(storage);
  assert.equal(recovered2.schemaVersion, 1);
  assert.ok(recovered2.tasks.length > 0);
});

test('parseImportedBackup rejects invalid JSON and accepts valid backup', () => {
  assert.equal(parseImportedBackup('not json'), null);
  assert.equal(parseImportedBackup(JSON.stringify({ schemaVersion: 1 })), null);

  const valid = createSeedData();
  const parsed = parseImportedBackup(JSON.stringify(valid));
  assert.ok(parsed !== null);
  assert.equal(parsed?.workspaces.length, valid.workspaces.length);
});
