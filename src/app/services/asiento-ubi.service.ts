import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { Page } from './shared/page';

@Injectable({
  providedIn: 'root'
})
export class AsientoUbiService {
  private api = `${environment.apiUrl}/asiento-ubi`;

  constructor(private http: HttpClient) {}

  listar(params: Record<string, any> = {}) {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    });
    return this.http.get<Page<any>>(this.api, { params: httpParams });
  }

  getById(id: number) {
    return this.http.get<any>(`${this.api}/${id}`);
  }

  generar(avionId: number, regenerar: boolean = false) {
    const url = `${this.api}/generar/${avionId}`;
    let httpParams: HttpParams | undefined;
    if (regenerar) {
      httpParams = new HttpParams().set('regenerar', 'true');
    }
    return this.http.post(url, null as any, httpParams ? { params: httpParams } : {});
  }

  limpiarAvion(avionId: number) {
    return this.http.delete(`${this.api}/avion/${avionId}`);
  }
}
