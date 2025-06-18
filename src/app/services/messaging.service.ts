import { Injectable, inject } from '@angular/core';
import { AuctionStateService } from '../auction/auction-state.service';
import { AuctionService } from './auction.service';
import { SupabaseService } from './supabase.service';
import { Dealer, Message, DatabaseMessage } from '../models/interfaces';
import { Observable, from, map, catchError, of, tap } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { getDealerId } from '../utils/dealer-utils';

@Injectable({
  providedIn: 'root'
})
export class MessagingService {
  // Inject dependencies
  private auctionState = inject(AuctionStateService);
  private auctionService = inject(AuctionService);
  private supabaseService = inject(SupabaseService);
  private toastr = inject(ToastrService);

  constructor() {
    // Load messages from Supabase when the service initializes
    this.loadMessages();
  }

  // Load messages from Supabase
  private loadMessages(): void {
    this.getMessages().subscribe({
      next: (messages) => {
        // Sort messages by time (newest first)
        const sortedMessages = messages.sort((a, b) => {
          const timeA = this.parseTimeToSeconds(a.time);
          const timeB = this.parseTimeToSeconds(b.time);
          return timeB - timeA; // Newest first
        });
        
        // Update the state with the loaded messages
        this.auctionState.setState({ messages: sortedMessages });
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  // Helper function to parse time string (HH:MM:SS) to total seconds for sorting
  private parseTimeToSeconds(timeString: string): number {
    const parts = timeString.split(':');
    if (parts.length !== 3) return 0;
    
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseInt(parts[2], 10);
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  // Get all messages from Supabase
  getMessages(): Observable<Message[]> {
    return from(
      this.supabaseService.getClient()
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          return [];
        }
        
        // Cast data to DatabaseMessage[] and map the database fields (snake_case) to the interface fields (camelCase)
        const dbMessages = data as DatabaseMessage[];
        return dbMessages.map(message => ({
          id: message.id,
          text: message.text,
          time: message.time,
          alternate: message.alternate,
          dealer: message.dealer,
          dealerId: message.dealer_id,
          recipientId: message.recipient_id,
          type: message.type,
          isGlobal: message.is_global,
          isRead: message.is_read
        }));
      }),
      catchError(error => {
        console.error('Error fetching messages:', error);
        return of([]);
      })
    );
  }

  // Mark messages from a specific dealer as read
  markMessagesAsRead(dealerId: string): Observable<void> {
    return from(
      this.supabaseService.getClient()
        .from('messages')
        .update({ is_read: true })
        .eq('dealer_id', dealerId)
        .eq('is_read', false)
    ).pipe(
      map(() => undefined),
      catchError(error => {
        console.error('Error marking messages as read:', error);
        return of(undefined);
      })
    );
  }

  // Send a new message and save to Supabase
  sendMessage(messageData: { text: string, isGlobal: boolean }): Observable<Message> {
    const { text, isGlobal } = messageData;
    const time = this.auctionService.getCurrentTime();
    const messageId = crypto.randomUUID(); // Generate UUID
    const selectedDealer = this.auctionState.getValue('selectedDealer');
    
    const message: Message = {
      id: messageId,
      text,
      time,
      alternate: true,
      dealer: 'You',
      dealerId: 'ADMIN',
      recipientId: selectedDealer ? getDealerId(selectedDealer) : undefined,
      isGlobal,
      isRead: true
    };

    return from(
      this.supabaseService.getClient()
        .from('messages')
        .insert({
          id: message.id,
          text: message.text,
          time: message.time,
          alternate: message.alternate,
          dealer: message.dealer,
          dealer_id: message.dealerId,
          recipient_id: message.recipientId,
          is_global: message.isGlobal,
          is_read: message.isRead
        })
        .select()
    ).pipe(
      map(({ data, error }) => {
        if (error) {
          throw error;
        }
        
        // Add the message to the local state
        this.auctionState.addMessage(message);
        
        return message;
      }),
      catchError(error => {
        console.error('Error sending message:', error);
        this.toastr.error('Failed to send message. Please try again.');
        
        // Even if the database operation fails, add the message to the local state
        // for a better user experience
        this.auctionState.addMessage(message);
        
        return of(message);
      })
    );
  }

  // Handler for dealer selection
  onDealerSelect(dealer: Dealer | null): void {
    this.auctionState.setSelectedDealer(dealer);
    
    // Mark messages as read in Supabase when a dealer is selected
    if (dealer) {
      const dealerId = getDealerId(dealer);
      this.markMessagesAsRead(dealerId).subscribe();
    }
  }

  // Handler for sending a message
  onSendMessage(messageData: { text: string, isGlobal: boolean }): void {
    if (!messageData.text.trim()) return;
    
    this.sendMessage(messageData).subscribe({
      next: (message) => {
        const selectedDealer = this.auctionState.getValue('selectedDealer');
        
        if (messageData.isGlobal && !selectedDealer) {
          this.toastr.success('Announcement sent to all dealers');
        } else if (selectedDealer) {
          this.toastr.success(`Message sent to ${selectedDealer.fullName}`);
        }
      },
      error: (error) => {
        console.error('Error in onSendMessage:', error);
      }
    });
  }
}