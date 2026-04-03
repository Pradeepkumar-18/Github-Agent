import {
    Injectable,
    Logger,
    NotFoundException,
    BadRequestException,
    InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository, RepositoryDocument } from '../database/schemas/repository.schema';
import { GithubService } from '../github/github.service';
import { GitlabService } from '../gitlab/gitlab.service';
import type { GitProviderService } from '../common/git-provider.interface';
import { CreateRepositoryDto } from './dto/create-repository.dto';
import { encrypt, decrypt } from '../common/crypto.util';
import { ConfigService } from '../config/config.service';

@Injectable()
export class RepositoriesService {
    private readonly logger = new Logger(RepositoriesService.name);

    constructor(
        @InjectModel(Repository.name)
        private readonly repoModel: Model<RepositoryDocument>,
        private readonly githubService: GithubService,
        private readonly gitlabService: GitlabService,
        private readonly configService: ConfigService,
    ) { }

    private get encryptionKey(): string {
        const key = this.configService.encryptionKey;
        if (!key) throw new InternalServerErrorException('ENCRYPTION_KEY not configured');
        return key;
    }

    /** Returns the correct provider service based on provider field */
    private getProviderService(provider: 'github' | 'gitlab' = 'github'): GitProviderService {
        return provider === 'gitlab' ? this.gitlabService : this.githubService;
    }

    async create(dto: CreateRepositoryDto): Promise<Omit<RepositoryDocument, 'encryptedToken'>> {
        const { owner, repo, token, provider = 'github' } = dto;
        const providerService = this.getProviderService(provider);

        // Validate token + fetch metadata from the provider
        let metadata: Awaited<ReturnType<GitProviderService['validateRepository']>>;
        try {
            metadata = await providerService.validateRepository(owner, repo, token);
        } catch (err: any) {
            if (err.status === 404 || err.status === 401 || err.status === 403) {
                throw new BadRequestException(
                    `Could not verify "${owner}/${repo}" on ${provider} with the provided token: ${err.message}`,
                );
            }
            throw new BadRequestException('Failed to reach provider API: ' + err.message);
        }

        const encryptedToken = encrypt(token, this.encryptionKey);

        const existing = await this.repoModel.findOne({ owner, repo, provider }).exec();
        if (existing) {
            existing.encryptedToken = encryptedToken;
            await existing.save();
            const plain = existing.toObject();
            delete (plain as any).encryptedToken;
            return plain as any;
        }

        const created = await this.repoModel.create({
            name: metadata.name,
            fullName: metadata.fullName,
            githubId: metadata.githubId,
            provider,
            owner,
            repo,
            encryptedToken,
            description: metadata.description,
            language: metadata.language,
            defaultBranch: metadata.defaultBranch,
            url: metadata.url,
            status: 'active',
        });

        const plain = created.toObject();
        delete (plain as any).encryptedToken;
        return plain as any;
    }

    async findAll(): Promise<RepositoryDocument[]> {
        return this.repoModel.find().select('-encryptedToken').lean().exec();
    }

    async findById(id: string): Promise<RepositoryDocument> {
        const repo = await this.repoModel.findById(id).select('-encryptedToken').lean().exec();
        if (!repo) throw new NotFoundException(`Repository ${id} not found`);
        return repo;
    }

    /**
     * Internal: returns decrypted token + provider info for use by fetch services.
     */
    async getProviderConfig(repositoryId: string): Promise<{
        owner: string;
        repo: string;
        token: string;
        provider: 'github' | 'gitlab';
        providerService: GitProviderService;
    }> {
        const found = await this.repoModel.findById(repositoryId).select('+encryptedToken').lean().exec();
        if (!found) throw new NotFoundException(`Repository ${repositoryId} not found`);
        if (!found.encryptedToken) throw new BadRequestException(`Repository ${repositoryId} has no token configured`);

        const token = decrypt(found.encryptedToken, this.encryptionKey);
        const provider = (found.provider ?? 'github') as 'github' | 'gitlab';
        return {
            owner: found.owner,
            repo: found.repo,
            token,
            provider,
            providerService: this.getProviderService(provider),
        };
    }
}
