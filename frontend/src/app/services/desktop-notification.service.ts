import { Injectable, signal, inject } from '@angular/core';
import { CheckinNotification } from '../models/models';
import { AudioService } from './audio.service';

export interface ToastNotification {
  id: string;
  title: string;
  nomComplet: string;
  matricule?: string;
  uniteNom?: string;
  timestamp: string;
}

@Injectable({
  providedIn: 'root'
})
export class DesktopNotificationService {
  private audioService = inject(AudioService);

  permissionState = signal<NotificationPermission | 'unsupported'>('default');
  activeToast = signal<ToastNotification | null>(null);

  private lastNotifiedKey = '';
  private lastNotifiedTime = 0;
  private toastTimeout: any = null;

  constructor() {
    this.checkPermission();
  }

  checkPermission(): void {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      this.permissionState.set(Notification.permission);
    } else {
      this.permissionState.set('unsupported');
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        this.permissionState.set(perm);
        return perm === 'granted';
      } catch (e) {
        console.warn('Erreur demande permission notification:', e);
        return false;
      }
    }
    return false;
  }

  notifyCheckin(notif: CheckinNotification, playAudio = true): void {
    if (notif.status !== 'SUCCESS') return;

    // Déduplication : ignorer les doublons reçus dans une fenêtre de 3 secondes
    const key = `${notif.matricule || notif.agentId || 'agent'}_${notif.sessionId || notif.timestamp}`;
    const now = Date.now();
    if (this.lastNotifiedKey === key && now - this.lastNotifiedTime < 3000) {
      return;
    }
    this.lastNotifiedKey = key;
    this.lastNotifiedTime = now;

    if (playAudio) {
      this.audioService.playSuccessChime();
    }

    const title = `Pointage Validé : ${notif.nomComplet || 'Agent ASECNA'}`;
    const timeStr = notif.timestamp
      ? new Date(notif.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      : new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const body = `${notif.fonction || 'Agent'} — Unité : ${notif.uniteNom || 'ASECNA'}\nMatricule : ${notif.matricule || 'N/A'} | ${timeStr}`;

    // 1. Notification Système / Bureau native (Windows, Linux, macOS)
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const sysNotif = new Notification(title, {
          body: body,
          icon: '/assets/logo-asecna.png',
          badge: '/assets/logo-asecna.png',
          tag: `checkin-${key}`
        });
        sysNotif.onclick = () => {
          window.focus();
          sysNotif.close();
        };
      } catch (err) {
        console.warn('Impossible d\'afficher la notification système:', err);
      }
    }

    // 2. Toast visuel flottant sur l'écran du PC
    this.showInAppToast({
      id: key,
      title: 'Pointage Validé en Temps Réel',
      nomComplet: notif.nomComplet || 'Agent',
      matricule: notif.matricule,
      uniteNom: notif.uniteNom,
      timestamp: timeStr
    });
  }

  private showInAppToast(toast: ToastNotification): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.activeToast.set(toast);
    this.toastTimeout = setTimeout(() => {
      this.activeToast.set(null);
    }, 6000);
  }

  dismissToast(): void {
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.activeToast.set(null);
  }
}
