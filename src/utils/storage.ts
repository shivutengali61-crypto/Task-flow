import { createSeedData } from '../data/seedData';
import { PersistedDataV1 } from '../types/task';

export const STORAGE_KEY = 'taskflow_pro_state_v1';
export const CURRENT_SCHEMA_VERSION = 1;

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getDefaultStorage(): StorageAdapter | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

export function isValidPersistedData(candidate: unknown): candidate is PersistedDataV1 {
  if (!candidate || typeof candidate !== 'object') return false;
  const obj = candidate as Record<string, unknown>;
  if (obj.schemaVersion !== CURRENT_SCHEMA_VERSION) return false;
  if (obj.theme !== 'dark' && obj.theme !== 'light') return false;
  if (typeof obj.activeWorkspaceId !== 'string') return false;
  if (!Array.isArray(obj.workspaces) || obj.workspaces.length === 0) return false;
  if (!Array.isArray(obj.projects)) return false;
  if (!Array.isArray(obj.tasks)) return false;
  if (!Array.isArray(obj.completionHistory)) return false;
  return true;
}

export function loadPersistedState(
  storage: StorageAdapter | null = getDefaultStorage(),
  now: Date = new Date()
): PersistedDataV1 {
  if (!storage) {
    return createSeedData(now);
  }
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) {
      return createSeedData(now);
    }
    const parsed: unknown = JSON.parse(raw);
    if (isValidPersistedData(parsed)) {
      // Ensure activeWorkspaceId still exists
      const workspaceExists = parsed.workspaces.some((w) => w.id === parsed.activeWorkspaceId);
      return {
        ...parsed,
        activeWorkspaceId: workspaceExists ? parsed.activeWorkspaceId : parsed.workspaces[0].id,
      };
    }
    return createSeedData(now);
  } catch {
    return createSeedData(now);
  }
}

export function savePersistedState(
  data: PersistedDataV1,
  storage: StorageAdapter | null = getDefaultStorage()
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

export function parseImportedBackup(rawJson: string): PersistedDataV1 | null {
  try {
    const parsed: unknown = JSON.parse(rawJson);
    if (isValidPersistedData(parsed)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
