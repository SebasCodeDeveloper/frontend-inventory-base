import { Component, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationModalComponent } from './shared/components/notification-modal/notification-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive,NotificationModalComponent],
  templateUrl: './app.html', 
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('inventory-api-base');
}
