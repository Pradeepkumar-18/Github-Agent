import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema({ timestamps: true, collection: 'repositories' })
export class Repository {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, trim: true })
    fullName: string; // e.g. "org/repo-name"

    @Prop({ required: true, unique: true })
    githubId: number;

    /** Which git provider this repository belongs to */
    @Prop({ type: String, enum: ['github', 'gitlab'], default: 'github' })
    provider: 'github' | 'gitlab';

    /** GitHub / GitLab repository owner (username or org) */
    @Prop({ required: true, trim: true })
    owner: string;

    /** GitHub repository short name (without owner prefix) */
    @Prop({ required: true, trim: true })
    repo: string;

    /** AES-256 encrypted Personal Access Token — never exposed in API responses */
    @Prop({ type: String, select: false, default: null })
    encryptedToken: string | null;

    @Prop({ default: '' })
    description: string;

    @Prop({ default: '' })
    language: string;

    @Prop({ default: 'main' })
    defaultBranch: string;

    @Prop({ required: true })
    url: string;

    @Prop({
        type: String,
        enum: ['active', 'archived', 'inactive'],
        default: 'active',
    })
    status: string;

    @Prop({ default: 0, min: 0, max: 100 })
    healthScore: number;

    @Prop({ default: 0 })
    totalCommits: number;

    @Prop({ default: 0 })
    openPRs: number;

    @Prop({ type: Object, default: {} })
    metadata: Record<string, any>;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
// fullName and githubId indexes are created automatically via unique:true on @Prop
RepositorySchema.index({ owner: 1, repo: 1 }, { unique: true });
