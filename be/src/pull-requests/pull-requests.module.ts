import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { PullRequestsService } from './pull-requests.service';
import { PullRequestsController } from './pull-requests.controller';

@Module({
    imports: [DatabaseModule, RepositoriesModule],
    controllers: [PullRequestsController],
    providers: [PullRequestsService],
    exports: [PullRequestsService],
})
export class PullRequestsModule { }
