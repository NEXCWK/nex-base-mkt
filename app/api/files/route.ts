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

  const buffer = fs.readFileSync(filePath);
  const ext = path.extname(storedName).toLowerCase();
  const mimeMap: Record<string, string> = {
    ".pdf": "application/pdf",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".mp4": "video/mp4",
  };
  const contentType = mimeMap[ext] ?? "application/octet-stream";

  const displayName = path.basename(storedName.replace(/^\d+_/, ""));
  const disposition = download ? "attachment" : "inline";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(buffer.length),
      "Content-Disposition": `${disposition}; filename="${displayName}"; filename*=UTF-8''${encodeURIComponent(displayName)}`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
