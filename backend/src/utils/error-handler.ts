import { BadRequestError, HttpError, NotFoundError } from './http-errors';
import { Logger } from './logger';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { StatusCodes } from 'http-status-codes';
import config from '../config/env.config';

export class ErrorHandler {
  private static logger = new Logger('ErrorHandler');

  public static handle(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    if (err instanceof HttpError) {
      return res
        .status((err as any).statusCode || StatusCodes.INTERNAL_SERVER_ERROR)
        .json({
          statusCode: (err as any).statusCode,
          method: req.method,
          message: err.message,
          path: config.env ? req.path : undefined,
          stack: config.env === 'development' ? err.stack : undefined,
        });
    }

    if (err instanceof ZodError) {
      const validationErrors = err.errors.map((detail) => detail.message);
      return res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
        statusCode: StatusCodes.UNPROCESSABLE_ENTITY,
        method: req.method,
        message: 'Validation Error',
        path: config.env ? req.path : undefined,
        details: validationErrors,
      });
    }
    ErrorHandler.logger.error(err.message);

    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
  }
}

export function checkBadRequestError(error: any) {
  if (error) {
    const messages = error.errors?.map((detail: any) => detail.message).join('; ');
    throw new BadRequestError(messages || 'Validation error');
  }
}
