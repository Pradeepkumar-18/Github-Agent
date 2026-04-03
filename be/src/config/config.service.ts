import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
    constructor(private config: NestConfigService) { }

    get port(): number {
        return this.config.get<number>('port') ?? 3000;
    }

    get isDevelopment(): boolean {
        return this.config.get<string>('nodeEnv') === 'development';
    }

    get mongoUri(): string {
        return this.config.get<string>('mongodb.uri') ?? 'mongodb://localhost:27017/code_intelligence';
    }

    get redisConfig() {
        return this.config.get('redis');
    }

    get githubConfig() {
        return this.config.get('github');
    }

    get aiConfig() {
        return this.config.get('ai');
    }

    get encryptionKey(): string {
        return this.config.get<string>('encryptionKey') ?? 'dev_encryption_key_32_chars_min!!';
    }
}
