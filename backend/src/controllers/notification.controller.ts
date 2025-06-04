import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';
import { BadRequestError, UnauthorizedError, NotFoundError, ForbiddenError } from '../utils/http-errors';
import { StatusCodes } from 'http-status-codes';
import { createNotificationDto, notificationQueryDto, updateNotificationDto } from '../dto/notification.dto';
import { checkBadRequestError } from '../utils/error-handler';
import { Notification } from '../entities/notification.entity';
import { UserService } from '../services/user.service';


export class NotificationController {
    private static notificationService = new NotificationService();
    private static userService = new UserService();

    public static async getAllNotifications(req: Request, res: Response) {
        const validatedQuery = notificationQueryDto.safeParse(req.query);
        checkBadRequestError(validatedQuery.error);
        if (!validatedQuery.data) {
            throw new BadRequestError('Invalid query parameters');
        }
        return res.status(StatusCodes.OK).json(await NotificationController.notificationService.getNotifications(validatedQuery.data));
    }

    public static async getNotificationById(req: Request, res: Response) {
        const notificationId = parseInt(req.params.id, 10);
        if (!notificationId) {
            throw new BadRequestError('Notification ID is required');
        }

        const notification = await NotificationController.notificationService.getNotificationById(notificationId);

        if(notification.user.id !== req.user?.id) {
            throw new ForbiddenError('You are not allowed to access this notification.');
        }
        return res.status(StatusCodes.OK).json(notification);
    }

    public static async createNotification(req: Request, res: Response) {
        if (!req.user) {
            throw new UnauthorizedError('You need to be logged in.');
        }
        let isMail = false;
        if (req.body.sendMail === 'true') {
            isMail = true;
        }

        const notificationDto = await createNotificationDto.safeParse(req.body);
        checkBadRequestError(notificationDto.error);
        if(!notificationDto.data) {
            throw new BadRequestError('Invalid notification data');
        }
        const user = await NotificationController.userService.getUserById(req.user.id);

        const notificationData: Partial<Notification> = {
            message: notificationDto.data.message,
            title: notificationDto.data.title,
            type: notificationDto.data.type,
            user,
        }

        const newNotification = await NotificationController.notificationService.createNotification(
            notificationData,
            isMail
        );
        return res.status(StatusCodes.CREATED).json(newNotification);
    }

    public static async updateNotification(req: Request, res: Response) {
        const notificationId = parseInt(req.params.id, 10);
        if (!notificationId) {
            throw new BadRequestError('Notification ID is required');
        }

        const notificationDto = await updateNotificationDto.safeParseAsync(req.body);
        checkBadRequestError(notificationDto.error);
        if(!notificationDto.data) {
            throw new BadRequestError('Invalid notification data');
        }

        const updatedNotification = await NotificationController.notificationService.updateNotification(
            notificationId,
            notificationDto.data
        );

        return res.status(StatusCodes.OK).json(updatedNotification);
    }

    public static async markNotificationAsRead(req: Request, res: Response) {
        const notificationId = parseInt(req.params.id, 10);
        if (!notificationId) {
            throw new BadRequestError('Notification ID is required');
        }
        if (!req.user) {
            throw new UnauthorizedError('You need to be logged in.');
        }
        if((await NotificationController.notificationService.getNotificationById(notificationId)).user.id !== req.user.id) {
            throw new ForbiddenError('You are not allowed to access this notification.');
        }
        const updatedNotification = await NotificationController.notificationService.markAsRead(notificationId);
        return res.status(StatusCodes.OK).json(updatedNotification);
    }

    public static async deleteNotification(req: Request, res: Response) {
        const notificationId = parseInt(req.params.id, 10);
        if (!notificationId) {
            throw new BadRequestError('Notification ID is required');
        }
        if (!req.user) {
            throw new UnauthorizedError('You need to be logged in.');
        }
        const notification = await NotificationController.notificationService.getNotificationById(notificationId);
        if(!notification) {
            throw new NotFoundError('Notification not found');
        }
        if(notification.user.id !== req.user.id) {
            throw new ForbiddenError('You are not allowed to delete this notification.');
        }
        await NotificationController.notificationService.deleteNotification(notificationId);
        return res.status(StatusCodes.NO_CONTENT).json();
    }
}
