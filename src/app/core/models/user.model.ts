// Este archivo define las interfaces para los objetos de usuario que se utilizan en la aplicación.

// "User" es la interfaz para la solicitud que se envía al servidor cuando se crea o actualiza un usuario.
export interface User {
  // "id" es opcional (por eso el signo ?)
  id: string;
  name: string;
  email: string;
  age: number;
}
