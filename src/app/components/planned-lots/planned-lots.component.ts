import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, Observable, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { LotDetails, ViewerInfo, SortDirection } from '../../models/interfaces';
import { UserListDialogComponent } from '../shared/user-list-dialog/user-list-dialog.component';
import { FormatPricePipe } from '../../pipes/format-price.pipe';
import { FormatMileagePipe } from '../../pipes/format-mileage.pipe';
import { LocalizeTextPipe } from '../../pipes/localize-text.pipe';
import { ToastrService } from 'ngx-toastr';
import { LotService } from '../../services/lot.service';
import { LocalizationService } from '../../services/localization.service';

// Interface for the combined view state
interface PlannedLotsViewState {
  sortedLots: LotDetails[];
  isToggleVisible: boolean;
  canReorder: boolean;
}

@Component({
  selector: 'app-planned-lots',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    UserListDialogComponent,
    CdkDrag,
    CdkDropList,
    FormatPricePipe,
    FormatMileagePipe,
    LocalizeTextPipe
  ],
  templateUrl: './planned-lots.component.html',
  styleUrls: ['./planned-lots.component.scss']
})
export class PlannedLotsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() lots: LotDetails[] = [];
  @Output() lotUpdated = new EventEmitter<{lotNumber: number, field: string, value: number}>();
  @Output() lotsReordered = new EventEmitter<LotDetails[]>();
  
  // Editing state
  editMode: {[key: number]: {reservePrice: boolean, initialAskingPrice: boolean}} = {};
  
  // Sorting state
  sortColumn = 'lotNumber';
  sortDirection: SortDirection = 'asc';
  
  // View mode (compact or detailed)
  viewMode: 'compact' | 'detailed' = 'compact';
  
  // Reordering state
  isDragEnabled = false;
  
  // Dialog state
  selectedLot: LotDetails | null = null;
  isViewersDialogOpen = false;
  isWatchersDialogOpen = false;
  isLeadsDialogOpen = false;
  isOnlineDialogOpen = false;
  viewers: ViewerInfo[] = [];
  watchers: ViewerInfo[] = [];
  leads: ViewerInfo[] = [];
  onlineUsers: ViewerInfo[] = [];

  // Internal state subjects
  private lotsSubject = new BehaviorSubject<LotDetails[]>([]);
  private sortColumnSubject = new BehaviorSubject<string>('lotNumber');
  private sortDirectionSubject = new BehaviorSubject<SortDirection>('asc');
  private isDragEnabledSubject = new BehaviorSubject<boolean>(false);

  // Combined view state observable
  viewState$: Observable<PlannedLotsViewState>;

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();
  
  // Inject dependencies using inject() pattern
  private toastr = inject(ToastrService);
  private lotService = inject(LotService);
  public localizationService = inject(LocalizationService);
  
  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.lotsSubject.asObservable(),
      this.sortColumnSubject.asObservable(),
      this.sortDirectionSubject.asObservable(),
      this.isDragEnabledSubject.asObservable()
    ]).pipe(
      map(([lots, sortColumn, sortDirection, isDragEnabled]) => {
        let sortedLots: LotDetails[];
        
        if (isDragEnabled) {
          sortedLots = [...lots];
        } else {
          sortedLots = [...lots].sort((a, b) => {
            const direction = sortDirection === 'asc' ? 1 : -1;
            
            // Handle different column types appropriately
            if (['lotNumber', 'year', 'mileage', 'reservePrice', 'initialAskingPrice', 
                 'lastAuctionBid', 'indicataMarketPrice', 'viewers', 'watchers', 
                 'leadListUsers', 'onlineUsers'].includes(sortColumn)) {
              const aValue = a[sortColumn as keyof LotDetails] as number;
              const bValue = b[sortColumn as keyof LotDetails] as number;
              return direction * ((aValue || 0) - (bValue || 0));
            }
            
            // Handle string columns
            const aValue = String(a[sortColumn as keyof LotDetails] || '');
            const bValue = String(b[sortColumn as keyof LotDetails] || '');
            return direction * aValue.localeCompare(bValue);
          });
        }

        const width = window.innerWidth;
        const isToggleVisible = width >= 1025 && width <= 1620;

        return {
          sortedLots,
          isToggleVisible,
          canReorder: lots.length > 1
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
    this.lotsSubject.next(this.lots);
  }
  
  // Toggle between compact and detailed view
  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'compact' ? 'detailed' : 'compact';
  }
  
  // Sorting methods
  sort(column: string): void {
    // Don't sort if we're in reordering mode
    if (this.isDragEnabled) {
      return;
    }
    
    if (column === 'dealerActivity') return; // Don't sort the dealer activity column
    
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.sortColumnSubject.next(this.sortColumn);
    this.sortDirectionSubject.next(this.sortDirection);
  }
  
  // Toggle drag and drop mode
  toggleDragMode(): void {
    this.isDragEnabled = !this.isDragEnabled;
    this.isDragEnabledSubject.next(this.isDragEnabled);
    
    if (this.isDragEnabled) {
      this.toastr.info('Lot reordering enabled. Drag lots to change their order.', '', {
        timeOut: 5000
      });
    } else {
      this.toastr.info('Lot reordering disabled.', '', {
        timeOut: 3000
      });
    }
  }
  
  // Handle drop event for drag and drop
  onDrop(event: CdkDragDrop<LotDetails[]>): void {
    if (this.isDragEnabled) {
      // First make a copy of the array to maintain immutability
      const newLots = [...this.lots];
      
      // Move the item in the array
      moveItemInArray(newLots, event.previousIndex, event.currentIndex);
      
      // Renumber lot numbers to maintain order
      const reorderedLots = newLots.map((lot, index) => ({
        ...lot,
        lotNumber: index + 1
      }));
      
      // Emit the reordered lots to parent component
      this.lotsReordered.emit(reorderedLots);
      
      // Get the moved lot from the event data
      const movedLot = newLots[event.currentIndex];
      this.toastr.success(`Lot ${movedLot.lotNumber} moved to position ${event.currentIndex + 1}`);
    }
  }
  
  // Editing methods
  startEdit(lotNumber: number, field: string): void {
    if (!this.editMode[lotNumber]) {
      this.editMode[lotNumber] = { reservePrice: false, initialAskingPrice: false };
    }
    this.editMode[lotNumber][field as keyof typeof this.editMode[number]] = true;
  }
  
  saveEdit(lot: LotDetails, field: string, value: number): void {
    if (this.editMode[lot.lotNumber]) {
      this.editMode[lot.lotNumber][field as keyof typeof this.editMode[number]] = false;
      this.lotUpdated.emit({lotNumber: lot.lotNumber, field, value});
    }
  }
  
  cancelEdit(lotNumber: number, field: string): void {
    if (this.editMode[lotNumber]) {
      this.editMode[lotNumber][field as keyof typeof this.editMode[number]] = false;
    }
  }
  
  isEditing(lotNumber: number, field: string): boolean {
    return this.editMode[lotNumber]?.[field as keyof typeof this.editMode[number]] || false;
  }
  
  // Dialog methods - now handle keyboard events with same logic as click
  openViewersDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.lotService.getLotUserActivity(lot.lotNumber, 'viewer')
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewers => {
        this.viewers = viewers;
        this.isViewersDialogOpen = true;
      });
  }
  
  closeViewersDialog(): void {
    this.isViewersDialogOpen = false;
  }
  
  openWatchersDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.lotService.getLotUserActivity(lot.lotNumber, 'watcher')
      .pipe(takeUntil(this.destroy$))
      .subscribe(watchers => {
        this.watchers = watchers;
        this.isWatchersDialogOpen = true;
      });
  }
  
  closeWatchersDialog(): void {
    this.isWatchersDialogOpen = false;
  }
  
  openLeadsDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.lotService.getLotUserActivity(lot.lotNumber, 'lead')
      .pipe(takeUntil(this.destroy$))
      .subscribe(leads => {
        this.leads = leads;
        this.isLeadsDialogOpen = true;
      });
  }
  
  closeLeadsDialog(): void {
    this.isLeadsDialogOpen = false;
  }
  
  openOnlineDialog(lot: LotDetails): void {
    this.selectedLot = lot;
    this.lotService.getLotUserActivity(lot.lotNumber, 'online')
      .pipe(takeUntil(this.destroy$))
      .subscribe(onlineUsers => {
        this.onlineUsers = onlineUsers;
        this.isOnlineDialogOpen = true;
      });
  }
  
  closeOnlineDialog(): void {
    this.isOnlineDialogOpen = false;
  }
}