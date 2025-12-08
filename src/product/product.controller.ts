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
import { GameType } from './schema/product.schema';
import { BadRequestException } from '@nestjs/common';
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }
  @Get('type/:type')
  async findByType(@Param('type') typeParam: string): Promise<Product[]> {
    // ép string -> GameType, có check hợp lệ
    const type = typeParam.toLowerCase() as GameType;

    if (!Object.values(GameType).includes(type)) {
      throw new BadRequestException('Invalid product type');
    }

    return this.productService.findByType(type);
  }
  @Get('test')
  testRoute() {
  return 'PRODUCT ROUTER WORKS';
}

  @UseGuards(JwtAuthGuard)
  @Get('trash')
  async findTrash(): Promise<Product[]> {
    return this.productService.findTrash();
  }
  @Get('latest')
  async findLatest(): Promise<Product[]> {
    return this.productService.findLatestByReleaseDate(5);
  }

  @Get(':id')
  async get(@Param('id') id: string): Promise<Product> {
    return this.productService.getProduct(id);
  }
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)

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
  @UseGuards(JwtAuthGuard)
  @Patch('/deleted/:id')
  async softDelete(@Param('id') id: string): Promise<Product> {
    return this.productService.softDelete(id);
  }

  @Delete('/deleted/:id')
  async hardDelete(@Param('id') id: string): Promise<Product> {
    return this.productService.hardDelete(id);
  }
  @UseGuards(JwtAuthGuard)

  @Patch('/restore/:id')
  async restore(@Param('id') id: string): Promise<Product> {
    return this.productService.restore(id);
  }
}
