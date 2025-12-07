import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserBasedDocument = HydratedDocument<UserBased>;

export enum UserRole {
  ADMIN = 'Admin',
  USER = 'User',
}

@Schema({ discriminatorKey: 'role', timestamps: true })
export class UserBased {
  _id: Types.ObjectId;

  @Prop()
  name: string;

  @Prop()
  email: string;

  @Prop()
  password: string;

  // @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop()
  avatar?: string;

  @Prop()
  phoneNumber: string;

  @Prop({ default: false })
  deleted: boolean;
}

export const UserBasedSchema = SchemaFactory.createForClass(UserBased);
