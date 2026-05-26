import { Component, OnInit } from '@angular/core';
import { AbordajeService } from '../../services/abordaje.service';
import { VueloOperado, VueloOperadoService } from '../../services/vuelo-operado.service';

@Component({
  selector: 'app-abordaje-vuelos',
  templateUrl: './abordaje-vuelos.component.html',
  styleUrl: './abordaje-vuelos.component.css'
})
export class AbordajeVuelosComponent implements OnInit {
  cargando = false;
  error: string | null = null;
  ok: string | null = null;

  estados: any[] = [];
  estadoVueloId = '2'; // ABORDANDO por defecto

  vuelos: VueloOperado[] = [];
  vueloSeleccionado: VueloOperado | null = null;

  pasaporte = '';
  maletasPresentadas = 0;

  consulta: any | null = null;

  constructor(
    private vuelosOperados: VueloOperadoService,
    private abordaje: AbordajeService
  ) {}

  ngOnInit(): void {
    this.vuelosOperados.listarEstadosVuelo().subscribe({
      next: (r) => (this.estados = r ?? [])
    });
    this.listar();
  }

  listar() {
    this.cargando = true;
    this.error = null;
    this.ok = null;
    this.vueloSeleccionado = null;
    this.consulta = null;

    const estadoId = Number(this.estadoVueloId);
    const filtros: any = { page: 0, size: 50 };
    if (estadoId) {
      filtros.estadoVueloId = estadoId;
    }

    this.vuelosOperados.listar(filtros).subscribe({
      next: (page) => {
        this.vuelos = page?.content ?? [];
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudieron cargar vuelos para abordaje.';
        this.cargando = false;
      }
    });
  }

  seleccionar(v: VueloOperado) {
    this.vueloSeleccionado = v;
    this.consulta = null;
    this.ok = null;
    this.error = null;
  }

  buscarPasajero() {
    this.error = null;
    this.ok = null;
    this.consulta = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.id);
    const pasaporte = (this.pasaporte || '').trim();
    if (!vueloOperadoId) {
      this.error = 'Selecciona un vuelo operado.';
      return;
    }
    if (!pasaporte) {
      this.error = 'Ingresa el pasaporte.';
      return;
    }

    this.cargando = true;
    this.abordaje.buscar({ vueloOperadoId, pasaporte }).subscribe({
      next: (res) => {
        this.consulta = res;
        this.cargando = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo encontrar el pasajero para este vuelo.';
        this.cargando = false;
      }
    });
  }

  registrarAbordaje() {
    this.error = null;
    this.ok = null;

    const vueloOperadoId = Number(this.vueloSeleccionado?.id);
    const pasaporte = (this.pasaporte || '').trim();
    if (!vueloOperadoId || !pasaporte) {
      this.error = 'Selecciona un vuelo e ingresa pasaporte.';
      return;
    }

    this.cargando = true;
    this.abordaje
      .registrar({
        vueloOperadoId,
        pasaporte,
        cantidadMaletasPresentadas: Number(this.maletasPresentadas ?? 0)
      })
      .subscribe({
        next: (res) => {
          this.consulta = res;
          this.ok = 'Abordaje registrado.';
          this.cargando = false;
        },
        error: (err) => {
          this.error = err?.error?.message || 'No se pudo registrar el abordaje.';
          this.cargando = false;
        }
      });
  }

  finalizar() {
    this.error = null;
    this.ok = null;
    const vueloOperadoId = Number(this.vueloSeleccionado?.id);
    if (!vueloOperadoId) {
      this.error = 'Selecciona un vuelo.';
      return;
    }
    this.cargando = true;
    this.abordaje.finalizar(vueloOperadoId).subscribe({
      next: (res) => {
        this.ok = res?.mensaje || 'Abordaje finalizado.';
        this.cargando = false;
        this.listar();
      },
      error: (err) => {
        this.error = err?.error?.message || 'No se pudo finalizar el abordaje.';
        this.cargando = false;
      }
    });
  }
}

