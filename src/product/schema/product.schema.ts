import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class Product {
  @Prop()
  name: string;

  @Prop()
  avatar: string;

  @Prop()
  releaseDate: Date;

  @Prop()
  category: string;

  @Prop()
  type: string;

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
  minPlayer: number;

  @Prop()
  ageConstraints: number;

  @Prop()
  productImage: string[];

  @Prop({ default: false })
  deleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
