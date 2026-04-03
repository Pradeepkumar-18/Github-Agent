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

    /** GET /api/v1/pull-requests/:id/files */
    @Get(':id/files')
    getFiles(@Param('id') id: string) {
        return this.pullRequestsService.getFiles(id);
    }

    /** GET /api/v1/pull-requests/:id */
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.pullRequestsService.findById(id);
    }

    @Post(':id/merge')
    @HttpCode(HttpStatus.OK)
    merge(@Param('id') id: string, @Body('commitMessage') commitMessage?: string) {
        return this.pullRequestsService.merge(id, commitMessage);
    }


    /** GET /api/v1/pull-requests/:id/comments */
    @Get(':id/comments')
    getComments(@Param('id') id: string) {
        return this.pullRequestsService.getComments(id);
    }

    /** POST /api/v1/pull-requests/:id/comments */
    @Post(':id/comments')
    @HttpCode(HttpStatus.CREATED)
    addComment(@Param('id') id: string, @Body('body') body: string) {
        return this.pullRequestsService.addComment(id, body);
    }

    /** POST /api/v1/pull-requests/:id/close */
    @Post(':id/close')
    @HttpCode(HttpStatus.OK)
    close(@Param('id') id: string, @Body('reason') reason?: string) {
        return this.pullRequestsService.close(id, reason);
    }
}




