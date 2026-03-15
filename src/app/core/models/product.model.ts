// Este archivo define las interfaces para representar la estructura de los datos de productos, tanto para recibir del backend (ProductRs) como para enviar al backend (ProductRq).
export interface ProductRs {
  id: string;
  name: string;
  price: number;
  stock: number;
}
// "ProductRq" es la interfaz para la solicitud que se envía al servidor cuando se crea o actualiza un producto. El campo "id" es opcional porque en la creación no se envía, pero en la actualización sí.
export interface ProductRq {
  // Opcional porque en creación no se envía
  id?: string; 
  name: string;
  price: number;
  stock: number;
}