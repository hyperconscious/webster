import { Router, Request, Response } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { verifyRecaptcha } from '../middlewares/recaptcha.middleware';
import { validateSchema } from '../middlewares/validation.middleware';
import { createUserDto } from '../dto/user.dto';
import { loginDto } from '../dto/auth.dto';

const authRouter = Router();

authRouter.post('/register', verifyRecaptcha, validateSchema(createUserDto), AuthController.register);
authRouter.post('/login', verifyRecaptcha, validateSchema(loginDto), AuthController.login);
authRouter.post('/refresh', AuthController.refresh);
authRouter.post('/google', AuthController.googleAuth);

authRouter.post(
  '/send-verification-email/',
  AuthController.sendVerificationEmail,
);
authRouter.post('/verify-email/', AuthController.verifyEmail);
authRouter.post('/forgot-password', AuthController.forgotPassword);
authRouter.post('/password-reset', AuthController.resetPassword);

export default authRouter;
