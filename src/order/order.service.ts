import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { GameType } from '@/product/schema/product.schema';
import { CartItem } from '../cart/schema/cartItem.schema';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
  ) {}

  // Checkout toàn bộ cart
  async checkout(
    userId: string,
    shippingAddress?: string,
    paymentMethod?: string,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.getCartByUser(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const item of cart.items) {
      const product = await this.productService.getProduct(item.productId);
      if (!product) throw new BadRequestException('Invalid product in cart');

      // Kiểm tra stock nếu physical
      if (product.type === GameType.PHYSICAL) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }
        await this.productService.updateStock(
          product._id.toString(),
          product.stock - item.quantity,
        );
      }

      totalPrice += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });
    }

    // Tạo order
    const newOrder = new this.orderModel({
      cartOwner: userId,
      items: orderItems,
      totalPrice,
      status: 'pending',
      shippingAddress,
      paymentMethod,
    });

    // Clear cart
    await this.cartService.clearCart(userId);

    return await newOrder.save();
  }

  // Checkout một phần cart
  async checkoutPartial(
    userId: string,
    productIds: string[],
    shippingAddress?: string,
    paymentMethod?: string,
  ): Promise<OrderDocument> {
    const cart = await this.cartService.getCartByUser(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const checkoutItems = cart.items.filter((item) =>
      productIds.includes(item.productId.toString()),
    );

    if (checkoutItems.length === 0) {
      throw new BadRequestException('No valid items selected for checkout');
    }

    const orderItems = [];
    let totalPrice = 0;

    for (const item of checkoutItems) {
      const product = await this.productService.getProduct(item.productId);
      if (!product) throw new BadRequestException('Invalid product in cart');

      if (product.type === GameType.PHYSICAL) {
        if (product.stock < item.quantity) {
          throw new BadRequestException(`Not enough stock for ${product.name}`);
        }
        await this.productService.updateStock(
          product._id.toString(),
          product.stock - item.quantity,
        );
      }

      totalPrice += product.price * item.quantity;

      orderItems.push({
        productId: product._id,
        quantity: item.quantity,
        price: product.price,
      });

      // Giảm quantity trong cart hoặc xóa nếu toàn bộ
      cart.items = cart.items
        .map((ci) => {
          if (ci.productId.toString() === item.productId.toString()) {
            if (ci.quantity > item.quantity) {
              ci.quantity -= item.quantity;
              return ci;
            }
            return null; // xóa item
          }
          return ci;
        })
        .filter(Boolean);
    }

    await cart.save();

    const newOrder = new this.orderModel({
      cartOwner: userId,
      items: orderItems,
      totalPrice,
      status: 'pending',
      shippingAddress,
      paymentMethod,
    });

    return await newOrder.save();
  }
}
