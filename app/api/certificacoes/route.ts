import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "certificacoes.json");

interface CertItem {
  id: string;
  name: string;
  url: string;
  addedAt: string;
}

interface CertGroup {
  id: string;
  name: string;
  items: CertItem[];
  createdAt: string;
}

function readGroups(): CertGroup[] {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function writeGroups(groups: CertGroup[]) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(groups, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readGroups());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const groups = readGroups();

  if (body.type === "group") {
    if (!body.name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    const group: CertGroup = {
      id: randomUUID(),
      name: body.name.trim(),
      items: [],
      createdAt: new Date().toISOString(),
    };
    groups.push(group);
    writeGroups(groups);
    return NextResponse.json(group, { status: 201 });
  }

  if (body.type === "item") {
    if (!body.name?.trim() || !body.url?.trim() || !body.groupId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const group = groups.find((g) => g.id === body.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const item: CertItem = {
      id: randomUUID(),
      name: body.name.trim(),
      url: body.url.trim(),
      addedAt: new Date().toISOString(),
    };
    group.items.push(item);
    writeGroups(groups);
    return NextResponse.json(item, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const groups = readGroups();

  if (body.type === "group") {
    const group = groups.find((g) => g.id === body.id);
    if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 });
    group.name = body.name?.trim() || group.name;
    writeGroups(groups);
    return NextResponse.json(group);
  }

  if (body.type === "item") {
    const group = groups.find((g) => g.id === body.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const item = group.items.find((i) => i.id === body.id);
    if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });
    item.name = body.name?.trim() || item.name;
    item.url = body.url?.trim() || item.url;
    writeGroups(groups);
    return NextResponse.json(item);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  let groups = readGroups();

  if (body.type === "group") {
    groups = groups.filter((g) => g.id !== body.id);
    writeGroups(groups);
    return NextResponse.json({ ok: true });
  }

  if (body.type === "item") {
    const group = groups.find((g) => g.id === body.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    group.items = group.items.filter((i) => i.id !== body.id);
    writeGroups(groups);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
