import config from '../config/env.config';
import { AppDataSource } from '../config/orm.config';
import { startupLogger } from '../utils/logger';

class DatabaseService {
  private maxRetries: number;
  private retryDelay: number;

  constructor(maxRetries = 5, retryDelay = 15000) {
    this.maxRetries = maxRetries;
    this.retryDelay = retryDelay;
  }

  public async connectWithRetries(attempts = 0): Promise<void> {
    try {
      await AppDataSource.initialize();
      startupLogger.info('Database connection established successfully');
    } catch (error) {
      startupLogger.error(
        `Failed to initialize database connection: ${(error as Error).message}`,
      );
      if (config.env === 'development') {
        startupLogger.error(`Error stack: ${(error as Error).stack}`);
      }
      attempts++;

      if (attempts < this.maxRetries) {
        startupLogger.warn(
          `Retrying database connection (${attempts}/${this.maxRetries}) in ${this.retryDelay / 1000} seconds...`,
        );
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
        await this.connectWithRetries(attempts);
      } else {
        startupLogger.error(
          'Max retries reached. Unable to connect to the database.',
        );
        throw new Error('Database connection failed after max retries');
      }
    }
  }
}

export const databaseService = new DatabaseService();
