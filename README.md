# Nex Coworking — Marketing, Comunicacao & Vendas

Plataforma web interna de base de conhecimento da area de Marketing, Comunicacao & Vendas do Nex Coworking.

---

## Stack

- Next.js 14 (App Router)
- TypeScript + Tailwind CSS
- next-auth (autenticacao com Credentials Provider)
- bcryptjs (hash de senhas)
- googleapis (Google Drive + Google Calendar)
- nodemailer (envio do report diario por e-mail)
- recharts (graficos do dashboard)
- node-cron (agendamento do report diario)
- date-fns (formatacao de datas)

---

## Instalacao

```bash
npm install
cp .env.example .env.local
# Preencha as variaveis em .env.local
npm run dev
```

Acesse: http://localhost:3000

---

## Usuarios

Arquivo: `/data/users.json`. Senha padrao inicial: **basemkt2026**

No primeiro login, cada usuario e obrigado a trocar a senha.

| E-mail                        | Nome    |
|-------------------------------|---------|
| larissa@nexcoworking.com.br   | Larissa |
| leticia@nexcoworking.com.br   | Leticia |
| felipe@nexcoworking.com.br    | Felipe  |
| bruna@nexcoworking.com.br     | Bruna   |
| luiza@nexcoworking.com.br     | Luiza   |

---

## Variaveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

### Next Auth

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=     # gere com: openssl rand -base64 32
```

### Google Drive e Google Calendar

1. Acesse https://console.cloud.google.com
2. Habilite: **Google Drive API** e **Google Calendar API**
3. Crie uma **Service Account** em IAM & Admin > Service Accounts
4. Gere uma chave JSON para a Service Account
5. Compartilhe a pasta raiz do Drive com o e-mail da Service Account (permissao Editor)
6. Para o Calendar: compartilhe o calendario com o e-mail da SA (permissao Leitor)

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----\n"
GOOGLE_DRIVE_ROOT_FOLDER_ID=   # ID da pasta "Marketing, Comunicacao e Vendas" no Drive
GOOGLE_CALENDAR_ID=primary     # ou ID especifico do calendario da equipe
```

**ID da pasta no Drive:** abra a pasta, a URL e `.../folders/<ID>`.

**ID do calendario:** Google Calendar > Configuracoes > Integrar calendario > ID do calendario.

### Slack

1. Acesse https://api.slack.com/apps
2. Crie um app > Incoming Webhooks > Ative > Add Webhook to Workspace

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

### E-mail (Nodemailer)

Para Gmail: ative autenticacao de 2 fatores e gere uma **App Password** em Conta Google > Seguranca > Senhas de app.

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=                     # App Password (16 caracteres)
SMTP_FROM="Nex Coworking <seu-email@gmail.com>"
REPORT_RECIPIENT=felipe@nexcoworking.com.br
```

---

## Report Diario Automatico (Cron Job)

O sistema envia um e-mail de resumo todo dia as **08:00 (America/Sao_Paulo)** com os reports do dia anterior.

Para ativar, crie o arquivo `instrumentation.ts` na raiz do projeto:

```ts
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startCronJobs } = await import("@/lib/cron/dailyReport");
    startCronJobs();
  }
}
```

---

## Estrutura de Pastas no Google Drive

O sistema cria automaticamente a hierarquia quando o primeiro arquivo e enviado:

```
Marketing, Comunicacao e Vendas/   (voce cria esta pasta e informa o ID)
  Base da Area/
    Sistema/
      Sobre o Nex/
        BrandBook/
        Codigo de Cultura/
        Midia Kit/
        Historia do Nex/
      Playbooks da Area/
        Marketing/
        Comercial/
        Comunicacao/
        Design/
      Estrategias/
      Comercial/
      Comunicacao e Design/
      Marketing/
      Portfolio de Produtos/
      Modelo de Propostas/
```

---

## Campos do Report Diario

| Campo                  | Tipo                                              |
|------------------------|---------------------------------------------------|
| Feeling do Dia         | Selecao: Otimo / Bom / Regular / Ruim / Pessimo   |
| Procura / Leads        | Numero                                            |
| Novas Vendas           | Numero                                            |
| Churns / Cancelamentos | Numero                                            |
| Elogios                | Texto livre                                       |
| Reclamacoes            | Texto livre                                       |
| Observacoes Gerais     | Texto livre                                       |

---

## Credenciais necessarias por integracao

| Integracao     | Variaveis                                                         | Onde obter                           |
|----------------|-------------------------------------------------------------------|--------------------------------------|
| Auth           | `NEXTAUTH_SECRET`                                                 | `openssl rand -base64 32`            |
| Google Drive   | `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`, `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Google Cloud Console > IAM > Service Accounts |
| Google Calendar| `GOOGLE_CALENDAR_ID`                                              | Google Calendar > Configuracoes      |
| Slack          | `SLACK_WEBHOOK_URL`                                               | api.slack.com > Incoming Webhooks    |
| E-mail         | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `REPORT_RECIPIENT` | Gmail App Password / SMTP do provedor |
