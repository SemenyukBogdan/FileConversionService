import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

function getSessionUserId(request: NextRequest): string | null {
  return verifySession(request.cookies.get(SESSION_COOKIE)?.value);
}

function canAccessJob(
  request: NextRequest,
  job: { accessToken: string; userId: string | null },
  token: string | null
): boolean {
  // Auth-owned jobs are private and require matching session owner.
  if (job.userId) {
    const sessionUserId = getSessionUserId(request);
    return !!sessionUserId && sessionUserId === job.userId;
  }

  // Guest-created jobs keep token-based access.
  return !!token && token === job.accessToken;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const job = await prisma.conversionJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!canAccessJob(request, job, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    targetFormat: job.targetFormat,
    sourceFilename: job.sourceFilename,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
    error: job.errorMessage ? { code: job.errorCode, message: job.errorMessage } : null,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await params;
  const token = request.nextUrl.searchParams.get("token");

  const job = await prisma.conversionJob.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  if (!canAccessJob(request, job, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (job.status === "expired") {
    return NextResponse.json({ message: "Already expired" }, { status: 200 });
  }

  const storage = getStorage();
  await storage.delete(job.sourceStorageKey);
  if (job.resultStorageKey) {
    await storage.delete(job.resultStorageKey);
  }

  await prisma.conversionJob.update({
    where: { id: jobId },
    data: { status: "expired" },
  });

  return NextResponse.json({ message: "Job deleted" }, { status: 200 });
}
