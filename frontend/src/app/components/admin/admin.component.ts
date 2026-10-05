import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdminService } from '../../services/admin.service';
import { PointageService } from '../../services/pointage.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { WebauthnService } from '../../services/webauthn.service';
import { WebSocketService } from '../../services/websocket.service';
import { AudioService } from '../../services/audio.service';
import { AuthService } from '../../services/auth.service';
import { Pointage, Role, Unite, User } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center gap-3">
          <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-10 h-10 object-contain drop-shadow-sm">
          <h1 class="text-2xl sm:text-3xl font-black text-[#0b3c70]">Console d'Administration</h1>
        </div>
        <p class="text-xs text-slate-500 mt-1 font-medium">{{ authService.isAdmin() ? 'Gestion des comptes, unités opérationnelles et émargements' : 'Gestion des agents de votre unité' }}</p>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-3 border-b border-slate-200 pb-4 mb-8">
        <button (click)="activeTab = 'USERS'" [ngClass]="activeTab === 'USERS' ? 'btn-primary' : 'px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100'" class="inline-flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>Agents & Utilisateurs</span>
        </button>
        @if (authService.isAdmin()) {
        <button (click)="activeTab = 'UNITES'" [ngClass]="activeTab === 'UNITES' ? 'btn-primary' : 'px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100'" class="inline-flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
            <line x1="9" y1="22" x2="9" y2="22.01"></line>
            <line x1="15" y1="22" x2="15" y2="22.01"></line>
            <line x1="8" y1="6" x2="8" y2="6.01"></line>
            <line x1="16" y1="6" x2="16" y2="6.01"></line>
            <line x1="8" y1="10" x2="8" y2="10.01"></line>
            <line x1="16" y1="10" x2="16" y2="10.01"></line>
            <line x1="8" y1="14" x2="8" y2="14.01"></line>
            <line x1="16" y1="14" x2="16" y2="14.01"></line>
          </svg>
          <span>Unités & Services</span>
        </button>
        }
        @if (authService.isAdmin()) {
        <button (click)="activeTab = 'POINTAGES'; loadPointages()" [ngClass]="activeTab === 'POINTAGES' ? 'btn-primary' : 'px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100'" class="inline-flex items-center gap-2">
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="20" x2="18" y2="10"></line>
            <line x1="12" y1="20" x2="12" y2="4"></line>
            <line x1="6" y1="20" x2="6" y2="14"></line>
          </svg>
          <span>Émargements & Pointages</span>
        </button>
        }
      </div>

      <!-- TAB 1: USERS MANAGEMENT -->
      @if (activeTab === 'USERS') {
        <div class="space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 class="text-lg font-black text-[#0b3c70]">Liste des Agents & Opérateurs</h2>
            <div class="flex items-center gap-2">
              <button (click)="downloadAgentsPdf()" class="px-3.5 py-2 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs font-bold text-[#0b3c70] border border-sky-200 shadow-xs inline-flex items-center gap-1.5 cursor-pointer">
                <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Télécharger Répertoire (PDF)</span>
              </button>
              <button (click)="openCreateUser()" class="btn-emerald text-xs shadow-md">
                + {{ authService.isAdmin() ? 'Créer un compte' : 'Créer un agent' }}
              </button>
            </div>
          </div>

          <div class="glass-panel overflow-hidden bg-white shadow-md border-slate-200">
            <table class="w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th class="p-3.5">Matricule</th>
                  <th class="p-3.5">Nom & Prénom</th>
                  <th class="p-3.5">Identifiant</th>
                  <th class="p-3.5">Fonction</th>
                  <th class="p-3.5">Unité</th>
                  <th class="p-3.5">Rôle</th>
                  <th class="p-3.5">Smartphone</th>
                  <th class="p-3.5">Passkey FIDO2</th>
                  <th class="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (u of users; track u.id) {
                  <tr class="hover:bg-sky-50/40 transition">
                    <td class="p-3.5 font-mono font-extrabold text-[#0b3c70]">{{ u.matricule }}</td>
                    <td class="p-3.5 font-bold text-slate-900">{{ u.nom }} {{ u.prenom }}</td>
                    <td class="p-3.5 font-mono text-slate-500">{{ u.username }}</td>
                    <td class="p-3.5">{{ u.fonction || 'N/A' }}</td>
                    <td class="p-3.5 text-slate-700">{{ u.uniteNom || 'Non assigné' }}</td>
                    <td class="p-3.5">
                      <span [ngClass]="u.role !== 'ROLE_AGENT' ? 'badge-admin' : 'badge-agent'">
                        {{ u.role === 'ROLE_ADMIN' ? 'Admin général' : u.role === 'ROLE_UNIT_ADMIN' ? 'Admin unité' : 'Agent' }}
                      </span>
                    </td>
                    <td class="p-3.5">
                      @if (u.deviceUuid) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300" title="{{ u.deviceUuid }}">
                          📱 Enregistré
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-400 border border-slate-200">
                          Non lié
                        </span>
                      }
                    </td>
                    <td class="p-3.5">
                      @if (passkeyStatusMap[u.matricule || u.username]) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <svg class="w-3 h-3 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                          </svg>
                          FIDO2 Actif
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                          </svg>
                          Non enrôlé
                        </span>
                      }
                    </td>
                    <td class="p-3.5 text-right">
                      <div class="flex items-center justify-end gap-1.5">
                        <button (click)="resetUserPassword(u)" title="Définir un nouveau mot de passe pour ce compte" class="px-2 py-1 text-[10px] font-bold text-sky-800 bg-sky-50 hover:bg-sky-100 rounded border border-sky-200">
                          Mot de passe
                        </button>
                        @if (u.deviceUuid) {
                          <button (click)="resetUserDevice(u)" title="Délier le smartphone de cet agent pour lui permettre d'associer un nouvel appareil" class="px-2 py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded border border-amber-300 flex items-center gap-1 transition">
                            <svg class="w-3 h-3 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                              <line x1="2" y1="2" x2="22" y2="22"></line>
                            </svg>
                            <span>Délier Tél.</span>
                          </button>
                        }
                        @if (authService.isAdmin()) {
                        <button (click)="resetPasskey(u)" title="Réinitialiser la clé biométrique WebAuthn (changement de smartphone)" class="px-2 py-1 text-[10px] font-bold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 flex items-center gap-1 transition">
                          <svg class="w-3 h-3 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                            <line x1="8" y1="8" x2="16" y2="16"></line>
                          </svg>
                          <span>Reset Passkey</span>
                        </button>
                        }
                        @if (u.username !== 'admin' && (authService.isAdmin() || u.role === 'ROLE_AGENT')) {
                          <button (click)="deleteUser(u.id)" class="btn-danger text-[10px] py-1 px-2.5">
                            Supprimer
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- TAB 2: UNITES MANAGEMENT -->
      @if (activeTab === 'UNITES') {
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-black text-[#0b3c70]">Unités Opérationnelles ASECNA</h2>
            <button (click)="showUniteModal = true" class="btn-emerald text-xs shadow-md">
              + Ajouter une Unité
            </button>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            @for (unite of unites; track unite.id) {
              <div class="glass-card p-5 relative flex flex-col justify-between bg-white">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="px-2.5 py-0.5 rounded bg-sky-100 text-[#0b3c70] font-mono font-black text-xs border border-sky-200">
                      {{ unite.codeUnite }}
                    </span>
                    <button (click)="deleteUnite(unite.id)" class="text-rose-600 hover:text-rose-800 text-xs p-1 cursor-pointer" title="Supprimer l'unité">
                      <svg class="w-4 h-4 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                  <h3 class="text-base font-extrabold text-[#0b3c70]">{{ unite.nom }}</h3>
                  <p class="text-xs text-slate-600 mt-2 font-medium">{{ unite.description || 'Aucune description disponible.' }}</p>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- TAB 3: POINTAGES FEED -->
      @if (activeTab === 'POINTAGES') {
        <div class="space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 class="text-lg font-black text-[#0b3c70]">Journal Global des Émargements</h2>
              <p class="text-xs text-slate-500">Traçabilité des prises et fins de service certifiées par QR code & mot de passe</p>
            </div>
            
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Filtre Unité -->
              <select [(ngModel)]="pointageFilterUnite" class="form-select text-xs py-2 w-44">
                <option [ngValue]="null">Toutes les unités</option>
                @for (u of unites; track u.id) {
                  <option [ngValue]="u.id">{{ u.nom }}</option>
                }
              </select>

              <!-- Filtre Date -->
              <input type="date" [(ngModel)]="pointageFilterDate" class="form-input text-xs py-2 w-36">

              <!-- Bouton Télécharger PDF d'émargement -->
              <button (click)="downloadEmargementPdf()" class="btn-primary text-xs py-2 px-3.5 shadow-md inline-flex items-center gap-1.5 cursor-pointer font-bold">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Télécharger Émargement (PDF)</span>
              </button>

              <!-- Actualiser -->
              <button (click)="loadPointages()" class="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 shadow-xs inline-flex items-center cursor-pointer" title="Actualiser la liste">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <polyline points="1 20 1 14 7 14"></polyline>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
              </button>
            </div>
          </div>

          <div class="glass-panel overflow-hidden bg-white shadow-md border-slate-200">
            <table class="w-full text-left text-xs text-slate-700">
              <thead class="bg-slate-50 text-slate-600 uppercase font-mono text-[10px] border-b border-slate-200 font-bold">
                <tr>
                  <th class="p-3.5">Horodatage</th>
                  <th class="p-3.5">Agent</th>
                  <th class="p-3.5">Matricule</th>
                  <th class="p-3.5">Unité / Service</th>
                  <th class="p-3.5">Type de pointage</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                @for (p of filteredPointages; track p.id) {
                  <tr class="hover:bg-sky-50/40 transition">
                    <td class="p-3.5 font-mono text-emerald-700 font-bold">
                      {{ (p.horodatage ? p.horodatage : p.timestamp) | date:'dd/MM/yyyy HH:mm:ss' }}
                    </td>
                    <td class="p-3.5 font-bold text-slate-900">{{ p.user?.nom }} {{ p.user?.prenom }}</td>
                    <td class="p-3.5 font-mono text-slate-500">{{ p.user?.matricule }}</td>
                    <td class="p-3.5 text-slate-700">{{ p.user?.uniteNom || 'Générale' }}</td>
                    <td class="p-3.5">
                      <span [ngClass]="isPriseDeService(p) ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'" class="px-2.5 py-0.5 rounded-md text-[10px] font-black border">
                        {{ isPriseDeService(p) ? 'PRISE DE SERVICE' : 'FIN DE SERVICE' }}
                      </span>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="5" class="p-8 text-center text-slate-500 font-medium">
                      Aucun pointage trouvé pour les critères sélectionnés.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL CREATE USER -->
      @if (showUserModal) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-lg p-6 bg-white shadow-2xl border-slate-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 class="text-base font-black text-[#0b3c70]">{{ authService.isAdmin() ? 'Créer un compte' : 'Créer un agent de votre unité' }}</h3>
              <button (click)="showUserModal = false" class="text-slate-400 font-bold text-lg">&times;</button>
            </div>
            <form (ngSubmit)="submitCreateUser()" class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Nom</label>
                  <input type="text" [(ngModel)]="newUser.nom" name="nom" required class="form-input text-xs">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Prénom</label>
                  <input type="text" [(ngModel)]="newUser.prenom" name="prenom" required class="form-input text-xs">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Matricule</label>
                  <input type="text" [(ngModel)]="newUser.matricule" name="matricule" placeholder="ex: ASEC-AGT-104" required class="form-input text-xs">
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Identifiant de connexion</label>
                  <input type="text" [(ngModel)]="newUser.username" name="username" placeholder="ex: agent.piste" required class="form-input text-xs">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Mot de passe</label>
                  <div class="relative">
                    <input [type]="showNewUserPassword ? 'text' : 'password'" [(ngModel)]="newUser.password" name="password" required class="form-input text-xs pr-8">
                    <button type="button" (click)="showNewUserPassword = !showNewUserPassword" class="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-700 transition focus:outline-hidden" title="Afficher/Masquer le mot de passe">
                      @if (showNewUserPassword) {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      } @else {
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      }
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Fonction</label>
                  <input type="text" [(ngModel)]="newUser.fonction" name="fonction" placeholder="ex: Contrôleur Radar" class="form-input text-xs">
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                @if (authService.isAdmin()) {
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Rôle</label>
                  <select [(ngModel)]="newUser.role" name="role" class="form-select text-xs">
                    <option value="ROLE_AGENT">Agent</option>
                    <option value="ROLE_UNIT_ADMIN">Sous-administrateur d’unité</option>
                    <option value="ROLE_ADMIN">Administrateur général</option>
                  </select>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Unité</label>
                  <select [(ngModel)]="newUser.uniteId" name="uniteId" [required]="newUser.role !== 'ROLE_ADMIN'" class="form-select text-xs">
                    <option [ngValue]="undefined" disabled>Choisir une unité</option>
                    @for (u of unites; track u.id) {
                      <option [ngValue]="u.id">{{ u.nom }}</option>
                    }
                  </select>
                </div>
                } @else {
                  <div class="col-span-2 self-end pb-2 text-xs font-semibold text-slate-600">Unité affectée : {{ authService.currentUser()?.uniteNom }}</div>
                }
              </div>
              <div class="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" (click)="showUserModal = false" class="px-4 py-2 text-xs font-semibold text-slate-700">Annuler</button>
                <button type="submit" class="btn-emerald text-xs py-2 px-5 shadow-sm">Créer l'agent</button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- MODAL CREATE UNITE -->
      @if (showUniteModal) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-md p-6 bg-white shadow-2xl border-slate-200">
            <div class="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 class="text-base font-black text-[#0b3c70]">Ajouter une Unité Opérationnelle</h3>
              <button (click)="showUniteModal = false" class="text-slate-400 font-bold text-lg">&times;</button>
            </div>
            <form (ngSubmit)="submitCreateUnite()" class="space-y-3">
              <div>
                <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Nom de l'unité</label>
                <input type="text" [(ngModel)]="newUnite.nom" name="nom" placeholder="ex: Service Télécommunications" required class="form-input text-xs">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Code Unité (Trigramme)</label>
                <input type="text" [(ngModel)]="newUnite.codeUnite" name="codeUnite" placeholder="ex: TEL, MET, TWR..." required class="form-input text-xs uppercase">
              </div>
              <div>
                <label class="block text-[11px] font-bold text-[#0b3c70] mb-1">Description</label>
                <textarea [(ngModel)]="newUnite.description" name="description" rows="3" class="form-textarea text-xs"></textarea>
              </div>
              <div class="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button type="button" (click)="showUniteModal = false" class="px-4 py-2 text-xs font-semibold text-slate-700">Annuler</button>
                <button type="submit" class="btn-emerald text-xs py-2 px-5 shadow-sm">Créer l'unité</button>
              </div>
            </form>
          </div>
        </div>
      }

    </div>
  `
})
export class AdminComponent implements OnInit, OnDestroy {
  activeTab: 'USERS' | 'UNITES' | 'POINTAGES' = 'USERS';

  users: User[] = [];
  unites: Unite[] = [];
  pointages: Pointage[] = [];

  /** Map matricule → true si l'agent a un passkey FIDO2 enrôlé */
  passkeyStatusMap: Record<string, boolean> = {};
  // Filtres Émargements
  pointageFilterUnite: number | null = null;
  pointageFilterDate: string = '';

  showUserModal = false;
  showUniteModal = false;
  showNewUserPassword = false;

  newUser = {
    matricule: '',
    username: '',
    password: '',
    nom: '',
    prenom: '',
    fonction: '',
    role: 'ROLE_AGENT' as Role,
    uniteId: undefined as number | undefined
  };

  newUnite = {
    nom: '',
    codeUnite: '',
    description: ''
  };

  private adminService = inject(AdminService);
  authService = inject(AuthService);
  private pointageService = inject(PointageService);
  private pdfExportService = inject(PdfExportService);
  private webauthnService = inject(WebauthnService);
  private wsService = inject(WebSocketService);
  private audioService = inject(AudioService);

  private feedSubscription: Subscription | null = null;

  isPriseDeService(p: Pointage): boolean {
    return p.typePointage === 'PRISE_DE_SERVICE' || p.type === 'ENTREE';
  }

  get filteredPointages(): Pointage[] {
    return this.pointages.filter(p => {
      let match = true;
      if (this.pointageFilterUnite) {
        const uId = p.user?.uniteId;
        match = match && (uId === this.pointageFilterUnite);
      }
      if (this.pointageFilterDate) {
        const rawDate = p.horodatage || p.timestamp;
        const pDate = rawDate ? String(rawDate).substring(0, 10) : '';
        match = match && (pDate === this.pointageFilterDate);
      }
      return match;
    });
  }

  ngOnInit(): void {
    this.loadUsers();
    if (this.authService.isAdmin()) {
      this.loadUnites();
      this.loadPointages();
    }

    // Abonnement en temps réel au flux global de pointages
    if (this.authService.isAdmin()) this.feedSubscription = this.wsService.subscribeToGlobalFeed().subscribe({
      next: (notif) => {
        if (notif.status === 'SUCCESS') {
          console.log('[AdminComponent] Nouveau pointage reçu en direct:', notif);
          this.audioService.playSuccessChime();
          this.loadPointages();
          if (this.activeTab === 'USERS') {
            this.loadPasskeyStatuses();
          }
        }
      },
      error: (err) => console.error('[AdminComponent] Erreur flux pointages WS:', err)
    });
  }

  ngOnDestroy(): void {
    if (this.feedSubscription) {
      this.feedSubscription.unsubscribe();
      this.feedSubscription = null;
    }
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        if (res.success) {
          this.users = res.data;
          this.loadPasskeyStatuses();
        }
      }
    });
  }

  loadPasskeyStatuses(): void {
    this.passkeyStatusMap = {};
    for (const u of this.users) {
      const code = u.matricule || u.username;
      this.webauthnService.getStatus(code).subscribe({
        next: (res) => {
          if (res.success && res.data) {
            this.passkeyStatusMap[code] = res.data.enrolled;
          }
        },
        error: () => {
          this.passkeyStatusMap[code] = false;
        }
      });
    }
  }

  loadUnites(): void {
    this.adminService.getUnites().subscribe({
      next: (res) => { if (res.success) this.unites = res.data; }
    });
  }

  loadPointages(): void {
    this.pointageService.getAllPointages().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.pointages = res.data;
          console.log('[AdminComponent] Pointages chargés:', this.pointages.length);
        }
      },
      error: (err) => {
        console.error('[AdminComponent] Erreur lors du chargement des pointages:', err);
      }
    });
  }

  downloadEmargementPdf(): void {
    const list = this.filteredPointages;
    if (list.length === 0) {
      alert("Aucun émargement à exporter pour les filtres sélectionnés.");
      return;
    }
    let uniteNom: string | undefined = undefined;
    if (this.pointageFilterUnite) {
      uniteNom = this.unites.find(u => u.id === this.pointageFilterUnite)?.nom;
    }
    this.pdfExportService.exportEmargementsPdf(list, {
      dateFilter: this.pointageFilterDate ? this.pointageFilterDate : undefined,
      uniteFilter: uniteNom
    });
  }

  downloadAgentsPdf(): void {
    if (this.users.length === 0) {
      alert("Aucun agent à exporter.");
      return;
    }
    this.pdfExportService.exportAgentsListPdf(this.users);
  }

  submitCreateUser(): void {
    const payload = this.authService.isAdmin()
      ? this.newUser
      : { ...this.newUser, role: 'ROLE_AGENT' as Role, uniteId: this.authService.currentUser()?.uniteId };
    this.adminService.createUser(payload).subscribe({
      next: (res) => {
        if (res.success) {
          this.showUserModal = false;
          this.loadUsers();
          this.newUser = {
            matricule: '',
            username: '',
            password: '',
            nom: '',
            prenom: '',
            fonction: '',
            role: 'ROLE_AGENT' as Role,
            uniteId: undefined
          };
        }
      },
      error: (err) => alert(err.error?.message || 'Erreur création utilisateur')
    });
  }

  openCreateUser(): void {
    this.newUser = {
      matricule: '', username: '', password: '', nom: '', prenom: '', fonction: '',
      role: 'ROLE_AGENT', uniteId: this.authService.isAdmin() ? undefined : this.authService.currentUser()?.uniteId
    };
    this.showUserModal = true;
  }

  resetUserPassword(user: User): void {
    const newPassword = window.prompt(`Définir un nouveau mot de passe pour ${user.prenom} ${user.nom} (minimum 6 caractères). L’ancien mot de passe ne peut pas être consulté.`);
    if (newPassword === null) return;
    if (newPassword.length < 6) {
      alert('Le mot de passe doit comporter au moins 6 caractères.');
      return;
    }
    this.adminService.resetUserPassword(user.id, newPassword).subscribe({
      next: () => alert('Mot de passe modifié. Transmettez-le directement à la personne concernée.'),
      error: (err) => alert(err.error?.message || 'Erreur lors de la réinitialisation du mot de passe.')
    });
  }

  deleteUser(id: number): void {
    if (confirm('Confirmer la suppression définitive de cet agent ?')) {
      this.adminService.deleteUser(id).subscribe({
        next: () => this.loadUsers(),
        error: (err) => alert(err.error?.message || 'Erreur suppression agent')
      });
    }
  }

  resetPasskey(user: User): void {
    const identifiant = user.matricule || user.username;
    if (confirm(`Réinitialiser la clé biométrique WebAuthn / Passkey FIDO2 de l'agent ${user.prenom} ${user.nom} (${identifiant}) ?\n\nCette action est requise si l'agent a changé de smartphone. Il pourra ensuite enrôler son nouvel appareil.`)) {
      this.webauthnService.resetPasskey(identifiant).subscribe({
        next: () => {
          this.passkeyStatusMap[identifiant] = false;
          alert(`✅ Clé WebAuthn FIDO2 réinitialisée pour l'agent ${user.prenom} ${user.nom}.`);
        },
        error: (err) => alert(err.error?.message || 'Erreur lors de la réinitialisation de la clé WebAuthn')
      });
    }
  }

  resetUserDevice(user: User): void {
    if (confirm(`Délier le smartphone pour l'agent ${user.prenom} ${user.nom} (${user.matricule}) ?\n\nCette action permettra à l'agent d'associer un nouveau téléphone lors de son prochain pointage.`)) {
      this.adminService.resetUserDevice(user.id).subscribe({
        next: () => {
          const identifiant = user.matricule || user.username;
          this.passkeyStatusMap[identifiant] = false;
          alert(`✅ Smartphone délié avec succès pour ${user.prenom} ${user.nom}.`);
          this.loadUsers();
        },
        error: (err) => alert(err.error?.message || 'Erreur lors de la réinitialisation du smartphone')
      });
    }
  }

  submitCreateUnite(): void {
    this.adminService.createUnite(this.newUnite).subscribe({
      next: (res) => {
        if (res.success) {
          this.showUniteModal = false;
          this.loadUnites();
          this.newUnite = { nom: '', codeUnite: '', description: '' };
        }
      },
      error: (err) => alert(err.error?.message || 'Erreur création unité')
    });
  }

  deleteUnite(id: number): void {
    if (confirm('Confirmer la suppression de cette unité ? (Assurez-vous quaucun agent ny soit assigné)')) {
      this.adminService.deleteUnite(id).subscribe({
        next: () => this.loadUnites(),
        error: (err) => alert(err.error?.message || 'Erreur suppression unité')
      });
    }
  }
}
