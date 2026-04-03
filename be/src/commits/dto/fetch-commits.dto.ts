import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class FetchCommitsDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsDateString()
    since: string;

    @IsDateString()
    until: string;
}
