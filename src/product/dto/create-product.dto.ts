import { GameType } from '../schema/product.schema';

export class CreateProductDto {
  name: string;
  releaseDate: string;
  category: string;
  type: GameType; // FE gửi dạng array, hoặc service convert
  version: string;
  price: number;
  stock: number;
  description: string;
  metacriticScore?: number;
  metacriticURL?: string;
  ignScore?: number;
  ignURL?: string;
  playerNumber?: number;
  ageConstraints?: number;

  // Các trường còn lại giữ nguyên
  videoLink?: string;
  manufactor?: string;
  options?: string;
  playmode?: string;
  language?: string;

  avatar?: string;
  productImage?: string | string[];
}
