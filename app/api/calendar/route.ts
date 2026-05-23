import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getUpcomingEvents } from "@/lib/calendar";

export async function GET() {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const events = await getUpcomingEvents(8);
    return NextResponse.json(events);
  } catch (err) {
    console.error("Calendar error:", err);
    return NextResponse.json({ error: "Erro ao carregar calendário." }, { status: 500 });
  }
}
