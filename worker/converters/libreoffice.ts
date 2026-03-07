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
  const dir = path.resolve(tmpDir || os.tmpdir());
  const prefix = `lo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputExt = getExtensionForTarget(sourceFormat);
  const outputExt = getExtensionForTarget(targetFormat);
  const workDir = path.join(dir, prefix);
  const inputPath = path.join(workDir, `in${inputExt}`);
  const userProfile = path.join(dir, `lo-profile-${prefix}`);

  try {
    await fs.mkdir(workDir, { recursive: true });
    await fs.writeFile(inputPath, inputBuffer);

    const outFormat = outputExt.replace(/^\./, "");
    const resolved = path.resolve(userProfile).replace(/\\/g, "/");
    const profileUrl = resolved.startsWith("/") ? "file://" + resolved : "file:///" + resolved;
    const absWorkDir = path.resolve(workDir);
    const absInputPath = path.resolve(inputPath);
    const soffice = spawn("soffice", [
      "--headless",
      `-env:UserInstallation=${profileUrl}`,
      "--convert-to",
      outFormat,
      "--outdir",
      absWorkDir,
      absInputPath,
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

    const outName = "in" + outputExt;
    const outPath = path.join(workDir, outName);
    try {
      return await fs.readFile(outPath);
    } catch {
      const files = await fs.readdir(workDir);
      const created = files.find((f) => f.endsWith(outputExt) && f !== path.basename(inputPath));
      if (created) {
        return await fs.readFile(path.join(workDir, created));
      }
      throw new Error(`LibreOffice did not create output: expected ${outPath}`);
    }
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {});
    await fs.rm(userProfile, { recursive: true, force: true }).catch(() => {});
  }
}
