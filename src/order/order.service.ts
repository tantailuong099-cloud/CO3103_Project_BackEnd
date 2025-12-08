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
  async getUserOrders(userId: string) {
    return this.orderModel.find({ cartOwner: userId }).sort({ _id: -1 });
  }

  async getOrderById(userId: string, orderId: string) {
    return this.orderModel.findOne({ _id: orderId, cartOwner: userId });
  }

  async getOrderDetailList() {
    // 1. Lấy danh sách order, dùng lean() để trả về object JS thuần (nhanh hơn)
    const orderList = await this.orderModel.find({}).lean();

    // 2. Dùng Promise.all để xử lý bất đồng bộ cho từng order
    const mergeResult = await Promise.all(
      orderList.map(async (order) => {
        // Kỹ thuật Destructuring: Tách cartOwner và items ra riêng,
        // biến orderInfo sẽ chứa toàn bộ thông tin còn lại (_id, status, totalPrice, dates...)
        const { cartOwner, items, ...orderInfo } = order;

        console.log(cartOwner);

        // --- XỬ LÝ USER ---
        // Thêm await để lấy dữ liệu user thật
        const userRaw = await this.userService.findById(cartOwner);

        console.log(userRaw);

        // Chỉ lấy các trường cần thiết (Tên, email...).
        // Lưu ý: Document User bạn gửi không có phone hay address, nên mình chỉ map name và email.
        // Nếu trong DB có field phone/address, bạn bỏ comment ra nhé.
        const user = userRaw
          ? {
              name: userRaw.name,
              email: userRaw.email,
              phone: userRaw.phoneNumber,
              address: userRaw.address,
            }
          : null;

        // --- XỬ LÝ DANH SÁCH SẢN PHẨM ---
        // items là mảng -> cần map và Promise.all để đợi lấy xong info của từng sản phẩm
        const productDetailList = await Promise.all(
          items.map(async (item) => {
            const product = await this.productService.getProductDetailById(
              item.productId,
            );

            // Trả về object gồm thông tin từ Product và số lượng từ Order Item
            return {
              name: product ? product.name : 'Unknown Product',
              avatar: product ? product.avatar : null, // Lấy ảnh đại diện
              quantity: item.quantity, // Lấy số lượng từ order item
              // Có thể thêm price nếu cần
              price: product ? product.price : 0,
            };
          }),
        );

        // --- TRẢ VỀ KẾT QUẢ CUỐI CÙNG ---
        return {
          ...orderInfo, // Toàn bộ thông tin order (trừ cartOwner, items)
          user, // Thông tin user đã lọc
          productDetailList, // Danh sách chi tiết sản phẩm kèm ảnh, tên
        };
      }),
    );

    return mergeResult;
  }

  async deleteOrder(id: string) {
    return this.orderModel.deleteOne({ _id: id }).exec();
  }
}
