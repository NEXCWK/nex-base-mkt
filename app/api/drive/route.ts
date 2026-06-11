import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

function sectionDir(section: string) {
  const safe = section.replace(/\.\./g, "").replace(/[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ _/-]/g, "_");
  return path.join(UPLOADS_DIR, safe);
}

interface FileMeta {
  id: string;
  name: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

function readMeta(dir: string): FileMeta[] {
  const metaPath = path.join(dir, "_meta.json");
  if (!fs.existsSync(metaPath)) return [];
  try { return JSON.parse(fs.readFileSync(metaPath, "utf-8")); } catch { return []; }
}

function writeMeta(dir: string, meta: FileMeta[]) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "_meta.json"), JSON.stringify(meta, null, 2));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const section = req.nextUrl.searchParams.get("section");
  if (!section) return NextResponse.json({ error: "Missing section" }, { status: 400 });

  const dir = sectionDir(section);
  return NextResponse.json(readMeta(dir));
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { fileId, section } = await req.json();
  if (!fileId || !section) return NextResponse.json({ error: "Missing fileId or section" }, { status: 400 });

  const dir = sectionDir(section);
  const meta = readMeta(dir);
  const entry = meta.find((f) => f.id === fileId);

  if (entry) {
    const filePath = path.join(dir, entry.storedName);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  writeMeta(dir, meta.filter((f) => f.id !== fileId));
  return NextResponse.json({ ok: true });
}
