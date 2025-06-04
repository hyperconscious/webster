import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import {
  BadRequestError,
  ForbiddenError,
  UnauthorizedError,
} from '../utils/http-errors';
import { StatusCodes } from 'http-status-codes';
import { createUserDto, userQueryDto } from '../dto/user.dto';
import { checkBadRequestError } from '../utils/error-handler';
import { User, UserRole } from '../entities/user.entity';

export class UserController {
  private static userService = new UserService();

  public static async getAllUsers(req: Request, res: Response) {
    const queryOptions = await userQueryDto.safeParseAsync(req.query);
    checkBadRequestError(queryOptions.error);
    if(!queryOptions.data)
      throw new BadRequestError('Invalid query parameters.');

    const users = await UserController.userService.getAllUsers(queryOptions.data);
    return res.status(StatusCodes.OK).json(users);
  }

  public static async getUserById(req: Request, res: Response) {
    const userId = parseInt(req.params.user_id, 10) || req.user?.id!;

    if (userId === undefined) {
      throw new UnauthorizedError('You need to be logged in.');
    }
    const user = await UserController.userService.getUserById(userId);
    return res.status(StatusCodes.OK).json({ data: user });
  }

  public static async getUserByMail(req: Request, res: Response) {

    if (!req.params.email) {
      throw new BadRequestError('Email is required.');
    }
    const email = req.params.email;
    const user = await UserController.userService.getUserByEmailSafe(email);

    if(req.user?.id !== user?.id && req.user?.role !== UserRole.ADMIN) {
      throw new ForbiddenError('You are not authorized to access this user.');
    }
    if (!user) {
      throw new BadRequestError('User not found.');
    }
    return res.status(StatusCodes.OK).json({ data: user });
  }

  public static async createUser(req: Request, res: Response) {
    const UserDto = await createUserDto.safeParseAsync(req.body);
    checkBadRequestError(UserDto.error);
    if (!UserDto.data) {
      throw new BadRequestError('Invalid user data.');
    }
    if (
      UserDto.data.passwordConfirmation &&
      UserDto.data.password !== UserDto.data.passwordConfirmation
    ) {
      throw new BadRequestError('Password confirmation does not match.');
    }


    let verified = false;

    const newUser = await UserController.userService.createUser({
      ...UserDto,
      verified,
    });


    return res.status(StatusCodes.CREATED).json({ data: newUser });
  }



  public static async updateUser(req: Request, res: Response) {
    const callbackUrl = req.headers['x-callback-url'];
    const userData = req.body;
    const userId = req.user!.id;

    if (userId !== parseInt(req.params.user_id, 10)) {
      throw new ForbiddenError('You are not authorized to update this user.');
    }
    if (userData.login) {
      const user = await UserController.userService.getUserByLoginSafe(
        userData.login,
      );
      if (user && user.id !== parseInt(req.params.user_id, 10)) {
        console.log(`${user?.id} - ${req.params.user_id}`);
        throw new BadRequestError('Login already exists.');
      }
    }

    if (userData.email) {
      const user = await UserController.userService.getUserByEmailSafe(
        userData.email,
      );
      if (user && user.id !== parseInt(req.params.user_id, 10)) {
        throw new BadRequestError('Email already exists.');
      }
    }

    const updatedUser = await UserController.userService.updateUser(
      parseInt(req.params.user_id, 10),
      userData,
    );
    return res
      .status(StatusCodes.OK)
      .json({ status: 'success', data: updatedUser });
  }

  public static async uploadAvatar(req: Request, res: Response) {
    const userId = Number(req.params.user_id) || req.user!.id;
    if (!req.file) {
      throw new BadRequestError('No file uploaded.');
    }

    const user = await UserController.userService.getUserById(userId);
    if (userId !== req.user?.id) {
      throw new ForbiddenError('You are not authorized to update this user.');
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await UserController.userService.updateUser(userId, {
      avatar: avatarUrl,
    });
    return res
      .status(StatusCodes.OK)
      .json({ message: 'Avatar uploaded successfully.', data: updatedUser });
  }


  public static async deleteUser(req: Request, res: Response) {
    if (!req.user) {
      throw new UnauthorizedError('You need to be logged in.');
    }
    const userId = Number(req.params.user_id);

    if (

      userId !== req.user.id
    ) {
      throw new ForbiddenError('You are not authorized to delete this user.');
    }
    await UserController.userService.deleteUser(userId);
    return res.status(StatusCodes.NO_CONTENT).json();
  }
}
