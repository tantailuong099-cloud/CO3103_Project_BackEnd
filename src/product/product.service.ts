import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schema/product.schema';
import { Model } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '@/cloudinary/cloudinary.service';
import { UsersService } from '@/users/users.service';
import { GameType } from './schema/product.schema';
import {
  Category,
  CategoryDocument,
} from '@/categories/schema/categories.schema';
@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>, // ✅ THÊM
    private readonly cloudinaryService: CloudinaryService,
    private readonly userService: UsersService,
  ) {}
  private async attachCategoryName(products: any[]) {
    const categories = await this.categoryModel.find().lean().exec();

    return products.map((p: any) => {
      const category = categories.find((c) => c._id.toString() === p.category);

      return {
        ...p,
        categoryName: category?.name || null,
      };
    });
  }

  async findAll() {
    // 1. Lấy danh sách product
    const products = await this.productModel
      .find({ deleted: false })
      .lean()
      .exec();

    const categories = await this.categoryModel.find().lean().exec();

    return products.map((p: any) => {
      const category = categories.find((c) => c._id.toString() === p.category);

      return {
        ...p,
        categoryName: category?.name || null,
      };
    });
  }

  async getTrash() {
    return this.productModel.find({ deleted: true });
  }

  async findLatestByReleaseDate(limit = 5) {
    const products = await this.productModel
      .find({
        deleted: false,
      })
      .sort({ createdAt: -1 }) // ✅ sort newest first by createdAt
      .limit(limit)
      .lean()
      .exec();

    return this.attachCategoryName(products);
  }


  async findTrash(): Promise<ProductDocument[]> {
    const filter = {
      deleted: true,
    };

    return this.productModel.find(filter);
  }

  async findByCategory(categoryId: string) {
    const products = await this.productModel
      .find({
        deleted: false,
        category: categoryId,
      })
      .lean()
      .exec();

    return this.attachCategoryName(products);
  }

  async getProduct(id: string) {
    const product = await this.productModel.findById(id).lean().exec();

    if (!product) throw new NotFoundException('Product not found');

    let category = null;

    if (product.category) {
      category = await this.categoryModel
        .findById(product.category)
        .lean()
        .exec();
    }

    return {
      ...product,
      categoryName: category?.name || null,
    };
  }

  async create(
    product: CreateProductDto,
    files: {
      avatar?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    userId: string,
  ): Promise<ProductDocument> {
    const avatarFile = files?.avatar?.[0];
    const productImageFiles = files?.productImage || [];

    const user = await this.userService.findById(userId);

    let avatarUrl = null;
    if (avatarFile) {
      const uploadedAvatar =
        await this.cloudinaryService.uploadFile(avatarFile);
      avatarUrl = uploadedAvatar.secure_url;
    }

    const productImageUrls = [];
    for (const img of productImageFiles) {
      const uploadedImg = await this.cloudinaryService.uploadFile(img);
      productImageUrls.push(uploadedImg.secure_url);
    }
    const newProduct = new this.productModel({
      ...product,
      avatar: avatarUrl,
      productImage: productImageUrls,
      createdBy: user.name,
      updatedBy: user.name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return newProduct.save();
  }
  async findByType(type: GameType) {
    if (!Object.values(GameType).includes(type)) {
      throw new BadRequestException('Invalid product type');
    }

    const products = await this.productModel
      .find({
        deleted: false,
        type: type,
      })
      .lean()
      .exec();

    return this.attachCategoryName(products);
  }

  async findByPlat(platform: string) {
    const products = await this.productModel
      .find({
        deleted: false,
        language: { $regex: new RegExp(`^${platform}$`, 'i') },
      })
      .lean()
      .exec();

    return this.attachCategoryName(products);
  }

  async update(
    id: string,
    product: UpdateProductDto,
    files: {
      avatar?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    userId: string,
  ): Promise<ProductDocument> {
    try {
      const user = await this.userService.findById(userId);

      // Tạo object dữ liệu update (clone từ DTO để tránh tham chiếu sai)
      const updateData: any = { ...product };

      // 1. XỬ LÝ AVATAR
      // Nếu có file avatar mới upload lên
      if (files?.avatar?.[0]) {
        const uploadedAvatar = await this.cloudinaryService.uploadFile(
          files.avatar[0],
        );
        updateData.avatar = uploadedAvatar.secure_url;
      }
      // Lưu ý: Nếu không có file mới, updateData.avatar sẽ lấy giá trị string (URL cũ)
      // mà FE gửi trong body (nếu FE có gửi field avatar).

      // 2. XỬ LÝ PRODUCT IMAGE
      // Lấy danh sách ảnh cũ FE muốn giữ lại (nằm trong body)
      let currentImages: string[] = [];
      if (product.productImage) {
        if (Array.isArray(product.productImage)) {
          currentImages = product.productImage;
        } else {
          // Trường hợp chỉ có 1 ảnh, form-data gửi lên là string chứ không phải array
          currentImages = [product.productImage];
        }
      }

      // Upload các file ảnh mới (nếu có)
      const newImageUrls: string[] = [];
      const newImageFiles = files?.productImage || [];

      for (const img of newImageFiles) {
        const uploadedImg = await this.cloudinaryService.uploadFile(img);
        newImageUrls.push(uploadedImg.secure_url);
      }

      // Gộp ảnh cũ + ảnh mới và cập nhật vào biến updateData
      // Chỉ cập nhật nếu có sự thay đổi về ảnh (có ảnh cũ gửi lên hoặc có ảnh mới upload)
      if (currentImages.length > 0 || newImageUrls.length > 0) {
        updateData.productImage = [...currentImages, ...newImageUrls];
      }

      // 3. Cập nhật Meta data
      updateData.updatedBy = user.name;
      updateData.updatedAt = Date.now();

      // 4. Lưu vào Database
      const updatedProduct = await this.productModel
        .findOneAndUpdate(
          { _id: id, deleted: false },
          updateData, // Truyền updateData đã xử lý
          { new: true },
        )
        .exec();

      if (!updatedProduct) {
        throw new NotFoundException(`Product not found or has been deleted`);
      }

      return updatedProduct;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async updateStock(id: string, quantity: number) {
    if (quantity < 0) throw new Error('Stock cannot be negative');
    const product = await this.productModel.findByIdAndUpdate(
      id,
      { stock: quantity },
      { new: true },
    );
    if (!product) throw new Error('Product not found');
    return product;
  }

  async softDelete(id: string): Promise<ProductDocument> {
    try {
      const updatedUser = await this.productModel
        .findOneAndUpdate(
          { _id: id, deleted: false },
          { deleted: true },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`product not found or has been deleted`);
      }

      return updatedUser;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async hardDelete(id: string): Promise<ProductDocument> {
    try {
      const deletedUser = await this.productModel.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        throw new NotFoundException(`product with ID ${id} not found`);
      }

      return deletedUser;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async restore(id: string): Promise<ProductDocument> {
    try {
      const user = await this.productModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException(`product with ID ${id} not found`);
      }

      if (!user.deleted) {
        throw new BadRequestException(`product with ID ${id} is not deleted`);
      }

      user.deleted = false;
      await user.save();

      return user;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async getProductDetailById(id: string) {
    return this.productModel.findById(id);
  }
}
