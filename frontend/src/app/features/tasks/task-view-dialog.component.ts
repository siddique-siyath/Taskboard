import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { Task } from '../../core/models/models';
import { TagComponent } from '../../shared/tag/tag.component';

@Component({
  selector: 'app-task-view-dialog',
  imports: [MatDialogModule, MatButtonModule, TagComponent, DatePipe],
  templateUrl: './task-view-dialog.component.html',
  styleUrl: './task-view-dialog.component.scss',
})
export class TaskViewDialogComponent {
  protected readonly task = inject<{ task: Task }>(MAT_DIALOG_DATA).task;
}
