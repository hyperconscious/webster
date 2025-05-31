import express from 'express';
import 'reflect-metadata';
import 'express-async-errors';
import cors from 'cors';
import { startupLogger } from './utils/logger';
import requestLogger from './middlewares/request-loger.middleware';
import { router as apiRoutes } from './routes/index.routes';
import { databaseService } from './services/database.service';
import { errorMiddleware } from './middlewares/error-handle.middleware';
import { BadRequestError, NotFoundError } from './utils/http-errors';
import path from 'path';
import setupSwagger from './config/swagger';
import rateLimit from 'express-rate-limit';
import config from './config/env.config';

var bodyParser = require('body-parser');

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: config.maxRequestPerMinute,
  message: 'Too many requests, please try again later.',
});

class ChronosServer {
  private app: express.Application;

  constructor() {
    this.app = express();
  }

  private configureMiddleware(): void {
    const uploadsPath = path.resolve(__dirname, '../uploads');
    this.app.use('/uploads', express.static(uploadsPath));
    this.app.use(cors({
      origin: 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-callback-url'],
    }));
    this.app.use(limiter);
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    if(config.useRequestLogger) {
      this.app.use(requestLogger);
    }

  }

  private configureRoutes(): void {
    this.app.use('/api', apiRoutes);
  }

  private configureErrorHandling(): void {
    this.app.use((req, res, next) => next(new NotFoundError()));
    this.app.use(errorMiddleware);
  }


  public async start(port: number): Promise<void> {
    try {
      await databaseService.connectWithRetries();
      await setupSwagger(this.app);

      this.configureMiddleware();
      this.configureRoutes();
      this.configureErrorHandling();
      startupLogger.info('Server initialized');
      this.app.listen(port, () => {
        startupLogger.info(`Server is running on http://localhost:${port}/api`);
        startupLogger.info(`Swagger is running on http://localhost:${port}/api/docs`);
      });
      // if(config.cleanupEvents) {
      //   initEventCleanupCron();
      // }
      // if(config.cleanupPromocodes) {
      //   initPromoCodeCleanupCron();
      // }
    } catch (error) {
      startupLogger.error(error instanceof Error ? error.message:
        'An unexpected error occurred while starting the server.'
      );
    }
  }
}

export default ChronosServer;

