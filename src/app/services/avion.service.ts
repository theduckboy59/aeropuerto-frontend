import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

export interface Avion {
  id: number;

  aerolineaId: number;
  aerolineaNombre?: string;

  estadoAvionId: number;
  estadoAvionNombre?: string;

  modeloAvionId: number;
  modeloFabricante?: string;
  modeloCodigo?: string;
  modeloNombre?: string;

  codigoAvion: string;
  numeroSerie?: string | null;
  anio: number;

  filasConfiguradas: number;
  cantidadAsientos?: number;
  cantidadVuelos?: number;

  estadoId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvionCreate {
  aerolineaId: number;
  estadoAvionId: number;
  modeloAvionId: number;
  numeroSerie?: string | null;
  anio: number;
  filasConfiguradas: number;
}

export type AvionUpdate = Partial<AvionCreate>;

@Injectable({
  providedIn: 'root'
})
export class AvionService {
  private api = `${environment.apiUrl}/avion`;

  constructor(private http: HttpClient) {}

  getAviones(filters: Record<string, any> = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return this.http
      .get<Page<Avion>>(this.api, { params })
      .pipe(map((res) => res?.content ?? []));
  }

  getAvion(id: number) {
    return this.http.get<Avion>(`${this.api}/${id}`);
  }

  crearAvion(data: AvionCreate) {
    return this.http.post<Avion>(this.api, data);
  }

  actualizarAvion(id: number, data: AvionUpdate) {
    return this.http.put<Avion>(`${this.api}/${id}`, data);
  }

  cambiarEstado(id: number, estadoId: number) {
    const params = new HttpParams().set('estadoId', String(estadoId));

    return this.http.patch<void>(
      `${this.api}/${id}/estado`,
      null,
      { params }
    );
  }
}