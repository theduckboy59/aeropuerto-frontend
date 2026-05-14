import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AeropuertosService } from '../../services/aeropuertos.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-aeropuerto-create',
  templateUrl: './aeropuerto-create.component.html',
  styleUrl: './aeropuerto-create.component.css'
})
export class AeropuertoCreateComponent {
  form = {
    nombre: '',
    pais: '',
    ciudad: ''
  };

  puertas: Array<{ codigo: string }> = [{ codigo: '' }];
  nuevaPuerta = '';
  cargando = false;

  constructor(
    private service: AeropuertosService,
    private router: Router
  ) {}

  agregarPuerta() {
    const codigo = (this.nuevaPuerta || '').trim();

    if (!codigo) {
      return;
    }

    this.puertas.push({
      codigo: codigo.toUpperCase()
    });

    this.nuevaPuerta = '';
  }

  quitarPuerta(index: number) {
    this.puertas.splice(index, 1);

    if (!this.puertas.length) {
      this.puertas.push({ codigo: '' });
    }
  }

  guardar() {
    const msg = this.validar();

    if (msg) {
      alert(msg);
      return;
    }

    const payload = {
      nombre: this.form.nombre.trim(),
      pais: this.form.pais.trim(),
      ciudad: this.form.ciudad.trim(),
      puertas: this.normalizarPuertas()
    };

    this.cargando = true;

    this.service.crear(payload).subscribe({
      next: () => {
        this.cargando = false;
        alert('Aeropuerto creado correctamente');
        this.router.navigate(['/menu/aerolinea/aeropuertos']);
      },
      error: (e) => {
        this.cargando = false;
        const message = getApiErrorMessage(e, 'Error al crear aeropuerto');
        alert(message);
      }
    });
  }

  regresar() {
    this.router.navigate(['/menu/aerolinea/aeropuertos']);
  }

  private normalizarPuertas() {
    const codigos = (this.puertas || [])
      .map(p => (p?.codigo || '').trim().toUpperCase())
      .filter(Boolean);

    return Array.from(new Set(codigos))
      .map(codigo => ({ codigo }));
  }

  private validar() {
    if (!this.form.nombre.trim()) return 'Nombre obligatorio';
    if (!this.form.pais.trim()) return 'País obligatorio';
    if (!this.form.ciudad.trim()) return 'Ciudad obligatoria';

    const puertas = this.normalizarPuertas();

    if (!puertas.length) {
      return 'Ingrese al menos una puerta';
    }

    return '';
  }
}