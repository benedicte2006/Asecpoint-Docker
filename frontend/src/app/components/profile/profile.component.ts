import { Component, OnInit, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as QRCode from 'qrcode';
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../services/auth.service';
import { User, ChangePasswordRequest, UpdateProfileRequest } from '../../models/models';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-10 h-10 object-contain drop-shadow-sm">
            <h1 class="text-2xl sm:text-3xl font-black text-[#0b3c70]">Mon Profil & Identifiants</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-medium">Gestion de vos paramètres de connexion, informations d'agent et badge d'identité numérique</p>
        </div>

        <div class="flex items-center gap-2">
          <span class="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider"
                [ngClass]="profile?.role !== 'ROLE_AGENT' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-sky-100 text-sky-900 border border-sky-300'">
              {{ profile?.role === 'ROLE_ADMIN' ? 'Administrateur' : profile?.role === 'ROLE_UNIT_ADMIN' ? 'Administrateur d’unité' : 'Agent Opérationnel' }}
          </span>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Left Column: Agent Badge & Personal QR Code -->
        <div class="space-y-6">
          <div class="glass-panel p-6 bg-gradient-to-br from-white via-slate-50 to-sky-50/50 border-2 border-slate-200 shadow-xl rounded-2xl text-center relative overflow-hidden">
            
            <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-sky-600 via-[#0b3c70] to-amber-500"></div>

            <div class="flex justify-between items-center mb-4">
              <img src="assets/logo-asecna.png" alt="ASECNA" class="w-10 h-10 object-contain">
              <span class="text-[9px] font-mono font-black uppercase tracking-widest text-[#0b3c70] bg-white px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
                Badge Agent ASECPoint
              </span>
            </div>

            <!-- Agent Identity Avatar & Name -->
            <div class="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0b3c70] to-sky-700 text-white flex items-center justify-center text-2xl font-black mx-auto shadow-md border-2 border-white">
              {{ profile?.prenom?.charAt(0) }}{{ profile?.nom?.charAt(0) }}
            </div>

            <h3 class="text-lg font-black text-[#0b3c70] mt-3">
              {{ profile?.prenom }} {{ profile?.nom }}
            </h3>
            <p class="text-xs font-semibold text-sky-700">
              {{ profile?.fonction || 'Agent ASECNA' }}
            </p>

            <div class="my-4 py-3 px-4 rounded-xl bg-white border border-slate-200 shadow-inner text-left text-xs space-y-1.5">
              <div class="flex justify-between">
                <span class="text-slate-500">Matricule :</span>
                <span class="font-mono font-extrabold text-[#0b3c70]">{{ profile?.matricule }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Identifiant :</span>
                <span class="font-mono text-slate-700">{{ profile?.username }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Unité :</span>
                <span class="font-bold text-sky-800">{{ profile?.uniteNom || 'Non assignée' }}</span>
              </div>
            </div>

            <!-- QR Code Canvas Container -->
            <div class="p-3 bg-white rounded-xl border border-slate-200 shadow-sm inline-block">
              <canvas #badgeQrCanvas class="w-40 h-40 rounded-lg"></canvas>
            </div>
            <p class="text-[10px] text-slate-500 mt-2 font-mono">
              QR Code d'identification ASECNA
            </p>
          </div>
        </div>

        <!-- Right Column: Profile Edit & Password Modification -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Section 1: Informations Générales -->
          <div class="glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-lg rounded-2xl">
            <h2 class="text-lg font-black text-[#0b3c70] flex items-center gap-2 mb-4">
              <svg class="w-5 h-5 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
              <span>Informations de l'Agent</span>
            </h2>

            @if (profileSuccessMsg) {
              <div class="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{{ profileSuccessMsg }}</span>
              </div>
            }

            @if (profileErrorMsg) {
              <div class="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ profileErrorMsg }}</span>
              </div>
            }

            <form (ngSubmit)="onUpdateProfile()" class="space-y-4">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Prénom</label>
                  <input type="text" [(ngModel)]="profileForm.prenom" name="prenom" required class="form-input text-xs">
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Nom</label>
                  <input type="text" [(ngModel)]="profileForm.nom" name="nom" required class="form-input text-xs">
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Fonction / Titre</label>
                  <input type="text" [(ngModel)]="profileForm.fonction" name="fonction" placeholder="ex: Contrôleur Aérien" class="form-input text-xs">
                </div>

                <div>
                  <label class="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Matricule (Lecture seule)</label>
                  <input type="text" [value]="profile?.matricule" disabled class="form-input text-xs bg-slate-100 text-slate-500 font-mono cursor-not-allowed">
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button type="submit" [disabled]="profileLoading" class="btn-primary text-xs px-6 py-2.5 shadow-md inline-flex items-center gap-2 cursor-pointer">
                  <span>{{ profileLoading ? 'Enregistrement...' : 'Enregistrer les modifications' }}</span>
                </button>
              </div>
            </form>
          </div>

          <!-- Section 2: Modification des Identifiants & Mot de Passe -->
          <div class="glass-panel p-6 sm:p-8 bg-white border-slate-200 shadow-lg rounded-2xl">
            <h2 class="text-lg font-black text-[#0b3c70] flex items-center gap-2 mb-1">
              <svg class="w-5 h-5 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <span>Modifier mon mot de passe</span>
            </h2>
            <p class="text-xs text-slate-500 mb-5">Choisissez un nouveau mot de passe d’au moins 6 caractères. Les mots de passe enregistrés ne sont jamais consultables.</p>

            @if (passwordSuccessMsg) {
              <div class="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-emerald-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>{{ passwordSuccessMsg }}</span>
              </div>
            }

            @if (passwordErrorMsg) {
              <div class="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ passwordErrorMsg }}</span>
              </div>
            }

            <form (ngSubmit)="onChangePassword()" autocomplete="off" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Mot de passe actuel</label>
                <div class="relative">
                  <input [type]="showCurrentPassword ? 'text' : 'password'" [readonly]="currentPasswordReadonly" (focus)="currentPasswordReadonly = false" [(ngModel)]="passwordForm.currentPassword" name="currentPassword" autocomplete="new-password" required placeholder="Saisir le mot de passe actuel" class="form-input text-xs pr-10">
                  <button type="button" (click)="showCurrentPassword = !showCurrentPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                    @if (showCurrentPassword) {
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    }
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Nouveau mot de passe</label>
                  <div class="relative">
                    <input [type]="showNewPassword ? 'text' : 'password'" [(ngModel)]="passwordForm.newPassword" name="newPassword" autocomplete="new-password" required placeholder="Minimum 6 caractères" class="form-input text-xs pr-10">
                    <button type="button" (click)="showNewPassword = !showNewPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                      @if (showNewPassword) {
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      }
                    </button>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] uppercase tracking-wider mb-1.5">Confirmer le nouveau mot de passe</label>
                  <div class="relative">
                    <input [type]="showConfirmPassword ? 'text' : 'password'" [(ngModel)]="confirmPassword" name="confirmPassword" autocomplete="new-password" required placeholder="Confirmer à l'identique" class="form-input text-xs pr-10">
                    <button type="button" (click)="showConfirmPassword = !showConfirmPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                      @if (showConfirmPassword) {
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                          <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                      } @else {
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                          <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                      }
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex justify-end pt-2">
                <button type="submit" [disabled]="passwordLoading" class="btn-emerald text-xs px-6 py-2.5 shadow-md inline-flex items-center gap-2 cursor-pointer">
                  <span>{{ passwordLoading ? 'Modification...' : 'Mettre à jour le mot de passe' }}</span>
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>

    </div>
  `
})
export class ProfileComponent implements OnInit {
  @ViewChild('badgeQrCanvas') badgeQrCanvas!: ElementRef<HTMLCanvasElement>;

  profile: User | null = null;
  profileForm: UpdateProfileRequest = {
    nom: '',
    prenom: '',
    fonction: ''
  };

  passwordForm: ChangePasswordRequest = {
    currentPassword: '',
    newPassword: ''
  };
  confirmPassword = '';
  showCurrentPassword = false;
  currentPasswordReadonly = true;
  showNewPassword = false;
  showConfirmPassword = false;

  profileLoading = false;
  profileSuccessMsg = '';
  profileErrorMsg = '';

  passwordLoading = false;
  passwordSuccessMsg = '';
  passwordErrorMsg = '';

  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.profileService.getMyProfile().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.profile = res.data;
          this.profileForm = {
            nom: res.data.nom,
            prenom: res.data.prenom,
            fonction: res.data.fonction || ''
          };
          this.renderBadgeQrCode();
        }
      },
      error: (err) => {
        console.error('Erreur chargement profil:', err);
      }
    });
  }

  private renderBadgeQrCode(): void {
    setTimeout(() => {
      if (this.badgeQrCanvas && this.badgeQrCanvas.nativeElement && this.profile) {
        // Encodage de l'identité de l'agent dans le QR Code
        const payload = JSON.stringify({
          app: 'ASECPoint',
          matricule: this.profile.matricule,
          username: this.profile.username,
          nom: this.profile.nom,
          prenom: this.profile.prenom,
          unite: this.profile.uniteNom || 'ASECNA'
        });

        QRCode.toCanvas(this.badgeQrCanvas.nativeElement, payload, {
          width: 160,
          margin: 1,
          color: {
            dark: '#0b3c70',
            light: '#ffffff'
          }
        }, (error: Error | null | undefined) => {
          if (error) console.error('Erreur rendu QR badge:', error);
        });
      }
    }, 50);
  }

  onUpdateProfile(): void {
    this.profileLoading = true;
    this.profileSuccessMsg = '';
    this.profileErrorMsg = '';

    this.profileService.updateProfile(this.profileForm).subscribe({
      next: (res) => {
        this.profileLoading = false;
        if (res.success && res.data) {
          this.profile = res.data;
          this.profileSuccessMsg = 'Vos informations ont été mises à jour avec succès.';
          this.renderBadgeQrCode();
        }
      },
      error: (err) => {
        this.profileLoading = false;
        this.profileErrorMsg = err.error?.message || 'Erreur lors de la mise à jour des informations.';
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.newPassword !== this.confirmPassword) {
      this.passwordErrorMsg = 'Le nouveau mot de passe et sa confirmation ne correspondent pas.';
      return;
    }

    if (this.passwordForm.newPassword.length < 6) {
      this.passwordErrorMsg = 'Le nouveau mot de passe doit comporter au moins 6 caractères.';
      return;
    }

    this.passwordLoading = true;
    this.passwordSuccessMsg = '';
    this.passwordErrorMsg = '';

    this.profileService.changePassword(this.passwordForm).subscribe({
      next: (res) => {
        this.passwordLoading = false;
        this.passwordSuccessMsg = 'Votre mot de passe a été modifié avec succès.';
        this.passwordForm = { currentPassword: '', newPassword: '' };
        this.currentPasswordReadonly = true;
        this.confirmPassword = '';
      },
      error: (err) => {
        this.passwordLoading = false;
        this.passwordErrorMsg = err.error?.message || 'Erreur lors de la modification du mot de passe.';
      }
    });
  }
}
