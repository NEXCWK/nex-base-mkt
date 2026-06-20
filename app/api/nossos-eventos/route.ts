import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface Evento {
  id: string;
  name: string;
  date: string;
  description: string;
  location: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("nossos-eventos"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("nossos-eventos") as Evento[];
  const item: Evento = {
    id: Date.now().toString(),
    name: body.name || "Novo Evento",
    date: body.date || "",
    description: body.description || "",
    location: body.location || "",
    photoUrl: body.photoUrl || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("nossos-eventos", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("nossos-eventos") as Evento[];
  const idx = items.findIndex((e) => e.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    name: body.name ?? items[idx].name,
    date: body.date ?? items[idx].date,
    description: body.description ?? items[idx].description,
    location: body.location ?? items[idx].location,
    photoUrl: body.photoUrl ?? items[idx].photoUrl,
    updatedAt: new Date().toISOString(),
  };
  writeFile("nossos-eventos", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("nossos-eventos", (readFile("nossos-eventos") as Evento[]).filter((e) => e.id !== id));
  return NextResponse.json({ ok: true });
}
