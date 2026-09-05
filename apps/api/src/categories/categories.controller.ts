import { Controller, Get, Query } from "@nestjs/common"

import { CategoriesService } from "./categories.service.js"

/**
 * Public read-only category APIs for the social web app.
 * Mutations live under /admin/categories (RolesGuard + ADMIN).
 */
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  /** Top categories by post volume (public). */
  @Get("trending")
  trending(
    @Query("days") daysRaw?: string,
    @Query("limit") limitRaw?: string
  ) {
    const days = Number(daysRaw)
    const limit = Number(limitRaw)
    return this.categories.findTrending(
      Number.isFinite(days) && days > 0 ? days : 7,
      Number.isFinite(limit) && limit > 0 ? limit : 5
    )
  }

  @Get()
  list() {
    return this.categories.findAll()
  }
}
