import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommitDocument = Commit & Document;

@Schema({ timestamps: true, collection: 'commits' })
export class Commit {
    @Prop({ required: true, unique: true })
    sha: string;

    @Prop({ required: true })
    message: string;

    @Prop({ default: '' })
    authorName: string;

    @Prop({ default: '' })
    authorEmail: string;

    @Prop({ default: '' })
    authorAvatar: string;

    @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
    repositoryId: Types.ObjectId;

    @Prop({ required: true })
    repositoryFullName: string;

    @Prop({ default: '' })
    url: string;

    @Prop({ default: 0 })
    additions: number;

    @Prop({ default: 0 })
    deletions: number;

    @Prop({ default: 0 })
    changedFiles: number;

    @Prop({
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    })
    evaluationStatus: string;

    @Prop({ type: Types.ObjectId, ref: 'Evaluation', default: null })
    evaluationId: Types.ObjectId | null;

    @Prop({ required: true })
    committedAt: Date;

    @Prop({ default: 'main' })
    branch: string;
}

export const CommitSchema = SchemaFactory.createForClass(Commit);
CommitSchema.index({ repositoryId: 1, committedAt: -1 });
CommitSchema.index({ sha: 1 }, { unique: true });
CommitSchema.index({ evaluationStatus: 1 });
