import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PuertaEmbarque {
  id?: number;
  codigo: string;
  estadoId?: number;
}

export interface Aeropuerto {
  id: number;
  nombre: string;
  codigoIata: string;
  codigoIcao: string;
  pais: string;
  ciudad: string;
  estadoId?: number;
  puertas?: PuertaEmbarque[];
}

@Injectable({
  providedIn: 'root'
})
export class AeropuertosService {
  private api = `${environment.apiUrl}/aeropuertos`;

  constructor(private http: HttpClient) {}

  listar(filtros?: { nombre?: string; pais?: string; estadoId?: string | number }) {
    let params = new HttpParams();
    const nombre = (filtros?.nombre ?? '').toString().trim();
    const pais = (filtros?.pais ?? '').toString().trim();
    const estadoId = (filtros?.estadoId ?? '').toString().trim();

    if (nombre) params = params.set('nombre', nombre);
    if (pais) params = params.set('pais', pais);
    if (estadoId) params = params.set('estadoId', estadoId);

    const options = params.keys().length ? { params } : {};
    return this.http.get<Aeropuerto[]>(this.api, options);
  }

  obtener(id: number) {
    return this.http.get<Aeropuerto>(`${this.api}/${id}`);
  }

  crear(data: {
    nombre: string;
    codigoIata: string;
    codigoIcao: string;
    pais: string;
    ciudad: string;
    puertas: Array<{ codigo: string }>;
  }) {
    return this.http.post(this.api, data);
  }

  editar(
    id: number,
    data: {
      nombre: string;
      codigoIata: string;
      codigoIcao: string;
      pais: string;
      ciudad: string;
      puertas: Array<{ codigo: string }>;
    }
  ) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminar(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }
}

