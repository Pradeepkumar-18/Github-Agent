import { Controller, Get } from '@nestjs/common';
import {
    HealthCheck,
    HealthCheckService,
    MongooseHealthIndicator,
    MemoryHealthIndicator,
} from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUES } from '../queue/queue.constants';

@Controller('health')
export class HealthController {
    constructor(
        private health: HealthCheckService,
        private mongoose: MongooseHealthIndicator,
        private memory: MemoryHealthIndicator,
        @InjectQueue(QUEUES.COMMIT_EVALUATION) private commitQueue: Queue,
    ) { }

    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.mongoose.pingCheck('mongodb'),
            () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
        ]);
    }

    @Get('queues')
    async checkQueues() {
        const counts = await this.commitQueue.getJobCounts();
        return {
            status: 'ok',
            queues: {
                commitEvaluation: counts,
            },
        };
    }
}
