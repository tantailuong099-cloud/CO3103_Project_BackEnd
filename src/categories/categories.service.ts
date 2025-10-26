import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schema/categories.schema';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { ProductService } from '../product/product.service';
import { ProductDocument } from '../product/schema/product.schema';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private modelCategory: Model<CategoryDocument>,
    private readonly productService: ProductService,
  ) {}

  async create(newcategory: CreateCategoryDto): Promise<CategoryDocument> {
    const newCategory = new this.modelCategory(newcategory);
    return newCategory.save();
  }

  async getlist(): Promise<CategoryDocument[]> {
    const filter = {};
    return this.modelCategory.find(filter);
  }

  async getProductbyCategory(category: string): Promise<ProductDocument[]> {
    return this.productService.findByCategory(category);
  }
}
