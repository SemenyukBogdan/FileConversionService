import { Queue } from "bullmq";
import { redis } from "./redis";

const QUEUE_NAME = "conversion-jobs";

export interface ConversionJobPayload {
  jobId: string;
  sourceStorageKey: string;
  targetFormat: "webp" | "pdf" | "json";
  params?: Record<string, unknown>;
}

export const conversionQueue = new Queue<ConversionJobPayload>(QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
    attempts: (parseInt(process.env.RETRY_COUNT || "2", 10) || 0) + 1,
  },
});

export async function addJobToQueue(payload: ConversionJobPayload): Promise<string> {
  const job = await conversionQueue.add("convert", payload);
  return job.id ?? "";
}
