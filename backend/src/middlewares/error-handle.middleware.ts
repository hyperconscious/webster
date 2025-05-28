import { Request, Response, NextFunction } from 'express';
import { ErrorHandler } from '../utils/error-handler';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  ErrorHandler.handle(err, req, res, next);
};
