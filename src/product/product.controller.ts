import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Product> {
    return this.productService.getProduct(id);
  }

  @Post()
  async create(@Body() createUserDto: CreateProductDto): Promise<Product> {
    return this.productService.create(createUserDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateProductDto,
  ): Promise<Product> {
    return this.productService.update(id, updateUserDto);
  }

  @Patch('/deleted/:id')
  async softDelete(@Param('id') id: string): Promise<Product> {
    return this.productService.softDelete(id);
  }

  @Delete('/deleted/:id')
  async hardDelete(@Param('id') id: string): Promise<Product> {
    return this.productService.hardDelete(id);
  }

  @Patch('/restore/:id')
  async restore(@Param('id') id: string): Promise<Product> {
    return this.productService.restore(id);
  }
}
