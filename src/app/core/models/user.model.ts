/**
 * Interfaz principal para la entidad de Usuario en la aplicación.
 * Se utiliza tanto para representar la respuesta del servidor como para
 * las solicitudes de creación y actualización de perfiles.
 */
export interface User {
  // "id" es opcional (por eso el signo ?)
  id: string;
  name: string;
  email: string;
  age: number;
  orders?: any[];
}

/**
 * Modelo de solicitud especializado para localizar un usuario mediante su correo.
 * Coincide con el objeto 'Record' o DTO que espera el endpoint /email en el Backend.
 */
export interface GetUserByEmailRq {
  email: string;
}