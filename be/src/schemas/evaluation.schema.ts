import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Commit } from './commit.schema';
import { Pr } from './pr.schema';

export type EvaluationDocument = Evaluation & Document;

@Schema({ timestamps: true })
export class Evaluation {
    @Prop({ type: Types.ObjectId, ref: 'Commit' })
    commit?: string | Commit;

    @Prop({ type: Types.ObjectId, ref: 'Pr' })
    pr?: string | Pr;

    @Prop({ required: true })
    targetType: 'COMMIT' | 'PR';

    @Prop({ required: true })
    score: number;

    @Prop({ required: true })
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

    @Prop({ type: Object })
    aiSummary: any;

    @Prop({ required: true, default: 'PENDING' })
    status: 'PENDING' | 'EVALUATING' | 'COMPLETED' | 'FAILED';
}

export const EvaluationSchema = SchemaFactory.createForClass(Evaluation);
