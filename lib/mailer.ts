import nodemailer from 'nodemailer'

interface AuthMailInput {
  to: string
  subject: string
  text: string
  html?: string
}

function getTransport() {
  const host = process.env.SMTP_HOST
  const port = Number(process.env.SMTP_PORT || '587')
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) {
    if (process.env.NODE_ENV === 'development') return null
    throw new Error('SMTP is not configured')
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendAuthMail(input: AuthMailInput): Promise<void> {
  const transport = getTransport()
  if (!transport) {
    console.log('[DEV MAIL]', input)
    return
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  })
}
