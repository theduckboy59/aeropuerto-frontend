import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export interface Empleado {
  id: number;

  userId: number;
  username: string;
  email: string;

  tipoEmpleadoId: number;

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
}

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private api = `${environment.apiUrl}/empleados`;
  private registroApi = `${environment.apiUrl}/register`;

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

  crearEmpleado(data: any) {
    return this.http.post<Empleado>(this.registroApi, data);
  }

  getEmpleado(id: number) {
    return this.http.get<Empleado>(`${this.api}/${id}`);
  }

  actualizarEmpleado(id: number, data: any) {
    return this.http.put<Empleado>(`${this.api}/${id}`, data);
  }

  eliminarEmpleado(id: number) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}