import { IsString, IsNotEmpty, IsOptional, Length, IsIn } from 'class-validator';

export class CreateRepositoryDto {
    /**
     * Repository owner (GitHub username/org or GitLab namespace).
     * e.g. "octocat" or "my-group"
     */
    @IsString()
    @IsNotEmpty()
    owner: string;

    /**
     * Repository short name (without owner prefix).
     * e.g. "hello-world"
     */
    @IsString()
    @IsNotEmpty()
    repo: string;

    /**
     * Personal Access Token.
     * GitHub: starts with "ghp_"  |  GitLab: starts with "glpat-"
     * Stored encrypted — never returned in responses.
     */
    @IsString()
    @IsNotEmpty()
    @Length(1, 512)
    token: string;

    /**
     * Git provider. Defaults to 'github'.
     */
    @IsOptional()
    @IsIn(['github', 'gitlab'])
    provider?: 'github' | 'gitlab';
}
