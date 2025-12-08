import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import mongoose from 'mongoose'; // ✅ BẮT BUỘC
import { Category } from '@/categories/schema/categories.schema'; // ✅ BẮT BUỘC


export type ProductDocument = HydratedDocument<Product>;

export enum GameType {
  DIGITAL = 'digital',
  PHYSICAL = 'physical',
}

@Schema({timestamps: true})
export class Product {
  @Prop()
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  releaseDate: Date;

  @Prop()  // ✅ ÉP LƯU STRING ĐÚNG VỚI DB HIỆN TẠI
  category: string;

  @Prop()
  type: GameType;

  @Prop()
  version: string;

  @Prop()
  price: number;

  @Prop()
  stock: number;

  @Prop()
  description: string;

  @Prop()
  metacriticScore: number;

  @Prop()
  metacriticURL: string;

  @Prop()
  ignScore: number;

  @Prop()
  ignURL: string;

  @Prop()
  playerNumber: number;

  @Prop()
  ageConstraints: number;

  @Prop()
  productImage: string[];

  @Prop()
  videoLink: string;

  @Prop()
  manufactor: string;

  @Prop()
  options: string[];

  @Prop()
  playmode: string;

  @Prop()
  language: string;

  @Prop()
  createdBy: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedBy: string;

  @Prop()
  updatedAt: Date;

  @Prop({ default: false })
  deleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

