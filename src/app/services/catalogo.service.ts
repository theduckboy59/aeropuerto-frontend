import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private api = 'http://localhost:8080/catalogos';

  constructor(private http: HttpClient) {}

  tipoEmpleado() {
    return this.http.get<any[]>(`${this.api}/tipo-empleado`);
  }

  aerolinea() {
    return this.http.get<any[]>(`${this.api}/aerolinea`);
  }

  turno() {
    return this.http.get<any[]>(`${this.api}/turno`);
  }

  nivelAcceso() {
    return this.http.get<any[]>(`${this.api}/nivel-acceso`);
  }

  rol() {
    return this.http.get<any[]>(`${this.api}/rol`);
  }

  area() {
    return this.http.get<any[]>(`${this.api}/area`);
  }

  licencia() {
    return this.http.get<any[]>(`${this.api}/licencia`);
  }
}