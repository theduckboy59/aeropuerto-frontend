import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface Vuelo {
  id: number;

  vueloId?: number | null;
  vueloProgramadoId?: number | null;

  aerolineaId: number | null;
  aerolineaNombre?: string | null;

  codigoVuelo: string | null;

  estadoId?: number | null;
  estadoNombre?: string | null;

  aeropuertoSalidaId: number | null;
  aeropuertoSalidaNombre?: string | null;
  aeropuertoSalidaCodigoIata?: string | null;
  aeropuertoSalidaCodigoIcao?: string | null;

  aeropuertoLlegadaId: number | null;
  aeropuertoLlegadaNombre?: string | null;
  aeropuertoLlegadaCodigoIata?: string | null;
  aeropuertoLlegadaCodigoIcao?: string | null;

  fechaSalida: string | null;
  horaSalida: string | null;

  fechaLlegada: string | null;
  horaLlegada: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VueloRequest {
  aerolineaId: number | null;

  aeropuertoSalidaId: number | null;
  aeropuertoLlegadaId: number | null;

  fechaSalida: string | null;
  horaSalida: string | null;

  fechaLlegada: string | null;
  horaLlegada: string | null;
}

export interface VueloFiltros {
  q?: string | null;
  buscarSalida?: string | null;
  buscarLlegada?: string | null;

  aerolineaId?: number | string | null;

  aeropuertoSalidaId?: number | string | null;
  aeropuertoLlegadaId?: number | string | null;

  fechaSalida?: string | null;
  horaSalida?: string | null;

  fechaLlegada?: string | null;
  horaLlegada?: string | null;

  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class VueloService {

  private api = `${environment.apiUrl}/vuelos`;

  constructor(
    private http: HttpClient
  ) {}

  listar(filtros: VueloFiltros = {}) {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<Page<Vuelo>>(this.api, { params });
  }

  obtener(id: number) {
    return this.http.get<Vuelo>(`${this.api}/${id}`);
  }

  obtenerPorCodigo(codigoVuelo: string) {
    return this.http.get<Vuelo>(`${this.api}/codigo/${codigoVuelo}`);
  }

  crear(data: VueloRequest) {
    return this.http.post<Vuelo>(this.api, data);
  }

  editar(id: number, data: VueloRequest) {
    return this.http.put<Vuelo>(`${this.api}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}