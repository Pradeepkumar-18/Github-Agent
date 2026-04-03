import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
// QueueModule removed — Redis not required until Phase 3

@Module({
    imports: [TerminusModule],
    controllers: [HealthController],
})
export class HealthModule { }
