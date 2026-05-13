import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

export interface ConfigClaseFilasAvion {
  id: number;
  avionId: number;
  claseVueloId: number;
  filaDesde: number;
  filaHasta: number;
  activo: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ConfigClaseFilasAvionCreate = Omit<ConfigClaseFilasAvion, 'id' | 'activo' | 'createdAt' | 'updatedAt'>;
export type ConfigClaseFilasAvionUpdate = Partial<Omit<ConfigClaseFilasAvion, 'id' | 'createdAt' | 'updatedAt'>>;

@Injectable({
  providedIn: 'root'
})
export class ConfigClaseFilasAvionService {
  private api = `${environment.apiUrl}/config-clase-filas-avion`;

  constructor(private http: HttpClient) {}

  listar(params: Record<string, any> = {}) {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<Page<ConfigClaseFilasAvion>>(this.api, { params: httpParams });
  }

  getById(id: number) {
    return this.http.get<ConfigClaseFilasAvion>(`${this.api}/${id}`);
  }

  crear(data: ConfigClaseFilasAvionCreate) {
    return this.http.post<ConfigClaseFilasAvion>(this.api, data);
  }

  actualizar(id: number, data: ConfigClaseFilasAvionUpdate) {
    return this.http.put<ConfigClaseFilasAvion>(`${this.api}/${id}`, data);
  }

  desactivar(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}

