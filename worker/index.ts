import "dotenv/config";
import { Worker } from "bullmq";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import path from "path";
import { promises as fs } from "fs";
import { convertToWebp } from "./converters/webp";
import { convertToPdf } from "./converters/pdf";
import { convertToJson } from "./converters/json";
import type { ConversionJobPayload } from "../src/lib/queue";

const QUEUE_NAME = "conversion-jobs";
const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || "2", 10);
const STORAGE_PATH = process.env.STORAGE_PATH || "./storage";

const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const prisma = new PrismaClient();

async function getStoragePath(key: string): Promise<string> {
  if (key.includes("..") || path.isAbsolute(key)) {
    throw new Error("Invalid storage key");
  }
  return path.join(STORAGE_PATH, key);
}

async function readFile(key: string): Promise<Buffer | null> {
  try {
    const fullPath = await getStoragePath(key);
    return await fs.readFile(fullPath);
  } catch {
    return null;
  }
}

async function writeFile(key: string, buffer: Buffer): Promise<void> {
  const fullPath = await getStoragePath(key);
  const dir = path.dirname(fullPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(fullPath, buffer);
}

async function runCleanup(): Promise<void> {
  const now = new Date();
  const expired = await prisma.conversionJob.findMany({
    where: {
      expiresAt: { lt: now },
      status: { in: ["done", "failed"] },
    },
  });

  for (const job of expired) {
    try {
      const fullPath = (p: string) => path.join(STORAGE_PATH, p);
      await fs.unlink(fullPath(job.sourceStorageKey)).catch(() => {});
      if (job.resultStorageKey) {
        await fs.unlink(fullPath(job.resultStorageKey)).catch(() => {});
      }
      await prisma.conversionJob.update({
        where: { id: job.id },
        data: { status: "expired" },
      });
    } catch (err) {
      console.error("Cleanup error for job", job.id, err);
    }
  }
}

const MIME_MAP: Record<string, string> = {
  webp: "image/webp",
  pdf: "application/pdf",
  json: "application/json",
};

async function processJob(payload: ConversionJobPayload): Promise<void> {
  const { jobId, sourceStorageKey, targetFormat, params } = payload;
  const startTime = Date.now();

  console.log(`[Worker] Processing job ${jobId} (${targetFormat})`);

  await prisma.conversionJob.update({
    where: { id: jobId },
    data: { status: "processing" },
  });

  const inputBuffer = await readFile(sourceStorageKey);
  if (!inputBuffer) {
    await prisma.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorCode: "FILE_NOT_FOUND",
        errorMessage: "Source file not found",
      },
    });
    return;
  }

  try {
    let outputBuffer: Buffer;
    switch (targetFormat) {
      case "webp":
        outputBuffer = await convertToWebp(inputBuffer, params);
        break;
      case "pdf":
        outputBuffer = await convertToPdf(inputBuffer, params);
        break;
      case "json":
        outputBuffer = await convertToJson(inputBuffer, params);
        break;
      default:
        throw new Error(`Unknown format: ${targetFormat}`);
    }

    const ext = targetFormat === "webp" ? ".webp" : targetFormat === "pdf" ? ".pdf" : ".json";
    const resultKey = sourceStorageKey.replace(/\.[^.]+$/, ext);
    await writeFile(resultKey, outputBuffer);

    await prisma.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "done",
        resultStorageKey: resultKey,
        resultMime: MIME_MAP[targetFormat],
        resultSize: outputBuffer.length,
      },
    });

    const duration = Date.now() - startTime;
    console.log(`[Worker] Job ${jobId} done in ${duration}ms`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const errorCode = err instanceof Error ? err.name : "CONVERSION_ERROR";
    console.error(`[Worker] Job ${jobId} failed:`, errorMessage);

    await prisma.conversionJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        errorCode,
        errorMessage: errorMessage.slice(0, 500),
      },
    });
    throw err;
  }
}

async function main(): Promise<void> {
  const jobTimeout = parseInt(process.env.JOB_TIMEOUT_SECONDS || "120", 10) * 1000;

  const worker = new Worker<ConversionJobPayload>(
    QUEUE_NAME,
    async (job) => {
      await processJob(job.data);
    },
    {
      connection: redis,
      concurrency: WORKER_CONCURRENCY,
      lockDuration: jobTimeout,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Worker] Completed job ${job.id}`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Worker] Failed job ${job?.id}:`, err?.message);
  });

  setInterval(runCleanup, 5 * 60 * 1000);
  console.log(`[Worker] Started with concurrency ${WORKER_CONCURRENCY}`);
}

main().catch((err) => {
  console.error("[Worker] Fatal error:", err);
  process.exit(1);
});
