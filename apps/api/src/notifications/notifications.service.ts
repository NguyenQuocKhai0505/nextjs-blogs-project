import { Injectable } from "@nestjs/common";
import { Prisma, NotificationType, NotificationTargetKind } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service.js";

type CreateNotifInput = {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  targetKind: NotificationTargetKind;
  targetId: string;
  targetSlug?: string | null;
  meta?: Prisma.InputJsonValue;
};

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string, opts: { cursor?: number; take: number }) {
    const take = opts.take ?? 20;

    const items = await this.prisma.appNotification.findMany({
      where: { recipientId: userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: take + 1,
      ...(opts.cursor
        ? { cursor: { id: opts.cursor }, skip: 1 }
        : {}),
    });

    const hasMore = items.length > take;
    const sliced = items.slice(0, take);
    const nextCursor = hasMore ? sliced[sliced.length - 1]?.id : null;

    return { items: sliced, nextCursor };
  }

  async getUnreadCount(userId: string) {
    const row = await this.prisma.appNotificationCounter.findUnique({
      where: { userId },
      select: { unread: true, lastReadAt: true, updatedAt: true },
    });
    return { unread: row?.unread ?? 0 };
  }

  async markAllRead(userId: string) {
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.appNotification.updateMany({
        where: { recipientId: userId, readAt: null },
        data: { readAt: now },
      });

      const counter = await tx.appNotificationCounter.upsert({
        where: { userId },
        create: { userId, unread: 0, lastReadAt: now },
        update: { unread: 0, lastReadAt: now },
        select: { unread: true },
      });

      return { unread: counter.unread };
    });

    return result;
  }

  async createOrAggregate(input: CreateNotifInput) {
    if (input.recipientId === input.actorId) {
      return null; // tự like/comment/follow thì bỏ qua (tuỳ bạn)
    }

    const now = new Date();
    const meta = input.meta ?? {};

    // tìm notification chưa đọc cùng “group key”
    const existing = await this.prisma.appNotification.findFirst({
      where: {
        recipientId: input.recipientId,
        type: input.type,
        targetKind: input.targetKind,
        targetId: input.targetId,
        readAt: null,
      },
      select: { id: true, actorIds: true, actorCount: true },
      orderBy: { updatedAt: "desc" },
    });

    const txResult = await this.prisma.$transaction(async (tx) => {
      let notifId: number;

      if (existing) {
        const actorIds = Array.isArray(existing.actorIds) ? (existing.actorIds as unknown as string[]) : [];
        const nextActorIds = actorIds.includes(input.actorId)
          ? actorIds
          : [input.actorId, ...actorIds].slice(0, 20); // cap 20 actors để payload nhẹ

        const updated = await tx.appNotification.update({
          where: { id: existing.id },
          data: {
            actorIds: nextActorIds as any,
            actorCount: existing.actorCount + (actorIds.includes(input.actorId) ? 0 : 1),
            targetSlug: input.targetSlug ?? undefined,
            meta: meta as any,
            updatedAt: now,
          },
          select: { id: true },
        });

        notifId = updated.id;
      } else {
        const created = await tx.appNotification.create({
          data: {
            recipientId: input.recipientId,
            actorIds: [input.actorId] as any,
            actorCount: 1,
            type: input.type,
            targetKind: input.targetKind,
            targetId: input.targetId,
            targetSlug: input.targetSlug ?? null,
            meta: meta as any,
          },
          select: { id: true },
        });
        notifId = created.id;

        // chỉ tăng unread khi tạo record mới (aggregation thì thường vẫn muốn tăng? tuỳ UX)
        await tx.appNotificationCounter.upsert({
          where: { userId: input.recipientId },
          create: { userId: input.recipientId, unread: 1 },
          update: { unread: { increment: 1 } },
        });
      }

      const unreadRow = await tx.appNotificationCounter.findUnique({
        where: { userId: input.recipientId },
        select: { unread: true },
      });

      const notif = await tx.appNotification.findUnique({
        where: { id: notifId },
      });

      return { notif, unread: unreadRow?.unread ?? 0 };
    });

    return txResult;
  }
}