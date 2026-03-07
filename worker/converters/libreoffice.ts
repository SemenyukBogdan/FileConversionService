import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { getExtensionForTarget } from "../../src/lib/conversion-matrix";

export async function convertViaLibreOffice(
  inputBuffer: Buffer,
  sourceFormat: string,
  targetFormat: string,
  tmpDir?: string
): Promise<Buffer> {
  const dir = tmpDir || os.tmpdir();
  const prefix = `lo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputExt = getExtensionForTarget(sourceFormat);
  const outputExt = getExtensionForTarget(targetFormat);
  const inputPath = path.join(dir, `${prefix}${inputExt}`);
  const outDir = path.join(dir, `${prefix}-out`);
  const userProfile = path.join(dir, `lo-profile-${prefix}`);

  try {
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(inputPath, inputBuffer);

    const outFormat = outputExt.replace(/^\./, "");
    const resolved = path.resolve(userProfile).replace(/\\/g, "/");
    const profileUrl = resolved.startsWith("/") ? "file://" + resolved : "file:///" + resolved;
    const soffice = spawn("soffice", [
      "--headless",
      `-env:UserInstallation=${profileUrl}`,
      "--convert-to",
      outFormat,
      "--outdir",
      outDir,
      inputPath,
    ], {
      env: {
        ...process.env,
        HOME: dir,
      },
    });

    await new Promise<void>((resolve, reject) => {
      let stderr = "";
      soffice.stderr?.on("data", (d) => { stderr += d.toString(); });
      soffice.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(stderr || `soffice exit ${code}`));
      });
      soffice.on("error", reject);
    });

    const outName = path.basename(inputPath, inputExt) + outputExt;
    const outPath = path.join(outDir, outName);
    const result = await fs.readFile(outPath);
    return result;
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.rm(outDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(userProfile, { recursive: true, force: true }).catch(() => {});
  }
}
