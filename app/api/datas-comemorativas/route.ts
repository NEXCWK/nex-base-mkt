import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

interface DataComemorativa {
  id: string;
  data: string;
  nomeAcao: string;
  razao: string;
  createdAt: string;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(readFile("datas-comemorativas"));
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const items = readFile("datas-comemorativas") as DataComemorativa[];
  const item: DataComemorativa = {
    id: Date.now().toString(),
    data: body.data || "",
    nomeAcao: body.nomeAcao || "",
    razao: body.razao || "",
    createdAt: new Date().toISOString(),
  };
  items.push(item);
  writeFile("datas-comemorativas", items);
  return NextResponse.json(item, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  writeFile(
    "datas-comemorativas",
    (readFile("datas-comemorativas") as DataComemorativa[]).filter((s) => s.id !== id)
  );
  return NextResponse.json({ ok: true });
}
