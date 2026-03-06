import sharp from "sharp";
export async function convertToWebp(
  inputBuffer: Buffer,
  _params?: Record<string, unknown>
): Promise<Buffer> {
  return sharp(inputBuffer)
    .webp({ quality: 80 })
    .toBuffer();
}
