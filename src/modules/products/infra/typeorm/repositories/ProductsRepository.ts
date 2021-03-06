import { getRepository, Repository } from 'typeorm';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = await this.ormRepository.save({ name, price, quantity });

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const product = await this.ormRepository.findOne({
      where: { name },
    });

    return product;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = await this.ormRepository.findByIds(
      products.map(product => product.id),
    );

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const productsToUpdate = await this.ormRepository.findByIds(
      products.map(product => product.id),
    );

    const updateProducts = productsToUpdate.map(productToUpdate => {
      const updateProduct = products.find(
        product => productToUpdate.id === product.id,
      );

      return {
        id: productToUpdate.id,
        price: productToUpdate.price,
        quantity: productToUpdate.quantity - (updateProduct?.quantity || 0),
      };
    });

    const productsUpdated = await this.ormRepository.save(updateProducts);

    return productsUpdated;
  }
}

export default ProductsRepository;
