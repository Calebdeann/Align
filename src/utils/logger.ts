/**
 * Simple structured logging utility
 * In development: Pretty prints to console
 * In production: Outputs JSON for potential log aggregation
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

// Check if we're in development mode
// __DEV__ is a React Native global that's true in dev builds
declare const __DEV__: boolean;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const log = (level: LogLevel, message: string, context?: LogContext) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...context,
  };

  if (isDev) {
    // Development: Pretty print with color-coded level
    const prefix = `[${level.toUpperCase()}]`;
    if (context && Object.keys(context).length > 0) {
      console.log(`${prefix} ${message}`, context);
    } else {
      console.log(`${prefix} ${message}`);
    }
  } else {
    // Production: JSON format for log aggregation
    console.log(JSON.stringify(logEntry));
  }
};

export const logger = {
  debug: (message: string, context?: LogContext) => log('debug', message, context),
  info: (message: string, context?: LogContext) => log('info', message, context),
  warn: (message: string, context?: LogContext) => log('warn', message, context),
  error: (message: string, context?: LogContext) => log('error', message, context),
};

// Helper for logging API errors with consistent structure
export const logApiError = (operation: string, error: unknown, additionalContext?: LogContext) => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(`API Error: ${operation}`, {
    operation,
    error: errorMessage,
    stack: errorStack,
    ...additionalContext,
  });
};
