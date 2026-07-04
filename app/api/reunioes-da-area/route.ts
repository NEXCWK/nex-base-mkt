import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface MeetingRoutine {
  id: string;
  title: string;
  type: "geral" | "campanha" | "comercial" | "comunicacao" | "marketing-ia";
  frequency: "mensal" | "semanal";
  participants: string;
  dateLabel: string;
  weekday: number | null;
  monthlyRule: "primeiros-dias" | "terceira-quinta" | "";
  time: string;
  duration: string;
  objective: string;
  agenda: string[];
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("reunioes-da-area"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("reunioes-da-area") as MeetingRoutine[];
  const item: MeetingRoutine = {
    id: Date.now().toString(),
    title: body.title || "Nova reunião",
    type: body.type || "geral",
    frequency: body.frequency || "mensal",
    participants: body.participants || "",
    dateLabel: body.dateLabel || "",
    weekday: body.weekday ?? null,
    monthlyRule: body.monthlyRule || "",
    time: body.time || "",
    duration: body.duration || "",
    objective: body.objective || "",
    agenda: Array.isArray(body.agenda) ? body.agenda : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("reunioes-da-area", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("reunioes-da-area") as MeetingRoutine[];
  const idx = items.findIndex((m) => m.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    title: body.title ?? items[idx].title,
    type: body.type ?? items[idx].type,
    frequency: body.frequency ?? items[idx].frequency,
    participants: body.participants ?? items[idx].participants,
    dateLabel: body.dateLabel ?? items[idx].dateLabel,
    weekday: body.weekday !== undefined ? body.weekday : items[idx].weekday,
    monthlyRule: body.monthlyRule !== undefined ? body.monthlyRule : items[idx].monthlyRule,
    time: body.time ?? items[idx].time,
    duration: body.duration ?? items[idx].duration,
    objective: body.objective ?? items[idx].objective,
    agenda: Array.isArray(body.agenda) ? body.agenda : items[idx].agenda,
    updatedAt: new Date().toISOString(),
  };
  writeFile("reunioes-da-area", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("reunioes-da-area", (readFile("reunioes-da-area") as MeetingRoutine[]).filter((m) => m.id !== id));
  return NextResponse.json({ ok: true });
}
