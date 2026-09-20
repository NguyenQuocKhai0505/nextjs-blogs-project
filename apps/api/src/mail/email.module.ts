import { Module } from "@nestjs/common"
import { MailService } from "./email.service.js"

@Module({
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
