// Nodemailer email integration for daily reports
// Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, REPORT_RECIPIENT
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Check SMTP_HOST, SMTP_USER, SMTP_PASS in .env.local"
    );
  }
  return nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: { user, pass },
  });
}

const FEELING_LABELS: Record<string, string> = {
  otimo: "Otimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  pessimo: "Pessimo",
};

export interface DailyReportData {
  date: string;
  reports: Array<{
    userName: string;
    feeling: string;
    leads: number;
    newSales: number;
    churns: number;
    compliments: string;
    complaints: string;
    notes: string;
  }>;
}

export function buildDailyReportHTML(data: DailyReportData): string {
  const totals = data.reports.reduce(
    (acc, r) => ({
      leads: acc.leads + r.leads,
      newSales: acc.newSales + r.newSales,
      churns: acc.churns + r.churns,
    }),
    { leads: 0, newSales: 0, churns: 0 }
  );

  const userRows = data.reports
    .map(
      (r) => `
    <tr style="border-bottom:1px solid #E5E5E5">
      <td style="padding:8px 12px;font-weight:600">${r.userName}</td>
      <td style="padding:8px 12px;text-align:center">${FEELING_LABELS[r.feeling] || r.feeling}</td>
      <td style="padding:8px 12px;text-align:center">${r.leads}</td>
      <td style="padding:8px 12px;text-align:center">${r.newSales}</td>
      <td style="padding:8px 12px;text-align:center">${r.churns}</td>
    </tr>`
    )
    .join("");

  const complimentsList = data.reports
    .filter((r) => r.compliments)
    .map((r) => `<li><strong>${r.userName}:</strong> ${r.compliments}</li>`)
    .join("");

  const complaintsList = data.reports
    .filter((r) => r.complaints)
    .map((r) => `<li><strong>${r.userName}:</strong> ${r.complaints}</li>`)
    .join("");

  const notesList = data.reports
    .filter((r) => r.notes)
    .map((r) => `<li><strong>${r.userName}:</strong> ${r.notes}</li>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Report Diario - ${data.date}</title></head>
<body style="margin:0;padding:0;background:#F5F5F5;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:700px;margin:32px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #E5E5E5">
  <tr><td style="padding:24px 32px;border-bottom:4px solid #FFD400">
    <h1 style="margin:0;font-size:22px;font-weight:700">Report Diario</h1>
    <p style="margin:4px 0 0;color:#6B7280;font-size:14px">${data.date}</p>
  </td></tr>
  <tr><td style="padding:24px 32px">
    <h2 style="font-size:15px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:.05em">Resumo do Time</h2>
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E5E5;border-radius:6px;overflow:hidden">
      <thead><tr style="background:#F5F5F5">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#6B7280;font-weight:600">MEMBRO</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">FEELING</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">LEADS</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">NOVAS VENDAS</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#6B7280;font-weight:600">CHURNS</th>
      </tr></thead>
      <tbody>${userRows}</tbody>
      <tfoot><tr style="background:#FFFBEB;font-weight:700">
        <td style="padding:10px 12px">Total</td>
        <td style="padding:10px 12px;text-align:center">-</td>
        <td style="padding:10px 12px;text-align:center">${totals.leads}</td>
        <td style="padding:10px 12px;text-align:center">${totals.newSales}</td>
        <td style="padding:10px 12px;text-align:center">${totals.churns}</td>
      </tr></tfoot>
    </table>
  </td></tr>
  ${complimentsList ? `<tr><td style="padding:0 32px 24px">
    <h2 style="font-size:15px;font-weight:700;margin:0 0 12px">Elogios</h2>
    <ul style="margin:0;padding-left:20px;color:#2A2A2A;line-height:1.7">${complimentsList}</ul>
  </td></tr>` : ""}
  ${complaintsList ? `<tr><td style="padding:0 32px 24px">
    <h2 style="font-size:15px;font-weight:700;margin:0 0 12px">Reclamacoes</h2>
    <ul style="margin:0;padding-left:20px;color:#2A2A2A;line-height:1.7">${complaintsList}</ul>
  </td></tr>` : ""}
  ${notesList ? `<tr><td style="padding:0 32px 24px">
    <h2 style="font-size:15px;font-weight:700;margin:0 0 12px">Observacoes Gerais</h2>
    <ul style="margin:0;padding-left:20px;color:#2A2A2A;line-height:1.7">${notesList}</ul>
  </td></tr>` : ""}
  <tr><td style="padding:16px 32px;background:#F5F5F5;border-top:1px solid #E5E5E5">
    <p style="margin:0;font-size:12px;color:#6B7280">Nex Coworking — Marketing, Comunicacao & Vendas</p>
  </td></tr>
</table>
</body></html>`;
}

export async function sendDailyReport(data: DailyReportData): Promise<void> {
  const transporter = getTransporter();
  const html = buildDailyReportHTML(data);
  const recipient = process.env.REPORT_RECIPIENT || "felipe@nexcoworking.com.br";

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: recipient,
    subject: `Report Diario - ${data.date}`,
    html,
  });
}
