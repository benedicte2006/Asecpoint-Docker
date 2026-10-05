import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DeviceService {
  private readonly DEVICE_UUID_KEY = 'asecna_device_uuid';

  /**
   * Récupère l'UUID unique du navigateur mobile ou en génère un nouveau s'il n'existe pas.
   */
  getOrCreateDeviceUuid(): string {
    let deviceUuid: string | null = null;

    // Cookies are shared by browser contexts more reliably than localStorage on mobile.
    deviceUuid = this.getCookie(this.DEVICE_UUID_KEY);

    try {
      deviceUuid = deviceUuid || localStorage.getItem(this.DEVICE_UUID_KEY);
    } catch {
      // localStorage restricted
    }

    if (!deviceUuid) {
      deviceUuid = this.getFallbackDeviceUuid();
    }

    try {
      localStorage.setItem(this.DEVICE_UUID_KEY, deviceUuid);
    } catch {
      // Ignore
    }

    this.setCookie(this.DEVICE_UUID_KEY, deviceUuid, 3650);

    return deviceUuid;
  }

  private setCookie(name: string, value: string, days: number): void {
    try {
      const d = new Date();
      d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
      document.cookie = `${name}=${encodeURIComponent(value)};expires=${d.toUTCString()};max-age=${days * 24 * 60 * 60};path=/;SameSite=Lax`;
    } catch {
      // Ignore
    }
  }

  private getCookie(name: string): string | null {
    try {
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      return match ? decodeURIComponent(match[3]) : null;
    } catch {
      return null;
    }
  }

  private generateUuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  private getFallbackDeviceUuid(): string {
    const fingerprint = [
      navigator.userAgent,
      navigator.platform,
      navigator.language,
      `${screen.width}x${screen.height}x${screen.colorDepth}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ].join('|');

    let hash = 0;
    for (let index = 0; index < fingerprint.length; index++) {
      hash = (hash * 31 + fingerprint.charCodeAt(index)) | 0;
    }

    return `WEB-FALLBACK-${Math.abs(hash).toString(16)}`;
  }
}