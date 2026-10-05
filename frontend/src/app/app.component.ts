import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { NavbarComponent } from './components/navbar/navbar.component';
import { DesktopNotificationService } from './services/desktop-notification.service';
import { WebSocketService } from './services/websocket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-slate-50 text-slate-900 relative">
      @if (!isLoginPage) {
        <app-navbar></app-navbar>
      }

      <!-- Toast Flottant de Notification sur PC -->
      @if (notificationService.activeToast(); as toast) {
        <div class="fixed top-20 right-5 z-50 max-w-md w-full sm:w-96 p-4 rounded-2xl bg-white/95 backdrop-blur-md border-2 border-emerald-500 shadow-2xl animate-fade-in flex items-start gap-3.5 ring-4 ring-emerald-500/10">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0">
            <svg class="w-5 h-5 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <span class="text-[10px] font-mono font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {{ toast.title }}
              </span>
              <span class="text-[10px] text-slate-400 font-mono">{{ toast.timestamp }}</span>
            </div>
            <h4 class="text-sm font-black text-[#0b3c70] truncate mt-1">
              {{ toast.nomComplet }}
            </h4>
            <div class="text-xs text-slate-600 flex items-center gap-2 mt-0.5">
              @if (toast.matricule) {
                <span class="font-mono font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">{{ toast.matricule }}</span>
              }
              @if (toast.uniteNom) {
                <span class="truncate">{{ toast.uniteNom }}</span>
              }
            </div>
          </div>
          <button (click)="notificationService.dismissToast()" class="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer" title="Fermer">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      }

      <main class="flex-1">
        <router-outlet></router-outlet>
      </main>
      <footer class="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 font-medium">
        ASECPoint &bull; Agence pour la Sécurité de la Navigation Aérienne en Afrique et à Madagascar (ASECNA) &bull; © 2026
      </footer>
    </div>
  `
})
export class AppComponent implements OnInit, OnDestroy {
  notificationService = inject(DesktopNotificationService);
  private router = inject(Router);
  private wsService = inject(WebSocketService);
  private globalFeedSub: Subscription | null = null;

  get isLoginPage(): boolean {
    return this.router.url.startsWith('/login');
  }

  ngOnInit(): void {
    // Écoute en arrière-plan du flux global pour notifier le PC en temps réel
    this.globalFeedSub = this.wsService.subscribeToGlobalFeed().subscribe({
      next: (notif) => {
        if (notif.status === 'SUCCESS') {
          this.notificationService.notifyCheckin(notif, true);
        }
      },
      error: (err) => console.error('[AppComponent] Erreur global feed WS:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.globalFeedSub) {
      this.globalFeedSub.unsubscribe();
    }
  }
}

