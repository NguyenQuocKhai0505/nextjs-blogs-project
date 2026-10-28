import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common"
import { Resend } from "resend"

type MailOptions = { to: string; subject: string; html: string }

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email"
const SEND_FAILED_MESSAGE = "Couldn't send the email. Please try again later."

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly brevo: { apiKey: string; senderEmail: string; senderName: string } | null
  private readonly resend: Resend | null
  private readonly from: string

  constructor() {
    const brevoKey = process.env.BREVO_API_KEY
    const brevoSender = process.env.BREVO_SENDER_EMAIL
    this.brevo =
      brevoKey && brevoSender
        ? {
            apiKey: brevoKey,
            senderEmail: brevoSender,
            senderName: process.env.BREVO_SENDER_NAME ?? "Ksocial",
          }
        : null
    if (brevoKey && !brevoSender) {
      this.logger.warn("BREVO_API_KEY is set but BREVO_SENDER_EMAIL is missing — Brevo disabled")
    }

    const resendKey = process.env.RESEND_API_KEY
    this.resend = resendKey ? new Resend(resendKey) : null
    // Dev: Resend sandbox sender. Production: verified domain only.
    this.from = process.env.MAIL_FROM ?? "Ksocial <onboarding@resend.dev>"

    if (this.brevo) {
      this.logger.log(`Sending email via Brevo as ${this.brevo.senderEmail}`)
    } else if (this.resend) {
      this.logger.log("Sending email via Resend")
    } else {
      this.logger.warn("No email provider configured (BREVO_API_KEY or RESEND_API_KEY) — emails will fail to send")
    }
  }

  async sendMail(opts: MailOptions) {
    if (this.brevo) return this.sendWithBrevo(this.brevo, opts)
    if (this.resend) return this.sendWithResend(this.resend, opts)
    throw new InternalServerErrorException("Email service is not configured")
  }

  private async sendWithBrevo(
    brevo: { apiKey: string; senderEmail: string; senderName: string },
    opts: MailOptions
  ) {
    let res: Response
    try {
      res = await fetch(BREVO_ENDPOINT, {
        method: "POST",
        headers: {
          "api-key": brevo.apiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify({
          sender: { name: brevo.senderName, email: brevo.senderEmail },
          to: [{ email: opts.to }],
          subject: opts.subject,
          htmlContent: opts.html,
        }),
        signal: AbortSignal.timeout(10_000),
      })
    } catch (err) {
      this.logger.error(`Brevo request failed: ${err instanceof Error ? err.message : String(err)}`)
      throw new InternalServerErrorException(SEND_FAILED_MESSAGE)
    }

    const data = (await res.json().catch(() => null)) as { messageId?: string; message?: string } | null
    if (!res.ok) {
      this.logger.error(`Brevo error ${res.status}: ${data?.message ?? "unknown error"}`)
      throw new InternalServerErrorException(SEND_FAILED_MESSAGE)
    }
    return { id: data?.messageId ?? null }
  }

  private async sendWithResend(resend: Resend, opts: MailOptions) {
    const { data, error } = await resend.emails.send({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    if (error) {
      this.logger.error(`Resend error: ${error.message}`)
      throw new InternalServerErrorException(SEND_FAILED_MESSAGE)
    }

    return data
  }
}
