import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-tag',
  styleUrl: './tag.component.scss',
  templateUrl: './tag.component.html',
})
export class TagComponent {
  readonly value = input.required<string>();
  protected readonly slug = computed(() => this.value().toLowerCase().replace(/\s+/g, '-'));
}
