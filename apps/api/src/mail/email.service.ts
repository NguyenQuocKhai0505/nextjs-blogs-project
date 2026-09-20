import { Injectable, InternalServerErrorException } from "@nestjs/common"
import { Resend } from "resend"

@Injectable()
export class MailService {
  private readonly resend: Resend
  private readonly from: string

  constructor() {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set")
    }

    this.resend = new Resend(apiKey)
    // Dev: Resend sandbox sender. Production: verified domain only.
    this.from = process.env.MAIL_FROM ?? "Ksocial <onboarding@resend.dev>"
  }

  async sendMail(opts: { to: string; subject: string; html: string }) {
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
