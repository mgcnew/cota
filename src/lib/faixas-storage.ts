import type { BannerProject } from "@/components/faixas/BannerCanvas";

// Projetos de faixas incluem imagens em base64, que podem passar facilmente do
// limite de ~5-10MB do localStorage (QuotaExceededError). IndexedDB tem um limite
// muito maior, então guardamos os projetos lá.
const DB_NAME = "cotaja_faixas_db";
const STORE_NAME = "kv";
const DB_VERSION = 1;
const PROJECTS_KEY = "faixas_projects_v2";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const req = tx.objectStore(STORE_NAME).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function loadFaixasProjects(): Promise<BannerProject[]> {
  try {
    const fromIdb = await idbGet<BannerProject[]>(PROJECTS_KEY);
    if (fromIdb) return fromIdb;
  } catch {
    // IndexedDB indisponível — segue para o fallback de migração abaixo.
  }

  // Migração única: projetos salvos antes no localStorage (versão antiga).
  try {
    const legacy = localStorage.getItem(PROJECTS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy) as BannerProject[];
      await idbSet(PROJECTS_KEY, parsed).catch(() => {});
      localStorage.removeItem(PROJECTS_KEY);
      return parsed;
    }
  } catch {
    // ignora dado antigo corrompido
  }

  return [];
}

export async function saveFaixasProjects(projects: BannerProject[]): Promise<void> {
  await idbSet(PROJECTS_KEY, projects);
}
