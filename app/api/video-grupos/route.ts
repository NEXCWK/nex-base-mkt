import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

interface VideoGrupo {
  id: string;
  name: string;
  createdAt: string;
}

function safeType(type: string) {
  return type.replace(/[^a-z0-9-]/gi, "");
}

function dataPath(type: string) {
  return path.join(process.cwd(), "data", `video-grupos-${safeType(type)}.json`);
}

async function readGrupos(type: string): Promise<VideoGrupo[]> {
  try {
    const raw = await fs.readFile(dataPath(type), "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeGrupos(type: string, grupos: VideoGrupo[]) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(dataPath(type), JSON.stringify(grupos, null, 2));
}

export async function GET(req: NextRequest) {
  const type = req.nextUrl.searchParams.get("type") || "";
  if (!type) return NextResponse.json({ error: "type required" }, { status: 400 });
  return NextResponse.json(await readGrupos(type));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, name } = body as { type?: string; name?: string };
  if (!type || !name?.trim()) {
    return NextResponse.json({ error: "type and name required" }, { status: 400 });
  }
  const grupos = await readGrupos(type);
  const novo: VideoGrupo = { id: randomUUID(), name: name.trim(), createdAt: new Date().toISOString() };
  grupos.push(novo);
  await writeGrupos(type, grupos);
  return NextResponse.json(novo, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { type, id } = body as { type?: string; id?: string };
  if (!type || !id) {
    return NextResponse.json({ error: "type and id required" }, { status: 400 });
  }
  const grupos = await readGrupos(type);
  await writeGrupos(type, grupos.filter((g) => g.id !== id));
  return NextResponse.json({ ok: true });
}
