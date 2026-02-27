import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Repository } from './repository.schema';

export type CommitDocument = Commit & Document;

@Schema({ timestamps: true })
export class Commit {
    @Prop({ required: true, unique: true })
    hash: string;

    @Prop({ type: Types.ObjectId, ref: 'Repository', required: true })
    repository: string | Repository;

    @Prop({ required: true })
    message: string;

    @Prop({ required: true })
    authorName: string;

    @Prop()
    authorEmail: string;

    @Prop()
    url: string;
}

export const CommitSchema = SchemaFactory.createForClass(Commit);
