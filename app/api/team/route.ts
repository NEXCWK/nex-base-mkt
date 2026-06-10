import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readFile("team"));
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const team = readFile("team") as { email: string }[];
  const idx = team.findIndex((m) => m.email === session.user!.email);

  const member = {
    email: session.user.email,
    name: body.name || session.user.name,
    role: body.role || "",
    bio: body.bio || "",
    curiosities: body.curiosities || "",
    age: body.age || "",
    likes: body.likes || "",
    sports: body.sports || "",
    photoUrl: body.photoUrl || "",
    updatedAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    team[idx] = member;
  } else {
    team.push(member);
  }

  writeFile("team", team);
  return NextResponse.json(member);
}
