import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";
import fs from "fs";
import path from "path";

type InfluencerTipo = "fixo" | "avulso";

interface ContentLink {
  id: string;
  url: string;
  descricao?: string;
  addedAt: string;
}

interface InfluencerConteudo {
  id: string;
  tipo: InfluencerTipo;
  name: string;
  category: string;
  bio: string;
  photoUrl: string;
  profileLink: string;
  instagram: string;
  contentLinks: ContentLink[];
  createdAt: string;
  updatedAt: string;
}

interface LegacyInfluenciador {
  id: string;
  name: string;
  category: string;
  bio: string;
  website: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

function isValidTipo(v: unknown): v is InfluencerTipo {
  return v === "fixo" || v === "avulso";
}

type RawInfluencer = Partial<InfluencerConteudo> & {
  id: string;
  createdAt: string;
  updatedAt: string;
  contentLink?: string; // legacy single-link field from an earlier iteration
};

// Tolerates records from earlier iterations of this feature (missing bio/
// instagram, a blank tipo, or the old single "contentLink" string instead of
// the contentLinks array) so old data keeps working.
function normalize(raw: RawInfluencer): InfluencerConteudo {
  const contentLinks = Array.isArray(raw.contentLinks) ? raw.contentLinks : [];
  const migratedLegacyLink: ContentLink[] =
    contentLinks.length === 0 && raw.contentLink?.trim()
      ? [{ id: `${raw.id}-legacy-link`, url: raw.contentLink.trim(), addedAt: raw.updatedAt }]
      : [];
  return {
    id: raw.id,
    tipo: raw.tipo === "avulso" ? "avulso" : "fixo",
    name: raw.name || "",
    category: raw.category || "",
    bio: raw.bio || "",
    photoUrl: raw.photoUrl || "",
    profileLink: raw.profileLink || "",
    instagram: raw.instagram || "",
    contentLinks: contentLinks.length > 0 ? contentLinks : migratedLegacyLink,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

// One-time migration: the old standalone "Influenciadores" tab (name, category,
// bio, website, photo) is being folded into Conteúdo Influs > Fixos. Marker
// file ensures this only runs once per environment and respects later deletes.
const MIGRATION_MARKER = path.join(process.cwd(), "data", ".conteudo-influs-migrated-influenciadores");

function migrateLegacyInfluenciadores(items: InfluencerConteudo[]): InfluencerConteudo[] {
  if (fs.existsSync(MIGRATION_MARKER)) return items;
  try {
    const legacy = readFile("influenciadores") as LegacyInfluenciador[];
    const existingIds = new Set(items.map((i) => i.id));
    const migrated: InfluencerConteudo[] = legacy
      .filter((l) => !existingIds.has(l.id))
      .map((l) =>
        normalize({
          id: l.id,
          tipo: "fixo",
          name: l.name,
          category: l.category,
          bio: l.bio,
          photoUrl: l.photoUrl,
          profileLink: l.website,
          contentLinks: [],
          createdAt: l.createdAt,
          updatedAt: l.updatedAt,
        })
      );
    const merged = [...items, ...migrated];
    if (migrated.length > 0) writeFile("conteudo-influs", merged);
    fs.mkdirSync(path.dirname(MIGRATION_MARKER), { recursive: true });
    fs.writeFileSync(MIGRATION_MARKER, new Date().toISOString());
    return merged;
  } catch {
    return items;
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const items = (readFile("conteudo-influs") as RawInfluencer[]).map(normalize);
  return NextResponse.json(migrateLegacyInfluenciadores(items));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "Nome obrigatório" }, { status: 400 });
  if (!isValidTipo(body.tipo)) {
    return NextResponse.json({ error: "Tipo (Fixo ou Avulso) é obrigatório" }, { status: 400 });
  }
  if (body.tipo === "avulso" && (!body.instagram?.trim() || !body.contentLink?.trim())) {
    return NextResponse.json({ error: "@ do Instagram e link do conteúdo são obrigatórios" }, { status: 400 });
  }
  const items = (readFile("conteudo-influs") as RawInfluencer[]).map(normalize);
  const now = new Date().toISOString();
  const id = Date.now().toString();
  const initialLink: ContentLink[] = body.contentLink?.trim()
    ? [{ id: `${id}-link-1`, url: body.contentLink.trim(), addedAt: now }]
    : [];
  const item = normalize({
    id,
    tipo: body.tipo,
    name: body.name.trim(),
    category: body.category,
    bio: body.bio,
    photoUrl: body.photoUrl,
    profileLink: body.profileLink,
    instagram: body.instagram?.trim(),
    contentLinks: initialLink,
    createdAt: now,
    updatedAt: now,
  });
  items.push(item);
  writeFile("conteudo-influs", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  if (body.tipo !== undefined && !isValidTipo(body.tipo)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }
  const items = (readFile("conteudo-influs") as RawInfluencer[]).map(normalize);
  const idx = items.findIndex((i) => i.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = normalize({
    ...items[idx],
    name: body.name !== undefined ? body.name.trim() : items[idx].name,
    tipo: body.tipo !== undefined ? body.tipo : items[idx].tipo,
    category: body.category !== undefined ? body.category : items[idx].category,
    bio: body.bio !== undefined ? body.bio : items[idx].bio,
    photoUrl: body.photoUrl !== undefined ? body.photoUrl : items[idx].photoUrl,
    profileLink: body.profileLink !== undefined ? body.profileLink : items[idx].profileLink,
    instagram: body.instagram !== undefined ? body.instagram.trim() : items[idx].instagram,
    contentLinks: body.contentLinks !== undefined ? body.contentLinks : items[idx].contentLinks,
    updatedAt: new Date().toISOString(),
  });
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
