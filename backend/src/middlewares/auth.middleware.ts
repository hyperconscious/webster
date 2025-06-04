import { Request, Response, NextFunction } from 'express';
import { JWTService } from '../services/jwt.service';
import { ForbiddenError, UnauthorizedError } from '../utils/http-errors';
import { UserService } from '../services/user.service';
import { UserRole } from '../entities/user.entity';

const userService = new UserService();

export function auth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    throw new UnauthorizedError('No token provided.');
  }

  const jwtService = new JWTService();
  jwtService.verifyAccessToken(token);
  req.user = jwtService.getUserFromToken(token, 'access');
  next();
}

export async function authVerified(req: Request, res: Response, next: NextFunction) {
    await auth(req, res, () => {});
    if (!req.user?.id) {
      throw new ForbiddenError('User ID is missing.');
    }

    const user = await userService.getUserById(req.user.id);
    if (!user?.verified) {
      throw new ForbiddenError('User is not verified.');
    }

    req.user.role = user.role;
    req.user.verified = user.verified;

    next();
}

export async function authAdmin(req: Request, res: Response, next: NextFunction) {
  await authVerified(req, res, () => {});
  if (!req.user?.role) {
    throw new ForbiddenError('User role is missing.');
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ForbiddenError('You do not have permission to access this resource.');
  }

  next();
}

export async function authOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
  await authVerified(req, res, () => {});

  if (!req.user?.id) {
    throw new ForbiddenError('User ID is missing.');
  }

  if (!req.params.user_id) {
    throw new ForbiddenError('User ID is missing in the request parameters.');
  }
  const userId = parseInt(req.params.user_id, 10);
  if (req.user.id !== userId) {
    const isAdmin = await userService.checkAdmin(req.user.id);
    if (!isAdmin) {
      throw new ForbiddenError('You do not have permission to access this resource.');
    }
  }

  next();
}

export function authorizeUser(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(' ')[1];

  if (token) {
    try {
      const jwtService = new JWTService();
      jwtService.verifyAccessToken(token);
      req.user = jwtService.getUserFromToken(token, 'access');
    } catch (err) {
      req.user = undefined;
    }
  }
  next();
}
