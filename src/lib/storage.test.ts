import path from "path";
import { rmSync } from "fs";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { generateStorageKey, LocalStorageDriver, getStorage } from "./storage";

describe("generateStorageKey", () => {
  it("returns path with yyyy-mm and uuid", () => {
    const key = generateStorageKey(".webp");
    expect(key).toMatch(/^\d{4}-\d{2}\/[a-f0-9-]+\.webp$/);
  });

  it("includes extension", () => {
    expect(generateStorageKey(".pdf").endsWith(".pdf")).toBe(true);
    expect(generateStorageKey(".json").endsWith(".json")).toBe(true);
  });

  it("has valid uuid format", () => {
    const key = generateStorageKey(".txt");
    const parts = key.split("/");
    const filename = parts[1];
    const uuidPart = filename.replace(".txt", "");
    expect(uuidPart).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });
});

describe("LocalStorageDriver", () => {
  let driver: LocalStorageDriver;

  beforeAll(() => {
    driver = new LocalStorageDriver();
  });

  afterAll(() => {
    const testDir = process.env.STORAGE_PATH;
    if (testDir) rmSync(testDir, { recursive: true, force: true });
  });

  it("put and get roundtrip", async () => {
    const buf = Buffer.from("hello");
    await driver.put("a/file.txt", buf);
    const out = await driver.get("a/file.txt");
    expect(out).toEqual(buf);
  });

  it("get returns null for missing file", async () => {
    const out = await driver.get("nonexistent/file.txt");
    expect(out).toBeNull();
  });

  it("delete removes file", async () => {
    await driver.put("b/x.txt", Buffer.from("x"));
    await driver.delete("b/x.txt");
    const out = await driver.get("b/x.txt");
    expect(out).toBeNull();
  });
});

describe("getStorage", () => {
  it("returns driver when not S3", () => {
    const storage = getStorage();
    expect(storage).toBeDefined();
    expect(storage.put).toBeDefined();
    expect(storage.get).toBeDefined();
    expect(storage.delete).toBeDefined();
  });
});
