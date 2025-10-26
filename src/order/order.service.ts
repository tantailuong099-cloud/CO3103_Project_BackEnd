import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { Model } from 'mongoose';
import { Cart, CartDocument } from '../cart/schema/cart.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

  // async createOrder(userId: string): Promise<OrderDocument> {
  //   const cart = await this.cartService.getCartByUser(userId);
  //   if (!cart || cart.items.length === 0) {
  //     throw new NotFoundException('Cart is empty');
  //   }
  // }
}
