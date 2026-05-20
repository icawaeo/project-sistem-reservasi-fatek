import { prisma } from '@/lib/prisma';

export type NotificationType =
  | 'RESERVATION_NEW'
  | 'RESERVATION_APPROVED'
  | 'RESERVATION_REJECTED'
  | 'RESERVATION_COMPLETED'
  | 'RESERVATION_CANCELLED';

/**
 * Create a notification record for the in-app notification center.
 */
export async function sendNotification(
  userId: string,
  type: NotificationType,
  title: string,
  body: string,
  data: Record<string, any> = {}
) {
  return prisma.notification.create({
    data: {
      userId,
      title,
      body,
      data,
    },
  });
}

/**
 * Get unread notifications count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  return await prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string, userId: string) {
  return await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
  return await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
}
