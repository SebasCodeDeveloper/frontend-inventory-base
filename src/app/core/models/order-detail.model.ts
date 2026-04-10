/**
 * Interfaz que representa  la respuesta de un item dentro de una orden
 * Se utiliza principal mente para mostrar el de producto en la  tabala  de detalles
 */
export interface ProductItemRs {
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
}

/**
 * Interfaz que representa la solcitud (Resquest) para agregar un producto a una orden.
 * Se utiliza al enviar datos desde el formulario de creación de pedidos hacia el backend
 */
export interface OrderDetailRq {
  productName: string;
  quantity: number;
}
