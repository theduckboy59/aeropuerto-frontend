import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PortalComponent } from './pages/portal/portal.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';
import { EmpleadoFormComponent } from './pages/empleado-form/empleado-form.component';
import { RegisterComponent } from './pages/register/register.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { PlaceholderComponent } from './pages/placeholder/placeholder.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'login', component: LoginComponent },
  {
    path: 'menu',
    component: MenuComponent,
    children: [
      { path: '', component: DashboardComponent },
      { path: 'aerolinea/empleados', component: EmpleadosComponent },
      { path: 'aerolinea/empleados/nuevo', component: EmpleadoFormComponent },
      { path: 'aerolinea/tripulacion', component: PlaceholderComponent, data: { title: 'Tripulación' } },
      { path: 'aerolinea/aviones', component: PlaceholderComponent, data: { title: 'Aviones' } },
      { path: 'aerolinea/vuelos', component: PlaceholderComponent, data: { title: 'Vuelos (Aerolínea)' } },

      { path: 'vuelos/reservar', component: PlaceholderComponent, data: { title: 'Reservar vuelo' } },
      { path: 'vuelos/abordaje', component: PlaceholderComponent, data: { title: 'Abordaje' } },

      { path: 'consultas/vuelos', component: PlaceholderComponent, data: { title: 'Consulta de vuelos' } },
      { path: 'consultas/equipaje', component: PlaceholderComponent, data: { title: 'Consulta de equipaje' } },
      { path: 'consultas/pasajeros', component: PlaceholderComponent, data: { title: 'Consulta de pasajeros' } },

      { path: 'usuarios/registro', component: PlaceholderComponent, data: { title: 'Usuarios - Registro' } },
      { path: 'usuarios/login', component: PlaceholderComponent, data: { title: 'Usuarios - Login' } }
    ]
  },
  { path: 'empleados', redirectTo: 'menu/aerolinea/empleados', pathMatch: 'full' },
  { path: 'register', component: RegisterComponent },
  { path: 'portal', component: PortalComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}
