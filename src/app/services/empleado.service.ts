import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EmpleadoService {

  private api = 'http://localhost:8080/empleados';

  constructor(private http: HttpClient) {}

  getEmpleados() {
    return this.http.get<any[]>(this.api);
  }

    crearEmpleado(data: any) {
    return this.http.post(this.api, data);
  }

  actualizarEmpleado(id: number, data: any) {
    return this.http.put(`${this.api}/${id}`, data);
  }

  eliminarEmpleado(id: number) {
    return this.http.delete(`${this.api}/${id}`);
  }

}