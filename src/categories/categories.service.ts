import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schema/categories.schema';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto'; // Nhớ tạo file này
import { ProductService } from '../product/product.service';
import { ProductDocument } from '../product/schema/product.schema';
import { UsersService } from '@/users/users.service'; // Import UsersService

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name) private modelCategory: Model<CategoryDocument>,
    private readonly productService: ProductService,
    private readonly userService: UsersService, // 1. Inject UsersService
  ) {}

  // --- HÀM CREATE ĐÃ CẬP NHẬT ---
  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string, // Nhận thêm userId từ Controller
  ): Promise<CategoryDocument> {
    // Lấy thông tin user để biết tên người tạo
    const user = await this.userService.findById(userId);

    const newCategory = new this.modelCategory({
      ...createCategoryDto,
      createdBy: user.name, // Tự động điền
      updatedBy: user.name, // Tự động điền
      createdAt: new Date(), // Thời gian hiện tại
      updatedAt: new Date(), // Thời gian hiện tại
    });

    return newCategory.save();
  }

  // --- HÀM UPDATE MỚI ---
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string, // Nhận thêm userId từ Controller
  ): Promise<CategoryDocument> {
    // Lấy thông tin user đang thực hiện update
    const user = await this.userService.findById(userId);

    const updatedCategory = await this.modelCategory
      .findByIdAndUpdate(
        id,
        {
          ...updateCategoryDto,
          updatedBy: user.name, // Cập nhật người sửa
          updatedAt: new Date(), // Cập nhật thời gian sửa
        },
        { new: true }, // Trả về document sau khi update
      )
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return updatedCategory;
  }

  async getlist(): Promise<CategoryDocument[]> {
    const filter = {};
    return this.modelCategory.find(filter).sort({ createdAt: -1 }).exec(); // Thêm sort để mới nhất lên đầu
  }

  // ... (Hàm getProductbyCategory giữ nguyên)
  async getProductbyCategory(categoryName: string): Promise<ProductDocument[]> {
    const categoryDoc = await this.modelCategory
      .findOne({ name: categoryName })
      .exec();

    if (!categoryDoc) {
      return [];
    }

    const categoryId: string = categoryDoc._id.toString();
    return this.productService.findByCategory(categoryId);
  }

  // Hàm helper để tìm category theo ID (dùng cho edit/delete)
  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.modelCategory.findById(id).exec();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  // Hàm xóa (nếu cần)
  async delete(id: string): Promise<CategoryDocument> {
    const deletedCategory = await this.modelCategory
      .findByIdAndDelete(id)
      .exec();
    if (!deletedCategory) throw new NotFoundException('Category not found');
    return deletedCategory;
  }
}
