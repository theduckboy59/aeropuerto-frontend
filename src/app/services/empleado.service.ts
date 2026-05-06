import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private api = `${environment.apiUrl}/empleados`;
  private registroApi = `${environment.apiUrl}/register`;

  constructor(private http: HttpClient) {}

  getEmpleados() {
    return this.http.get<any[]>(this.api);
  }

  crearEmpleado(data: any) {
    return this.http.post(this.registroApi, data);
  }

  actualizarEmpleado(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarEmpleado(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}