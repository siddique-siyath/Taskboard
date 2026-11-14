import { CdkDrag, CdkDragDrop, CdkDropList, CdkDropListGroup, transferArrayItem } from '@angular/cdk/drag-drop';
import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { STATUSES, Task, TaskStatus } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';
import { TaskService } from '../../core/services/task.service';
import { errorMessage } from '../../core/util/error.util';
import { TagComponent } from '../../shared/tag/tag.component';
import { TaskFormDialogComponent } from '../tasks/task-form-dialog.component';

type Columns = Record<TaskStatus, Task[]>;

const emptyColumns = (): Columns => ({ Backlog: [], Planned: [], 'In Progress': [], Completed: [] });

@Component({
  selector: 'app-board',
  imports: [CdkDropListGroup, CdkDropList, CdkDrag, DatePipe, MatButtonModule, MatIconModule, TagComponent],
  templateUrl: './board.component.html',
  styleUrl: './board.component.scss',
})
export class BoardComponent {
  private readonly tasks = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  protected readonly statuses = STATUSES;
  protected readonly columns = signal<Columns>(emptyColumns());
  protected readonly saving = signal<ReadonlySet<number>>(new Set());
  protected readonly error = signal<string | null>(null);

  constructor() { this.load(); }

  protected load(): void {
    this.error.set(null);
    this.tasks.board().subscribe({
      next: (all) => {
        const cols = emptyColumns();
        for (const t of all) cols[t.status].push(t);
        this.columns.set(cols);
      },
      error: (err) => this.error.set(errorMessage(err, 'Could not load the board.')),
    });
  }

  protected drop(event: CdkDragDrop<Task[]>, target: TaskStatus): void {
    if (event.previousContainer === event.container) return;

    const task = event.item.data as Task;
    const source = event.previousContainer.data;
    const dest = event.container.data;

    // Fast client-side rule; the API enforces it too.
    if (task.status === 'Completed' && target === 'Backlog') {
      this.notify.error('Completed tasks cannot be moved back to Backlog.');
      return;
    }

    // Optimistic move: show the card in its new column immediately.
    const fromIndex = event.previousIndex;
    transferArrayItem(source, dest, fromIndex, event.currentIndex);
    dest[event.currentIndex] = { ...task, status: target };
    this.columns.update((c) => ({ ...c }));
    this.setSaving(task.id, true);

    this.tasks.changeStatus(task.id, target).subscribe({
      next: (saved) => {
        this.setSaving(task.id, false);
        const i = dest.findIndex((t) => t.id === saved.id);
        if (i >= 0) dest[i] = saved;
        this.columns.update((c) => ({ ...c }));
        this.notify.success(`Moved to ${target}`);
      },
      error: (err) => {
        // Revert: the move was rejected (capacity, rule, network...).
        this.setSaving(task.id, false);
        const i = dest.findIndex((t) => t.id === task.id);
        if (i >= 0) dest.splice(i, 1);
        source.splice(Math.min(fromIndex, source.length), 0, task);
        this.columns.update((c) => ({ ...c }));
        this.notify.error(errorMessage(err, 'Could not move the task.'));
      },
    });
  }

  protected openForm(task?: Task): void {
    this.dialog.open(TaskFormDialogComponent, { data: { task }, width: '680px', maxWidth: '95vw', autoFocus: 'first-tabbable' })
      .afterClosed().subscribe((saved) => { if (saved) this.load(); });
  }

  private setSaving(id: number, on: boolean): void {
    this.saving.update((set) => {
      const next = new Set(set);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }
}
