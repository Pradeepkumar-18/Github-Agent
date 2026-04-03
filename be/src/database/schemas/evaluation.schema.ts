import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type EvaluationDocument = Evaluation & Document;

@Schema({ timestamps: true, collection: 'evaluations' })
export class Evaluation {
    @Prop({ required: true })
    targetId: string; // sha for commit, prNumber for PR

    @Prop({
        type: String,
        enum: ['commit', 'pull_request'],
        required: true,
    })
    targetType: string;

    @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
    repositoryId: Types.ObjectId;

    @Prop({ default: '' })
    summary: string;

    @Prop({ default: 0, min: 0, max: 100 })
    qualityScore: number;

    @Prop({ default: 0, min: 0, max: 100 })
    securityScore: number;

    @Prop({ default: 0, min: 0, max: 100 })
    maintainabilityScore: number;

    @Prop({ default: 0, min: 0, max: 100 })
    overallScore: number;

    @Prop({
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
    })
    riskLevel: string;

    @Prop({ type: [String], default: [] })
    issues: string[];

    @Prop({ type: [String], default: [] })
    suggestions: string[];

    @Prop({ type: [Object], default: [] })
    fileAnalysis: Array<{
        filename: string;
        risk: string;
        notes: string;
    }>;

    @Prop({
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending',
    })
    status: string;

    @Prop({ default: '' })
    model: string;

    @Prop({ default: 0 })
    tokensUsed: number;

    @Prop({ type: String, default: null })
    failureReason: string | null;
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
EvaluationSchema.index({ targetId: 1, targetType: 1 });
EvaluationSchema.index({ repositoryId: 1, status: 1 });
