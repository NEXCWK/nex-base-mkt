import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

type UsoTipo = "primeiro" | "segundo";
type StatusComunicacao = "mapeado" | "data-a-confirmar" | "data-confirmada";

interface AvulsoContato {
  id: string;
  name: string;
  instagram: string;
  uso: UsoTipo;
  status: StatusComunicacao;
  data: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

function isValidUso(v: unknown): v is UsoTipo {
  return v === "primeiro" || v === "segundo";
}

function isValidStatus(v: unknown): v is StatusComunicacao {
  return v === "mapeado" || v === "data-a-confirmar" || v === "data-confirmada";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("calendario-influ"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (!isValidUso(body.uso)) return NextResponse.json({ error: "Uso inválido" }, { status: 400 });
  if (!isValidStatus(body.status)) return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  if (body.status === "data-confirmada" && !body.data?.trim()) {
    return NextResponse.json({ error: "Data obrigatória quando o status é Data Confirmada" }, { status: 400 });
  }
  const items = readFile("calendario-influ") as AvulsoContato[];
  const now = new Date().toISOString();
  const item: AvulsoContato = {
    id: Date.now().toString(),
    name: body.name.trim(),
    instagram: body.instagram?.trim() || "",
    uso: body.uso,
    status: body.status,
    data: body.data?.trim() || "",
    notas: body.notas?.trim() || "",
    createdAt: now,
    updatedAt: now,
  };
  items.push(item);
  writeFile("calendario-influ", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.uso !== undefined && !isValidUso(body.uso)) {
    return NextResponse.json({ error: "Uso inválido" }, { status: 400 });
  }
  if (body.status !== undefined && !isValidStatus(body.status)) {
    return NextResponse.json({ error: "Status inválido" }, { status: 400 });
  }
  const items = readFile("calendario-influ") as AvulsoContato[];
  const idx = items.findIndex((i) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const merged: AvulsoContato = {
    ...items[idx],
    name: body.name !== undefined ? body.name.trim() : items[idx].name,
    instagram: body.instagram !== undefined ? body.instagram.trim() : items[idx].instagram,
    uso: body.uso !== undefined ? body.uso : items[idx].uso,
    status: body.status !== undefined ? body.status : items[idx].status,
    data: body.data !== undefined ? body.data.trim() : items[idx].data,
    notas: body.notas !== undefined ? body.notas.trim() : items[idx].notas,
    updatedAt: new Date().toISOString(),
  };
  if (merged.status === "data-confirmada" && !merged.data) {
    return NextResponse.json({ error: "Data obrigatória quando o status é Data Confirmada" }, { status: 400 });
  }
  items[idx] = merged;
  writeFile("calendario-influ", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("calendario-influ", (readFile("calendario-influ") as AvulsoContato[]).filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
