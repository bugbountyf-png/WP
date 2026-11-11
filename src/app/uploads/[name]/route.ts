import { readFile } from "fs/promises";
import path from "path";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(_request: Request, context: { params: Promise<{ name: string }> }) {
  const { name } = await context.params;
  if (!/^[\w.-]+$/.test(name) || name.includes("..")) {
    return new Response("Tidak ditemukan.", { status: 404 });
  }
  const candidates = [
    path.join(process.cwd(), "data", "uploads", name),
    path.join(process.cwd(), "public", "uploads", name),
  ];
  for (const file of candidates) {
    try {
      const body = await readFile(file);
      const ext = name.split(".").pop()?.toLowerCase() ?? "";
      return new Response(body, {
        headers: {
          "Content-Type": TYPES[ext] ?? "application/octet-stream",
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch {
      /* try the next folder */
    }
  }
  return new Response("Tidak ditemukan.", { status: 404 });
}
