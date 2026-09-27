import { Global, Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { SessionsService } from "./session.service.js"
import { SessionsController } from "./session.controller.js"

@Global()
@Module({
  imports: [JwtModule.register({})],
  controllers: [SessionsController],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}