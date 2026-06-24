import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface KanbanColumn {
  id: string;
  title: string;
  order: number;
  createdAt: string;
}

interface KanbanCard {
  id: string;
  columnId: string;
  title: string;
  description: string;
  members: string[];
  dueDate: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface KanbanData {
  columns: KanbanColumn[];
  cards: KanbanCard[];
}

function getData(): KanbanData {
  return ((readFile("repositorio") as [KanbanData])[0]) ?? { columns: [], cards: [] };
}

function saveData(data: KanbanData): void {
  writeFile("repositorio", [data]);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(getData());
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const body = await req.json();
  const data = getData();

  if (type === "column") {
    const column: KanbanColumn = {
      id: `col-${Date.now()}`,
      title: body.title || "Nova Coluna",
      order: data.columns.length,
      createdAt: new Date().toISOString(),
    };
    data.columns.push(column);
    saveData(data);
    return NextResponse.json(column, { status: 201 });
  }

  if (type === "card") {
    const colCards = data.cards.filter((c) => c.columnId === body.columnId);
    const card: KanbanCard = {
      id: `card-${Date.now()}`,
      columnId: body.columnId || "",
      title: body.title || "Novo Card",
      description: body.description || "",
      members: body.members || [],
      dueDate: body.dueDate || "",
      order: colCards.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.cards.push(card);
    saveData(data);
    return NextResponse.json(card, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const body = await req.json();
  const data = getData();

  if (type === "column") {
    const idx = data.columns.findIndex((c) => c.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    data.columns[idx] = {
      ...data.columns[idx],
      title: body.title ?? data.columns[idx].title,
      order: body.order ?? data.columns[idx].order,
    };
    saveData(data);
    return NextResponse.json(data.columns[idx]);
  }

  if (type === "card") {
    const idx = data.cards.findIndex((c) => c.id === body.id);
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
    data.cards[idx] = {
      ...data.cards[idx],
      columnId: body.columnId ?? data.cards[idx].columnId,
      title: body.title ?? data.cards[idx].title,
      description: body.description ?? data.cards[idx].description,
      members: body.members ?? data.cards[idx].members,
      dueDate: body.dueDate ?? data.cards[idx].dueDate,
      order: body.order ?? data.cards[idx].order,
      updatedAt: new Date().toISOString(),
    };
    saveData(data);
    return NextResponse.json(data.cards[idx]);
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const body = await req.json();
  const data = getData();

  if (type === "column") {
    data.columns = data.columns.filter((c) => c.id !== body.id);
    data.cards = data.cards.filter((c) => c.columnId !== body.id);
    saveData(data);
    return NextResponse.json({ ok: true });
  }

  if (type === "card") {
    data.cards = data.cards.filter((c) => c.id !== body.id);
    saveData(data);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
