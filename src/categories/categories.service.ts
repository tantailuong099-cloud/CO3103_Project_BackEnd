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

  // async getProductbyCategory(category: string): Promise<ProductDocument[]> {
  //   return this.productService.findByCategory(category);
  // }

  async getProductbyCategory(categoryName: string): Promise<ProductDocument[]> {
    // Bước 1: Dùng TÊN (categoryName) để tìm category tương ứng trong DB
    const categoryDoc = await this.modelCategory
      .findOne({ name: categoryName }) // Tìm bằng tên
      .exec();

    // Bước 2: Nếu không tìm thấy category, báo lỗi hoặc trả về mảng rỗng
    if (!categoryDoc) {
      // Hoặc throw new NotFoundException(`Category '${categoryName}' not found`);
      return [];
    }

    // Bước 3: Lấy _id từ category vừa tìm được
    const categoryId: string = categoryDoc._id.toString();

    // Bước 4: Dùng ID này để tìm sản phẩm
    return this.productService.findByCategory(categoryId);
  }
}
