import { promises as fs } from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

export interface StorageDriver {
  put(key: string, buffer: Buffer): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

const STORAGE_PATH = process.env.STORAGE_PATH || "./storage";

function resolveKey(key: string): string {
  if (key.includes("..") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }
  return path.join(STORAGE_PATH, key);
}

export class LocalStorageDriver implements StorageDriver {
  async put(key: string, buffer: Buffer): Promise<void> {
    const fullPath = resolveKey(key);
    const dir = path.dirname(fullPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, buffer);
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const fullPath = resolveKey(key);
      const data = await fs.readFile(fullPath);
      return data;
    } catch {
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      const fullPath = resolveKey(key);
      await fs.unlink(fullPath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

export function generateStorageKey(extension: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const filename = `${uuidv4()}${extension}`;
  return `${yyyy}-${mm}/${filename}`;
}

const driver = process.env.STORAGE_DRIVER === "s3" ? null : new LocalStorageDriver();

export function getStorage(): StorageDriver {
  if (!driver) {
    throw new Error("S3 storage not implemented for MVP");
  }
  return driver;
}
