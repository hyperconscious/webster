import { z } from 'zod';
import { PaginationDto } from './pagination.dto';
import { NotificationType } from '../entities/notification.entity';

const notificationTypes = Object.values(NotificationType) as [NotificationType, ...NotificationType[]];

const notificationSortFields = ['createdAt', 'title', 'message', 'type'] as const;

const baseNotificationFields = {
  title: z
    .string({ required_error: 'Title is required.' })
    .min(1, { message: 'Title must be at least 1 character long.' })
    .max(255, { message: 'Title must be no more than 255 characters long.' }),

  message: z
    .string({ required_error: 'Message is required.' })
    .min(1, { message: 'Message must be at least 1 character long.' }),

  type: z
    .enum(notificationTypes, {
      errorMap: () => ({
        message: `Type must be one of the following: ${notificationTypes.join(', ')}.`,
      }),
    })
    .default(NotificationType.EventReminder),

  isRead: z.boolean({ invalid_type_error: 'isRead must be a boolean value.' }).default(false),

  user: z.any({ required_error: 'User is required.' }),

  createdAt: z.coerce.date().optional(),
};

export const createNotificationDto = z.object({
  ...baseNotificationFields,
});

export const updateNotificationDto = z
  .object({
    ...baseNotificationFields,
    isRead: z.boolean().optional(),
  })
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required to update the notification.',
  });

const filtersSchema = z.object({
  title: z.string().min(1).optional(),
  type: z
    .enum(notificationTypes, {
      errorMap: () => ({
        message: `Type must be one of the following: ${notificationTypes.join(', ')}.`,
      }),
    })
    .optional(),
  isRead: z
    .preprocess((val) => {
      if (val === 'true') return true;
      if (val === 'false') return false;
      return val;
    }, z.boolean({ invalid_type_error: 'isRead must be a boolean value.' }))
    .optional(),
  userId: z
    .string()
    .regex(/^\d+$/, { message: 'User ID must be a number.' })
    .transform(Number)
    .pipe(z.number().int().min(1, { message: 'User ID must be greater than or equal to 1.' }))
    .optional(),
});

export const notificationQueryDto = PaginationDto.extend({
  filters: filtersSchema.optional(),

  sortBy: z
    .enum(notificationSortFields, {
      errorMap: () => ({
        message: 'sortBy must be one of the following: createdAt, title, message, type.',
      }),
    })
    .optional(),
}).strict();

export type NotificationQueryDto = z.infer<typeof notificationQueryDto>;
