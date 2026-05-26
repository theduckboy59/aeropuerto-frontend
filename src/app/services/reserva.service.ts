import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservaPasajeroItemRequest {
  pasajeroId: number;
  asientoVueloId?: number | null;
  claseVueloId?: number | null;
  cantidadMaletas?: number | null;
  requiereAsiento?: boolean | null;
  precioBase?: number | null;
}

export interface ReservaRequest {
  userId?: number | null;
  vueloOperadoId: number;
  segmentoOperadoId: number;
  pasajeros: ReservaPasajeroItemRequest[];
}

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private api = `${environment.apiUrl}/reservas`;

  constructor(private http: HttpClient) {}

  crear(request: ReservaRequest): Observable<any> {
    return this.http.post<any>(this.api, request);
  }

  obtenerPorId(id: number): Observable<any> {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  listarPorPasajero(pasajeroId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/pasajero/${pasajeroId}`);
  }

  cancelar(id: number): Observable<any> {
    return this.http.patch<any>(`${this.api}/${id}/cancelar`, null);
  }
}

