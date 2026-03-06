import { parse } from "csv-parse/sync";
export async function convertToJson(
  inputBuffer: Buffer,
  _params?: Record<string, unknown>
): Promise<Buffer> {
  const input = inputBuffer.toString("utf-8");
  const records = parse(input, {
    columns: true,
    skip_empty_lines: true,
    relax_quotes: true,
  });
  const json = JSON.stringify(records, null, 2);
  return Buffer.from(json, "utf-8");
}
