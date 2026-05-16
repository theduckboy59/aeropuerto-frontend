import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

export interface AsientoUbi {
  id: number;

  avionId: number | null;

  claseVueloId: number | null;
  claseVueloNombre: string | null;
  vendible: boolean | null;

  tipoAsientoId: number | null;
  tipoAsientoNombre: string | null;

  nivel: number | null;
  fila: number | null;
  columna: string | null;
  numeroAsiento: string | null;

  bloque: number | null;
  lado: string | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface AsientoUbiFiltros {
  avionId?: number | string | null;
  claseVueloId?: number | string | null;
  tipoAsientoId?: number | string | null;
  vendible?: boolean | string | null;
  nivel?: number | string | null;
  fila?: number | string | null;
  columna?: string | null;
  numeroAsiento?: string | null;
  page?: number;
  size?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AsientoUbiService {
  private api = `${environment.apiUrl}/asiento-ubi`;

  constructor(private http: HttpClient) {}

  /*
   * asiento_ubi solo se consulta.
   *
   * No se usa:
   * - buscar por ID
   * - generar
   * - regenerar
   * - limpiar
   *
   * La generación y sincronización la hace el backend automáticamente.
   */
  listar(filtros: AsientoUbiFiltros = {}) {
    let params = new HttpParams();

    Object.entries(filtros).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http.get<Page<AsientoUbi>>(this.api, { params });
  }
}