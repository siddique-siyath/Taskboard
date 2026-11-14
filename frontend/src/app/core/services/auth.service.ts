import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { API_URL } from '../api.config';
import { LoginResponse } from '../models/models';
import { NotificationService } from './notification.service';

const TOKEN_KEY = 'taskboard_token';
const USER_KEY = 'taskboard_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly notify = inject(NotificationService);

  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly userSignal = signal<LoginResponse['user'] | null>(this.readUser());

  readonly isLoggedIn = computed(() => !!this.tokenSignal());
  readonly user = this.userSignal.asReadonly();

  get token(): string | null { return this.tokenSignal(); }

  login(email: string, password: string) {
    return this.http.post<LoginResponse>(`${API_URL}/login`, { email, password }).pipe(
      tap((res) => {
        const nextToken = this.normalizeToken(res.token);
        if (nextToken) {
          localStorage.setItem(TOKEN_KEY, nextToken);
          this.tokenSignal.set(nextToken);
        } else {
          localStorage.removeItem(TOKEN_KEY);
          this.tokenSignal.set(null);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(res.user));
        this.userSignal.set(res.user);
      }),
    );
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.tokenSignal.set(null);
    this.userSignal.set(null);
    void this.router.navigate(['/login']);
  }

  /** Called by the interceptor when the API answers 401 (expired or invalid token). */
  expireSession(): void {
    if (!this.isLoggedIn()) return;
    this.logout();
    this.notify.error('Your session expired. Please log in again.');
  }

  private normalizeToken(token: string | null | undefined): string | null {
    const cleaned = token?.trim();
    return cleaned && cleaned !== 'null' && cleaned !== 'undefined' ? cleaned : null;
  }

  private readToken(): string | null {
    return this.normalizeToken(localStorage.getItem(TOKEN_KEY));
  }

  private readUser(): LoginResponse['user'] | null {
    try {
      return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null');
    } catch {
      return null;
    }
  }
}
