/**
 * Interfaz que representa la respuesta detallada de un producto desde el servidor (Resquest)
 * Se utiliza para visualizar el catalogo de la tabla  y gestionar el stock disponible.
 */
export interface ProductRs {
  id: string;
  name: string;
  price: number;
  stock: number;
  orderDetails: OrderDetails[];
}

/**
 * Representa el desglose técnico de un producto dentro de una orden espesifica
 * Proporciona trazabilidad sobre cantidades  precos históricos
 */
export interface OrderDetails {
  id: string;
  quantity: number;
  subtotal: number;
  unitPrice: number;
  orderStatus: string;
}

/**
 * Estructura para la trasnfencia de datos de producto hacia el servidor (Request
 * Utilizado tanto para el registro inicial como para la actualización de datos existentes.
 */
export interface ProductRq {
  id?: string;
  name: string;
  price: number;
  stock: number;
}

/**
 * Modelo de solicitud especializado para la búsqueda filtrada de productos.
 * Coincide con el objeto 'Record' esperado por el endpoint del Backend.
 */
export interface GetProductByNameRq {
  productName: string;
}