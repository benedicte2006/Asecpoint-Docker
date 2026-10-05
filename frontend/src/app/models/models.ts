export type Role = 'ROLE_ADMIN' | 'ROLE_UNIT_ADMIN' | 'ROLE_AGENT';

export interface User {
  id: number;
  matricule: string;
  username: string;
  nom: string;
  prenom: string;
  fonction?: string;
  role: Role;
  uniteId?: number;
  uniteNom?: string;
  active: boolean;
  deviceUuid?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  matricule: string;
  username: string;
  nom: string;
  prenom: string;
  role: Role;
  uniteNom?: string;
  uniteId?: number;
  deviceUuid?: string;
}

export interface QrSession {
  sessionId: string;
  token: string;
  qrUrl: string;
  expiresInSeconds: number;
  expiresAt: string;
}

export interface CheckinNotification {
  status: 'SUCCESS' | 'ERROR';
  message: string;
  agentId?: number;
  matricule?: string;
  nomComplet?: string;
  fonction?: string;
  uniteNom?: string;
  typePointage?: string;
  timestamp: string;
  sessionId: string;
}

export interface Pointage {
  id: number;
  user: User;
  horodatage?: string;
  timestamp?: string;
  typePointage?: string;
  type?: string;
  sessionId?: string;
  ipAddress?: string;
  clientIp?: string;
  userAgent?: string;
  credentialId?: string;
  deviceUuid?: string;
  createdAt?: string;
}

export interface Unite {
  id: number;
  nom: string;
  description: string;
  codeUnite: string;
  createdAt: string;
}

export interface CahierEntry {
  id: number;
  unite: Unite;
  redacteur: User;
  horodatageEvenement: string;
  titre: string;
  contenu: string;
  categorie: 'CONSIGNE' | 'INCIDENT' | 'RELÈVE_DE_QUART' | 'OPÉRATION' | 'MAINTENANCE';
  degreUrgence: 'INFO' | 'NORMAL' | 'URGENT' | 'CRITIQUE';
  photos?: string;
  createdAt: string;
  supprimeLe?: string;
  supprimePar?: User;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  nom: string;
  prenom: string;
  fonction?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface WebAuthnChallengeResponse {
  challenge: string;
  credentialId: string;
  rpId: string;
  timeout: number;
  userVerification: string;
}

export interface WebAuthnValidationRequest {
  agentCode: string;
  sessionId: string;
  token: string;
  typePointage: string;
  credentialId: string;
  clientDataJSON: string;
  authenticatorData: string;
  signature: string;
  userHandle?: string;
}

export interface WebAuthnRegisterOptionsResponse {
  challenge: string;
  rpId: string;
  rpName: string;
  userId: string;
  userName: string;
  userDisplayName: string;
  timeout: number;
  attestation: string;
}

export interface WebAuthnRegisterRequest {
  agentCode: string;
  credentialId: string;
  publicKey: string;
  deviceLabel?: string;
  clientDataJSON?: string;
  attestationObject?: string;
}

export interface WebAuthnStatusResponse {
  enrolled: boolean;
  agentCode: string;
  deviceLabel?: string;
  enrolledAt?: string;
  lastUsedAt?: string;
  signatureCount?: number;
}
