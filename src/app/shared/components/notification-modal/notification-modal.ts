import { Component} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification';

@Component({
  selector: 'app-notification-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-modal.html',
  styleUrl: './notification-modal.scss',
})
export class NotificationModalComponent {
  
  // Inyectamos el servicio como público para que el HTML acceda a sus variables
  constructor(public notify: NotificationService) {}
}