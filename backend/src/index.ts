import config from './config/env.config';
import ChronosServer from './app';
import { startupLogger } from './utils/logger';

function start() {
  try {
    const server = new ChronosServer();
    server.start(config.port);
  } catch (error) {
    startupLogger.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

start();
