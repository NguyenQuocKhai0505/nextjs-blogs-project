import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { SavedController } from "./save.controller.js"
import { SavedService } from "./saved.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [SavedController],
  providers: [SavedService],
})
export class SavedModule {}
