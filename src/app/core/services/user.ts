import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { User } from '../models/user.model'; // Usamos tus modelos PRO

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // Centralizamos la URL del recurso
  private readonly API_URL = `${environment.apiUrl}`;
  
  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}

// CRUD Methods
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.API_URL)
      .pipe(catchError(this.handleError));
  }
// Método para obtener un usuario por ID (útil para edición)
  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }
// Método para crear un nuevo usuario
  createUser(body: User): Observable<User> {
    return this.http.post<User>(this.API_URL, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
// Método para actualizar un usuario existente
  updateUser(id: string, body: User): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/${id}`, body, this.httpOptions)
      .pipe(catchError(this.handleError));
  }
// Método para eliminar un usuario
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // Manejo centralizado de errores
private handleError(error: HttpErrorResponse) {

    if (error.error && typeof error.error === 'object') {
      return throwError(() => error); 
    }

    // Si es un error físico de red o cliente (no hay JSON)
    let msg = 'Ocurrió un error inesperado';
    if (error.error instanceof ErrorEvent) {
      msg = `Error del lado del cliente: ${error.error.message}`;
    } else {
      msg = `Código de error: ${error.status}\nMensaje: ${error.message}`;
    }
    return throwError(() => new Error(msg));
  }
}