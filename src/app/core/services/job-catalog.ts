import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment.development';
import { JobCatalog } from '../models/order.model'; // Asegúrate de ajustar la ruta de tus modelos

/**
 * Servicio encargado de la gestión del catálogo de tipos de trabajo (mano de obra).
 * Proporciona métodos para alimentar el input inteligente de auto-aprendizaje en la UI.
 */
@Injectable({
  providedIn: 'root',
})
export class JobCatalogService {
  // URL base para las operaciones del catálogo de trabajos
  private readonly API_URL = `${environment.apiUrl}/job-catalog`;

  private httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  constructor(private http: HttpClient) {}

  /**
   * Recupera la lista completa de tipos de trabajo registrados y aprendidos por el sistema.
   * Ideal para alimentar el autocompletado en caliente.
   */
  getCatalog(): Observable<JobCatalog[]> {
    return this.http.get<JobCatalog[]>(this.API_URL)
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