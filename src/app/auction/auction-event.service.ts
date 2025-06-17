import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuctionStateService } from './auction-state.service';
import { Bid, Dealer, LotDetails, Message } from '../models/interfaces';
import { LotStatus, HammerState } from '../models/enums';
import { AuctionLifecycleService } from '../services/auction-lifecycle.service';
import { LotManagementService } from '../services/lot-management.service';
import { BiddingOrchestrationService } from '../services/bidding-orchestration.service';
import { DialogService } from '../services/dialog.service';
import { MessagingService } from '../services/messaging.service';
import { BiddingService } from '../services/bidding.service';
import { VoiceService } from '../services/voice.service';

@Injectable({
  providedIn: 'root'
})
export class AuctionEventService {
  // Track the last time a bid was announced
  private lastBidAnnouncementTime = 0;
  private bidAnnouncementCooldown = 5000; // 5 seconds cooldown between bid announcements
  private hasCreditsError = false;
  
  constructor(
    private auctionState: AuctionStateService,
    private biddingService: BiddingService,
    private voiceService: VoiceService,
    private auctionLifecycleService: AuctionLifecycleService,
    private lotManagementService: LotManagementService,
    private biddingOrchestrationService: BiddingOrchestrationService,
    private dialogService: DialogService,
    private messagingService: MessagingService
  ) {
    this.biddingService.getBids().subscribe(bid => {
      this.onBidPlaced(bid);
    });
    
    this.voiceService.getHasCreditsError().subscribe(hasError => {
      this.hasCreditsError = hasError;
    });
    
    // Listen for changes to the simulated bidding setting
    this.auctionState.select('simulatedBiddingEnabled').subscribe(enabled => {
      this.handleSimulatedBiddingToggle(enabled);
    });
  }

  // Handle changes to the simulated bidding setting
  private handleSimulatedBiddingToggle(enabled: boolean) {
    // Tell the bidding service about the change
    this.biddingService.setEnabled(enabled);
    
    if (enabled && 
        this.auctionState.getValue('lotStatus') === LotStatus.ACTIVE && 
        this.auctionState.getValue('currentLot')) {
      
      this.biddingService.startSimulation(
        this.auctionState.getValue('dealers'),
        this.auctionState.getValue('currentHighestBid') || this.auctionState.getValue('startPrice'),
        this.auctionState.getValue('bidIncrement'),
        this.auctionState.getValue('currentLot')!.reservePrice,
        this.auctionState.getValue('askingPrice')
      );
    } else if (!enabled) {
      this.biddingService.stopSimulation();
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