import path from "path";
import { tmpdir } from "os";

process.env.STORAGE_PATH = path.join(tmpdir(), "vitest-storage-" + Date.now());
