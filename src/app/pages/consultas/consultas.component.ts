import { Component, OnInit } from '@angular/core';
import { CatalogoService } from '../../services/catalogo.service';
import { ReporteService } from '../../services/reporte.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit {
  readonly fechaMinima = this.obtenerFechaMinima();

  aerolineas: any[] = [];
  aeropuertos: any[] = [];

  filtrosVuelos = {
    fechaDesde: '',
    horaDesde: '',
    fechaHasta: '',
    horaHasta: ''
  };

  codigoVuelo = '';
  codigoVueloEquipaje = '';

  aerolineaId = '';
  aeropuertoId = '';
  aerolineaIdDestinos = '';

  cargando = false;
  error: string | null = null;

  resultadoVuelos: any[] = [];
  resultadoPasajeros: any[] = [];
  resultadoEquipaje: any[] = [];
  resultadoAviones: any[] = [];
  resultadoAerolineas: any[] = [];
  resultadoDestinos: any[] = [];

  constructor(
    private catalogo: CatalogoService,
    private reportes: ReporteService
  ) {}

  ngOnInit(): void {
    this.catalogo.aerolineas().subscribe({ next: (r) => (this.aerolineas = r ?? []) });
    this.catalogo.aeropuertos().subscribe({ next: (r) => (this.aeropuertos = r ?? []) });
  }

  consultarVuelos() {
    this.run(() =>
      this.reportes.vuelosPorFechaHora(this.filtrosVuelos).subscribe({
        next: (res) => (this.resultadoVuelos = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar el listado de vuelos.')
      })
    );
  }

  consultarPasajeros() {
    const codigo = (this.codigoVuelo || '').trim();
    if (!codigo) {
      this.error = 'Ingresa el número de vuelo para pasajeros por vuelo.';
      return;
    }
    this.run(() =>
      this.reportes.pasajerosPorVuelo(codigo).subscribe({
        next: (res) => (this.resultadoPasajeros = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar pasajeros por vuelo.')
      })
    );
  }

  consultarEquipaje() {
    const codigo = (this.codigoVueloEquipaje || '').trim();
    if (!codigo) {
      this.error = 'Ingresa el número de vuelo para equipaje por vuelo.';
      return;
    }
    this.run(() =>
      this.reportes.equipajePorVuelo(codigo).subscribe({
        next: (res) => (this.resultadoEquipaje = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar equipaje por vuelo.')
      })
    );
  }

  consultarAvionesPorAerolinea() {
    const id = Number(this.aerolineaId);
    if (!id) {
      this.error = 'Selecciona una aerolínea.';
      return;
    }
    this.run(() =>
      this.reportes.avionesPorAerolinea(id).subscribe({
        next: (res) => (this.resultadoAviones = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar aviones por aerolínea.')
      })
    );
  }

  consultarAerolineasPorAeropuerto() {
    const id = Number(this.aeropuertoId);
    if (!id) {
      this.error = 'Selecciona un aeropuerto.';
      return;
    }
    this.run(() =>
      this.reportes.aerolineasPorAeropuerto(id).subscribe({
        next: (res) => (this.resultadoAerolineas = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar aerolíneas por aeropuerto.')
      })
    );
  }

  consultarDestinosPorAerolinea() {
    const id = Number(this.aerolineaIdDestinos);
    if (!id) {
      this.error = 'Selecciona una aerolínea.';
      return;
    }
    this.run(() =>
      this.reportes.destinosPorAerolinea(id).subscribe({
        next: (res) => (this.resultadoDestinos = res ?? []),
        error: (err) => this.setError(err, 'No se pudo consultar destinos autorizados.')
      })
    );
  }

  limpiar() {
    this.error = null;
    this.resultadoVuelos = [];
    this.resultadoPasajeros = [];
    this.resultadoEquipaje = [];
    this.resultadoAviones = [];
    this.resultadoAerolineas = [];
    this.resultadoDestinos = [];
  }

  imprimir() {
    window.print();
  }

  descargarVuelosPdf() {
    const url = `${environment.apiUrl}/reportes/vuelos/pdf${this.qs(this.filtrosVuelos)}`;
    window.open(url, '_blank');
  }

  descargarVuelosExcel() {
    const url = `${environment.apiUrl}/reportes/vuelos/excel${this.qs(this.filtrosVuelos)}`;
    window.open(url, '_blank');
  }

  descargarPasajerosPdf(codigo: string) {
    const c = (codigo || '').trim();
    if (!c) return;
    window.open(`${environment.apiUrl}/reportes/pasajeros-vuelo/${encodeURIComponent(c)}/pdf`, '_blank');
  }

  descargarPasajerosExcel(codigo: string) {
    const c = (codigo || '').trim();
    if (!c) return;
    window.open(`${environment.apiUrl}/reportes/pasajeros-vuelo/${encodeURIComponent(c)}/excel`, '_blank');
  }

  descargarEquipajePdf(codigo: string) {
    const c = (codigo || '').trim();
    if (!c) return;
    window.open(`${environment.apiUrl}/reportes/equipaje-vuelo/${encodeURIComponent(c)}/pdf`, '_blank');
  }

  descargarEquipajeExcel(codigo: string) {
    const c = (codigo || '').trim();
    if (!c) return;
    window.open(`${environment.apiUrl}/reportes/equipaje-vuelo/${encodeURIComponent(c)}/excel`, '_blank');
  }

  descargarAvionesPdf(aerolineaId: string) {
    const id = Number(aerolineaId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/aviones-aerolinea/${id}/pdf`, '_blank');
  }

  descargarAvionesExcel(aerolineaId: string) {
    const id = Number(aerolineaId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/aviones-aerolinea/${id}/excel`, '_blank');
  }

  descargarAerolineasPdf(aeropuertoId: string) {
    const id = Number(aeropuertoId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/aerolineas-aeropuerto/${id}/pdf`, '_blank');
  }

  descargarAerolineasExcel(aeropuertoId: string) {
    const id = Number(aeropuertoId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/aerolineas-aeropuerto/${id}/excel`, '_blank');
  }

  descargarDestinosPdf(aerolineaId: string) {
    const id = Number(aerolineaId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/destinos-aerolinea/${id}/pdf`, '_blank');
  }

  descargarDestinosExcel(aerolineaId: string) {
    const id = Number(aerolineaId);
    if (!id) return;
    window.open(`${environment.apiUrl}/reportes/destinos-aerolinea/${id}/excel`, '_blank');
  }

  exportarTablaCSV(nombre: string, filas: any[]) {
    if (!filas || filas.length === 0) {
      return;
    }
    const keys: string[] = Array.from(
      filas.reduce((set: Set<string>, row: any) => {
        Object.keys(row || {}).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    ) as string[];

    const header = keys.map((k) => this.escape(k)).join(',');
    const lines = filas.map((row) =>
      keys.map((k) => this.escape((row || {})[k])).join(',')
    );

    const csv = [header, ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${nombre}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private run(fn: () => void) {
    this.cargando = true;
    this.error = null;
    try {
      fn();
    } finally {
      // each call will flip cargando off on subscribe
      setTimeout(() => (this.cargando = false), 350);
    }
  }

  private setError(err: any, fallback: string) {
    this.error = err?.error?.message || err?.error || fallback;
  }

  private escape(value: any): string {
    const s = String(value ?? '').replace(/"/g, '""');
    return `"${s}"`;
  }

  getCell(row: any, key: any): any {
    const k = String(key ?? '');
    return row ? row[k] : null;
  }

  private qs(obj: Record<string, any>): string {
    const entries = Object.entries(obj || {}).filter(
      ([, v]) => v !== null && v !== undefined && String(v).trim() !== ''
    );
    if (!entries.length) return '';
    return (
      '?' +
      entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v).trim())}`)
        .join('&')
    );
  }

  private obtenerFechaMinima(): string {
    const hoy = new Date();
    const anio = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');

    return `${anio}-${mes}-${dia}`;
  }
}
