import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { sendSlackNotification, buildReportSlackMessage } from "@/lib/slack";

const REPORTS_FILE = path.join(process.cwd(), "data/reports.json");

function readReports() {
  return JSON.parse(fs.readFileSync(REPORTS_FILE, "utf-8"));
}

function writeReports(data: unknown[]) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(data, null, 2));
}

export async function GET(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = readReports();
  const user = req.nextUrl.searchParams.get("user");
  const date = req.nextUrl.searchParams.get("date");

  let filtered = reports;
  if (user) filtered = filtered.filter((r: { userEmail: string }) => r.userEmail === user);
  if (date) filtered = filtered.filter((r: { date: string }) => r.date === date);

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const reports = readReports();

  const newReport = {
    id: Date.now().toString(),
    userEmail: session.user.email,
    userName: session.user.name,
    date: format(new Date(), "yyyy-MM-dd"),
    timestamp: new Date().toISOString(),
    // Campos padronizados do report
    feeling: body.feeling || "bom",           // Feeling do Dia
    leads: Number(body.leads) || 0,           // Procura/Leads
    newSales: Number(body.newSales) || 0,     // Novas Vendas
    churns: Number(body.churns) || 0,         // Churns/Cancelamentos
    compliments: body.compliments || "",      // Elogios
    complaints: body.complaints || "",        // Reclamações
    notes: body.notes || "",                  // Observações Gerais
  };

  reports.push(newReport);
  writeReports(reports);

  // Slack notification (non-blocking)
  const slackMsg = buildReportSlackMessage(
    newReport.userName || newReport.userEmail || "",
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
