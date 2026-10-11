import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { ShowPage } from './pages/show-page/show-page';
import { Reservations } from './pages/reservations/reservations';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'shows/:id', component: ShowPage },
  { path: 'reservations', component: Reservations },
  { path: '**', redirectTo: '' },
];
