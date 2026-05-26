import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AbordajeBuscarParams {
  vueloOperadoId: number;
  pasaporte: string;
}

export interface AbordajeRequest {
  vueloOperadoId: number;
  pasaporte: string;
  cantidadMaletasPresentadas: number;
}

@Injectable({
  providedIn: 'root'
})
export class AbordajeService {
  private api = `${environment.apiUrl}/abordaje`;

  constructor(private http: HttpClient) {}

  buscar(paramsIn: AbordajeBuscarParams): Observable<any> {
    const params = new HttpParams()
      .set('vueloOperadoId', String(paramsIn.vueloOperadoId))
      .set('pasaporte', String(paramsIn.pasaporte).trim());
    return this.http.get<any>(`${this.api}/buscar`, { params });
  }

  registrar(request: AbordajeRequest): Observable<any> {
    return this.http.patch<any>(`${this.api}/registrar`, request);
  }

  finalizar(vueloOperadoId: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/vuelo/${vueloOperadoId}/finalizar`, null);
  }
}

