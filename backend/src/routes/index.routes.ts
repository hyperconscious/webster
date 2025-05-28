import { Router, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import userRouter from './user.routes';
import authRouter from './auth.routes';
import notificationRouter from './notification.routes';
import projectRouter from './projects.routes';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res
    .status(StatusCodes.OK)
    .json({ message: 'Hello ma friend. Check other useful rotes.' });
});

router.use('/notifications', notificationRouter);
router.use('/users', userRouter);
router.use('/auth', authRouter);
router.use('/projects', projectRouter);


export { router };
