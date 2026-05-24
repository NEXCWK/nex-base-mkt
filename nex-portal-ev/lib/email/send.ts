import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(to: string, subject: string, html: string) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html,
  })
}

export async function notifyAdminUpload(clienteNome: string, documentoNome: string) {
  const adminEmail = process.env.ADMIN_EMAIL!
  await sendEmail(
    adminEmail,
    `[Nex EV Portal] Novo documento enviado por ${clienteNome}`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FFD400; padding: 24px;">
        <h1 style="margin: 0; font-size: 20px; color: #000;">Nex EV Portal</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb;">
        <h2 style="font-size: 16px; color: #000;">Novo documento recebido</h2>
        <p style="color: #374151;">
          O cliente <strong>${clienteNome}</strong> enviou o documento:<br>
          <strong>${documentoNome}</strong>
        </p>
        <p style="color: #374151;">Acesse o painel para revisar e aprovar o documento.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/painel"
           style="display:inline-block;background:#FFD400;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;margin-top:8px;">
          Acessar Painel
        </a>
      </div>
    </div>
    `
  )
}

export async function notifyClienteDocumento(clienteEmail: string, clienteNome: string, documentoNome: string) {
  await sendEmail(
    clienteEmail,
    `[Nex EV Portal] Novo documento disponível`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FFD400; padding: 24px;">
        <h1 style="margin: 0; font-size: 20px; color: #000;">Nex EV Portal</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb;">
        <h2 style="font-size: 16px; color: #000;">Olá, ${clienteNome}</h2>
        <p style="color: #374151;">
          Um novo documento foi disponibilizado para você:<br>
          <strong>${documentoNome}</strong>
        </p>
        <p style="color: #374151;">Acesse o portal para visualizar e baixar.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/repositorio"
           style="display:inline-block;background:#FFD400;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;margin-top:8px;">
          Acessar Portal
        </a>
      </div>
    </div>
    `
  )
}

export async function sendWelcomeEmail(clienteEmail: string, clienteNome: string, loginLink: string) {
  await sendEmail(
    clienteEmail,
    `Bem-vindo ao Nex EV Portal`,
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #FFD400; padding: 24px;">
        <h1 style="margin: 0; font-size: 20px; color: #000;">Nex EV Portal</h1>
      </div>
      <div style="padding: 24px; border: 1px solid #e5e7eb;">
        <h2 style="font-size: 16px; color: #000;">Olá, ${clienteNome}!</h2>
        <p style="color: #374151;">
          Sua conta no Nex EV Portal foi criada. Clique no botão abaixo para definir sua senha e acessar o portal.
        </p>
        <a href="${loginLink}"
           style="display:inline-block;background:#FFD400;color:#000;padding:12px 24px;text-decoration:none;font-weight:bold;border-radius:4px;margin-top:8px;">
          Acessar Portal e Criar Senha
        </a>
        <p style="color: #9CA3AF; font-size: 12px; margin-top: 24px;">
          Se você não solicitou este acesso, ignore este e-mail.
        </p>
      </div>
    </div>
    `
  )
}
