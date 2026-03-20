import { Routes } from '@angular/router';
import { Usuarios } from './features/usuarios/usuarios';
import { Dashboard } from './features/dashboard/dashboard';
import { Productos } from './features/productos/productos';
import { Ordenes } from './features/ordenes/ordenes';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }, // Pantalla de icico
  { path: 'dashboard', component: Dashboard },
  { path: 'productos', component: Productos },
  { path: 'ordenes', component: Ordenes },
  { path: 'usuarios', component: Usuarios },
];
