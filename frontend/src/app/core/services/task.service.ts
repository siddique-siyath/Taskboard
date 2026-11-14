import { HttpClient, HttpContext, HttpContextToken, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { API_URL } from '../api.config';
import { CapacityUsage, Summary, Task, TaskPage, TaskPayload, TaskQuery, TaskStatus } from '../models/models';

/** Requests carrying this context skip the global progress bar (used for the live capacity hint). */
export const SKIP_LOADING = new HttpContextToken<boolean>(() => false);

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_URL}/tasks`;

  list(q: TaskQuery) {
    let params = new HttpParams()
      .set('page', q.page)
      .set('limit', q.limit)
      .set('sortBy', q.sortBy)
      .set('sortOrder', q.sortOrder);
    if (q.search) params = params.set('search', q.search);
    if (q.priority) params = params.set('priority', q.priority);
    if (q.status) params = params.set('status', q.status);
    return this.http.get<TaskPage>(this.url, { params });
  }

  board() { return this.http.get<Task[]>(`${this.url}/board`); }
  summary() { return this.http.get<Summary>(`${this.url}/summary`); }

  capacity(date: string, excludeId?: number, silent = true) {
    let params = new HttpParams().set('date', date);
    if (excludeId) params = params.set('excludeId', excludeId);
    return this.http.get<CapacityUsage>(`${this.url}/capacity`, {
      params,
      context: new HttpContext().set(SKIP_LOADING, silent),
    });
  }

  create(payload: TaskPayload) { return this.http.post<Task>(this.url, payload); }
  update(id: number, payload: TaskPayload) { return this.http.put<Task>(`${this.url}/${id}`, payload); }
  changeStatus(id: number, status: TaskStatus) { return this.http.patch<Task>(`${this.url}/${id}/status`, { status }); }
  remove(id: number) { return this.http.delete<void>(`${this.url}/${id}`); }
}
