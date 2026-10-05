import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, Role, Unite, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private unitesUrl = '/api/v1/unites';
  private adminUrl = '/api/v1/admin';

  constructor(private http: HttpClient) { }

  getUnites(): Observable<ApiResponse<Unite[]>> {
    return this.http.get<ApiResponse<Unite[]>>(this.unitesUrl);
  }

  createUnite(unite: { nom: string; codeUnite: string; description?: string }): Observable<ApiResponse<Unite>> {
    return this.http.post<ApiResponse<Unite>>(this.unitesUrl, unite);
  }

  deleteUnite(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.unitesUrl}/${id}`);
  }

  getUsers(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.adminUrl}/users`);
  }

  createUser(user: {
    matricule: string;
    username: string;
    password: string;
    nom: string;
    prenom: string;
    fonction?: string;
    role: Role;
    uniteId?: number;
  }): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(`${this.adminUrl}/users`, user);
  }

  deleteUser(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.adminUrl}/users/${id}`);
  }

  resetUserDevice(id: number): Observable<ApiResponse<void>> {
    return this.http.post<ApiResponse<void>>(`${this.adminUrl}/users/${id}/reset-device`, {});
  }

  resetUserPassword(id: number, newPassword: string): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.adminUrl}/users/${id}/password`, { newPassword });
  }
}