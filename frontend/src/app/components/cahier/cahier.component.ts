import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CahierService } from '../../services/cahier.service';
import { AdminService } from '../../services/admin.service';
import { AuthService } from '../../services/auth.service';
import { PdfExportService } from '../../services/pdf-export.service';
import { CahierEntry, Unite } from '../../models/models';

@Component({
  selector: 'app-cahier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      <!-- Top Header & Action -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div class="flex items-center gap-3">
            <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-10 h-10 object-contain drop-shadow-sm">
            <h1 class="text-2xl sm:text-3xl font-black text-[#0b3c70]">Cahier de Marche Électronique</h1>
          </div>
          <p class="text-xs text-slate-500 mt-1 font-medium">Journal de quart, consignes opérationnelles et main courante ASECPoint</p>
        </div>

        <div class="flex items-center gap-2.5 flex-wrap">
          @if (authService.isAdmin()) {
            <select [(ngModel)]="selectedUniteId" (change)="loadEntries()" class="form-select text-xs py-2.5 w-48 shadow-sm font-medium">
              <option [ngValue]="null">Toutes les Unités</option>
              @for (u of unites; track u.id) {
                <option [ngValue]="u.id">{{ u.nom }} ({{ u.codeUnite }})</option>
              }
            </select>
          }
          @if (authService.canManageUnit()) {
            <button (click)="toggleDeletedEntries()" class="px-3.5 py-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-xs font-bold text-amber-900 border border-amber-200">
              {{ showDeletedEntries ? 'Masquer les suppressions' : 'Historique suppressions' }}
            </button>
          }

          <!-- Button to download PDF -->
          <button (click)="downloadCahierPdf()" class="px-3.5 py-2.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-xs font-bold text-[#0b3c70] border border-sky-200 shadow-xs inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>Télécharger Cahier (PDF)</span>
          </button>

          <!-- Button to open new entry modal -->
          <button (click)="openModal()" class="btn-emerald text-xs whitespace-nowrap shadow-md inline-flex items-center gap-1.5 py-2.5">
            <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <span>Rédiger une entrée</span>
          </button>
        </div>
      </div>

      <!-- Permission Reminder Notice -->
      <div class="mb-6 p-4 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-center justify-between shadow-xs">
        <div class="flex items-center gap-2.5">
          <svg class="w-4 h-4 text-sky-700 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
          <span>
            <strong>Règles de traçabilité :</strong> Tous les agents habilités peuvent consigner des observations et consignes de service.
            Seul l'administrateur possède le droit de modification et d'archivage/suppression.
          </span>
        </div>
        <span class="badge-agent" *ngIf="authService.isAgent()">Agent Connecté</span>
        <span class="badge-admin" *ngIf="authService.canManageUnit()">{{ authService.isAdmin() ? 'Administrateur' : 'Administrateur d’unité' }}</span>
      </div>

      @if (showDeletedEntries && authService.canManageUnit()) {
        <section class="mb-6 border border-amber-200 bg-amber-50/50 p-5 rounded-lg">
          <div class="flex items-center justify-between gap-3 mb-3">
            <h2 class="text-base font-black text-slate-800">Historique des suppressions</h2>
            <span class="text-xs font-semibold text-amber-900">{{ deletedEntries.length }} entrée(s)</span>
          </div>
          @if (deletedEntries.length === 0) {
            <p class="text-xs text-slate-600">Aucune entrée supprimée.</p>
          } @else {
            <div class="space-y-3">
              @for (entry of deletedEntries; track entry.id) {
                <article class="border border-amber-200 bg-white p-4 rounded-md">
                  <div class="flex flex-wrap justify-between gap-2 text-xs">
                    <strong class="text-slate-800">{{ entry.titre }}</strong>
                    <span class="text-slate-600">Supprimée le {{ entry.supprimeLe | date:'dd/MM/yyyy à HH:mm' }}</span>
                  </div>
                  <p class="mt-1 text-xs text-slate-700 whitespace-pre-wrap">{{ getVisibleContent(entry.contenu) }}</p>
                  <p class="mt-2 text-[11px] text-slate-600">
                    Unité : {{ entry.unite.nom || 'Unité Générale' }} · Par : {{ entry.supprimePar?.prenom }} {{ entry.supprimePar?.nom }} ({{ entry.supprimePar?.username }})
                  </p>
                </article>
              }
            </div>
          }
        </section>
      }

      <!-- Log Entries Grid / Timeline -->
      <div class="space-y-4">
        @if (loading) {
          <div class="text-center py-16 text-slate-500 text-sm">
            <div class="w-8 h-8 border-3 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Chargement du cahier de marche...
          </div>
        } @else if (entries.length === 0) {
          <div class="glass-panel p-12 text-center text-slate-500 bg-white">
            <p class="text-base font-bold text-slate-700">Aucune entrée consignée pour le moment.</p>
            <p class="text-xs mt-1">Soyez le premier à inscrire une note de service.</p>
          </div>
        } @else {
          @for (entry of entries; track entry.id) {
            <div class="glass-card p-5 relative border-l-4 bg-white" [ngClass]="getUrgenceBorder(entry.degreUrgence)">
              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold tracking-wider uppercase" [ngClass]="getCategorieBadge(entry.categorie)">
                    {{ entry.categorie }}
                  </span>
                  <span class="px-2 py-0.5 rounded-md text-[10px] font-black uppercase" [ngClass]="getUrgenceBadge(entry.degreUrgence)">
                    {{ entry.degreUrgence }}
                  </span>
                  <span class="text-xs font-bold text-[#0b3c70] bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                    {{ entry.unite?.nom || 'Unité Générale' }}
                  </span>
                </div>

                <div class="text-xs text-slate-500 font-mono font-medium">
                  {{ entry.horodatageEvenement | date:'dd/MM/yyyy à HH:mm' }}
                </div>
              </div>

              <h3 class="text-base font-extrabold text-slate-900 mb-2">{{ entry.titre }}</h3>
              <p class="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{{ getVisibleContent(entry.contenu) }}</p>

              <!-- Photos jointes -->
              @if (getPhotos(entry.photos).length > 0) {
                <div class="mt-3 pt-2">
                  <div class="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 mb-2">
                    <svg class="w-3.5 h-3.5 text-sky-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Pièces jointes / Photos ({{ getPhotos(entry.photos).length }}) :</span>
                  </div>
                  <div class="flex flex-wrap gap-2.5">
                    @for (photo of getPhotos(entry.photos); track $index) {
                      <div (click)="openLightbox(photo)" 
                           class="group relative w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-pointer shadow-xs hover:shadow-md hover:border-sky-400 transition">
                        <img [src]="photo" alt="Photo jointe" class="w-full h-full object-cover group-hover:scale-105 transition duration-200">
                        <div class="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center transition">
                          <svg class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition drop-shadow-sm" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                          </svg>
                        </div>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Footer: Redactor & Admin actions -->
              <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <div class="flex items-center gap-2">
                  <span class="w-6 h-6 rounded-full bg-blue-100 text-[#0b3c70] flex items-center justify-center font-bold text-[10px] border border-blue-200">
                    {{ entry.redacteur?.prenom?.[0] }}{{ entry.redacteur?.nom?.[0] }}
                  </span>
                  <span>Rédigé par : <strong class="text-slate-800 font-semibold">{{ entry.redacteur?.prenom }} {{ entry.redacteur?.nom }}</strong> ({{ entry.redacteur?.matricule }})</span>
                </div>

                <!-- Admin Only Actions -->
                @if (authService.canManageUnit()) {
                  <div class="flex items-center gap-2">
                    <button (click)="deleteEntry(entry.id)" class="btn-danger text-[10px] py-1 px-2.5">
                      Supprimer
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        }
      </div>

      <!-- Modal Rédiger une entrée -->
      @if (showModal) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="glass-panel w-full max-w-lg p-6 relative bg-white shadow-2xl border-slate-200 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between pb-4 border-b border-slate-200 mb-4">
              <h3 class="text-lg font-black text-[#0b3c70]">Consigner une entrée de service</h3>
              <button (click)="closeModal()" class="text-slate-400 hover:text-slate-700 text-xl font-bold">&times;</button>
            </div>

            <form (ngSubmit)="submitEntry()" class="space-y-4">
              <div>
                <label class="block text-xs font-bold text-[#0b3c70] mb-1">Titre de l'événement / Note</label>
                <input type="text" [(ngModel)]="newEntry.titre" name="titre" required placeholder="ex: Relève de quart, Panne Radio VHF, Inspection piste..." class="form-input text-xs">
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] mb-1">Catégorie</label>
                  <select [(ngModel)]="newEntry.categorie" name="categorie" class="form-select text-xs">
                    <option value="RELÈVE_DE_QUART">Relève de quart</option>
                    <option value="CONSIGNE">Consigne de service</option>
                    <option value="INCIDENT">Incident / Événement</option>
                    <option value="OPÉRATION">Opération spéciale</option>
                    <option value="MAINTENANCE">Maintenance / Intervention</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] mb-1">Degré d'urgence</label>
                  <select [(ngModel)]="newEntry.degreUrgence" name="degreUrgence" class="form-select text-xs">
                    <option value="INFO">Information</option>
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                    <option value="CRITIQUE">Critique</option>
                  </select>
                </div>
              </div>

              @if (authService.isAdmin()) {
                <div>
                  <label class="block text-xs font-bold text-[#0b3c70] mb-1">Unité concernée</label>
                  <select [(ngModel)]="newEntry.uniteId" name="uniteId" class="form-select text-xs">
                    <option [ngValue]="undefined">Mon unité par défaut</option>
                    @for (u of unites; track u.id) {
                      <option [ngValue]="u.id">{{ u.nom }} ({{ u.codeUnite }})</option>
                    }
                  </select>
                </div>
              }

              <div>

                <label class="block text-xs font-bold text-[#0b3c70] mb-1">Contenu détaillé & observations</label>
                <textarea [(ngModel)]="newEntry.contenu" name="contenu" required rows="4" placeholder="Détails opérationnels, conditions météo, paramètres techniques, actions entreprises..." class="form-textarea text-xs"></textarea>
              </div>

              <!-- Upload de Photos -->
              <div>
                <label class="block text-xs font-bold text-[#0b3c70] mb-1.5 flex items-center justify-between">
                  <span class="inline-flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5 text-[#0b3c70]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <span>Photos & Justificatifs opérationnels</span>
                  </span>
                  <span class="text-[10px] font-normal text-slate-500">Max 5 photos (PNG, JPG)</span>
                </label>

                <div class="flex items-center gap-2 mb-2">
                  <input type="file" #photoInput (change)="onFileSelected($event)" accept="image/*" multiple class="hidden">
                  <button type="button" (click)="photoInput.click()" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-xs font-bold text-[#0b3c70] transition shadow-xs cursor-pointer">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Ajouter des photos</span>
                  </button>
                  @if (attachedPhotos.length > 0) {
                    <span class="text-[11px] text-emerald-600 font-semibold">{{ attachedPhotos.length }} photo(s) sélectionnée(s)</span>
                  }
                </div>

                <!-- Aperçu des photos sélectionnées -->
                @if (attachedPhotos.length > 0) {
                  <div class="flex flex-wrap gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    @for (photo of attachedPhotos; track $index) {
                      <div class="relative w-16 h-16 rounded-md overflow-hidden border border-slate-300 bg-white group shadow-xs">
                        <img [src]="photo" alt="Aperçu photo" class="w-full h-full object-cover">
                        <button type="button" (click)="removePhoto($index)" class="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs font-bold opacity-90 hover:opacity-100 shadow-sm cursor-pointer" title="Supprimer">
                          &times;
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="flex justify-end gap-3 pt-3 border-t border-slate-200">
                <button type="button" (click)="closeModal()" class="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 cursor-pointer">
                  Annuler
                </button>
                <button type="submit" [disabled]="submitting" class="btn-emerald text-xs py-2 px-5 shadow-sm cursor-pointer">
                  {{ submitting ? 'Enregistrement...' : 'Enregistrer au journal' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Visionneuse de photo plein écran (Lightbox) -->
      @if (lightboxPhoto) {
        <div (click)="closeLightbox()" class="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div (click)="$event.stopPropagation()" class="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center p-2">
            <button (click)="closeLightbox()" class="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/70 text-white hover:bg-black flex items-center justify-center text-lg font-bold transition cursor-pointer">
              &times;
            </button>
            <img [src]="lightboxPhoto" alt="Photo plein écran" class="max-w-full max-h-[85vh] object-contain rounded-lg">
          </div>
        </div>
      }

    </div>
  `
})
export class CahierComponent implements OnInit {
  entries: CahierEntry[] = [];
  deletedEntries: CahierEntry[] = [];
  unites: Unite[] = [];
  selectedUniteId: number | null = null;
  loading = true;
  showModal = false;
  submitting = false;
  showDeletedEntries = false;
  attachedPhotos: string[] = [];
  lightboxPhoto: string | null = null;

  newEntry = {
    titre: '',
    contenu: '',
    categorie: 'RELÈVE_DE_QUART',
    degreUrgence: 'NORMAL',
    uniteId: undefined as number | undefined
  };

  cahierService = inject(CahierService);
  adminService = inject(AdminService);
  authService = inject(AuthService);
  pdfExportService = inject(PdfExportService);

  downloadCahierPdf(): void {
    if (this.entries.length === 0) {
      alert('Aucune entrée dans le cahier de marche à exporter.');
      return;
    }
    let uniteNom: string | undefined = undefined;
    if (this.selectedUniteId) {
      uniteNom = this.unites.find(u => u.id === this.selectedUniteId)?.nom;
    }
    this.pdfExportService.exportCahierDeMarchePdf(this.entries, uniteNom);
  }

  ngOnInit(): void {
    if (this.authService.isAdmin()) {
      this.loadUnites();
    } else {
      this.selectedUniteId = this.authService.currentUser()?.uniteId ?? null;
    }
    this.loadEntries();
  }

  toggleDeletedEntries(): void {
    this.showDeletedEntries = !this.showDeletedEntries;
    if (this.showDeletedEntries) {
      this.loadDeletedEntries();
    }
  }

  private loadDeletedEntries(): void {
    this.cahierService.getDeletedEntries().subscribe({
      next: (res) => {
        if (res.success) this.deletedEntries = res.data;
      },
      error: () => alert('Impossible de charger l’historique des suppressions.')
    });
  }

  loadUnites(): void {
    this.adminService.getUnites().subscribe({
      next: (res) => {
        if (res.success) this.unites = res.data;
      }
    });
  }

  loadEntries(): void {
    this.loading = true;
    this.cahierService.getEntries(this.selectedUniteId || undefined).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) this.entries = res.data;
      },
      error: () => this.loading = false
    });
  }

  openModal(): void {
    this.attachedPhotos = [];
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.attachedPhotos = [];
    this.newEntry = {
      titre: '',
      contenu: '',
      categorie: 'RELÈVE_DE_QUART',
      degreUrgence: 'NORMAL',
      uniteId: undefined
    };
  }

  openLightbox(photo: string): void {
    this.lightboxPhoto = photo;
  }

  closeLightbox(): void {
    this.lightboxPhoto = null;
  }

  removePhoto(index: number): void {
    this.attachedPhotos.splice(index, 1);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const files = Array.from(input.files);
    const maxAllowed = 5 - this.attachedPhotos.length;
    if (maxAllowed <= 0) {
      alert('Vous ne pouvez pas ajouter plus de 5 photos par entrée.');
      input.value = '';
      return;
    }

    const filesToProcess = files.slice(0, maxAllowed);
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) continue;
      this.compressAndAddImage(file);
    }
    input.value = '';
  }

  private compressAndAddImage(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const maxDim = 1280;
        let width = img.width;
        let height = img.height;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        this.attachedPhotos.push(compressedDataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  getPhotos(photosStr?: string): string[] {
    if (!photosStr) return [];
    try {
      if (photosStr.startsWith('[')) {
        const parsed = JSON.parse(photosStr);
        return Array.isArray(parsed) ? parsed : [];
      } else if (photosStr.startsWith('data:')) {
        return [photosStr];
      }
    } catch {
      return [];
    }
    return [];
  }

  getVisibleContent(content?: string): string {
    return (content || '').split(/\r?\n/)
      .filter(line => !/^\s*(Authentification|Adresse IP)\s*:/i.test(line))
      .join('\n');
  }

  submitEntry(): void {
    if (!this.newEntry.titre || !this.newEntry.contenu) return;

    this.submitting = true;
    const payload = {
      ...this.newEntry,
      photos: this.attachedPhotos.length > 0 ? JSON.stringify(this.attachedPhotos) : undefined
    };

    this.cahierService.createEntry(payload).subscribe({
      next: (res) => {
        this.submitting = false;
        if (res.success) {
          this.closeModal();
          this.loadEntries();
        }
      },
      error: (err) => {
        this.submitting = false;
        alert(err.error?.message || 'Erreur lors de la création');
      }
    });
  }

  deleteEntry(id: number): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette entrée du cahier de marche ?')) {
      this.cahierService.deleteEntry(id).subscribe({
        next: () => {
          this.loadEntries();
          if (this.showDeletedEntries) this.loadDeletedEntries();
        },
        error: (err) => alert(err.error?.message || 'Erreur lors de la suppression')
      });
    }
  }

  getCategorieBadge(cat: string): string {
    switch (cat) {
      case 'RELÈVE_DE_QUART': return 'bg-sky-100 text-sky-900 border border-sky-300';
      case 'INCIDENT': return 'bg-rose-100 text-rose-900 border border-rose-300';
      case 'MAINTENANCE': return 'bg-purple-100 text-purple-900 border border-purple-300';
      case 'OPÉRATION': return 'bg-amber-100 text-amber-900 border border-amber-300';
      default: return 'bg-slate-100 text-slate-800';
    }
  }

  getUrgenceBadge(urg: string): string {
    switch (urg) {
      case 'CRITIQUE': return 'bg-rose-600 text-white font-black';
      case 'URGENT': return 'bg-amber-600 text-white font-bold';
      case 'INFO': return 'bg-sky-100 text-sky-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  }

  getUrgenceBorder(urg: string): string {
    switch (urg) {
      case 'CRITIQUE': return 'border-rose-500 bg-rose-50/30';
      case 'URGENT': return 'border-amber-500 bg-amber-50/30';
      default: return 'border-sky-500/80';
    }
  }
}
