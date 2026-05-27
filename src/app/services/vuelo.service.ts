import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
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

  puertaEmbarqueSalida?: string | null;
  puertaEmbarqueLlegada?: string | null;

  fechaSalida: string | null;
  horaSalida: string | null;

  fechaLlegada: string | null;
  horaLlegada: string | null;

  precioEconomica?: number | null;
  precioEjecutiva?: number | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface VueloRequest {
  aerolineaId: number | null;

  aeropuertoSalidaId: number | null;
  aeropuertoLlegadaId: number | null;

  puertaEmbarqueSalida: string | null;
  puertaEmbarqueLlegada: string | null;

  fechaSalida: string | null;
  horaSalida: string | null;

  fechaLlegada: string | null;
  horaLlegada: string | null;

  precioEconomica: number | null;
  precioEjecutiva: number | null;
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

  constructor(private http: HttpClient) {}

  listar(filtros: VueloFiltros = {}): Observable<Page<Vuelo>> {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim() !== '') {
        params = params.set(key, String(value).trim());
      }
    });

    return this.http.get<Page<Vuelo>>(this.api, { params });
  }

  obtener(id: number): Observable<Vuelo> {
    return this.http.get<Vuelo>(`${this.api}/${id}`);
  }

  obtenerPorCodigo(codigo: string): Observable<Vuelo> {
    return this.http.get<Vuelo>(
      `${this.api}/codigo/${encodeURIComponent(codigo)}`
    );
  }

  crear(request: VueloRequest): Observable<Vuelo> {
    return this.http.post<Vuelo>(this.api, this.normalizarPayload(request));
  }

  actualizar(id: number, request: VueloRequest): Observable<Vuelo> {
    return this.http.put<Vuelo>(
      `${this.api}/${id}`,
      this.normalizarPayload(request)
    );
  }

  editar(id: number, request: VueloRequest): Observable<Vuelo> {
    return this.actualizar(id, request);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.api}/${id}`);
  }

  private normalizarPayload(request: VueloRequest): VueloRequest {
    return {
      aerolineaId: this.normalizarNumero(request.aerolineaId),
      aeropuertoSalidaId: this.normalizarNumero(request.aeropuertoSalidaId),
      aeropuertoLlegadaId: this.normalizarNumero(request.aeropuertoLlegadaId),
      puertaEmbarqueSalida: this.cleanText(request.puertaEmbarqueSalida),
      puertaEmbarqueLlegada: this.cleanText(request.puertaEmbarqueLlegada),
      fechaSalida: request.fechaSalida,
      horaSalida: this.normalizarHora(request.horaSalida),
      fechaLlegada: request.fechaLlegada,
      horaLlegada: this.normalizarHora(request.horaLlegada),
      precioEconomica: this.normalizarNumero(request.precioEconomica),
      precioEjecutiva: this.normalizarNumero(request.precioEjecutiva)
    };
  }

  private cleanText(value: string | null | undefined): string | null {
    const limpio = (value ?? '').toString().trim().toUpperCase();

    return limpio || null;
  }

  private normalizarHora(value: string | null | undefined): string | null {
    const hora = (value ?? '').toString().trim();

    if (!hora) {
      return null;
    }

    if (hora.length === 5) {
      return `${hora}:00`;
    }

    return hora;
  }

  private normalizarNumero(value: number | string | null | undefined): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const n = Number(value);

    return Number.isNaN(n) ? null : n;
  }
}