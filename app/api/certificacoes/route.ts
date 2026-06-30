import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const DATA_FILE = path.join(process.cwd(), "data", "certificacoes.json");
// Marker so the default certificates are seeded only once per environment.
// Storing it next to the data (on the persistent volume in production) means a
// later deletion of these certs is respected and they are never re-added.
const SEED_MARKER = path.join(process.cwd(), "data", ".certificacoes-seed-v1");

interface CertItem {
  id: string;
  name: string;
  url?: string;
  addedAt: string;
}

interface CertGroup {
  id: string;
  name: string;
  items: CertItem[];
  createdAt: string;
}

const DEFAULT_CERT_NAMES = [
  "Conexa",
  "Claude",
  "Google Analytics 4",
  "Google Search Console",
  "Google Ads",
  "semRUSH",
  "Hotjar",
  "Reportei",
];

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

// Seeds the default "Ferramentas & Plataformas" group exactly once per
// environment. Runs against the live (volume-backed) data, so it works in
// production where the committed JSON file is shadowed by the volume.
function ensureSeed(groups: CertGroup[]): CertGroup[] {
  try {
    if (fs.existsSync(SEED_MARKER)) return groups;
    const now = new Date().toISOString();
    const seededGroup: CertGroup = {
      id: randomUUID(),
      name: "Ferramentas & Plataformas",
      createdAt: now,
      items: DEFAULT_CERT_NAMES.map((name) => ({
        id: randomUUID(),
        name,
        url: "",
        addedAt: now,
      })),
    };
    const merged = [...groups, seededGroup];
    writeGroups(merged);
    fs.mkdirSync(path.dirname(SEED_MARKER), { recursive: true });
    fs.writeFileSync(SEED_MARKER, now);
    return merged;
  } catch {
    return groups;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(ensureSeed(readGroups()));
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
    if (!body.name?.trim() || !body.groupId) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const group = groups.find((g) => g.id === body.groupId);
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });
    const item: CertItem = {
      id: randomUUID(),
      name: body.name.trim(),
      url: body.url?.trim() || "",
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
    if (body.url !== undefined) item.url = body.url.trim();
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
