import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";

interface ApresentacaoComercial {
  id: string;
  produto: string;
  url: string;
  descricao?: string;
  createdAt: string;
  updatedAt: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "apresentacoes-comerciais.json");

async function readItems(): Promise<ApresentacaoComercial[]> {
  try {
    return JSON.parse(await fs.readFile(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

async function writeItems(items: ApresentacaoComercial[]) {
  await fs.mkdir(path.join(process.cwd(), "data"), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(items, null, 2));
}

export async function GET() {
  return NextResponse.json(await readItems());
}

export async function POST(req: NextRequest) {
  const { produto, url, descricao } = await req.json() as Partial<ApresentacaoComercial>;
  if (!produto?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "produto e url são obrigatórios" }, { status: 400 });
  }
  const items = await readItems();
  const now = new Date().toISOString();
  const novo: ApresentacaoComercial = {
    id: randomUUID(),
    produto: produto.trim(),
    url: url.trim(),
    descricao: descricao?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  items.push(novo);
  await writeItems(items);
  return NextResponse.json(novo, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const { id, produto, url, descricao } = await req.json() as Partial<ApresentacaoComercial>;
  if (!id || !produto?.trim() || !url?.trim()) {
    return NextResponse.json({ error: "id, produto e url são obrigatórios" }, { status: 400 });
  }
  const items = await readItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return NextResponse.json({ error: "not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    produto: produto.trim(),
    url: url.trim(),
    descricao: descricao?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  };
  await writeItems(items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json() as { id?: string };
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  const items = await readItems();
  await writeItems(items.filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
