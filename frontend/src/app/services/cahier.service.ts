import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiResponse, CahierEntry } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class CahierService {
  private apiUrl = '/api/v1/cahier-de-marche';

  constructor(private http: HttpClient) {}

  getEntries(uniteId?: number): Observable<ApiResponse<CahierEntry[]>> {
    let url = this.apiUrl;
    if (uniteId) {
      url += `?uniteId=${uniteId}`;
    }
    return this.http.get<ApiResponse<CahierEntry[]>>(url);
  }

  getDeletedEntries(): Observable<ApiResponse<CahierEntry[]>> {
    return this.http.get<ApiResponse<CahierEntry[]>>(`${this.apiUrl}/suppressions`);
  }

  getEntryById(id: number): Observable<ApiResponse<CahierEntry>> {
    return this.http.get<ApiResponse<CahierEntry>>(`${this.apiUrl}/${id}`);
  }

  createEntry(payload: {
    titre: string;
    contenu: string;
    categorie: string;
    degreUrgence: string;
    uniteId?: number;
    photos?: string;
    horodatageEvenement?: string;
  }): Observable<ApiResponse<CahierEntry>> {
    return this.http.post<ApiResponse<CahierEntry>>(this.apiUrl, payload);
  }

  updateEntry(id: number, payload: {
    titre: string;
    contenu: string;
    categorie?: string;
    degreUrgence?: string;
    photos?: string;
  }): Observable<ApiResponse<CahierEntry>> {
    return this.http.put<ApiResponse<CahierEntry>>(`${this.apiUrl}/${id}`, payload);
  }

  deleteEntry(id: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.apiUrl}/${id}`);
  }
}
