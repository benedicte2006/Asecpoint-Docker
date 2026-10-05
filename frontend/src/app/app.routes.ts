import { Routes } from '@angular/router';
import { BorneComponent } from './components/borne/borne.component';
import { ScanComponent } from './components/scan/scan.component';
import { CahierComponent } from './components/cahier/cahier.component';
import { AdminComponent } from './components/admin/admin.component';
import { LoginComponent } from './components/login/login.component';
import { ProfileComponent } from './components/profile/profile.component';

export const routes: Routes = [
  { path: '', redirectTo: 'borne', pathMatch: 'full' },
  { path: 'borne', component: BorneComponent },
  { path: 'scan', component: ScanComponent },
  { path: 'cahier-de-marche', component: CahierComponent },
  { path: 'profil', component: ProfileComponent },
  { path: 'admin', component: AdminComponent },
  { path: 'login', component: LoginComponent },
  { path: '**', redirectTo: 'borne' }
];
