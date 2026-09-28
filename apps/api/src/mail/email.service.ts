import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common"
import { Resend } from "resend"

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name)
  private readonly resend: Resend | null
  private readonly from: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      this.logger.warn("RESEND_API_KEY is not set — emails will fail to send")
    }
    this.resend = apiKey ? new Resend(apiKey) : null
    // Dev: Resend sandbox sender. Production: verified domain only.
    this.from = process.env.MAIL_FROM ?? "Ksocial <onboarding@resend.dev>"
  }

  async sendMail(opts: { to: string; subject: string; html: string }) {
    if (!this.resend) {
      throw new InternalServerErrorException("Email service is not configured")
    }

    const { data, error } = await this.resend.emails.send({
      from: this.from,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })

    if (error) {
      console.error("Resend error:", error)
      throw new InternalServerErrorException(
        `Failed to send email: ${error.message}`
      )
    }

    return data
  }
}