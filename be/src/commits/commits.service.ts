import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Commit, CommitDocument } from '../database/schemas/commit.schema';
import { Repository, RepositoryDocument } from '../database/schemas/repository.schema';
import { RepositoriesService } from '../repositories/repositories.service';
import { FetchCommitsDto } from './dto/fetch-commits.dto';

@Injectable()
export class CommitsService {
    private readonly logger = new Logger(CommitsService.name);

    constructor(
        @InjectModel(Commit.name)
        private readonly commitModel: Model<CommitDocument>,
        @InjectModel(Repository.name)
        private readonly repoModel: Model<RepositoryDocument>,
        private readonly repositoriesService: RepositoriesService,
    ) { }

    async fetchAndStore(dto: FetchCommitsDto): Promise<{ fetched: number; upserted: number; skipped: number }> {
        const { repositoryId, since, until } = dto;
        const { owner, repo, token, provider, providerService } =
            await this.repositoriesService.getProviderConfig(repositoryId);

        const commits = await providerService.fetchCommitsByDateRange(owner, repo, token, since, until);

        let upserted = 0;
        let skipped = 0;
        const repoObjectId = new Types.ObjectId(repositoryId);
        const fullName = `${owner}/${repo}`;

        for (const c of commits) {
            const result = await this.commitModel.updateOne(
                { sha: c.sha },
                {
                    $setOnInsert: {
                        sha: c.sha,
                        message: c.message,
                        authorName: c.authorName,
                        authorEmail: c.authorEmail,
                        authorAvatar: c.authorAvatar,
                        repositoryId: repoObjectId,
                        repositoryFullName: fullName,
                        url: c.url,
                        additions: c.additions,
                        deletions: c.deletions,
                        changedFiles: c.changedFiles,
                        evaluationStatus: 'pending',
                        committedAt: new Date(c.committedAt),
                        branch: 'default',
                    },
                },
                { upsert: true },
            );

            if (result.upsertedCount > 0) upserted++;
            else skipped++;
        }

        await this.repoModel.findByIdAndUpdate(repositoryId, {
            $inc: { totalCommits: upserted },
        });

        this.logger.log(`[${provider}] fetch-commits [${fullName}]: fetched=${commits.length} upserted=${upserted} skipped=${skipped}`);
        return { fetched: commits.length, upserted, skipped };
    }

    async findAll(
        repositoryId: string,
        page: number,
        limit: number,
        search?: string,
    ): Promise<{ data: CommitDocument[]; total: number; page: number; limit: number }> {
        const filter: Record<string, any> = {};

        if (repositoryId) {
            filter.repositoryId = new Types.ObjectId(repositoryId);
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { message: regex },
                { authorName: regex },
                { sha: regex },
            ];
        }

        const [data, total] = await Promise.all([
            this.commitModel
                .find(filter)
                .sort({ committedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .exec(),
            this.commitModel.countDocuments(filter).exec(),
        ]);
        return { data: data as any, total, page, limit };
    }

    async findBySha(sha: string): Promise<CommitDocument> {
        const commit = await this.commitModel
            .findOne({ sha: { $regex: `^${sha}`, $options: 'i' } })
            .lean()
            .exec();
        if (!commit) throw new NotFoundException(`Commit ${sha} not found`);
        return commit as any;
    }
}
