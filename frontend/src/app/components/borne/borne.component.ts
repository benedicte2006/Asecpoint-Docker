import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import * as QRCode from 'qrcode';
import { PointageService } from '../../services/pointage.service';
import { WebSocketService } from '../../services/websocket.service';
import { AudioService } from '../../services/audio.service';
import { DesktopNotificationService } from '../../services/desktop-notification.service';
import { CheckinNotification, QrSession } from '../../models/models';

@Component({
  selector: 'app-borne',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-[calc(100vh-5rem)] flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
      
      <!-- Top Status Banner -->
      <div class="w-full max-w-4xl flex items-center justify-between mb-6 glass-card px-6 py-3 border-sky-100 bg-white shadow-sm flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <div class="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
          <span class="text-xs font-mono font-bold uppercase tracking-wider text-emerald-700">Borne Active & Connectée</span>
        </div>
        <div class="flex items-center gap-4">
          @if (desktopNotifService.permissionState() === 'granted') {
            <div class="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <svg class="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span class="font-medium">Notifications PC actives</span>
            </div>
          } @else if (desktopNotifService.permissionState() === 'default') {
            <button (click)="requestNotificationPermission()" class="flex items-center gap-1.5 text-xs text-sky-800 bg-sky-100 hover:bg-sky-200 px-3 py-1 rounded-full border border-sky-300 font-bold transition cursor-pointer">
              <svg class="w-3.5 h-3.5 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
              <span>Activer les notifications PC</span>
            </button>
          }
          <div class="text-xs font-mono text-slate-500">
            <span>Horloge UTC : </span>
            <span class="text-[#0b3c70] font-bold">{{ currentTime }}</span>
          </div>
        </div>
      </div>

      <!-- Main Borne Card -->
      <div class="glass-panel w-full max-w-4xl p-6 sm:p-10 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 shadow-xl bg-white border-slate-200">
        
        <!-- Left Side: Instructions & Info -->
        <div class="flex-1 space-y-6 text-left">
          
          <div class="flex items-center gap-3">
            <img src="assets/logo-asecna.png" alt="ASECNA" class="w-12 h-12 object-contain drop-shadow-sm">
            <div>
              <span class="px-3 py-0.5 rounded-full bg-sky-100 text-[#0b3c70] text-xs font-bold uppercase tracking-wider border border-sky-200">
                Pointage Sans Contact 100% Automatique
              </span>
            </div>
          </div>

          <h1 class="text-3xl sm:text-4xl font-black tracking-tight text-[#0b3c70] leading-tight">
            Scannez pour valider votre <span class="bg-clip-text text-transparent bg-gradient-to-r from-sky-600 via-blue-700 to-amber-600">Prise de Service</span>
          </h1>

          <div class="space-y-4 pt-2">
            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#0b3c70] font-bold flex items-center justify-center border border-blue-200 shrink-0 shadow-sm">1</div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Ouvrez l'appareil photo</h4>
                <p class="text-xs text-slate-600 mt-0.5">Pointez l'objectif de votre smartphone vers le QR code affiché ci-contre.</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center border border-emerald-200 shrink-0 shadow-sm">2</div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Touchez la notification du lien</h4>
                <p class="text-xs text-slate-600 mt-0.5">Le pointage s'enregistre <strong class="text-emerald-700">instantanément dès l'ouverture</strong> sans aucun clic supplémentaire.</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 font-bold flex items-center justify-center border border-amber-200 shrink-0 shadow-sm">3</div>
              <div>
                <h4 class="text-sm font-bold text-slate-900">Confirmation Immédiate</h4>
                <p class="text-xs text-slate-600 mt-0.5">L'écran de la borne s'actualise au même millième de seconde pour confirmer votre émargement.</p>
              </div>
            </div>
          </div>

          <!-- Countdown and refresh -->
          <div class="pt-4 flex items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-100">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full" [ngClass]="countdown < 10 ? 'bg-amber-500 animate-ping' : 'bg-sky-500'"></div>
              <span>Rotation du QR code dans : <strong class="text-[#0b3c70] font-bold">{{ countdown }}s</strong></span>
            </div>
            <button (click)="loadNewQrSession()" class="text-sky-600 hover:text-sky-800 font-semibold underline cursor-pointer">
              Actualiser
            </button>
          </div>
        </div>

        <!-- Right Side: The QR Code Display -->
        <div class="w-full md:w-80 flex flex-col items-center justify-center">
          <div class="relative p-5 rounded-2xl bg-white shadow-xl border-2 border-slate-200 glow-blue flex flex-col items-center justify-center">
            
            <!-- Laser Scan Animation -->
            <div class="scan-laser" *ngIf="!activeSuccess"></div>

            <canvas #qrCanvas class="w-64 h-64 rounded-xl"></canvas>

            <div class="mt-3 text-center">
              <span class="text-[11px] font-mono font-extrabold text-[#0b3c70] tracking-wider uppercase bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                Code Unique Éphémère
              </span>
            </div>
          </div>
        </div>

        <!-- Live Instant Check-in Celebration Overlay -->
        @if (activeSuccess) {
          <div class="absolute inset-0 bg-white/98 backdrop-blur-xl z-20 flex flex-col items-center justify-center p-8 text-center animate-fade-in shadow-2xl">
            
            <img src="assets/logo-asecna.png" alt="Logo ASECNA" class="w-20 h-20 mb-3 object-contain drop-shadow">

            @if (activeSuccess.typePointage === 'FIN_DE_SERVICE') {
              <div class="w-20 h-20 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-500 flex items-center justify-center mb-3 glow-amber animate-bounce">
                <svg class="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                  <line x1="12" y1="2" x2="12" y2="12"></line>
                </svg>
              </div>

              <span class="px-4 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold uppercase tracking-wider mb-2 border border-amber-300">
                Fin de Service Enregistrée
              </span>

              <h2 class="text-3xl sm:text-4xl font-black text-[#0b3c70] mb-1">
                Bon repos, {{ activeSuccess.nomComplet }}
              </h2>
            } @else {
              <div class="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-500 flex items-center justify-center mb-3 glow-emerald animate-bounce">
                <svg class="w-10 h-10 stroke-current" viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>

              <span class="px-4 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-extrabold uppercase tracking-wider mb-2 border border-emerald-300">
                Prise de Service Enregistrée
              </span>

              <h2 class="text-3xl sm:text-4xl font-black text-[#0b3c70] mb-1">
                Bienvenue, {{ activeSuccess.nomComplet }}
              </h2>
            }

            <p class="text-sm font-bold text-sky-700 mb-4">
              {{ activeSuccess.fonction || 'Agent ASECNA' }}
            </p>

            <div class="grid grid-cols-2 gap-3 max-w-sm w-full bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs mb-6 shadow-inner">
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-bold">Matricule</span>
                <span class="font-mono font-extrabold text-[#0b3c70] text-sm">{{ activeSuccess.matricule }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-[10px] uppercase font-bold">Unité / Service</span>
                <span class="font-bold text-sky-700">{{ activeSuccess.uniteNom }}</span>
              </div>
              <div class="col-span-2 pt-2 border-t border-slate-200">
                <span class="text-slate-500 block text-[10px] uppercase font-bold">Horodatage de Service</span>
                <span class="font-mono text-emerald-700 font-bold">{{ activeSuccess.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</span>
              </div>
            </div>

            <p class="text-xs text-slate-500 font-mono">
              Génération du prochain QR code dans quelques secondes...
            </p>
          </div>
        }

      </div>
    </div>
  `
})
export class BorneComponent implements OnInit, OnDestroy {
  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  currentSession: QrSession | null = null;
  resolvedQrUrl = '';
  activeSuccess: CheckinNotification | null = null;
  countdown = 60;
  currentTime = '';

  private pointageService = inject(PointageService);
  private wsService = inject(WebSocketService);
  private audioService = inject(AudioService);
  desktopNotifService = inject(DesktopNotificationService);

  private wsSubscription: Subscription | null = null;
  private globalWsSubscription: Subscription | null = null;
  private timerSubscription: Subscription | null = null;
  private clockSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.updateClock();
    this.clockSubscription = interval(1000).subscribe(() => this.updateClock());
    this.loadNewQrSession();
    // Demander poliment l'activation des notifications PC dès l'accès à la borne
    this.desktopNotifService.requestPermission();

    // Abonnement global permanent pour garantir la réception même si le QR code a tourné
    this.globalWsSubscription = this.wsService.subscribeToGlobalFeed().subscribe({
      next: (notification) => {
        if (notification.status === 'SUCCESS' && !this.activeSuccess) {
          this.handleInstantScanSuccess(notification);
        }
      },
      error: (err) => console.error('[Borne] Erreur global WS:', err)
    });
  }

  requestNotificationPermission(): void {
    this.desktopNotifService.requestPermission();
  }

  ngOnDestroy(): void {
    this.cleanupSubscriptions();
    if (this.clockSubscription) this.clockSubscription.unsubscribe();
    if (this.globalWsSubscription) {
      this.globalWsSubscription.unsubscribe();
      this.globalWsSubscription = null;
    }
  }

  private updateClock(): void {
    const d = new Date();
    this.currentTime = d.toUTCString().replace('GMT', 'UTC');
  }

  loadNewQrSession(): void {
    this.cleanupSubscriptions();
    this.activeSuccess = null;

    this.pointageService.generateQrSession().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.currentSession = res.data;
          this.countdown = res.data.expiresInSeconds || 60;

          // Si la borne est ouverte avec "localhost" ou "127.0.0.1", utiliser l'URL réseau configurée par le backend (ex: 192.168.1.90)
          // Sinon, si ouverte directement via une IP réseau ou Ngrok, utiliser cette adresse d'accès
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          if (isLocalhost && res.data.qrUrl && !res.data.qrUrl.includes('localhost') && !res.data.qrUrl.includes('127.0.0.1')) {
            this.resolvedQrUrl = res.data.qrUrl;
          } else {
            this.resolvedQrUrl = `${window.location.origin}/scan?session=${res.data.sessionId}&token=${res.data.token}`;
          }

          this.renderQrCode(this.resolvedQrUrl);
          this.subscribeToStomp(res.data.sessionId);
          this.startCountdownTimer();
        }
      },
      error: (err) => {
        console.error('Erreur génération session QR:', err);
        setTimeout(() => this.loadNewQrSession(), 5000);
      }
    });
  }

  private renderQrCode(url: string): void {
    setTimeout(() => {
      if (this.qrCanvas && this.qrCanvas.nativeElement) {
        QRCode.toCanvas(this.qrCanvas.nativeElement, url, {
          width: 250,
          margin: 1,
          color: {
            dark: '#0b3c70',
            light: '#ffffff'
          }
        }, (error: Error | null | undefined) => {
          if (error) console.error('Erreur rendu QR code:', error);
        });
      }
    }, 50);
  }

  private subscribeToStomp(sessionId: string): void {
    this.wsSubscription = this.wsService.subscribeToSession(sessionId).subscribe({
      next: (notification) => {
        if (notification.status === 'SUCCESS') {
          this.handleInstantScanSuccess(notification);
        }
      },
      error: (err) => {
        console.error('Erreur STOMP subscription:', err);
      }
    });
  }

  private handleInstantScanSuccess(notification: CheckinNotification): void {
    this.activeSuccess = notification;
    // Déclenche la notification bureau native + toast visuel + carillon sonore
    this.desktopNotifService.notifyCheckin(notification, true);

    if (this.timerSubscription) this.timerSubscription.unsubscribe();

    setTimeout(() => {
      this.loadNewQrSession();
    }, 3500);
  }

  private startCountdownTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        this.loadNewQrSession();
      }
    });
  }

  private cleanupSubscriptions(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
      this.wsSubscription = null;
    }
    if (this.timerSubscription) {
      this.timerSubscription.unsubscribe();
      this.timerSubscription = null;
    }
  }
}
