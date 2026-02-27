import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '../config/config.service';
import { Repository, RepositorySchema } from './schemas/repository.schema';
import { Commit, CommitSchema } from './schemas/commit.schema';
import { PullRequest, PullRequestSchema } from './schemas/pull-request.schema';
import { Evaluation, EvaluationSchema } from './schemas/evaluation.schema';

@Module({
    imports: [
        MongooseModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                uri: config.mongoUri,
                connectionFactory: (connection) => {
                    connection.on('connected', () => console.log('MongoDB connected'));
                    connection.on('error', (err: any) => console.error('MongoDB error:', err));
                    return connection;
                },
            }),
        }),
        MongooseModule.forFeature([
            { name: Repository.name, schema: RepositorySchema },
            { name: Commit.name, schema: CommitSchema },
            { name: PullRequest.name, schema: PullRequestSchema },
            { name: Evaluation.name, schema: EvaluationSchema },
        ]),
    ],
    exports: [MongooseModule],
})
export class DatabaseModule { }
