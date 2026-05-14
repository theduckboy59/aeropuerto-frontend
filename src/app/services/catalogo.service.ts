import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CatalogoService {

  private aerolineasApi = `${environment.apiUrl}/aerolineas`;
  private aeropuertosApi = `${environment.apiUrl}/aeropuertos`;
  private api = `${environment.apiUrl}/catalogos`;

  constructor(private http: HttpClient) {}

  tipoEmpleado() {
    return this.http.get<any[]>(`${this.api}/tipo-empleado`);
  }

  tiposEmpleado() {
    return this.http.get<any[]>(`${this.api}/tipos-empleado`);
  }

  estadoTripulacion() {
    return this.http.get<any[]>(`${this.api}/estado-tripulacion`);
  }

  status() {
    return this.http.get<any[]>(`${this.api}/status`);
  }

  aerolinea() {
    return this.http.get<any[]>(this.aerolineasApi);
  }

  aerolineas() {
    return this.http.get<any[]>(this.aerolineasApi);
  }

  estadoAvion() {
    return this.http.get<any[]>(`${this.api}/estado-avion`);
  }

  claseVuelo() {
    return this.http.get<any[]>(`${this.api}/clase-vuelo`);
  }

  aeropuerto() {
    return this.http.get<any[]>(this.aeropuertosApi);
  }

  aeropuertos() {
    return this.http.get<any[]>(this.aeropuertosApi);
  }

  avion() {
    return this.http.get<any[]>(`${this.api}/avion`);
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

  tipoAsiento() {
    return this.http.get<any[]>(`${this.api}/tipo-asiento`);
  }
}
