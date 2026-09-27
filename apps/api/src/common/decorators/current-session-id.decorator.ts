import { createParamDecorator, ExecutionContext } from "@nestjs/common"

export const CurrentSessionId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<{ sessionId?: string }>()
    return req.sessionId
  }
)
