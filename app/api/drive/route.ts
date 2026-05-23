import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { listDriveFiles, deleteFromDrive } from "@/lib/drive";

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const section = req.nextUrl.searchParams.get("section");
  if (!section) {
    return NextResponse.json({ error: "Missing section" }, { status: 400 });
  }

  try {
    const files = await listDriveFiles(section);
    return NextResponse.json(files);
  } catch (err) {
    console.error("Drive list error:", err);
    return NextResponse.json({ error: "Erro ao listar arquivos do Drive." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { fileId } = await req.json();
  if (!fileId) {
    return NextResponse.json({ error: "Missing fileId" }, { status: 400 });
  }

  try {
    await deleteFromDrive(fileId);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao deletar arquivo." }, { status: 500 });
  }
}
