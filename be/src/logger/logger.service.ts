import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports, Logger } from 'winston';

@Injectable()
export class AppLogger implements LoggerService {
    private logger: Logger;

    constructor() {
        this.logger = createLogger({
            level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
            format: format.combine(
                format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                format.errors({ stack: true }),
                process.env.NODE_ENV === 'production'
                    ? format.json()
                    : format.combine(
                        format.colorize(),
                        format.printf(({ timestamp, level, message, context, ...meta }) => {
                            return `${timestamp} [${level}]${context ? ` [${context}]` : ''} ${message} ${Object.keys(meta).length ? JSON.stringify(meta) : ''
                                }`;
                        }),
                    ),
            ),
            transports: [
                new transports.Console(),
                ...(process.env.NODE_ENV === 'production'
                    ? [
                        new transports.File({ filename: 'logs/error.log', level: 'error' }),
                        new transports.File({ filename: 'logs/combined.log' }),
                    ]
                    : []),
            ],
        });
    }

    log(message: string, context?: string) {
        this.logger.info(message, { context });
    }

    error(message: string, trace?: string, context?: string) {
        this.logger.error(message, { trace, context });
    }

    warn(message: string, context?: string) {
        this.logger.warn(message, { context });
    }

    debug(message: string, context?: string) {
        this.logger.debug(message, { context });
    }

    verbose(message: string, context?: string) {
        this.logger.verbose(message, { context });
    }
}
