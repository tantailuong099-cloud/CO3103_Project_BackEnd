import { HydratedDocument } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { UserBased } from './userbase.schema';

export type AdminDocument = HydratedDocument<Admin>;

@Schema({timestamps: true})
export class Admin extends UserBased {
  @Prop()
  permissions: string[];
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
