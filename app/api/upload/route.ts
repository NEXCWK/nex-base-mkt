import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

const UPLOADS_DIR = path.join(process.cwd(), "data", "uploads");

function sectionDir(section: string) {
  // Sanitize section path so it can't escape the uploads dir
  const safe = section.replace(/\.\./g, "").replace(/[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ _/-]/g, "_");
  return path.join(UPLOADS_DIR, safe);
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

interface FileMeta {
  id: string;
  name: string;
  storedName: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
}

function safeName(name: string) {
  return name.replace(/[^a-zA-Z0-9áéíóúâêîôûãõçÁÉÍÓÚÂÊÎÔÛÃÕÇ._-]/g, "_");
}

const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_EXT = new Set([".pdf", ".docx", ".pptx", ".xlsx", ".png", ".jpg", ".jpeg", ".webp", ".mp4"]);

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const section = formData.get("section") as string | null;
  const category = formData.get("category") as string | null;

  if (!file || !section) return NextResponse.json({ error: "Missing file or section" }, { status: 400 });

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: `Arquivo muito grande (máx. ${MAX_SIZE / 1024 / 1024} MB).` },
      { status: 413 }
    );
  }

  const ext = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    return NextResponse.json(
      { error: `Formato não permitido (${ext || "sem extensão"}). Use PDF, DOCX, PPTX, XLSX, PNG, JPG, WEBP ou MP4.` },
      { status: 415 }
    );
  }

  const sectionPath = category ? `${section}/${category}` : section;
  const dir = sectionDir(sectionPath);
  fs.mkdirSync(dir, { recursive: true });

  // Sufixo aleatório evita colisão de ID em uploads quase simultâneos
  const id = `${Date.now()}${Math.random().toString(36).slice(2, 7)}`;
  const storedName = `${id}_${safeName(file.name)}`;
  const filePath = path.join(dir, storedName);

  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(filePath, buffer);

  const meta = readMeta(dir);
  const entry: FileMeta = {
    id,
    name: file.name,
    storedName,
    size: buffer.length,
    mimeType: file.type,
    uploadedBy: session.user.email ?? "",
    uploadedAt: new Date().toISOString(),
  };
  meta.push(entry);
  writeMeta(dir, meta);

  return NextResponse.json(entry, { status: 201 });
}
