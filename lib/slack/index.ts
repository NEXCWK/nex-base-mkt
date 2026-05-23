// Slack Webhook integration
// Required env var: SLACK_WEBHOOK_URL
export async function sendSlackNotification(message: string): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.warn("SLACK_WEBHOOK_URL not configured. Skipping Slack notification.");
    return;
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    console.error("Failed to send Slack notification:", await res.text());
  }
}

const FEELING_LABELS: Record<string, string> = {
  otimo: "Otimo",
  bom: "Bom",
  regular: "Regular",
  ruim: "Ruim",
  pessimo: "Pessimo",
};

export function buildReportSlackMessage(
  userName: string,
  date: string,
  data: {
    feeling: string;
    leads: number;
    newSales: number;
    churns: number;
  }
): string {
  return (
    `*Novo Report Diario - ${date}*\n` +
    `Enviado por: *${userName}*\n\n` +
    `Feeling do Dia: ${FEELING_LABELS[data.feeling] || data.feeling}\n` +
    `Procura/Leads: ${data.leads}\n` +
    `Novas Vendas: ${data.newSales}\n` +
    `Churns/Cancelamentos: ${data.churns}`
  );
}
