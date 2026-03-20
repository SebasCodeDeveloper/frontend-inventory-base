import { ProductItemRs, OrderDetailRq } from './order-detail.model';

/**
 * Enumerado que define los estados posibles en una orden en el sistema.
 * Ayuda a tener la consistencia visual en las etiquetas (badges) en la UI
 */
export enum OrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
}

/**
 * Interfaz para el reporte detallado de una orden (Respose)
 * Contiene toda la información necesaria para la mostrar el historial  o un recibo al usuario
 */
export interface OrderReportRs {
  orderId: string;
  email: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: ProductItemRs[];
}

/**
 * Interfaz para la creación de una nueva  orden (Request)
 * Estructura minima requerida por el servidor para procesar una compra
 */
export interface OrderRq {
  email: string;
  items: OrderDetailRq[];
}

/**
 * Interfaz para la consulta de órdenes filtradas por correo electronico (Resquest)
 *  Se utiliza en el  buscador de historial de pedidos
 */
export interface GetOrderByEmailRq {
  email: string;
}