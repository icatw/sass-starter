import nodemailer from 'nodemailer'

interface AuthEmailInput {
  to: string
  subject: string
  text: string
}

export async function sendAuthEmail(message: AuthEmailInput) {
  const devCapture = process.env.NODE_ENV !== 'production' && process.env.AUTH_EMAIL_MODE === 'mailpit'
  const host = process.env.SMTP_HOST ?? (devCapture ? '127.0.0.1' : undefined)
  const port = Number(process.env.SMTP_PORT ?? (devCapture ? '1025' : ''))
  const from = process.env.SMTP_FROM ?? (devCapture ? 'SaaS Foundry <no-reply@localhost>' : undefined)

  if (!host || !from) {
    throw new Error('SMTP_HOST and SMTP_FROM are required to send authentication email')
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD ?? '' }
      : undefined,
  })

  await transport.sendMail({ from, ...message })
}
