import { ProductItemRs, OrderDetailRq } from './order-detail.model';

/**
 * Enumerado que define los estados posibles en una orden en el sistema.
 * Ayuda a tener la consistencia visual en las etiquetas (badges) en la UI.
 */
export enum OrderStatus {
  CREATED = 'CREATED',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
}

/**
 * Interfaz que representa un elemento del catálogo de trabajos en el Frontend.
 * Sincronizado con la entidad JobCatalog del Backend para alimentar el input inteligente.
 */
export interface JobCatalog {
  id: string;
  name: string;
  basePrice: number;
}

/**
 * Interfaz para el reporte detallado de una orden (Response).
 * Contiene toda la información necesaria para mostrar el historial o un recibo al usuario,
 * incluyendo el desglose jerárquico de productos y la mano de obra aplicada.
 */
export interface OrderReportRs {
  orderId: string;
  email: string;
  name: string;
  numero: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  items: ProductItemRs[];
  jobs: OrderJobDetailRs[]; 
}

export interface OrderJobDetailRq {
  jobName: string;
  price: number;
}

export interface OrderJobDetailRs {
  jobName: string;
  price: number;
}

/**
 * Interfaz para la creación o actualización de una nueva orden (Request).
 * Estructura requerida por el servidor para procesar de forma masiva productos y servicios.
 */
export interface OrderRq {
  email: string;
  items: OrderDetailRq[];
  jobs: OrderJobDetailRq[]; 
}

/**
 * Interfaz para la consulta de órdenes filtradas por múltiples criterios (Request).
 * Se utiliza en el buscador inteligente del historial de pedidos.
 */
export interface SearchUserOrdersRq {
  email?: string;
  name?: string;
  numero?: string;
}