import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Message, Dealer } from '../../models/interfaces';
import { getDealerName, getDealerId } from '../../utils/dealer-utils';

@Component({
  selector: 'app-messages-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './messages-panel.component.html',
  styleUrls: ['./messages-panel.component.scss']
})
export class MessagesPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() messages: Message[] = [];
  @Input() selectedDealer: Dealer | null = null;
  @Input() dealers: Dealer[] = [];
  @Output() sendMessage = new EventEmitter<{ text: string, isGlobal: boolean }>();
  @Output() selectDealer = new EventEmitter<Dealer | null>();

  newMessage = '';
  showGlobalMessages = false;
  
  // Pre-computed properties
  filteredMessages: Message[] = [];
  messagePlaceholder = 'Type a message...';
  dealerNamesMap = new Map<string, string>();

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.updateDealerNamesMap();
    this.updateFilteredMessages();
    this.updateMessagePlaceholder();
  }

  ngOnChanges() {
    this.updateDealerNamesMap();
    this.updateFilteredMessages();
    this.updateMessagePlaceholder();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateDealerNamesMap() {
    this.dealerNamesMap.clear();
    this.dealers.forEach(dealer => {
      const dealerId = getDealerId(dealer);
      const dealerName = getDealerName(dealer);
      this.dealerNamesMap.set(dealerId, dealerName);
    });
  }

  private updateFilteredMessages() {
    if (this.selectedDealer) {
      const dealerId = getDealerId(this.selectedDealer);
      this.filteredMessages = this.messages.filter(msg => 
        msg.dealerId === dealerId || 
        (msg.alternate && !msg.isGlobal && msg.recipientId === dealerId)
      );
    } else if (this.showGlobalMessages) {
      this.filteredMessages = this.messages.filter(msg => msg.isGlobal);
    } else {
      this.filteredMessages = this.messages;
    }
  }

  private updateMessagePlaceholder() {
    if (this.selectedDealer) {
      const dealerName = getDealerName(this.selectedDealer);
      this.messagePlaceholder = `Message ${dealerName}...`;
    } else {
      this.messagePlaceholder = this.showGlobalMessages ? 
        'Send announcement to all dealers...' : 
        'Type a message...';
    }
  }

  // Use imported utility functions but keep these as pass-through methods
  // to maintain component API consistency
  getDealerName(dealer: Dealer): string {
    return getDealerName(dealer);
  }

  getDealerId(dealer: Dealer): string {
    return getDealerId(dealer);
  }

  // Get dealer name from dealer ID using the pre-computed map
  getDealerNameById(dealerId: string): string {
    return this.dealerNamesMap.get(dealerId) || 'Unknown';
  }

  clearSelectedDealer() {
    this.showGlobalMessages = false;
    this.selectDealer.emit(null);
    this.updateFilteredMessages();
    this.updateMessagePlaceholder();
  }

  toggleGlobalMessages() {
    this.showGlobalMessages = true;
    this.selectDealer.emit(null);
    this.updateFilteredMessages();
    this.updateMessagePlaceholder();
  }

  onSendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.sendMessage.emit({
      text: this.newMessage,
      isGlobal: !this.selectedDealer && this.showGlobalMessages
    });
    
    this.newMessage = '';
  }

  onMessageClick(message: Message) {
    if (!message.alternate && !message.isGlobal) {
      const dealer = this.dealers.find(d => {
        const dealerId = getDealerId(d);
        return dealerId === message.dealerId;
      });
      
      if (dealer) {
        this.showGlobalMessages = false;
        this.selectDealer.emit(dealer);
        this.updateFilteredMessages();
        this.updateMessagePlaceholder();
      }
    }
  }
}