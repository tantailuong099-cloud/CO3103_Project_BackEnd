import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Model } from 'mongoose';
import { ProductService } from '../product/product.service';
import { CartItem } from './schema/cartItem.schema';
import { GameType } from '@/product/schema/product.schema';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    private readonly productService: ProductService,
  ) {}

  async create(userId: string): Promise<CartDocument> {
    const existingCart = await this.cartModel
      .findOne({ cartOwner: userId })
      .exec();

    if (existingCart) {
      return existingCart;
    }

    const newCart = new this.cartModel({
      cartOwner: userId,
      items: [],
      subTotalD: 0,
      subTotalP: 0,
      total: 0,
    });

    return newCart.save();
  }

  async addItemToCart(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ cartOwner: userId });

    if (!cart) {
      cart = new this.cartModel({
        cartOwner: userId,
        items: [],
        subTotalD: 0,
        subTotalP: 0,
        total: 0,
      });
    }

    const product = await this.productService.getProduct(productId);
    if (!product) throw new Error('Product not found');

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

    const addedPrice = product.price * quantity;

    if (product.type === GameType.PHYSICAL) {
      cart.subTotalP += addedPrice;
    } else {
      cart.subTotalD += addedPrice;
    }

    cart.total = cart.subTotalD + cart.subTotalP;

    return await cart.save();
  }

  async removeItemFromCart(
    userId: string,
    productId: string,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ cartOwner: userId });
    if (!cart) {
      throw new Error('Cart not found');
    }

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) return cart;

    const product = await this.productService.getProduct(productId);
    const removedPrice = product.price * item.quantity;

    if (product.type === GameType.PHYSICAL) {
      cart.subTotalP -= removedPrice;
    } else {
      cart.subTotalD -= removedPrice;
    }

    cart.items = cart.items.filter((i) => i.productId.toString() !== productId);
    cart.total = cart.subTotalD + cart.subTotalP;
    return await cart.save();
  }

  async getProductDetail(userId: string) {
    const cart = await this.getCartByUser(userId);

    if (!cart.items || cart.items.length === 0) {
      return [];
    }

    const productDetails = await Promise.all(
      cart.items.map(async (item: CartItem) => {
        const product = await this.productService.getProduct(item.productId);
        return {
          ...product.toObject(),
          quantity: item.quantity,
        };
      }),
    );

    return productDetails;
  }

  async getProductDetailPhysical(userId: string) {
    const cart = await this.getCartByUser(userId);

    if (!cart.items || cart.items.length === 0) {
      return [];
    }

    const productDetails = await Promise.all(
      cart.items.map(async (item: CartItem) => {
        const product = await this.productService.getProduct(item.productId);
        if (product?.type !== GameType.PHYSICAL) return null;
        return {
          ...product.toObject(),
          quantity: item.quantity,
        };
      }),
    );

    return productDetails.filter(Boolean);
  }

  async getProductDetailDigital(userId: string) {
    const cart = await this.getCartByUser(userId);

    if (!cart.items || cart.items.length === 0) {
      return [];
    }

    const productDetails = await Promise.all(
      cart.items.map(async (item: CartItem) => {
        const product = await this.productService.getProduct(item.productId);
        if (product?.type !== GameType.DIGITAL) return null;
        return {
          ...product.toObject(),
          quantity: item.quantity,
        };
      }),
    );

    return productDetails.filter(Boolean);
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ cartOwner: userId });
    if (!cart) throw new Error('Cart not found');

    const item = cart.items.find((i) => i.productId.toString() === productId);
    if (!item) throw new Error('Item not found');

    const product = await this.productService.getProduct(productId);

    const oldTotal = product.price * item.quantity;

    item.quantity = quantity;
    const newTotal = product.price * item.quantity;

    if (product.type === GameType.PHYSICAL) {
      cart.subTotalP += newTotal - oldTotal;
    } else {
      cart.subTotalD += newTotal - oldTotal;
    }

    cart.total = cart.subTotalD + cart.subTotalP;
    return await cart.save();
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ cartOwner: userId });
    if (!cart) throw new Error('Cart not found');

    cart.items = [];

    return await cart.save();
  }

  async getCartByUser(userId: string): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ cartOwner: userId }).exec();
    if (!cart) {
      cart = new this.cartModel({
        cartOwner: userId,
        items: [],
      });
      await cart.save();
    }
    return cart;
  }
}
