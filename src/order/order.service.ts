import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schema/order.schema';
import { CartService } from '../cart/cart.service';
import { ProductService } from '../product/product.service';
import { GameType } from '@/product/schema/product.schema';
import { UsersService } from '@/users/users.service';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly productService: ProductService,
    private readonly userService: UsersService,
  ) {}

  // ✅ Checkout toàn bộ cart
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

    const newOrder = new this.orderModel({
      cartOwner: userId,
      items: orderItems,
      totalPrice,
      status: 'pending',
      shippingAddress,
      paymentMethod,
    });

    await this.cartService.clearCart(userId);
    return await newOrder.save();
  }

  // ✅ Checkout một phần cart
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

      cart.items = cart.items
        .map((ci) => {
          if (ci.productId.toString() === item.productId.toString()) {
            if (ci.quantity > item.quantity) {
              ci.quantity -= item.quantity;
              return ci;
            }
            return null;
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

  async getUserOrders(userId: string) {
    return this.orderModel.find({ cartOwner: userId }).sort({ _id: -1 });
  }

  async getOrderById(userId: string, orderId: string) {
    return this.orderModel.findOne({ _id: orderId, cartOwner: userId });
  }

  // ✅ GIỮ getOrderDetailList
  async getOrderDetailList() {
    const orderList = await this.orderModel.find({}).lean();

    const mergeResult = await Promise.all(
      orderList.map(async (order) => {
        const { cartOwner, items, ...orderInfo } = order;

        const userRaw = await this.userService.findById(cartOwner);

        const user = userRaw
          ? {
              name: userRaw.name,
              email: userRaw.email,
              phone: userRaw.phoneNumber,
              address: userRaw.address,
            }
          : null;

        const productDetailList = await Promise.all(
          items.map(async (item) => {
            const product = await this.productService.getProductDetailById(
              item.productId,
            );

            return {
              name: product ? product.name : 'Unknown Product',
              avatar: product ? product.avatar : null,
              quantity: item.quantity,
              price: product ? product.price : 0,
            };
          }),
        );

        return {
          ...orderInfo,
          user,
          productDetailList,
        };
      }),
    );

    return mergeResult;
  }

  // ✅ GIỮ deleteOrder
  async deleteOrder(id: string) {
    return this.orderModel.deleteOne({ _id: id }).exec();
  }

  // ✅ GIỮ cancelOrder + restore stock
  async cancelOrder(userId: string, orderId: string) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      cartOwner: userId,
    });

    if (!order) {
      throw new BadRequestException('Order not found');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('Order already cancelled');
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new BadRequestException('Order can no longer be cancelled');
    }

    for (const item of order.items) {
      const product = await this.productService.getProduct(item.productId);

      if (product && product.type === GameType.PHYSICAL) {
        await this.productService.updateStock(
          product._id.toString(),
          product.stock + item.quantity,
        );
      }
    }

    order.status = 'cancelled';
    await order.save();

    return {
      success: true,
      message: 'Order cancelled successfully',
      order,
    };
  }
}
