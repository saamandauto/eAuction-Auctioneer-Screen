import { Injectable, inject } from '@angular/core';
import { AuctionStateService } from './auction-state.service';
import { Bid, Dealer, LotDetails } from '../models/interfaces';
import { LotStatus } from '../models/enums';
import { AuctionLifecycleService } from '../services/auction-lifecycle.service';
import { LotManagementService } from '../services/lot-management.service';
import { BiddingOrchestrationService } from '../services/bidding-orchestration.service';
import { DialogService } from '../services/dialog.service';
import { MessagingService } from '../services/messaging.service';
import { BiddingService } from '../services/bidding.service';
import { VoiceService } from '../services/voice.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AuctionEventService {
  private hasCreditsError = false;
  
  // Inject dependencies using inject() pattern
  private auctionState = inject(AuctionStateService);
  private biddingService = inject(BiddingService);
  private voiceService = inject(VoiceService);
  private toastr = inject(ToastrService);
  private auctionLifecycleService = inject(AuctionLifecycleService);
  private lotManagementService = inject(LotManagementService);
  private biddingOrchestrationService = inject(BiddingOrchestrationService);
  private dialogService = inject(DialogService);
  private messagingService = inject(MessagingService);
  
  constructor() {
    // Subscribe to bids from the bidding service
    this.biddingService.getBids().subscribe(bid => {
      console.log('Received simulated bid:', bid);
      this.onBidPlaced(bid);
    });
    
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });
    
    // Listen for changes to the simulated bidding setting
    this.auctionState.select('simulatedBiddingEnabled').subscribe(enabled => {
      console.log('Simulated bidding toggled:', enabled);
      this.handleSimulatedBiddingToggle(enabled);
    });

    // Listen for lot status changes to restart simulation when lot becomes active
    this.auctionState.select('lotStatus').subscribe(lotStatus => {
      console.log('Lot status changed to:', lotStatus);
      
      if (lotStatus === LotStatus.ACTIVE) {
        // Lot became active, restart simulation if enabled
        this.restartSimulationIfEnabled();
      } else if (lotStatus === LotStatus.PENDING || 
                 lotStatus === LotStatus.SOLD || 
                 lotStatus === LotStatus.NO_SALE || 
                 lotStatus === LotStatus.WITHDRAWN) {
        // Lot became inactive, stop simulation
        console.log('Stopping simulation because lot status is:', lotStatus);
        this.biddingService.stopSimulation();
      }
    });
  }

  // Handle changes to the simulated bidding setting
  private handleSimulatedBiddingToggle(enabled: boolean) {
    // Tell the bidding service about the change
    this.biddingService.setEnabled(enabled);
    
    if (enabled) {
      const currentLot = this.auctionState.getValue('currentLot');
      const lotStatus = this.auctionState.getValue('lotStatus');
      
      if (lotStatus === LotStatus.ACTIVE && currentLot) {
        console.log('Starting simulation immediately - lot is active');
        this.startSimulation();
      } else {
        // Provide feedback about why simulation isn't starting
        if (!currentLot) {
          this.toastr.info('Simulated bidding enabled. Please select a lot to begin simulation.');
        } else if (lotStatus !== LotStatus.ACTIVE) {
          this.toastr.info('Simulated bidding enabled. Please start the lot to begin simulation.');
        }
      }
    } else {
      console.log('Stopping simulation');
      this.biddingService.stopSimulation();
    }
  }

  // Helper method to start simulation with current state
  private startSimulation(): void {
    const currentLot = this.auctionState.getValue('currentLot');
    if (!currentLot) {
      console.warn('Cannot start simulation - no current lot');
      return;
    }

    const dealers = this.auctionState.getValue('dealers');
    const currentHighestBid = this.auctionState.getValue('currentHighestBid');
    const startPrice = this.auctionState.getValue('startPrice');
    const bidIncrement = this.auctionState.getValue('bidIncrement');
    const askingPrice = this.auctionState.getValue('askingPrice');

    console.log('Starting simulation with params:', {
      dealers: dealers.length,
      currentHighestBid,
      startPrice,
      bidIncrement,
      reservePrice: currentLot.reservePrice,
      askingPrice
    });

    this.biddingService.startSimulation(
      dealers,
      currentHighestBid || startPrice,
      bidIncrement,
      currentLot.reservePrice,
      askingPrice
    );

    this.toastr.success('Simulated bidding started for Lot ' + currentLot.lotNumber);
  }

  // Public method to restart simulation (called when lot starts)
  public restartSimulationIfEnabled(): void {
    const simulatedBiddingEnabled = this.auctionState.getValue('simulatedBiddingEnabled');
    if (simulatedBiddingEnabled) {
      console.log('Restarting simulation because lot became active');
      this.startSimulation();
    }
  }

  // Delegate to AuctionLifecycleService
  startAuction(): void {
    this.auctionLifecycleService.startAuction();
  }

  endAuction(): void {
    this.auctionLifecycleService.endAuction();
  }

  toggleView(): void {
    this.auctionLifecycleService.toggleView();
  }

  toggleSimulatedBidding(): void {
    this.auctionLifecycleService.toggleSimulatedBidding();
  }
  
  onLotUpdated(update: {lotNumber: number, field: string, value: number}): void {
    this.auctionLifecycleService.onLotUpdated(update);
  }

  // Delegate to DialogService
  openViewersDialog(): void {
    this.dialogService.openViewersDialog();
  }

  closeViewersDialog(): void {
    this.dialogService.closeViewersDialog();
  }

  openWatchersDialog(): void {
    this.dialogService.openWatchersDialog();
  }

  closeWatchersDialog(): void {
    this.dialogService.closeWatchersDialog();
  }

  openLeadsDialog(): void {
    this.dialogService.openLeadsDialog();
  }

  closeLeadsDialog(): void {
    this.dialogService.closeLeadsDialog();
  }

  openOnlineDialog(): void {
    this.dialogService.openOnlineDialog();
  }

  closeOnlineDialog(): void {
    this.dialogService.closeOnlineDialog();
  }

  // Delegate to LotManagementService
  startLot(): void {
    this.lotManagementService.startLot();
  }

  moveLot(): void {
    this.lotManagementService.moveLot();
  }

  noSale(): void {
    this.lotManagementService.noSale();
  }

  withdrawLot(): void {
    this.lotManagementService.withdrawLot();
  }

  markAsSold(): void {
    this.lotManagementService.markAsSold();
  }

  progressHammerState(): void {
    this.lotManagementService.progressHammerState();
  }

  // Delegate to LotManagementService
  getLotPerformance() {
    return this.lotManagementService.getLotPerformance();
  }
  
  // Delegate to BiddingOrchestrationService
  setAskingPrice(newPrice: number): void {
    this.biddingOrchestrationService.setAskingPrice(newPrice);
  }

  adjustBidIncrement(amount: number): void {
    this.biddingOrchestrationService.adjustBidIncrement(amount);
  }

  onBidPlaced(bid: Bid): void {
    this.biddingOrchestrationService.onBidPlaced(bid);
  }

  onAuctioneerBidCountChanged(): void {
    this.biddingOrchestrationService.onAuctioneerBidCountChanged();
  }

  // Delegate to LotManagementService
  selectLot(lot: LotDetails): void {
    this.lotManagementService.selectLot(lot);
  }
  
  // Delegate to MessagingService
  onDealerSelect(dealer: Dealer | null): void {
    this.messagingService.onDealerSelect(dealer);
  }

  onSendMessage(message: { text: string, isGlobal: boolean }): void {
    this.messagingService.onSendMessage(message);
  }
}