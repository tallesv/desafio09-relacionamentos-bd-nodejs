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
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
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
        !findProducts.some(findedProduct => findedProduct.id === product.id)
      ) {
        throw new AppError('Product is not in database.', 400);
      }
      return null;
    });

    const productsToOrder = findProducts.map(findedProduct => {
      const productToOrder = products.find(productFind => {
        if (
          productFind.id === findedProduct.id &&
          productFind.quantity > findedProduct.quantity
        ) {
          throw new AppError(
            `insuficient quantity of ${productFind.id} product.`,
          );
        }
        return productFind.id === findedProduct.id;
      });

      return {
        product_id: findedProduct.id,
        price: findedProduct.price,
        quantity: productToOrder?.quantity || 0,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: productsToOrder,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateProductService;
