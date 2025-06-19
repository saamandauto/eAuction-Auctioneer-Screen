import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Observable, BehaviorSubject, combineLatest, map, takeUntil } from 'rxjs';
import { LotDetails } from '../../models/interfaces';
import { LotStatus } from '../../models/enums';
import { LotResultDialogComponent } from '../lot-result-dialog/lot-result-dialog.component';

// Interface for the combined view state
interface LotsListViewState {
  displayedLots: LotDetails[];
  emptyRows: number[];
  canExpand: boolean;
}

@Component({
  selector: 'app-lots-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LotResultDialogComponent],
  templateUrl: './lots-list.component.html',
  styleUrls: ['./lots-list.component.scss']
})
export class LotsListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() lots: LotDetails[] = [];
  @Input() currentLotStatus: LotStatus = LotStatus.PENDING;
  @Output() selectLot = new EventEmitter<LotDetails>();

  expanded = false;
  searchTerm = '';
  selectedLot: LotDetails | null = null;
  isResultDialogOpen = false;

  // Internal state subjects
  private filteredLotsSubject = new BehaviorSubject<LotDetails[]>([]);

  // Combined view state observable
  viewState$: Observable<LotsListViewState>;

  // Destroy subject for subscription management
  private destroy$ = new Subject<void>();

  constructor() {
    // Create combined view state observable
    this.viewState$ = combineLatest([
      this.filteredLotsSubject.asObservable()
    ]).pipe(
      map(([filteredLots]) => {
        const displayedLots = this.expanded ? filteredLots : filteredLots.slice(0, 10);
        const currentRows = displayedLots.length;
        const minRows = this.expanded ? 0 : 10;
        const emptyRows = currentRows < minRows ? Array(minRows - currentRows).fill(0) : [];
        
        return {
          displayedLots,
          emptyRows,
          canExpand: filteredLots.length > 10
        };
      }),
      takeUntil(this.destroy$)
    );
  }

  ngOnInit() {
    this.filterLots();
  }

  ngOnChanges() {
    this.filterLots();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filterLots() {
    if (!this.searchTerm.trim()) {
      this.filteredLotsSubject.next(this.lots);
      return;
    }

    const term = this.searchTerm.toLowerCase();
    const filtered = this.lots.filter(lot => 
      lot.lotNumber.toString().includes(term) ||
      lot.make.toLowerCase().includes(term) ||
      lot.model.toLowerCase().includes(term) ||
      (lot.status && lot.status.toLowerCase().includes(term))
    );
    
    this.filteredLotsSubject.next(filtered);
  }

  canSelectLot(lot: LotDetails): boolean {
    return this.currentLotStatus !== LotStatus.ACTIVE;
  }

  // Updated to handle keyboard events as well as clicks
  onSelectLot(lot: LotDetails) {
    if (lot.finalState || lot.status === LotStatus.SOLD || 
        lot.status === LotStatus.NO_SALE || lot.status === LotStatus.WITHDRAWN) {
      this.selectedLot = lot;
      this.isResultDialogOpen = true;
    } else if (this.canSelectLot(lot)) {
      this.selectLot.emit(lot);
    }
  }

  // Proper close handler for dialog using the new event emitter pattern
  closeResultDialog(): void {
    this.isResultDialogOpen = false;
    this.selectedLot = null;
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }
}