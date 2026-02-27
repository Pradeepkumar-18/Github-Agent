import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PullRequestDocument = PullRequest & Document;

@Schema({ timestamps: true, collection: 'pull_requests' })
export class PullRequest {
    @Prop({ required: true })
    prNumber: number;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    body: string;

    @Prop({ default: '' })
    authorName: string;

    @Prop({ default: '' })
    authorAvatar: string;

    @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
    repositoryId: Types.ObjectId;

    @Prop({ required: true })
    repositoryFullName: string;

    @Prop({ default: 'main' })
    baseBranch: string;

    @Prop({ default: '' })
    headBranch: string;

    @Prop({
        type: String,
        enum: ['open', 'closed', 'merged'],
        default: 'open',
    })
    state: string;

    @Prop({
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
    })
    riskLevel: string;

    @Prop({ default: 0, min: 0, max: 100 })
    riskScore: number;

    @Prop({ default: 0 })
    additions: number;

    @Prop({ default: 0 })
    deletions: number;

    @Prop({ default: 0 })
    changedFiles: number;

    @Prop({ default: 0 })
    commitsCount: number;

    @Prop({
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    })
    evaluationStatus: string;

    @Prop({ type: Types.ObjectId, ref: 'Evaluation', default: null })
    evaluationId: Types.ObjectId | null;

    @Prop({ default: null })
    mergedAt: Date | null;

    @Prop({ required: true })
    githubCreatedAt: Date;
}

export const PullRequestSchema = SchemaFactory.createForClass(PullRequest);
PullRequestSchema.index({ repositoryId: 1, state: 1 });
PullRequestSchema.index({ repositoryId: 1, riskLevel: 1 });
PullRequestSchema.index({ prNumber: 1, repositoryId: 1 }, { unique: true });
