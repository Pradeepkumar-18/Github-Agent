import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
import { QueueModule } from './queue/queue.module';
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    QueueModule,
    HealthModule,
  ],
})
export class AppModule { }
