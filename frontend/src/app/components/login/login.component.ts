import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-[calc(100vh-3.25rem)] flex items-center justify-center p-4">
      <div class="glass-panel w-full max-w-md p-8 relative overflow-hidden bg-white shadow-xl border-slate-200">
        
        <!-- Header -->
        <div class="text-center mb-8">
          <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-20 h-20 mx-auto mb-3 object-contain drop-shadow-sm hover:scale-105 transition">
          <h1 class="text-2xl font-black tracking-tight text-[#0b3c70]">ASECPoint</h1>
          <p class="text-xs text-slate-500 mt-1 font-medium">Plateforme ASECNA de Pointage & Sécurité Opérationnelle</p>
        </div>

        @if (errorMessage) {
          <div class="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <svg class="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>{{ errorMessage }}</span>
          </div>
        }

        <form (ngSubmit)="onLogin()" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Identifiant / Matricule</label>
            <input type="text" [(ngModel)]="username" name="username" required placeholder="ex: agent.twr ou admin" class="form-input text-xs">
          </div>

          <div>
            <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Mot de passe</label>
            <div class="relative">
              <input [type]="showPassword ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="••••••••" class="form-input text-xs pr-10">
              <button type="button" (click)="showPassword = !showPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                @if (showPassword) {
                  <!-- Eye Off Icon -->
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                } @else {
                  <!-- Eye Icon -->
                  <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                }
              </button>
            </div>
          </div>

          <button type="submit" [disabled]="loading" class="w-full btn-primary justify-center py-3 text-xs mt-2 shadow-md">
            @if (loading) {
              <span>Connexion en cours...</span>
            } @else {
              <span>Se Connecter</span>
            }
          </button>
        </form>

      </div>
    </div>
  `
})
export class LoginComponent {
  username = '';
  password = '';
  showPassword = false;
  loading = false;
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  onLogin(): void {
    if (!this.username || !this.password) {
      this.errorMessage = 'Veuillez saisir votre identifiant et mot de passe.';
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    this.authService.login({ username: this.username, password: this.password }).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/cahier-de-marche';
          this.router.navigateByUrl(returnUrl);
        } else {
          this.errorMessage = res.message || 'Identifiants invalides';
        }
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = err.error?.message || 'Identifiants incorrects ou serveur indisponible';
      }
    });
  }
}
