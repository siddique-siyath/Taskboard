import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { catchError, debounceTime, filter, map, of, startWith, switchMap } from 'rxjs';
import { CapacityUsage, PRIORITIES, STATUSES, Task, TaskPriority, TaskStatus } from '../../core/models/models';
import { NotificationService } from '../../core/services/notification.service';
import { TaskService } from '../../core/services/task.service';
import { fromIsoDate, toIsoDate } from '../../core/util/date.util';
import { errorMessage } from '../../core/util/error.util';

const wholeNumber: ValidatorFn = (c: AbstractControl): ValidationErrors | null =>
  c.value === null || Number.isInteger(c.value) ? null : { whole: true };

const dueNotBeforePlanned: ValidatorFn = (g: AbstractControl): ValidationErrors | null => {
  const planned = g.get('plannedDate')?.value as Date | null;
  const due = g.get('dueDate')?.value as Date | null;
  return planned && due && toIsoDate(due) < toIsoDate(planned) ? { dueBeforePlanned: true } : null;
};

@Component({
  selector: 'app-task-form-dialog',
  imports: [ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule, MatButtonModule],
  templateUrl: './task-form-dialog.component.html',
  styleUrl: './task-form-dialog.component.scss',
})
export class TaskFormDialogComponent {
  private readonly tasks = inject(TaskService);
  private readonly notify = inject(NotificationService);
  private readonly ref = inject(MatDialogRef<TaskFormDialogComponent, Task>);
  protected readonly original = inject<{ task?: Task }>(MAT_DIALOG_DATA).task;

  protected readonly priorities = PRIORITIES;
  // A completed task can never go back to Backlog, so do not offer it.
  protected readonly statusOptions: readonly TaskStatus[] =
    this.original?.status === 'Completed' ? STATUSES.filter((s) => s !== 'Backlog') : STATUSES;

  protected readonly saving = signal(false);
  protected readonly serverError = signal<string | null>(null);
  protected readonly usage = signal<CapacityUsage | null>(null);

  protected readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(200)] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(2000)] }),
    storyPoints: new FormControl<number | null>(1, [Validators.required, Validators.min(1), wholeNumber]),
    priority: new FormControl<TaskPriority | null>(null, [Validators.required]),
    status: new FormControl<TaskStatus>('Backlog', { nonNullable: true }),
    plannedDate: new FormControl<Date | null>(null, [Validators.required]),
    dueDate: new FormControl<Date | null>(null),
  }, { validators: dueNotBeforePlanned });

  protected readonly c = this.form.controls;
  protected readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(null), map(() => this.form.getRawValue())),
    { requireSync: true },
  );

  /** Advisory only: the API stays the authority and re-checks on save. */
  protected readonly warning = computed(() => {
    const u = this.usage();
    const v = this.formValue();
    if (!u || v.status === 'Backlog' || !v.storyPoints || v.storyPoints < 1 || !v.plannedDate) return null;
    const date = toIsoDate(v.plannedDate);
    if (u.date !== date) return null;
    const o = this.original;
    if (o && o.status !== 'Backlog' && o.storyPoints === v.storyPoints && o.plannedDate === date) return null;
    if (u.dailyPlanned + v.storyPoints > u.dailyLimit) {
      return `Daily capacity exceeded: limit ${u.dailyLimit}, already planned ${u.dailyPlanned}, this task ${v.storyPoints}.`;
    }
    if (u.weeklyPlanned + v.storyPoints > u.weeklyLimit) {
      return `Weekly capacity exceeded: limit ${u.weeklyLimit}, already planned ${u.weeklyPlanned}, this task ${v.storyPoints}.`;
    }
    return null;
  });

  constructor() {
    const t = this.original;
    if (t) {
      this.form.patchValue({
        title: t.title,
        description: t.description ?? '',
        storyPoints: t.storyPoints,
        priority: t.priority,
        status: t.status,
        plannedDate: fromIsoDate(t.plannedDate),
        dueDate: t.dueDate ? fromIsoDate(t.dueDate) : null,
      });
    }

    this.c.plannedDate.valueChanges.pipe(
      startWith(this.c.plannedDate.value),
      filter((d): d is Date => d instanceof Date && !Number.isNaN(d.getTime())),
      debounceTime(150),
      switchMap((d) => this.tasks.capacity(toIsoDate(d), t?.id).pipe(catchError(() => of(null)))),
      takeUntilDestroyed(),
    ).subscribe((u) => this.usage.set(u));
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      title: v.title.trim(),
      description: v.description.trim() || null,
      storyPoints: v.storyPoints!,
      priority: v.priority!,
      status: v.status,
      plannedDate: toIsoDate(v.plannedDate!),
      dueDate: v.dueDate ? toIsoDate(v.dueDate) : null,
    };

    this.serverError.set(null);
    this.saving.set(true);
    const request = this.original ? this.tasks.update(this.original.id, payload) : this.tasks.create(payload);
    request.subscribe({
      next: (task) => {
        this.notify.success(this.original ? 'Task updated' : 'Task created');
        this.ref.close(task);
      },
      error: (err) => {
        this.saving.set(false);
        const message = errorMessage(err);
        this.serverError.set(message);
        this.notify.error(message);
      },
    });
  }
}
