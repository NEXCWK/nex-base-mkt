import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadFileToDrive } from "@/lib/drive";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const section = formData.get("section") as string | null;
  const category = formData.get("category") as string | null;

  if (!file || !section) {
    return NextResponse.json({ error: "Missing file or section" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const folderName = category ? `${section}/${category}` : section;

  try {
    const result = await uploadFileToDrive(buffer, file.name, file.type, folderName);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Drive upload error:", err);
    return NextResponse.json(
      { error: "Falha no upload para o Google Drive. Verifique as credenciais." },
      { status: 500 }
    );
  }
}
