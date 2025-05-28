import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import SwaggerParser from '@apidevtools/swagger-parser';
import { Logger } from '../utils/logger';
import config from './env.config';

const setupSwagger = async (app: express.Application) => {
  const logger = new Logger('Swagger');
  if(config.checkSwaggerFilesValidation) {
    try {
      await SwaggerParser.validate(path.resolve(__dirname, '../../docs/open-api.yaml'));
      logger.info('Swagger files are valid');
    } catch (error) {
      logger.error('Swagger validation error: ' + (error as Error).message);
    }
  } else {
    logger.info('Swagger validation is disabled');
  }

  const swaggerDocument = await SwaggerParser.bundle(path.resolve(__dirname, '../../docs/open-api.yaml'));
  app.use('/api/docs/', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    explorer: true,
    swaggerOptions: {
      url: '/api/docs/open-api.yaml',
      docExpansion: 'none',
      defaultModelsExpandDepth: 3,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  }));
};

export default setupSwagger;
