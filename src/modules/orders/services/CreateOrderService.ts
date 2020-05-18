import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateProductService {
  constructor(
    private ordersRepository: IOrdersRepository,
    private productsRepository: IProductsRepository,
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not found.');
    }

    const findProducts = await this.productsRepository.findAllById(products);
    products.map(product => {
      if (
        !findProducts.some(findedProducts => findedProducts.id === product.id)
      ) {
        throw new AppError(`${product.id} is not present in database.`);
      }
      findProducts.map(findedProducts => {
        if (
          findedProducts.id === product.id &&
          product.quantity > findedProducts.quantity
        ) {
          throw new AppError(`Insuficient quantity for product ${product.id}`);
        }
        return null;
      });
      return null;
    });

    const order = await this.ordersRepository.create({ customer, products });
  }
}

export default CreateProductService;
