import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface VerbaEntry {
  id: string;
  month: string;
  platform: string;
  campaign: string;
  amount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("verba"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("verba") as VerbaEntry[];
  const item: VerbaEntry = {
    id: Date.now().toString(),
    month: body.month,
    platform: body.platform,
    campaign: body.campaign,
    amount: Number(body.amount),
    notes: body.notes || undefined,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("verba", items);
  return NextResponse.json(item, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("verba") as VerbaEntry[];
  const idx = items.findIndex((v) => v.id === body.id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });
  items[idx] = {
    ...items[idx],
    month: body.month ?? items[idx].month,
    platform: body.platform ?? items[idx].platform,
    campaign: body.campaign ?? items[idx].campaign,
    amount: body.amount !== undefined ? Number(body.amount) : items[idx].amount,
    notes: body.notes !== undefined ? (body.notes || undefined) : items[idx].notes,
    updatedAt: new Date().toISOString(),
  };
  writeFile("verba", items);
  return NextResponse.json(items[idx]);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile("verba", (readFile("verba") as VerbaEntry[]).filter((v) => v.id !== id));
  return NextResponse.json({ ok: true });
}
