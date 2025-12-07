import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  UseInterceptors,
  UploadedFiles,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { Product } from './schema/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/jwt/jwt-auth.guard';

@Controller('product')
@UseGuards(JwtAuthGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get('trash')
  async findTrash(): Promise<Product[]> {
    return this.productService.findTrash();
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Product> {
    return this.productService.getProduct(id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'productImage', maxCount: 10 },
    ]),
  )
  async create(
    @Body() createUserDto: CreateProductDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    @Req() req,
  ): Promise<Product> {
    console.log('BODY:', createUserDto);
    console.log('FILES:', files);

    const userId = req.user.userId;

    return this.productService.create(createUserDto, files, userId);
  }

  // @Patch(':id')
  // async update(
  //   @Param('id') id: string,
  //   @Body() updateUserDto: UpdateProductDto,
  // ): Promise<Product> {
  //   return this.productService.update(id, updateUserDto);
  // }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'productImage', maxCount: 10 },
    ]),
  )
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      productImage?: Express.Multer.File[];
    },
    @Req() req,
  ) {
    const userId = req.user.userId; // Lấy userId từ token
    return this.productService.update(id, updateProductDto, files, userId);
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
