import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product, ProductSchema } from './schema/product.schema';
import { CloudinaryModule } from '@/cloudinary/cloudinary.module';
import { UsersModule } from '@/users/users.module';
import { Category, CategorySchema } from '@/categories/schema/categories.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }, { name: Category.name, schema: CategorySchema }]),
    CloudinaryModule,
    UsersModule,
  ],
  providers: [ProductService],
  controllers: [ProductController],
  exports: [ProductService, MongooseModule],
})
export class ProductModule {}
