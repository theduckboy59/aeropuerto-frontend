import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Empleado {
  id: number;

  userId?: number;
  username?: string;
  email?: string;

  tipoEmpleadoId: number;
  tipoEmpleadoNombre?: string;

  aerolineaId: number;
  aerolineaNombre?: string;

  codigoEmpleado: string;
  nombreCompleto: string;

  fechaIngreso: string;
  fechaSalida?: string | null;

  turnoId: number;
  nivelAccesoId: number;
  rolId: number;
  areaId: number;

  licenciaId?: number | null;
  fechaVencimientoLicencia?: string | null;

  estadoId?: number;
  disponible?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private api = `${environment.apiUrl}/empleados`;
  private registerApi = `${environment.apiUrl}/register`;

  constructor(private http: HttpClient) {}

  getEmpleados(filters: Record<string, any> = {}) {
    let params = new HttpParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    });

    return this.http.get<Empleado[]>(this.api, { params });
  }

  getDisponiblesTripulacion(aerolineaId: number) {
    const params = new HttpParams()
      .set('aerolineaId', aerolineaId);

    return this.http.get<Empleado[]>(
      `${this.api}/disponibles-tripulacion`,
      { params }
    );
  }

  crearEmpleado(data: any) {
    return this.http.post<Empleado>(this.registerApi, data);
  }

  obtenerPorId(id: number) {
    return this.http.get<Empleado>(`${this.api}/${id}`);
  }

  getEmpleado(id: number) {
    return this.obtenerPorId(id);
  }

  actualizarEmpleado(id: number, data: any) {
    return this.http.put<Empleado>(`${this.api}/${id}`, data);
  }

  eliminarEmpleado(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}