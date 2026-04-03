import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { GithubModule } from '../github/github.module';
import { GitlabModule } from '../gitlab/gitlab.module';
import { ConfigModule } from '../config/config.module';
import { RepositoriesService } from './repositories.service';
import { RepositoriesController } from './repositories.controller';

@Module({
    imports: [DatabaseModule, GithubModule, GitlabModule, ConfigModule],
    controllers: [RepositoriesController],
    providers: [RepositoriesService],
    exports: [RepositoriesService],
})
export class RepositoriesModule { }
