import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CheckinNotification, Pointage, QrSession } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class PointageService {
  private qrUrl = '/api/v1/qr-session';
  private pointageUrl = '/api/v1/pointage';

  constructor(private http: HttpClient) {}

  generateQrSession(): Observable<ApiResponse<QrSession>> {
    return this.http.get<ApiResponse<QrSession>>(`${this.qrUrl}/generate`);
  }

  autoCheckin(
    sessionId: string,
    token: string,
    typePointage: string = 'PRISE_DE_SERVICE',
    password: string = '',
    deviceUuid: string = ''
  ): Observable<ApiResponse<CheckinNotification>> {
    return this.http.post<ApiResponse<CheckinNotification>>(`${this.pointageUrl}/auto-checkin`, {
      sessionId,
      token,
      typePointage,
      password,
      deviceUuid
    });
  }

  getMyHistory(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.pointageUrl}/history`);
  }

  getAllPointages(): Observable<ApiResponse<Pointage[]>> {
    return this.http.get<ApiResponse<Pointage[]>>(`${this.pointageUrl}/all`);
  }
}
