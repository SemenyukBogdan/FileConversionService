import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStorage } from "@/lib/storage";

function verifyToken(job: { accessToken: string }, token: string | null): boolean {
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

  if (!verifyToken(job, token)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 403 });
  }

  if (job.status === "expired") {
    return new NextResponse(null, { status: 410 });
  }

  if (job.status !== "done") {
    return NextResponse.json(
      { error: "File not ready for download" },
      { status: 400 }
    );
  }

  if (!job.resultStorageKey) {
    return NextResponse.json(
      { error: "Result file not found" },
      { status: 500 }
    );
  }

  const storage = getStorage();
  const buffer = await storage.get(job.resultStorageKey);

  if (!buffer) {
    return new NextResponse(null, { status: 410 });
  }

  const ext = job.targetFormat === "webp" ? ".webp" : job.targetFormat === "pdf" ? ".pdf" : ".json";
  const downloadFilename = job.sourceFilename.replace(/\.[^.]+$/, "") + ext;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": job.resultMime || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(downloadFilename)}"`,
      "Content-Length": String(buffer.length),
    },
  });
}
