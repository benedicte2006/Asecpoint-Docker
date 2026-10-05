import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PointageService } from '../../services/pointage.service';
import { AuthService } from '../../services/auth.service';
import { WebauthnService } from '../../services/webauthn.service';
import { DeviceService } from '../../services/device.service';
import { CheckinNotification } from '../../models/models';

@Component({
  selector: 'app-scan',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex items-center justify-center p-4">
      <div class="glass-panel w-full max-w-md p-6 sm:p-8 text-center relative overflow-hidden bg-white border-slate-200 shadow-xl">
        
        <!-- Logo ASECNA -->
        <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-16 h-16 mx-auto mb-4 object-contain drop-shadow-sm">

        <!-- Initial Action Selection State -->
        @if (status === 'READY') {
          <div class="py-2 space-y-4 animate-fade-in">
            @if (currentUser; as user) {
              <div class="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-left space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-800 bg-sky-100 px-2 py-0.5 rounded">
                    Agent Identifié
                  </span>
                  @if (passkeyEnrolled) {
                    <span class="text-[10px] font-semibold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <svg class="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      Passkey FIDO2 Actif
                    </span>
                  } @else {
                    <span class="text-[10px] font-semibold text-amber-700 flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Passkey non configuré
                    </span>
                  }
                </div>

                <h3 class="text-base font-black text-[#0b3c70]">
                  {{ user.prenom }} {{ user.nom }}
                </h3>
                <div class="text-xs text-slate-600 flex items-center justify-between">
                  <span>Matricule : <strong class="font-mono text-[#0b3c70]">{{ user.matricule }}</strong></span>
                  <span>Unité : <strong class="text-sky-700">{{ user.uniteNom || 'ASECNA' }}</strong></span>
                </div>

                <!-- Statut de protection cryptographique du smartphone -->
                <div class="pt-1 border-t border-sky-200/60">
                  @if (passkeyEnrolled) {
                    <div class="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-lg">
                      <svg class="w-3.5 h-3.5 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                      </svg>
                      <span>Smartphone officiel reconnu (Protection biométrique FIDO2 active)</span>
                    </div>
                  } @else {
                    <div class="flex items-center gap-1.5 text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg border border-amber-300">
                      <svg class="w-3.5 h-3.5 shrink-0 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                      <span>Enrôlement requis : associez ce smartphone pour pointer</span>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- Enrôlement Prompt si l'agent n'a pas encore de clé WebAuthn sur ce smartphone -->
            @if (!passkeyEnrolled && webauthnSupported) {
              <div class="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-left space-y-2">
                <div class="flex items-center gap-2 text-indigo-900 font-bold text-xs">
                  <svg class="w-4 h-4 text-indigo-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  <span>Sécurité Anti-Buddy Punching</span>
                </div>
                <p class="text-[11px] text-indigo-700 leading-snug">
                  Enrôlez votre empreinte digitale ou Face ID sur ce smartphone pour valider vos prises de service en 1 seconde sans mot de passe.
                </p>
                <button (click)="enrollPasskey()" [disabled]="enrolling" 
                        class="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-sm">
                  @if (enrolling) {
                    <div class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Configuration en cours...</span>
                  } @else {
                    <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"></path>
                    </svg>
                    <span>Enrôler mon empreinte / Face ID</span>
                  }
                </button>
              </div>
            }

            <div>
              <h2 class="text-xl font-black text-[#0b3c70]">Pointage Opérationnel</h2>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ passkeyEnrolled ? 'Validation instantanée par authentification biométrique.' : 'Sélectionnez votre action ci-dessous.' }}
              </p>
            </div>

            <!-- Choice Action Buttons -->
            <div class="grid grid-cols-1 gap-3.5 pt-1">
              <!-- Prise de Service -->
              <button (click)="handleAction('PRISE_DE_SERVICE')" 
                      class="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition transform active:scale-98 flex items-center justify-between cursor-pointer border border-emerald-400/40">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    @if (passkeyEnrolled) {
                      <!-- Icône Empreinte Biométrique -->
                      <svg class="w-7 h-7 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c0 3.87-3.13 7-7 7a7 7 0 0 1-2-.29"></path>
                        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"></path>
                        <path d="M12 7c-2.76 0-5 2.24-5 5 0 2.21 1.79 4 4 4s4-1.79 4-4"></path>
                      </svg>
                    } @else {
                      <svg class="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    }
                  </div>
                  <div class="text-left">
                    <div class="leading-tight text-sm">PRISE DE SERVICE</div>
                    <div class="text-[11px] font-normal text-emerald-100">
                      {{ passkeyEnrolled ? 'Vérification Face ID / Empreinte' : 'Confirmer avec mon mot de passe' }}
                    </div>
                  </div>
                </div>
                <svg class="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>

              <!-- Fin de Service -->
              <button (click)="handleAction('FIN_DE_SERVICE')" 
                      class="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition transform active:scale-98 flex items-center justify-between cursor-pointer border border-amber-400/40">
                <div class="flex items-center gap-3">
                  <div class="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                    @if (passkeyEnrolled) {
                      <svg class="w-7 h-7 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 11c0 3.87-3.13 7-7 7a7 7 0 0 1-2-.29"></path>
                        <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"></path>
                        <path d="M12 7c-2.76 0-5 2.24-5 5 0 2.21 1.79 4 4 4s4-1.79 4-4"></path>
                      </svg>
                    } @else {
                      <svg class="w-6 h-6 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                      </svg>
                    }
                  </div>
                  <div class="text-left">
                    <div class="leading-tight text-sm">FIN DE SERVICE</div>
                    <div class="text-[11px] font-normal text-amber-100">
                      {{ passkeyEnrolled ? 'Vérification Face ID / Empreinte' : 'Clôturer mon quart en toute sécurité' }}
                    </div>
                  </div>
                </div>
                <svg class="w-5 h-5 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>

            <!-- Option alternative mot de passe si passkey est actif -->
            @if (passkeyEnrolled) {
              <div class="pt-2">
                <button (click)="openPasswordFallback()" class="text-xs text-slate-500 hover:text-slate-800 underline font-medium">
                  Utiliser mon mot de passe à la place
                </button>
              </div>
            }
          </div>
        }

        <!-- Biometric Scan Prompt State (Pendant le scan Face ID / Empreinte) -->
        @if (status === 'BIOMETRIC_SCAN') {
          <div class="py-8 space-y-6 animate-fade-in text-center">
            <div class="relative w-24 h-24 mx-auto flex items-center justify-center">
              <div class="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin"></div>
              <div class="w-20 h-20 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center shadow-inner">
                <svg class="w-10 h-10 stroke-current animate-pulse" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 11c0 3.87-3.13 7-7 7a7 7 0 0 1-2-.29"></path>
                  <path d="M12 2a10 10 0 0 1 10 10c0 5.52-4.48 10-10 10S2 17.52 2 12"></path>
                  <path d="M12 7c-2.76 0-5 2.24-5 5 0 2.21 1.79 4 4 4s4-1.79 4-4"></path>
                </svg>
              </div>
            </div>

            <div class="space-y-1">
              <h2 class="text-lg font-black text-[#0b3c70]">Vérification Biométrique...</h2>
              <p class="text-xs text-slate-500 max-w-xs mx-auto">
                Apposez votre empreinte digitale ou confirmez avec Face ID sur votre écran.
              </p>
            </div>

            <button (click)="cancelBiometricScan()" class="btn-secondary text-xs py-2.5 px-4">
              Annuler
            </button>
          </div>
        }

        <!-- Password Confirmation State (Mode de secours) -->
        @if (status === 'PASSWORD_CONFIRM') {
          <div class="py-4 space-y-4 animate-fade-in text-left">
            <div class="flex items-center gap-3 p-3 rounded-2xl border-2"
                 [ngClass]="selectedTypePointage === 'PRISE_DE_SERVICE' ? 'bg-emerald-50 border-emerald-300' : 'bg-amber-50 border-amber-300'">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center"
                   [ngClass]="selectedTypePointage === 'PRISE_DE_SERVICE' ? 'bg-emerald-600' : 'bg-amber-600'">
                @if (selectedTypePointage === 'PRISE_DE_SERVICE') {
                  <svg class="w-6 h-6 text-white stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                } @else {
                  <svg class="w-6 h-6 text-white stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                    <line x1="12" y1="2" x2="12" y2="12"></line>
                  </svg>
                }
              </div>
              <div>
                <div class="text-xs font-bold uppercase tracking-wider"
                     [ngClass]="selectedTypePointage === 'PRISE_DE_SERVICE' ? 'text-emerald-900' : 'text-amber-900'">
                  {{ selectedTypePointage === 'PRISE_DE_SERVICE' ? 'Prise de Service' : 'Fin de Service' }}
                </div>
                <div class="text-[11px] text-slate-600 font-medium">
                  {{ currentUser?.prenom }} {{ currentUser?.nom }} — {{ currentUser?.matricule }}
                </div>
              </div>
            </div>

            <div>
              <h2 class="text-base font-black text-[#0b3c70]">Mot de passe de confirmation</h2>
              <p class="text-xs text-slate-500 mt-0.5">Saisissez votre mot de passe pour attester de votre identité.</p>
            </div>

            @if (pinErrorMsg) {
              <div class="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <svg class="w-4 h-4 text-rose-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>{{ pinErrorMsg }}</span>
              </div>
            }

            <div>
              <label class="block text-xs font-bold text-[#0b3c70] uppercase mb-1.5">
                🔒 Mot de passe
              </label>
              <div class="relative">
                <input 
                  [type]="showPinPassword ? 'text' : 'password'" 
                  [(ngModel)]="pinInput" 
                  placeholder="••••••••" 
                  class="form-input text-sm pr-10"
                  (keyup.enter)="validatePasswordAndCheckin()"
                  autofocus>
                <button type="button" (click)="showPinPassword = !showPinPassword" class="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                  @if (showPinPassword) {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  } @else {
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div class="pt-2 flex items-center gap-2">
              <button (click)="validatePasswordAndCheckin()" class="btn-primary flex-1 text-xs py-3 justify-center inline-flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                </svg>
                <span>Confirmer & Pointer</span>
              </button>
              <button (click)="status = 'READY'" class="btn-secondary text-xs py-3">
                Retour
              </button>
            </div>
          </div>
        }

        <!-- Loading State -->
        @if (status === 'LOADING') {
          <div class="py-8 space-y-4">
            <div class="w-14 h-14 border-4 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <h2 class="text-base font-extrabold text-[#0b3c70]">Validation en cours...</h2>
            <p class="text-xs text-slate-500">Transmission au serveur ASECPoint et enregistrement au journal miroir...</p>
          </div>
        }

        <!-- Success State -->
        @if (status === 'SUCCESS' && checkinResult) {
          <div class="py-4 space-y-4 animate-fade-in">
            @if (checkinResult.typePointage === 'FIN_DE_SERVICE') {
              <div class="w-20 h-20 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-500 flex items-center justify-center mx-auto glow-amber animate-bounce">
                <svg class="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>

              <div>
                <span class="px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-black uppercase tracking-wider border border-amber-300">
                  Fin de service validée
                </span>
                <h1 class="text-2xl font-black text-[#0b3c70] mt-2">
                  Émargement de clôture réussi !
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">Votre fin de quart a été transmise à la borne d'accueil et au journal miroir.</p>
              </div>
            } @else {
              <div class="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500 flex items-center justify-center mx-auto glow-emerald animate-bounce">
                <svg class="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <div>
                <span class="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider border border-emerald-300">
                  Prise de service validée
                </span>
                <h1 class="text-2xl font-black text-[#0b3c70] mt-2">
                  Prise de service enregistrée !
                </h1>
                <p class="text-xs text-slate-500 mt-0.5">Votre prise de quart a été certifiée et affichée sur la borne.</p>
              </div>
            }

            <!-- Agent summary card avec badge biométrique -->
            <div class="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2.5 shadow-inner">
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Agent :</span>
                <span class="font-extrabold text-slate-900 text-sm">{{ checkinResult.nomComplet }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Matricule :</span>
                <span class="font-mono font-bold text-[#0b3c70]">{{ checkinResult.matricule }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Unité :</span>
                <span class="font-bold text-sky-700">{{ checkinResult.uniteNom }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 font-medium">Type :</span>
                <span class="font-bold" [ngClass]="checkinResult.typePointage === 'FIN_DE_SERVICE' ? 'text-amber-700' : 'text-emerald-700'">
                  {{ checkinResult.typePointage === 'FIN_DE_SERVICE' ? 'Fin de Service' : 'Prise de Service' }}
                </span>
              </div>
              <div class="flex justify-between items-center border-t border-slate-200 pt-2">
                <span class="text-slate-500 font-medium">Certification :</span>
                @if (authMethodUsed === 'WEBAUTHN') {
                  <span class="font-bold text-emerald-700 flex items-center gap-1">
                    <svg class="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Passkey Biométrique FIDO2
                  </span>
                } @else {
                  <span class="font-bold text-slate-700 flex items-center gap-1">
                    Mot de passe vérifié
                  </span>
                }
              </div>
            </div>

            <div class="pt-2 flex flex-col gap-2.5">
              <a routerLink="/cahier-de-marche" class="w-full btn-primary justify-center text-xs py-3 shadow-md inline-flex items-center gap-2">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                </svg>
                <span>Consulter le Journal Miroir</span>
              </a>
              <a routerLink="/borne" class="text-xs text-slate-500 hover:text-slate-800 underline font-medium mt-1">
                Retourner à l'écran borne
              </a>
            </div>
          </div>
        }

        <!-- Error State -->
        @if (status === 'ERROR') {
          <div class="py-6 space-y-4">
            <div class="w-16 h-16 rounded-full bg-rose-50 text-rose-600 border border-rose-300 flex items-center justify-center mx-auto">
              <svg class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </div>
            <h2 class="text-lg font-black text-slate-900">Échec du pointage</h2>
            <p class="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 font-medium">
              {{ errorMessage }}
            </p>
            <div class="pt-2 flex flex-col gap-2">
              <button (click)="status = 'READY'" class="btn-primary text-xs w-full justify-center py-2.5">
                Réessayer
              </button>
              <a routerLink="/borne" class="text-xs text-slate-500 hover:text-slate-800 underline font-medium">
                Retourner à la borne
              </a>
            </div>
          </div>
        }

      </div>
    </div>
  `
})
export class ScanComponent implements OnInit {
  status: 'READY' | 'BIOMETRIC_SCAN' | 'PASSWORD_CONFIRM' | 'LOADING' | 'SUCCESS' | 'ERROR' = 'READY';
  errorMessage = '';
  checkinResult: CheckinNotification | null = null;
  currentUser: any = null;

  selectedTypePointage: 'PRISE_DE_SERVICE' | 'FIN_DE_SERVICE' = 'PRISE_DE_SERVICE';
  pinInput = '';
  pinErrorMsg = '';
  showPinPassword = false;

  // WebAuthn state
  webauthnSupported = false;
  passkeyEnrolled = false;
  enrolling = false;
  authMethodUsed: 'WEBAUTHN' | 'PASSWORD' = 'WEBAUTHN';

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private pointageService = inject(PointageService);
  private authService = inject(AuthService);
  private webauthnService = inject(WebauthnService);
  private deviceService = inject(DeviceService);

  private sessionId = '';
  private token = '';

  ngOnInit(): void {
    this.currentUser = this.authService.currentUser();
    this.webauthnSupported = this.webauthnService.isSupported();

    this.route.queryParams.subscribe(params => {
      this.sessionId = params['session'] || '';
      this.token = params['token'] || '';

      if (!this.sessionId || !this.token) {
        this.status = 'ERROR';
        this.errorMessage = 'Paramètres de pointage manquants dans le QR code.';
        return;
      }

      if (!this.authService.isAuthenticated()) {
        const currentUrl = `/scan?session=${this.sessionId}&token=${this.token}`;
        this.router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        return;
      }

      this.status = 'READY';
      this.checkPasskeyStatus();
    });
  }

  checkPasskeyStatus(): void {
    if (!this.currentUser) return;
    const code = this.currentUser.matricule || this.currentUser.username;
    this.webauthnService.getStatus(code).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.passkeyEnrolled = res.data.enrolled;
        }
      },
      error: () => {
        this.passkeyEnrolled = false;
      }
    });
  }

  async enrollPasskey(): Promise<void> {
    if (!this.currentUser) return;
    const code = this.currentUser.matricule || this.currentUser.username;
    this.enrolling = true;
    try {
      const res = await this.webauthnService.registerPasskey(code);
      if (res.success) {
        this.passkeyEnrolled = true;
      } else {
        alert("Échec de l'enrôlement : " + res.message);
      }
    } catch (e: any) {
      alert("Erreur lors de l'enregistrement de l'empreinte : " + (e.message || e));
    } finally {
      this.enrolling = false;
    }
  }

  handleAction(typePointage: 'PRISE_DE_SERVICE' | 'FIN_DE_SERVICE'): void {
    this.selectedTypePointage = typePointage;
    if (this.passkeyEnrolled && this.webauthnSupported) {
      this.executeBiometricCheckin();
    } else {
      this.pinInput = '';
      this.pinErrorMsg = '';
      this.status = 'PASSWORD_CONFIRM';
    }
  }

  async executeBiometricCheckin(): Promise<void> {
    if (!this.currentUser) return;
    const code = this.currentUser.matricule || this.currentUser.username;

    this.status = 'BIOMETRIC_SCAN';
    try {
      // 1. Déclenche l'invite biométrique native du smartphone
      const signedData = await this.webauthnService.authenticateAndSign(code);

      // 2. Envoi de la signature au backend Spring Boot
      this.status = 'LOADING';
      this.webauthnService.validerPointageWebAuthn({
        agentCode: code,
        sessionId: this.sessionId,
        token: this.token,
        typePointage: this.selectedTypePointage,
        credentialId: signedData.credentialId,
        clientDataJSON: signedData.clientDataJSON,
        authenticatorData: signedData.authenticatorData,
        signature: signedData.signature,
        userHandle: signedData.userHandle
      }).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.status = 'SUCCESS';
            this.authMethodUsed = 'WEBAUTHN';
            this.checkinResult = res.data;
          } else {
            this.status = 'ERROR';
            this.errorMessage = res.message || 'Signature biométrique refusée par le serveur.';
          }
        },
        error: (err) => {
          this.status = 'ERROR';
          this.errorMessage = err.error?.message || 'Erreur lors de la validation biométrique.';
        }
      });

    } catch (err: any) {
      console.warn('Biométrie annulée ou erreur WebAuthn :', err);
      // En cas d'annulation ou d'erreur sur le smartphone, proposer le mot de passe de secours
      this.status = 'PASSWORD_CONFIRM';
      this.pinErrorMsg = err.message || 'Authentification biométrique annulée. Vous pouvez utiliser votre mot de passe.';
    }
  }

  cancelBiometricScan(): void {
    this.status = 'READY';
  }

  openPasswordFallback(): void {
    this.pinInput = '';
    this.pinErrorMsg = '';
    this.status = 'PASSWORD_CONFIRM';
  }

  validatePasswordAndCheckin(): void {
    if (!this.pinInput || this.pinInput.trim().length === 0) {
      this.pinErrorMsg = 'Veuillez saisir votre mot de passe pour confirmer votre identité.';
      return;
    }
    this.executePasswordCheckin();
  }

  private executePasswordCheckin(): void {
    const deviceUuid = this.deviceService.getOrCreateDeviceUuid();
    this.status = 'LOADING';
    this.pointageService.autoCheckin(this.sessionId, this.token, this.selectedTypePointage, this.pinInput, deviceUuid).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.status = 'SUCCESS';
          this.authMethodUsed = 'PASSWORD';
          this.checkinResult = res.data;
          this.pinInput = '';
        } else {
          this.status = 'PASSWORD_CONFIRM';
          this.pinErrorMsg = res.message || 'Mot de passe incorrect.';
        }
      },
      error: (err) => {
        this.status = 'PASSWORD_CONFIRM';
        this.pinErrorMsg = err.error?.message || 'Erreur lors de la validation du mot de passe.';
      }
    });
  }
}