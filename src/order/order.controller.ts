import { Body, Controller, Post, Req } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(@Req() req) {
    const userId = req.user.userId;
    return this.orderService.checkout(userId);
  }

  @Post('checkout/partial')
  async checkoutPartial(@Req() req, @Body('productIds') productIds: string[]) {
    const userId = req.user.userId;
    return this.orderService.checkoutPartial(userId, productIds);
  }
}
