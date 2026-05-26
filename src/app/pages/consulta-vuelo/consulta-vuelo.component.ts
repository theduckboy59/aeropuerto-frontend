import { Component } from '@angular/core';
import { ReporteService } from '../../services/reporte.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-consulta-vuelo',
  templateUrl: './consulta-vuelo.component.html',
  styleUrl: './consulta-vuelo.component.css'
})
export class ConsultaVueloComponent {
  codigoVuelo = '';
  cargando = false;
  error: string | null = null;
  resultado: any | null = null;

  constructor(private reporteService: ReporteService) {}

  buscar() {
    const codigo = (this.codigoVuelo || '').trim();
    if (!codigo) {
      this.error = 'Ingresa el número de vuelo.';
      this.resultado = null;
      return;
    }

    this.cargando = true;
    this.error = null;
    this.resultado = null;

    this.reporteService.consultaVueloPublica(codigo).subscribe({
      next: (res) => {
        this.resultado = res;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || err?.error || 'No se pudo consultar el vuelo.';
        this.cargando = false;
      }
    });
  }

  limpiar() {
    this.codigoVuelo = '';
    this.error = null;
    this.resultado = null;
  }

  imprimir() {
    window.print();
  }

  descargarPdf() {
    const codigo = (this.codigoVuelo || '').trim();
    if (!codigo) {
      this.error = 'Ingresa el número de vuelo.';
      return;
    }
    const url = `${environment.apiUrl}/reportes/consulta-vuelo/${encodeURIComponent(codigo)}/pdf`;
    window.open(url, '_blank');
  }

  exportarCSV() {
    if (!this.resultado) {
      return;
    }

    const rows: Array<[string, any]> = Object.entries(this.resultado);
    const csv = ['campo,valor']
      .concat(
        rows.map(([k, v]) => `${this.escape(k)},${this.escape(v)}`)
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `consulta_vuelo_${(this.codigoVuelo || 'vuelo').trim()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private escape(value: any): string {
    const s = String(value ?? '').replace(/"/g, '""');
    return `"${s}"`;
  }
}
