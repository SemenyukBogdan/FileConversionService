import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { getExtensionForTarget } from "../../src/lib/conversion-matrix";

const pandocNames: Record<string, string> = {
  md: "markdown",
  tex: "latex",
  txt: "plain",
};

function pandocFormat(f: string): string {
  return pandocNames[f.toLowerCase()] ?? f.toLowerCase();
}

export async function convertViaPandoc(
  inputBuffer: Buffer,
  sourceFormat: string,
  targetFormat: string,
  tmpDir?: string
): Promise<Buffer> {
  const dir = tmpDir || os.tmpdir();
  const prefix = `pd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const inputExt = getExtensionForTarget(sourceFormat);
  const outputExt = getExtensionForTarget(targetFormat);
  const inputPath = path.join(dir, `${prefix}${inputExt}`);
  const outputPath = path.join(dir, `${prefix}${outputExt}`);

  try {
    await fs.writeFile(inputPath, inputBuffer);

    const args = ["-f", pandocFormat(sourceFormat), "-t", pandocFormat(targetFormat), inputPath, "-o", outputPath];
    if (targetFormat.toLowerCase() === "pdf") {
      args.splice(4, 0, "-s", "--pdf-engine=xelatex");
    }

    const proc = spawn("pandoc", args);
    await new Promise<void>((resolve, reject) => {
      let err = "";
      proc.stderr?.on("data", (d) => { err += d.toString(); });
      proc.on("close", (code) => {
        if (code === 0) resolve();
        else reject(new Error(err || "exit " + code));
      });
      proc.on("error", reject);
    });

    return await fs.readFile(outputPath);
  } finally {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  }
}
