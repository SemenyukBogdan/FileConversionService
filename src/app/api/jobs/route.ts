import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage, generateStorageKey } from "@/lib/storage";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import {
  validateDocumentConversion,
  sanitizeFilename,
  getSourceFormatFromMime,
  getSourceFormatFromExtension,
  getExtensionForTarget,
} from "@/lib/validation";
import { DOCUMENT_FORMATS } from "@/lib/conversion-matrix";
import { v4 as uuidv4 } from "uuid";

const TTL_HOURS = parseInt(process.env.TTL_HOURS || "24", 10);

function getAuthenticatedUserId(request: NextRequest): string | null {
  const token = request.cookies?.get?.(SESSION_COOKIE)?.value;
  return verifySession(token);
}

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
    const targetFormat = (formData.get("targetFormat") as string | null)?.trim().toLowerCase();
    const paramsStr = formData.get("params") as string | null;

    if (!file || !targetFormat) {
      return NextResponse.json(
        { error: "Missing required fields: file, targetFormat" },
        { status: 400 }
      );
    }

    if (!DOCUMENT_FORMATS.includes(targetFormat as (typeof DOCUMENT_FORMATS)[number])) {
      return NextResponse.json(
        { error: `Invalid targetFormat. Allowed: ${DOCUMENT_FORMATS.join(", ")}` },
        { status: 400 }
      );
    }

    const sourceFormat =
      getSourceFormatFromMime(file.type) ?? getSourceFormatFromExtension(file.name);
    if (!sourceFormat) {
      return NextResponse.json(
        { error: `Невідомий формат файлу. MIME: ${file.type}` },
        { status: 400 }
      );
    }

    const validation = validateDocumentConversion(sourceFormat, targetFormat, file.size);
    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error },
        { status: validation.tooLarge ? 413 : 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const storage = getStorage();
    const ext = getExtensionForTarget(sourceFormat);
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
        sourceFormat,
        targetFormat,
        params: (params ?? undefined) as object | undefined,
        userId: getAuthenticatedUserId(request) ?? undefined,
        accessToken,
        expiresAt,
      },
    });

    const { addJobToQueue } = await import("@/lib/queue");
    await addJobToQueue({
      jobId,
      sourceStorageKey,
      sourceFormat,
      targetFormat,
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

export async function GET(request: NextRequest) {
  try {
    const userId = getAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobs = await prisma.conversionJob.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        status: true,
        sourceFilename: true,
        targetFormat: true,
        createdAt: true,
        updatedAt: true,
        accessToken: true,
      },
    });

    return NextResponse.json({
      items: jobs.map((job) => ({
        jobId: job.id,
        status: job.status,
        sourceFilename: job.sourceFilename,
        targetFormat: job.targetFormat,
        createdAt: job.createdAt.toISOString(),
        updatedAt: job.updatedAt.toISOString(),
        accessToken: job.accessToken,
      })),
    });
  } catch (error) {
    console.error("GET /api/jobs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
