import { NextResponse } from "next/server";
import { readFile } from "@/lib/data-store";

// Reads data/calendario-influ.json on every request — without this, Next.js
// statically prerenders the route at build time and would serve a frozen
// snapshot instead of live confirmed dates.
export const dynamic = "force-dynamic";

interface AvulsoContato {
  id: string;
  name: string;
  instagram: string;
  uso: "primeiro" | "segundo";
  status: "mapeado" | "data-a-confirmar" | "data-confirmada";
  data: string;
  notas: string;
  createdAt: string;
  updatedAt: string;
}

// No auth check: this endpoint exists specifically to power the public,
// no-login calendar page. Only confirmed dates are exposed — internal
// pipeline status (mapeado / data-a-confirmar) and notes stay private.
export async function GET() {
  const items = readFile("calendario-influ") as AvulsoContato[];
  const confirmed = items
    .filter((i) => i.status === "data-confirmada" && i.data)
    .map((i) => ({ id: i.id, name: i.name, instagram: i.instagram, uso: i.uso, data: i.data }));
  return NextResponse.json({ confirmed });
}
