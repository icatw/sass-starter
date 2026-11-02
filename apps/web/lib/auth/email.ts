import nodemailer from 'nodemailer'
import { getWebEnv } from '@/lib/env'

interface AuthEmailInput {
  to: string
  subject: string
  text: string
}

export async function sendAuthEmail(message: AuthEmailInput) {
  const { smtp } = getWebEnv()
  const transport = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: smtp.user ? { user: smtp.user, pass: smtp.password ?? '' } : undefined,
  })

  await transport.sendMail({ from: smtp.from, ...message })
}
