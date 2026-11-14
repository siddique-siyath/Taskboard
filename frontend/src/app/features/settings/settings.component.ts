import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NotificationService } from '../../core/services/notification.service';
import { SettingsService } from '../../core/services/settings.service';
import { errorMessage } from '../../core/util/error.util';

const whole = (c: AbstractControl): ValidationErrors | null =>
  c.value === null || c.value === '' || Number.isInteger(c.value) ? null : { whole: true };

const weeklyAtLeastDaily = (g: AbstractControl): ValidationErrors | null => {
  const daily = g.get('dailyPointLimit')?.value;
  const weekly = g.get('weeklyPointLimit')?.value;
  return daily && weekly && weekly < daily ? { weeklyBelowDaily: true } : null;
};

@Component({
  selector: 'app-settings',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  private readonly settings = inject(SettingsService);
  private readonly notify = inject(NotificationService);

  protected readonly saving = signal(false);
  protected readonly loadError = signal<string | null>(null);

  protected readonly form = new FormGroup({
    dailyPointLimit: new FormControl<number | null>(null, [Validators.required, Validators.min(1), whole]),
    weeklyPointLimit: new FormControl<number | null>(null, [Validators.required, Validators.min(1), whole]),
  }, { validators: weeklyAtLeastDaily });

  constructor() {
    this.settings.get().subscribe({
      next: (s) => this.form.patchValue(s),
      error: (err) => this.loadError.set(errorMessage(err, 'Could not load settings.')),
    });
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const { dailyPointLimit, weeklyPointLimit } = this.form.getRawValue();
    this.saving.set(true);
    this.settings.update({ dailyPointLimit: dailyPointLimit!, weeklyPointLimit: weeklyPointLimit! }).subscribe({
      next: (s) => { this.saving.set(false); this.form.patchValue(s); this.notify.success('Settings saved'); },
      error: (err) => { this.saving.set(false); this.notify.error(errorMessage(err, 'Could not save settings.')); },
    });
  }
}
