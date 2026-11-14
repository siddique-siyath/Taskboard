import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { PRIORITIES, SortField, STATUSES, Task, TaskQuery } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';
import { TaskService } from '../../core/services/task.service';
import { errorMessage } from '../../core/util/error.util';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { TagComponent } from '../../shared/tag/tag.component';
import { TaskFormDialogComponent } from './task-form-dialog.component';
import { TaskViewDialogComponent } from './task-view-dialog.component';

@Component({
  selector: 'app-task-list',
  imports: [
    DatePipe, ReactiveFormsModule, MatTableModule, MatSortModule, MatPaginatorModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule, MatTooltipModule, TagComponent,
  ],
  templateUrl: './task-list.component.html',
  styleUrl: './task-list.component.scss',
})
export class TaskListComponent {
  private readonly tasks = inject(TaskService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  protected readonly priorities = PRIORITIES;
  protected readonly statuses = STATUSES;
  protected readonly columns = ['title', 'priority', 'status', 'storyPoints', 'plannedDate', 'dueDate', 'actions'];

  protected readonly rows = signal<Task[]>([]);
  protected readonly total = signal(0);
  protected readonly loaded = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly query = signal<TaskQuery>({
    search: '', priority: '', status: '', sortBy: 'plannedDate', sortOrder: 'asc', page: 1, limit: 10,
  });

  protected readonly search = new FormControl('', { nonNullable: true });

  constructor() {
    this.search.valueChanges.pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((text) => this.patchQuery({ search: text.trim(), page: 1 }));
    this.load();
  }

  protected hasFilters(): boolean {
    const q = this.query();
    return !!(q.search || q.priority || q.status);
  }

  protected load(): void {
    this.error.set(null);
    this.tasks.list(this.query()).subscribe({
      next: (res) => {
        // Deleting the last row of a page: step back to the previous page.
        if (!res.data.length && res.pagination.total > 0 && this.query().page > 1) {
          this.patchQuery({ page: res.pagination.totalPages });
          return;
        }
        this.rows.set(res.data);
        this.total.set(res.pagination.total);
        this.loaded.set(true);
      },
      error: (err) => { this.loaded.set(true); this.error.set(errorMessage(err, 'Could not load tasks.')); },
    });
  }

  private patchQuery(patch: Partial<TaskQuery>): void {
    this.query.update((q) => ({ ...q, ...patch }));
    this.load();
  }

  protected setFilter(key: 'priority' | 'status', value: string): void {
    this.patchQuery({ [key]: value, page: 1 } as Partial<TaskQuery>);
  }

  protected clearFilters(): void {
    this.search.setValue('', { emitEvent: false });
    this.patchQuery({ search: '', priority: '', status: '', page: 1 });
  }

  protected onSort(sort: Sort): void {
    this.patchQuery({ sortBy: sort.active as SortField, sortOrder: sort.direction || 'asc', page: 1 });
  }

  protected onPage(e: PageEvent): void {
    this.patchQuery({ page: e.pageIndex + 1, limit: e.pageSize });
  }

  protected view(task: Task): void {
    this.dialog.open(TaskViewDialogComponent, { data: { task }, width: '480px', maxWidth: '95vw' })
      .afterClosed().subscribe((result) => { if (result === 'edit') this.openForm(task); });
  }

  protected openForm(task?: Task): void {
    this.dialog.open(TaskFormDialogComponent, { data: { task }, width: '680px', maxWidth: '95vw', autoFocus: 'first-tabbable' })
      .afterClosed().subscribe((saved) => { if (saved) this.load(); });
  }

  protected confirmDelete(task: Task): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: { title: 'Delete task?', message: `"${task.title}" will be permanently deleted.`, confirmLabel: 'Delete' },
      width: '400px', maxWidth: '95vw',
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;
      this.tasks.remove(task.id).subscribe({
        next: () => { this.notify.success('Task deleted'); this.load(); },
        error: (err) => this.notify.error(errorMessage(err, 'Could not delete the task.')),
      });
    });
  }
}
