import { Controller, Get, Post, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { RepositoriesService } from './repositories.service';
import { CreateRepositoryDto } from './dto/create-repository.dto';

@Controller('repositories')
export class RepositoriesController {
    constructor(private readonly repositoriesService: RepositoriesService) { }

    /** POST /api/v1/repositories — Register a new GitHub repository */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    create(@Body() dto: CreateRepositoryDto) {
        return this.repositoriesService.create(dto);
    }

    /** GET /api/v1/repositories — List all configured repositories */
    @Get()
    findAll() {
        return this.repositoriesService.findAll();
    }

    /** GET /api/v1/repositories/:id — Get a single repository by Mongo ID */
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.repositoriesService.findById(id);
    }
}
