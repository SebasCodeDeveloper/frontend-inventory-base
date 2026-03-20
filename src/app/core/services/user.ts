import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { GetUserByEmailRq, User } from '../models/user.model';

/**
 * Servicio encargado de la gestión de perfiles de usuario.
 * Proporciona métodos para el mantenimiento (CRUD) y consultas específicas por email.
 */
@Injectable({
  providedIn: 'root',
})
export class UserService {
  // URL base para las operaciones CRUD de usuarios
  private readonly API_URL = `${environment.apiUrl}/users`;

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };
  constructor(private http: HttpClient) {}

  /**
   * Recupera la lista completa de usuarios registrados.
   */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtiene la información de un usuario mediante su identificador técnico (UUID).
   * @param id Identificador único del usuario.
   */
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Envía la solicitud para registrar un nuevo usuario en la base de datos.
   * @param body Datos del usuario (nombre, email, edad).
   */
  createUser(body: User): Observable<User> {
    return this.http
      .post<User>(this.API_URL, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

  /**
   * Actualiza los datos de un usuario existente.
   * @param id Identificador del usuario a modificar.
   * @param body Datos actualizados.
   */
  updateUser(id: string, body: User): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }

/**
   * Realiza una búsqueda filtrada por correo electrónico.
   * @param request Objeto que contiene el email del usuario.
   */
  getByEmail(request: GetUserByEmailRq): Observable<User[]> {
    return this.http.post<User[]>(`${this.API_URL}/email`, request)
      .pipe(catchError(this.handleError));
  }

/**
   * Elimina un usuario del sistema tras validar que no tiene dependencias activas.
   * @param id Identificador único del usuario a remover.
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

/**
   * Manejador centralizado de errores HTTP.
   * Si el error contiene un JSON del backend, lo propaga para ser manejado por la UI.
   */
  private handleError(error: HttpErrorResponse) {
    if (error.error && typeof error.error === 'object') {
      return throwError(() => error);
    }

    let msg = 'Ocurrió un error inesperado';
    if (error.error instanceof ErrorEvent) {
      msg = `Error del lado del cliente: ${error.error.message}`;
    } else {
      msg = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }
}