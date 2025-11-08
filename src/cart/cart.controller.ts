import {
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { Cart } from './schema/cart.schema';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCart(@Req() req): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.getCartByUser(userId);
  }

  @Get('detail')
  async getproductDetail(@Req() req) {
    const userId = req.user.userId;
    return this.cartService.getProductDetail(userId);
  }

  @Get('detail/physical')
  async getproductDetailPhysical(@Req() req) {
    const userId = req.user.userId;
    return this.cartService.getProductDetailPhysical(userId);
  }

  @Get('detail/digital')
  async getproductDetailDigital(@Req() req) {
    const userId = req.user.userId;
    return this.cartService.getProductDetailDigital(userId);
  }

  @Post()
  async createCart(@Req() req): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.create(userId);
  }

  @Post('add')
  async addItem(
    @Req() req,
    @Body('productId') productId: string,
    @Body('quantity') quantity: number,
  ): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.addItemToCart(userId, productId, quantity);
  }

  @Patch('update/:productId')
  async updateQuantity(
    @Req() req,
    @Param('productId') productId: string,
    @Body('quantity') quantity: number,
  ): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.updateItemQuantity(userId, productId, quantity);
  }

  @Delete('remove/:productId')
  async removeItem(
    @Req() req,
    @Param('productId') productId: string,
  ): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.removeItemFromCart(userId, productId);
  }

  @Delete('clear')
  async clearCart(@Req() req): Promise<Cart> {
    const userId = req.user.userId;
    return this.cartService.clearCart(userId);
  }
}
