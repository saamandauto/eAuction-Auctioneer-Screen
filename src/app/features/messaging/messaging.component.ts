import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Message, Dealer } from '../../models/interfaces';
import { MessagesPanelComponent } from '../../components/messages-panel/messages-panel.component';

@Component({
  selector: 'app-messaging',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MessagesPanelComponent
  ],
  templateUrl: './messaging.component.html',
  styleUrls: ['./messaging.component.scss']
})
export class MessagingComponent {
  @Input() dealers: Dealer[] = [];
  @Input() messages: Message[] = [];
  @Input() selectedDealer: Dealer | null = null;
  @Output() sendMessage = new EventEmitter<{ text: string, isGlobal: boolean }>();
  @Output() selectDealer = new EventEmitter<Dealer | null>();

  // Inject dependencies
  private toastr = inject(ToastrService);

  onSelectDealer(dealer: Dealer | null) {
    this.selectDealer.emit(dealer);
  }

  onSendMessage(messageData: { text: string; isGlobal: boolean }) {
    if (!messageData.text.trim()) return;
    
    this.sendMessage.emit({
      text: messageData.text,
      isGlobal: messageData.isGlobal
    });
    
    if (messageData.isGlobal && !this.selectedDealer) {
      this.toastr.success('Announcement sent to all dealers');
    } else if (this.selectedDealer) {
      const dealerName = this.selectedDealer.fullName;
      this.toastr.success(`Message sent to ${dealerName}`);
    }
  }
}