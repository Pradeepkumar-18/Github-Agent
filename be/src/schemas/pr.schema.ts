import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Repository } from './repository.schema';

export type PrDocument = Pr & Document;

@Schema({ timestamps: true })
export class Pr {
    @Prop({ required: true, unique: true })
    pullRequestId: number;

    @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
    repository: string | Repository;

    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ required: true })
    authorName: string;

    @Prop({ required: true })
    state: string;

    @Prop()
    url: string;
}

export const PrSchema = SchemaFactory.createForClass(Pr);
