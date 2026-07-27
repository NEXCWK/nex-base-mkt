import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface ContentLink {
  id: string;
  url: string;
  descricao?: string;
  addedAt: string;
}

interface InfluencerConteudo {
  id: string;
  name: string;
  category: string;
  photoUrl: string;
  profileLink: string;
  contentLinks: ContentLink[];
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("conteudo-influs"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  const items = readFile("conteudo-influs") as InfluencerConteudo[];
  const now = new Date().toISOString();
  const item: InfluencerConteudo = {
    id: Date.now().toString(),
    name: body.name.trim(),
    category: body.category || "",
    photoUrl: body.photoUrl || "",
    profileLink: body.profileLink || "",
    contentLinks: [],
    createdAt: now,
    updatedAt: now,
  };
  items.push(item);
  writeFile("conteudo-influs", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("conteudo-influs") as InfluencerConteudo[];
  const idx = items.findIndex((i) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    name: body.name !== undefined ? body.name.trim() : items[idx].name,
    category: body.category !== undefined ? body.category : items[idx].category,
    photoUrl: body.photoUrl !== undefined ? body.photoUrl : items[idx].photoUrl,
    profileLink: body.profileLink !== undefined ? body.profileLink : items[idx].profileLink,
    contentLinks: body.contentLinks !== undefined ? body.contentLinks : items[idx].contentLinks,
    updatedAt: new Date().toISOString(),
  };
  writeFile("conteudo-influs", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("conteudo-influs", (readFile("conteudo-influs") as InfluencerConteudo[]).filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
