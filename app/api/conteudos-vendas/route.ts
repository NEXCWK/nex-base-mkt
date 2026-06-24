import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface ConteudoVendas {
  id: string;
  url: string;
  descricao: string;
  produto: string;
  createdAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("conteudos-vendas"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("conteudos-vendas") as ConteudoVendas[];
  const item: ConteudoVendas = {
    id: Date.now().toString(),
    url: body.url || "",
    descricao: body.descricao || "",
    produto: body.produto || "",
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("conteudos-vendas", items);
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile(
    "conteudos-vendas",
    (readFile("conteudos-vendas") as ConteudoVendas[]).filter((s) => s.id !== id)
  );
  return NextResponse.json({ ok: true });
}
