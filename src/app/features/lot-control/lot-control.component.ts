import { Component, Input, Output, EventEmitter, ViewChild, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotControlsComponent } from '../../components/lot-controls/lot-controls.component';
import { LotStatus, HammerState } from '../../models/enums';
import { LotDetails, Bid } from '../../models/interfaces';
import { AuctionStateService } from '../../auction/auction-state.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-lot-control',
  standalone: true,
  imports: [
    CommonModule,
    LotControlsComponent
  ],
  templateUrl: './lot-control.component.html',
  styleUrls: ['./lot-control.component.scss']
})
export class LotControlComponent implements OnInit, OnDestroy {
  @ViewChild(LotControlsComponent) lotControlsComponent!: LotControlsComponent;
  
  @Input() lotStatus: LotStatus = LotStatus.PENDING;
  @Input() hammerState: HammerState = HammerState.ACCEPTING_BIDS;
  @Input() canControlLot = false;
  @Input() canUseHammer = false;
  @Input() hasBids = false;
  @Input() skipConfirmations = false;
  @Input() currentLot: LotDetails | null = null;
  @Input() currentHighestBid: number | null = null;
  @Input() highestBid: Bid | null = null;

  @Output() startLot = new EventEmitter<void>();
  @Output() moveLot = new EventEmitter<void>();
  @Output() noSale = new EventEmitter<void>();
  @Output() withdrawLot = new EventEmitter<void>();
  @Output() markAsSold = new EventEmitter<void>();
  @Output() progressHammerState = new EventEmitter<void>();

  private subscriptions: Subscription[] = [];

  // Inject dependencies
  private auctionState = inject(AuctionStateService);

  ngOnInit() {
    // Subscribe to bids changes to reset hammer sequence when new bids arrive
    this.subscriptions.push(
      this.auctionState.getBids().subscribe(() => {
        this.handleNewBid();
      })
    );

    // Subscribe to hammer state changes to reset hammer sequence when needed
    this.subscriptions.push(
      this.auctionState.getHammerState().subscribe(state => {
        // If hammer state was reset to ACCEPTING_BIDS, reset the sequence
        if (state === HammerState.ACCEPTING_BIDS) {
          this.resetHammerSequence();
        }
      })
    );
  }

  ngOnDestroy() {
    // Clean up all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Handle a new bid by resetting hammer sequence and canceling withdraw countdown
   */
  private handleNewBid(): void {
    // We need to wait for the ViewChild to be initialized, which happens after ngOnInit
    setTimeout(() => {
      if (this.lotControlsComponent) {
        this.lotControlsComponent.resetHammerSequence();
        this.lotControlsComponent.cancelWithdrawOnNewBid();
      }
    });
  }

  /**
   * Reset the hammer sequence in the child component
   */
  private resetHammerSequence(): void {
    setTimeout(() => {
      if (this.lotControlsComponent) {
        this.lotControlsComponent.resetHammerSequence();
      }
    });
  }

  onStartLot() {
    this.startLot.emit();
  }

  onMoveLot() {
    this.moveLot.emit();
  }

  onNoSale() {
    this.noSale.emit();
  }

  onWithdrawLot() {
    this.withdrawLot.emit();
  }

  onMarkAsSold() {
    this.markAsSold.emit();
  }

  onProgressHammerState() {
    this.progressHammerState.emit();
  }
}