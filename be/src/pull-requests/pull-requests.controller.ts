import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { PullRequestsService } from './pull-requests.service';
import { FetchPullRequestsDto } from './dto/fetch-pull-requests.dto';

@Controller('pull-requests')
export class PullRequestsController {
    constructor(private readonly pullRequestsService: PullRequestsService) { }

    /** POST /api/v1/pull-requests/fetch — Trigger GitHub fetch for a date range */
    @Post('fetch')
    @HttpCode(HttpStatus.OK)
    fetchPullRequests(@Body() dto: FetchPullRequestsDto) {
        return this.pullRequestsService.fetchAndStore(dto);
    }

    /** GET /api/v1/pull-requests?repositoryId=...&search=... */
    @Get()
    findAll(
        @Query('repositoryId') repositoryId: string,
        @Query('search') search: string
    ) {
        return this.pullRequestsService.findAll(repositoryId, search);
    }

    /** GET /api/v1/pull-requests/:number */
    @Get(':number')
    findOne(@Param('number', ParseIntPipe) prNumber: number) {
        return this.pullRequestsService.findByNumber(prNumber);
    }
}
