import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '../config/config.service';
import { QUEUES } from './queue.constants';

@Module({
    imports: [
        BullModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                connection: {
                    host: config.redisConfig.host,
                    port: config.redisConfig.port,
                    password: config.redisConfig.password,
                },
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                },
            }),
        }),
        BullModule.registerQueue(
            { name: QUEUES.COMMIT_EVALUATION },
            { name: QUEUES.PR_EVALUATION },
            { name: QUEUES.NOTIFICATION },
        ),
    ],
    exports: [BullModule],
})
export class QueueModule { }
