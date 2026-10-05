import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import {
  ApiResponse,
  CheckinNotification,
  WebAuthnChallengeResponse,
  WebAuthnValidationRequest,
  WebAuthnRegisterOptionsResponse,
  WebAuthnRegisterRequest,
  WebAuthnStatusResponse
} from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class WebauthnService {
  private http = inject(HttpClient);
  private baseUrl = '/api/v1/pointage/webauthn';

  /**
   * Vérifie si le navigateur et le matériel supportent l'API WebAuthn / Passkeys
   */
  isSupported(): boolean {
    return !!(window && window.PublicKeyCredential && navigator.credentials);
  }

  /**
   * 1. Récupère le challenge cryptographique éphémère et le credentialId de l'agent
   */
  getChallenge(codeAgent: string): Observable<ApiResponse<WebAuthnChallengeResponse>> {
    return this.http.get<ApiResponse<WebAuthnChallengeResponse>>(`${this.baseUrl}/challenge/${encodeURIComponent(codeAgent)}`);
  }

  /**
   * Déclenche l'authentification biométrique native sur le smartphone (Face ID / Empreinte)
   * et renvoie la signature cryptographique ainsi que le Device UUID prêts pour validation
   */
  async authenticateAndSign(codeAgent: string): Promise<{
    credentialId: string;
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle?: string;
  }> {
    if (!this.isSupported()) {
      throw new Error("L'API WebAuthn n'est pas supportée par votre navigateur.");
    }

    // Étape 1 : Récupération du challenge émis par le backend Spring Boot
    const challengeRes = await firstValueFrom(this.getChallenge(codeAgent));
    if (!challengeRes.success || !challengeRes.data) {
      throw new Error(challengeRes.message || 'Impossible de récupérer le challenge WebAuthn');
    }

    const challengeData = challengeRes.data;
    const challengeBuffer = this.base64UrlToBuffer(challengeData.challenge);
    const credentialIdBuffer = this.base64UrlToBuffer(challengeData.credentialId);

    // Détection du rpId optimal (hostname actuel ou configuré par le serveur)
    const hostname = window.location.hostname;
    const rpId = (challengeData.rpId && !challengeData.rpId.includes(':') && challengeData.rpId !== 'localhost')
      ? challengeData.rpId
      : hostname;

    // Étape 2 : Appel de l'API native du navigateur pour réclamer l'empreinte / Face ID
    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge: challengeBuffer,
      rpId: rpId,
      allowCredentials: [
        {
          id: credentialIdBuffer,
          type: 'public-key',
          transports: ['internal']
        }
      ],
      userVerification: 'required', // Forcer la vérification biométrique matérielle (UV flag)
      timeout: challengeData.timeout || 60000
    };

    const credential = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("L'authentification biométrique a été refusée ou annulée.");
    }

    const response = credential.response as AuthenticatorAssertionResponse;

    // Étape 3 : Conversion des buffers binaires en chaînes Base64URL
    return {
      credentialId: credential.id,
      clientDataJSON: this.bufferToBase64Url(response.clientDataJSON),
      authenticatorData: this.bufferToBase64Url(response.authenticatorData),
      signature: this.bufferToBase64Url(response.signature),
      userHandle: response.userHandle ? this.bufferToBase64Url(response.userHandle) : undefined
    };
  }

  /**
   * 2. Envoie la signature et les paramètres de session au backend pour valider le pointage
   */
  validerPointageWebAuthn(payload: WebAuthnValidationRequest): Observable<ApiResponse<CheckinNotification>> {
    return this.http.post<ApiResponse<CheckinNotification>>(`${this.baseUrl}/valider`, payload);
  }

  /**
   * Récupère les options pour l'enrôlement initial d'un nouveau smartphone/passkey
   */
  getRegisterOptions(codeAgent: string): Observable<ApiResponse<WebAuthnRegisterOptionsResponse>> {
    return this.http.get<ApiResponse<WebAuthnRegisterOptionsResponse>>(`${this.baseUrl}/register/options/${encodeURIComponent(codeAgent)}`);
  }

  /**
   * Enrôle le smartphone de l'agent en créant une nouvelle paire de clés cryptographiques FIDO2
   */
  async registerPasskey(codeAgent: string, deviceLabel?: string): Promise<ApiResponse<any>> {
    if (!this.isSupported()) {
      throw new Error("L'authentification WebAuthn n'est pas supportée par cet appareil.");
    }

    const optionsRes = await firstValueFrom(this.getRegisterOptions(codeAgent));
    if (!optionsRes.success || !optionsRes.data) {
      throw new Error(optionsRes.message || "Impossible d'obtenir les options d'enrôlement.");
    }

    const options = optionsRes.data;
    const challengeBuffer = this.base64UrlToBuffer(options.challenge);
    const userIdBuffer = this.base64UrlToBuffer(options.userId);

    const hostname = window.location.hostname;
    const rpId = (options.rpId && !options.rpId.includes(':') && options.rpId !== 'localhost')
      ? options.rpId
      : hostname;

    const creationOptions: PublicKeyCredentialCreationOptions = {
      challenge: challengeBuffer,
      rp: {
        name: options.rpName || 'ASECNA Pointage Sécurisé',
        id: rpId
      },
      user: {
        id: userIdBuffer,
        name: options.userName,
        displayName: options.userDisplayName
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256 (ECDSA avec P-256 et SHA-256)
        { type: 'public-key', alg: -257 } // RS256 (RSA avec SHA-256)
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform', // Capteur biométrique intégré au smartphone (Secure Enclave / Keystore)
        userVerification: 'required',
        residentKey: 'preferred'
      },
      timeout: options.timeout || 60000,
      attestation: 'none'
    };

    const credential = (await navigator.credentials.create({
      publicKey: creationOptions
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error("La création de la clé biométrique a été interrompue.");
    }

    const response = credential.response as AuthenticatorAttestationResponse;

    // Extraction de la clé publique au format SPKI DER (WebAuthn L3)
    let publicKeyBase64 = '';
    if (typeof (response as any).getPublicKey === 'function') {
      const spkiBuffer = (response as any).getPublicKey();
      if (spkiBuffer) {
        publicKeyBase64 = this.bufferToBase64Url(spkiBuffer);
      }
    }

    const registerPayload: WebAuthnRegisterRequest = {
      agentCode: codeAgent,
      credentialId: credential.id,
      publicKey: publicKeyBase64,
      deviceLabel: deviceLabel || this.detectDeviceLabel(),
      clientDataJSON: this.bufferToBase64Url(response.clientDataJSON),
      attestationObject: this.bufferToBase64Url(response.attestationObject)
    };

    return await firstValueFrom(this.http.post<ApiResponse<any>>(`${this.baseUrl}/register/complete`, registerPayload));
  }

  /**
   * Vérifie si l'agent a déjà un smartphone/passkey enrôlé
   */
  getStatus(codeAgent: string): Observable<ApiResponse<WebAuthnStatusResponse>> {
    return this.http.get<ApiResponse<WebAuthnStatusResponse>>(`${this.baseUrl}/status/${encodeURIComponent(codeAgent)}`);
  }

  /**
   * Réinitialise la clé d'un agent (Action réservée aux administrateurs lors d'un changement de téléphone)
   */
  resetPasskey(codeAgent: string): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/reset/${encodeURIComponent(codeAgent)}`);
  }

  // --- Utilitaires de conversion binaires Base64URL ---

  bufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  base64UrlToBuffer(base64Url: string): ArrayBuffer {
    let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4 !== 0) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private detectDeviceLabel(): string {
    const ua = navigator.userAgent;
    if (/iPhone/i.test(ua)) return 'Apple iPhone (Face ID / Touch ID)';
    if (/iPad/i.test(ua)) return 'Apple iPad (Face ID / Touch ID)';
    if (/Android/i.test(ua)) {
      const match = ua.match(/Android[^;]+; ([^)]+)\)/);
      return match ? `Android (${match[1]})` : 'Smartphone Android';
    }
    if (/Macintosh/i.test(ua)) return 'MacBook (Touch ID)';
    if (/Windows/i.test(ua)) return 'PC Windows (Windows Hello)';
    return 'Appareil Mobile Agent';
  }
}
