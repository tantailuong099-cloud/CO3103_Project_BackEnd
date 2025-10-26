export class CreateProductDto {
  name: string;
  avatar: string;
  releaseDate: Date;
  category: string;
  type: string;
  version: string;
  price: number;
  stock: number;
  description: string;
  metacriticScore?: number;
  metacriticURL?: string;
  ignScore?: number;
  ignURL?: string;
  minPlayer: number;
  ageConstraints: number;
  productImage: string[];
}
