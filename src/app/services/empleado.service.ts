import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

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

    return this.http.get<any[]>(this.api, { params });
  }

  crearEmpleado(data: any) {
    return this.http.post(this.registroApi, data);
  }

  getEmpleado(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  actualizarEmpleado(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarEmpleado(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}