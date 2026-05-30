import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ReservaSegmentoAsientoRequest {
  segmentoOperadoId: number;
  asientoVueloId: number;
}

export interface ReservaPasajeroItemRequest {
  pasajeroId?: number | null;

  pasaporte?: string | null;
  nombreCompleto?: string | null;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;
  codigoArea?: string | null;
  telefono?: string | null;
  telefonoEmergencia?: string | null;
  direccion?: string | null;

  asientoVueloId?: number | null;
  claseVueloId?: number | null;
  cantidadMaletas?: number | null;
  requiereAsiento?: boolean | null;
  precioBase?: number | null;

  tipoPasajero?: string | null;
  adultoResponsablePasajeroId?: number | null;

  segmentosAsientos?: ReservaSegmentoAsientoRequest[];
}

export interface ReservaRequest {
  userId?: number | null;
  pasajeroId?: number | null;

  vueloOperadoId: number;

  segmentoOperadoId?: number | null;
  asientoVueloId?: number | null;
  claseVueloId?: number | null;
  cantidadMaletas?: number | null;
  precioBase?: number | null;
  requiereAsiento?: boolean | null;

  segmentosAsientos?: ReservaSegmentoAsientoRequest[];

  pasajeros?: ReservaPasajeroItemRequest[];
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