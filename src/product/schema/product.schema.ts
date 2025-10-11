import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema()
export class Product {
  @Prop()
  name: string;

  @Prop()
  stock: number;

  @Prop()
  description: string;

  @Prop()
  productImage: string[];

  @Prop({ default: false })
  deleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
