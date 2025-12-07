import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from './schema/categories.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { Product } from '../product/schema/product.schema';
import { JwtAuthGuard } from '@/auth/jwt/jwt-auth.guard';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoryService: CategoriesService) {}

  @Get()
  async getCategoryList(): Promise<Category[]> {
    return this.categoryService.getlist();
  }

  @Get(':id')
  async getCategoryDetail(@Param('id') id: string): Promise<Category> {
    return this.categoryService.findOne(id);
  }

  @Get(':category')
  async getProductbyCategory(
    @Param('category') category: string,
  ): Promise<Product[]> {
    return this.categoryService.getProductbyCategory(category);
  }

  // @Post()
  // async createNewCategory(
  //   @Body() newcategory: CreateCategoryDto,
  // ): Promise<Category> {
  //   return this.categoryService.create(newcategory);
  // }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createCategoryDto: CreateCategoryDto, @Req() req) {
    const userId = req.user.userId;
    return this.categoryService.create(createCategoryDto, userId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req,
  ) {
    const userId = req.user.userId;
    return this.categoryService.update(id, updateCategoryDto, userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.categoryService.delete(id);
  }
}
