import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { Settings } from '../models/models';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  get() { return this.http.get<Settings>(`${API_URL}/settings`); }
  update(settings: Settings) { return this.http.put<Settings>(`${API_URL}/settings`, settings); }
}
