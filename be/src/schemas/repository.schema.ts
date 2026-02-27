import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RepositoryDocument = Repository & Document;

@Schema({ timestamps: true })
export class Repository {
    @Prop({ required: true, unique: true })
    githubId: number;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    fullName: string;

    @Prop()
    owner: string;

    @Prop()
    url: string;
}

export const RepositorySchema = SchemaFactory.createForClass(Repository);
