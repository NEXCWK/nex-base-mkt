import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";

const SCRIPTS_FILE = path.join(process.cwd(), "data/scripts.json");

function readScripts() {
  return JSON.parse(fs.readFileSync(SCRIPTS_FILE, "utf-8"));
}

function writeScripts(data: unknown[]) {
  fs.writeFileSync(SCRIPTS_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readScripts());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const scripts = readScripts();

  const newScript = {
    id: Date.now().toString(),
    name: body.name || "Novo Script",
    content: body.content || "",
    createdBy: session.user.email,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  scripts.push(newScript);
  writeScripts(scripts);
  return NextResponse.json(newScript, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const scripts = readScripts();
  const idx = scripts.findIndex((s: { id: string }) => s.id === body.id);
  if (idx === -1) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  scripts[idx] = { ...scripts[idx], ...body, updatedAt: new Date().toISOString() };
  writeScripts(scripts);
  return NextResponse.json(scripts[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();
  const scripts = readScripts().filter((s: { id: string }) => s.id !== id);
  writeScripts(scripts);
  return NextResponse.json({ ok: true });
}
