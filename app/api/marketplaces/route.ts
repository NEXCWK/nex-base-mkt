import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface Marketplace {
  id: string;
  name: string;
  system: string;
  login: string;
  password: string;
  dailyRate: string;
  hourlyRate: string;
  email: string;
  phone: string;
  desks: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("marketplaces"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("marketplaces") as Marketplace[];
  const item: Marketplace = {
    id: Date.now().toString(),
    name: body.name || "Novo Marketplace",
    system: body.system || "",
    login: body.login || "",
    password: body.password || "",
    dailyRate: body.dailyRate || "",
    hourlyRate: body.hourlyRate || "",
    email: body.email || "",
    phone: body.phone || "",
    desks: body.desks || "",
    notes: body.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("marketplaces", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("marketplaces") as Marketplace[];
  const idx = items.findIndex((m) => m.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    name: body.name ?? items[idx].name,
    system: body.system ?? items[idx].system,
    login: body.login ?? items[idx].login,
    password: body.password ?? items[idx].password,
    dailyRate: body.dailyRate ?? items[idx].dailyRate,
    hourlyRate: body.hourlyRate ?? items[idx].hourlyRate,
    email: body.email ?? items[idx].email,
    phone: body.phone ?? items[idx].phone,
    desks: body.desks ?? items[idx].desks,
    notes: body.notes ?? items[idx].notes,
    updatedAt: new Date().toISOString(),
  };
  writeFile("marketplaces", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("marketplaces", (readFile("marketplaces") as Marketplace[]).filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
