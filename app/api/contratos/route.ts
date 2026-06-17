import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface Folder { id: string; name: string; description?: string; createdAt: string }

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("contratos"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("contratos") as Folder[];
  const folder: Folder = {
    id: `folder-${Date.now()}`,
    name: body.name || "Novo Conjunto",
    description: body.description || "",
    createdAt: new Date().toISOString(),
  };
  items.push(folder);
  writeFile("contratos", items);
  return NextResponse.json(folder, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("contratos", (readFile("contratos") as Folder[]).filter((f) => f.id !== id));
  return NextResponse.json({ ok: true });
}
