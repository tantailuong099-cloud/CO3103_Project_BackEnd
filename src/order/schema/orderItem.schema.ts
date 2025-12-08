import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderItemDocument = HydratedDocument<OrderItem>;

@Schema({ _id: false, timestamps: true})
export class OrderItem {
  @Prop({ type: String, required: true })
  productId: string;

  @Prop({ type: Number, required: true, default: 1 })
  quantity: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
