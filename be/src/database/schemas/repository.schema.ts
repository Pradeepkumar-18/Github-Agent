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
RepositorySchema.index({ fullName: 1 });
RepositorySchema.index({ githubId: 1 }, { unique: true });
