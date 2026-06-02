import { Component, OnInit } from '@angular/core';
import { CatalogoService } from '../../services/catalogo.service';
import { FiltrosVuelosReporte, ReporteService } from '../../services/reporte.service';

type TipoReporte =
  | 'vuelos'
  | 'pasajeros'
  | 'equipaje'
  | 'aviones'
  | 'aerolineas'
  | 'destinos';

@Component({
  selector: 'app-consultas',
  templateUrl: './consultas.component.html',
  styleUrl: './consultas.component.css'
})
export class ConsultasComponent implements OnInit {
  reporteActivo: TipoReporte = 'vuelos';

  aerolineas: any[] = [];
  aeropuertos: any[] = [];

  cargando = false;
  error: string | null = null;
  ok: string | null = null;
  aviso: string | null = null;

  filtrosVuelos: FiltrosVuelosReporte = {
    fechaDesde: '',
    horaDesde: '',
    fechaHasta: '',
    horaHasta: ''
  };

  codigoVueloPasajeros = '';
  codigoVueloEquipaje = '';

  aerolineaIdAviones = '';
  aeropuertoIdAerolineas = '';
  aerolineaIdDestinos = '';

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
    this.cargarCatalogos();
  }

  cargarCatalogos(): void {
    this.catalogo.aerolineas().subscribe({
      next: (res) => this.aerolineas = res ?? [],
      error: () => this.aerolineas = []
    });

    this.catalogo.aeropuertos().subscribe({
      next: (res) => this.aeropuertos = res ?? [],
      error: () => this.aeropuertos = []
    });
  }

  seleccionarReporte(tipo: TipoReporte): void {
    this.reporteActivo = tipo;
    this.error = null;
    this.ok = null;
    this.aviso = null;
  }

  consultarVuelos(): void {
    const msg = this.validarFiltrosVuelos();

    if (msg) {
      this.error = msg;
      return;
    }

    this.run(() => {
      this.reportes.vuelosPorFechaHora(this.filtrosVuelos).subscribe({
        next: (res) => {
          this.resultadoVuelos = res ?? [];
          this.postConsulta(this.resultadoVuelos);
        },
        error: (err) => this.fail(err, 'No se pudo consultar el reporte de vuelos.')
      });
    });
  }

  consultarPasajeros(): void {
    const codigo = this.codigoVueloPasajeros.trim();

    if (!codigo) {
      this.error = 'Ingresa el numero de vuelo.';
      return;
    }

    this.run(() => {
      this.reportes.pasajerosPorVuelo(codigo).subscribe({
        next: (res) => {
          this.resultadoPasajeros = res ?? [];
          this.postConsulta(this.resultadoPasajeros);
        },
        error: (err) => this.fail(err, 'No se pudo consultar pasajeros por vuelo.')
      });
    });
  }

  consultarEquipaje(): void {
    const codigo = this.codigoVueloEquipaje.trim();

    if (!codigo) {
      this.error = 'Ingresa el numero de vuelo.';
      return;
    }

    this.run(() => {
      this.reportes.equipajePorVuelo(codigo).subscribe({
        next: (res) => {
          this.resultadoEquipaje = res ?? [];
          this.postConsulta(this.resultadoEquipaje);
        },
        error: (err) => this.fail(err, 'No se pudo consultar equipaje por vuelo.')
      });
    });
  }

  consultarAviones(): void {
    const id = Number(this.aerolineaIdAviones);

    if (!id) {
      this.error = 'Selecciona una aerolinea.';
      return;
    }

    this.run(() => {
      this.reportes.avionesPorAerolinea(id).subscribe({
        next: (res) => {
          this.resultadoAviones = res ?? [];
          this.postConsulta(this.resultadoAviones);
        },
        error: (err) => this.fail(err, 'No se pudo consultar aviones por aerolinea.')
      });
    });
  }

  consultarAerolineas(): void {
    const id = Number(this.aeropuertoIdAerolineas);

    if (!id) {
      this.error = 'Selecciona un aeropuerto.';
      return;
    }

    this.run(() => {
      this.reportes.aerolineasPorAeropuerto(id).subscribe({
        next: (res) => {
          this.resultadoAerolineas = res ?? [];
          this.postConsulta(this.resultadoAerolineas);
        },
        error: (err) => this.fail(err, 'No se pudo consultar aerolineas por aeropuerto.')
      });
    });
  }

  consultarDestinos(): void {
    const id = Number(this.aerolineaIdDestinos);

    if (!id) {
      this.error = 'Selecciona una aerolinea.';
      return;
    }

    this.run(() => {
      this.reportes.destinosPorAerolinea(id).subscribe({
        next: (res) => {
          this.resultadoDestinos = res ?? [];
          this.postConsulta(this.resultadoDestinos);
        },
        error: (err) => this.fail(err, 'No se pudo consultar destinos por aerolinea.')
      });
    });
  }

  descargarPdf(tipo: TipoReporte): void {
    this.error = null;

    if (tipo === 'vuelos') {
      const msg = this.validarFiltrosVuelos();
      if (msg) {
        this.error = msg;
        return;
      }

      this.reportes.vuelosPdf(this.filtrosVuelos).subscribe({
        next: (blob) => this.saveBlob(blob, 'reporte_vuelos.pdf'),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
      return;
    }

    if (tipo === 'pasajeros') {
      const codigo = this.codigoVueloPasajeros.trim();
      if (!codigo) {
        this.error = 'Ingresa el numero de vuelo.';
        return;
      }

      this.reportes.pasajerosPorVueloPdf(codigo).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_pasajeros_${this.safeName(codigo)}.pdf`),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
      return;
    }

    if (tipo === 'equipaje') {
      const codigo = this.codigoVueloEquipaje.trim();
      if (!codigo) {
        this.error = 'Ingresa el numero de vuelo.';
        return;
      }

      this.reportes.equipajePorVueloPdf(codigo).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_equipaje_${this.safeName(codigo)}.pdf`),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
      return;
    }

    if (tipo === 'aviones') {
      const id = Number(this.aerolineaIdAviones);
      if (!id) {
        this.error = 'Selecciona una aerolinea.';
        return;
      }

      this.reportes.avionesPorAerolineaPdf(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_aviones_aerolinea_${id}.pdf`),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
      return;
    }

    if (tipo === 'aerolineas') {
      const id = Number(this.aeropuertoIdAerolineas);
      if (!id) {
        this.error = 'Selecciona un aeropuerto.';
        return;
      }

      this.reportes.aerolineasPorAeropuertoPdf(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_aerolineas_aeropuerto_${id}.pdf`),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
      return;
    }

    if (tipo === 'destinos') {
      const id = Number(this.aerolineaIdDestinos);
      if (!id) {
        this.error = 'Selecciona una aerolinea.';
        return;
      }

      this.reportes.destinosPorAerolineaPdf(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_destinos_aerolinea_${id}.pdf`),
        error: () => this.error = 'No se pudo descargar el PDF.'
      });
    }
  }

  descargarExcel(tipo: TipoReporte): void {
    this.error = null;

    if (tipo === 'vuelos') {
      const msg = this.validarFiltrosVuelos();
      if (msg) {
        this.error = msg;
        return;
      }

      this.reportes.vuelosExcel(this.filtrosVuelos).subscribe({
        next: (blob) => this.saveBlob(blob, 'reporte_vuelos.xlsx'),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
      return;
    }

    if (tipo === 'pasajeros') {
      const codigo = this.codigoVueloPasajeros.trim();
      if (!codigo) {
        this.error = 'Ingresa el numero de vuelo.';
        return;
      }

      this.reportes.pasajerosPorVueloExcel(codigo).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_pasajeros_${this.safeName(codigo)}.xlsx`),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
      return;
    }

    if (tipo === 'equipaje') {
      const codigo = this.codigoVueloEquipaje.trim();
      if (!codigo) {
        this.error = 'Ingresa el numero de vuelo.';
        return;
      }

      this.reportes.equipajePorVueloExcel(codigo).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_equipaje_${this.safeName(codigo)}.xlsx`),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
      return;
    }

    if (tipo === 'aviones') {
      const id = Number(this.aerolineaIdAviones);
      if (!id) {
        this.error = 'Selecciona una aerolinea.';
        return;
      }

      this.reportes.avionesPorAerolineaExcel(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_aviones_aerolinea_${id}.xlsx`),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
      return;
    }

    if (tipo === 'aerolineas') {
      const id = Number(this.aeropuertoIdAerolineas);
      if (!id) {
        this.error = 'Selecciona un aeropuerto.';
        return;
      }

      this.reportes.aerolineasPorAeropuertoExcel(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_aerolineas_aeropuerto_${id}.xlsx`),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
      return;
    }

    if (tipo === 'destinos') {
      const id = Number(this.aerolineaIdDestinos);
      if (!id) {
        this.error = 'Selecciona una aerolinea.';
        return;
      }

      this.reportes.destinosPorAerolineaExcel(id).subscribe({
        next: (blob) => this.saveBlob(blob, `reporte_destinos_aerolinea_${id}.xlsx`),
        error: () => this.error = 'No se pudo descargar el Excel.'
      });
    }
  }

  limpiar(tipo: TipoReporte): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;

    if (tipo === 'vuelos') {
      this.filtrosVuelos = {
        fechaDesde: '',
        horaDesde: '',
        fechaHasta: '',
        horaHasta: ''
      };
      this.resultadoVuelos = [];
    }

    if (tipo === 'pasajeros') {
      this.codigoVueloPasajeros = '';
      this.resultadoPasajeros = [];
    }

    if (tipo === 'equipaje') {
      this.codigoVueloEquipaje = '';
      this.resultadoEquipaje = [];
    }

    if (tipo === 'aviones') {
      this.aerolineaIdAviones = '';
      this.resultadoAviones = [];
    }

    if (tipo === 'aerolineas') {
      this.aeropuertoIdAerolineas = '';
      this.resultadoAerolineas = [];
    }

    if (tipo === 'destinos') {
      this.aerolineaIdDestinos = '';
      this.resultadoDestinos = [];
    }
  }

  columnas(rows: any[]): string[] {
    if (!rows || !rows.length) {
      return [];
    }

    const set = new Set<string>();

    rows.forEach((row) => {
      Object.keys(row || {}).forEach((key) => set.add(key));
    });

    return Array.from(set);
  }

  getCell(row: any, key: string): any {
    return row ? row[key] : '-';
  }

  humanize(key: string): string {
    return String(key || '')
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/\w\S*/g, (txt) =>
        txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
      );
  }

  private run(fn: () => void): void {
    this.error = null;
    this.ok = null;
    this.aviso = null;
    this.cargando = true;

    fn();
  }

  private postConsulta(rows: any[]): void {
    this.cargando = false;

    if (!rows.length) {
      this.aviso = 'No se encontraron registros para los filtros ingresados.';
      return;
    }

    this.ok = `Consulta realizada. Registros encontrados: ${rows.length}.`;
  }

  private fail(err: any, fallback: string): void {
    this.error = err?.error?.message || err?.error || fallback;
    this.cargando = false;
  }

  private validarFiltrosVuelos(): string {
    const f = this.filtrosVuelos;

    const algunFiltro = !!(
      f.fechaDesde ||
      f.horaDesde ||
      f.fechaHasta ||
      f.horaHasta
    );

    if (!algunFiltro) {
      return '';
    }

    if (!f.fechaDesde || !f.horaDesde || !f.fechaHasta || !f.horaHasta) {
      return 'Si ingresas un rango, debes seleccionar fecha desde, hora desde, fecha hasta y hora hasta.';
    }

    const desde = new Date(`${f.fechaDesde}T${f.horaDesde}`);
    const hasta = new Date(`${f.fechaHasta}T${f.horaHasta}`);

    if (Number.isNaN(desde.getTime()) || Number.isNaN(hasta.getTime())) {
      return 'Rango de fechas invalido.';
    }

    if (hasta <= desde) {
      return 'La fecha y hora hasta debe ser mayor a la fecha y hora desde.';
    }

    const diffMs = hasta.getTime() - desde.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffDays > 30) {
      return 'El rango maximo de consulta es de 30 dias.';
    }

    return '';
  }

  private saveBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    window.URL.revokeObjectURL(url);
  }

  private safeName(value: any): string {
    return String(value || 'reporte')
      .trim()
      .replace(/[^a-zA-Z0-9._-]/g, '_');
  }
}
