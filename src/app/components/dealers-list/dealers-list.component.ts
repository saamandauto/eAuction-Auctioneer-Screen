import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { Dealer, Message, MessageCount, DealerFilter } from '../../models/interfaces';
import { DisplayDealer } from '../../models/display-interfaces';
import { LotUserActivityService } from '../../services/lot-user-activity.service';
import { getDealerName, getDealerId } from '../../utils/dealer-utils';

// Interface for the combined view state
interface DealersListViewState {
  displayedDealers: DisplayDealer[];
  emptyRows: number[];
  canExpand: boolean;
}

@Component({
  selector: 'app-dealers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dealers-list.component.html',
  styleUrls: ['./dealers-list.component.scss']
})
export class DealersListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() dealers: Dealer[] = [];
  @Input() messages: Message[] = [];
  @Input() selectedDealer: Dealer | null = null;
  @Output() selectDealer = new EventEmitter<Dealer>();
  
  expanded = false; // Removed ': boolean'
  searchTerm = ''; // Removed ': string'
  currentFilter: DealerFilter = 'all';
  
  // Internal state subjects
  private displayDealersSubject = new BehaviorSubject<DisplayDealer[]>([]);

  // Combined view state observable
  viewState$: Observable<DealersListViewState>;

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  // Inject dependencies using inject() pattern
  private lotUserActivityService = inject(LotUserActivityService);

  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.displayDealersSubject.asObservable()
    ]).pipe(
      map(([displayDealers]) => {
        const displayedDealers = this.expanded ? displayDealers : displayDealers.slice(0, 10);
        const currentRows = displayedDealers.length;
        const minRows = this.expanded ? 0 : 10;
        const emptyRows = currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
        
        return {
          displayedDealers,
          emptyRows,
          canExpand: displayDealers.length > 10
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.updateDisplayDealers();
  }

  ngOnChanges() {
    this.updateDisplayDealers();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setFilter(filter: DealerFilter) {
    this.currentFilter = filter;
    this.updateDisplayDealers();
    // Reset to first page when changing filters
    this.expanded = false;
  }

  public updateDisplayDealers() {
    if (!this.dealers || this.dealers.length === 0) {
      this.displayDealersSubject.next([]);
      return;
    }
    
    // First filter out bid users
    let dealers = this.dealers.filter(d => {
      const type = d.type;
      return type !== 'Bid User 1' && type !== 'Bid User 2';
    });

    // Apply status filter
    if (this.currentFilter !== 'all') {
      dealers = dealers.filter(dealer => {
        const dealerId = getDealerId(dealer);
        if (!dealerId) {
          return false;
        }
        
        const status = this.lotUserActivityService.getDealerStatus(dealerId);
        if (!status) {
          return false;
        }

        switch (this.currentFilter) {
          case 'viewers': return status.isViewer;
          case 'watchers': return status.isWatcher;
          case 'leads': return status.isLead;
          case 'online': return status.isOnline;
          default: return true;
        }
      });
    }

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      dealers = dealers.filter(dealer => {
        const name = getDealerName(dealer);
        const dealerId = getDealerId(dealer);
        const type = dealer.type;
        
        return name.toLowerCase().includes(term) ||
          (dealerId && dealerId.toLowerCase().includes(term)) ||
          (type && type.toLowerCase().includes(term)) ||
          dealer.companyName?.toLowerCase().includes(term) ||
          dealer.companyType?.toLowerCase().includes(term) ||
          dealer.city?.toLowerCase().includes(term) ||
          dealer.country?.toLowerCase().includes(term) ||
          dealer.firstName?.toLowerCase().includes(term) ||
          dealer.lastName?.toLowerCase().includes(term);
      });
    }

    // Convert to DisplayDealer with pre-computed data
    const displayDealers = dealers.map(dealer => {
      const dealerId = getDealerId(dealer);
      const dealerStatus = this.lotUserActivityService.getDealerStatus(dealerId || '') || {
        dealerId: dealerId || '',
        isViewer: false,
        isWatcher: false,
        isLead: false,
        isOnline: false,
        lastActive: ''
      };

      const messageCount = this.getMessageCount(dealerId || '');
      const tooltipText = this.getDealerTooltip(dealer, dealerStatus);
      const isSelected = this.isSelected(dealer);

      return {
        ...dealer,
        displayStatus: dealerStatus,
        messageCount,
        tooltipText,
        isSelected
      };
    });

    // Sort alphabetically using name from either format
    displayDealers.sort((a, b) => {
      const nameA = getDealerName(a);
      const nameB = getDealerName(b);
      return nameA.localeCompare(nameB);
    });

    this.displayDealersSubject.next(displayDealers);
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  private getDealerTooltip(dealer: Dealer, status: unknown): string {
    const dealerId = getDealerId(dealer);
    const dealerStatus = status as { lastActive?: string } | null;
    const lastActive = dealerStatus?.lastActive ? `\nLast Active: ${dealerStatus.lastActive}` : '';
    const lastBuy = dealer.lastBuy ? `\nLast Buy: ${dealer.lastBuy}` : '';
    const lastLogin = dealer.lastLogin ? `\nLast Login: ${dealer.lastLogin}` : '';
    
    return `
Company: ${dealer.companyName || 'N/A'}
Type: ${dealer.type || 'N/A'}
Location: ${dealer.city || 'N/A'}, ${dealer.country || 'N/A'}
ID: ${dealerId}${lastActive}${lastBuy}${lastLogin}
    `.trim();
  }

  private getMessageCount(dealerId: string): MessageCount {
    const dealerMessages = this.messages.filter(m => 
      m.dealerId === dealerId && !m.alternate && !m.isGlobal
    );
    const unreadMessages = dealerMessages.filter(m => !m.isRead);
    
    return {
      total: dealerMessages.length,
      unread: unreadMessages.length
    };
  }

  // Updated to handle keyboard events
  onDealerClick(dealer: DisplayDealer) {
    this.selectDealer.emit(dealer);
  }

  private isSelected(dealer: Dealer): boolean {
    if (!this.selectedDealer) return false;
    
    const dealerId = getDealerId(dealer);
    const selectedId = getDealerId(this.selectedDealer);
    
    return dealerId === selectedId;
  }

  // Public methods for template (simplified since data is pre-computed)
  getDealerName(dealer: DisplayDealer): string {
    return getDealerName(dealer);
  }

  getDealerId(dealer: DisplayDealer): string {
    return getDealerId(dealer);
  }
}