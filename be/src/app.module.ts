import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './database/database.module';
// import { QueueModule } from './queue/queue.module'; // Phase 3 — requires Redis
import { HealthModule } from './health/health.module';
import { LoggerModule } from './logger/logger.module';
import { GithubModule } from './github/github.module';
import { GitlabModule } from './gitlab/gitlab.module';
import { RepositoriesModule } from './repositories/repositories.module';
import { CommitsModule } from './commits/commits.module';
import { PullRequestsModule } from './pull-requests/pull-requests.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    DatabaseModule,
    // QueueModule,  // Phase 3 — uncomment when AI evaluation queues are needed
    HealthModule,
    GithubModule,
    GitlabModule,
    RepositoriesModule,
    CommitsModule,
    PullRequestsModule,
  ],
})
export class AppModule { }
