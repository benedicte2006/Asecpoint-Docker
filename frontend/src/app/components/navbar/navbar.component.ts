import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DesktopNotificationService } from '../../services/desktop-notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo & Brand -->
          <div class="flex items-center gap-3.5 cursor-pointer" routerLink="/">
            <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-14 h-14 object-contain drop-shadow-sm hover:scale-105 transition">
            <div>
              <div class="text-xl font-black tracking-wider text-[#0b3c70] flex items-center gap-2">
                <span>ASECPoint</span>
                <span class="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold uppercase tracking-wider">
                  ASECNA
                </span>
              </div>
              <p class="text-[11px] text-slate-500 font-medium tracking-tight">Système de Pointage & Cahier de Marche</p>
            </div>
          </div>

          <!-- Navigation Links (only shown when authenticated) -->
          @if (authService.currentUser(); as user) {
            <div class="flex items-center gap-2 sm:gap-3">
              <a routerLink="/borne" routerLinkActive="bg-sky-50 text-[#0b3c70] border-sky-300 font-bold shadow-sm" 
                 class="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0b3c70] hover:bg-slate-100 transition border border-transparent flex items-center gap-2">
                <svg class="w-4 h-4 text-[#0b3c70]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                  <line x1="8" y1="21" x2="16" y2="21"></line>
                  <line x1="12" y1="17" x2="12" y2="21"></line>
                </svg>
                <span>Borne d'Accueil</span>
              </a>

              <a routerLink="/cahier-de-marche" routerLinkActive="bg-sky-50 text-[#0b3c70] border-sky-300 font-bold shadow-sm" 
                 class="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0b3c70] hover:bg-slate-100 transition border border-transparent flex items-center gap-2">
                <svg class="w-4 h-4 text-[#0b3c70]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span>Cahier de Marche</span>
              </a>

              <a routerLink="/profil" routerLinkActive="bg-sky-50 text-[#0b3c70] border-sky-300 font-bold shadow-sm" 
                 class="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:text-[#0b3c70] hover:bg-slate-100 transition border border-transparent flex items-center gap-2">
                <svg class="w-4 h-4 text-[#0b3c70]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span>Mon Profil & Identifiants</span>
              </a>

              @if (authService.canManageUnit()) {
                <a routerLink="/admin" routerLinkActive="bg-amber-50 text-amber-900 border-amber-300 font-bold shadow-sm" 
                   class="px-3.5 py-2 rounded-lg text-xs font-semibold text-amber-800 hover:bg-amber-100/60 transition border border-transparent flex items-center gap-2">
                  <svg class="w-4 h-4 text-amber-800" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  <span>Administration</span>
                </a>
              }

              <!-- Notifications PC toggle -->
              <button (click)="requestNotificationPermission()" 
                      [title]="desktopNotifService.permissionState() === 'granted' ? 'Notifications bureau actives sur ce PC' : 'Cliquer pour activer les notifications sur ce PC'"
                      class="px-2.5 py-1.5 rounded-lg text-xs font-semibold transition border flex items-center gap-1.5 cursor-pointer"
                      [ngClass]="desktopNotifService.permissionState() === 'granted' ? 'text-emerald-700 bg-emerald-50 border-emerald-200 shadow-sm' : 'text-slate-600 hover:text-[#0b3c70] hover:bg-slate-100 border-slate-200'">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <span class="hidden xl:inline text-[11px]">{{ desktopNotifService.permissionState() === 'granted' ? 'Notif PC OK' : 'Notif PC' }}</span>
              </button>

              <!-- User Info & Logout -->
              <div class="ml-2 pl-3 border-l border-slate-200 flex items-center gap-2.5">
                <div class="hidden md:flex flex-col text-right">
                  <span class="text-xs font-bold text-[#0b3c70]">{{ user.prenom }} {{ user.nom }}</span>
                  <span class="text-[10px] font-mono text-slate-500">{{ user.role === 'ROLE_ADMIN' ? 'Administrateur' : user.role === 'ROLE_UNIT_ADMIN' ? 'Admin ' + (user.uniteNom || '') : 'Agent ' + (user.uniteNom || '') }}</span>
                </div>
                <button (click)="logout()" class="px-3 py-1.5 text-xs rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-600 transition border border-slate-200 font-semibold cursor-pointer">
                  Déconnexion
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </nav>
  `
})
export class NavbarComponent {
  authService = inject(AuthService);
  desktopNotifService = inject(DesktopNotificationService);
  private router = inject(Router);

  requestNotificationPermission(): void {
    this.desktopNotifService.requestPermission();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
