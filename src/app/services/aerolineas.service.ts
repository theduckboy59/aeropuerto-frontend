import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Aerolinea {
  id: number;
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  pais: string;
  estadoId?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AerolineasService {
  private api = `${environment.apiUrl}/aerolineas`;

  constructor(private http: HttpClient) {}

  listar(nombre?: string) {
    const value = (nombre || '').trim();
    const params = value ? new HttpParams().set('nombre', value) : undefined;
    return this.http.get<Aerolinea[]>(this.api, { params });
  }

  obtener(id: number) {
    return this.http.get<Aerolinea>(`${this.api}/${id}`);
  }

  crear(data: { nombre: string; codigoIata: string; codigoIcao: string; pais: string }) {
    return this.http.post(this.api, data);
  }

  editar(id: number, data: { nombre: string; codigoIata: string; codigoIcao: string; pais: string }) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}

