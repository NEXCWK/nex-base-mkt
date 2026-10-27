import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getUpcomingEvents } from "@/lib/calendar";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const items = await getUpcomingEvents(8);
    // Normalized to the shape the agenda widget renders.
    const events = items.map((e) => ({
      id: e.id ?? "",
      title: e.summary || "(Sem título)",
      start: e.start?.dateTime ?? e.start?.date ?? "",
      end: e.end?.dateTime ?? e.end?.date ?? "",
      allDay: !e.start?.dateTime,
      location: e.location ?? undefined,
    })).filter((e) => e.start);
    return NextResponse.json({ events });
  } catch (err) {
    console.error("Calendar error:", err);
    return NextResponse.json({ error: "Erro ao carregar calendário." }, { status: 500 });
  }
}
