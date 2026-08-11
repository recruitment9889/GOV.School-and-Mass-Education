// IndexedDB helper for local file persistence in applicant form

const DB_NAME = "recruitment_files_db";
const STORE_NAME = "uploaded_files";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject("IndexedDB not supported");
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "docType" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveFileToIndexedDB(docType: string, fileData: { name: string; size: string; fileUrl: string }) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.put({ docType, ...fileData });
  } catch (e) {
    console.warn("Failed to save file to IndexedDB:", e);
  }
}

export async function getAllFilesFromIndexedDB(): Promise<{ [key: string]: { name: string; size: string; fileUrl: string } }> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const result: { [key: string]: { name: string; size: string; fileUrl: string } } = {};
        (request.result || []).forEach((item: any) => {
          if (item.docType) {
            result[item.docType] = {
              name: item.name,
              size: item.size,
              fileUrl: item.fileUrl,
            };
          }
        });
        resolve(result);
      };
      request.onerror = () => resolve({});
    });
  } catch (e) {
    return {};
  }
}

export async function clearFilesFromIndexedDB() {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.clear();
  } catch (e) {
    console.warn("Failed to clear IndexedDB:", e);
  }
}
