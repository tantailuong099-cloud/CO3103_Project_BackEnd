import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cart, CartDocument } from './schema/cart.schema';
import { Model } from 'mongoose';

@Injectable()
export class CartService {
  constructor(@InjectModel(Cart.name) private cartModel: Model<CartDocument>) {}

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
        items: []
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity });
    }

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

    cart.items = cart.items.filter((item) => item.productId.toString().trim() !== productId.toString().trim());
    return await cart.save();
  }

  async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOne({ cartOwner: userId });
    if (!cart) throw new Error('Cart not found');

    const item = cart.items.find(i => i.productId.toString().trim() === productId.toString().trim());
    if (!item) throw new Error('Item not found in cart');

    item.quantity = quantity;

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
