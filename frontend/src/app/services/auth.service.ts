import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiResponse, AuthResponse, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/v1/auth';
  private tokenKey = 'asecna_jwt_token';
  private userKey = 'asecna_user_data';

  currentUser = signal<AuthResponse | null>(this.getStoredUser());

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<ApiResponse<AuthResponse>> {
    return this.http.post<ApiResponse<AuthResponse>>(`${this.apiUrl}/login`, credentials).pipe(
      tap(res => {
        if (res.success && res.data) {
          this.setSession(res.data);
        }
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser.set(null);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ROLE_ADMIN';
  }

  isUnitAdmin(): boolean {
    return this.currentUser()?.role === 'ROLE_UNIT_ADMIN';
  }

  canManageUnit(): boolean {
    return this.isAdmin() || this.isUnitAdmin();
  }

  isAgent(): boolean {
    return this.currentUser()?.role === 'ROLE_AGENT';
  }

  private setSession(authData: AuthResponse): void {
    localStorage.setItem(this.tokenKey, authData.token);
    localStorage.setItem(this.userKey, JSON.stringify(authData));
    this.currentUser.set(authData);
  }

  private getStoredUser(): AuthResponse | null {
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  }
}
