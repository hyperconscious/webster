import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';
import { auth } from '../middlewares/auth.middleware';

const notificationRouter = Router();

notificationRouter.get('/', auth, NotificationController.getAllNotifications);

notificationRouter.get('/:id', auth, NotificationController.getNotificationById);

notificationRouter.post('/', auth, NotificationController.createNotification);

notificationRouter.patch('/:id/read', auth, NotificationController.markNotificationAsRead);

notificationRouter.delete('/:id', auth, NotificationController.deleteNotification);

export default notificationRouter;
