import { Injectable, computed, signal } from '@angular/core';

/** Counts in-flight HTTP requests so the global progress bar stays on until all finish. */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly pending = signal(0);
  readonly active = computed(() => this.pending() > 0);

  start(): void { this.pending.update((n) => n + 1); }
  stop(): void { this.pending.update((n) => Math.max(n - 1, 0)); }
}
