/**
 * Centralized Logging System
 * 
 * Provides structured logging with different log levels and optional
 * production filtering to reduce console noise.
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

export interface LogConfig {
  level: LogLevel;
  enableInProduction: boolean;
  enableTimestamps: boolean;
  enableStackTrace: boolean;
}

class Logger {
  private config: LogConfig = {
    level: process.env.NODE_ENV === 'production' ? LogLevel.WARN : LogLevel.DEBUG,
    enableInProduction: false,
    enableTimestamps: true,
    enableStackTrace: false,
  };

  configure(config: Partial<LogConfig>) {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (process.env.NODE_ENV === 'production' && !this.config.enableInProduction) {
      return level <= LogLevel.ERROR;
    }
    return level <= this.config.level;
  }

  private format(level: string, message: string, data?: any): string {
    const timestamp = this.config.enableTimestamps 
      ? `[${new Date().toISOString()}]` 
      : '';
    
    const prefix = `${timestamp}[${level}]`;
    
    if (data !== undefined) {
      return `${prefix} ${message}`;
    }
    
    return `${prefix} ${message}`;
  }

  error(message: string, error?: Error | unknown, data?: any) {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    console.error(this.format('ERROR', message), data);
    
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: this.config.enableStackTrace ? error.stack : undefined,
      });
    } else if (error) {
      console.error('Error data:', error);
    }
  }

  warn(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.WARN)) return;
    console.warn(this.format('WARN', message), data ?? '');
  }

  info(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.INFO)) return;
    console.info(this.format('INFO', message), data ?? '');
  }

  debug(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    console.debug(this.format('DEBUG', message), data ?? '');
  }

  trace(message: string, data?: any) {
    if (!this.shouldLog(LogLevel.TRACE)) return;
    console.log(this.format('TRACE', message), data ?? '');
  }

  // Scoped loggers for specific modules
  scope(scopeName: string) {
    return {
      error: (message: string, error?: Error | unknown, data?: any) => 
        this.error(`[${scopeName}] ${message}`, error, data),
      warn: (message: string, data?: any) => 
        this.warn(`[${scopeName}] ${message}`, data),
      info: (message: string, data?: any) => 
        this.info(`[${scopeName}] ${message}`, data),
      debug: (message: string, data?: any) => 
        this.debug(`[${scopeName}] ${message}`, data),
      trace: (message: string, data?: any) => 
        this.trace(`[${scopeName}] ${message}`, data),
    };
  }
}

// Singleton instance
export const logger = new Logger();

// Pre-configured scoped loggers for common modules
export const canvasLogger = logger.scope('Canvas');
export const syncLogger = logger.scope('Sync');
export const authLogger = logger.scope('Auth');
export const apiLogger = logger.scope('API');
export const hueLogger = logger.scope('Hue');
export const analyticsLogger = logger.scope('Analytics');
