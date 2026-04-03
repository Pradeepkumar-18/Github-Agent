import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    HttpCode,
    HttpStatus,
    DefaultValuePipe,
    ParseIntPipe,
} from '@nestjs/common';
import { CommitsService } from './commits.service';
import { FetchCommitsDto } from './dto/fetch-commits.dto';

@Controller('commits')
export class CommitsController {
    constructor(private readonly commitsService: CommitsService) { }

    /** POST /api/v1/commits/fetch — Trigger GitHub fetch for a date range */
    @Post('fetch')
    @HttpCode(HttpStatus.OK)
    fetchCommits(@Body() dto: FetchCommitsDto) {
        return this.commitsService.fetchAndStore(dto);
    }

    /** GET /api/v1/commits?repositoryId=...&page=1&limit=20&search=feat */
    @Get()
    findAll(
        @Query('repositoryId') repositoryId: string,
        @Query('search') search: string,
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    ) {
        return this.commitsService.findAll(repositoryId, page, Math.min(limit, 100), search);
    }

    /** GET /api/v1/commits/:sha */
    @Get(':sha')
    findOne(@Param('sha') sha: string) {
        return this.commitsService.findBySha(sha);
    }
}
