import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserBased } from './userbase.schema';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User extends UserBased {
  @Prop({ default: null })
  cartId: string;
  @Prop({ default: 'active' })
  status: string;
  @Prop()
  address: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
