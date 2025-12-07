import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { UserBased, UserBasedDocument } from './schema/userbase.schema';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-users.dto';
import { UpdateUserDto } from './dto/update-users.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(UserBased.name) private userModel: Model<UserBasedDocument>,
  ) {}

  async findAll(): Promise<UserBasedDocument[]> {
    const filter = {
      deleted: false,
    };

    return this.userModel.find(filter);
  }

  async findUser(): Promise<UserBasedDocument[]> {
    const filter = {
      deleted: false,
      role: 'User',
    };

    return this.userModel.find(filter);
  }

  async findAdmin(): Promise<UserBasedDocument[]> {
    const filter = {
      deleted: false,
      role: 'Admin',
    };

    return this.userModel.find(filter);
  }

  async findById(userId: string) {
    return this.userModel.findById(userId);
  }

  async create(user: CreateUserDto): Promise<UserBasedDocument> {
    const { role } = user;

    if (!['User', 'Admin'].includes(role)) {
      throw new BadRequestException('Invalid Role');
    }

    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async update(id: string, user: UpdateUserDto): Promise<UserBasedDocument> {
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate({ _id: id, deleted: false }, user, { new: true })
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User not found or has been deleted`);
      }

      return updatedUser;
    } catch (err) {
      throw new InternalServerErrorException(err);
    }
  }

  async softDelete(id: string): Promise<UserBasedDocument> {
    try {
      const updatedUser = await this.userModel
        .findOneAndUpdate(
          { _id: id, deleted: false },
          { deleted: true },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User not found or has been deleted`);
      }

      return updatedUser;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async hardDelete(id: string): Promise<UserBasedDocument> {
    try {
      const deletedUser = await this.userModel.findByIdAndDelete(id).exec();

      if (!deletedUser) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return deletedUser;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async restore(id: string): Promise<UserBasedDocument> {
    try {
      const user = await this.userModel.findById(id).exec();

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      if (!user.deleted) {
        throw new BadRequestException(`User with ID ${id} is not deleted`);
      }

      user.deleted = false;
      await user.save();

      return user;
    } catch (err) {
      throw new InternalServerErrorException(err.message);
    }
  }

  async findByEmail(email: string): Promise<UserBased | null> {
    const user = await this.userModel.findOne({ email: email }).exec();
    return user;
  }
}
