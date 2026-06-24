import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface Partner {
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
  return NextResponse.json(readFile("parceiros"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("parceiros") as Partner[];
  const item: Partner = {
    id: Date.now().toString(),
    name: body.name || "Novo Parceiro",
    category: body.category || "",
    bio: body.bio || "",
    website: body.website || "",
    photoUrl: body.photoUrl || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("parceiros", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("parceiros") as Partner[];
  const idx = items.findIndex((s) => s.id === body.id);
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
  writeFile("parceiros", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("parceiros", (readFile("parceiros") as Partner[]).filter((s) => s.id !== id));
  return NextResponse.json({ ok: true });
}
