import { Router, Request, Response } from 'express';
import { UserController } from '../controllers/user.controller';
import { uploadSingle } from '../config/file-upload.config';
import { auth, authAdmin, authOwnerOrAdmin, authVerified } from '../middlewares/auth.middleware';
import { validateSchema } from '../middlewares/validation.middleware';
import { userQueryDto } from '../dto/user.dto';
const userRouter = Router();

userRouter.get('/', validateSchema(userQueryDto, 'query'), authAdmin, UserController.getAllUsers);

userRouter.post('/', authAdmin, UserController.createUser);

userRouter.get('/my-profile', auth, UserController.getUserById);
userRouter.patch(
  '/:user_id/avatar',
  authOwnerOrAdmin,
  uploadSingle,
  validateSchema(userQueryDto),
  UserController.uploadAvatar,
);

userRouter.get('/:user_id', authOwnerOrAdmin, UserController.getUserById);
userRouter.get('/mail/:email', authVerified, UserController.getUserByMail);

userRouter.patch('/:user_id', authOwnerOrAdmin, UserController.updateUser);

userRouter.delete('/:user_id', authOwnerOrAdmin, UserController.deleteUser);

export default userRouter;
