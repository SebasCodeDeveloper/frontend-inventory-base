import { ProductItemRs, OrderDetailRq} from './order-detail.model';

// Modelo para representar el estado de una orden
export enum OrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS'
}

// Modelo para representar una orden
export interface OrderReportRs {
  orderId: string;
  email: string;
  status: OrderStatus;
  total: number;
  createdAt: string; 
  items: ProductItemRs[]; 
}

// Modelo para representar una orden
export interface OrderRq {
  email: string;
  items: OrderDetailRq[];
}

// Modelo para representar una orden
export interface GetOrderByEmailRq {
  email: string;
}