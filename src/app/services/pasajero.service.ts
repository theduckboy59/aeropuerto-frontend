import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface PasajeroRequest {
  username?: string | null;
  email?: string | null;
  password?: string | null;

  pasaporte: string;
  nombreCompleto: string;
  fechaNacimiento?: string | null;
  nacionalidad?: string | null;
  codigoArea?: string | null;
  telefono?: string | null;
  telefonoEmergencia?: string | null;
  direccion?: string | null;
  estadoId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PasajeroService {
  private readonly api = `${environment.apiUrl}/pasajeros`;

  constructor(
    private http: HttpClient
  ) {}

  listar(filtros?: any) {
    let params = new HttpParams();

    if (filtros?.nombre?.trim()) {
      params = params.set('nombre', filtros.nombre.trim());
    }

    if (filtros?.pasaporte?.trim()) {
      params = params.set('pasaporte', filtros.pasaporte.trim());
    }

    if (filtros?.estadoId) {
      params = params.set('estadoId', String(filtros.estadoId));
    }

    return this.http.get<any[]>(this.api, { params });
  }

  obtener(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  obtenerPorId(id: number) {
    return this.obtener(id);
  }

  obtenerActual() {
    return this.http.get<any>(`${this.api}/me`);
  }

  crear(payload: PasajeroRequest) {
    return this.http.post<any>(this.api, payload);
  }

  editar(id: number, payload: PasajeroRequest) {
    return this.http.put<any>(`${this.api}/${id}`, payload);
  }

  actualizar(id: number, payload: PasajeroRequest) {
    return this.editar(id, payload);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}
