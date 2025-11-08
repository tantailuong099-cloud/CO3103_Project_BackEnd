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

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async findAll(): Promise<ProductDocument[]> {
    const filter = {
      deleted: false,
    };

    return this.productModel.find(filter);
  }

  async findByCategory(category: string): Promise<ProductDocument[]> {
    const filter = {
      deleted: false,
      category: category,
    };

    return this.productModel.find(filter);
  }

  async getProduct(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async create(
    product: CreateProductDto,
    files: {
      avatar?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
  ): Promise<ProductDocument> {
    const avatarFile = files?.avatar?.[0];
    const productImageFiles = files?.productImage || [];

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
    });
    return newProduct.save();
  }

  async update(
    id: string,
    product: UpdateProductDto,
  ): Promise<ProductDocument> {
    try {
      const updatedUser = await this.productModel
        .findOneAndUpdate({ _id: id, deleted: false }, product, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User not found or has been deleted`);
      }

      return updatedUser;
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
}
