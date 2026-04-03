import { Injectable, Logger, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PullRequest, PullRequestDocument } from '../database/schemas/pull-request.schema';
import { Repository, RepositoryDocument } from '../database/schemas/repository.schema';
import { RepositoriesService } from '../repositories/repositories.service';
import { FetchPullRequestsDto } from './dto/fetch-pull-requests.dto';

@Injectable()
export class PullRequestsService {
    private readonly logger = new Logger(PullRequestsService.name);

    constructor(
        @InjectModel(PullRequest.name)
        private readonly prModel: Model<PullRequestDocument>,
        @InjectModel(Repository.name)
        private readonly repoModel: Model<RepositoryDocument>,
        private readonly repositoriesService: RepositoriesService,
    ) { }

    async fetchAndStore(dto: FetchPullRequestsDto): Promise<{ fetched: number; upserted: number; skipped: number }> {
        const { repositoryId, since, until } = dto;
        const { owner, repo, token, provider, providerService } =
            await this.repositoriesService.getProviderConfig(repositoryId);

        const prs = await providerService.fetchPullRequestsByDateRange(owner, repo, token, since, until);

        let upserted = 0;
        let skipped = 0;
        let openCount = 0;
        const repoObjectId = new Types.ObjectId(repositoryId);
        const fullName = `${owner}/${repo}`;

        for (const pr of prs) {
            if (pr.state === 'open') openCount++;

            const result = await this.prModel.updateOne(
                { prNumber: pr.prNumber, repositoryId: repoObjectId },
                {
                    $set: {
                        state: pr.state,
                        mergedAt: pr.mergedAt ? new Date(pr.mergedAt) : null,
                        additions: pr.additions,
                        deletions: pr.deletions,
                        changedFiles: pr.changedFiles,
                        commitsCount: pr.commitsCount,
                        reviewers: pr.reviewers,
                    },
                    $setOnInsert: {
                        prNumber: pr.prNumber,
                        title: pr.title,
                        body: pr.body,
                        authorName: pr.authorName,
                        authorAvatar: pr.authorAvatar,
                        repositoryId: repoObjectId,
                        repositoryFullName: fullName,
                        baseBranch: pr.baseBranch,
                        headBranch: pr.headBranch,
                        riskLevel: 'low',
                        riskScore: 0,
                        evaluationStatus: 'pending',
                        githubCreatedAt: new Date(pr.createdAt),
                    },
                },

                { upsert: true },
            );

            if (result.upsertedCount > 0) upserted++;
            else skipped++;
        }

        if (upserted > 0) {
            await this.repoModel.findByIdAndUpdate(repositoryId, { $set: { openPRs: openCount } });
        }

        this.logger.log(`[${provider}] fetch-prs [${fullName}]: fetched=${prs.length} upserted=${upserted} skipped=${skipped}`);
        return { fetched: prs.length, upserted, skipped };
    }

    async findAll(repositoryId: string, search?: string): Promise<PullRequestDocument[]> {
        const filter: Record<string, any> = {};

        if (repositoryId) {
            filter.repositoryId = new Types.ObjectId(repositoryId);
        }

        if (search && search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            filter.$or = [
                { title: regex },
                { body: regex },
                { authorName: regex },
            ];
            // Also allow exact number search if search is purely numeric
            if (/^\d+$/.test(search.trim())) {
                filter.$or.push({ prNumber: parseInt(search.trim(), 10) });
            }
        }

        return this.prModel.find(filter).sort({ githubCreatedAt: -1 }).lean().exec() as any;
    }

    async findByNumber(prNumber: number): Promise<PullRequestDocument> {
        const pr = await this.prModel.findOne({ prNumber }).lean().exec();
        if (!pr) throw new NotFoundException(`Pull request / merge request #${prNumber} not found`);
        return pr as any;
    }

    async findById(id: string): Promise<PullRequestDocument> {
        const pr = await this.prModel.findById(id).lean().exec();
        if (!pr) throw new NotFoundException(`Pull request / merge request not found`);
        return pr as any;
    }

    async getFiles(id: string): Promise<import('../common/git-provider.interface').NormalizedFileChange[]> {
        const pr = await this.findById(id);
        const { owner, repo, token, providerService } =
            await this.repositoriesService.getProviderConfig(pr.repositoryId.toString());

        return providerService.fetchPullRequestFiles(owner, repo, token, pr.prNumber);
    }

    async merge(id: string, commitMessage?: string): Promise<{ success: boolean; sha: string }> {
        const pr = await this.findById(id);
        if (pr.state !== 'open') {
            throw new HttpException(`Cannot merge a pull request in '${pr.state}' state`, HttpStatus.BAD_REQUEST);
        }

        const { owner, repo, token, providerService } =
            await this.repositoriesService.getProviderConfig(pr.repositoryId.toString());

        const result = await providerService.mergePullRequest(owner, repo, token, pr.prNumber, commitMessage);


        if (result.merged) {
            await this.prModel.findByIdAndUpdate(id, {
                state: 'merged',
                mergedAt: new Date().toISOString(),
            });
        }

        return { success: result.merged, sha: result.sha };
    }

    async getComments(id: string): Promise<import('../common/git-provider.interface').NormalizedPRComment[]> {
        const pr = await this.findById(id);
        const { owner, repo, token, providerService } =
            await this.repositoriesService.getProviderConfig(pr.repositoryId.toString());

        return providerService.fetchPullRequestComments(owner, repo, token, pr.prNumber);
    }

    async addComment(id: string, body: string): Promise<void> {
        const pr = await this.findById(id);
        const { owner, repo, token, providerService } =
            await this.repositoriesService.getProviderConfig(pr.repositoryId.toString());

        await providerService.addComment(owner, repo, token, pr.prNumber, body);
    }

    async close(id: string, reason?: string): Promise<void> {
        const pr = await this.findById(id);
        const { owner, repo, token, providerService } =
            await this.repositoriesService.getProviderConfig(pr.repositoryId.toString());

        if (reason) {
            await providerService.addComment(owner, repo, token, pr.prNumber, reason);
        }

        await providerService.closePullRequest(owner, repo, token, pr.prNumber);

        // Update local status
        await this.prModel.findByIdAndUpdate(id, {
            state: 'closed',
        });
    }
}




