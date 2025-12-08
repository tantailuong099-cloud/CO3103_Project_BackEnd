import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { OrderItem, OrderItemSchema } from './orderItem.schema';

export type OrderDocument = HydratedDocument<Order>;

@Schema({timestamps: true})
export class Order {
  @Prop({ required: true })
  cartOwner: string;

  @Prop({ type: [OrderItemSchema], default: [] })
  items: OrderItem[];

  @Prop({
    enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
  })
  status: string;

  @Prop()
  totalPrice: number;

  @Prop()
  shippingAddress?: string;

  @Prop()
  paymentMethod?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
