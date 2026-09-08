import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./modules/app.module.js"
import { ValidationPipe } from "@nestjs/common"
import { buildCorsOptions } from "./common/cors.js"

function applyLocalTlsBypass() {
  // Windows antivirus HTTPS inspection often breaks Node fetch (UNABLE_TO_VERIFY_LEAF_SIGNATURE).
  // Enable only in local .env — never set ALLOW_INSECURE_TLS on Render/production.
  if (process.env.ALLOW_INSECURE_TLS === "1") {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"
    // eslint-disable-next-line no-console
    console.warn("[api] ALLOW_INSECURE_TLS=1 — TLS verification disabled (local only)")
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: buildCorsOptions(),
  })

  applyLocalTlsBypass()

  app.setGlobalPrefix("v1")
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    })
  )

  const port = Number(process.env.PORT ?? 4000)
  await app.listen(port, "0.0.0.0")
  // eslint-disable-next-line no-console
  console.log(`[api] listening on http://localhost:${port}/v1`)
}

bootstrap().catch(err => {
  // eslint-disable-next-line no-console
  console.error("[api] failed to start", err)
  process.exit(1)
})

