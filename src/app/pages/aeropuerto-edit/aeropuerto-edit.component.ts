import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AeropuertosService } from '../../services/aeropuertos.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-aeropuerto-edit',
  templateUrl: './aeropuerto-edit.component.html',
  styleUrl: './aeropuerto-edit.component.css'
})
export class AeropuertoEditComponent implements OnInit {
  id: number | null = null;

  form = {
    nombre: '',
    codigoIata: '',
    codigoIcao: '',
    pais: '',
    ciudad: ''
  };

  puertas: Array<{ codigo: string }> = [];
  nuevaPuerta = '';

  cargando = false;
  cargandoDetalle = false;

  constructor(
    private route: ActivatedRoute,
    private service: AeropuertosService,
    private router: Router
  ) {}

  ngOnInit() {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;
    if (!id || Number.isNaN(id)) {
      alert('ID inválido');
      this.regresar();
      return;
    }

    this.id = id;
    this.cargarDetalle();
  }

  cargarDetalle() {
    if (!this.id) return;
    this.cargandoDetalle = true;
    this.service.obtener(this.id).subscribe({
      next: (data) => {
        this.cargandoDetalle = false;
        this.form = {
          nombre: data?.nombre || '',
          codigoIata: data?.codigoIata || '',
          codigoIcao: data?.codigoIcao || '',
          pais: data?.pais || '',
          ciudad: data?.ciudad || ''
        };
        const puertas = (data?.puertas || []).map(p => ({ codigo: p?.codigo || '' }));
        this.puertas = puertas.length ? puertas : [{ codigo: '' }];
      },
      error: (e) => {
        this.cargandoDetalle = false;
        const message = getApiErrorMessage(e, 'Error al cargar aeropuerto');
        alert(message);
        this.regresar();
      }
    });
  }

  agregarPuerta() {
    const codigo = (this.nuevaPuerta || '').trim();
    if (!codigo) return;
    this.puertas.push({ codigo });
    this.nuevaPuerta = '';
  }

  quitarPuerta(index: number) {
    this.puertas.splice(index, 1);
    if (!this.puertas.length) this.puertas.push({ codigo: '' });
  }

  guardar() {
    if (!this.id) return;
    const msg = this.validar();
    if (msg) {
      alert(msg);
      return;
    }

    const puertas = this.normalizarPuertas();

    const payload = {
      nombre: this.form.nombre.trim(),
      codigoIata: this.form.codigoIata.trim(),
      codigoIcao: this.form.codigoIcao.trim(),
      pais: this.form.pais.trim(),
      ciudad: this.form.ciudad.trim(),
      puertas
    };

    this.cargando = true;
    this.service.editar(this.id, payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Aeropuerto actualizado correctamente');
        this.router.navigate(['/menu/aerolinea/aeropuertos']);
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al editar aeropuerto');
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/aeropuertos']);
  }

  private normalizarPuertas() {
    const codigos = (this.puertas || [])
      .map(p => (p?.codigo || '').trim())
      .filter(Boolean);
    const uniq = Array.from(new Set(codigos.map(c => c.toUpperCase()))).map(c => ({ codigo: c }));
    return uniq;
  }

  private validar() {
    if (!this.form.nombre.trim()) return 'Nombre obligatorio';
    if (!this.form.codigoIata.trim()) return 'Código IATA obligatorio';
    if (!this.form.codigoIcao.trim()) return 'Código ICAO obligatorio';
    if (!this.form.pais.trim()) return 'País obligatorio';
    if (!this.form.ciudad.trim()) return 'Ciudad obligatoria';

    const puertas = this.normalizarPuertas();
    if (!puertas.length) return 'Ingrese al menos una puerta';
    return '';
  }
}

