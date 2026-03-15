import { Routes } from '@angular/router';
import { Usuarios } from './features/usuarios/usuarios';
import { Dashboard } from './features/dashboard/dashboard';
import { Productos } from './features/productos/productos';
import { Ordenes } from './features/ordenes/ordenes';
// Importa también tu componente de Dashboard si ya lo tienes por separado

export const routes: Routes = [
   { path: '', redirectTo: 'dashboard', pathMatch: 'full' },// Por defecto al abrir la app
  { path: 'dashboard', component: Dashboard }, 
   { path: 'productos', component: Productos }, 
    {path: 'ordenes', component: Ordenes },            
  { path: 'usuarios', component: Usuarios },         
]; 