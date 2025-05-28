import chalk from 'chalk';

export enum LogEnum {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export class Logger {
  private context: string;

  constructor(context: string = Logger.name) {
    this.context = context;
  }

  public setContext(context: string): void {
    this.context = context;
  }

  private getFormattedTime(): string {
    const now = new Date();
    return now.toLocaleTimeString();
  }

  private log(level: LogEnum, message: string): void {
    const color = chalk;
    const timestamp = this.getFormattedTime();

    switch (level) {
      case LogEnum.INFO:
        console.info(
          color.green(
            color`{cyan [${timestamp}]} [${level}] {cyan [${this.context}]}: ${message}`,
          ),
        );
        break;
      case LogEnum.WARNING:
        console.warn(
          color.yellow(
            color`{cyan [${timestamp}]} [${level}] {cyan [${this.context}]}: ${message}`,
          ),
        );
        break;
      case LogEnum.ERROR:
        console.error(
          color.red(
            color`{cyan [${timestamp}]} [${level}] {cyan [${this.context}]}: ${message}`,
          ),
        );
        break;
      case LogEnum.DEBUG:
        console.debug(
          color.blue(
            color`{cyan [${timestamp}]} [${level}] {cyan [${this.context}]}: ${message}`,
          ),
        );
        break;
    }
  }

  public info(message: string): void {
    this.log(LogEnum.INFO, message);
  }

  public warn(message: string): void {
    this.log(LogEnum.WARNING, message);
  }

  public error(message: string): void {
    this.log(LogEnum.ERROR, message);
  }

  public debug(message: string): void {
    this.log(LogEnum.DEBUG, message);
  }
}

export const startupLogger = new Logger('Startup');
