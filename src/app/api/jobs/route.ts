import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage, generateStorageKey } from "@/lib/storage";
import {
  validateFileForFormat,
  sanitizeFilename,
  getExtensionForMime,
  type TargetFormat,
} from "@/lib/validation";
import { v4 as uuidv4 } from "uuid";

const TARGET_FORMATS: TargetFormat[] = ["webp", "pdf", "json"];
const TTL_HOURS = parseInt(process.env.TTL_HOURS || "24", 10);

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const { allowed } = await checkRateLimit(ip);
    if (!allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later." },
        { status: 429 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const targetFormat = formData.get("targetFormat") as string | null;
    const paramsStr = formData.get("params") as string | null;

    if (!file || !targetFormat) {
      return NextResponse.json(
        { error: "Missing required fields: file, targetFormat" },
        { status: 400 }
      );
    }

    if (!TARGET_FORMATS.includes(targetFormat as TargetFormat)) {
      return NextResponse.json(
        { error: `Invalid targetFormat. Allowed: ${TARGET_FORMATS.join(", ")}` },
        { status: 400 }
      );
    }

    const validation = validateFileForFormat(
      file.type,
      targetFormat as TargetFormat,
      file.size
    );
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.tooLarge ? 413 : 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const ext = getExtensionForMime(file.type, targetFormat as TargetFormat);
    const sourceStorageKey = generateStorageKey(ext);
    await storage.put(sourceStorageKey, buffer);

    const jobId = uuidv4();
    const accessToken = uuidv4();
    const expiresAt = new Date(Date.now() + TTL_HOURS * 60 * 60 * 1000);

    let params: Record<string, unknown> | undefined;
    if (paramsStr) {
      try {
        params = JSON.parse(paramsStr) as Record<string, unknown>;
      } catch {
        params = undefined;
      }
    }

    await prisma.conversionJob.create({
      data: {
        id: jobId,
        status: "queued",
        sourceFilename: sanitizeFilename(file.name),
        sourceStorageKey,
        sourceMime: file.type,
        sourceSize: file.size,
        targetFormat: targetFormat as "webp" | "pdf" | "json",
        params: (params ?? undefined) as object | undefined,
        accessToken,
        expiresAt,
      },
    });

    const { addJobToQueue } = await import("@/lib/queue");
    await addJobToQueue({
      jobId,
      sourceStorageKey,
      targetFormat: targetFormat as "webp" | "pdf" | "json",
      params,
    });

    return NextResponse.json(
      {
        jobId,
        accessToken,
        status: "queued",
        expiresAt: expiresAt.toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
