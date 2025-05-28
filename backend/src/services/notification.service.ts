import { Repository } from 'typeorm';
import { BadRequestError, NotFoundError } from '../utils/http-errors';
import { Notification } from '../entities/notification.entity';
import { AppDataSource } from '../config/orm.config';
import { createNotificationDto, NotificationQueryDto, updateNotificationDto } from '../dto/notification.dto';
import { paginateQueryBuilder, PaginationResult} from '../utils/paginator';
import { MailService } from './mail.service';
import { User } from '../entities/user.entity';
import { applyCondition } from '../utils/filtering';
import { applySortingToQueryBuilder } from '../utils/sorting';

export const enum ServiceMethod {
  create,
  update,
}

export class NotificationService {
  private notificationRepository: Repository<Notification>;
  private mailService: MailService = new MailService();

  constructor() {
    this.notificationRepository = AppDataSource.getRepository(Notification);
  }


  public async createNotification(
    notificationData: Partial<Notification>,
    sendMail: boolean = false
  ): Promise<Notification> {
    const { user, /*relatedEvent,*/ ...rest } = notificationData;

    if (!user || typeof user !== 'object' || !user.id) {
      throw new BadRequestError('User is required for notification.');
    }

    const userEntity = await AppDataSource.getRepository(User).findOne({
      where: { id: user.id },
      relations: ['notifications'],
    });

    if (!userEntity) {
      throw new NotFoundError('User not found');
    }

    const newNotification = this.notificationRepository.create({
      ...rest,
      user: userEntity,
    });

    const savedNotification = await this.notificationRepository.save(newNotification);

    if (sendMail && userEntity.email) {
      try {
        await this.mailService.sendEmail(userEntity.email, savedNotification.title, savedNotification.message);
      } catch (error) {
        console.error('Error sending email:', error);
      }
    }

    return savedNotification;
  }

  public async updateNotification(id: number, notificationData: Partial<Notification>): Promise<Notification> {

    const notification = await this.getNotificationById(id);

    const updatedNotification = this.notificationRepository.merge(notification, notificationData);

    return this.notificationRepository.save(updatedNotification);
  }

  public async getNotificationById(id: number): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['user', 'relatedEvent'],
    });

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    return notification;
  }

  public async getNotifications(
    validatedQuery: NotificationQueryDto,
  ): Promise<PaginationResult<Notification>>  {
    const qb = this.notificationRepository.createQueryBuilder('notification');

    if (validatedQuery.filters) {
      applyCondition(qb, "notification.title", "LIKE", validatedQuery.filters.title);
      //applyCondition(qb, "notification.message", "LIKE", validatedQuery.message);
      applyCondition(qb, "notification.isRead", "=", validatedQuery.filters.isRead);
      applyCondition(qb, "notification.type", "=", validatedQuery.filters.type);
    }
    applySortingToQueryBuilder(qb, validatedQuery, 'notification');

    return paginateQueryBuilder(qb, {
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });
  }

  public async markAsRead(id: number): Promise<Notification> {
    const notification = await this.getNotificationById(id);

    notification.isRead = true;

    return this.notificationRepository.save(notification);
  }

  public async deleteNotification(id: number): Promise<boolean> {
    try {
      const notification = await this.getNotificationById(id);
      await this.notificationRepository.remove(notification);
      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Unable to delete notification due to existing dependencies.');
    }
  }
}
