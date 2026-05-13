import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

export interface Avion {
  id: number;
  aerolineaId: number;
  estadoAvionId: number;
  modeloAvionId: number;
  codigoAvion: string;
  numeroSerie?: string;
  anio: number;
  filasConfiguradas: number;
  cantidadVuelos?: number;
  estadoId: number;
  createdAt?: string;
  updatedAt?: string;
}

export type AvionCreate = Omit<Avion, 'id' | 'createdAt' | 'updatedAt'>;
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

    return this.http.get<Page<Avion>>(this.api, { params }).pipe(map((res) => res?.content ?? []));
  }

  getAvion(id: number) {
    return this.http.get<Avion>(`${this.api}/${id}`);
  }

  crearAvion(data: AvionCreate) {
    return this.http.post(this.api, data);
  }

  actualizarAvion(id: number, data: AvionUpdate) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarAvion(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}

