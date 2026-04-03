import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class FetchPullRequestsDto {
    @IsString()
    @IsNotEmpty()
    repositoryId: string;

    @IsDateString()
    since: string;

    @IsDateString()
    until: string;
}
