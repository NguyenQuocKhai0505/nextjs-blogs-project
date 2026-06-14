import "reflect-metadata"
import { NestFactory } from "@nestjs/core"
import { AppModule } from "./modules/app.module.js"
import { ValidationPipe } from "@nestjs/common"
import { buildCorsOptions } from "./common/cors.js"

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: buildCorsOptions(),
  })

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

