import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common"
import { APP_GUARD } from "@nestjs/core"
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { ConfigModule } from "@nestjs/config"

import { AiModule } from "../ai/ai.module.js"
import { ReelsModule } from "../reels/reel.module.js"
import { ReportsModule } from "../reports/reports.module.js"
import { SavedModule } from "../saved/save.module.js"
import { SharesModule } from "../shares/shares.module.js"
import { StoriesModule } from "../stories/stories.module.js"
import { AuthModule } from "../auth/auth.module.js"
import { CategoriesModule } from "../categories/categories.module.js"
import { ChatModule } from "../chat/chat.module.js"
import { OptionalJwtUserMiddleware } from "../common/middleware/optional-jwt-user.middleware.js"
import { NotificationsModule } from "../notifications/notifications.module.js"
import { PostsModule } from "../posts/posts.module.js"
import { PrismaModule } from "../prisma/prisma.module.js"
import { UploadModule } from "../upload/upload.module.js"
import { UsersModule } from "../users/users.module.js"
import { HealthController } from "./health.controller.js"

function throttlerRootOptions() {
  const ttl = Number(process.env.THROTTLE_TTL_MS ?? 60_000)
  const limit = Number(process.env.THROTTLE_LIMIT ?? 150)
  return {
    throttlers: [{ name: "default", ttl, limit }],
    getTracker: (req: Record<string, unknown>) => {
      const uid = req.userId as string | undefined
      if (uid) return `user:${uid}`
      const headers = req.headers as Record<string, unknown> | undefined
      const xf = headers?.["x-forwarded-for"]
      const r = req as { ip?: string; socket?: { remoteAddress?: string } }
      const ip =
        typeof xf === "string" && xf.length > 0
          ? xf.split(",")[0]?.trim()
          : r.ip ?? r.socket?.remoteAddress ?? "unknown"
      return `ip:${ip}`
    },
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ThrottlerModule.forRoot(throttlerRootOptions()),
    PrismaModule,
    AuthModule,
    PostsModule,
    UploadModule,
    ChatModule,
    UsersModule,
    CategoriesModule,
    NotificationsModule,
    AiModule,
    StoriesModule,
    ReelsModule,
    SavedModule,
    SharesModule,
    ReportsModule,
  ],
  controllers: [HealthController],
  providers: [
    OptionalJwtUserMiddleware,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(OptionalJwtUserMiddleware).forRoutes("*")
  }
}
