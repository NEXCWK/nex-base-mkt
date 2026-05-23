import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import fs from "fs";
import path from "path";

const TEAM_FILE = path.join(process.cwd(), "data/team.json");

function readTeam() {
  return JSON.parse(fs.readFileSync(TEAM_FILE, "utf-8"));
}

function writeTeam(data: unknown[]) {
  fs.writeFileSync(TEAM_FILE, JSON.stringify(data, null, 2));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(readTeam());
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const team = readTeam();
  const idx = team.findIndex((m: { email: string }) => m.email === session.user!.email);

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

  writeTeam(team);
  return NextResponse.json(member);
}
