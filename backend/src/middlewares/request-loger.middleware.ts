import morgan from 'morgan';
import { Logger } from '../utils/logger';

const format = ':method :url :status :response-time ms - :res[content-length]';
const logger = new Logger('Request');

const requestLogger = morgan(format, {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
});

export default requestLogger;
