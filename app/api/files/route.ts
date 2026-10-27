import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const section = req.nextUrl.searchParams.get("section");
  const id = req.nextUrl.searchParams.get("id");
  const storedName = req.nextUrl.searchParams.get("storedName");
  const download = req.nextUrl.searchParams.get("download") === "1";

  if (!section || !id || !storedName) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const safeSec = section.replace(/\.\./g, "").replace(/[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ _/-]/g, "_");
  const safeStored = path.basename(storedName);
  const filePath = path.join(UPLOADS_DIR, safeSec, safeStored);

  if (!filePath.startsWith(UPLOADS_DIR) || !fs.existsSync(filePath)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const ext = path.extname(storedName).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".mp4": "video/mp4",
  };
  const contentType = mimeMap[ext] ?? "application/octet-stream";

  // Stored names are "<id>_<original>", where the id is a timestamp plus a
  // short random suffix; strip it so downloads keep the original file name.
  const displayName = path.basename(storedName.replace(/^\d{13}[a-z0-9]{0,5}_/, ""));
  const disposition = download ? "attachment" : "inline";
  const baseHeaders = {
    "Content-Type": contentType,
    "Content-Disposition": `${disposition}; filename="${displayName.replace(/"/g, "")}"; filename*=UTF-8''${encodeURIComponent(displayName)}`,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
  };

  const { size } = fs.statSync(filePath);

  // Byte-range support: Safari/iOS only plays <video> when the server answers
  // range requests, and it also lets every browser seek without downloading
  // the whole file first.
  const range = req.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (match && (match[1] || match[2])) {
    let start: number;
    let end: number;
    if (match[1]) {
      start = Number(match[1]);
      end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
    } else {
      // "bytes=-N" → last N bytes
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    }
    if (start > end || start >= size) {
      return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const chunk = Buffer.alloc(end - start + 1);
    const fd = fs.openSync(filePath, "r");
    try {
      fs.readSync(fd, chunk, 0, chunk.length, start);
    } finally {
      fs.closeSync(fd);
    }
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...baseHeaders,
        "Content-Length": String(chunk.length),
        "Content-Range": `bytes ${start}-${end}/${size}`,
      },
    });
  }

  const buffer = fs.readFileSync(filePath);
  return new NextResponse(buffer, {
    headers: {
      ...baseHeaders,
      "Content-Length": String(buffer.length),
    },
  });
}
