import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { JWTService } from '../services/jwt.service';
import { StatusCodes } from 'http-status-codes';
import {
  BadRequestError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/http-errors';
import { MailService } from '../services/mail.service';
import { User } from '../entities/user.entity';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const isoCountries = require("i18n-iso-countries");
export class AuthController {
  private static userService = new UserService();
  private static jwtService = new JWTService();
  private static mailService = new MailService();

  private static formatGoogleFullName(name: string): string {
    const defaultFullName = 'Google User';
    const normalizedName = name.replace(/[^\w\s]/g, '');
    const parts = normalizedName.trim().split(/\s+/).slice(0, 2);
    if (parts.length < 2) return defaultFullName;

    const capitalize = (s: string) =>
        s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();

    const formattedName = `${capitalize(parts[0])} ${capitalize(parts[1])}`;

    const fullNamePattern = /^[A-ZА-Я][a-zа-яё]+ [A-ZА-Я][a-zа-яё]+$/;

    if (fullNamePattern.test(formattedName)) {
      return formattedName;
    }

    return defaultFullName;
  }

  private static formatGoogleLogin(login: string): string {
    if (!login || login.length < 4) {
      return login.padEnd(4, Math.floor(Math.random() * 10).toString());
    }

    if (login.length > 20) {
      return login.substring(0, 20);
    }

    return login;
  }

  public static async register(req: Request, res: Response) {

    const {
      login,
      password,
      full_name,
      passwordConfirmation,
      email,
    } = req.body;


    if (password !== passwordConfirmation) {
      throw new BadRequestError('Password confirmation does not match.');
    }

    const user = await AuthController.userService.createUser({
      login,
      password,
      full_name,
      email,
    });

    const accessToken = AuthController.jwtService.generateAccessToken(user);
    const refreshToken = AuthController.jwtService.generateRefreshToken(user);

    // const mailToken = AuthController.jwtService.generateEmailToken(user);
    // await AuthController.mailService.sendVerificationEmail(
    //   user.email,
    //   mailToken,
    //   req.headers['x-callback-url'] as string,
    // );

    return res.status(StatusCodes.CREATED).json({ accessToken, refreshToken });
  }

  public static async login(req: Request, res: Response) {
    const { loginOrEmail, password } = req.body;
    const user = await AuthController.userService.validateUserCredentials(
      loginOrEmail,
      password,
    );

    if (!user) {
      throw new BadRequestError('Invalid login or password.');
    }

    if (!user.verified) {
      throw new UnauthorizedError('Email is not verified.');
    }

    const accessToken = AuthController.jwtService.generateAccessToken(user);
    const refreshToken = AuthController.jwtService.generateRefreshToken(user);

    return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
  }

  public static async refresh(req: Request, res: Response) {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new BadRequestError('Refresh token is required.');
    }

    const userData = AuthController.jwtService.verifyRefreshToken(refreshToken);
    const user = await AuthController.userService.getUserById(userData.id);

    const newAccessToken = AuthController.jwtService.generateAccessToken(user);
    const newRefreshToken =
      AuthController.jwtService.generateRefreshToken(user);

    return res
      .status(StatusCodes.OK)
      .json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  }

  public static async sendVerificationEmail(req: Request, res: Response) {
    const { email } = req.body;
    const callbackUrl = req.headers['x-callback-url'];

    if (!callbackUrl) {
      throw new BadRequestError('Callback URL is required.');
    }

    const user = await AuthController.userService.getUserByEmail(email);

    if (!user) {
      throw new BadRequestError('User with this email does not exist.');
    }

    const mailToken = AuthController.jwtService.generateEmailToken(user);

    await AuthController.mailService.sendVerificationEmail(
      email,
      mailToken,
      callbackUrl as string,
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: 'Verification email sent successfully.' });
  }

  public static async verifyEmail(req: Request, res: Response) {
    const { token } = req.query;

    if (!token) {
      throw new BadRequestError('Verification token is missing.');
    }

    const decoded = AuthController.jwtService.verifyEmailToken(token as string);

    const user = await AuthController.userService.getUserById(decoded.id);

    if (!user || user.verified) {
      throw new NotFoundError('User already verified or does not exist.');
    }

    await AuthController.userService.updateUser(user.id, { verified: true });

    return res
      .status(StatusCodes.OK)
      .json({ message: 'Email verified successfully.' });
  }

  public static async forgotPassword(req: Request, res: Response) {
    const { email } = req.body;
    const callbackUrl = req.headers['x-callback-url'];

    if (!callbackUrl) {
      throw new BadRequestError('Callback URL is required.');
    }

    const user: User | null = await AuthController.userService.getUserByEmail(
      email,
    );

    const mailToken = AuthController.jwtService.generateEmailToken(user);

    await AuthController.mailService.sendPasswordResetEmail(
      email,
      mailToken,
      callbackUrl as string,
    );

    return res
      .status(StatusCodes.OK)
      .json({ message: 'Password reset email sent successfully.' });
  }

  public static async resetPassword(req: Request, res: Response) {
    const { token } = req.query;
    const { password, passwordConfirmation } = req.body;

    if (!token) {
      throw new BadRequestError('Password reset token is missing.');
    }

    if (password && password !== passwordConfirmation) {
      throw new BadRequestError('Password confirmation does not match.');
    }

    const decoded = AuthController.jwtService.verifyEmailToken(token as string);

    const user = await AuthController.userService.getUserById(decoded.id);

    await AuthController.userService.updateUser(user.id, { password });

    return res
      .status(StatusCodes.OK)
      .json({ message: 'Password reset successfully.' });
  }

  public static async googleAuth(req: Request, res: Response) {
    const { credential } = req.body;

    if (!credential) {
      throw new BadRequestError('Google credential is required');
    }

    const decoded: any = jwt.decode(credential);

    if (!decoded) {
      throw new BadRequestError('Invalid Google credential');
    }

    const { email, name, picture } = decoded;

    if (!email) {
      throw new BadRequestError('Email not provided in Google credential');
    }

    let user = await AuthController.userService.getUserByEmailSafe(email);

    if (!user) {
      const baseLogin = name || email.split('@')[0];
      const validLogin = AuthController.formatGoogleLogin(baseLogin);

      const uuid = uuidv4();
      const randomUppercaseLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26));
      const randomLowercaseLetter = String.fromCharCode(97 + Math.floor(Math.random() * 26));
      const randomNumber = Math.floor(Math.random() * 10);
      const password = randomUppercaseLetter + randomLowercaseLetter + randomNumber + uuid;
      const validFullName = name ? AuthController.formatGoogleFullName(name) : 'Google User';

      user = await AuthController.userService.createUser({
        login: validLogin,
        password,
        full_name: validFullName,
        email,
        avatar: picture,
        verified: true,
      });
    }

    const accessToken = AuthController.jwtService.generateAccessToken(user);
    const refreshToken = AuthController.jwtService.generateRefreshToken(user);

    return res.status(StatusCodes.OK).json({ accessToken, refreshToken });
  }
}
