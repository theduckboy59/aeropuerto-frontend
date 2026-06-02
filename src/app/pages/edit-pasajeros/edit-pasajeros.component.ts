import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PasajeroService } from '../../services/pasajero.service';
import { getApiErrorMessage } from '../../services/shared/api-error.util';

@Component({
  selector: 'app-edit-pasajeros',
  templateUrl: './edit-pasajeros.component.html',
  styleUrl: './edit-pasajeros.component.css'
})
export class EditPasajerosComponent implements OnInit {
  id: number | null = null;

  cargando = false;
  guardando = false;
  error = '';

  form = {
    username: '',
    email: '',
    pasaporte: '',
    nombreCompleto: '',
    fechaNacimiento: '',
    nacionalidad: '',
    codigoArea: '',
    telefono: '',
    telefonoEmergencia: '',
    direccion: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pasajeros: PasajeroService
  ) {}

  ngOnInit(): void {
    const raw = this.route.snapshot.paramMap.get('id');
    const id = raw ? Number(raw) : NaN;

    if (!id || Number.isNaN(id)) {
      alert('ID invalido');
      this.regresar();
      return;
    }

    this.id = id;
    this.cargar();
  }

  cargar(): void {
    if (!this.id) {
      return;
    }

    this.cargando = true;
    this.error = '';

    this.pasajeros.obtener(this.id).subscribe({
      next: (p) => {
        this.form = {
          username: p?.username || p?.user?.username || '',
          email: p?.email || p?.user?.email || '',
          pasaporte: p?.pasaporte || '',
          nombreCompleto: p?.nombreCompleto || '',
          fechaNacimiento: p?.fechaNacimiento || '',
          nacionalidad: p?.nacionalidad || '',
          codigoArea: p?.codigoArea || '',
          telefono: p?.telefono || '',
          telefonoEmergencia: p?.telefonoEmergencia || '',
          direccion: p?.direccion || ''
        };

        this.cargando = false;
      },
      error: (err) => {
        this.error = getApiErrorMessage(err, 'No se pudo cargar el pasajero.');
        this.cargando = false;
      }
    });
  }

  guardar(): void {
    if (!this.id) {
      return;
    }

    const msg = this.validar();

    if (msg) {
      this.error = msg;
      return;
    }

    const payload = {
      username: this.form.username?.trim() || null,
      email: this.form.email?.trim() || null,
      pasaporte: this.form.pasaporte.trim(),
      nombreCompleto: this.form.nombreCompleto.trim(),
      fechaNacimiento: this.form.fechaNacimiento || null,
      nacionalidad: this.form.nacionalidad?.trim() || null,
      codigoArea: this.form.codigoArea?.trim() || null,
      telefono: this.form.telefono?.trim() || null,
      telefonoEmergencia: this.form.telefonoEmergencia?.trim() || null,
      direccion: this.form.direccion?.trim() || null
    };

    this.guardando = true;
    this.error = '';

    this.pasajeros.editar(this.id, payload).subscribe({
      next: () => {
        this.guardando = false;
        alert('Pasajero actualizado correctamente.');
        this.regresar();
      },
      error: (err) => {
        this.guardando = false;
        this.error = getApiErrorMessage(err, 'No se pudo actualizar el pasajero.');
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/menu/dashboard/pasajeros']);
  }

  private validar(): string {
    if (!this.form.pasaporte.trim()) {
      return 'Pasaporte obligatorio.';
    }

    if (!this.form.nombreCompleto.trim()) {
      return 'Nombre completo obligatorio.';
    }

    if (this.form.email && !this.form.email.includes('@')) {
      return 'Correo invalido.';
    }

    return '';
  }
}
