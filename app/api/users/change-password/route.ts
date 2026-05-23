import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { updatePassword } from "@/lib/auth/users";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, newPassword } = await req.json();
  if (!newPassword || newPassword.length < 8) {
    return NextResponse.json(
      { error: "A senha deve ter no mínimo 8 caracteres." },
      { status: 400 }
    );
  }

  try {
    await updatePassword(userId, newPassword);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar senha." }, { status: 500 });
  }
}
