import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface Influenciador {
  id: string;
  name: string;
  category: string;
  bio: string;
  website: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("influenciadores"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("influenciadores") as Influenciador[];
  const item: Influenciador = {
    id: Date.now().toString(),
    name: body.name || "Novo Influenciador",
    category: body.category || "",
    bio: body.bio || "",
    website: body.website || "",
    photoUrl: body.photoUrl || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("influenciadores", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("influenciadores") as Influenciador[];
  const idx = items.findIndex((i) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    name: body.name ?? items[idx].name,
    category: body.category ?? items[idx].category,
    bio: body.bio ?? items[idx].bio,
    website: body.website ?? items[idx].website,
    photoUrl: body.photoUrl ?? items[idx].photoUrl,
    updatedAt: new Date().toISOString(),
  };
  writeFile("influenciadores", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("influenciadores", (readFile("influenciadores") as Influenciador[]).filter((i) => i.id !== id));
  return NextResponse.json({ ok: true });
}
