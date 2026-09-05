import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"

import { CategoriesService } from "../categories/categories.service.js"
import { CreateCategoryDto } from "../categories/dto/create-category.dto.js"
import { UpdateCategoryDto } from "../categories/dto/update-category.dto.js"
import { Roles } from "../common/decorators/roles.decorator.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { RolesGuard } from "../common/guards/roles.guard.js"

/**
 * Admin-only category mutations + list.
 * Role is always re-checked from DB via RolesGuard (ADMIN only created via DB/ops).
 */
@Controller("admin/categories")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
export class AdminCategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  list() {
    return this.categories.findAll()
  }

  @Post()
  create(@Body() dto: CreateCategoryDto) {
    return this.categories.create(dto)
  }

  @Patch(":id")
  update(
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto
  ) {
    return this.categories.update(id, dto)
  }

  @Delete(":id")
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.categories.remove(id)
  }
}
