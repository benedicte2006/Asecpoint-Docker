import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, ChangePasswordRequest, UpdateProfileRequest, User } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = '/api/v1/profile';

  constructor(private http: HttpClient) { }

  getMyProfile(): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`);
  }

  updateProfile(request: UpdateProfileRequest): Observable<ApiResponse<User>> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/update`, request);
  }

  changePassword(request: ChangePasswordRequest): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.apiUrl}/change-password`, request);
  }
}