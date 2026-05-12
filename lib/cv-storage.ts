const DB_NAME = "vector_eval_cv";
const STORE_NAME = "cv_pdf";
const DB_VERSION = 1;

export type StoredCvPayload = {
  data: ArrayBuffer;
  fileName: string;
  mimeType: string;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexedDB not available"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveCvPdf(submissionId: string, file: File): Promise<void> {
  const data = await file.arrayBuffer();
  const db = await openDb();
  const payload: StoredCvPayload = {
    data,
    fileName: file.name,
    mimeType: file.type || "application/pdf",
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.objectStore(STORE_NAME).put(payload, submissionId);
  });
}

export async function getCvPdfRecord(
  submissionId: string
): Promise<StoredCvPayload | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    const r = tx.objectStore(STORE_NAME).get(submissionId);
    r.onerror = () => {
      db.close();
      reject(r.error);
    };
    r.onsuccess = () => {
      const val = (r.result as StoredCvPayload | undefined) ?? null;
      db.close();
      resolve(val);
    };
  });
}

export async function deleteStoredCvPdf(submissionId: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.objectStore(STORE_NAME).delete(submissionId);
  });
}

/** Opens the stored PDF in a new tab, or triggers download if pop-up blocked. */
export async function openStoredCvPdf(submissionId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const rec = await getCvPdfRecord(submissionId);
  if (!rec) return false;
  const blob = new Blob([rec.data], { type: rec.mimeType });
  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");
  if (!opened) {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.download = rec.fileName.endsWith(".pdf") ? rec.fileName : `${rec.fileName}.pdf`;
    a.click();
  }
  window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
  return true;
}
