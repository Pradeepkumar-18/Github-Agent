import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { CommitsService } from './commits.service';
import { CommitsController } from './commits.controller';

@Module({
    imports: [DatabaseModule, RepositoriesModule],
    controllers: [CommitsController],
    providers: [CommitsService],
    exports: [CommitsService],
})
export class CommitsModule { }
