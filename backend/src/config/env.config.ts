import * as dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const toBoolean = () =>
  z.preprocess((val) => {
    if (typeof val === 'string') {
      return val.toLowerCase() === 'true';
    }
    return Boolean(val);
  }, z.boolean());

const toNumber = (def: number) => z.coerce.number().default(def);

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: toNumber(3000),
  HOST: z.string().default('localhost'),

  JWT_ACCESS_TOKEN_SECRET: z.string().default('defaultAccessTokenSecret'),
  JWT_REFRESH_TOKEN_SECRET: z.string().default('defaultRefreshTokenSecret'),
  JWT_EMAIL_TOKEN_SECRET: z.string().default('defaultEmailTokenSecret'),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),
  JWT_EMAIL_TOKEN_EXPIRES_IN: z.string().default('7m'),

  DB_USER: z.string(),
  DB_PASS: z.string(),
  DB_NAME: z.string(),
  DB_HOST: z.string().default('localhost'),
  DB_PORT: toNumber(3306),

  MAIL_HOST: z.string(),
  MAIL_USER: z.string(),
  MAIL_PASS: z.string(),

  MYSQLDB_LOCAL_PORT: toNumber(3307),
  MYSQLDB_DOCKER_PORT: toNumber(3306),

  NODE_LOCAL_PORT: toNumber(3000),
  NODE_DOCKER_PORT: toNumber(8080),

  DATABASE_URL: z.string(),
  TIME_BETWEEN_PROMOCODE_IN_MINUTES: toNumber(5),
  MAX_REQUEST_PER_MINUTE: toNumber(100),

  RECAPTCHA_SECRET_KEY: z.string(),
  IS_CHECK_RECAPTCHA: toBoolean(),

  CLEANUP_EVENTS: toBoolean().default(false),
  CLEANUP_EVENTS_LOG: toBoolean().default(false),

  CLEANUP_PROMOCODES: toBoolean().default(false),
  CLEANUP_PROMOCODES_LOG: toBoolean().default(false),

  GOOGLE_CLOUD_PROJECT_ID: z.string(),
  GOOGLE_CLOUD_TRANSLATION_API_KEY: z.string(),

  CHECK_SWAGGER_FILES_VALIDATION: toBoolean().default(true),

  USE_REQUEST_LOGGER: toBoolean().default(true),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('Config validation error:', parsedEnv.error.format());
  throw new Error('Config validation error');
}

const envVars = parsedEnv.data;

export default {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  host: envVars.HOST,
  JWT: {
    accessTokenSecret: envVars.JWT_ACCESS_TOKEN_SECRET,
    refreshTokenSecret: envVars.JWT_REFRESH_TOKEN_SECRET,
    emailTokenSecret: envVars.JWT_EMAIL_TOKEN_SECRET,
    accessTokenExpiry: envVars.JWT_ACCESS_TOKEN_EXPIRES_IN,
    refreshTokenExpiry: envVars.JWT_REFRESH_TOKEN_EXPIRES_IN,
    emailTokenExpiry: envVars.JWT_EMAIL_TOKEN_EXPIRES_IN,
  },
  database: {
    user: envVars.DB_USER,
    pass: envVars.DB_PASS,
    name: envVars.DB_NAME,
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    url: envVars.DATABASE_URL,
  },
  mail: {
    host: envVars.MAIL_HOST,
    user: envVars.MAIL_USER,
    pass: envVars.MAIL_PASS,
  },
  nodePorts: {
    local: envVars.NODE_LOCAL_PORT,
    docker: envVars.NODE_DOCKER_PORT,
  },
  mysqlPorts: {
    local: envVars.MYSQLDB_LOCAL_PORT,
    docker: envVars.MYSQLDB_DOCKER_PORT,
  },
  timeBetweenPromoCodeInMinutes: envVars.TIME_BETWEEN_PROMOCODE_IN_MINUTES,
  maxRequestPerMinute: envVars.MAX_REQUEST_PER_MINUTE,
  recaptchaSecretKey: envVars.RECAPTCHA_SECRET_KEY,
  isCheckRecaptcha: envVars.IS_CHECK_RECAPTCHA,
  cleanupEvents: envVars.CLEANUP_EVENTS,
  cleanupEventsLog: envVars.CLEANUP_EVENTS_LOG,
  cleanupPromocodes: envVars.CLEANUP_PROMOCODES,
  cleanupPromocodesLog: envVars.CLEANUP_PROMOCODES_LOG,
  checkSwaggerFilesValidation: envVars.CHECK_SWAGGER_FILES_VALIDATION,
  googleTranslate: {
    projectId: envVars.GOOGLE_CLOUD_PROJECT_ID,
    apiKey: envVars.GOOGLE_CLOUD_TRANSLATION_API_KEY,
  },
  useRequestLogger: envVars.USE_REQUEST_LOGGER,
};
