import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from "@nestjs/common"

import { CategoriesService } from "./categories.service.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { CreateCategoryDto } from "./dto/create-category.dto.js"
import { UpdateCategoryDto } from "./dto/update-category.dto.js"

@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.findAll()
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(userId, dto)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categories.update(userId, id, dto)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUserId() userId: string, @Param("id", ParseIntPipe) id: number) {
    return this.categories.remove(userId, id)
  }
}
