import {
  Body,
  UseGuards,
  Controller,
  Post,
  Req,
  Get,
  Param,
  Delete,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '../auth/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  async checkout(
    @Req() req,
    @Body('shippingAddress') shippingAddress: string,
    @Body('paymentMethod') paymentMethod: string,
  ) {
    const userId = req.user.userId;

    return this.orderService.checkout(userId, shippingAddress, paymentMethod);
  }

  @Post('checkout/partial')
  async checkoutPartial(
    @Req() req,
    @Body('productIds') productIds: string[],
    @Body('shippingAddress') shippingAddress: string,
    @Body('paymentMethod') paymentMethod: string,
  ) {
    const userId = req.user.userId;

    return this.orderService.checkoutPartial(
      userId,
      productIds,
      shippingAddress, // ✅ TRUYỀN XUỐNG
      paymentMethod, // ✅ TRUYỀN XUỐNG
    );
  }

  @Get('my')
  async getMyOrders(@Req() req) {
    const userId = req.user.userId;
    return this.orderService.getUserOrders(userId);
  }

  @Get('count')
  async countOrder() {
    return this.orderService.countOrder();
  }

  @Get('revenue')
  async getRevenue() {
    return this.orderService.totalRevenue();
  }

  @Get()
  async getOrderList() {
    return this.orderService.getOrderDetailList();
  }

  @Delete(':id')
  async deleteOrder(@Param('id') id: string) {
    return await this.orderService.deleteOrder(id);
  }

  @Delete('soft/:id')
  async softDelete(@Param('id') id: string) {
    return this.orderService.softDelete(id);
  }

  @Get('trash')
  async getTrash() {
    return this.orderService.getTrash();
  }
}
