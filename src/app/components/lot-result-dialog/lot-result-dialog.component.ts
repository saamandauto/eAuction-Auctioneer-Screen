import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotDetails, Bid } from '../../models/interfaces';
import { LotStatus } from '../../models/enums';
import { FormatPricePipe } from '../../pipes/format-price.pipe';

@Component({
  selector: 'app-lot-result-dialog',
  standalone: true,
  imports: [CommonModule, FormatPricePipe],
  templateUrl: './lot-result-dialog.component.html',
  styleUrls: ['./lot-result-dialog.component.scss']
})
export class LotResultDialogComponent {
  @Input() isOpen = false;
  @Input() lot: LotDetails | null = null;
  @Output() dialogClose = new EventEmitter<void>(); // Use Angular event emitter pattern

  LotStatus = LotStatus; // Make enum available in template

  get finalState() {
    return this.lot?.finalState;
  }

  get bids() {
    return this.finalState?.bids || [];
  }

  // Handle close with proper event emission
  handleClose(): void {
    this.dialogClose.emit();
  }

  getBidderTooltip(bid: Bid): string {
    return `
Bidder: ${bid.bidder}
Company: ${bid.companyName || 'N/A'}
Type: ${bid.companyType || 'N/A'}
Location: ${bid.city || 'N/A'}, ${bid.country || 'N/A'}
ID: ${bid.bidderId}
    `.trim();
  }

  // Helper methods to determine lot status
  isSold(): boolean {
    return this.finalState?.status === LotStatus.SOLD;
  }

  isWithdrawn(): boolean {
    return this.finalState?.status === LotStatus.WITHDRAWN;
  }

  isNoSale(): boolean {
    return this.finalState?.status === LotStatus.NO_SALE;
  }

  // Get highest bid with formatting - returns raw string since pipe is used in template
  getHighestBid(): string {
    if (this.bids.length === 0) {
      return 'No bids';
    }
    // Return raw number since FormatPricePipe will be applied in template
    return this.bids[0].amount.toString();
  }

  // Get CSS class based on status
  getStatusClass(): string {
    if (!this.finalState?.status) return '';
    
    return this.finalState.status.toLowerCase().replace(' ', '_');
  }
}