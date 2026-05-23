// Daily report cron job - runs at 08:00 every day (America/Sao_Paulo)
// Import and call startCronJobs() in your custom server or instrumentation hook
import cron from "node-cron";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import fs from "fs";
import path from "path";
import { sendDailyReport, type DailyReportData } from "@/lib/email";

function readReports() {
  const filePath = path.join(process.cwd(), "data/reports.json");
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

async function runDailyReport() {
  const yesterday = subDays(new Date(), 1);
  const dateStr = format(yesterday, "yyyy-MM-dd");
  const dateLabel = format(yesterday, "dd/MM/yyyy", { locale: ptBR });

  const allReports = readReports();
  const dayReports = allReports.filter((r: { date: string }) => r.date === dateStr);

  if (dayReports.length === 0) {
    console.log(`[cron] No reports for ${dateStr}, skipping email.`);
    return;
  }

  const data: DailyReportData = {
    date: dateLabel,
    reports: dayReports.map((r: {
      userName: string;
      feeling: string;
      leads: number;
      newSales: number;
      churns: number;
      compliments: string;
      complaints: string;
      notes: string;
    }) => ({
      userName: r.userName,
      feeling: r.feeling,
      leads: r.leads,
      newSales: r.newSales,
      churns: r.churns,
      compliments: r.compliments,
      complaints: r.complaints,
      notes: r.notes,
    })),
  };

  try {
    await sendDailyReport(data);
    console.log(`[cron] Daily report sent for ${dateStr}`);
  } catch (err) {
    console.error("[cron] Failed to send daily report:", err);
  }
}

export function startCronJobs() {
  cron.schedule("0 8 * * *", runDailyReport, {
    timezone: "America/Sao_Paulo",
  });
  console.log("[cron] Daily report scheduled at 08:00 America/Sao_Paulo");
}
