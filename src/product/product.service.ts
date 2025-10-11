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

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async findAll(): Promise<ProductDocument[]> {
    const filter = {
      deleted: false,
    };

    return this.productModel.find(filter);
  }

  async create(product: CreateProductDto): Promise<ProductDocument> {
    const newProduct = new this.productModel(product);
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
