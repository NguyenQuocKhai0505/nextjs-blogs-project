import { Controller, Get } from "@nestjs/common"
import { SkipThrottle } from "@nestjs/throttler"

@SkipThrottle()
@Controller("health")
export class HealthController {
  @Get()
  health() {
    return {
      ok: true,
      service: "ksocial-api",
      time: new Date().toISOString(),
    }
  }
}

