import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private api = `${environment.apiUrl}/catalogos`;

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

  tipoDocumento() {
    return this.http.get<any[]>(`${this.api}/tipo-documento`);
  }

  nacionalidad() {
    return this.http.get<any[]>(`${this.api}/nacionalidad`);
  }

  codigoArea() {
    return this.http.get<any[]>(`${this.api}/codigo-area`);
  }
}