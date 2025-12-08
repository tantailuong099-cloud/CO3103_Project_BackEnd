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

  async getlist(query: {
    keyword?: string;
    creator?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<CategoryDocument[]> {
    const { keyword, creator, startDate, endDate } = query;

    // 1. Khởi tạo filter rỗng
    const filter: any = {};

    // 2. Xử lý tìm kiếm theo từ khóa (Keyword)
    // Tìm kiếm tương đối (LIKE) trong trường 'name' hoặc 'description'
    if (keyword) {
      // $regex: tìm kiếm chuỗi con
      // $options: 'i' để không phân biệt hoa thường
      filter.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { description: { $regex: keyword, $options: 'i' } },
      ];
    }

    // 3. Xử lý filter theo người tạo (Creator)
    if (creator) {
      // Nếu muốn tìm chính xác value (vì đây là select box)
      filter.createdBy = creator;

      // Hoặc nếu muốn tìm tương đối:
      // filter.createdBy = { $regex: creator, $options: 'i' };
    }

    // 4. Xử lý lọc theo khoảng thời gian (Date Range)
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        // $gte: Greater Than or Equal (>=)
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        // $lte: Less Than or Equal (<=)
        // Lưu ý: endDate gửi lên thường là 00:00:00 của ngày đó.
        // Cần chỉnh thành 23:59:59 của ngày đó để lấy trọn vẹn ngày.
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }

    // 5. Thực thi câu lệnh tìm kiếm
    return this.modelCategory
      .find(filter)
      .sort({ createdAt: -1 }) // Mới nhất lên đầu
      .exec();
  }

  // ... (Hàm getProductbyCategory giữ nguyên)
  async getProductbyCategory(id: string): Promise<ProductDocument[]> {
    const categoryDoc = await this.modelCategory.findById(id).exec();

    if (!categoryDoc) {
      return [];
    }

    return this.productService.findByCategory(id);
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
