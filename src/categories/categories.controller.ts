import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './schema/categories.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Product } from '../product/schema/product.schema';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  async getCategoryList(): Promise<Category[]> {
    return this.categoryService.getlist();
  }

  @Get(':id')
  async getProductbyCategory(@Param('id') id: string): Promise<Product[]> {
    return this.categoryService.getProductbyCategory(id);
  }

  @Post()
  async createNewCategory(
    @Body() newcategory: CreateCategoryDto,
  ): Promise<Category> {
    return this.categoryService.create(newcategory);
  }
}
