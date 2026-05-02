import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PortalComponent } from './pages/portal/portal.component';
import { LoginComponent } from './pages/login/login.component';
import { MenuComponent } from './pages/menu/menu.component';
import { EmpleadosComponent } from './pages/empleados/empleados.component';

const routes: Routes = [
  { path: '', component: PortalComponent },
  { path: 'login', component: LoginComponent },
  { path: 'menu', component: MenuComponent },
  { path: 'empleados', component: EmpleadosComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}