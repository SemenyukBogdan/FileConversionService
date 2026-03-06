import { mdToPdf } from "md-to-pdf";
import { promises as fs } from "fs";
import path from "path";
import os from "os";

export async function convertToPdf(
  inputBuffer: Buffer,
  _params?: Record<string, unknown>
): Promise<Buffer> {
  const tmpDir = os.tmpdir();
  const inputPath = path.join(tmpDir, `md-${Date.now()}.md`);

  try {
    await fs.writeFile(inputPath, inputBuffer);
    const pdfBuffer = await mdToPdf({ path: inputPath });
    if (Buffer.isBuffer(pdfBuffer)) return pdfBuffer;
    const value = pdfBuffer as unknown;
    return Buffer.isBuffer(value) ? value : Buffer.from(value as ArrayLike<number>);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
  }
}
