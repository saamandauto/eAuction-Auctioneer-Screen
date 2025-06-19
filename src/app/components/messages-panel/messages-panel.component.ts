import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { Message, Dealer } from '../../models/interfaces';
import { getDealerName, getDealerId } from '../../utils/dealer-utils';

// Interface for the combined view state
interface MessagesPanelViewState {
  filteredMessages: Message[];
  messagePlaceholder: string;
  dealerNamesMap: Map<string, string>;
}

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

  newMessage = ''; // Removed ': string'
  showGlobalMessages = false; // Removed ': boolean'
  
  // Internal state subjects
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private selectedDealerSubject = new BehaviorSubject<Dealer | null>(null);
  private dealersSubject = new BehaviorSubject<Dealer[]>([]);
  private showGlobalMessagesSubject = new BehaviorSubject<boolean>(false);

  // Combined view state observable
  viewState$: Observable<MessagesPanelViewState>;

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.messagesSubject.asObservable(),
      this.selectedDealerSubject.asObservable(),
      this.dealersSubject.asObservable(),
      this.showGlobalMessagesSubject.asObservable()
    ]).pipe(
      map(([messages, selectedDealer, dealers, showGlobalMessages]) => {
        // Update dealer names map
        const dealerNamesMap = new Map<string, string>();
        dealers.forEach(dealer => {
          const dealerId = getDealerId(dealer);
          const dealerName = getDealerName(dealer);
          dealerNamesMap.set(dealerId, dealerName);
        });

        // Filter messages based on current state
        let filteredMessages: Message[];
        if (selectedDealer) {
          const _dealerId = getDealerId(selectedDealer);
          filteredMessages = messages.filter(msg => 
            msg.dealerId === _dealerId || 
            (msg.alternate && !msg.isGlobal && msg.recipientId === _dealerId)
          );
        } else if (showGlobalMessages) {
          filteredMessages = messages.filter(msg => msg.isGlobal);
        } else {
          filteredMessages = messages;
        }

        // Determine message placeholder
        let messagePlaceholder: string;
        if (selectedDealer) {
          const dealerName = getDealerName(selectedDealer);
          messagePlaceholder = `Message ${dealerName}...`;
        } else {
          messagePlaceholder = showGlobalMessages ? 
            'Send announcement to all dealers...' : 
            'Type a message...';
        }

        return {
          filteredMessages,
          messagePlaceholder,
          dealerNamesMap
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.updateInternalState();
  }

  ngOnChanges() {
    this.updateInternalState();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private updateInternalState() {
    this.messagesSubject.next(this.messages);
    this.selectedDealerSubject.next(this.selectedDealer);
    this.dealersSubject.next(this.dealers);
    this.showGlobalMessagesSubject.next(this.showGlobalMessages);
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
  getDealerNameById(_dealerId: string): string {
    // This will be handled by the viewState$ observable
    return 'Unknown'; // Fallback - actual value comes from template
  }

  clearSelectedDealer() {
    this.showGlobalMessages = false;
    this.showGlobalMessagesSubject.next(false);
    this.selectDealer.emit(null);
  }

  toggleGlobalMessages() {
    this.showGlobalMessages = true;
    this.showGlobalMessagesSubject.next(true);
    this.selectDealer.emit(null);
  }

  onSendMessage() {
    if (!this.newMessage.trim()) return;
    
    this.sendMessage.emit({
      text: this.newMessage,
      isGlobal: !this.selectedDealer && this.showGlobalMessages
    });
    
    this.newMessage = '';
  }

  // Updated to handle keyboard events as well as clicks
  onMessageClick(message: Message) {
    if (!message.alternate && !message.isGlobal) {
      const dealer = this.dealers.find(d => {
        const dealerId = getDealerId(d);
        return dealerId === message.dealerId;
      });
      
      if (dealer) {
        this.showGlobalMessages = false;
        this.showGlobalMessagesSubject.next(false);
        this.selectDealer.emit(dealer);
      }
    }
  }
}