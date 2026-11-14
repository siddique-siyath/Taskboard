import { BreakpointObserver } from '@angular/cdk/layout';
import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../core/services/auth.service';
import { LoadingService } from '../core/services/loading.service';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatSidenavModule, MatToolbarModule, MatIconModule, MatButtonModule, MatProgressBarModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly loading = inject(LoadingService);

  protected readonly items = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/board', label: 'Board', icon: 'view_kanban' },
    { path: '/tasks', label: 'Tasks', icon: 'checklist' },
    { path: '/settings', label: 'Settings', icon: 'tune' },
  ];

  protected readonly isMobile = toSignal(
    inject(BreakpointObserver).observe('(max-width: 859px)').pipe(map((r) => r.matches)),
    { initialValue: false },
  );
  protected readonly navOpen = signal(true);

  constructor() {
    effect(() => this.navOpen.set(!this.isMobile()));
  }
}
