import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { readFile, writeFile } from "@/lib/data-store";
import { format } from "date-fns";
import { sendSlackNotification, buildReportSlackMessage } from "@/lib/slack";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = readFile("reports") as { userEmail: string; date: string }[];
  const user = req.nextUrl.searchParams.get("user");
  const date = req.nextUrl.searchParams.get("date");

  let filtered = reports;
  if (user) filtered = filtered.filter((r) => r.userEmail === user);
  if (date) filtered = filtered.filter((r) => r.date === date);

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reports = readFile("reports");

  const newReport = {
    id: Date.now().toString(),
    userEmail: session.user.email,
    userName: session.user.name,
    date: format(new Date(), "yyyy-MM-dd"),
    timestamp: new Date().toISOString(),
    feeling: body.feeling || "bom",
    leads: Number(body.leads) || 0,
    newSales: Number(body.newSales) || 0,
    churns: Number(body.churns) || 0,
    compliments: body.compliments || "",
    complaints: body.complaints || "",
    notes: body.notes || "",
  };

  reports.push(newReport);
  writeFile("reports", reports);

  const slackMsg = buildReportSlackMessage(
    (newReport.userName as string) || (newReport.userEmail as string) || "",
    newReport.date,
    {
      feeling: newReport.feeling,
      leads: newReport.leads,
      newSales: newReport.newSales,
      churns: newReport.churns,
    }
  );
  sendSlackNotification(slackMsg).catch(console.error);

  return NextResponse.json(newReport, { status: 201 });
}
