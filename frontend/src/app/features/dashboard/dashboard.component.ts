import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { CapacityUsage, Summary } from '../../core/models/models';
import { TaskService } from '../../core/services/task.service';
import { errorMessage } from '../../core/util/error.util';
import { todayIso } from '../../core/util/date.util';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-dashboard',
  imports: [MatProgressBarModule, MatButtonModule, RouterLink, DatePipe],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  private readonly tasks = inject(TaskService);

  protected readonly summary = signal<Summary | null>(null);
  protected readonly usage = signal<CapacityUsage | null>(null);
  protected readonly error = signal<string | null>(null);

  protected readonly cards = computed(() => {
    const s = this.summary();
    if (!s) return [];
    return [
      { label: 'Total tasks', value: s.totalTasks, color: '#1a2230' },
      { label: 'Backlog', value: s.backlogTasks, color: 'var(--tb-backlog)' },
      { label: 'Planned', value: s.plannedTasks, color: 'var(--tb-planned)' },
      { label: 'In progress', value: s.inProgressTasks, color: 'var(--tb-progress)' },
      { label: 'Completed', value: s.completedTasks, color: 'var(--tb-done)' },
      { label: 'Total story points', value: s.totalStoryPoints, color: '#6b4fbb' },
    ];
  });

  constructor() { this.load(); }

  protected load(): void {
    this.error.set(null);
    forkJoin({ summary: this.tasks.summary(), usage: this.tasks.capacity(todayIso(), undefined, false) }).subscribe({
      next: ({ summary, usage }) => { this.summary.set(summary); this.usage.set(usage); },
      error: (err) => this.error.set(errorMessage(err, 'Could not load the dashboard.')),
    });
  }

  protected percent(value: number, limit: number): number {
    return limit > 0 ? Math.min(100, Math.round((value / limit) * 100)) : 0;
  }
}
